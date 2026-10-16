const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const seed = require('./runtime/seed.cjs');
const zip = require('./runtime/zip.cjs');
const ROOT = __dirname, DATA = process.env.PORTFOLIO_DATA || path.join(ROOT,'data');
fs.mkdirSync(path.join(DATA,'assets'),{recursive:true});
const store=path.join(DATA,'project.json');
let project=fs.existsSync(store)?JSON.parse(fs.readFileSync(store,'utf8')):seed();
const locks=new Map(), streams=new Set();
let queue=Promise.resolve();
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.mp4':'video/mp4'};
function persist(){const tmp=store+'.tmp';fs.writeFileSync(tmp,JSON.stringify(project));fs.renameSync(tmp,store);}
if(!fs.existsSync(store))persist();
function fail(status,message){const error=new Error(message);error.status=status;throw error;}
function body(req){return new Promise((resolve,reject)=>{let bytes=0,chunks=[];req.on('data',chunk=>{bytes+=chunk.length;if(bytes>180*1024*1024){reject(Object.assign(new Error('文件太大，请将完整项目控制在 180MB 以内。'),{status:413}));req.destroy();}else chunks.push(chunk);});req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}'));}catch{reject(Object.assign(new Error('无法读取数据格式。'),{status:400}));}});req.on('error',reject);});}
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
function snapshot(){return {...project,locks:Object.fromEntries([...locks].filter(([,lock])=>lock.expires>Date.now()))};}
function broadcast(){const event=`data: ${JSON.stringify(snapshot())}\n\n`;for(const res of streams)res.write(event);}
function changed(){project.revision++;persist();broadcast();}
function getPage(id){const page=project.pages.find(page=>page.id===id);if(!page)fail(404,'页面不存在。');return page;}
function authorize(id,client){const lock=locks.get(id);if(!lock||lock.expires<=Date.now()||lock.client!==client)fail(423,'此页面已由另一窗口接管，请重新取得编辑权。');lock.expires=Date.now()+15000;}
function checkId(id){return typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id);}
function checkName(name){return name&&typeof name.zh==='string'&&typeof name.en==='string'&&name.zh.trim().length>0&&name.zh.length<=200&&name.en.length<=200;}
function validatePage(page,assets){
  if(!checkId(page.id)||!checkName(page.name)||!Array.isArray(page.elements)||page.elements.length>3000)fail(400,'页面格式无效。');
  for(const device of ['desktop','mobile'])if(!Number.isFinite(page.height?.[device])||page.height[device]<200||page.height[device]>50000)fail(400,'画布高度无效。');
  const ids=new Set();
  if(page.role&&!['collection','project'].includes(page.role))fail(400,'页面类型无效。');
  if(page.parentId&&!checkId(page.parentId))fail(400,'所属分类无效。');
  if(page.collection){const c=page.collection;for(const device of ['desktop','mobile']){for(const key of ['start','filterY','columns','gap','cardHeight','margin'])if(!Number.isFinite(c[key]?.[device])||c[key][device]<0||c[key][device]>50000)fail(400,'作品网格设置无效。');if(c.columns[device]<1||c.columns[device]>8||!Number.isInteger(c.columns[device])||c.cardHeight[device]<50)fail(400,'作品网格尺寸无效。');}}
  for(const element of page.elements){
    if(!checkId(element.id)||ids.has(element.id)||!['image','video','text','shape'].includes(element.type))fail(400,'元素格式无效。');ids.add(element.id);
    if(['image','video'].includes(element.type)&&!assets.some(asset=>asset.id===element.assetId))fail(400,'素材引用不存在。');
    for(const device of ['desktop','mobile']){const t=element.layout?.[device];if(!t||['x','y','w','h','rotation'].some(key=>!Number.isFinite(t[key])||Math.abs(t[key])>100000)||t.w<4||t.h<4)fail(400,'元素布局无效。');}
    if(element.type==='text'&&(!element.text||typeof element.text.zh!=='string'||typeof element.text.en!=='string'||element.text.zh.length>50000||element.text.en.length>50000))fail(400,'文字格式无效。');
    if(element.style&&Object.values(element.style).some(v=>typeof v!=='string'&&typeof v!=='number'))fail(400,'样式格式无效。');
    if(!['none','hover','appear','cursor','draggable','collage','demo','gallery','lightbox','cursor-trail','design-trail'].includes(element.effect||'none'))fail(400,'互动效果无效。');
    if(['cursor-trail','design-trail'].includes(element.effect)&&(element.type!=='shape'||!Array.isArray(element.trailAssets)||element.trailAssets.length>100||element.trailAssets.some(id=>!assets.some(asset=>asset.id===id&&asset.mime.startsWith('image/')))))fail(400,'图片拖尾需使用色块区域与有效图片素材。');
    if(element.heroTitle!==undefined&&(typeof element.heroTitle!=='string'||element.heroTitle.length>80)||element.heroWords!==undefined&&(typeof element.heroWords!=='string'||element.heroWords.length>5000))fail(400,'首屏文字过长。');
    if(element.galleryAssets){
      const supported=a=>a.mime.startsWith('image/')||(element.effect==='demo'&&a.mime==='video/mp4');
      if(!Array.isArray(element.galleryAssets)||element.galleryAssets.length>100||element.galleryAssets.some(id=>!assets.some(a=>a.id===id&&supported(a))))fail(400,'轮播素材无效。');
    }
    if(element.collectionItem&&(!checkId(element.collectionItem)||!checkName(element.projectCategory)))fail(400,'项目分类无效。');
    if(element.link&&(!['page','anchor','action','url'].includes(element.link.kind)||typeof element.link.target!=='string'))fail(400,'链接无效。');
    if(element.link?.kind==='url'&&!/^https?:\/\//i.test(element.link.target))fail(400,'网址必须以 https:// 或 http:// 开头。');
  }
}
function validateSettings(settings){if(!checkName(settings?.name)||['email','wechatId','wechatQr'].some(key=>typeof settings[key]!=='string'||settings[key].length>300))fail(400,'个人资料格式无效。');}
function decodeFile(file){
  if(typeof file.name!=='string'||typeof file.data!=='string')fail(400,'素材格式无效。');
  const bytes=Buffer.from(file.data,'base64');if(!bytes.length||bytes.length>50*1024*1024)fail(400,'单个素材必须小于 50MB。');
  let mime,ext;
  if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){mime='image/png';ext='.png';}
  else if(bytes[0]===255&&bytes[1]===216){mime='image/jpeg';ext='.jpg';}
  else if(/^GIF8[79]a/.test(bytes.subarray(0,6).toString())){mime='image/gif';ext='.gif';}
  else if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP'){mime='image/webp';ext='.webp';}
  else if(bytes.subarray(4,8).toString()==='ftyp'){mime='video/mp4';ext='.mp4';}
  else if(/<svg[\s>]/i.test(bytes.toString('utf8').slice(0,1000))){const svg=bytes.toString('utf8');if(/<\s*(script|foreignObject|iframe|object|embed)|\bon\w+\s*=|(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/|javascript:|data:)|<!ENTITY|<!DOCTYPE/i.test(svg))fail(400,'SVG 包含不支持的脚本或外部内容，请导出为 PNG。');mime='image/svg+xml';ext='.svg';}
  else fail(400,'支持 PNG、JPG、WebP、SVG、GIF 和 MP4。');
  return {bytes,mime,ext};
}
function assetBytes(asset){return fs.readFileSync(asset.seed?path.join(ROOT,asset.url.replace(/^\//,'')):path.join(DATA,'assets',asset.file));}
function ensureProjectSize(additional=0){
  let bytes=Buffer.byteLength(JSON.stringify(project))+100+additional;
  for(const asset of project.assets){const file=asset.seed?path.join(ROOT,asset.url.replace(/^\//,'')):path.join(DATA,'assets',asset.file);bytes+=4*Math.ceil(fs.statSync(file).size/3)+12;}
  if(bytes>180*1024*1024)fail(413,'完整项目超过 180MB，请压缩图片或视频后再添加，以确保备份可以重新导入。');
}
function exported(){const copy=structuredClone(project);copy.assets=copy.assets.map(asset=>({...asset,data:assetBytes(asset).toString('base64')}));return {format:'folio-project',version:1,project:copy};}
function siteZip(){
  const copy=structuredClone(project);const files=[];
  copy.assets.forEach(asset=>{const extension=path.extname(asset.seed?asset.url:asset.file);const filename=`assets/${asset.id}${extension}`;files.push([filename,assetBytes(asset)]);asset.url=filename;delete asset.file;delete asset.seed;});
  copy.pages.forEach(page=>delete page.revision);delete copy.revision;delete copy.settingsRevision;
  const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portfolio</title><link rel="stylesheet" href="runtime/site.css"></head><body><div id="site"></div><script>window.portfolioProject=${JSON.stringify(copy).replace(/</g,'\\u003c')};</script><script src="runtime/render.js"></script><script src="runtime/cursor-trail.js"></script><script src="runtime/design-trail.js"></script><script src="runtime/exhibitions.js"></script><script src="runtime/site.js"></script></body></html>`;
  files.push(['index.html',html]);for(const name of ['site.css','render.js','cursor-trail.js','design-trail.js','exhibitions.js','site.js'])files.push([`runtime/${name}`,fs.readFileSync(path.join(ROOT,'runtime',name))]);files.push(['使用说明.txt','解压后打开 index.html 可浏览。公开发布时上传全部文件，并保持文件夹结构。网站无需运行编辑器。']);return zip(files);
}
async function api(req,res,url){
  const route=url.pathname;
  if(req.method==='GET'&&route==='/api/project')return json(res,200,snapshot());
  if(req.method==='GET'&&route==='/api/events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write(`data: ${JSON.stringify(snapshot())}\n\n`);streams.add(res);req.on('close',()=>streams.delete(res));return;}
  if(req.method==='GET'&&route==='/api/health')return json(res,200,{app:'folio-editor',version:1});
  if(req.method==='GET'&&route==='/api/export/project'){const data=JSON.stringify(exported());res.writeHead(200,{'Content-Type':'application/json','Content-Disposition':'attachment; filename="portfolio.folio.json"'});res.end(data);return;}
  if(req.method==='GET'&&route==='/api/export/site'){const bytes=siteZip();res.writeHead(200,{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="portfolio-website.zip"'});res.end(bytes);return;}
  const input=await body(req);
  if(req.method==='POST'&&route==='/api/claim'){
    getPage(input.pageId);if(!checkId(input.client))fail(400,'窗口标识无效。');const prior=locks.get(input.pageId);
    if(prior&&prior.expires>Date.now()&&prior.client!==input.client&&!input.takeover)return json(res,200,{owned:false,lock:prior});
    locks.set(input.pageId,{client:input.client,expires:Date.now()+15000});broadcast();return json(res,200,{owned:true});
  }
  if(req.method==='POST'&&route==='/api/heartbeat'){authorize(input.pageId,input.client);return json(res,200,{ok:true});}
  if(req.method==='POST'&&route==='/api/release'){if(locks.get(input.pageId)?.client===input.client){locks.delete(input.pageId);broadcast();}return json(res,200,{ok:true});}
  if(req.method==='PUT'&&route==='/api/page'){
    const current=getPage(input.page?.id);authorize(current.id,input.client);if(input.baseRevision!==current.revision)fail(409,'页面已有新版本，请重新载入后编辑。');
    validatePage(input.page,project.assets);const next={...input.page,revision:current.revision+1};ensureProjectSize(Buffer.byteLength(JSON.stringify(next))-Buffer.byteLength(JSON.stringify(current)));project.pages[project.pages.indexOf(current)]=next;changed();return json(res,200,{page:next,revision:project.revision});
  }
  if(req.method==='POST'&&route==='/api/pages'){
    if(project.pages.length>=50||!checkName(input.name))fail(400,'请输入页面名称（最多 50 个页面）。');
    const page={id:crypto.randomUUID(),name:input.name,revision:0,background:'#fff',height:{desktop:1800,mobile:1800},elements:[]};project.pages.push(page);changed();return json(res,200,{page});
  }
  if(req.method==='POST'&&route==='/api/assets'){
    const {bytes,mime,ext}=decodeFile(input);ensureProjectSize(4*Math.ceil(bytes.length/3)+2000);const id=crypto.randomUUID(),file=id+ext;fs.writeFileSync(path.join(DATA,'assets',file),bytes);
    const asset={id,name:input.name.slice(0,200),mime,file,url:`/media/${file}`};project.assets.push(asset);changed();return json(res,200,{asset});
  }
  if(req.method==='PUT'&&route==='/api/settings'){
    if(input.baseRevision!==project.settingsRevision)fail(409,'个人资料已被其他窗口修改，请重新打开资料设置。');validateSettings(input.settings);
    if(input.settings.wechatQr&&!project.assets.some(asset=>asset.id===input.settings.wechatQr&&asset.mime.startsWith('image/')))fail(400,'二维码素材不存在。');
    project.settings=input.settings;project.settingsRevision++;changed();return json(res,200,{settings:project.settings,settingsRevision:project.settingsRevision});
  }
  if(req.method==='POST'&&route==='/api/import'){
    if(input.baseRevision!==project.revision)fail(409,'项目已有更新，请重新预览导入。');
    const bundle=input.bundle;if(bundle?.format!=='folio-project'||bundle.version!==1)fail(400,'请选择编辑器导出的完整项目文件。');
    const next=bundle.project;if(next?.schema!==1||!Array.isArray(next.pages)||next.pages.length<1||next.pages.length>50||!Array.isArray(next.assets)||next.assets.length>1000)fail(400,'项目格式无效。');
    validateSettings(next.settings);const assetIds=new Set(),pageIds=new Set(),uploads=[];
    for(const asset of next.assets){if(!checkId(asset.id)||assetIds.has(asset.id))fail(400,'素材标识无效。');assetIds.add(asset.id);const parsed=decodeFile(asset);const file=crypto.randomUUID()+parsed.ext;uploads.push({file,bytes:parsed.bytes});asset.mime=parsed.mime;asset.file=file;asset.url=`/media/${file}`;delete asset.seed;delete asset.data;}
    if(next.settings.wechatQr&&!assetIds.has(next.settings.wechatQr))fail(400,'二维码素材缺失。');
    for(const page of next.pages){validatePage(page,next.assets);if(pageIds.has(page.id))fail(400,'页面标识重复。');pageIds.add(page.id);page.revision=0;}
    fs.copyFileSync(store,path.join(DATA,`backup-${Date.now()}.json`));for(const upload of uploads)fs.writeFileSync(path.join(DATA,'assets',upload.file),upload.bytes);
    next.revision=project.revision+1;next.settingsRevision=project.settingsRevision+1;project=next;locks.clear();persist();broadcast();return json(res,200,snapshot());
  }
  fail(404,'接口不存在。');
}
const server=http.createServer((req,res)=>{
  const origin=req.headers.origin;if(origin&&!['http://127.0.0.1:'+PORT,'http://localhost:'+PORT].includes(origin)){json(res,403,{error:'不允许来自其他网站的操作。'});return;}
  let url;try{url=new URL(req.url,'http://localhost');}catch{json(res,400,{error:'地址无效。'});return;}
  if(url.pathname.startsWith('/api/')){const run=()=>api(req,res,url).catch(error=>{if(!res.headersSent)json(res,error.status||500,{error:error.status?error.message:'保存失败，请检查本地磁盘空间后重试。'});console.error(error.message);});if(req.method==='GET')run();else{queue=queue.then(run,run);}return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  let relative;try{relative=decodeURIComponent(url.pathname);}catch{res.writeHead(400);res.end();return;}
  let file;if(relative==='/')file=path.join(ROOT,'index.html');else if(relative==='/editor'||relative==='/editor/')file=path.join(ROOT,'editor','index.html');else if(relative.startsWith('/media/')){const basename=relative.slice(7);if(!/^[a-f0-9-]+\.(png|jpg|webp|gif|svg|mp4)$/.test(basename)){res.writeHead(404);res.end();return;}file=path.join(DATA,'assets',basename);}else if(/^\/(runtime|editor|assets)\/[a-zA-Z0-9_./-]+$/.test(relative)){file=path.resolve(ROOT,'.'+relative);if(!file.startsWith(ROOT+path.sep)||relative.includes('..')||!types[path.extname(file)])file=null;}
  if(!file){res.writeHead(404);res.end('Not found');return;}
  fs.stat(file,(error,stat)=>{if(error||!stat.isFile()){res.writeHead(404);res.end('Not found');return;}
    const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
    const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);let start=0,end=stat.size-1,status=200;
    if(range){start=Number(range[1]);end=range[2]?Number(range[2]):end;if(start>end||end>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});res.end();return;}status=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;}
    headers['Content-Length']=end-start+1;res.writeHead(status,headers);if(req.method==='HEAD')res.end();else fs.createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);
  });
});
const PORT=Number(process.env.PORT||4174);server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`端口 ${PORT} 已被占用，请关闭旧服务或设置 PORT 后重试。`:error.message);process.exitCode=1;});server.listen(PORT,'127.0.0.1',()=>console.log(`作品集编辑器 http://127.0.0.1:${PORT}/editor/\n网站预览 http://127.0.0.1:${PORT}/`));
setInterval(()=>{let changed=false;for(const [id,lock]of locks)if(lock.expires<Date.now()){locks.delete(id);changed=true;}if(changed)broadcast();for(const res of streams)res.write(': heartbeat\n\n');},5000).unref();

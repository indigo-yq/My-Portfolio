// Template content is ordinary editable layers. Running this transform is explicit,
// never an automatic migration of a user's saved project.
module.exports=function redesign(project){
  const p=structuredClone(project),L=(x,y,w,h,rotation=0)=>({x,y,w,h,rotation,hidden:false});let serial=0;
  const el=(type,name,d,m,extra={})=>({id:'design-'+(++serial),type,name,locked:false,effect:'none',layout:{desktop:L(...d),mobile:L(...m)},style:{},...extra});
  const shape=(name,fill,d,m,extra={})=>el('shape',name,d,m,{style:{fill,radius:0},...extra});
  const text=(zh,en,d,m,size=24,color='#111',extra={})=>el('text',zh,d,m,{text:{zh,en},style:{fontFamily:'Arial',fontSize:size,mobileFontSize:Math.min(size,24),color,lineHeight:1.15,...extra}});
  const img=(assetId,name,d,m,extra={})=>el('image',name,d,m,{assetId,style:{fit:'cover',radius:0},...extra});
  const defs=[
    {titles:[['形与色','Form & Colour'],['城市节奏','City Rhythm'],['字形游乐场','Type Playground'],['植物日记','Botanical Notes'],['夜间频率','Night Frequency'],['色彩实验','Colour Studies'],['日常切片','Everyday Fragments'],['流动的秩序','Fluid Order']],tags:[['海报','Poster'],['插画','Illustration'],['字体实验','Typography']],prefix:'graphic'},
    {titles:[['慢慢岛','Slow Island'],['小小宇宙','Little Cosmos'],['游园记','Garden Friends'],['纸上伙伴','Paper Pals']],tags:[['角色设计','Character'],['文创衍生','Merchandise']],prefix:'ip'},
    {titles:[['山间来信','Mountain Letters'],['日常补给','Daily Supply'],['晨间咖啡','Morning Coffee'],['风物集','Local Stories']],tags:[['食品饮品','Food & Drink'],['生活礼盒','Lifestyle']],prefix:'packaging'},
    {titles:[['折点工作室','Fold Studio'],['COMMON 日常','Common'],['有间花店','Flora Room'],['回声文化','Echo Culture']],tags:[['品牌识别','Identity'],['视觉延展','Applications']],prefix:'identity'},
    {titles:[['留白之间','Between Spaces'],['纸的旅行','Paper Journey'],['城市索引','City Index'],['时间的形状','Shapes of Time']],tags:[['书籍设计','Books'],['杂志画册','Editorial']],prefix:'editorial'}
  ];
  const assets=[];
  for(const def of defs)for(let i=0;i<def.titles.length;i++)for(let variant=0;variant<2;variant++){
    const id=`sample-${def.prefix}-${i+1}-${variant}`;assets.push({id,name:`${def.titles[i][0]} · ${variant?'延展':'封面'}示例`,mime:'image/svg+xml',url:`/assets/examples/${id}.svg`,seed:true});
  }
  for(const id of ['graphic-wall-1','graphic-wall-2','portrait-placeholder','about-me-lettering'])assets.push({id,name:id==='portrait-placeholder'?'个人肖像 · 待替换':id==='about-me-lettering'?'ME 手写标题':'作品墙 · 示例',mime:'image/svg+xml',url:`/assets/examples/${id}.svg`,seed:true});
  for(const asset of assets)if(!p.assets.some(a=>a.id===asset.id))p.assets.push(asset);
  const home=p.pages[0],hero=home.elements.find(e=>e.id==='hero-cursor-trail');
  const oldHero=home.elements.filter(e=>e.layout.desktop.y<1000).map(e=>e.id);
  home.elements=home.elements.filter(e=>!oldHero.includes(e.id));
  const stage=shape('首屏 · DESIGN 互动','#000000',[0,0,1440,1000],[0,0,390,580],{id:'hero-design-trail',effect:'design-trail',trailAssets:hero?.trailAssets||['form-study','pack-study','type-study','book-study','pack-detail'],heroTitle:'DESIGN',heroWords:''});
  home.elements.unshift(stage);
  const mainDemo=home.elements.find(e=>e.name==='作品演示'&&e.effect==='demo');
  if(mainDemo){mainDemo.galleryAssets=['book-detail','form-study','type-study','book-study','pack-study','pack-detail'];mainDemo.style.slideDuration=3000;}
  const aboutIds=new Set(home.elements.filter(e=>e.layout.desktop.y>=4680&&e.layout.desktop.y<5400).map(e=>e.id));
  home.elements=home.elements.filter(e=>!aboutIds.has(e.id));
  // More room for the reference's three columns, with an independent stacked phone layout.
  for(const e of home.elements){if(e.layout.desktop.y>=5400)e.layout.desktop.y+=200;if(e.layout.mobile.y>=6300)e.layout.mobile.y+=520;}
  home.height.desktop+=200;home.height.mobile+=520;
  const about=[];
  about.push(shape('关于我 · 白底','#ffffff',[0,4686,1440,850],[0,5410,390,1390]));
  const me=img('about-me-lettering','ME 手写标题',[66,4720,345,160],[21,5440,180,95],{style:{fit:'contain',radius:0}});me.anchor='about';about.push(me);
  function tag(zh,en,d,m){about.push(shape(zh+' 标签边框','#ffffff',d,m,{style:{fill:'#fff',border:'#777',borderWidth:1,radius:0}}));about.push(text(zh,en,[d[0]+8,d[1]+8,d[2]-16,d[3]-16],[m[0]+6,m[1]+7,m[2]-12,m[3]-14],14,'#111',{mobileFontSize:12}));}
  tag('视觉设计师','GRAPHIC DESIGNER',[70,4900,164,35],[21,5550,146,32]);tag('图形与品牌','GRAPHIC & BRAND',[70,4943,154,35],[173,5550,173,32]);tag('所在地 · 待填写','LOCATION · TO ADD',[232,4943,172,35],[21,5588,165,32]);tag('联系方式 · 待填写','CONTACT · TO ADD',[70,4986,245,35],[192,5588,177,32]);
  about.push(text('我在图形、文字与物件之间探索，关注视觉语言如何让日常产生新的联结。\n\n这是一段可替换的简介示例。你可以在这里介绍自己的创作方向、工作方式和感兴趣的事物。','I explore the relationships between images, typography and objects, and how visual language creates new connections in everyday life.\n\nThis is a sample introduction. Replace it with your practice, interests and approach.',[70,5050,325,360],[21,5650,348,220],21,'#111',{mobileFontSize:17,lineHeight:1.35}));
  about.push(img('portrait-placeholder','个人肖像 · 点击替换',[424,4720,515,720],[62,5890,280,390],{style:{fit:'contain',radius:0}}));
  about.push(shape('姓名贴纸','#d50058',[406,5195,250,150,-6],[28,6172,170,110,-6]));
  about.push(text('HELLO!\nmy name is','HELLO!\nmy name is',[425,5211,208,67,-6],[42,6184,142,48,-6],28,'#fff',{weight:700,align:'center',mobileFontSize:20}));
  const signature=text('你的名字','YOUR NAME',[424,5290,218,48,-6],[40,6241,150,35,-6],30,'#fff',{weight:700,mobileFontSize:22});signature.profileText='name';about.push(signature);
  for(const [i,title,en,body,bodyEn]of [[0,'教育经历','EDUCATION','院校 / 专业 · 待填写\n学习时间 · 待填写','School / Major · To add\nDates · To add'],[1,'语言','LANGUAGES','语言及熟练程度 · 待填写','Languages and proficiency · To add']]){
    about.push(text(en,en,[990,4792+i*170,385,45],[21,6320+i*140,348,35],35,'#111',{weight:700,mobileFontSize:27}));
    about.push(text(body,bodyEn,[990,4850+i*170,365,85],[21,6367+i*140,348,70],19,'#111',{mobileFontSize:17,lineHeight:1.3}));
  }
  about.push(text('SKILLS','SKILLS',[990,5132,385,45],[21,6600,348,35],35,'#111',{weight:700,mobileFontSize:27}));
  ['PHOTOSHOP','ILLUSTRATOR','BRANDING','PACKAGING','TYPOGRAPHY','技能 · 可替换'].forEach((s,i)=>tag(s,s,[990+(i%2)*193,5196+Math.floor(i/2)*45,185,35],[21+(i%2)*179,6650+Math.floor(i/2)*40,170,32]));
  const insert=home.elements.findIndex(e=>e.layout.desktop.y>=5600);home.elements.splice(insert<0?home.elements.length:insert,0,...about);
  const details=[];
  defs.forEach((def,ci)=>{
    const page=p.pages.find(page=>page.id===`category-${ci+1}`);if(!page)return;
    page.role='collection';page.background='#000000';page.collection={start:{desktop:700,mobile:490},columns:{desktop:4,mobile:2},gap:{desktop:60,mobile:22},cardHeight:{desktop:510,mobile:310},margin:{desktop:30,mobile:20},filters:def.tags.map(([zh,en])=>({zh,en}))};page.elements=[];
    page.height={desktop:ci===0?1920:1390,mobile:ci===0?1930:1310};
    if(ci===0){
      page.elements.push(img('graphic-wall-1','顶部作品墙轮播',[0,0,1440,510],[0,0,390,320],{effect:'gallery',galleryAssets:['graphic-wall-1','graphic-wall-2']}));
      const button=shape('查看作品按钮','#00c7ac',[625,264,190,50],[112,160,166,46],{link:{kind:'action',target:'view-collection'}});page.elements.push(button);
      page.elements.push(text('查看作品','VIEW EDITIONS',[625,280,190,28],[112,174,166,25],17,'#fff',{weight:700,align:'center',mobileFontSize:15}));page.elements.at(-1).link=button.link;
    }else{
      page.elements.push(text(page.name.zh,page.name.en,[30,145,1250,90],[20,110,350,70],76,'#fff',{weight:700,mobileFontSize:38}));page.elements.at(-1).pageName=page.id;
      page.elements.push(text('精选项目 / 图形与物件的更多可能','SELECTED PROJECTS / MORE POSSIBILITIES',[34,270,1100,40],[21,220,348,45],17,'#aaa',{mobileFontSize:14}));
      const featured=img(`sample-${def.prefix}-1-1`,'分类精选横幅',[900,80,510,420],[20,280,350,145],{effect:'hover',style:{fit:'cover',radius:0}});page.elements.push(featured);
      page.collection.start.desktop=700;
    }
    page.collection.start.desktop=ci===0?606:700;page.collection.start.mobile=ci===0?490:530;
    page.collection.filterY={desktop:ci===0?537:590,mobile:ci===0?366:452};
    def.titles.forEach(([zh,en],i)=>{
      const projectId=`project-${ci+1}-${i+1}`,group=projectId,tag=def.tags[i%def.tags.length];
      const x=30+(i%4)*360,y=page.collection.start.desktop+Math.floor(i/4)*510,mx=20+(i%2)*186,my=page.collection.start.mobile+Math.floor(i/2)*310;
      const common={collectionItem:group,projectCategory:{zh:tag[0],en:tag[1]},link:{kind:'page',target:projectId}};
      page.elements.push(img(`sample-${def.prefix}-${i+1}-0`,zh+' · 封面',[x,y,300,420],[mx,my,164,230],{...common,effect:'hover'}));
      page.elements.push(text(zh,en,[x,y+434,300,30],[mx,my+243,164,27],18,'#fff',{mobileFontSize:14}));Object.assign(page.elements.at(-1),common,{pageName:projectId});
      page.elements.push(text(tag[0],tag[1],[x,y+470,300,24],[mx,my+275,164,21],12,'#929292',{mobileFontSize:11}));Object.assign(page.elements.at(-1),common);
      const detail={id:projectId,role:'project',parentId:page.id,name:{zh,en},revision:0,background:'#f6f5f1',height:{desktop:2840,mobile:2690},elements:[]},e=detail.elements;
      e.push(text('← '+page.name.zh,'← '+page.name.en,[40,100,900,34],[20,88,348,45],17,'#555',{mobileFontSize:14}));e.at(-1).link={kind:'page',target:page.id};
      e.push(img(`sample-${def.prefix}-${i+1}-0`,zh+' · 主视觉',[40,190,760,980],[20,155,350,490],{effect:'lightbox',style:{fit:'contain',radius:0}}));
      e.push(text(zh,en,[865,200,520,180],[20,680,350,110],66,'#111',{weight:700,mobileFontSize:40}));e.at(-1).pageName=projectId;
      e.push(text(tag[0]+' / 2026',tag[1]+' / 2026',[870,380,490,40],[21,810,348,35],19,'#777',{mobileFontSize:16}));
      e.push(text('项目概念','PROJECT CONCEPT',[870,490,490,40],[21,890,348,35],22,'#111',{weight:700,mobileFontSize:21}));
      e.push(text(`「${zh}」是一组围绕${tag[0]}展开的概念练习。通过图形、色彩和版式建立统一的视觉语言，再延展到不同的媒介与使用场景。\n\n当前展示为示例项目，图片与文字均可替换。`,`${en} is a concept study in ${tag[1].toLowerCase()}. A coherent language of form, colour and typography extends across media and applications.\n\nThis is a sample project. Replace its images and text with your own work.`,[870,550,480,310],[21,942,348,245],22,'#333',{mobileFontSize:17,lineHeight:1.4}));
      e.push(text('视觉延展 ↓','VISUAL APPLICATIONS ↓',[40,1280,1300,60],[21,1250,348,50],35,'#111',{mobileFontSize:27}));
      e.push(img(`sample-${def.prefix}-${i+1}-1`,zh+' · 延展 01',[40,1390,1360,900],[20,1330,350,700],{effect:'lightbox',style:{fit:'contain',radius:0}}));
      e.push(text('从主视觉到细节','FROM THE KEY VISUAL TO THE DETAILS',[40,2370,850,60],[21,2080,348,65],32,'#111',{mobileFontSize:24}));
      e.push(text('用这一段说明设计过程、材料、尺寸或应用方式。后续还可以从素材库继续添加图片和文字，扩展整个项目。','Add your process, materials, dimensions and applications here. Continue the story by adding more images and text from the shared library.',[40,2460,840,140],[21,2170,348,180],23,'#555',{mobileFontSize:18,lineHeight:1.4}));
      e.push(text('下一个项目 ↗','NEXT PROJECT ↗',[1050,2650,350,50],[21,2510,348,60],24,'#111',{align:'right',mobileFontSize:22}));e.at(-1).link={kind:'page',target:`project-${ci+1}-${(i+1)%def.titles.length+1}`};details.push(detail);
    });
  });
  p.pages=[...p.pages.filter(page=>page.role!=='project'),...details];p.templateVersion=2;return p;
};

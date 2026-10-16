const names = [
  ['平面插画设计', 'Graphic & Illustration'], ['IP 文创设计', 'IP & Creative Goods'],
  ['包装设计', 'Packaging'], ['Logo / VI 设计', 'Logo & Visual Identity'], ['装帧设计', 'Book & Editorial']
];
module.exports = function seed() {
  let serial = 0;
  const layout = (x,y,w,h,rotation=0) => ({x,y,w,h,rotation,hidden:false});
  const element = (type, name, desktop, mobile, extra={}) => ({id:`seed-${++serial}`,type,name,locked:false,layout:{desktop:layout(...desktop),mobile:layout(...mobile)},style:{},effect:'none',...extra});
  const shape = (name, color, d, m, radius=0) => element('shape',name,d,m,{style:{fill:color,radius}});
  const text = (zh,en,d,m,size=32,color='#111',extra={}) => element('text',zh,d,m,{text:{zh,en},style:{fontSize:size,mobileFontSize:Math.min(size,32),color,fontFamily:'Arial',weight:400,lineHeight:1.15,...extra}});
  const image = (assetId,name,d,m,effect='hover') => element('image',name,d,m,{assetId,style:{fit:'cover',radius:5},effect});
  const assets = ['type-study','form-study','book-study','book-detail','pack-study','pack-detail'].map(id=>({id,name:`${id} · 占位图`,mime:'image/svg+xml',url:`/assets/${id}.svg`,seed:true}));
  const categories = names.map(([zh,en],i)=>({id:`category-${i+1}`,name:{zh,en},revision:0,background:'#fff',height:{desktop:2500,mobile:2300},elements:[]}));
  const home={id:'home',name:{zh:'首页',en:'Home'},revision:0,background:'#fff',height:{desktop:6860,mobile:8300},elements:[]};
  const e=home.elements;
  // Reference geometry: full-viewport collage, white overlay card and full-width orange CTA.
  e.push(image('form-study','首屏拼贴 1',[0,0,480,1000],[0,0,195,844],'collage'));
  e.push(image('pack-study','首屏拼贴 2',[480,0,960,402],[195,0,195,422],'collage'));
  e.push(image('type-study','首屏拼贴 3',[480,402,560,405],[0,422,195,422],'collage'));
  e.push(image('book-study','首屏拼贴 4',[1040,402,400,598],[195,422,195,422],'collage'));
  e.push(image('pack-detail','首屏拼贴 5',[480,807,560,193],[0,700,195,144],'collage'));
  e.push(shape('首屏介绍卡','#fff',[418,328,620,345],[24,253,342,330],12));
  e.push(text('让想法，在这里成形。','Ideas, made visible.',[442,350,572,51],[46,277,298,69],40));
  e.push(text('图像、文字与物件之间，\n一些关于设计的探索。','Exploring visual possibilities\nbetween images, type and objects.',[442,404,572,113],[46,350,298,120],40,'#999',{mobileFontSize:27}));
  e.push(shape('浏览作品按钮','#ff5500',[442,564,572,83],[46,492,298,64],50));
  e.push(text('浏览我的作品','Explore my work',[442,564,572,83],[46,492,298,64],23,'#fff',{align:'center',mobileFontSize:18}));
  e[e.length-1].link={kind:'anchor',target:'work-index'};
  e[e.length-2].link={kind:'anchor',target:'work-index'};
  e.push(shape('可拖动蓝色标签','#003fff',[1090,113,278,130,-3],[208,121,159,84,-4],12));
  e[e.length-1].effect='draggable';e.at(-1).dragGroup='hero-badge';
  e.push(text('视觉探索\nVISUAL EXPLORATIONS','Visual explorations\nSELECTED WORK',[1108,146,242,65,-3],[220,140,135,40,-4],21,'#fff',{align:'center',mobileFontSize:13}));
  e[e.length-1].effect='draggable';e.at(-1).dragGroup='hero-badge';
  e.push(text('作品的五种表达','Five forms of expression',[56,1110,1200,70],[24,923,342,82],54,'#111',{mobileFontSize:35}));
  e[e.length-1].anchor='work-index';
  const covers=['form-study','type-study','pack-study','book-detail','book-study'];
  names.forEach(([zh,en],i)=>{
    const x=56+(i%3)*454,y=1230+Math.floor(i/3)*358;
    const mx=21+(i%2)*179,my=699+Math.floor(i/2)*180;
    const card=image(covers[i],zh,[x,y,420,254],[mx,my,169,103],'hover');card.link={kind:'page',target:categories[i].id};e.push(card);
    const label=text(zh,en,[x,y+269,420,35],[mx,my+113,169,55],18,'#111',{mobileFontSize:14});label.link=card.link;label.pageName=categories[i].id;e.push(label);
  });
  e.push(shape('作品演示黑底','#000',[0,1950,1440,950],[0,2550,390,615]));
  e.push(text('从一个想法，到完整表达。\n在细节中，看见设计。','From an idea to a complete expression.\nDesign lives in the details.',[250,2020,940,120],[24,2595,342,98],38,'#fff',{align:'center',mobileFontSize:24}));
  e.push(image('book-detail','作品演示',[202,2190,1036,530],[24,2735,342,265],'demo'));
  e.push(text('播放 / 暂停','Play / Pause',[560,2745,320,40],[80,3030,230,37],15,'#fff',{align:'center',mobileFontSize:13}));e[e.length-1].link={kind:'action',target:'toggle-demo'};
  e.push(text('一些细节，值得靠近看。','A closer look at the details.',[56,3030,1280,78],[24,3240,342,90],54,'#111',{mobileFontSize:34}));
  const tiles=[
    [56,3185,439,218,24,3370,342,265,'#ff5500','插画的温度','Illustration','form-study','hover'],
    [501,3185,661,442,24,3650,342,270,'#111','动态的想象','In motion','type-study','collage'],
    [1167,3185,217,218,24,3935,342,216,'#e5e5e5','从纸到物','Paper to object','book-study','hover'],
    [56,3409,217,218,24,4166,342,270,'#004cff','一点灵感','A spark','pack-study','cursor'],
    [279,3409,216,218,24,4451,342,270,'#e5e5e5','材质与触感','Materials','book-study','hover'],
    [1167,3409,217,218,24,4736,342,250,'#004cff','形式与秩序','Form & order','book-detail','hover'],
    [56,3633,439,663,24,5001,342,270,'#ff5500','文字的表情','The voice of type','type-study','hover'],
    [501,3633,438,218,24,5286,342,265,'#e5e5e5','移动一下，换个视角','A new perspective','pack-study','draggable'],
    [945,3633,439,442,24,5566,342,265,'#111','完整的品牌表达','A complete identity','pack-detail','hover'],
    [501,3857,438,218,24,5846,342,265,'#d0f756','图形的延展','Beyond the mark','form-study','cursor'],
    [501,4081,216,218,24,6126,342,265,'#111','持续探索','Keep exploring','book-study','appear'],
    [723,4081,661,442,24,6406,342,265,'#333','从过程到作品','Process to project','book-detail','demo'],
    [56,4302,217,221,24,6686,342,265,'#e5e5e5','纸面实验','On paper','type-study','hover'],
    [279,4302,438,221,24,6966,342,265,'#e5e5e5','物件的可能性','Object studies','pack-detail','collage']
  ];
  tiles.forEach(([x,y,w,h,mx,my,mw,mh,color,zh,en,asset,effect])=>{
    e.push(shape(zh+' 背景',color,[x,y,w,h],[mx,my,mw,mh],10));
    e.push(image(asset,zh,[x+16,y+72,w-32,h-88],[mx+16,my+58,mw-32,mh-74],effect));
    e.push(text(zh,en,[x+17,y+17,w-34,48],[mx+17,my+16,mw-34,32],w<250?22:28,['#111','#333','#ff5500','#004cff'].includes(color)?'#fff':'#111',{mobileFontSize:22}));
  });
  e.push(shape('关于我内容底板','#e5e5e5',[56,4686,1000,650],[24,7360,342,520],12));
  e.push(shape('关于我说明底板','#000',[1056,4686,328,650],[24,7885,342,285],12));
  e.push(text('作品之外，关于我。','Behind the work.',[88,4716,940,65],[42,7384,306,65],38,'#111',{mobileFontSize:30}));e[e.length-1].anchor='about';
  e.push(text('你好，我是你的名字。','Hello, I’m Your Name.',[88,4800,940,65],[42,7468,306,65],32,'#111',{mobileFontSize:23}));
  e.at(-1).profileText='greeting';
  e.push(text('视觉设计师。\n在图形、品牌与物件之间探索。\n\n这里将补充你的真实简介与经历。','Visual designer.\nExploring images, brands and objects.\n\nYour introduction and experience go here.',[1083,4716,274,530],[42,7910,306,235],24,'#999',{mobileFontSize:20}));
  e.push(image('form-study','关于我图像',[88,4900,936,406],[42,7560,306,285],'hover'));
  e.push(text('下一个想法，从一次交流开始。','The next idea starts with a conversation.',[56,5480,1328,95],[24,8270,342,135],54,'#111',{mobileFontSize:36}));e[e.length-1].anchor='contact';
  e.push(shape('微信联系按钮','#ff5500',[25,5630,1390,296],[24,8460,342,160],160));e[e.length-1].link={kind:'action',target:'contact'};
  e.push(text('微信联系 ↗','Say hello ↗',[25,5630,1390,296],[24,8460,342,160],54,'#fff',{align:'center',mobileFontSize:30}));e[e.length-1].link={kind:'action',target:'contact'};
  e.push(text('图形 · 品牌 · 物件 · 持续探索','Images · Brands · Objects · Ongoing exploration',[56,6050,1328,55],[24,8700,342,75],24,'#888',{align:'center',mobileFontSize:20}));
  e.push(shape('黑色页尾','#000',[0,6250,1440,610],[0,8850,390,1250]));
  const footer=[['作品','Work'],['关于','About'],['联系','Contact'],['语言','Language'],['作品集','Portfolio']];
  footer.forEach(([zh,en],i)=>{const x=56+i*273,my=8900+i*196;
    e.push(text(zh,en,[x,6315,220,42],[24,my,342,35],18,'#fff',{mobileFontSize:18}));
    const label=text(i===0?'浏览全部作品':i===1?'设计与探索':i===2?'微信联系 ↗':i===3?'中文 / EN':'持续更新',i===0?'Explore the work':i===1?'Design & exploration':i===2?'Say hello ↗':i===3?'中文 / English':'Always evolving',[x,6370,220,80],[24,my+48,342,60],17,'#888',{mobileFontSize:16});label.link={kind:[2,3].includes(i)?'action':'anchor',target:i===0||i===4?'work-index':i===2?'contact':i===3?'language':'about'};e.push(label);
    if(i===2){e.push(text('邮箱联系 ↗','Email ↗',[x,6460,220,40],[24,my+115,342,38],17,'#888',{mobileFontSize:16}));e[e.length-1].link={kind:'action',target:'email'};}
  });
  e.push(text('© 2026 你的名字 · 当前为占位内容','© 2026 Your Name · Placeholder content',[56,6760,1000,40],[24,9990,342,40],13,'#888',{mobileFontSize:11}));
  e.at(-1).profileText='copyright';
  categories.forEach((page,i)=>{
    const cover=covers[i];page.elements.push(text(names[i][0],names[i][1],[56,155,1300,110],[24,115,342,110],72,'#111',{mobileFontSize:38}));page.elements.at(-1).pageName=page.id;
    page.elements.push(text('精选作品 · 图片与说明待补充','Selected work · Content to be added',[56,285,900,45],[24,255,342,40],18,'#999',{mobileFontSize:14}));
    page.elements.push(image(cover,'作品封面',[56,390,1328,850],[24,350,342,430],'hover'));
    page.elements.push(text('项目名称 / 临时示意','Project title / Placeholder',[56,1280,1000,80],[24,830,342,80],40,'#111',{mobileFontSize:28}));
    page.elements.push(text('在这里编辑作品背景、设计思路和你的职责。','Add the project context, design idea and your role here.',[56,1380,1100,80],[24,940,342,105],24,'#888',{mobileFontSize:20}));
    page.elements.push(image(i===2?'pack-detail':i===4?'book-detail':cover,'项目细节',[56,1510,1328,700],[24,1100,342,430],'appear'));
    page.elements.push(text('联系我 ↗','Get in touch ↗',[56,2340,600,70],[24,2070,342,70],36,'#ff5500',{mobileFontSize:28}));page.elements.at(-1).link={kind:'action',target:'contact'};
  });
  // Mobile reference uses two-column category cards, a compact hero and a separate menu.
  const mobilePoses={
    '首屏拼贴 1':[0,0,190,580],'首屏拼贴 2':[190,0,200,205],
    '首屏拼贴 3':[0,205,275,200],'首屏拼贴 4':[275,205,115,375],'首屏拼贴 5':[0,405,275,175],
    '首屏介绍卡':[0,403,390,253],'让想法，在这里成形。':[21,421,348,51],
    '图像、文字与物件之间，\n一些关于设计的探索。':[21,476,348,100],
    '浏览作品按钮':[21,584,348,62],'浏览我的作品':[21,584,348,62],
    '可拖动蓝色标签':[41,100,308,90,-4],'视觉探索\nVISUAL EXPLORATIONS':[59,122,272,51,-4],
    '作品的五种表达':[21,660,348,39],
    '作品演示黑底':[0,1210,390,435],
    '从一个想法，到完整表达。\n在细节中，看见设计。':[21,1240,348,75],
    '作品演示':[21,1340,348,220],'播放 / 暂停':[80,1590,230,35],
    '一些细节，值得靠近看。':[21,1710,348,65],
    '关于我内容底板':[5,5410,380,500],'关于我说明底板':[5,5916,380,285],
    '作品之外，关于我。':[21,5440,348,65],'你好，我是你的名字。':[21,5520,348,65],
    '关于我图像':[21,5595,348,285],
    '视觉设计师。\n在图形、品牌与物件之间探索。\n\n这里将补充你的真实简介与经历。':[21,5940,348,235],
    '下一个想法，从一次交流开始。':[21,6340,348,140],
    '微信联系按钮':[6,6530,378,160],'微信联系 ↗':[6,6530,378,160],
    '图形 · 品牌 · 物件 · 持续探索':[21,6780,348,80],
    '黑色页尾':[0,6960,390,1340],
    '© 2026 你的名字 · 当前为占位内容':[21,8170,348,40]
  };
  for(const item of e)if(mobilePoses[item.name]&&!(item.layout.desktop.y>=6315&&item.layout.desktop.y<6600))item.layout.mobile=layout(...mobilePoses[item.name]);
  e.find(item=>item.name==='让想法，在这里成形。').style.mobileFontSize=25;
  e.find(item=>item.name==='图像、文字与物件之间，\n一些关于设计的探索。').style.mobileFontSize=23;
  e.find(item=>item.name==='作品的五种表达').style.mobileFontSize=25;
  const tileMobile=[[5,1784,380,190],[5,2174,380,380],[5,2560,380,190],[5,1978,190,190],[199,1978,187,190],[5,2756,190,190],[5,3338,380,720],[199,2756,187,190],[5,2952,380,380],[5,4570,380,240],[5,4816,187,240],[5,4064,380,500],[199,4816,187,240],[5,5062,380,240]];
  tiles.forEach((tile,i)=>{const [mx,my,mw,mh]=tileMobile[i],title=tile[9];
    for(const item of e.filter(item=>item.name===title||item.name===title+' 背景')){
      item.layout.mobile=item.type==='shape'?layout(mx,my,mw,mh):item.type==='text'?layout(mx+15,my+14,mw-30,42):layout(mx+15,my+64,mw-30,mh-79);
      if(item.type==='text')item.style.mobileFontSize=mw<200?17:24;
    }
  });
  footer.forEach(([title],i)=>{
    const items=e.filter(item=>item.layout.desktop.y>=6315&&item.layout.desktop.y<6600&&item.layout.desktop.x===56+i*273);
    for(const item of items)item.layout.mobile.y=7010+i*196+(item.layout.desktop.y-6315);
  });
  const sourceIds=new Set(e.filter(item=>/^首屏拼贴 [1-5]$/.test(item.name)).map(item=>item.id));
  const trail={id:'hero-cursor-trail',type:'shape',name:'首屏 · 图片拖尾',locked:false,effect:'cursor-trail',style:{fill:'#151515',radius:0},trailAssets:['form-study','pack-study','type-study','book-study','pack-detail'],layout:{desktop:layout(0,0,1440,1000),mobile:layout(0,0,390,580)}};
  home.elements=[trail,...e.filter(item=>!sourceIds.has(item.id))];
  return require('./redesign.cjs')({schema:1,revision:0,settingsRevision:0,settings:{name:{zh:'你的名字',en:'Your Name'},email:'',wechatId:'',wechatQr:'',motion:true},assets,pages:[home,...categories]});
};

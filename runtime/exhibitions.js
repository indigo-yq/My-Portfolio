(function(global){
  'use strict';
  function create(canvas,page,project,device,lang,{paused=false,onResize=()=>{}}={}){
    const R=FolioRender,t=(zh,en)=>lang==='zh'?zh:en,cleanups=[],slides=[];let disposed=false;
    const asset=id=>project.assets.find(item=>item.id===id),nodes=[...canvas.querySelectorAll('.canvas-element')],activeAssets={};
    const applyPoses=poses=>{for(const node of nodes){const pose=poses[node.dataset.id];if(pose)Object.assign(node.style,{left:pose.x+'px',top:pose.y+'px',width:pose.w+'px',height:pose.h+'px'});}};
    function reflow(){if(page.composition){const result=R.compositionLayout(page,project,device,activeAssets);applyPoses(result.poses);canvas.style.height=result.height+'px';onResize();}}
    if(page.collection){
      const config=page.collection,groups=[...new Set(page.elements.map(item=>item.collectionItem).filter(Boolean))],bar=document.createElement('nav');bar.className='collection-filters';bar.style.top=config.filterY[device]+'px';bar.setAttribute('aria-label',t('项目分类','Project categories'));
      const categories=[...new Map(groups.map(id=>{const item=page.elements.find(e=>e.collectionItem===id);return [R.label(item.projectCategory,lang),item.projectCategory];})).values()];
      const choices=[{zh:'全部',en:'All'},...categories];
      function filter(value,button){
        const visible=groups.filter(id=>!value||R.label(page.elements.find(e=>e.collectionItem===id).projectCategory,lang)===value);
        const result=R.collectionLayout(page,device,visible);applyPoses(result.poses);
        for(const node of nodes.filter(n=>n.dataset.collectionItem))node.hidden=!visible.includes(node.dataset.collectionItem);
        bar.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
        canvas.style.height=result.height+'px';onResize();
        bar.querySelector('.collection-count').textContent=String(visible.length).padStart(2,'0')+' '+t('个项目','PROJECTS');
      }
      choices.forEach((category,i)=>{const button=document.createElement('button');button.textContent=R.label(category,lang);button.setAttribute('aria-pressed',String(i===0));button.onclick=()=>filter(i?R.label(category,lang):'',button);bar.append(button);});const count=document.createElement('span');count.className='collection-count';bar.append(count);canvas.append(bar);filter('',bar.querySelector('button'));
    }
    const shared=project.assets.filter(item=>item.mime.startsWith('image/')&&item.id!==project.settings.wechatQr&&page.elements.some(e=>e.assetId===item.id));
    for(const node of nodes.filter(n=>['demo','gallery'].includes(n.dataset.effect))){
      const element=page.elements.find(e=>e.id===node.dataset.id),sources=element.galleryAssets?.map(asset).filter(Boolean)||shared;let image=node.querySelector('img,video');if(!sources.length||!image)continue;
      let index=Math.max(0,sources.findIndex(a=>a.id===element.assetId)),timer=null,visible=false,localPaused=false,start;
      const dots=document.createElement('div');dots.className='gallery-dots';
      if(element.effect==='gallery'){
        sources.forEach((source,i)=>{const button=document.createElement('button');button.setAttribute('aria-label',t('展示第 ','Show slide ')+(i+1));button.onclick=()=>show(i);dots.append(button);});
        const pauseButton=document.createElement('button');pauseButton.className='gallery-pause';pauseButton.textContent='Ⅱ';pauseButton.setAttribute('aria-label',t('暂停轮播','Pause slideshow'));pauseButton.onclick=()=>{localPaused=!localPaused;pauseButton.textContent=localPaused?'▶':'Ⅱ';pauseButton.setAttribute('aria-label',localPaused?t('播放轮播','Play slideshow'):t('暂停轮播','Pause slideshow'));schedule();};dots.append(pauseButton);node.querySelector('.element-inner').append(dots);
      }
      const duration=Number.isFinite(element.style?.slideDuration)&&element.style.slideDuration>=1000&&element.style.slideDuration<=60000?element.style.slideDuration:5000;
      function schedule(){clearTimeout(timer);if(image.tagName==='VIDEO'){if(visible&&!paused&&!localPaused&&!document.hidden)image.play().catch(()=>{});else image.pause();}if(!disposed&&visible&&!paused&&!localPaused&&!document.hidden)timer=setTimeout(()=>show((index+1)%sources.length),duration);}
      function show(next){
        index=(next+sources.length)%sources.length;const source=sources[index],video=source.mime.startsWith('video/');
        if((image.tagName==='VIDEO')!==video){
          const media=document.createElement(video?'video':'img');media.style.objectFit=element.style.fit||'contain';media.draggable=false;
          if(video){media.muted=true;media.loop=true;media.playsInline=true;media.controls=element.style.controls===1;media.preload='auto';}else{media.alt=element.name;media.decoding='async';}
          media.addEventListener('error',()=>node.classList.add('media-error'));if(image.tagName==='VIDEO'){image.pause();image.removeAttribute('src');image.load();}image.replaceWith(media);image=media;
        }
        if(image.getAttribute('src')!==source.url)image.src=source.url;
        activeAssets[element.id]=source.id;
        if(element.style.naturalSize&&!page.composition){const pose=element.layout[device],size=R.naturalPose(pose,source,element.style[device==='mobile'?'mobileMaxWidth':'naturalMaxWidth'],element.style[device==='mobile'?'mobileMaxHeight':'naturalMaxHeight']);applyPoses({[element.id]:size});}
        reflow();node.dataset.assetId=source.id;node.dataset.demoIndex=index;node.dataset.slideStarted=performance.now();dots.querySelectorAll('button:not(.gallery-pause)').forEach((b,i)=>b.setAttribute('aria-current',String(i===index)));schedule();
      }
      const manual=event=>show(index+event.detail.delta);node.addEventListener('demochange',manual);node.tabIndex=0;node.setAttribute('aria-roledescription',t('图片轮播','Slideshow'));node.setAttribute('aria-label',element.name);
      const key=event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();show(index+(event.key==='ArrowLeft'?-1:1));}};node.addEventListener('keydown',key);
      const down=event=>{if(!event.target.closest('button'))start={x:event.clientX,y:event.clientY};};const up=event=>{if(start){const dx=event.clientX-start.x,dy=event.clientY-start.y;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy))show(index+(dx<0?1:-1));start=null;}};node.addEventListener('pointerdown',down);node.addEventListener('pointerup',up);node.addEventListener('pointercancel',()=>start=null);
      const observer=new IntersectionObserver(entries=>{const next=entries[0].isIntersecting;if(next!==visible){visible=next;schedule();}},{threshold:.1});observer.observe(node);slides.push({setPaused(value){paused=value;schedule();}});show(index);
      const visibility=()=>schedule();document.addEventListener('visibilitychange',visibility);
      cleanups.push(()=>{clearTimeout(timer);if(image.tagName==='VIDEO')image.pause();observer.disconnect();node.removeEventListener('demochange',manual);node.removeEventListener('keydown',key);node.removeEventListener('pointerdown',down);node.removeEventListener('pointerup',up);document.removeEventListener('visibilitychange',visibility);});
    }
    const detailImages=nodes.filter(n=>n.dataset.effect==='lightbox');let dialog;
    if(detailImages.length){
      dialog=document.createElement('dialog');dialog.className='work-lightbox';dialog.innerHTML='<button class="lightbox-close" aria-label="Close">×</button><button class="lightbox-prev" aria-label="Previous">‹</button><div class="lightbox-view"><img alt=""></div><button class="lightbox-next" aria-label="Next">›</button><div class="lightbox-caption"></div><button class="lightbox-zoom">＋</button>';document.body.append(dialog);let current=0,zoom=false;
      function show(index){current=(index+detailImages.length)%detailImages.length;dialog.querySelector('img').src=detailImages[current].querySelector('img').src;dialog.querySelector('img').alt=detailImages[current].getAttribute('aria-label')||t('项目图片','Project image');dialog.querySelector('.lightbox-caption').textContent=`${current+1} / ${detailImages.length}`;zoom=false;dialog.classList.remove('zoomed');}
      detailImages.forEach((node,i)=>{node.tabIndex=0;node.setAttribute('role','button');node.setAttribute('aria-label',t('放大查看：','Enlarge: ')+page.elements.find(e=>e.id===node.dataset.id).name);const open=()=>{show(i);dialog.showModal();};node.onclick=open;node.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};});
      dialog.querySelector('.lightbox-close').onclick=()=>dialog.close();dialog.querySelector('.lightbox-prev').onclick=()=>show(current-1);dialog.querySelector('.lightbox-next').onclick=()=>show(current+1);dialog.querySelector('.lightbox-zoom').onclick=()=>{zoom=!zoom;dialog.classList.toggle('zoomed',zoom);};dialog.addEventListener('keydown',event=>{if(event.key==='ArrowRight')show(current+1);if(event.key==='ArrowLeft')show(current-1);});dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
      let touch;dialog.addEventListener('pointerdown',event=>touch={x:event.clientX,y:event.clientY});dialog.addEventListener('pointerup',event=>{if(touch&&!zoom&&Math.abs(event.clientX-touch.x)>60&&Math.abs(event.clientY-touch.y)<80)show(current+(event.clientX<touch.x?1:-1));touch=null;});cleanups.push(()=>dialog.remove());
    }
    return {setPaused(value){paused=value;slides.forEach(slide=>slide.setPaused(value));},destroy(){disposed=true;cleanups.forEach(fn=>fn());}};
  }
  global.FolioExhibitions={create};
})(window);

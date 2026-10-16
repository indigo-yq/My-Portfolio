(function(global){
  'use strict';
  const widths={desktop:1440,mobile:390};
  const label=(value,lang)=>typeof value==='string'?value:(value?.[lang]??value?.zh??'');
  const textValue=(element,project,lang)=>element.profileText==='name'?label(project.settings.name,lang):element.profileText==='greeting'?(lang==='zh'?'你好，我是':'Hello, I’m ')+label(project.settings.name,lang)+(lang==='zh'?'。':'.'):element.profileText==='copyright'?'© 2026 '+label(project.settings.name,lang):label(element.pageName?project.pages.find(page=>page.id===element.pageName)?.name||element.text:element.text,lang);
  function naturalPose(pose,asset,maxWidth,maxHeight){
    const ratio=asset?.width>0&&asset?.height>0?asset.width/asset.height:pose.w/pose.h;
    const w=Math.min(maxWidth,maxHeight*ratio);return {...pose,x:pose.x+pose.w/2-w/2,w,h:w/ratio};
  }
  function collectionLayout(page,device,visibleGroups){
    const c=page.collection,poses={},columns=Array(c.columns[device]).fill(c.start[device]);let previousCategory;
    for(let index=0;index<visibleGroups.length;index++){
      const items=page.elements.filter(e=>e.collectionItem===visibleGroups[index]),first=items[0].layout[device];
      let col=index%c.columns[device],y=c.start[device]+Math.floor(index/c.columns[device])*c.cardHeight[device];
      if(c.naturalFlow){
        const category=items[0].projectCategory.zh;
        if(c.sectioned&&previousCategory&&category!==previousCategory)columns.fill(Math.max(...columns)+22);
        previousCategory=category;col=columns.indexOf(Math.min(...columns));y=columns[col];
        const height=Math.max(...items.map(e=>e.layout[device].y-first.y+e.layout[device].h));columns[col]=y+height+42;
      }
      const x=c.margin[device]+col*(first.w+c.gap[device]);
      for(const item of items){const pose=item.layout[device];poses[item.id]={...pose,x:x+pose.x-first.x,y:y+pose.y-first.y};}
    }
    const height=c.naturalFlow?Math.max(...columns)+90:c.start[device]+Math.ceil(visibleGroups.length/c.columns[device])*c.cardHeight[device]+130;
    return {poses,height};
  }
  // The showcase follows its active artwork. Mosaic frames keep their original
  // dimensions; only the media inside each frame fit the artwork's proportions.
  function compositionLayout(page,project,device,activeAssets={}){
    const config=page.composition,poses=Object.fromEntries(page.elements.map(e=>[e.id,{...e.layout[device]}]));if(!config)return {poses,height:page.height[device]};
    const assetFor=e=>project.assets.find(a=>a.id===(activeAssets[e.id]||e.assetId));let mainDelta=0,mosaicDelta=0;
    const demo=page.elements.find(e=>e.id===config.showcase?.media),oldDemo=demo&&poses[demo.id],stage=poses[config.showcase?.background];
    if(demo&&stage){
      const stageBottom=stage.y+stage.h,next=naturalPose(oldDemo,assetFor(demo),demo.style[device==='mobile'?'mobileMaxWidth':'naturalMaxWidth']||oldDemo.w,demo.style[device==='mobile'?'mobileMaxHeight':'naturalMaxHeight']||oldDemo.h);
      mainDelta=config.showcase.fixedStage?0:next.h-oldDemo.h;poses[demo.id]=next;stage.h+=mainDelta;if(poses[config.showcase.control])poses[config.showcase.control].y+=mainDelta;
      for(const element of page.elements)if(element.layout[device].y>=stageBottom)poses[element.id].y+=mainDelta;
    }
    const mosaic=config.mosaic,cards=mosaic?.cards||[];
    if(mosaic?.fixedFrames)for(const card of cards){
      const media=page.elements.find(e=>e.id===card.media);if(!media||!card.viewport?.[device])continue;
      const viewport={...card.viewport[device],y:card.viewport[device].y+mainDelta},next=naturalPose(viewport,assetFor(media),viewport.w,viewport.h);
      next.y=viewport.y+(viewport.h-next.h)/2;poses[media.id]=next;
    }
    const frames=cards.map(card=>poses[card.background]).filter(Boolean),bottom=frames.length?Math.max(...frames.map(pose=>pose.y+pose.h)):0;
    return {poses,height:page.height[device]+mainDelta,mosaicBottom:bottom,mainDelta,mosaicDelta};
  }
  function render(canvas,page,project,device,lang,{editing=false}={}){
    canvas.replaceChildren();canvas.className='page-canvas'+(editing?' is-editing':'');
    canvas.style.width=widths[device]+'px';canvas.style.height=page.height[device]+'px';canvas.style.background=page.background||'#fff';
    for(const element of page.elements){
      const pose=element.layout[device];if(pose.hidden&&!editing)continue;
      const node=document.createElement('div');node.className='canvas-element';node.dataset.id=element.id;node.dataset.effect=element.effect||'none';
      Object.assign(node.style,{left:pose.x+'px',top:pose.y+'px',width:pose.w+'px',height:pose.h+'px',transform:`rotate(${pose.rotation}deg)`});
      if(pose.hidden)node.classList.add('is-hidden');if(element.locked)node.classList.add('is-locked');
      const inner=document.createElement('div');inner.className='element-inner';const style=element.style||{};
      if(element.type==='shape'){
        Object.assign(inner.style,{background:style.fill||'#ddd',borderRadius:(style.radius||0)+'px',border:style.borderWidth?`${style.borderWidth}px solid ${style.border||'#777'}`:''});
        if(element.effect==='design-trail'){
          node.classList.add('design-trail-stage');
          if(element.heroWords?.trim()){
            const words=document.createElement('div');words.className='design-words';words.setAttribute('aria-hidden','true');
            for(const word of element.heroWords.trim().split(/\s+/)){const span=document.createElement('span');span.className='design-word';span.textContent=word;words.append(span);}inner.append(words);
          }
          const modes=document.createElement('div');modes.className='design-modes';modes.setAttribute('aria-label','Trail effects');
          for(const [key,name]of [['flame','FLAME'],['venetian','VENETIAN'],['curtain','CURTAIN'],['hexagon','HEXAGON'],['liquid','LIQUID'],['zoomsplit','ZOOM SPLIT']]){const button=document.createElement('button');button.textContent=name;button.dataset.trailMode=key;button.className=key==='flame'?'active':'';button.setAttribute('aria-pressed',String(key==='flame'));modes.append(button);}inner.append(modes);
          const title=document.createElementNS('http://www.w3.org/2000/svg','svg');title.setAttribute('viewBox','0 0 1400 410');title.classList.add('design-title');title.setAttribute('role','img');title.setAttribute('aria-label',element.heroTitle||'DESIGN');
          const titleText=document.createElementNS('http://www.w3.org/2000/svg','text');titleText.setAttribute('x','0');titleText.setAttribute('y','340');titleText.setAttribute('textLength','1390');titleText.setAttribute('lengthAdjust','spacingAndGlyphs');titleText.textContent=element.heroTitle||'DESIGN';title.append(titleText);inner.append(title);
          const trails=document.createElement('div');trails.className='design-trails';trails.setAttribute('aria-hidden','true');inner.append(trails);
          const hint=document.createElement('p');hint.className='design-hint';hint.textContent=lang==='zh'?'移动鼠标创造图片轨迹 | 点击顶部切换效果':'MOVE YOUR CURSOR TO CREATE DYNAMIC TRAILS | CLICK THE NAV TO SWITCH TRAIL EFFECTS';inner.append(hint);
          const speed=document.createElement('span');speed.className='design-speed';inner.append(speed);
        }
        if(element.effect==='cursor-trail'){
          node.classList.add('cursor-trail-stage');node.setAttribute('aria-label',lang==='zh'?'互动作品图片：移动鼠标，或轻触浏览':'Interactive work: move your pointer or tap to explore');
          if(editing){const samples=document.createElement('div');samples.className='cursor-trail-editor-preview';
            for(const id of (element.trailAssets||[]).slice(0,3)){const asset=project.assets.find(asset=>asset.id===id);if(!asset)continue;const image=document.createElement('img');image.src=asset.url;image.alt='';samples.append(image);}
            const caption=document.createElement('span');caption.textContent=lang==='zh'?'图片拖尾 · 点击预览体验互动':'Image trail · Open preview to interact';samples.append(caption);inner.append(samples);
          }
        }
      }
      else if(element.type==='text'){
        inner.classList.add('text-element');inner.textContent=textValue(element,project,lang);
        Object.assign(inner.style,{fontSize:(device==='mobile'?(style.mobileFontSize||style.fontSize):style.fontSize||28)+'px',fontFamily:style.fontFamily==='Arial'?'Arial,"Microsoft YaHei",sans-serif':['Georgia','Microsoft YaHei','sans-serif','serif'].includes(style.fontFamily)?style.fontFamily:'Arial,"Microsoft YaHei",sans-serif',fontWeight:style.weight||400,fontStyle:style.fontStyle==='italic'?'italic':'normal',color:style.color||'#111',lineHeight:style.lineHeight||1.2,textAlign:style.align||'left'});
        if(style.align==='center'){inner.style.justifyContent='center';inner.style.alignItems='center';}
      }else{
        const asset=project.assets.find(asset=>asset.id===element.assetId);
        if(asset){const media=document.createElement(element.type==='video'?'video':'img');media.src=asset.url;media.style.objectFit=style.fit||'contain';media.draggable=false;
          if(element.type==='video'){media.muted=true;media.loop=true;media.playsInline=true;media.controls=!editing&&style.controls===1;media.preload=editing?'metadata':'auto';}
          else{media.alt=element.name||'';media.decoding='async';if(!editing&&pose.y>(device==='mobile'?1000:1400))media.loading='lazy';}
          media.addEventListener('error',()=>{node.classList.add('media-error');node.title='素材暂时无法显示';});inner.append(media);
          if(['demo','gallery'].includes(element.effect)&&!editing){const controls=document.createElement('div');controls.className='demo-arrows';for(const [symbol,delta]of [['‹',-1],['›',1]]){const button=document.createElement('button');button.type='button';button.textContent=symbol;button.setAttribute('aria-label',lang==='zh'?(delta<0?'上一张演示':'下一张演示'):(delta<0?'Previous demo':'Next demo'));button.addEventListener('click',event=>{event.stopPropagation();node.dispatchEvent(new CustomEvent('demochange',{bubbles:true,detail:{delta}}));});controls.append(button);}inner.append(controls);}
        }else{inner.textContent=lang==='zh'?'素材缺失':'Missing asset';inner.className+=' media-error';}
        inner.style.borderRadius=(style.radius||0)+'px';
      }
      node.append(inner);if(element.anchor)node.dataset.anchor=element.anchor;
      if(element.collectionItem){node.dataset.collectionItem=element.collectionItem;node.dataset.projectCategory=label(element.projectCategory,lang);}
      if(element.dragGroup)node.dataset.dragGroup=element.dragGroup;
      if(element.link&&!editing){node.classList.add('has-link');node.tabIndex=0;node.setAttribute('role','link');node.setAttribute('aria-label',element.type==='text'?label(element.text,lang):element.name);const activate=()=>node.dispatchEvent(new CustomEvent('elementaction',{bubbles:true,detail:element.link}));node.addEventListener('click',activate);node.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();activate();}});}
      canvas.append(node);
    }
    return canvas;
  }
  global.FolioRender={render,widths,label,textValue,naturalPose,collectionLayout,compositionLayout};
})(window);

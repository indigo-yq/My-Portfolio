(function(global){
  'use strict';
  // Interaction reference: Nemanja Kočović, https://codepen.io/thingbynemanja/pen/ogjaaNE
  // 100px movement / 70ms spacing, 600ms back.out(2), then 600ms power2.in.
  function create(stage,{assets,paused=false}={}){
    const layer=document.createElement('div');layer.className='cursor-trail-images';layer.setAttribute('aria-hidden','true');stage.append(layer);
    const sources=assets||[];let index=0,last={x:0,y:0},lastTime=performance.now(),visible=true,disposed=false;
    for(const source of sources){const preload=new Image();preload.src=source.url;}
    const animations=new Set();const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const clear=()=>{for(const animation of animations)animation.cancel();animations.clear();layer.replaceChildren();};
    function spawn(event,force=false){
      if(disposed||paused||reduced.matches||!visible||!sources.length)return;
      const rect=stage.getBoundingClientRect(),now=performance.now(),x=event.clientX,y=event.clientY;
      if(x<rect.left||x>rect.right||y<rect.top||y>rect.bottom)return;
      if(!force&&(Math.hypot(x-last.x,y-last.y)<100||now-lastTime<70))return;
      const source=sources[index++%sources.length],image=document.createElement('img');image.className='cursor-trail-image';image.src=source.url;image.alt='';image.draggable=false;
      // Convert viewport pixels to the editor's design coordinates, so the reference
      // keeps the same 200 × 300px card size and movement threshold at every zoom.
      const scale=rect.width/stage.offsetWidth||1,size=Math.min(1,rect.width/390);
      image.style.width=200*size/scale+'px';image.style.height=300*size/scale+'px';
      image.style.left=(x-rect.left-90*size)/scale+'px';image.style.top=(y-rect.top-75*size)/scale+'px';
      const rotation=Math.random()*40-20,frames=[];
      for(let step=0;step<=60;step++){const t=step/60,u=t-1;frames.push({offset:t/2,transform:`rotate(${rotation}deg) scale(${1+3*u*u*u+2*u*u})`});}
      for(let step=1;step<=60;step++){const t=step/60;frames.push({offset:.5+t/2,transform:`rotate(${rotation}deg) scale(${1-t*t*t})`});}
      layer.append(image);const animation=image.animate(frames,{duration:1200,easing:'linear',fill:'forwards'});animations.add(animation);
      const remove=()=>{animations.delete(animation);image.remove();};animation.onfinish=remove;animation.oncancel=remove;
      if(layer.childElementCount>20)layer.firstElementChild.remove();last={x,y};lastTime=now;
    }
    const move=event=>spawn(event),tap=event=>{if(event.pointerType!=='mouse')spawn(event,true);};
    const reset=()=>{last={x:0,y:0};};
    stage.addEventListener('pointermove',move);stage.addEventListener('pointerdown',tap);stage.addEventListener('pointerleave',reset);
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)clear();});observer.observe(stage);
    const onVisibility=()=>{if(document.hidden)clear();};document.addEventListener('visibilitychange',onVisibility);reduced.addEventListener('change',clear);
    return {setPaused(value){paused=value;if(paused)clear();},destroy(){disposed=true;clear();observer.disconnect();stage.removeEventListener('pointermove',move);stage.removeEventListener('pointerdown',tap);stage.removeEventListener('pointerleave',reset);document.removeEventListener('visibilitychange',onVisibility);reduced.removeEventListener('change',clear);layer.remove();}};
  }
  global.FolioCursorTrail={create};
})(window);

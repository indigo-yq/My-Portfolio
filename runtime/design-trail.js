(function(global){
  'use strict';
  // Motion reference: Filip Zrnzevic, https://codepen.io/filipz/pen/yyNGpmv
  // Kept local and dependency-free so exported projects work offline.
  function create(stage,{assets=[],paused=false}={}){
    const mobile=stage.offsetWidth<=390,threshold=mobile?20:40,minSize=mobile?120:160,maxSize=mobile?260:340;
    const layer=stage.querySelector('.design-trails'),indicator=stage.querySelector('.design-speed');
    const reduced=matchMedia('(prefers-reduced-motion: reduce)'),timers=new Set(),cards=new Set();
    let disposed=false,visible=true,pattern='flame',index=0,last=null,previous=null,lastTime=performance.now(),maxSpeed=0,speed=0,pointer=null,lastScroll=0,speedTimer;
    const later=(fn,delay)=>{const id=setTimeout(()=>{timers.delete(id);if(!disposed)fn();},delay);timers.add(id);return id;};
    function clear(){for(const id of timers)clearTimeout(id);timers.clear();for(const card of cards)card.remove();cards.clear();indicator.style.opacity='0';}
    function fragments(mode){
      if(mode==='venetian')return Array.from({length:12},(_,i)=>({clip:`polygon(0 ${i*100/12}%,100% ${i*100/12}%,100% ${(i+1)*100/12}%,0 ${(i+1)*100/12}%)`,reveal:Math.abs(i-6)*.08,collapse:i*.04,origin:`50% ${(i+.5)*100/12}%`}));
      if(mode==='curtain')return Array.from({length:10},(_,i)=>({clip:`polygon(${i*10}% 0,${(i+1)*10}% 0,${(i+1)*10}% 100%,${i*10}% 100%)`,closed:`polygon(${i*10+5}% 0,${i*10+5}% 0,${i*10+5}% 100%,${i*10+5}% 100%)`,reveal:i/10*.6,collapse:(9-i)/10*.3}));
      if(mode==='liquid')return [[25,20,16],[70,15,12],[45,35,18],[15,55,14],[80,45,15],[55,70,20],[30,80,13],[75,75,17]].map(([x,y,r],i)=>({clip:`circle(${r}% at ${x}% ${y}%)`,closed:`circle(0% at ${x}% ${y}%)`,reveal:i/8*.4,collapse:(7-i)/8*.25}));
      if(mode==='hexagon')return [[50,50,20],[25,25,15],[75,25,15],[85,50,15],[75,75,15],[25,75,15],[15,50,15]].map(([x,y,s],i)=>({clip:`polygon(${x-s*.5}% ${y-s*.87}%,${x+s*.5}% ${y-s*.87}%,${x+s}% ${y}%,${x+s*.5}% ${y+s*.87}%,${x-s*.5}% ${y+s*.87}%,${x-s}% ${y}%)`,closed:`polygon(${x}% ${y}%,${x}% ${y}%,${x}% ${y}%,${x}% ${y}%,${x}% ${y}%,${x}% ${y}%)`,reveal:i===0?0:.2+(i-1)*.06,collapse:i===0?.3:(i-1)*.04}));
      return Array.from({length:9},(_,i)=>{const x=i%3*100/3,y=Math.floor(i/3)*100/3,w=100/3,d=Math.hypot(i%3-1,Math.floor(i/3)-1);return {clip:`polygon(${x}% ${y}%,${x+w}% ${y}%,${x+w}% ${y+w}%,${x}% ${y+w}%)`,closed:`polygon(${x+w/2}% ${y+w/2}%,${x+w/2}% ${y+w/2}%,${x+w/2}% ${y+w/2}%,${x+w/2}% ${y+w/2}%)`,reveal:d*.15,collapse:d*.08};});
    }
    function emit(point,intensity){
      if(disposed||paused||reduced.matches||!visible||!assets.length)return;
      const rect=stage.getBoundingClientRect();if(point.x<rect.left||point.x>rect.right||point.y<rect.top||point.y>rect.bottom)return;
      const scale=rect.width/stage.offsetWidth,size=(minSize+(maxSize-minSize)*intensity)/scale,rotation=(Math.random()-.5)*30*(1+intensity*2);
      const mode=pattern,source=assets[index++%assets.length],card=document.createElement('div');card.className='design-trail-card';card.dataset.pattern=pattern;
      Object.assign(card.style,{width:size+'px',height:size+'px',left:(point.x-rect.left)/scale+'px',top:(point.y-rect.top)/scale+'px'});
      layer.append(card);cards.add(card);const parts=[];
      if(pattern==='flame'){
        const image=document.createElement('img');image.src=source.url;image.alt='';image.draggable=false;card.append(image);
        card.style.transform=`translate(-50%,-50%) rotate(${rotation}deg) scale(0)`;
        card.style.transition='transform 600ms cubic-bezier(.07,.5,.5,1)';
        later(()=>card.style.transform=`translate(-50%,-50%) rotate(${rotation}deg) scale(1)`,10);
      }else{
        card.style.transform='translate(-50%,-50%) scale(0)';card.style.transition='transform 600ms cubic-bezier(.34,1.56,.64,1)';
        for(const part of fragments(pattern)){const fragment=document.createElement('div');fragment.className='design-fragment';fragment.style.backgroundImage=`url("${source.url.replace(/["\\\n\r]/g,'')}")`;fragment.style.clipPath=part.clip;
          if(pattern==='venetian'){fragment.style.transformOrigin=part.origin;fragment.style.transform='rotateX(90deg)';fragment.style.transition='transform 600ms cubic-bezier(.87,0,.13,1)';}
          else{fragment.style.clipPath=part.closed;fragment.style.transition='clip-path 600ms cubic-bezier(.87,0,.13,1)';}
          card.append(fragment);parts.push({...part,node:fragment});later(()=>{if(part.origin)fragment.style.transform='rotateX(0deg)';else fragment.style.clipPath=part.clip;},10+part.reveal*50);
        }
        later(()=>card.style.transform='translate(-50%,-50%) scale(1)',10);
      }
      later(()=>{card.style.transition='transform 800ms cubic-bezier(.87,0,.13,1)';card.style.transform=mode==='flame'?`translate(-50%,-50%) rotate(${rotation+360}deg) scale(0)`:'translate(-50%,-50%) scale(0)';
        for(const part of parts)later(()=>{if(part.origin)part.node.style.transform='rotateX(-90deg)';else part.node.style.clipPath=part.closed;},part.collapse*50);
        later(()=>{card.remove();cards.delete(card);},800);
      },600);
      if(cards.size>50){const oldest=cards.values().next().value;oldest.remove();cards.delete(oldest);}
    }
    function move(event){
      if(disposed||paused||reduced.matches||!visible)return;
      const point={x:event.clientX,y:event.clientY},now=performance.now();pointer=point;
      if(!last){last=previous=point;lastTime=now;return;}
      const dx=point.x-last.x,dy=point.y-last.y,travel=Math.hypot(point.x-previous.x,point.y-previous.y);
      const touch=event.pointerType!=='mouse';if(touch&&Math.abs(dy)>Math.abs(dx)){previous=point;return;}
      if(Math.hypot(dx,dy)>(touch?3:threshold)&&travel>(touch?3:5)&&(!touch||now-lastTime>=40)){
        const raw=travel/Math.max(1,now-lastTime);maxSpeed=Math.max(maxSpeed,raw);speed=speed*.75+Math.min(raw/(maxSpeed||.5),1)*.25;
        emit(point,speed);last=point;lastTime=now;indicator.textContent=pattern.toUpperCase()+' INTENSITY: '+Math.round(speed*100)+'%';indicator.style.opacity='1';clearTimeout(speedTimer);speedTimer=later(()=>indicator.style.opacity='0',1500);
      }previous=point;
    }
    const leave=()=>{last=previous=null;pointer=null;};
    const scroll=()=>{if(pointer&&performance.now()-lastScroll>=50){lastScroll=performance.now();emit(pointer,.5);}};
    stage.addEventListener('pointermove',move);stage.addEventListener('pointerleave',leave);window.addEventListener('scroll',scroll,{passive:true});
    const buttons=stage.querySelectorAll('[data-trail-mode]');for(const button of buttons)button.onclick=()=>{pattern=button.dataset.trailMode;buttons.forEach(item=>{item.classList.toggle('active',item===button);item.setAttribute('aria-pressed',String(item===button));});};
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)clear();});observer.observe(stage);
    const visibility=()=>{if(document.hidden)clear();};document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',clear);
    if(!paused&&!reduced.matches)stage.querySelectorAll('.design-word').forEach((word,i)=>word.animate([{opacity:0,transform:'translateY(20px)',filter:'blur(8px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0)'}],{duration:800,delay:200+i*3000/50,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'}));
    return {setPaused(value){paused=value;if(value)clear();},destroy(){disposed=true;clear();observer.disconnect();stage.removeEventListener('pointermove',move);stage.removeEventListener('pointerleave',leave);window.removeEventListener('scroll',scroll);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',clear);stage.querySelectorAll('.design-word').forEach(word=>word.getAnimations().forEach(animation=>animation.cancel()));}};
  }
  global.FolioDesignTrail={create};
})(window);

/* Directional illustration, never telemetry. Native SVG owns the animation clock. */
(()=>{'use strict';
 const routeSelector='path[data-edge],path[data-from][data-to]';
 const diagrams=[...document.querySelectorAll('svg')].filter(svg=>svg.querySelector(routeSelector));
 const main=document.querySelector('main');if(!main||!diagrams.length)return;
 const ns='http://www.w3.org/2000/svg',key='sadeq-map-motion';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let paused=false,suspended=false,assistantSuspended=false;try{paused=localStorage.getItem(key)==='paused';}catch{}
 const supported=diagrams.every(svg=>typeof svg.pauseAnimations==='function'&&typeof svg.unpauseAnimations==='function');
 const create=(tag,attrs={})=>{const node=document.createElementNS(ns,tag);for(const [name,value]of Object.entries(attrs))node.setAttribute(name,String(value));return node;};
 const states=diagrams.map((svg,index)=>{
  if(!svg.id)svg.id='map-motion-diagram-'+index;
  const signals=[...svg.querySelectorAll(routeSelector)].map((edge,i)=>{
   if(!edge.id)edge.id=svg.id+'-route-'+i;
   const duration=3.2+(i%3)*.35,begin=String(-(i*.59)%duration)+'s';
   const outer=create('g',{'class':'map-flow-signal','aria-hidden':'true'});
   const packet=create('g',{'class':'map-flow-packet'});
   packet.append(create('circle',{'class':'map-flow-halo',r:5}),create('circle',{'class':'map-flow-core',r:2}),create('path',{'class':'map-flow-arrow',d:'M-8 -3L-4 0L-8 3'}));
   const motion=create('animateMotion',{dur:duration+'s',begin,repeatCount:'indefinite',rotate:'auto'});
   motion.append(create('mpath',{href:'#'+edge.id}));packet.append(motion);
   packet.append(create('animate',{attributeName:'opacity',values:'0;1;1;0',keyTimes:'0;.08;.88;1',dur:duration+'s',begin,repeatCount:'indefinite'}));
   outer.append(packet);
   try{
    const length=edge.getTotalLength(),end=edge.getPointAtLength(length*.94);
    if(length>0&&Number.isFinite(end.x)&&Number.isFinite(end.y)){
     const arrival=create('circle',{'class':'map-flow-arrival',cx:end.x,cy:end.y,r:1.5,opacity:0});
     arrival.append(create('animate',{attributeName:'r',values:'1.5;1.5;5;5',keyTimes:'0;.78;.94;1',dur:duration+'s',begin,repeatCount:'indefinite'}),create('animate',{attributeName:'opacity',values:'0;0;.6;0',keyTimes:'0;.78;.86;1',dur:duration+'s',begin,repeatCount:'indefinite'}));outer.append(arrival);
    }
   }catch{}
   edge.after(outer);
   return{edge,outer};
  });
  if(supported)svg.pauseAnimations();
  return{svg,signals,visible:false};
 });
 const toolbar=document.createElement('div');toolbar.className='map-motion-toolbar';
 const note=document.createElement('p');note.textContent='Directional animation · illustrates the connections';
 const button=document.createElement('button');button.type='button';button.className='map-motion-toggle';button.setAttribute('aria-controls',diagrams.map(svg=>svg.id).join(' '));toolbar.append(note,button);
 const header=main.querySelector('header,.map-header'),layout=main.querySelector('.map-layout');
 if(header?.parentElement===main)header.after(toolbar);else if(layout?.parentElement===main)main.insertBefore(toolbar,layout);else main.prepend(toolbar);
 function select(){for(const {signals}of states)for(const {edge,outer}of signals)outer.dataset.active=String(edge.dataset.incident==='true'||edge.dataset.selected==='true'||edge.dataset.active==='true'||edge.classList.contains('connected')||edge.classList.contains('selected'));}
 // Preview related connections without changing the real selected component.
 // Node numbers in the Twin drawing are display identifiers, not route names.
 const hitSelector='button[data-component],button[data-select]';
 const twinNames=['','input','profile','provider','reply','voice','avatar','fallback'];
 let hovered=null,focused=null;
 const getNode=target=>target?.closest?.(hitSelector)||null;
 function preview(){
  const active=hovered||focused,id=active?.dataset.component||active?.dataset.select||'';
  const routeId=/^[1-7]$/.test(id)&&location.pathname.includes('/digital-twin/')?twinNames[Number(id)]:id;
  for(const {svg,signals}of states){
   for(const node of svg.querySelectorAll('[data-node]'))node.dataset.mapHover=String(Boolean(id)&&node.dataset.node===id);
   for(const {edge,outer}of signals){const on=Boolean(routeId)&&(edge.dataset.from===routeId||edge.dataset.to===routeId);edge.dataset.mapHover=String(on);outer.dataset.mapHover=String(on);}
  }
 }
 document.addEventListener('pointerover',event=>{const node=getNode(event.target);if(node&&node!==hovered){hovered=node;preview();}});
 document.addEventListener('pointerout',event=>{if(hovered&&getNode(event.relatedTarget)!==hovered&&getNode(event.target)===hovered){hovered=null;preview();}});
 document.addEventListener('focusin',event=>{focused=getNode(event.target);preview();});
 document.addEventListener('focusout',event=>{focused=getNode(event.relatedTarget);preview();});
 function sync(){
  const reason=!supported?'unavailable':reduced.matches?'reduced':paused?'paused':'enabled';
  document.body.dataset.mapMotion=reason;
  button.disabled=!supported||reduced.matches;button.setAttribute('aria-pressed',String(paused||reduced.matches));
  button.textContent=!supported?'Map motion unavailable':reduced.matches?'Motion off · Reduced motion':paused?'Play map motion':'Pause map motion';
  for(const state of states){const run=supported&&!reduced.matches&&!paused&&!suspended&&!assistantSuspended&&!document.hidden&&state.visible;state.svg.dataset.mapMotion=run?'running':'held';if(supported)state.svg[run?'unpauseAnimations':'pauseAnimations']();}
 }
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){const state=states.find(item=>item.svg===entry.target);if(state)state.visible=entry.isIntersecting;}sync();});states.forEach(state=>observer.observe(state.svg));
 const selectionObserver=new MutationObserver(records=>{if(records.some(record=>record.target.matches?.(routeSelector)))select();});states.forEach(state=>selectionObserver.observe(state.svg,{subtree:true,attributes:true,attributeFilter:['class','data-incident','data-active','data-selected']}));
 button.addEventListener('click',()=>{paused=!paused;try{localStorage.setItem(key,paused?'paused':'enabled');}catch{}sync();});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
 window.addEventListener('pagehide',()=>{suspended=true;sync();});window.addEventListener('pageshow',()=>{suspended=false;sync();});
 window.addEventListener('storage',event=>{if(event.key===key){paused=event.newValue==='paused';sync();}});
 window.addEventListener('message',event=>{if(parent===window||event.source!==parent||event.origin!==location.origin||event.data?.type!=='portfolio-assistant-active'||typeof event.data.active!=='boolean')return;assistantSuspended=event.data.active;sync();});
 select();sync();
})();

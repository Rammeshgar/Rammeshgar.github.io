const section=document.querySelector('.hero-scroll'),canvas=document.querySelector('#hero-frames'),context=canvas.getContext('2d',{alpha:false}),art=canvas.parentElement,film=document.querySelector('#hero-video');
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:700px)');
const COUNT=158,LIMIT=16,cache=new Map(),pending=new Set(),failed=new Set();
const compressed=new Map();let warmCursor=0,warmJobs=0;
let directory=mobile.matches||navigator.connection?.saveData?'mobile':'desktop',queue=[],active=true,raf=0,target=0,position=0,last=0,lastPaint=-1,center=0,previousDirection=1;
let width=0,height=0,draws=0;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function evict(){
 while(cache.size>LIMIT){const key=[...cache.keys()].sort((a,b)=>Math.abs(b-center)-Math.abs(a-center))[0];cache.get(key)?.close?.();cache.delete(key);}
}
function wake(){if(!raf&&active&&!reduced.matches&&!document.hidden)raf=requestAnimationFrame(tick);}
function compressedFrame(index,dir=directory){
 const key=dir+'/'+index;if(compressed.has(key))return compressed.get(key);
 const job=fetch(`hero-frames/${dir}/frame-${String(index+1).padStart(4,'0')}.webp`,{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('Frame unavailable');return r.blob();});
 compressed.set(key,job);job.catch(()=>compressed.delete(key));return job;
}
function warm(){
 // Keep the compressed film ready (~9.8 MB desktop / 4.2 MB mobile), but only
 // sixteen decoded frames. Skip whole-film warming under Save-Data.
 if(navigator.connection?.saveData||reduced.matches||!active||document.hidden)return;
 while(warmJobs<2&&warmCursor<COUNT){
  warmJobs++;const dir=directory;
  (async()=>{while(warmCursor<COUNT&&active&&!document.hidden&&directory===dir){const index=warmCursor++;try{await compressedFrame(index,dir);}catch{}}})().finally(()=>{warmJobs--;});
 }
}
function pump(){
 if(reduced.matches||!active||document.hidden)return;
 while(pending.size<2&&queue.length){
  const index=queue.shift();if(cache.has(index)||pending.has(index)||failed.has(index))continue;
  const sourceDirectory=directory;pending.add(index);
  compressedFrame(index)
   .then(blob=>createImageBitmap(blob))
   .then(image=>{if(directory!==sourceDirectory){image.close();return;}cache.set(index,image);evict();wake();warm();})
   .catch(()=>{if(directory===sourceDirectory)failed.add(index);})
   .finally(()=>{pending.delete(index);if(directory!==sourceDirectory)prepare(position);else pump();});
 }
}
function prepare(value){
 center=Math.round(value);const direction=target>=value?1:-1;
 const next=[Math.floor(value),Math.ceil(value)];
 for(let i=1;i<=9;i++)next.push(center+i*direction);
 for(let i=1;i<=3;i++)next.push(center-i*direction);
 queue=[...new Set(next)].filter(i=>i>=0&&i<COUNT&&!cache.has(i)&&!pending.has(i)&&!failed.has(i));
 previousDirection=direction;pump();
}
function paint(image){
 const scale=Math.max(width/image.width,height/image.height),w=image.width*scale,h=image.height*scale;
 context.globalAlpha=1;context.globalCompositeOperation='copy';context.drawImage(image,(width-w)/2,(height-h)/2,w,h);context.globalCompositeOperation='source-over';
}
function tick(now){
 raf=0;if(!active||document.hidden||reduced.matches)return;
 const dt=last?Math.min((now-last)/1000,.05):1/60;last=now;
 // Native scroll stays untouched. Only the artwork follows a short easing tail.
 position+=(target-position)*(1-Math.exp(-dt/0.095));
 if(Math.abs(target-position)<.015)position=target;
 const index=Math.round(position);
 if(index!==lastPaint){
  const image=cache.get(index);
  if(image){paint(image);lastPaint=index;draws++;canvas.classList.add('ready');canvas.dataset.frame=String(index);canvas.dataset.draws=String(draws);}
  // Keep the last painted frame during a cold-cache miss; never clear to blank.
 }
 if(center!==Math.round(position)||previousDirection!==(target>=position?1:-1))prepare(position);
 if(Math.abs(target-position)>.015)wake();
}
function measure(){
 const bounds=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,1.25);
 width=Math.max(1,Math.round(bounds.width*dpr));height=Math.max(1,Math.round(bounds.height*dpr));
 if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;lastPaint=-1;}
}
function scroll(){const rect=section.getBoundingClientRect();target=clamp(-rect.top/Math.max(1,section.offsetHeight-innerHeight))*(COUNT-1);wake();}
function resize(){
 const next=mobile.matches||navigator.connection?.saveData?'mobile':'desktop';
 if(next!==directory){for(const image of cache.values())image.close?.();cache.clear();compressed.clear();failed.clear();directory=next;lastPaint=-1;warmCursor=0;}
 measure();scroll();prepare(position);if(cache.size)warm();
}
addEventListener('scroll',scroll,{passive:true});addEventListener('resize',resize,{passive:true});
new IntersectionObserver(entries=>{active=entries[0].isIntersecting;if(active){last=0;resize();}},{rootMargin:'120px'}).observe(section);
reduced.addEventListener('change',()=>{if(reduced.matches){cancelAnimationFrame(raf);raf=0;canvas.classList.remove('ready');}else resize();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{last=0;scroll();pump();}});
film.addEventListener('play',()=>{art.classList.add('playing-film');film.classList.add('ready');});
film.addEventListener('pause',()=>{art.classList.remove('playing-film');film.classList.remove('ready');});
resize();

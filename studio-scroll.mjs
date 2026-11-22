// Desktop-only, locally bundled smooth wheel scrolling. Native navigation,
// touch, data-saving, reduced motion and modal scrolling are never replaced.
const root=document.documentElement;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const desktop=matchMedia('(pointer:fine) and (hover:hover)');
let instance,generation=0,disposed=false,anchorSuspended=false,anchorTimer=0,raf=0;
const allowed=()=>!disposed&&!anchorSuspended&&!document.hidden&&!reduced.matches&&desktop.matches&&!navigator.connection?.saveData&&!root.classList.contains('studio-assistant-open')&&!document.querySelector('dialog[open]');
function stop(){++generation;if(raf)cancelAnimationFrame(raf);raf=0;instance?.destroy();instance=null;root.dataset.scrollMode='native';}
function tick(time){raf=0;if(!instance||!allowed())return;instance.raf(time);if(instance.isScrolling==='smooth')raf=requestAnimationFrame(tick);}
function kick(){if(raf||!instance||!allowed())return;instance.raf(performance.now());raf=requestAnimationFrame(tick);}
async function sync(){
  if(!allowed()){stop();return;}
  if(instance)return;
  const ticket=++generation;
  try{
    const {default:Lenis}=await import('/assets/vendor/lenis/lenis.mjs');
    if(ticket!==generation||!allowed())return;
    instance=new Lenis({autoRaf:false,smoothWheel:true,syncTouch:false,lerp:.13,anchors:false,allowNestedScroll:false,prevent:node=>Boolean(node.closest?.('dialog,textarea,input,select,[data-lenis-prevent],.map-scroller')),stopInertiaOnNavigate:true,respectReducedMotion:true});
    instance.on('virtual-scroll',kick);root.dataset.scrollMode='enhanced';
  }catch{stop();}
}
function finishAnchor(){if(!anchorSuspended)return;anchorSuspended=false;clearTimeout(anchorTimer);anchorTimer=0;sync();}
function onAnchor(event){
  if(!instance||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const link=event.target.closest?.('a[href]');if(!link||link.target==='_blank')return;
  let target;try{target=new URL(link.href);}catch{return;}
  if(target.origin!==location.origin||target.pathname!==location.pathname||!target.hash)return;
  // Native anchor default action owns the sticky hero's layout and hash.
  anchorSuspended=true;stop();clearTimeout(anchorTimer);anchorTimer=setTimeout(finishAnchor,1800);
}
root.dataset.scrollMode='native';
const observer=new MutationObserver(sync);observer.observe(root,{attributes:true,attributeFilter:['class']});observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
for(const event of ['visibilitychange','studio-assistant-open','studio-assistant-close'])document.addEventListener(event,sync);
reduced.addEventListener('change',sync);desktop.addEventListener('change',sync);navigator.connection?.addEventListener?.('change',sync);
document.addEventListener('click',onAnchor,true);window.addEventListener('scrollend',finishAnchor);
window.addEventListener('pagehide',()=>{disposed=true;clearTimeout(anchorTimer);stop();observer.disconnect();document.removeEventListener('click',onAnchor,true);window.removeEventListener('scrollend',finishAnchor);for(const event of ['visibilitychange','studio-assistant-open','studio-assistant-close'])document.removeEventListener(event,sync);reduced.removeEventListener('change',sync);desktop.removeEventListener('change',sync);navigator.connection?.removeEventListener?.('change',sync);},{once:true});
sync();

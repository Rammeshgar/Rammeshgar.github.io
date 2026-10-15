/* One active teaching figure across all project cards. Navigation stays native. */
let owner=null;
let paused=false;
const previews=[],motionControl=document.getElementById('project-preview-motion');
function syncControl(){
 const saveData=!!globalThis.navigator?.connection?.saveData;
 motionControl.disabled=saveData;
 motionControl.setAttribute('aria-pressed',String(paused));
 motionControl.textContent=saveData?'Previews off · Data saver':paused?'Enable previews':'Pause previews';
}
function preview({card,frame,url,exchange=false}){
 const host=card.querySelector('.index-media');let hover=false,focus=false,suppressed=false,visible=false,ready=false,active=false;
 const api={deactivate(){hover=false;focus=false;suppressed=true;sync();},sync};
 previews.push(api);
 function sync(){
  active=(hover||focus)&&!paused&&!suppressed&&visible&&!document.hidden&&!globalThis.navigator?.connection?.saveData;
  if(active&&owner!==api){owner?.deactivate();owner=api;}else if(!active&&owner===api)owner=null;
  if(active&&!frame.getAttribute('src'))frame.src=url;
  host.classList.toggle('preview-active',active&&ready);
  if(ready)frame.contentWindow.postMessage({type:exchange?'exchange-anatomy':'portfolio-figure',theme:globalThis.PortfolioTheme?.current||'light',open:active},location.origin);
 }
 card.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'||event.pointerType==='pen'){hover=true;suppressed=false;sync();}});
 card.addEventListener('pointerleave',()=>{hover=false;suppressed=false;sync();});
 card.addEventListener('focusin',()=>{focus=true;suppressed=false;sync();});
 card.addEventListener('focusout',event=>{if(!card.contains(event.relatedTarget)){focus=false;sync();}});
 new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;sync();},{threshold:.1}).observe(host);
 window.addEventListener('message',event=>{if(event.source!==frame.contentWindow||event.origin!==location.origin||event.data?.type!==(exchange?'exchange-anatomy-ready':'portfolio-figure-ready'))return;ready=true;sync();});
 document.addEventListener('visibilitychange',sync);globalThis.navigator?.connection?.addEventListener?.('change',sync);
 document.addEventListener('portfolio-theme-change',sync);
 window.addEventListener('pagehide',()=>{hover=false;focus=false;sync();});
}
motionControl.addEventListener('click',()=>{paused=!paused;syncControl();previews.forEach(api=>api.sync());});
globalThis.navigator?.connection?.addEventListener?.('change',syncControl);
syncControl();
preview({card:document.getElementById('exchange-case'),frame:document.getElementById('exchange-machine-preview'),url:'exchange-universe/guide.html?view=guide&layout=preview',exchange:true});
for(const card of document.querySelectorAll?.('[data-figure-preview]')||[]){const name=card.dataset.figurePreview;preview({card,frame:document.getElementById(name+'-machine-preview'),url:name+'/guide.html?view=guide&layout=preview'});}

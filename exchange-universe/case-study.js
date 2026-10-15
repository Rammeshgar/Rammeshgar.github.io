(()=>{'use strict';
 const map=document.getElementById('system-map'),guide=document.getElementById('animated-guide');
 const allowedParts=new Set(['cache','worker','queue','gate']),allowedStories=new Set(['compare','refresh','history','wait']);
 let guideVisible=false,pendingSelection=null,guideReady=false,suspended=false;
 function loadGuide(){if(!guide.getAttribute('src'))guide.src='guide.html?view=guide&layout=compact';}
 function tellGuide(){
  if(!guide.contentWindow||!guideReady)return;
  const open=guideVisible&&!document.hidden&&!suspended;
  guide.contentWindow.postMessage({type:'exchange-anatomy',theme:globalThis.PortfolioTheme?.current||'light',open},location.origin);
  if(open&&pendingSelection){guide.contentWindow.postMessage({type:'exchange-case-selection',...pendingSelection},location.origin);pendingSelection=null;}
 }
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{
  guideVisible=entries.at(-1).isIntersecting;if(guideVisible)loadGuide();tellGuide();
 },{threshold:.05}).observe(guide);
 else{guideVisible=true;loadGuide();}
 function followExplanationLink(){
  const name=location.hash.slice(1);if(name!=='map'&&name!=='guide')return;
  const target=document.getElementById(name);target.scrollIntoView({block:'start',behavior:'auto'});target.focus({preventScroll:true});if(name==='guide')loadGuide();
 }
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||!event.data||typeof event.data!=='object')return;
  const m=event.data;
  if(event.source===map.contentWindow){
   if(m.type==='exchange-case-map-height'&&Number.isFinite(m.height)&&m.height>=200&&m.height<=3000)map.dataset.naturalHeight=String(Math.ceil(m.height));
   if(m.type==='exchange-case-guide'&&allowedParts.has(m.part)&&allowedStories.has(m.story)){
    pendingSelection={part:m.part,story:m.story};loadGuide();history.replaceState(null,'','#guide');
    document.getElementById('guide').focus({preventScroll:true});document.getElementById('panel-guide').scrollIntoView({block:'nearest',behavior:'auto'});tellGuide();
   }
  }else if(event.source===guide.contentWindow){
   if(m.type==='exchange-anatomy-ready'){guideReady=true;tellGuide();}
   if(m.type==='exchange-anatomy-height'&&Number.isFinite(m.height)&&m.height>=200&&m.height<=3000)guide.dataset.naturalHeight=String(Math.ceil(m.height));
   if(m.type==='exchange-anatomy-close'){history.replaceState(null,'','#map');document.getElementById('map').focus({preventScroll:true});}
  }
 });
 guide.addEventListener('load',tellGuide);
 map.addEventListener('load',()=>map.contentWindow?.postMessage({type:'exchange-case-map-measure'},location.origin));
 document.addEventListener('visibilitychange',tellGuide);
 window.addEventListener('pagehide',()=>{suspended=true;tellGuide();});
 window.addEventListener('pageshow',()=>{suspended=false;tellGuide();});
 window.addEventListener('hashchange',followExplanationLink);followExplanationLink();
document.addEventListener('portfolio-theme-change',tellGuide);
})();

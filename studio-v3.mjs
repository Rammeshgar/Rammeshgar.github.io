const root = document.documentElement;
const assistantIsOpen = () => root.classList.contains('studio-assistant-open');
const themeBtn = document.querySelector('#theme-toggle');
const motionBtn = document.querySelector('#motion-toggle');
const artwork = document.querySelector('#v3-instrument');
const heroStory = document.querySelector('.hero-story');
const heroPanel = document.querySelector('.hero');
const heroHeader = document.querySelector('.site-header');
const reviewStrip = document.querySelector('.review-strip');
const buttons = [...document.querySelectorAll('button[data-stage]')];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const compact = matchMedia('(max-width: 960px), (max-height: 759px), (hover: none)');
const state = {theme:'light', stage:0,paused:reduceMotion.matches,scene:null,loaded:false,fields:[],fieldPaused:false};
const narrowInstrument=()=>innerWidth<=720;
let instrumentRequested=false,instrumentExplicit=false;
let manualStageUntil=0;
const descriptions = [
  ['01 / Define','Start with a clear request.','What needs to happen, and how will I know it worked?'],
  ['02 / Connect','Put the parts in the right order.','Each dependency, input and handoff needs a place in the workflow.'],
  ['03 / Verify','Check the result. Keep the evidence.','Record what happened, including anything that failed.']
];
const moon = '<path d="M20.8 14.4A9 9 0 0 1 9.6 3.2 9 9 0 1 0 20.8 14.4Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>';
const sun = '<circle cx="12" cy="12" r="4.3" stroke="currentColor" stroke-width="1.6"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2.2 2.2m9.6 9.6L19 19M19 5l-2.2 2.2m-9.6 9.6L5 19" stroke="currentColor" stroke-width="1.6"/>';
function setTheme(theme) {
  if(!['light','dark'].includes(theme)) return;
  root.classList.add('theme-changing');state.theme=theme;root.dataset.theme=theme;
  const dark=theme==='dark';themeBtn.setAttribute('aria-pressed',String(dark));themeBtn.setAttribute('aria-label',`Switch to ${dark?'day':'night'} theme`);themeBtn.querySelector('span').textContent=dark?'Day':'Night';themeBtn.querySelector('svg').innerHTML=dark?sun:moon;
  state.scene?.setTheme(theme);for(const field of state.fields){const palette=field.variant==='contact'?'dark':theme;field.container.dataset.theme=palette;field.renderer?.setTheme(palette);}
  requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.remove('theme-changing')));
}
function setStage(stage) {
  if(!descriptions[stage]) return;
  state.stage=stage;artwork.dataset.stage=String(stage);
  const [label,title,copy]=descriptions[stage];document.querySelector('#stage-label').textContent=label;document.querySelector('#illustration-title').textContent=title;document.querySelector('#illustration-copy').textContent=copy;document.querySelector('#visual-number').textContent=`0${stage+1}`;
  buttons.forEach((button,index)=>button.setAttribute('aria-pressed',String(index===stage)));
  state.scene?.setStage(stage);
}
function setPause(pause) {
  state.paused=pause;
  state.scene?.setPaused(pause||assistantIsOpen());updateStageHint();
}
function updateStageHint(){
  const live=artwork.dataset.renderer==='webgl',limited=reduceMotion.matches||navigator.connection?.saveData;
  const canStart=!limited&&!live&&!state.loaded&&narrowInstrument()&&!instrumentRequested;
  const preparing=!limited&&!live&&!state.loaded&&narrowInstrument()&&instrumentRequested;
  motionBtn.disabled=Boolean(limited)||(!live&&!canStart);
  motionBtn.setAttribute('aria-pressed',String(live&&state.paused));
  motionBtn.setAttribute('aria-label',canStart?'Start the interactive 3D illustration':preparing?'Preparing the interactive 3D illustration':state.paused?'Resume illustration motion':'Pause illustration motion');
  motionBtn.querySelector('span').textContent=canStart||state.paused?'▶':'Ⅱ';
  motionBtn.querySelector('b').textContent=canStart?'Start 3D':preparing?'Loading…':state.paused?'Play':'Pause';
  document.querySelector('#hero-interaction-label').textContent=live?'Click a component':canStart?'Explore live 3D':'Workflow illustration';
  document.querySelector('#stage-hint').textContent=reduceMotion.matches?'Reduced motion is on. Choose a stage.':canStart?'Start 3D or choose a stage.':preparing?'The still remains available as the live illustration loads.':!live?'Select a stage to read.':state.paused?'Paused. Click a component or choose a stage.':heroStory.dataset.sticky==='true'?'Click a component, select a stage, or scroll.':'Click a component or select a stage.';
}
setTheme(window.PortfolioTheme?.current||root.dataset.theme);
document.addEventListener('portfolio-theme-change',event=>setTheme(event.detail.theme));
themeBtn.addEventListener('click',()=>window.PortfolioTheme?.toggle());
motionBtn.addEventListener('click',()=>{if(reduceMotion.matches||navigator.connection?.saveData)return;if(!state.loaded&&narrowInstrument()){requestInstrument(true);return;}setPause(!state.paused);});buttons.forEach((button,index)=>button.addEventListener('click',()=>{manualStageUntil=performance.now()+850;setStage(index);if(narrowInstrument())requestInstrument(true);}));
setStage(0);setPause(state.paused);
reduceMotion.addEventListener('change',()=>{setPause(reduceMotion.matches);queueHeroFit();queueInstrument();});
let stageObserver,lastStage=-1;
function observeStages(){stageObserver?.disconnect();const h=innerHeight;stageObserver=new IntersectionObserver(entries=>{
  if(heroStory.dataset.sticky!=='true'||compact.matches||reduceMotion.matches||state.paused||performance.now()<manualStageUntil)return;
  const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top).at(-1);
  if(visible){const next=Number(visible.target.dataset.scrollStage);if(lastStage!==next){lastStage=next;setStage(next);}}
},{rootMargin:`-${Math.round(h*.17)}px 0px -${Math.round(h*.68)}px 0px`,threshold:0});document.querySelectorAll('.hero-marker').forEach(marker=>stageObserver.observe(marker));}
// Enable the brief scroll-pinned sequence only if every naturally sized hero
// row, including the longest copy and stage controls, fits beneath navigation.
// ResizeObserver catches font changes, zoom, narrow/short windows and captions.
let heroFitFrame=0;
function measureHeroFit(){heroFitFrame=0;const available=innerHeight-heroHeader.offsetHeight-reviewStrip.offsetHeight;const required=heroPanel.offsetHeight;const fits=!compact.matches&&!reduceMotion.matches&&required<=available+2;const next=String(fits);if(heroStory.dataset.sticky!==next){heroStory.dataset.sticky=next;lastStage=-1;observeStages();updateStageHint();}}
function queueHeroFit(){if(!heroFitFrame)heroFitFrame=requestAnimationFrame(measureHeroFit);}
const heroFitObserver=typeof ResizeObserver==='function'?new ResizeObserver(queueHeroFit):null;
[heroPanel,heroHeader,reviewStrip,...document.querySelectorAll('.hero-copy,.hero-art,.hero-grid,.hero-stations,.hero-running')].forEach(el=>heroFitObserver?.observe(el));
function onHeroResize(){observeStages();queueHeroFit();updateStageHint();queueInstrument();}
observeStages();queueHeroFit();window.addEventListener('resize',onHeroResize,{passive:true});compact.addEventListener('change',queueHeroFit);document.fonts?.ready.then(queueHeroFit);
// The native article and exact still poster paint first. The interactive
// renderer has no reason to parse Three or compile shaders before that first
// readable frame, or while the artwork has already left the viewport.
let instrumentRatio=0,instrumentLoading=false,instrumentIdle=0,instrumentFrame=0,instrumentDisposed=false,instrumentFirstPaintReady=false;
const allowedInstrument=()=>instrumentRatio>=(narrowInstrument()&&!instrumentExplicit ? .55 : .04)&&(!narrowInstrument()||instrumentRequested)&&!instrumentDisposed&&!document.hidden&&!assistantIsOpen()&&!reduceMotion.matches&&!navigator.connection?.saveData;
function cancelInstrumentQueue(){if(instrumentFrame)cancelAnimationFrame(instrumentFrame);instrumentFrame=0;if(instrumentIdle){if('cancelIdleCallback'in window)cancelIdleCallback(instrumentIdle);else clearTimeout(instrumentIdle);}instrumentIdle=0;}
function queueInstrument(){
  if(state.loaded||instrumentLoading||instrumentDisposed||!instrumentFirstPaintReady)return;
  if(!allowedInstrument()){cancelInstrumentQueue();artwork.dataset.renderer='static';updateStageHint();return;}
  if(instrumentFrame||instrumentIdle)return;
  // Two animation frames establish a paint opportunity. Idle scheduling is
  // bounded; this is eager progressive enhancement, not an interaction gate.
  instrumentFrame=requestAnimationFrame(()=>{instrumentFrame=requestAnimationFrame(()=>{instrumentFrame=0;if(!allowedInstrument())return;const start=()=>{instrumentIdle=0;loadInstrument();};instrumentIdle='requestIdleCallback'in window?requestIdleCallback(start,{timeout:360}):setTimeout(start,0);});});
}
async function loadInstrument(){
  if(state.loaded||instrumentLoading||!allowedInstrument())return;
  instrumentLoading=true;
  try{
    const {mountInstrument}=await import('./studio-v3-scene.mjs');
    if(!allowedInstrument())return;
    const scene=await mountInstrument(artwork,{theme:state.theme,initialStage:state.stage,initialPaused:state.paused||assistantIsOpen(),shouldMount:allowedInstrument,onStage:(index,source)=>{if(source==='object'){manualStageUntil=performance.now()+850;setStage(index);}}});
    if(!scene)return;
    if(instrumentDisposed){scene.dispose();return;}
    state.scene=scene;state.loaded=true;scene.setStage(state.stage);scene.setTheme(state.theme);scene.setPaused(state.paused||assistantIsOpen());motionBtn.disabled=reduceMotion.matches||artwork.dataset.renderer!=='webgl';updateStageHint();
  }catch(error){state.loaded=true;console.warn('Using the still illustration.',error);motionBtn.disabled=true;artwork.dataset.renderer='static';document.querySelector('#stage-hint').textContent='Still illustration. Select a stage to read.';}
  finally{instrumentLoading=false;if(!state.loaded)queueInstrument();}
}
const renderObserver=new IntersectionObserver(entries=>{
  const entry=entries.at(-1);
  // On a narrow viewport, wait until most of the instrument is actually
  // visible. A sliver beneath the introduction doesn't need a GPU yet.
  instrumentRatio=entry?.isIntersecting?entry.intersectionRatio:0;mobileScroll();queueInstrument();
},{threshold:[0,.04,.55]});renderObserver.observe(artwork);
function requestInstrument(explicit=false){
  if(!narrowInstrument()||state.loaded||reduceMotion.matches||navigator.connection?.saveData)return;
  instrumentRequested=true;if(explicit)instrumentExplicit=true;updateStageHint();queueInstrument();
  if(explicit&&instrumentRatio<.04)artwork.scrollIntoView({block:'nearest',behavior:'auto'});
}
function mobileScroll(){if(narrowInstrument()&&window.scrollY>12&&instrumentRatio>=.55&&!instrumentRequested)requestInstrument(false);}
function mobileArtworkPointer(){if(narrowInstrument()&&!state.loaded)requestInstrument(true);}
window.addEventListener('scroll',mobileScroll,{passive:true});artwork.addEventListener('pointerdown',mobileArtworkPointer,{passive:true});
// Render the real introductory content and the existing still before any
// WebGL work. Two animation frames in queueInstrument then allow that ready
// content a paint opportunity rather than racing image decode or font layout.
const instrumentStill=artwork.querySelector('.instrument-poster');
Promise.allSettled([document.fonts?.ready,instrumentStill?.decode?.()]).then(()=>{instrumentFirstPaintReady=true;queueInstrument();});
document.addEventListener('visibilitychange',queueInstrument);navigator.connection?.addEventListener?.('change',queueInstrument);
const heroRendererObserver=new MutationObserver(updateStageHint);heroRendererObserver.observe(artwork,{attributes:true,attributeFilter:['data-renderer']});

// Three chapter-specific backgrounds share one motion policy. Only the field
// with the most visible surface renders; another entering the viewport stays
// still, and the hero instrument always takes precedence.
state.fields=[...document.querySelectorAll('[data-contour-variant]')].map(container=>{
  const section=container.closest('section'),variant=container.dataset.contourVariant;container.dataset.renderer='static';container.dataset.theme=variant==='contact'?'dark':state.theme;return{container,section,variant,pause:section.querySelector('[data-field-pause]'),pulse:section.querySelector('[data-field-pulse]'),visibleHeight:0,renderer:null,loading:false,failed:false};
});
let activeField=null,heroVisible=true,previewBusy=false;
function fieldAllowed(){return !assistantIsOpen()&&!reduceMotion.matches&&!navigator.connection?.saveData;}
function refreshFieldControls(){for(const field of state.fields){const live=field.container.dataset.renderer==='webgl'&&fieldAllowed()&&Boolean(field.renderer);field.pause.disabled=!live;field.pulse.disabled=!live||state.fieldPaused||activeField!==field||heroVisible;field.pause.setAttribute('aria-pressed',String(state.fieldPaused));field.pause.setAttribute('aria-label',!live?'Still contour background':state.fieldPaused?'Resume all contour backgrounds':'Pause all animated contour backgrounds');field.pause.textContent=!live?'Still backdrop':state.fieldPaused?'Resume backdrop':'Pause backdrop';}}
function syncContour(){activeField=heroVisible||previewBusy||!fieldAllowed()?null:state.fields.filter(field=>field.visibleHeight>12).sort((a,b)=>b.visibleHeight-a.visibleHeight)[0]||null;for(const field of state.fields){field.container.dataset.active=String(field===activeField);field.renderer?.setPaused(state.fieldPaused||field!==activeField||!fieldAllowed());}if(activeField)loadContour(activeField);refreshFieldControls();}
async function loadContour(field){if(field.renderer||field.loading||field.failed||field!==activeField||!fieldAllowed())return;field.loading=true;try{const {mountContourField}=await import('./studio-v3-field.mjs');field.renderer=await mountContourField(field.container,{theme:field.variant==='contact'?'dark':state.theme,interactionRoot:field.section,variant:field.variant,initialPaused:state.fieldPaused||field!==activeField||heroVisible||!fieldAllowed()});if(!field.renderer){field.failed=true;field.container.dataset.renderer='static';}syncContour();}catch(error){console.warn('Using the still contour background.',error);field.failed=true;field.container.dataset.renderer='static';refreshFieldControls();}finally{field.loading=false;}}
const contourRendererObserver=new MutationObserver(refreshFieldControls);
const contourVisibility=new IntersectionObserver(entries=>{for(const item of entries){const field=state.fields.find(x=>x.container===item.target);if(field)field.visibleHeight=item.isIntersecting?item.intersectionRect.height:0;}syncContour();},{threshold:[0,.04,.15,.30,.50,.70,.90,1]});
for(const field of state.fields){contourRendererObserver.observe(field.container,{attributes:true,attributeFilter:['data-renderer']});contourVisibility.observe(field.container);field.pause.addEventListener('click',()=>{state.fieldPaused=!state.fieldPaused;syncContour();});field.pulse.addEventListener('click',()=>{if(!state.fieldPaused&&fieldAllowed()&&activeField===field)field.renderer?.pulse();});}
const foregroundVisibility=new IntersectionObserver(entries=>{heroVisible=Boolean(entries.at(-1)?.isIntersecting);syncContour();},{threshold:[0,.01]});foregroundVisibility.observe(artwork);
reduceMotion.addEventListener('change',syncContour);navigator.connection?.addEventListener?.('change',syncContour);refreshFieldControls();

// Small, deterministic teaching example. No external quotes or test runs are performed.
const conversion={amount:100,mismatch:false};
const format=value=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:2}).format(value);
const result=document.querySelector('#check-outcome');
const amountButtons=[...document.querySelectorAll('[data-amount]')];
const mismatch=document.querySelector('#mismatch-toggle');
function renderConversion(){const first=conversion.amount*400,expectedCents=first*2*100,reportedCents=expectedCents+(conversion.mismatch?12:0),difference=Math.abs(reportedCents-expectedCents),passed=difference<=2;document.querySelector('#bench-first').textContent=`First reading: ${format(first)} HUF at ${conversion.amount} EUR. Next input: ${conversion.amount*2} EUR.`;document.querySelector('#expected-amount').textContent=format(expectedCents/100);document.querySelector('#reported-amount').textContent=format(reportedCents/100);result.dataset.result=passed?'pass':'fail';result.querySelector('.outcome-icon').textContent=passed?'✓':'×';result.querySelector('strong').textContent=passed?'PASS':'FAIL';document.querySelector('#check-message').textContent=passed?`Difference: ${(difference/100).toFixed(2)} HUF (within 0.02 HUF tolerance).`:`Difference: ${(difference/100).toFixed(2)} HUF (exceeds 0.02 HUF tolerance).`;amountButtons.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.amount)===conversion.amount)));mismatch.setAttribute('aria-pressed',String(conversion.mismatch));
  if(!reduceMotion.matches&&result.animate) result.animate([{opacity:.6,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});
}
amountButtons.forEach(button=>button.addEventListener('click',()=>{conversion.amount=Number(button.dataset.amount);renderConversion();}));mismatch.addEventListener('click',()=>{conversion.mismatch=!conversion.mismatch;renderConversion();});

// Illustrative prerequisite model. Actions only change the drawing and teaching state.
const prereqs={a:false,b:false};
const dependency=document.querySelector('#dependency-diagram'), dependencyStatus=document.querySelector('#dependency-status'),prereqButtons=[...document.querySelectorAll('[data-prerequisite]')];
function renderDependency(){const ready=prereqs.a&&prereqs.b;dependency.classList.toggle('a-complete',prereqs.a);dependency.classList.toggle('b-complete',prereqs.b);dependency.classList.toggle('ready',ready);document.querySelector('#node-a-label').textContent=prereqs.a?'A complete ✓':'Prerequisite A';document.querySelector('#node-b-label').textContent=prereqs.b?'B complete ✓':'Prerequisite B';document.querySelector('#node-next-label').textContent=ready?'Ready to start':'Waiting';dependencyStatus.dataset.state=ready?'ready':'waiting';dependencyStatus.textContent=ready?'Both prerequisites complete. The dependent task is ready.':`Waiting for ${prereqs.a?'task B':prereqs.b?'task A':'tasks A and B'}.`;prereqButtons.forEach(button=>button.setAttribute('aria-pressed',String(prereqs[button.dataset.prerequisite])));}
// Preview is visual-only, never a simulated result. Pointer and keyboard
// focus highlight the same existing path; only activating a native button
// changes the completed flag and live waiting/ready description.
let dependencyPointer=null,dependencyFocus=null;
function previewDependency(){
  const key=dependencyPointer||dependencyFocus;
  if(key)dependency.dataset.preview=key;else delete dependency.dataset.preview;
}
prereqButtons.forEach(button=>{
  const key=button.dataset.prerequisite;
  button.addEventListener('pointerenter',event=>{if(event.pointerType==='touch')return;dependencyPointer=key;previewDependency();});
  button.addEventListener('pointerleave',()=>{if(dependencyPointer===key)dependencyPointer=null;previewDependency();});
  button.addEventListener('focus',()=>{if(button.matches(':focus-visible'))dependencyFocus=key;previewDependency();});
  button.addEventListener('blur',()=>{if(dependencyFocus===key)dependencyFocus=null;previewDependency();});
  button.addEventListener('keydown',()=>{if(button.matches(':focus-visible')){dependencyFocus=key;previewDependency();}});
  button.addEventListener('click',()=>{prereqs[key]=!prereqs[key];renderDependency();});
});

// A real, local illustrative guide replaces a screenshot only on deliberate
// pointer hover or keyboard focus. The original link stays a normal link; the
// iframe is a decorative sibling, not a second tab stop or click surface.
const previewLinks=[...document.querySelectorAll('a[data-preview-src][data-preview-protocol]')];
const previewConnection=navigator.connection;
let previewHover=null,previewFocus=null,previewDismissed=null,previewActive=null,previewRetiring=null,previewDelay=0,previewPending=null;
const previewAllowed=()=>!assistantIsOpen()&&!document.hidden&&!reduceMotion.matches&&!previewConnection?.saveData;
const previewVisible=link=>{
  if(!link?.isConnected)return false;
  const bounds=link.getBoundingClientRect();
  return bounds.width>1&&bounds.height>1&&Math.min(bounds.bottom,innerHeight)-Math.max(bounds.top,0)>16&&Math.min(bounds.right,innerWidth)-Math.max(bounds.left,0)>16;
};
const previewCandidate=()=>{
  if(!previewAllowed())return null;
  for(const link of [previewHover,previewFocus])if(link&&link!==previewDismissed&&previewVisible(link))return link;
  return null;
};
const previewMessage=(record,open)=>{
  if(!record?.frame.contentWindow)return;
  const type=record.protocol==='exchange'?'exchange-anatomy':'portfolio-figure';
  record.frame.contentWindow.postMessage({type:'portfolio-theme',theme:state.theme},location.origin);
  record.frame.contentWindow.postMessage({type,open,theme:state.theme},location.origin);
};
function cancelPreviewDelay(){if(previewDelay)clearTimeout(previewDelay);previewDelay=0;previewPending=null;}
function removeRetiringPreview(){if(!previewRetiring)return;clearTimeout(previewRetiring.removeTimer);previewRetiring.frame.remove();previewRetiring=null;}
function hidePreview(immediate=false){
  cancelPreviewDelay();if(immediate)removeRetiringPreview();
  const record=previewActive;if(!record)return;
  previewActive=null;
  // Send the pause before hiding. Even during a short crossfade the previous
  // guide can no longer keep its render loop running offscreen.
  previewMessage(record,false);record.sizeObserver?.disconnect();clearTimeout(record.readyTimer);
  record.frame.classList.remove('preview-visible');record.link.removeAttribute('data-preview-active');record.link.removeAttribute('data-preview-ready');
  if(immediate||reduceMotion.matches){record.frame.remove();return;}
  removeRetiringPreview();previewRetiring=record;
  record.removeTimer=setTimeout(()=>{record.frame.remove();if(previewRetiring===record)previewRetiring=null;},200);
}
function fitPreview(record){
  if(previewActive!==record)return;
  const a=record.link.getBoundingClientRect(),b=record.host.getBoundingClientRect(),hostLeft=record.host.clientLeft,hostTop=record.host.clientTop;
  if(a.width<2||a.height<2)return;
  Object.assign(record.frame.style,{left:`${a.left-b.left-hostLeft}px`,top:`${a.top-b.top-hostTop}px`,width:`${a.width}px`,height:`${a.height}px`});
}
function showPreview(link){
  if(previewCandidate()!==link)return;
  if(previewActive?.link===link)return;
  hidePreview(true);
  const protocol=link.dataset.previewProtocol,source=link.dataset.previewSrc;
  if(!['exchange','portfolio'].includes(protocol)||!source)return;
  let url;try{url=new URL(source,location.href);}catch{return;}
  if(url.origin!==location.origin||!['http:','https:'].includes(url.protocol))return;
  const host=link.parentElement;if(!host)return;
  host.classList.add('project-preview-host');
  const frame=document.createElement('iframe');
  frame.className='project-preview-frame';frame.setAttribute('title',link.dataset.previewTitle||`${link.getAttribute('aria-label')||link.querySelector('img')?.alt||'Project'} — animated guide preview`);
  frame.setAttribute('aria-hidden','true');frame.setAttribute('tabindex','-1');frame.setAttribute('scrolling','no');frame.referrerPolicy='no-referrer';frame.style.pointerEvents='none';
  frame.dataset.previewProtocol=protocol;frame.setAttribute('src',url.pathname+url.search+url.hash);
  const record={link,host,frame,protocol,ready:false,sizeObserver:null,readyTimer:0};
  previewActive=record;link.dataset.previewActive='true';link.dataset.previewReady='false';
  // Attach sibling rather than wrapping/replacing the focusable anchor.
  link.after(frame);fitPreview(record);
  if('ResizeObserver'in window){record.sizeObserver=new ResizeObserver(()=>fitPreview(record));record.sizeObserver.observe(link);record.sizeObserver.observe(host);}
  frame.addEventListener('load',()=>{if(previewActive===record)previewMessage(record,previewCandidate()===link);},{once:true});
  // An unavailable guide never obscures its real screenshot or hangs a blank
  // overlay over the link. Waiting for its own ready handshake is deliberate.
  record.readyTimer=setTimeout(()=>{if(previewActive===record&&!record.ready){hidePreview(true);previewBusy=false;syncContour();}},8500);
}
function syncPreview(){
  const next=previewCandidate();
  // A guide and its background do not need to compete for the same GPU.
  // Restore the background on exit, without changing the manual pause state.
  if(Boolean(next)!==previewBusy){previewBusy=Boolean(next);syncContour();}
  if(previewActive?.link===next){if(previewActive?.ready)previewMessage(previewActive,true);return;}
  if(!next){
    const offscreen=Boolean(previewActive&&!previewVisible(previewActive.link));
    if(offscreen&&previewHover===previewActive.link)previewHover=null;
    hidePreview(offscreen||document.hidden||!previewAllowed());
    if(previewRetiring&&!previewVisible(previewRetiring.link))removeRetiringPreview();
    return;
  }
  if(previewActive)hidePreview(true);
  if(previewPending===next)return;
  cancelPreviewDelay();previewPending=next;
  previewDelay=setTimeout(()=>{previewDelay=0;previewPending=null;showPreview(next);},130);
}
const previewIntersection='IntersectionObserver'in window?new IntersectionObserver(entries=>{
  for(const entry of entries)if(!entry.isIntersecting){
    if(previewHover===entry.target)previewHover=null;
    if(previewActive?.link===entry.target)hidePreview(true);
    if(previewRetiring?.link===entry.target)removeRetiringPreview();
  }
  syncPreview();
},{threshold:[0,.10,.5]}):null;
for(const link of previewLinks){
  previewIntersection?.observe(link);
  link.addEventListener('pointerenter',event=>{if(event.pointerType==='touch')return;previewHover=link;previewDismissed=null;syncPreview();});
  link.addEventListener('pointerleave',()=>{if(previewHover===link)previewHover=null;if(previewDismissed===link&&previewFocus!==link)previewDismissed=null;syncPreview();});
  link.addEventListener('focus',()=>{if(link.matches(':focus-visible')){previewFocus=link;previewDismissed=null;syncPreview();}});
  link.addEventListener('blur',()=>{if(previewFocus===link)previewFocus=null;if(previewDismissed===link&&previewHover!==link)previewDismissed=null;syncPreview();});
  link.addEventListener('keydown',event=>{if(event.key==='Escape'&&previewActive?.link===link){previewDismissed=link;hidePreview(false);}else if(link.matches(':focus-visible')&&previewFocus!==link){previewFocus=link;previewDismissed=null;syncPreview();}});
}
function previewReady(event){
  const record=previewActive;if(!record||event.origin!==location.origin||event.source!==record.frame.contentWindow||!event.data||typeof event.data!=='object')return;
  const expected=record.protocol==='exchange'?'exchange-anatomy-ready':'portfolio-figure-ready';
  if(event.data.type!==expected)return;
  if(previewCandidate()!==record.link){hidePreview(true);return;}
  record.ready=true;clearTimeout(record.readyTimer);previewMessage(record,true);record.link.dataset.previewReady='true';record.frame.classList.add('preview-visible');
}
window.addEventListener('message',previewReady);document.addEventListener('visibilitychange',syncPreview);reduceMotion.addEventListener('change',syncPreview);previewConnection?.addEventListener?.('change',syncPreview);
const previewThemeObserver=new MutationObserver(()=>{if(previewActive?.ready)previewMessage(previewActive,true);});previewThemeObserver.observe(root,{attributes:true,attributeFilter:['data-theme']});
function disposePreviews(){hidePreview(true);previewIntersection?.disconnect();previewThemeObserver.disconnect();window.removeEventListener('message',previewReady);document.removeEventListener('visibilitychange',syncPreview);reduceMotion.removeEventListener('change',syncPreview);previewConnection?.removeEventListener?.('change',syncPreview);}

// The live character is the only foreground animation while its dialog is
// open. Preserve each manual pause choice and resume normal visibility rules
// when the assistant closes.
document.addEventListener('studio-assistant-open',()=>{
  cancelInstrumentQueue();
  state.scene?.setPaused(true);
  previewHover=previewFocus=null;
  hidePreview(true);
  previewBusy=false;
  syncContour();
});
document.addEventListener('studio-assistant-close',()=>{
  state.scene?.setPaused(state.paused);
  queueInstrument();
  syncContour();
  syncPreview();
});

// Single-pass entrance motion only, with a complete readable no-JS state.
if(!reduceMotion.matches){const revealObserver=new IntersectionObserver(entries=>{for(const item of entries)if(item.isIntersecting){item.target.animate?.([{opacity:.65,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],{duration:620,easing:'cubic-bezier(.2,.75,.3,1)'});revealObserver.unobserve(item.target);}},{threshold:.13});document.querySelectorAll('[data-reveal]').forEach(el=>revealObserver.observe(el));}
window.addEventListener('pagehide',()=>{instrumentDisposed=true;cancelInstrumentQueue();document.removeEventListener('visibilitychange',queueInstrument);window.removeEventListener('scroll',mobileScroll);artwork.removeEventListener('pointerdown',mobileArtworkPointer);navigator.connection?.removeEventListener?.('change',queueInstrument);disposePreviews();state.scene?.dispose();for(const field of state.fields)field.renderer?.dispose();stageObserver?.disconnect();renderObserver.disconnect();heroRendererObserver.disconnect();heroFitObserver?.disconnect();contourVisibility.disconnect();foregroundVisibility.disconnect();contourRendererObserver.disconnect();navigator.connection?.removeEventListener?.('change',syncContour);if(heroFitFrame)cancelAnimationFrame(heroFitFrame);window.removeEventListener('resize',onHeroResize);compact.removeEventListener('change',queueHeroFit);},{once:true});

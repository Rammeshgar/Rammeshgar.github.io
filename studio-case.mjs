/* The private case studies share a theme and reuse their existing source-linked figures. */
import './studio-v3-seneschal.mjs';
const root=document.documentElement;
const key='studio-v3-theme';
const validTheme=x=>x==='light'||x==='dark';
let theme=root.dataset.theme==='dark'?'dark':'light';
try{const saved=localStorage.getItem(key);if(validTheme(saved))theme=saved;}catch{}
const preferenceButtons=[...document.querySelectorAll('[data-case-theme]')];
function send(frame,data){if(frame?.contentWindow&&frame.getAttribute('src'))frame.contentWindow.postMessage(data,location.origin);}
function broadcastTheme(){for(const frame of document.querySelectorAll('iframe'))send(frame,{type:'portfolio-theme',theme});}
const assistantOpen=()=>root.classList.contains('studio-assistant-open');
function setTheme(value,save=false){
  if(!validTheme(value))return;theme=value;root.dataset.theme=value;root.style.colorScheme=value;
  for(const button of preferenceButtons){button.setAttribute('aria-pressed',String(value==='dark'));button.setAttribute('aria-label',value==='dark'?'Switch to day theme':'Switch to night theme');const label=button.querySelector('[data-theme-label]');if(label)label.textContent=value==='dark'?'Day':'Night';else button.textContent=value==='dark'?'☀ Day':'☾ Night';}
  if(save)try{localStorage.setItem(key,value);}catch{}
  broadcastTheme();document.dispatchEvent(new CustomEvent('studio-case-theme',{detail:{theme}}));
}
setTheme(theme);preferenceButtons.forEach(button=>button.addEventListener('click',()=>setTheme(theme==='dark'?'light':'dark',true)));
window.addEventListener('storage',event=>{if(event.key===key&&validTheme(event.newValue))setTheme(event.newValue);});
// The original Exchange prototype already owns its theme button. Observe it without binding a second button.
new MutationObserver(()=>{const value=root.dataset.theme;if(validTheme(value)&&value!==theme){theme=value;broadcastTheme();document.dispatchEvent(new CustomEvent('studio-case-theme',{detail:{theme}}));}}).observe(root,{attributes:true,attributeFilter:['data-theme']});
for(const frame of document.querySelectorAll('iframe'))frame.addEventListener('load',()=>send(frame,{type:'portfolio-theme',theme}));

const fields=[...document.querySelectorAll('.case-explainers[data-guide-protocol]')];
const sets={exchange:{parts:new Set(['cache','worker','queue','gate']),stories:new Set(['compare','refresh','history','wait'])},portfolio:{parts:new Set(['dependencies','permissions','handoff','review','input','context','reply','voice','avatar','fallback','checks','run','evidence','alerts']),stories:new Set(['complete','blocked','approval','correction','typed','speech','no-mic','no-model','pass','fail','cooldown','paused'])}};
const monitorStages=new Set(['trigger','browser','evidence','dashboard','alerts']);
function setup(panel){
  const protocol=panel.dataset.guideProtocol,map=panel.querySelector('#system-map')||panel.querySelector('[data-case-map]'),guide=panel.querySelector('#animated-guide')||panel.querySelector('[data-case-guide]');if(!map||!guide)return;
  let visible=false,ready=false,pending=null,suspended=false;
  const mapHeading=panel.querySelector('#map'),guideHeading=panel.querySelector('#guide'),guidePanel=panel.querySelector('#panel-guide')||guide.closest('.case-panel');
  const readSource=()=>guide.dataset.src||guide.dataset.guide;
  function loadGuide(){const src=readSource();if(src&&!guide.getAttribute('src'))guide.setAttribute('src',src);}
  function tell(){if(!guide.getAttribute('src')||!ready)return;const open=visible&&!document.hidden&&!suspended&&!assistantOpen();send(guide,{type:protocol==='exchange'?'exchange-anatomy':'portfolio-figure',theme,open});if(open&&pending){send(guide,{type:protocol==='exchange'?'exchange-case-selection':protocol==='monitor'?'monitor-guide-selection':'portfolio-guide-selection',...pending});pending=null;}}
  function tellAssistantState(){send(map,{type:'portfolio-assistant-active',active:assistantOpen()});tell();}
  function guideFocus(){loadGuide();history.replaceState(null,'','#guide');guideHeading?.focus({preventScroll:true});guidePanel?.scrollIntoView({block:'nearest',behavior:'auto'});tell();}
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(visible)loadGuide();tell();},{threshold:.05}).observe(guide);else{visible=true;loadGuide();}
  function height(frame,value){if(Number.isFinite(value)&&value>=200&&value<=1600){frame.dataset.fit='true';frame.style.setProperty('--frame-height',Math.ceil(value)+'px');}}
  window.addEventListener('message',event=>{if(event.origin!==location.origin||!event.data||typeof event.data!=='object')return;const m=event.data;
    if(event.source===map.contentWindow){
      if(protocol==='exchange'&&m.type==='exchange-case-guide'&&sets.exchange.parts.has(m.part)&&sets.exchange.stories.has(m.story)){pending={part:m.part,story:m.story};guideFocus();}
      else if(protocol==='exchange'&&m.type==='exchange-case-map-height')height(map,m.height);
      else if(protocol==='portfolio'&&m.type==='portfolio-map-selection'&&sets.portfolio.parts.has(m.part)&&sets.portfolio.stories.has(m.scenario)){pending={part:m.part,scenario:m.scenario};guideFocus();}
      else if(protocol==='monitor'&&m.type==='monitor-workflow-height')height(map,m.height);
      else if(protocol==='monitor'&&m.type==='monitor-map-selection'&&monitorStages.has(m.stage)){pending={stage:m.stage};guideFocus();}
    }else if(event.source===guide.contentWindow){
      if(m.type===(protocol==='exchange'?'exchange-anatomy-ready':'portfolio-figure-ready')){ready=true;send(guide,{type:'portfolio-theme',theme});tell();}
      if(protocol==='monitor'&&m.type==='monitor-workflow-height')height(guide,m.height);
      if(protocol==='exchange'&&m.type==='exchange-anatomy-height')height(guide,m.height);
      if(protocol==='portfolio'&&m.type==='portfolio-guide-selection'&&sets.portfolio.parts.has(m.part)&&(!m.scenario||sets.portfolio.stories.has(m.scenario)))send(map,{type:'portfolio-guide-selection',part:m.part,scenario:m.scenario});
      if(protocol==='exchange'&&m.type==='exchange-anatomy-close'){history.replaceState(null,'','#map');mapHeading?.focus({preventScroll:true});}
    }
  });
  function hash(){if(location.hash==='#guide'){loadGuide();guideHeading?.focus({preventScroll:true});}else if(location.hash==='#map')mapHeading?.focus({preventScroll:true});}
  guide.addEventListener('load',()=>{send(guide,{type:'portfolio-theme',theme});tell();});map.addEventListener('load',()=>{send(map,{type:'portfolio-theme',theme});tellAssistantState();if(protocol==='exchange')send(map,{type:'exchange-case-map-measure'});});
  document.addEventListener('visibilitychange',tell);document.addEventListener('studio-case-theme',tell);document.addEventListener('studio-assistant-open',tellAssistantState);document.addEventListener('studio-assistant-close',tellAssistantState);window.addEventListener('pagehide',()=>{suspended=true;tell();});window.addEventListener('pageshow',()=>{suspended=false;tell();});window.addEventListener('hashchange',hash);hash();
}
fields.forEach(setup);

import {createFieldLoop,fieldPointer} from './system-field-loop.mjs';

const page=document.querySelector('.page'),regions=[...document.querySelectorAll('#work,#approach,#digital-twin,#about')];
const control=document.getElementById('ambient-motion-toggle'),strengthControl=document.getElementById('ambient-strength'),hint=document.getElementById('ambient-hint');
const rippleControl=document.getElementById('ambient-ripple');
const displaySettings=document.querySelector('.display-settings');
if(displaySettings){
 document.addEventListener('click',event=>{if(displaySettings.open&&!displaySettings.contains(event.target))displaySettings.open=false;});
 displaySettings.addEventListener('keydown',event=>{if(event.key==='Escape'&&displaySettings.open){displaySettings.open=false;displaySettings.querySelector('summary').focus();event.preventDefault();}});
}
if(page&&regions.length&&control&&globalThis.IntersectionObserver&&!document.getElementById('ambient-field')){
 const host=document.createElement('div'),canvas=document.createElement('canvas'),fallback=document.createElement('div');
 host.id='ambient-field';host.className='system-field';host.setAttribute('aria-hidden','true');
 fallback.className='field-fallback';canvas.className='depth-field-canvas';host.append(fallback,canvas);page.prepend(host);page.classList.add('has-ambient-field');
 for(let i=0;i<36;i++){const dot=document.createElement('i');dot.style.left=`${(i*.61803398875%1)*100}%`;dot.style.top=`${(i*.38196601125%1)*100}%`;fallback.append(dot);}
 const calm=matchMedia('(prefers-reduced-motion: reduce)'),compact=matchMedia('(max-width: 700px)'),connection=navigator.connection;
 const key='sadeq-background-motion',strengthKey='sadeq-background-strength',visible=new Set();
 let paused=false,strength='immersive',suspended=false,loading=false,engine=null,fault=false,x=0,y=0,width=1,height=1;
 try{paused=localStorage.getItem(key)==='paused';const value=localStorage.getItem(strengthKey);if(value==='calm')strength=value;}catch{}
 strengthControl.value=strength;strengthControl.parentElement.hidden=false;control.hidden=false;hint.hidden=false;rippleControl.hidden=false;
 function isDark(){return document.documentElement.dataset.theme==='dark';}
 function say(text){if(hint.textContent!==text)hint.textContent=text;}
 function fail(){fault=true;host.dataset.renderer='fallback';host.dataset.motion='still';loop.stop();say('3D background unavailable · static fallback shown.');control.disabled=true;strengthControl.disabled=true;rippleControl.disabled=true;}
 const loop=createFieldLoop({request:fn=>requestAnimationFrame(fn),cancel:id=>cancelAnimationFrame(id),fps:compact.matches?20:30,draw:time=>engine?.render(time,x*(strength==='immersive'?1:.4),y*(strength==='immersive'?1:.4),strength==='immersive'?1.12:.42,!loop.active),onError:fail});
 async function load(){
  if(engine||loading||connection?.saveData)return;
  loading=true;say('Loading 3D background…');
  try{
   const {createDepthField}=await import('./system-field-3d.mjs');
   engine=createDepthField(canvas,{small:compact.matches,dark:isDark(),onFault:fail,onRestore(){fault=false;host.dataset.renderer='webgl';resize();sync();}});
   resize();engine.render(0,0,0,strength==='immersive'?1.12:.42);
   if(!fault){host.dataset.renderer='webgl';host.dataset.ready='true';}
  }catch{fail();}
  loading=false;sync();
 }
 function resize(){width=document.documentElement.clientWidth||1;height=document.documentElement.clientHeight||1;engine?.resize(width,height,Math.min(devicePixelRatio||1,compact.matches?1:1.25));loop.setFPS(compact.matches?20:30);}
 function sync(){
  const active=visible.size>0,forced=calm.matches||!!connection?.saveData;
  host.dataset.visible=String(active);host.dataset.strength=strength;
  const run=active&&!document.hidden&&!suspended&&!paused&&!forced&&!!engine&&!fault;
  host.dataset.motion=run?'running':'still';loop.setActive(run);
  control.setAttribute('aria-pressed',String(paused||forced));control.disabled=fault||forced;
  control.textContent=calm.matches?'3D held still · Reduced motion':connection?.saveData?'Static · Data saver':paused?'Resume background':'Pause background';
  strengthControl.disabled=fault||!!connection?.saveData;
  rippleControl.disabled=!run;
  if(connection?.saveData){host.dataset.renderer='fallback';say('Static background · Data Saver enabled.');}
  else if(engine&&!fault){host.dataset.renderer='webgl';say(calm.matches?'3D background held still · Reduced motion.':paused?'3D background paused.':'Move to look around · Click an empty area for a ripple.');if(active&&!run&&!document.hidden&&!suspended)loop.still();}
  else if(fault)say('3D background unavailable · static fallback shown.');
  if(active&&!engine&&!fault&&!loading)void load();
 }
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting)visible.add(entry.target);else visible.delete(entry.target);}sync();},{threshold:0});regions.forEach(region=>observer.observe(region));
 function look(event){if(!loop.active)return;const p=fieldPointer(event,width,height);if(p){x=p.x;y=p.y;}}
 function sendRipple(px=x,py=y){if(!loop.active||!engine)return;engine.pulse(px,py,loop.time);say('Ripple sent · Move to look around or send another.');}
 page.addEventListener('pointermove',look,{passive:true});
 page.addEventListener('mousemove',look,{passive:true});
 page.addEventListener('click',event=>{if(!loop.active)return;const p=fieldPointer(event,width,height);if(p){x=p.x;y=p.y;sendRipple(x,y);}});
 rippleControl.addEventListener('click',()=>sendRipple());
 page.addEventListener('pointerleave',()=>{x=0;y=0;});
 control.addEventListener('click',()=>{paused=!paused;try{localStorage.setItem(key,paused?'paused':'enabled');}catch{}sync();});
 strengthControl.addEventListener('change',()=>{strength=strengthControl.value==='calm'?'calm':'immersive';try{localStorage.setItem(strengthKey,strength);}catch{}sync();});
 document.addEventListener('portfolio-theme-change',()=>{engine?.theme(isDark());if(engine&&!loop.active)loop.still();});
 document.addEventListener('visibilitychange',sync);calm.addEventListener('change',sync);connection?.addEventListener?.('change',sync);
 compact.addEventListener('change',()=>{x=0;y=0;resize();sync();});addEventListener('resize',resize,{passive:true});
 addEventListener('pagehide',()=>{suspended=true;sync();});addEventListener('pageshow',()=>{suspended=false;resize();sync();});
 resize();sync();
}

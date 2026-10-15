/* Original film, native view progress, browser video decoder. No scroll-position polling. */
const hero=document.querySelector('.portfolio-intro'),art=hero.querySelector('.intro-art'),film=document.getElementById('hero-video');
const button=document.getElementById('scroll-motion-toggle'),note=document.getElementById('scroll-film-note');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const constrained=()=>navigator.connection?.saveData||['slow-2g','2g'].includes(navigator.connection?.effectiveType);
let visible=false,stopped=false,frame=0,presented=0,lastSample=0,height=1,viewport=1,timeline=null;
const clamp=n=>Math.max(0,Math.min(1,n));
function status(text,code){note.textContent=text;art.dataset.scrollStatus=code;}
function eligible(){return timeline&&visible&&!stopped&&!document.hidden&&!reduced.matches&&!constrained();}
function stop(){if(frame)cancelAnimationFrame(frame);frame=0;if(presented&&film.cancelVideoFrameCallback)film.cancelVideoFrameCallback(presented);presented=0;}
function markFrame(_now,metadata){presented=0;art.dataset.presentedTime=metadata.mediaTime.toFixed(3);if(eligible()){film.classList.add('ready');if(film.requestVideoFrameCallback)presented=film.requestVideoFrameCallback(markFrame);}}
function wake(){if(eligible()&&!frame)frame=requestAnimationFrame(sample);if(eligible()&&!presented&&film.requestVideoFrameCallback)presented=film.requestVideoFrameCallback(markFrame);}
function sample(now){
 frame=0;if(!eligible())return;
 if(now-lastSample>=1000/30){
  lastSample=now;const time=timeline.currentTime;
  if(time&&Number.isFinite(time.value)&&Number.isFinite(film.duration)&&film.duration>0&&film.paused&&!film.seeking){
   // Native view progress runs from entry to exit. Map the hero's exit range to the film.
   const progress=clamp((time.value/100*(viewport+height)-viewport)/height);
   const desired=progress*Math.max(0,film.duration-.05);
   if(Math.abs(desired-film.currentTime)>.07)film.currentTime=desired;
   art.dataset.scrollProgress=progress.toFixed(4);art.dataset.scrollTime=film.currentTime.toFixed(3);
  }
 }
 frame=requestAnimationFrame(sample);
}
function activate(){
 if(reduced.matches){stop();art.classList.remove('scroll-film');status('Reduced motion: static artwork.','reduced');button.hidden=true;return;}
 if(constrained()){stop();art.classList.remove('scroll-film');status('Data saver: use Play original film if wanted.','save-data');button.hidden=true;return;}
 if(!('ViewTimeline' in window)){status('Scroll animation unavailable here; use Play original film.','fallback');button.hidden=true;return;}
 if(!timeline)timeline=new ViewTimeline({subject:hero,axis:'block'});
 button.hidden=false;art.classList.add('scroll-film');
 status(stopped?'Scroll motion paused.':'Scroll animates the original film.','native');
 if(visible&&!film.getAttribute('src')){film.preload='metadata';film.src=film.dataset.src;film.load();}
 wake();
}
button.addEventListener('click',()=>{stopped=!stopped;button.setAttribute('aria-pressed',String(stopped));button.textContent=stopped?'Resume scroll motion':'Pause scroll motion';if(stopped)stop();activate();});
new ResizeObserver(entries=>{height=Math.max(1,entries.at(-1).contentRect.height);viewport=innerHeight;}).observe(hero);
new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(visible)activate();else stop();},{threshold:.01}).observe(hero);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else activate();});
reduced.addEventListener('change',activate);navigator.connection?.addEventListener('change',activate);
film.addEventListener('loadedmetadata',wake);film.addEventListener('seeked',()=>{art.dataset.scrollTime=film.currentTime.toFixed(3);wake();});
film.addEventListener('loadeddata',()=>{if(eligible())film.classList.add('ready');wake();});
film.addEventListener('error',()=>{stop();art.classList.remove('scroll-film');status('Film unavailable; original artwork retained.','error');});
activate();

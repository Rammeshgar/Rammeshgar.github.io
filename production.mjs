let assistant;
async function getAssistant(){return assistant??=import('./mascot.js').catch(error=>{assistant=null;document.querySelector('.ai-mascot-toggle__label').textContent='Assistant unavailable · retry';throw error;});}
document.querySelector('#ai-mascot-toggle').addEventListener('click',async()=>{try{(await getAssistant()).togglePanel();}catch{}});
document.querySelectorAll('[data-open-ai]').forEach(button=>button.addEventListener('click',async e=>{e.preventDefault();try{(await getAssistant()).openPanel();}catch{}}));

import './hero-scroll.mjs';

/* Original soundtrack: explicit opt-in, separate from assistant voice. */
const music = document.createElement('audio');
music.id='bg-music'; music.src='2%205%202021.mp3';
music.loop=true; music.preload='none'; music.volume=0.25;
document.body.append(music);
const musicButton=document.createElement('button');
musicButton.type='button'; musicButton.id='music-toggle';
musicButton.setAttribute('aria-pressed','false');
musicButton.setAttribute('aria-label','Play background music');
musicButton.textContent='♫ Play music';
musicButton.style.cssText='border:1px solid var(--line);border-radius:24px;padding:10px 13px;font:500 11px Inter,Arial,sans-serif;white-space:nowrap;min-height:42px;color:var(--ink);background:var(--paper)';
document.querySelector('.header').append(musicButton);
let musicWanted=false, musicRevision=0;
const musicBlocked=()=>document.hidden || document.querySelector('#ai-mascot-panel')?.classList.contains('is-open') || document.querySelector('.hero-art')?.classList.contains('playing-film');
function musicLabel(){
 musicButton.setAttribute('aria-pressed',String(musicWanted));
 musicButton.setAttribute('aria-label',musicWanted?'Turn off background music':'Play background music');
 musicButton.textContent=musicWanted?(musicBlocked()?'♫ Music paused':'♫ Music on'):'♫ Play music';
}
async function syncMusic(){
 const revision=++musicRevision;
 if(!musicWanted || musicBlocked()) music.pause();
 else try{await music.play();if(revision!==musicRevision || musicBlocked() || !musicWanted)music.pause();}
 catch{if(revision===musicRevision){musicWanted=false;musicLabel();musicButton.textContent='♫ Retry music';}}
 musicLabel();
}
musicButton.addEventListener('click',()=>{musicWanted=!musicWanted;void syncMusic();});
document.addEventListener('visibilitychange',syncMusic);
for(const element of [document.querySelector('#ai-mascot-panel'),document.querySelector('.hero-art')]){
 if(element)new MutationObserver(syncMusic).observe(element,{attributes:true,attributeFilter:['class']});
}
music.addEventListener('error',()=>{musicWanted=false;musicLabel();musicButton.textContent='Music unavailable';});


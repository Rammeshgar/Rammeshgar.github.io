let assistant;
async function getAssistant(){return assistant??=import('./mascot.js').catch(error=>{assistant=null;document.querySelector('.ai-mascot-toggle__label').textContent='Assistant unavailable · retry';throw error;});}
document.querySelector('#ai-mascot-toggle').addEventListener('click',async()=>{try{(await getAssistant()).togglePanel();}catch{}});
document.querySelectorAll('[data-open-ai]').forEach(button=>button.addEventListener('click',async e=>{e.preventDefault();try{(await getAssistant()).openPanel();}catch{}}));

import './hero-scroll.mjs';

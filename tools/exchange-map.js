'use strict';
const compactMap=new URLSearchParams(location.search).get('layout')==='compact';
if(compactMap){document.body.dataset.layout='compact';document.querySelector('.mini-canvas svg').setAttribute('viewBox','0 0 312 292');document.querySelectorAll('.mini-canvas .node-hit').forEach(b=>{b.style.top=(parseFloat(b.style.top)*368/292)+'%';b.style.height=(64/292*100)+'%';});}
if(new URLSearchParams(location.search).get('embed')==='1')document.querySelector('.map-header').hidden=true;
const allowedParts=new Set(['cache','queue','worker','gate']);
function selectComponent(id,announce=true){
 const item=COMPONENTS.find(c=>c.id===id);if(!item)return;
 document.querySelectorAll('[data-component]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.component===id)));
 document.querySelectorAll('[data-node]').forEach(n=>n.classList.toggle('selected',n.dataset.node===id));
 document.body.classList.add('has-selection');
 document.querySelectorAll('[data-edge]').forEach(e=>{const active=e.dataset.from===id||e.dataset.to===id;e.classList.toggle('connected',active);e.dataset.selected=String(active);e.setAttribute('marker-end','url(#'+e.dataset.marker+(active?'-selected':'')+')');});
 document.querySelectorAll('[data-detail]').forEach(p=>{p.hidden=p.dataset.detail!==id});
 document.getElementById('component-detail').scrollTop=0;
 if(announce)document.querySelector('.selection-status').textContent='Selected '+item.name+'. Read its explanation or use the button to watch the relevant example.';
 reportHeight();
}
document.querySelectorAll('[data-component]').forEach(b=>b.addEventListener('click',()=>selectComponent(b.dataset.component)));
document.querySelectorAll('.see-guide').forEach(b=>b.addEventListener('click',()=>{
 if(!allowedParts.has(b.dataset.part))return;
 if(parent!==window)parent.postMessage({type:'exchange-case-guide',part:b.dataset.part,story:b.dataset.story},location.origin);
 else location.href='guide.html?view=guide&part='+encodeURIComponent(b.dataset.part)+'&story='+encodeURIComponent(b.dataset.story);
}));
let lastHeight=0;
function reportHeight(){const height=Math.ceil(document.querySelector('main').getBoundingClientRect().height)+4;if(height!==lastHeight){lastHeight=height;if(parent!==window)parent.postMessage({type:'exchange-case-map-height',height},location.origin);}}
new ResizeObserver(reportHeight).observe(document.querySelector('main'));
window.addEventListener('message',event=>{
 if(event.source===parent&&event.origin===location.origin&&event.data?.type==='exchange-case-map-measure'){lastHeight=0;reportHeight();}
});
selectComponent('queue',false);
// Event-driven inspection zoom; no animation loop or layout polling.
if(!compactMap){
 document.body.classList.add('has-zoom');
 const canvas=document.querySelector('.map-canvas'),viewport=document.querySelector('.map-column>.diagram-container');let scale=1;
 const zoom=value=>{scale=Math.max(.5,Math.min(3,value));canvas.style.width=(viewport.clientWidth*scale)+'px';document.getElementById('zoom-level').textContent=Math.round(scale*100)+'%';};
 document.getElementById('zoom-in').addEventListener('click',()=>zoom(scale+.25));
 document.getElementById('zoom-out').addEventListener('click',()=>zoom(scale-.25));
 document.getElementById('zoom-fit').addEventListener('click',()=>{scale=1;canvas.style.width='100%';document.getElementById('zoom-level').textContent='Fit';});
}

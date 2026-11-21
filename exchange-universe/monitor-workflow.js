(() => {
 'use strict';
 const query = new URLSearchParams(location.search);
 const flow = document.querySelector('.monitor-flow');
 const preview = query.get('layout') === 'preview';
 flow.dataset.layout = preview ? 'preview' : query.get('layout') === 'compact' ? 'compact' : 'full';
 const steps = [...flow.querySelectorAll('[data-flow-step]')];
 const nodes = [...flow.querySelectorAll('[data-flow-node]')];
 const details = [...flow.querySelectorAll('[data-flow-detail]')];
 const routes = [...flow.querySelectorAll('[data-route]')];
 const guideButton = document.querySelector('#view-guide');
 const mapButton = document.querySelector('#view-map');
 const playback = document.querySelector('#flow-playback');
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const compactMobile = matchMedia('(max-width: 480px)');
 const art = flow.querySelector('.flow-art');
 const embedded = parent !== window;
 const names = steps.map(step => step.dataset.flowStep);
 let active = 0;
 let guide = query.get('view') !== 'map';
 let paused = false;
 let previewOpen = !preview;
 let inView = true;
 let timer;

 // Retain the original wide map, but keep labels readable on a phone rather
 // than shrinking a horizontal 600-unit drawing to half its intended size.
 function layoutMap() {
  if (preview) return;
  const narrow = compactMobile.matches;
  art.setAttribute('viewBox', narrow ? '0 0 360 406' : '0 0 600 206');
  flow.dataset.mobileFlow = String(narrow);
  const positions = narrow ? [[121,12],[121,102],[121,192],[16,316],[236,316]] : [[14,68],[163,68],[312,68],[478,20],[478,116]];
  nodes.forEach((node,index)=>node.setAttribute('transform',`translate(${positions[index].join(' ')})`));
  const paths = narrow ? ['M180 82V102','M180 172V192','M166 262V278Q166 286 158 286H78Q70 286 70 294V316','M194 262V278Q194 286 202 286H282Q290 286 290 294V316'] : ['M132 103H163','M281 103H312','M430 90H447Q454 90 454 83V62Q454 55 461 55H478','M430 116H447Q454 116 454 123V144Q454 151 461 151H478'];
  ['browser','evidence','dashboard','alerts'].forEach((name,i)=>document.getElementById('to-'+name).setAttribute('d',paths[i]));
 }

 function select(index) {
  active = index;
  const name = steps[index].dataset.flowStep;
  steps.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  details.forEach((section, i) => { section.hidden = i !== index; });
  nodes.forEach(node => node.classList.toggle('is-current', node.dataset.flowNode === name));
  routes.forEach(route => route.classList.toggle('is-current', route.dataset.route === (name === 'trigger' ? 'browser' : name)));
 }

 function sync() {
  const moving = !paused && !reduced.matches && !document.hidden && inView && previewOpen;
  flow.dataset.moving = String(moving);
  playback.disabled = reduced.matches;
  playback.setAttribute('aria-pressed', String(paused));
  playback.textContent = reduced.matches ? 'Reduced motion' : paused ? 'Resume animation' : 'Pause animation';
  if (moving && guide) {
   timer ??= setTimeout(() => {
    timer = undefined;
    select((active + 1) % steps.length);
    sync();
   }, preview ? 2200 : 4500);
  } else {
   clearTimeout(timer);
   timer = undefined;
  }
 }

 function setView(showGuide) {
  guide = showGuide;
  guideButton.setAttribute('aria-pressed', String(guide));
  mapButton.setAttribute('aria-pressed', String(!guide));
  document.querySelector('#flow-title').textContent = guide ? 'Follow a browser check.' : 'Monitoring system map.';
  sync();
 }

 function choose(index, relay = true) {
  clearTimeout(timer);
  timer = undefined;
  select(index);
  if (relay && !guide && !preview && embedded) parent.postMessage({type:'monitor-map-selection',stage:names[index]}, location.origin);
  sync();
 }

 steps.forEach((button, index) => button.addEventListener('click', () => choose(index)));
 nodes.forEach((node, index) => node.addEventListener('click', () => choose(index)));
 guideButton.addEventListener('click', () => setView(true));
 mapButton.addEventListener('click', () => setView(false));
 playback.addEventListener('click', () => { paused = !paused; sync(); });
 reduced.addEventListener('change', sync);
 compactMobile.addEventListener('change', layoutMap);
 document.addEventListener('visibilitychange', sync);
 if (!preview && 'IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
   inView = entries[0].isIntersecting;
   sync();
  }).observe(flow);
 }
 if (embedded) {
  window.addEventListener('message', event => {
   if (event.origin !== location.origin || event.source !== parent || !event.data) return;
   if (event.data.type === 'portfolio-figure' && (preview || flow.dataset.layout === 'compact')) {
    const open = event.data.open === true;
    if (preview && open && !previewOpen) select(0);
    previewOpen = open;
    sync();
   }
   if (event.data.type === 'monitor-guide-selection' && guide && names.includes(event.data.stage)) choose(names.indexOf(event.data.stage), false);
  });
 }

 layoutMap();
 select(0);
 setView(guide);
 if (embedded && (preview || flow.dataset.layout === 'compact')) parent.postMessage({ type: 'portfolio-figure-ready' }, location.origin);
 if (!preview) flow.querySelectorAll('.flow-controls, .flow-steps').forEach(group => { group.hidden = false; });
 if (flow.dataset.layout === 'compact' && parent !== window && 'ResizeObserver' in window) {
  new ResizeObserver(() => {
   parent.postMessage({ type: 'monitor-workflow-height', height: flow.offsetHeight + 1 }, location.origin);
  }).observe(flow);
 }
})();

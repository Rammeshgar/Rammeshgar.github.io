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
 let active = 0;
 let guide = query.get('view') !== 'map';
 let paused = false;
 let previewOpen = !preview;
 let inView = true;
 let timer;

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

 function choose(index) {
  clearTimeout(timer);
  timer = undefined;
  select(index);
  sync();
 }

 steps.forEach((button, index) => button.addEventListener('click', () => choose(index)));
 nodes.forEach((node, index) => node.addEventListener('click', () => choose(index)));
 guideButton.addEventListener('click', () => setView(true));
 mapButton.addEventListener('click', () => setView(false));
 playback.addEventListener('click', () => { paused = !paused; sync(); });
 reduced.addEventListener('change', sync);
 document.addEventListener('visibilitychange', sync);
 if (!preview && 'IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
   inView = entries[0].isIntersecting;
   sync();
  }).observe(flow);
 }
 if (preview && parent !== window) {
  window.addEventListener('message', event => {
   if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'portfolio-figure') return;
   const open = event.data.open === true;
   if (open && !previewOpen) select(0);
   previewOpen = open;
   sync();
  });
 }

 select(0);
 setView(guide);
 if (preview && parent !== window) parent.postMessage({ type: 'portfolio-figure-ready' }, location.origin);
 if (!preview) flow.querySelectorAll('.flow-controls, .flow-steps').forEach(group => { group.hidden = false; });
 if (flow.dataset.layout === 'compact' && parent !== window && 'ResizeObserver' in window) {
  new ResizeObserver(() => {
   parent.postMessage({ type: 'monitor-workflow-height', height: flow.offsetHeight + 1 }, location.origin);
  }).observe(flow);
 }
})();

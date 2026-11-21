/* The hover card uses Afterlight's actual local Cinema renderer. The parent
   owns activation and never needs an audio bridge, native host or service. */
import './assets/afterlight-cinema.js';

const root = document.documentElement;
const canvas = document.querySelector('canvas');
const context = canvas?.getContext('2d', { alpha: false });
const engine = window.AfterlightCinema?.create();
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const origin = location.origin;
const settings = {
  palette: 'nocturne', weather: 'rain', intensity: 26, quality: 15,
  windows: true, parallax: false, reduced: false, worldActivity: 65,
  worldGlow: 58, worldFeature: true, musicStrength: 0
};
const quiet = { level: 0 };
const pan = { x: 0, y: 0 };
let ready = false;
let open = false;
let pageActive = true;
let seen = !('IntersectionObserver' in window);
let raf = null;
let lastStamp = null;
let playTime = 0;
let started = false;
let frames = 0;

const allowed = () => ready && open && pageActive && seen && !document.hidden && !reduced.matches;
const state = value => { if (root.dataset.previewState !== value) root.dataset.previewState = value; };

function stop() {
  if (raf !== null) cancelAnimationFrame(raf);
  raf = null;
  lastStamp = null;
}

function render() {
  if (!allowed()) return;
  // Begin the train motion inside the visible scene on the first activated
  // frame, rather than making a short hover wait for it to enter the canvas.
  if (!started) {
    engine.effect('train', playTime - 2.1);
    started = true;
  }
  if (engine.draw(context, playTime, settings, quiet, pan)) {
    root.dataset.previewRendered = 'true';
    root.dataset.previewFrame = String(++frames);
  }
}

const frameInterval = 1000 / 30;
function tick(stamp) {
  raf = null;
  if (!allowed()) { sync(); return; }
  if (lastStamp === null) {
    lastStamp = stamp;
    render();
  } else if (stamp - lastStamp >= frameInterval - 1) {
    playTime += Math.min(.12, (stamp - lastStamp) / 1000);
    lastStamp = stamp;
    render();
  }
  raf = requestAnimationFrame(tick);
}

function sync() {
  if (!ready) { stop(); return; }
  if (!allowed()) {
    stop();
    state(reduced.matches ? 'reduced' : !pageActive || !seen || document.hidden ? 'offscreen' : 'paused');
    return;
  }
  state('playing');
  if (raf === null) raf = requestAnimationFrame(tick);
}

window.addEventListener('message', event => {
  const message = event.data;
  if (parent === window || event.source !== parent || event.origin !== origin || !message || typeof message !== 'object') return;
  if (message.type !== 'portfolio-figure' || typeof message.open !== 'boolean') return;
  // A load-time open message can arrive before the image finishes decoding;
  // accept activation only after the ready handshake, never merely on load.
  if (!ready) return;
  open = message.open;
  sync();
});
document.addEventListener('visibilitychange', sync);
reduced.addEventListener('change', sync);
window.addEventListener('pagehide', () => { pageActive = false; open = false; sync(); });
window.addEventListener('pageshow', () => { pageActive = true; sync(); });

if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    seen = entries[entries.length - 1].isIntersecting;
    sync();
  }, { threshold: .05 }).observe(canvas);
}

if (!engine || !context) state('unavailable');
else engine.select('city', () => {
  ready = engine.ready();
  if (!ready) { state('unavailable'); return; }
  // The engine callback occurs after the original local scene sheet loads
  // and can be drawn. Only then may the parent replace its static capture.
  state(reduced.matches ? 'reduced' : 'ready');
  if (parent !== window) parent.postMessage({ type: 'portfolio-figure-ready' }, origin);
});

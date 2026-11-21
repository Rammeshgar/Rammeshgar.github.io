/* Local portfolio adapter for the original Afterlight Cinema renderer.
   This page deliberately leaves the native host and audio bridge behind. */
import './assets/afterlight-cinema.js';

const demo = document.querySelector('.afterlight-demo');
if (demo) {
  const stage = demo.querySelector('#afterlight-stage');
  const canvas = demo.querySelector('#afterlight-canvas');
  const status = demo.querySelector('#afterlight-demo-status');
  const title = demo.querySelector('#demo-world-label');
  const help = demo.querySelector('#afterlight-motion-help');
  const motionButton = demo.querySelector('[data-demo-pause]');
  const sceneButtons = [...demo.querySelectorAll('[data-scene]')];
  const lightingButtons = [...demo.querySelectorAll('[data-lighting]')];
  const effectButtons = [...demo.querySelectorAll('[data-effect]')];
  const context = canvas.getContext('2d', { alpha: false });
  const engine = window.AfterlightCinema?.create();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const scenes = {
    city: { name: 'Canal City', water: { x: 430, y: 455 }, action: 'Send the train', actionStatus: 'Train set in motion.' },
    observatory: { name: 'Northstar', water: { x: 333, y: 419 }, action: 'Sweep the telescope', actionStatus: 'Telescope sweep started.' }
  };
  const settings = {
    palette: 'nocturne', weather: 'clear', intensity: 30, quality: 30,
    windows: true, parallax: false, reduced: false, worldActivity: 55,
    worldGlow: 60, worldFeature: true, musicStrength: 0
  };
  let selected = 'city';
  let requested = null;
  let ready = false;
  let observed = false;
  let pageActive = true;
  let paused = false;
  let failed = false;
  let raf = null;
  let lastTime = null;
  let activeTime = 0;
  let frameCount = 0;
  let isLightOn = true;

  const canDraw = () => observed && pageActive && !document.hidden && ready && Boolean(context);
  const canAnimate = () => canDraw() && !paused && !reduce.matches;
  const report = message => { if (status.textContent !== message) status.textContent = message; };

  function controls() {
    demo.dataset.demoScene = selected;
    demo.dataset.demoLighting = settings.palette;
    title.textContent = scenes[selected].name + ' / ' + (settings.palette === 'daylight' ? 'By day' : 'At night');
    canvas.setAttribute('aria-label', scenes[selected].name + ', ' + (settings.palette === 'daylight' ? 'daylight' : 'night') + ' artwork. Use the controls to change the scene.');
    sceneButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scene === selected)));
    lightingButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.lighting === settings.palette)));
    motionButton.disabled = reduce.matches;
    motionButton.setAttribute('aria-pressed', String(paused || reduce.matches));
    motionButton.textContent = reduce.matches ? '◇ Reduced motion enabled' : paused ? '▷ Resume animation' : 'Ⅱ Pause animation';
    help.textContent = reduce.matches ? 'Your reduced-motion preference keeps this scene still. Lighting controls remain available.' :
      paused ? 'The scene is paused. Lights and palettes still change; resume for moving actions.' :
      'Motion actions run while the scene is in view. Lights and palettes also change while paused.';
    effectButtons.forEach(button => {
      button.disabled = !ready || (button.dataset.effect !== 'light' && (paused || reduce.matches));
      if (button.dataset.effect === 'train') button.textContent = scenes[selected].action;
      if (button.dataset.effect === 'light') button.setAttribute('aria-pressed', String(isLightOn));
    });
  }

  function render() {
    if (!canDraw()) return;
    settings.reduced = paused || reduce.matches;
    if (engine.draw(context, activeTime, settings, { level: 0 }, { x: 0, y: 0 })) {
      stage.dataset.ready = 'true';
      demo.dataset.demoFrame = String(++frameCount);
    }
  }

  function stop() {
    if (raf !== null) cancelAnimationFrame(raf);
    raf = null;
    lastTime = null;
  }

  const minFrameMs = 1000 / 30;
  function tick(timestamp) {
    raf = null;
    if (!canAnimate()) { sync(); return; }
    if (lastTime === null) {
      lastTime = timestamp;
      render();
    } else if (timestamp - lastTime >= minFrameMs - 1) {
      activeTime += Math.min(.12, (timestamp - lastTime) / 1000);
      lastTime = timestamp;
      render();
    }
    raf = requestAnimationFrame(tick);
  }

  function sync(drawStill = false) {
    if (!observed || document.hidden || !pageActive) {
      stop();
      demo.dataset.demoState = 'offscreen';
    } else if (failed) {
      stop();
      demo.dataset.demoState = 'static';
    } else if (!ready) {
      stop();
      demo.dataset.demoState = 'loading';
    } else if (canAnimate()) {
      demo.dataset.demoState = 'playing';
      if (drawStill) render();
      if (raf === null) raf = requestAnimationFrame(tick);
    } else {
      stop();
      demo.dataset.demoState = reduce.matches ? 'still' : 'paused';
      if (drawStill) render();
    }
    controls();
  }

  function loadScene(id) {
    if (!scenes[id] || !engine || !context) return;
    selected = id;
    if (requested === id) { sync(true); return; }
    requested = id;
    activeTime = 0;
    isLightOn = true;
    ready = false;
    failed = false;
    stop();
    // Retain the real application capture as a documented fallback while the
    // scene sheet loads, rather than showing an empty frame.
    stage.dataset.ready = 'false';
    report('Loading ' + scenes[id].name + ' from local artwork.');
    sync();
    engine.select(id, () => {
      if (selected !== id) return;
      ready = engine.ready();
      failed = !ready;
      report(ready
        ? scenes[id].name + ' ready. ' + (paused || reduce.matches ? 'Still view.' : 'Animation runs when the scene is in view.')
        : 'Local artwork could not be loaded. The application capture remains available.');
      sync(true);
    });
  }

  sceneButtons.forEach(button => button.addEventListener('click', () => loadScene(button.dataset.scene)));
  lightingButtons.forEach(button => button.addEventListener('click', () => {
    settings.palette = button.dataset.lighting;
    report((settings.palette === 'daylight' ? 'Daylight' : 'Night') + ' artwork selected.');
    sync(true);
  }));
  effectButtons.forEach(button => button.addEventListener('click', () => {
    if (!ready || button.disabled) return;
    const action = button.dataset.effect;
    engine.effect(action, activeTime, action === 'water' ? scenes[selected].water : undefined);
    if (action === 'light') {
      isLightOn = !isLightOn;
      report('Room lights ' + (isLightOn ? 'on.' : 'off.'));
    } else if (action === 'water') report('Ripple added to the water.');
    else report(scenes[selected].actionStatus);
    demo.dataset.demoAction = action;
    sync(true);
  }));
  motionButton.addEventListener('click', () => {
    if (reduce.matches) return;
    paused = !paused;
    report(paused ? 'Animation paused. Your current scene frame stays in view.' : 'Animation resumed when the scene is in view.');
    sync(true);
  });
  reduce.addEventListener('change', () => {
    report(reduce.matches ? 'Reduced motion enabled. Animation is stopped.' : 'Reduced motion disabled. Your manual pause setting is preserved.');
    sync(true);
  });
  document.addEventListener('visibilitychange', () => sync(true));
  window.addEventListener('pagehide', () => { pageActive = false; sync(); });
  window.addEventListener('pageshow', () => { pageActive = true; sync(true); });

  controls();
  if (!engine || !context) {
    failed = true;
    report('The local renderer is unavailable. The application capture remains visible.');
  } else if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      observed = entries[entries.length - 1].isIntersecting;
      if (observed && requested === null) loadScene(selected);
      else sync(observed);
    }, { threshold: .05 }).observe(stage);
  } else {
    observed = true;
    loadScene(selected);
  }
}

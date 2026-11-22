/* The optional original film and soundtrack are local. No media source is
   attached, and no audio element is created, until the visitor requests it.
   The AI assistant has its own opt-in dialog and never shares the soundtrack. */
const musicButton = document.querySelector('[data-studio-music]');
const musicLabel = musicButton?.querySelector('[data-music-label]');
const musicIcon = musicButton?.querySelector('svg path');
const musicStatus = document.querySelector('[data-music-status]');
const dialog = document.querySelector('#studio-film-dialog');
const video = dialog?.querySelector('[data-studio-film-video]');
const poster = dialog?.querySelector('[data-studio-film-poster]');
const filmPlay = dialog?.querySelector('[data-studio-play-film]');
const filmClose = dialog?.querySelector('[data-studio-close-film]');
const filmStatus = dialog?.querySelector('[data-film-status]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const musicUrl = new URL('./2%205%202021.mp3', import.meta.url).href;
const filmUrl = new URL('./assets/hero-motion.mp4', import.meta.url).href;
const posterUrl = new URL('./assets/hero-original.webp', import.meta.url).href;
const notePath = 'M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3h3m11 1a3 3 0 1 1-3-3h3';
const pausePath = 'M9 5v14M15 5v14';
let audio = null;
let musicRequested = false;
let musicRevision = 0;
let musicPosition = 0;
let filmRevision = 0;
let filmTrigger = null;

function musicMessage(message) {
  if (musicStatus && musicStatus.textContent !== message) musicStatus.textContent = message;
}
function paintMusic(state = 'off') {
  if (!musicButton) return;
  const active = musicRequested;
  musicButton.dataset.state = state;
  musicButton.setAttribute('aria-pressed', String(active));
  musicButton.title = active ? 'Pause background music' : 'Play background music';
  if (musicLabel) musicLabel.textContent = active ? 'Pause music' : state === 'error' ? 'Retry music' : 'Play music';
  musicIcon?.setAttribute('d', active ? pausePath : notePath);
}
function releaseAudio(player) {
  if (!player) return;
  player.pause();
  player.removeAttribute('src');
  player.load();
  player.remove();
}
function stopMusic(message = '', state = 'off') {
  const player = audio;
  const wasRequested = musicRequested;
  musicRevision++;
  musicRequested = false;
  audio = null;
  if (player && Number.isFinite(player.currentTime)) musicPosition = player.currentTime;
  releaseAudio(player);
  paintMusic(state);
  if (message && (wasRequested || state === 'error')) musicMessage(message);
}
async function startMusic() {
  if (!musicButton || document.hidden || dialog?.open || document.documentElement.classList.contains('studio-assistant-open') || musicRequested) return;
  const revision = ++musicRevision;
  const player = document.createElement('audio');
  player.dataset.studioMusicPlayer = '';
  player.hidden = true;
  player.preload = 'none';
  player.loop = true;
  player.volume = .25;
  audio = player;
  musicRequested = true;
  paintMusic('loading');
  musicMessage('Loading the original soundtrack.');
  player.addEventListener('loadedmetadata', () => {
    if (audio !== player || !Number.isFinite(player.duration)) return;
    if (musicPosition > 0 && musicPosition < player.duration) player.currentTime = musicPosition;
  }, { once: true });
  player.addEventListener('error', () => {
    if (audio === player && musicRequested) stopMusic('Music could not be loaded. Try again if you wish.', 'error');
  });
  document.body.append(player);
  player.src = musicUrl;
  try {
    await player.play();
    if (audio !== player || revision !== musicRevision || !musicRequested) return;
    if (document.hidden || dialog?.open || document.documentElement.classList.contains('studio-assistant-open')) {
      stopMusic('Music paused. Press Play music when you want to resume.');
      return;
    }
    paintMusic('playing');
    musicMessage('Original background music is playing.');
  } catch {
    if (audio === player && revision === musicRevision) stopMusic('Music was not started. Try again if you wish.', 'error');
  }
}
musicButton?.addEventListener('click', () => {
  if (musicRequested) stopMusic('Background music paused.');
  else void startMusic();
});
paintMusic();

function sayFilm(message) {
  if (filmStatus && filmStatus.textContent !== message) filmStatus.textContent = message;
}
function clearFilm(clearPoster = false) {
  filmRevision++;
  if (!video || !poster || !filmPlay) return;
  const hadSource = video.hasAttribute('src');
  video.pause();
  video.removeAttribute('src');
  video.removeAttribute('poster');
  if (hadSource) video.load();
  video.hidden = true;
  poster.hidden = false;
  if (clearPoster) poster.removeAttribute('src');
  filmPlay.hidden = false;
  delete filmPlay.dataset.loading;
  filmPlay.removeAttribute('aria-busy');
  filmPlay.textContent = 'Play film';
}
function openFilm(trigger) {
  if (!dialog || !video || !poster || !filmPlay || dialog.open || typeof dialog.showModal !== 'function') return;
  stopMusic('Music paused while the film is open. Press Play music to resume after closing it.');
  filmTrigger = trigger;
  clearFilm();
  poster.src = posterUrl;
  sayFilm(reduced.matches
    ? 'This is a short moving film. It stays stopped until you explicitly press Play.'
    : 'The film starts only when you press Play.');
  dialog.showModal();
  filmClose?.focus({ preventScroll: true });
}
async function playFilm() {
  if (!dialog?.open || !video || !poster || !filmPlay || document.hidden || filmPlay.dataset.loading) return;
  const revision = ++filmRevision;
  stopMusic('Music paused while the film is open.');
  filmPlay.dataset.loading = 'true';
  filmPlay.setAttribute('aria-busy', 'true');
  filmPlay.textContent = 'Loading film';
  sayFilm('Loading the original film.');
  if (!video.hasAttribute('src')) {
    video.poster = posterUrl;
    video.src = filmUrl;
  }
  video.hidden = false;
  try {
    await video.play();
    if (revision !== filmRevision || !dialog.open || document.hidden) return;
    const transferFocus = document.activeElement === filmPlay;
    filmPlay.hidden = true;
    delete filmPlay.dataset.loading;
    filmPlay.removeAttribute('aria-busy');
    filmPlay.textContent = 'Play film';
    if (transferFocus) video.focus({ preventScroll: true });
    sayFilm('Film playing. Use the native player controls to pause or replay.');
  } catch {
    if (revision !== filmRevision || !dialog.open) return;
    const transferFocus = dialog.contains(document.activeElement) && document.activeElement !== filmClose;
    clearFilm();
    sayFilm('Film unavailable. The original artwork is still here; press Play to retry.');
    if (transferFocus) filmPlay.focus({ preventScroll: true });
  }
}
function closeFilm() {
  if (!dialog?.open) return;
  clearFilm(true);
  dialog.close();
}

for (const trigger of document.querySelectorAll('[data-studio-open-film]')) {
  trigger.addEventListener('click', event => openFilm(event.currentTarget));
}
filmPlay?.addEventListener('click', () => void playFilm());
filmClose?.addEventListener('click', closeFilm);
dialog?.addEventListener('cancel', event => { event.preventDefault(); closeFilm(); });
dialog?.addEventListener('close', () => {
  clearFilm(true);
  sayFilm('The film starts only when you press Play.');
  const trigger = filmTrigger;
  filmTrigger = null;
  if (trigger?.isConnected) trigger.focus({ preventScroll: true });
});
// Click outside the native modal on its backdrop, never inside its content.
dialog?.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeFilm();
});
video?.addEventListener('loadeddata', () => {
  if (dialog?.open && video.hasAttribute('src')) poster.hidden = true;
});
video?.addEventListener('pause', () => {
  if (dialog?.open && video.hasAttribute('src') && !video.ended) sayFilm('Film paused. Use the player controls to continue.');
});
video?.addEventListener('play', () => {
  if (!dialog?.open || document.hidden) { video.pause(); return; }
  stopMusic('Music paused while the film is open.');
});
video?.addEventListener('ended', () => {
  if (dialog?.open) sayFilm('The six-second film has finished. Replay it with the player controls.');
});
video?.addEventListener('error', () => {
  if (dialog?.open && video.hasAttribute('src')) {
    clearFilm();
    sayFilm('Film unavailable. The original artwork remains visible.');
  }
});
function stopVisibleFilm(message) {
  if (!dialog?.open || !video?.hasAttribute('src')) return;
  const transferFocus = document.activeElement === video || document.activeElement === filmPlay;
  clearFilm();
  sayFilm(message);
  if (transferFocus && !document.hidden) filmPlay?.focus({ preventScroll: true });
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    if (dialog?.open && !dialog.contains(document.activeElement)) (filmPlay?.hidden ? filmClose : filmPlay)?.focus({ preventScroll: true });
    return;
  }
  stopMusic('Music paused while the page is hidden. Press Play music to resume.');
  stopVisibleFilm('The film stopped while this page was hidden. Press Play to watch again.');
});
window.addEventListener('pagehide', () => {
  stopMusic();
  if (dialog?.open) closeFilm();
});
reduced.addEventListener('change', () => {
  if (reduced.matches) stopVisibleFilm('The film stopped after your reduced-motion preference changed. Press Play only if you want to watch it.');
});

// Opening the assistant always releases the soundtrack and any film. It is
// not resumed automatically on close; the visitor remains in control.
document.addEventListener('studio-assistant-open',()=>{
  stopMusic('Music paused while the AI assistant is open. Press Play music to resume.');
  if(dialog?.open)closeFilm();
});
// Also pause on modified clicks that navigate directly to the standalone app.
for (const link of document.querySelectorAll('[data-studio-assistant]')) {
  const pauseForAssistant = () => stopMusic('Music paused for the AI assistant. Press Play music to resume.');
  link.addEventListener('click', pauseForAssistant);
  link.addEventListener('auxclick', pauseForAssistant);
}

function legacyCopy(value, returnFocus) {
  // Use only when the Clipboard API is unavailable (for example a local
  // HTTP preview), and only within the visitor's explicit Copy click.
  const buffer = document.createElement('textarea');
  buffer.className = 'studio-visually-hidden studio-copy-buffer';
  buffer.setAttribute('readonly', '');
  buffer.value = value;
  document.body.append(buffer);
  let copied = false;
  try {
    buffer.select();
    copied = document.execCommand('copy');
  } catch { /* Leave visible address available to select manually. */ }
  finally {
    buffer.remove();
    returnFocus.focus({ preventScroll: true });
  }
  return copied;
}
for (const button of document.querySelectorAll('[data-copy-email]')) {
  let timer;
  const status = document.querySelector('#copy-status');
  const original = button.textContent;
  button.addEventListener('click', async () => {
    const address = button.dataset.copyEmail || 'rezaisadeq0@gmail.com';
    clearTimeout(timer);
    let copied = false;
    if (navigator.clipboard?.writeText) {
      try { await navigator.clipboard.writeText(address); copied = true; }
      catch { /* Do not bypass an explicit browser clipboard denial. */ }
    } else copied = legacyCopy(address, button);
    button.dataset.copyState = copied ? 'copied' : 'unavailable';
    button.textContent = copied ? 'Copied' : 'Copy unavailable';
    if (status) status.textContent = copied ? 'Email address copied.' : 'Copy unavailable. Select the visible email address to copy it manually.';
    timer = setTimeout(() => {
      button.textContent = original;
      delete button.dataset.copyState;
    }, 2600);
  });
}

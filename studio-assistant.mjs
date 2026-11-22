/* One opt-in assistant for the portfolio and its current case studies.
   The separate GitHub Pages application owns all AI, voice and 3D work.
   No iframe (or request to that application) exists before activation. */
const standalone = '/digital-twin-demo/';
const embedded = standalone + '?embed=assistant';
const root = document.documentElement;
const supportsDialog = typeof HTMLDialogElement === 'function' &&
  typeof HTMLDialogElement.prototype.showModal === 'function';
const launchIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="21" height="21"><path d="M12 2.5 14.5 9.5 21.5 12 14.5 14.5 12 21.5 9.5 14.5 2.5 12 9.5 9.5Z" fill="currentColor"/></svg>';

if (parent === window) {
  const floating = document.createElement('a');
  floating.className = 'studio-assistant-launcher';
  floating.href = standalone;
  floating.dataset.studioAssistant = '';
  floating.innerHTML = '<span class="studio-assistant-symbol">'+launchIcon+'</span><span>Ask Sadeq’s AI</span>';
  document.body.append(floating);
  root.classList.add('studio-assistant-enabled');
}

if (supportsDialog && parent === window) {
  const dialog = document.createElement('dialog');
  dialog.className = 'studio-assistant-dialog';
  dialog.id = 'studio-assistant-dialog';
  dialog.setAttribute('aria-labelledby','studio-assistant-title');
  dialog.innerHTML = '<header class="studio-assistant-head"><h2 id="studio-assistant-title"><span class="studio-assistant-symbol">'+launchIcon+'</span> Sadeq’s AI</h2><div class="studio-assistant-actions"><a class="studio-assistant-full" href="'+standalone+'">Open standalone <span aria-hidden="true">↗</span></a><button type="button" class="studio-assistant-close" aria-label="Close portfolio assistant"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></button></div></header><div class="studio-assistant-stage"><p class="studio-assistant-status" role="status" aria-live="polite"></p></div>';
  document.body.append(dialog);
  const stage = dialog.querySelector('.studio-assistant-stage');
  const status = dialog.querySelector('.studio-assistant-status');
  const closeButton = dialog.querySelector('.studio-assistant-close');
  const directLink = dialog.querySelector('.studio-assistant-full');
  const launchers = [...document.querySelectorAll('[data-studio-assistant]')];
  let frame = null, trigger = null, closing = false, closeTimer = 0, readyTimer = 0;

  function tell(type, data = {}) {
    if (frame?.contentWindow) frame.contentWindow.postMessage({type,...data}, location.origin);
  }
  function theme() {
    tell('portfolio-theme', {theme: root.dataset.theme === 'dark' ? 'dark' : 'light'});
  }
  function say(message) {
    status.textContent = message;
    status.hidden = !message;
  }
  function removeFrame() {
    clearTimeout(closeTimer);
    clearTimeout(readyTimer);
    closeTimer = readyTimer = 0;
    frame?.remove();
    frame = null;
    dialog.classList.remove('is-ready');
    stage.removeAttribute('aria-busy');
    say('');
  }
  function reset(returnFocus = true) {
    removeFrame();
    closing = false;
    if (dialog.open) dialog.close();
    if (!root.classList.contains('studio-assistant-open')) return;
    root.classList.remove('studio-assistant-open');
    launchers.forEach(link=>link.setAttribute('aria-expanded','false'));
    document.dispatchEvent(new CustomEvent('studio-assistant-close'));
    const lastTrigger = trigger;
    trigger = null;
    if (returnFocus && lastTrigger?.isConnected) lastTrigger.focus({preventScroll:true});
  }
  function requestClose() {
    if (!dialog.open || closing) return;
    closing = true;
    if (!frame) { reset(); return; }
    tell('twin-dispose');
    // A load error or a slow/unresponsive frame cannot prevent closure.
    closeTimer = setTimeout(()=>reset(), 650);
  }
  function open(lastTrigger) {
    if (dialog.open) return;
    trigger = lastTrigger;
    closing = false;
    root.classList.add('studio-assistant-open');
    document.dispatchEvent(new CustomEvent('studio-assistant-open'));
    dialog.showModal();
    launchers.forEach(link=>link.setAttribute('aria-expanded','true'));
    closeButton.focus({preventScroll:true});
    say('Opening the interactive studio…');
    stage.setAttribute('aria-busy','true');
    const child = document.createElement('iframe');
    child.className = 'studio-assistant-frame';
    child.title = 'Sadeq’s interactive Digital Twin assistant';
    child.setAttribute('allow','microphone; autoplay');
    child.referrerPolicy = 'no-referrer';
    child.addEventListener('load',()=>{
      if (frame!==child) return;
      if (closing) tell('twin-dispose');
      else theme();
    });
    child.addEventListener('error',()=>{
      if (frame!==child || closing) return;
      stage.removeAttribute('aria-busy');
      say('The studio could not load here. You can open it standalone.');
    });
    frame = child;
    child.src = embedded;
    stage.prepend(child);
    readyTimer = setTimeout(()=>{
      if (frame!==child || closing) return;
      stage.removeAttribute('aria-busy');
      say('The studio is taking longer to load. Open it standalone if needed.');
    }, 12000);
  }
  for (const link of launchers) {
    link.setAttribute('aria-haspopup','dialog');
    link.setAttribute('aria-controls',dialog.id);
    link.setAttribute('aria-expanded','false');
    link.addEventListener('click',event=>{
      // Native navigation remains available without JS, and through modified
      // clicks or the explicitly labelled standalone link.
      if (event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open(link);
    });
  }
  closeButton.addEventListener('click',requestClose);
  directLink.addEventListener('click',requestClose);
  dialog.addEventListener('cancel',event=>{event.preventDefault();requestClose();});
  dialog.addEventListener('close',()=>{if(!dialog.open)reset();});
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const bounds=dialog.getBoundingClientRect();
    if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)requestClose();
  });
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin || !frame || event.source!==frame.contentWindow || !event.data || typeof event.data!=='object')return;
    const type=event.data.type;
    if(type==='twin-ready') {
      if(closing){tell('twin-dispose');return;}
      clearTimeout(readyTimer);
      stage.removeAttribute('aria-busy');
      say('');
      theme();
      // The child owns its working header and close control. Keep the
      // outer header only as a keyboard-accessible fallback after ready.
      dialog.classList.add('is-ready');
      if(document.activeElement===closeButton) frame.focus({preventScroll:true});
    } else if(type==='twin-close' || (type==='twin-disposed' && closing)) reset();
  });
  // Case studies and the homepage use different theme controllers, but share
  // the root theme attribute. Send only the public two-value theme preference.
  new MutationObserver(theme).observe(root,{attributes:true,attributeFilter:['data-theme']});
  window.addEventListener('pagehide',()=>{
    if(!dialog.open)return;
    tell('twin-dispose');
    // Navigating away cannot wait on a child response; removal releases any
    // recording/audio regardless of whether its handler was ready.
    reset(false);
  });
}

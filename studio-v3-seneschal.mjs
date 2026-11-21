/* Fit the local compact guides to their actual contents, so the page has
   one normal scroll surface and no hidden guide controls. */
for (const id of ['system-map', 'animated-guide']) {
  const frame = document.getElementById(id);
  if (!frame || frame.closest('[data-guide-protocol]')?.dataset.guideProtocol !== 'portfolio') continue;
  let observer;
  function attach() {
    observer?.disconnect();
    if (!frame.getAttribute('src')) return;
    let inner;
    try { inner = frame.contentDocument; } catch { return; }
    const main = inner?.querySelector('main');
    if (!main) return;
    const measure = () => {
      const view = inner.defaultView;
      if (!view) return;
      const mainBox = main.getBoundingClientRect();
      const bodyBox = inner.body.getBoundingClientRect();
      const bodyStyle = view.getComputedStyle(inner.body);
      const mainStyle = view.getComputedStyle(main);
      const margin = value => Number.parseFloat(value) || 0;
      const bottom = Math.max(bodyBox.bottom, mainBox.bottom + margin(mainStyle.marginBottom) + margin(bodyStyle.paddingBottom));
      const needed = Math.ceil(bottom + view.scrollY + margin(bodyStyle.marginBottom) + 2);
      if (needed < 200 || needed > 2200) return;
      const fitted = needed + 'px';
      if (frame.style.height !== fitted) {
        frame.style.height = fitted;
        frame.dataset.caseMeasured = String(needed);
      }
    };
    measure();
    if ('ResizeObserver' in window) {
      observer = new ResizeObserver(measure);
      observer.observe(main);
    }
    inner.fonts?.ready.then(measure);
  }
  frame.addEventListener('load', attach);
  if (frame.contentDocument?.readyState === 'complete') attach();
}

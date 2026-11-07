/* Shared public-page analytics. No banner, cookies, advertising or consent grant. */
(() => {
  'use strict';
  if (window.top !== window.self || location.hostname !== 'rammeshgar.github.io') return;
  if (window.__portfolioAnalyticsStarted) return;
  if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
  window.__portfolioAnalyticsStarted = true;

  const measurementId = 'G-THJ1V23VJJ';
  const projectId = 'whwno3sxgm';
  const section = location.pathname.split('/').filter(Boolean)[0] || 'home';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  // Advanced consent mode sends cookieless measurements, without inventing consent.
  window.gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied'
  });
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('set', 'url_passthrough', false);
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: location.origin + location.pathname
  });
  window.clarity = window.clarity || function () {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };
  window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' });
  window.clarity('set', 'portfolio_section', section);

  // Remove analytics cookies left by the previous unconditional installation.
  for (const item of document.cookie.split(';')) {
    const name = item.split('=')[0].trim();
    if (!/^(_ga(?:_|$)|_clck$|_clsk$)/.test(name)) continue;
    for (const domain of ['', '; Domain=' + location.hostname]) {
      document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax' + domain;
    }
  }
  function addTag(src, name) {
    if (document.querySelector('script[data-portfolio-tag="' + name + '"]')) return;
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = src;
    tag.dataset.portfolioTag = name;
    // Blocking analytics must never break portfolio navigation or the assistant.
    tag.onerror = () => window.dispatchEvent(new CustomEvent('portfolio-analytics-blocked', { detail: name }));
    document.head.appendChild(tag);
  }
  const start = () => {
    addTag('https://www.googletagmanager.com/gtag/js?id=' + measurementId, 'ga4');
    addTag('https://www.clarity.ms/tag/' + projectId, 'clarity');
  };
  const schedule = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 1500 });
    else window.setTimeout(start, 0);
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
})();

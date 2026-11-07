import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Also used by the canonical Twin builder so rebuilding does not restore old tags.
export function withAnalytics(html, src = '../assets/portfolio-analytics.js?v=20261107') {
  html = html.replace(/<script\b[^>]*src="https:\/\/www\.googletagmanager\.com\/gtag\/js[^>]*><\/script>\s*/g, '')
    .replace(/<script>\s*(?:window\.dataLayer[\s\S]*?|\(function\(c,l,a,r,i,t,y\)[\s\S]*?)<\/script>\s*/g, '');
  html = html.replace(/(<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*content=")([^"]+)(")/gi, (_, a, policy, b) => {
    const directives = policy.split(';').map(x => x.trim()).filter(Boolean).map(x => {
      if (x.startsWith('script-src ') && !x.includes('https://www.clarity.ms')) return x + ' https://www.googletagmanager.com https://www.clarity.ms https://scripts.clarity.ms';
      if (x.startsWith('connect-src ')) return "connect-src https://*.google-analytics.com https://*.clarity.ms";
      if (x.startsWith('img-src ') && !x.includes('https://*.clarity.ms')) return x + ' https://*.google-analytics.com https://*.clarity.ms';
      return x;
    });
    return a + directives.join('; ') + b;
  });
  if (!html.includes('portfolio-analytics.js')) html = html.replace('</head>', `<script defer src="${src}"></script>\n</head>`);
  return html;
}

if (process.argv[1] && import.meta.url === new URL('file:///' + resolve(process.argv[1]).replaceAll('\\', '/')).href) {
  const root = resolve(import.meta.dirname, '..');
  for (const page of ['index.html', 'exchange-universe/index.html', 'qa-suite/index.html', 'seneschal/index.html']) {
    const file = resolve(root, page);
    writeFileSync(file, withAnalytics(readFileSync(file, 'utf8'), page === 'index.html' ? 'assets/portfolio-analytics.js?v=20261107' : '../assets/portfolio-analytics.js?v=20261107'));
  }
}

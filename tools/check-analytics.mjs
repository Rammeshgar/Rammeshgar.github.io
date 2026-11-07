import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { withAnalytics } from './analytics-install.mjs';

const root = resolve(import.meta.dirname, '..');
const twin = resolve(root, '../Twin-Analytics-20261107');
const source = readFileSync(resolve(root, 'assets/portfolio-analytics.js'), 'utf8');
const browser = await chromium.launch({ headless: true });
const mime = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const pages = ['/', '/exchange-universe/', '/qa-suite/', '/seneschal/', '/digital-twin-demo/'];
let checks = 0;
async function setup(options = {}) {
  const context = await browser.newContext({ viewport: options.mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
  if (options.dnt) await context.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { get: () => '1' }));
  if (options.gpc) await context.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', { get: () => true }));
  const calls = [], violations = [];
  await context.addInitScript(() => document.addEventListener('securitypolicyviolation', e => { (window.__violations ||= []).push(e.blockedURI); }));
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== 'rammeshgar.github.io') {
      calls.push(url.href);
      if (options.blocked) return route.abort('blockedbyclient');
      if (url.hostname === 'www.clarity.ms') return route.fulfill({ contentType:'text/javascript', body:"navigator.sendBeacon('https://k.clarity.ms/collect','test');" });
      if (url.hostname === 'www.googletagmanager.com') return route.fulfill({ contentType:'text/javascript', body:"fetch('https://region1.google-analytics.com/g/collect',{method:'POST',body:'test'});" });
      return route.fulfill({ status: 204 });
    }
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = pathname.startsWith('/digital-twin-demo/') ? resolve(twin, pathname.slice('/digital-twin-demo/'.length)) : resolve(root, pathname.slice(1));
    if (!existsSync(file)) return route.fulfill({status:404,body:''});
    return route.fulfill({ contentType: mime[extname(file)] || 'application/octet-stream', body:readFileSync(file) });
  });
  const page = await context.newPage();
  return { context, page, calls, violations };
}
try {
  for (const path of pages) {
    const {context,page,calls} = await setup();
    await page.goto('https://rammeshgar.github.io' + path, {waitUntil:'load'});
    await page.waitForFunction(() => document.querySelectorAll('script[data-portfolio-tag]').length === 2);
    await page.waitForTimeout(350);
    const state = await page.evaluate(() => ({
      ga:window.dataLayer.map(x=>Array.from(x)), clarity:window.clarity.q.map(x=>Array.from(x)),
      cookies:document.cookie, violations:window.__violations || [],
      count:document.querySelectorAll('script[data-portfolio-tag]').length
    }));
    assert.equal(state.count, 2);
    assert.equal(state.ga[0][1], 'default');
    assert(Object.values(state.ga[0][2]).every(x => x === 'denied'));
    assert.deepEqual(state.clarity[0], ['consentv2',{ad_Storage:'denied',analytics_Storage:'denied'}]);
    assert.equal(state.cookies, '');
    assert(!state.violations.some(x=>/clarity|google-analytics|googletagmanager/.test(x)), JSON.stringify(state.violations));
    assert(calls.some(x => x.includes('k.clarity.ms/collect')));
    assert(calls.some(x => x.includes('google-analytics.com/g/collect')));
    const originalCount = calls.filter(x=>/\/tag\/|gtag\/js/.test(x)).length;
    await page.addScriptTag({url:'https://rammeshgar.github.io/assets/portfolio-analytics.js?v=20261107'});
    await page.waitForTimeout(100);
    assert.equal(calls.filter(x=>/\/tag\/|gtag\/js/.test(x)).length,originalCount);
    console.log('PASS',path,'single tags, denied consent, no cookies, both collection endpoints permitted'); checks++;
    await context.close();
  }
  for (const option of [{dnt:true},{gpc:true},{blocked:true,mobile:true}]) {
    const {context,page,calls} = await setup(option);
    await page.goto('https://rammeshgar.github.io/seneschal/',{waitUntil:'load'});
    await page.waitForTimeout(1800);
    if (!option.blocked) assert(!calls.some(x=>/clarity|googletagmanager|google-analytics/.test(x)));
    assert(await page.locator('h1').isVisible());
    assert(await page.locator('footer a').first().isVisible());
    if(option.blocked) {
      assert(calls.some(x=>x.includes('clarity.ms')));
      await page.screenshot({path:resolve(root,'../analytics-mobile-check.png'),fullPage:false});
    }
    console.log('PASS',JSON.stringify(option),'privacy signal or blocked analytics leaves content/navigation working'); checks++;
    await context.close();
  }
  for (const page of ['index.html','exchange-universe/index.html','qa-suite/index.html','seneschal/index.html']) {
    const html=readFileSync(resolve(root,page),'utf8');
    assert.equal((html.match(/src="[^"]*portfolio-analytics.js/g)||[]).length,1);
    assert(!html.includes('www.clarity.ms/tag/'));
    assert(!html.includes('src="https://www.googletagmanager.com/gtag/js'));
    assert.equal(withAnalytics(html),html,'installer is idempotent');
  }
  assert(!source.includes("'granted'"));
  console.log(checks+' browser scenarios passed; no real analytics traffic was sent.');
} finally { await browser.close(); }

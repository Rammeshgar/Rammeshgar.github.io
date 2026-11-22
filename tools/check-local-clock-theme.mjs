/** Offline browser regression for the shared local-clock theme across public routes. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {access,readFile,stat} from 'node:fs/promises';
import {dirname,extname,resolve,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const twin=resolve(process.env.TWIN_SOURCE||resolve(root,'../twin'));
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const executablePath=process.env.CHROME_PATH||(await access(chrome).then(()=>chrome,()=>undefined));
const browser=await chromium.launch({headless:true,executablePath,args:['--mute-audio']});
const origin='https://rammeshgar.github.io',prefix='/digital-twin-demo/';
const files={'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'};
const routes=['/','/exchange-universe/','/exchange-universe-monitor-case/','/seneschal/','/digital-twin/','/afterlight-case/','/qa-suite/','/digital-twin-demo/','/digital-twin/system-map.html?layout=compact'];
const utc=Date.parse('2026-11-22T01:00:00Z');
const key='studio-local-theme-override-v1';
try{
 for(const [timezoneId,expected] of [['Asia/Tokyo','light'],['America/New_York','dark']]){
  const context=await browser.newContext({timezoneId,reducedMotion:'reduce',viewport:{width:1280,height:800},serviceWorkers:'block'});
  await context.addInitScript(({utc})=>{
   const NativeDate=Date;window.__themeTestTime=utc;
   window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[window.__themeTestTime]));}static now(){return window.__themeTestTime;}};
  },{utc});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());if(url.origin!==origin)return route.abort();
   if(url.pathname==='/assets/portfolio-analytics.js')return route.fulfill({contentType:'text/javascript',body:''});
   const base=url.pathname.startsWith(prefix)?twin:root,suffix=decodeURIComponent(url.pathname.startsWith(prefix)?url.pathname.slice(prefix.length):url.pathname.slice(1));
   let file=resolve(base,suffix||'index.html');const rel=relative(base,file);
   if(rel.startsWith('..')||isAbsolute(rel))return route.fulfill({status:403,body:''});
   try{if((await stat(file)).isDirectory())file=resolve(file,'index.html');if(!files[extname(file)])return route.fulfill({status:204,body:''});return route.fulfill({contentType:files[extname(file)],body:await readFile(file)});}catch{return route.fulfill({status:404,body:''});}
  });
  const page=await context.newPage();
  for(const path of routes){
   await page.goto(origin+path,{waitUntil:'domcontentloaded'});
   const actual=await page.evaluate(()=>({theme:document.documentElement.dataset.theme,hour:new Date().getHours(),override:localStorage.getItem('studio-local-theme-override-v1')}));
   assert.equal(actual.theme,expected,`${timezoneId} ${path} ${JSON.stringify(actual)}`);
   assert.equal(actual.override,null,'Automatic choices must not be saved');
  }
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#theme-toggle').click();
  const override=expected==='light'?'dark':'light';
  await page.waitForFunction(theme=>document.documentElement.dataset.theme===theme,override);
  assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).theme,key),override);
  await page.goto(origin+'/digital-twin/',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('html').getAttribute('data-theme'),override);
  await page.goto(origin+'/digital-twin-demo/',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('html').getAttribute('data-theme'),override);
  // Cross the next local boundary and trigger the same refresh used on focus.
  await page.evaluate(()=>{window.__themeTestTime+=13*60*60*1000;window.dispatchEvent(new Event('focus'));});
  assert.equal(await page.evaluate(()=>window.PortfolioTheme.preference),null,'Manual override expires at the next boundary');
  const clockTheme=await page.evaluate(()=>new Date().getHours()>=7&&new Date().getHours()<19?'light':'dark');
  assert.equal(await page.locator('html').getAttribute('data-theme'),clockTheme);
  console.log(`PASS ${timezoneId}: ${routes.length} routes, manual cross-page sync, automatic boundary reset`);
  await context.close();
 }
}finally{await browser.close();}

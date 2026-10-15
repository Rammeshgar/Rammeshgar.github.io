import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(join(root,p),'utf8');
const home=read('index.html'),module=read('production.mjs'),casePage=read('exchange-universe/index.html');
const qa=read('qa-suite/index.html'),seneschal=read('seneschal/index.html'),twin=read('digital-twin-demo/index.html'),css=read('production.css');
let total=0;const check=(name,test)=>{test();total++;console.log('PASS:',name)};
check('professional focus and all three early actions are explicit',()=>{
 const intro=home.slice(home.indexOf('<section class="portfolio-intro'),home.indexOf('<section class="work"'));
 assert(intro.includes('Configuration &<span class="serif">workflow validation.'));
 for(const text of ['View selected work','Request CV','Contact'])assert(intro.includes(text));
 assert(!intro.includes('data-open-ai'));
 assert(intro.includes('FRAIA')&&intro.includes('Peroptyx'));
});
check('CV request is an honest email action, not a fabricated download',()=>{
 assert(home.includes('id="request-cv" href="mailto:rezaisadeq0@gmail.com?subject=CV%20request"'));
 assert(!/href=["'][^"']*(?:Desktop|Resume\.pdf|CV\.pdf)/i.test(home));
});
check('one project overview is ordered QA, Exchange, Seneschal',()=>{
 const start=home.indexOf('class="project-index"'),end=home.indexOf('class="work-end"');
 assert(start>0&&end>start);
 const index=home.slice(start,end);
 assert(index.indexOf('Peoples Clinic')<index.indexOf('Exchange Universe'));
 assert(index.indexOf('Exchange Universe')<index.indexOf('Seneschal'));
 assert.equal((index.match(/My contribution/g)||[]).length,3);
 assert(index.includes('Product illustration, not a private-session screenshot.'));
 assert(!home.includes('class="seneschal-story"'));assert(!home.includes('class="story-divider"'));
 for(const [id,route] of [['qa-case','qa-suite/'],['exchange-case','exchange-universe/'],['seneschal-case','seneschal/']]){
  const card=index.match(new RegExp('<article id="'+id+'"[^>]*>([\\s\\S]*?)</article>'))?.[1];assert(card,id);
  assert(card.includes('href="'+route+'"'));assert(card.includes('Interactive case study'));assert(card.includes('Source ↗'));
 }
});
check('old frame sequence is retained but native video timeline owns scroll motion',()=>{
 assert(existsSync(join(root,'hero-scroll.mjs')));
 assert(!module.includes("import './hero-scroll.mjs'"));
 assert(!home.includes('id="hero-frames"'));
 assert(!home.includes('class="hero-scroll"'));
 assert(module.includes("import './hero-scroll-native.mjs'"));
 const native=read('hero-scroll-native.mjs');assert(native.includes("new ViewTimeline({subject:hero,axis:'block'})"));assert(native.includes('1000/30'));
 assert(!/scrollY|scrollTop|addEventListener\(['"]scroll['"]|hero-frames\/|warmCursor/.test(native));
 assert(native.includes('requestVideoFrameCallback'));assert(native.includes('saveData'));
});
check('manual film remains controlled and native scroll motion has a pause action',()=>{
 const tag=home.match(/<video\b[^>]*id="hero-video"[^>]*>/)[0];
 assert(tag.includes('preload="none"'));assert(tag.includes('data-src="assets/hero-motion.mp4"'));
 assert(!/\s(?:src|autoplay)=?/.test(tag));
 assert(home.includes('video.parentElement.classList.add(\'playing-film\')'));
 assert(home.includes('if(reduce.matches)'));
 assert(home.includes("if(document.hidden)stopMotion()"));
 assert(!home.includes('class="intro-figure"'));
 assert(css.includes('.intro-art{position:absolute;inset:0;'));
 assert(home.includes('class="intro-film-control wrap"'));
 assert(home.includes('id="scroll-motion-toggle"'));assert(home.includes('id="scroll-film-note"'));
});
check('music is opt-in once in the header, with lazy assistant',()=>{
 assert(module.includes("document.querySelector('#music-controls').append(musicButton)"));
 assert(module.includes('let musicWanted=false'));assert(module.includes("music.preload='none'"));
 assert(!module.includes("document.querySelector('.header').append"));
 assert(module.includes("assistant??=import('./mascot.js"));
 assert.equal((home.match(/id="music-controls"/g)||[]).length,1);assert(home.indexOf('id="music-controls"')<home.indexOf('<main>'));
});
check('known project evidence and boundaries are preserved in dedicated pages',()=>{
 for(const text of ['10-minute smoke-test schedule','three suites','clinical accuracy','Cloud model use','R is my strongest','Farsi native','not current market values']){
  assert((home+casePage+qa+seneschal).includes(text),text);
 }
 for(const id of ['monitor-dialog','seneschal-dialog','exchange-dialog'])assert(home.includes('id="'+id+'"'));
 assert(home.includes("dialog.addEventListener('close',()=>lastTrigger?.focus())"));
 assert((qa+read('qa-suite/system-map.html')).includes('saved screenshots and run history'));
 assert(seneschal.includes('Plan mode is read-only; Build asks by default'));
 assert(seneschal.includes('provider receives the prompt context'));
});
check('both tools are near the top with product evidence and decisions preserved below',()=>{
 const image=casePage.indexOf('class="dashboard-shot"'),story=casePage.indexOf('class="project-story'),inside=casePage.indexOf('id="inside"');
 assert(inside>0&&inside<image&&image<story);
 assert(casePage.indexOf('class="project-actions"')<image);
 assert(casePage.includes('href="#inside"'));assert(casePage.includes('id="animated-guide" data-src='));
 for(const label of ['Full-size map ↗','Full-size guide ↗'])assert(casePage.includes(label));
});
check('page IDs are unique and all local anchor destinations exist',()=>{
 for(const [name,html] of [['home',home],['case',casePage],['qa',qa],['seneschal',seneschal],['twin',twin]]){
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,name);
  for(const match of html.matchAll(/\bhref="#([^" ]+)"/g))assert(ids.includes(match[1]),name+' anchor '+match[1]);
 }
});
check('referenced page images and local stylesheet/module files exist',()=>{
 for(const [prefix,html] of [['',home],['exchange-universe',casePage],['qa-suite',qa],['seneschal',seneschal],['digital-twin-demo',twin]]){
  for(const m of html.matchAll(/\b(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)){
   if(/^(?:https?:|mailto:|data:|#)/.test(m[1]))continue;
   assert(existsSync(join(root,prefix,m[1])),prefix+'/'+m[1]);
  }
 }
});
check('inline JavaScript and JSON metadata parse',()=>{
 for(const m of home.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){
  if(m[1].includes('application/ld+json')||m[1].includes('importmap'))JSON.parse(m[2]);
  else if(m[2].trim())new vm.Script(m[2]);
 }
});
check('all four real lazy figures remain outside native links and preserve focus/touch controls',()=>{
 const index=home.slice(home.indexOf('class="project-index"'),home.indexOf('class="work-end"'));
 assert.equal((index.match(/class="index-preview"/g)||[]).length,0);
 assert.equal((index.match(/<iframe\b/g)||[]).length,3);assert(!/<video\b/.test(index));
 assert(index.includes('data-src="exchange-universe/guide.html?view=guide&amp;layout=preview"'));assert(!/id="exchange-machine-preview"[^>]*\ssrc=/.test(index));
 for(const link of index.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g))assert(!link[0].includes('<iframe'));
 assert(!home.includes('class="preview-toggle"'));assert(home.includes('id="project-preview-motion"'));
 for(const name of ['qa-suite','seneschal','digital-twin']){assert(home.includes('data-src="'+name+'/guide.html?view=guide&amp;layout=preview"'));assert(!new RegExp('id="'+name+'-machine-preview"[^>]*\\ssrc=').test(home));}
 const previews=read('exchange-card-preview.mjs');assert(previews.includes("card.addEventListener('focusin'"));assert(previews.includes("card.addEventListener('pointerenter'"));assert(previews.includes('owner?.deactivate()'));assert(previews.includes('saveData'));
 assert(css.includes('@media(prefers-reduced-motion:reduce){.intro-art video{display:none!important}.index-preview,.index-image>img{transition:none}}'));
});
check('retained static diagrams keep complete accessible meaning while real tools replace inline highlights',()=>{
 for(const [route,html] of [['qa-suite',qa],['seneschal',seneschal]]){
  const staticHtml=read(route+'/flow-static.html');
  const svg=staticHtml.match(/<svg\b([\s\S]*?)<\/svg>/)?.[0];assert(svg);
  assert(svg.includes('role="img"'));
  assert(/aria-labelledby="([^"]+)"[^>]*><title id="/.test(svg));
  for(const id of svg.match(/aria-labelledby="([^"]+)"/)[1].split(' '))assert(svg.includes('id="'+id+'"'));
  if(route==='qa-suite'){assert(svg.indexOf('class="diagram-arrow"')<svg.indexOf('class="flow-node"'));assert.equal((svg.match(/data-flow-node=/g)||[]).length,4);assert.equal((svg.match(/node-focal/g)||[]).length,1);}
  else{assert(!html.includes('<svg class="flow-diagram"'));for(const id of ['workflow','seneschal-dependencies','seneschal-permissions','seneschal-session','seneschal-review'])assert(html.includes('id="'+id+'"'),id);}
  for(const rect of svg.matchAll(/<rect class="node-box"([^>]*)>/g)){
   for(const attribute of ['x','y','width','height'])assert.equal(Number(rect[1].match(new RegExp(attribute+'="([0-9]+)"'))[1])%4,0);
  }
  assert(!/<script\b/.test(staticHtml));assert(staticHtml.includes('role="img"'));assert(staticHtml.includes('<title'));
  assert(html.includes('id="system-map"'));assert(html.includes('id="animated-guide"'));
  assert(html.includes('Full-size map'));assert(html.includes('Full-size guide'));
  assert(!/setInterval|autoplay/.test(html));
  assert(read(route+'/guide.html').includes("connect-src 'none'"));
 }
});
check('step selection changes emphasis without hiding facts or running work',()=>{
 const source=read('case-studies.js'),nodes=[],buttons=[];
 const classes=()=>({set:new Set(),toggle(name,on){on?this.set.add(name):this.set.delete(name)}});
 for(const name of ['first','second']){
  const item={classList:classes()};nodes.push({getAttribute:()=>name,classList:classes()});
  buttons.push({attrs:{},handlers:{},getAttribute:()=>name,setAttribute(k,v){this.attrs[k]=v},closest:()=>item,addEventListener(k,v){this.handlers[k]=v}});
 }
 const hint={hidden:true},group={querySelector:()=>hint,querySelectorAll:q=>q==='[data-flow-step]'?buttons:nodes};
 vm.runInNewContext(source,{document:{querySelectorAll:()=>[group]},Set},{timeout:1000});
 assert(!hint.hidden);buttons[1].handlers.click();assert.equal(buttons[1].attrs['aria-pressed'],'true');assert.equal(buttons[0].attrs['aria-pressed'],'false');assert(nodes[1].classList.set.has('is-selected'));
 assert(!/fetch\(|setTimeout|setInterval|innerHTML|\.hidden\s*=\s*true/.test(source));
});
check('preview routes are allowlisted without weakening private-path safeguards',()=>{
 const server=read('tools/serve-review.mjs');
 for(const name of ['qa-suite/','seneschal/','digital-twin/','case-studies.css','case-studies.js'])assert(server.includes("'"+name+"'"));
 assert(server.includes("s.startsWith('.')"));assert(server.includes('target.startsWith(root+sep)'));
 assert(server.includes("if(!['GET','HEAD'].includes(req.method))"));
});
console.log(total+' focused portfolio checks passed. Rendering and end-to-end services require separate browser checks.');

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=join(dirname(fileURLToPath(import.meta.url)),'..'),read=p=>readFileSync(join(root,p),'utf8');
let count=0;const check=(name,test)=>{test();count++;console.log('PASS:',name)};
const classes=()=>({values:new Set(),add(n){this.values.add(n)},remove(n){this.values.delete(n)},toggle(n,on){on?this.values.add(n):this.values.delete(n)}});
function nativeFixture({supported=true,calm=false,saveData=false}={}){
 const callbacks=new Map(),observers=[],events={},videoEvents={};let next=0,loads=0,now=0;
 const art={dataset:{},classList:classes()},button={hidden:true,textContent:'',setAttribute(){},addEventListener(k,f){events['button-'+k]=f}},note={textContent:''};
 const film={attrs:{},dataset:{src:'assets/hero-motion.mp4'},duration:12,currentTime:0,paused:true,seeking:false,getAttribute(k){return this.attrs[k]??null},set src(v){this.attrs.src=v},load(){loads++},addEventListener(k,f){videoEvents[k]=f},requestVideoFrameCallback:()=>99,cancelVideoFrameCallback(){}};
 const hero={querySelector:()=>art},document={hidden:false,querySelector:()=>hero,getElementById:id=>id==='hero-video'?film:id==='scroll-motion-toggle'?button:note,addEventListener(k,f){events[k]=f}};
 class View{constructor(){this.currentTime={value:60};View.instance=this}}
 class Size{constructor(fn){this.fn=fn}observe(){this.fn([{contentRect:{height:600}}])}}
 class Observe{constructor(fn){observers.push(fn)}observe(){}}
 const context={document,window:supported?{ViewTimeline:View}:{},ViewTimeline:View,ResizeObserver:Size,IntersectionObserver:Observe,matchMedia:()=>({matches:calm,addEventListener(){}}),navigator:{connection:{saveData,addEventListener(){}}},innerHeight:900,requestAnimationFrame:fn=>{callbacks.set(++next,fn);return next},cancelAnimationFrame:id=>callbacks.delete(id)};
 vm.runInNewContext(read('hero-scroll-native.mjs'),context,{timeout:1000});
 const advance=()=>{now+=40;const jobs=[...callbacks.values()];callbacks.clear();jobs.forEach(fn=>fn(now));};
 return {art,film,document,button,note,events,callbacks,advance,loads:()=>loads,show:value=>observers[0]([{isIntersecting:value}]),progress:value=>{View.instance.currentTime.value=value}};
}
check('native view progress seeks the actual original movie at different times',()=>{
 const f=nativeFixture();assert.equal(f.loads(),0);f.show(true);assert.equal(f.loads(),1);f.progress(70);f.advance();const first=f.film.currentTime;f.progress(90);f.advance();assert(f.film.currentTime>first);assert(f.film.currentTime>8);assert.equal(f.art.dataset.scrollStatus,'native');
});
check('scroll pause, offscreen and document hiding stop the bounded sampler',()=>{
 const f=nativeFixture();f.show(true);f.events['button-click']();assert.equal(f.callbacks.size,0);const time=f.film.currentTime;f.progress(90);f.advance();assert.equal(f.film.currentTime,time);f.events['button-click']();f.show(false);assert.equal(f.callbacks.size,0);f.show(true);f.document.hidden=true;f.events.visibilitychange();assert.equal(f.callbacks.size,0);
});
check('unsupported timelines, reduced motion and Save-Data keep static/manual fallback',()=>{
 for(const options of [{supported:false},{calm:true},{saveData:true}]){const f=nativeFixture(options);f.show(true);assert.equal(f.loads(),0);assert.equal(f.callbacks.size,0);assert(f.button.hidden);assert.notEqual(f.art.dataset.scrollStatus,'native');}
});
function previewFixture(){
 const handlers={},windows={},docs={},observations=[],sent=[];
 const host={classList:classes()},frame={attrs:{},contentWindow:{postMessage:m=>sent.push(m)},getAttribute(k){return this.attrs[k]??null},set src(v){this.attrs.src=v}};
 const toggle={textContent:'',attrs:{},handlers:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){this.handlers[k]=f}};
 const card={querySelector:()=>host,contains:t=>t===toggle,addEventListener:(k,f)=>handlers[k]=f};
 const document={hidden:false,getElementById:id=>id==='exchange-case'?card:id==='exchange-machine-preview'?frame:toggle,addEventListener:(k,f)=>docs[k]=f};
 class Observe{constructor(fn){observations.push(fn)}observe(){}}
 const context={document,window:{addEventListener:(k,f)=>windows[k]=f},location:{origin:'http://fixture.local'},IntersectionObserver:Observe};
 vm.runInNewContext(read('exchange-card-preview.mjs'),context,{timeout:1000});
 return {handlers,docs,document,frame,toggle,host,sent,show:value=>observations[0]([{isIntersecting:value}]),ready:(source=frame.contentWindow,origin='http://fixture.local')=>windows.message({source,origin,data:{type:'exchange-anatomy-ready'}})};
}
check('actual card guide loads only on intent and ignores forged readiness',()=>{
 const f=previewFixture();f.show(true);assert.equal(f.frame.getAttribute('src'),null);f.handlers.focusin({target:{}});assert.equal(f.frame.getAttribute('src'),'exchange-universe/guide.html?view=guide&layout=preview');f.ready({});f.ready(f.frame.contentWindow,'https://wrong.invalid');assert(!f.host.classList.values.has('preview-active'));f.ready();assert(f.host.classList.values.has('preview-active'));assert(f.sent.at(-1).open);
});
check('shared pause, focus leave, offscreen and hidden document close the actual preview',()=>{
 const f=previewFixture();f.show(true);f.handlers.focusin();f.ready();assert(f.sent.at(-1).open);f.toggle.handlers.click();assert(!f.sent.at(-1).open);f.handlers.focusin();assert(!f.sent.at(-1).open);f.toggle.handlers.click();assert(f.sent.at(-1).open);f.handlers.focusout({relatedTarget:null});assert(!f.sent.at(-1).open);f.handlers.focusin();f.show(false);assert(!f.sent.at(-1).open);f.show(true);f.document.hidden=true;f.docs.visibilitychange();assert(!f.sent.at(-1).open);
});
console.log(count+' focused motion/lifecycle checks passed. Actual video presentation and SVG movement also need browser verification.');

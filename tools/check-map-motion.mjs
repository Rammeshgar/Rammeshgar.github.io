import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8'),code=read('assets/map-motion.js');
let count=0;const check=(name,fn)=>{fn();count++;console.log('PASS:',name);};
function fixture({reduced=false,saved=null,denied=false,supported=true}={}){
 const docEvents={},events={},ios=[],mutations=[],mutationOptions=[],storage=new Map(saved?[['sadeq-map-motion',saved]]:[]);
 class Element{
  constructor(tag){this.tagName=tag;this.attrs={};this.dataset={};this.children=[];this.events={};this.classList={contains:name=>(this.attrs.class||'').split(' ').includes(name)};}
  set id(value){this.attrs.id=value;}get id(){return this.attrs.id||'';}
  set className(value){this.attrs.class=value;}
  setAttribute(name,value){this.attrs[name]=String(value);if(name.startsWith('data-'))this.dataset[name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(value);}
  append(...children){for(const child of children){child.parentElement=this;this.children.push(child);}}
  prepend(child){child.parentElement=this;this.children.unshift(child);}
  insertBefore(child,before){child.parentElement=this;this.children.splice(this.children.indexOf(before),0,child);}
  after(child){this.parentElement.insertBefore(child,this.parentElement.children[this.parentElement.children.indexOf(this)+1]);}
  addEventListener(name,fn){this.events[name]=fn;}
  matches(){return this.tagName==='path'&&('edge'in this.dataset||'from'in this.dataset);}
  querySelectorAll(){return this.children.filter(child=>child.matches());}
  querySelector(){return this.querySelectorAll()[0]||null;}
  getTotalLength(){return 120;}getPointAtLength(length){return{x:length,y:0};}
 }
 const svg=new Element('svg'),edge=new Element('path'),other=new Element('path'),header=new Element('header'),main=new Element('main');
 edge.dataset={edge:'request',from:'client',to:'server',selected:'true'};other.dataset={edge:'return',from:'server',to:'client',selected:'false'};svg.append(edge,other);main.append(header,svg);
 svg.clock=7.25;svg.paused=true;if(supported){svg.pauseAnimations=()=>svg.paused=true;svg.unpauseAnimations=()=>svg.paused=false;}
 main.querySelector=selector=>selector==='header,.map-header'?header:null;
 const document={body:{dataset:{}},hidden:false,querySelectorAll:()=>[svg],querySelector:()=>main,createElement:tag=>new Element(tag),createElementNS:(_ns,tag)=>new Element(tag),addEventListener:(name,fn)=>docEvents[name]=fn};
 const media={matches:reduced,addEventListener:(_name,fn)=>media.change=fn};
 const context={document,matchMedia:()=>media,localStorage:{getItem:k=>{if(denied)throw Error('Denied');return storage.get(k)||null;},setItem:(k,v)=>{if(denied)throw Error('Denied');storage.set(k,v);}},IntersectionObserver:class{constructor(fn){this.fn=fn;ios.push(this);}observe(){}},MutationObserver:class{constructor(fn){this.fn=fn;mutations.push(this);}observe(_target,options){mutationOptions.push(options);}},window:{addEventListener:(name,fn)=>events[name]=fn}};
 vm.runInNewContext(code,context,{timeout:1000});
 const toolbar=main.children.find(child=>child.attrs.class==='map-motion-toolbar'),button=toolbar.children[1];
 return{svg,edge,other,button,main,document,media,storage,events,mutationOptions,signals:svg.children.filter(n=>n.attrs.class==='map-flow-signal'),see:visible=>ios[0].fn([{target:svg,isIntersecting:visible}]),mutate:()=>mutations[0].fn([{target:edge},{target:other}]),hide:value=>{document.hidden=value;docEvents.visibilitychange();},click:()=>button.events.click()};
}
check('all four maintained maps load local motion assets and preserve static routes',()=>{for(const project of ['exchange-universe','qa-suite','seneschal','digital-twin']){const html=read(project+'/system-map.html');assert(html.includes('../assets/map-motion.js'),project);assert(html.includes('../assets/map-motion.css'),project);assert(html.includes("connect-src 'none'"),project);assert(/<path[^>]*data-(?:edge|from)=/.test(html),project);}for(const file of ['qa-suite/system-map-static.html','seneschal/flow-static.html','digital-twin/map-static.html'])assert(!read(file).includes('map-motion.js'),file);});
check('native packets follow actual edge IDs and loop without a JavaScript frame scheduler',()=>{const f=fixture();assert.equal(f.signals.length,2);const packet=f.signals[0].children[0],motion=packet.children.find(n=>n.tagName==='animateMotion');assert.equal(motion.attrs.repeatCount,'indefinite');assert.equal(motion.children[0].attrs.href,'#'+f.edge.id);assert.equal(motion.attrs.rotate,'auto');assert(!code.includes('requestAnimationFrame'));assert.equal(f.signals[0].attrs['aria-hidden'],'true');});
check('only incident selected routes receive bright signals and selection updates do not restart time',()=>{const f=fixture();assert.equal(f.signals[0].dataset.active,'true');assert.equal(f.signals[1].dataset.active,'false');f.edge.dataset.selected='false';f.other.dataset.active='true';f.mutate();assert.equal(f.signals[0].dataset.active,'false');assert.equal(f.signals[1].dataset.active,'true');assert.equal(f.svg.clock,7.25);});
check('Seneschal incident markers and Twin active markers both brighten motion without pausing',()=>{assert(read('seneschal/system-map.html').includes('edge.dataset.incident=String(incident)'));assert(read('digital-twin/system-map.html').includes('edge.dataset.active=String(active)'));for(const contract of ['incident','active']){const f=fixture();f.see(true);f.edge.dataset.selected='false';f.edge.dataset[contract]='false';f.other.dataset[contract]='true';f.mutate();assert.equal(f.signals[0].dataset.active,'false');assert.equal(f.signals[1].dataset.active,'true',contract);assert(!f.svg.paused,contract);assert.equal(f.svg.clock,7.25);assert(f.mutationOptions[0].attributeFilter.includes('data-'+contract));f.click();f.edge.dataset[contract]='true';f.mutate();assert(f.svg.paused,contract+' respects manual pause');}});
check('map clocks run only while visible, foreground and not manually paused',()=>{const f=fixture();assert(f.svg.paused);f.see(true);assert(!f.svg.paused);f.hide(true);assert(f.svg.paused);f.hide(false);assert(!f.svg.paused);f.see(false);assert(f.svg.paused);f.see(true);assert(!f.svg.paused);assert.equal(f.svg.clock,7.25);});
check('manual Pause survives selection, visibility, page lifecycle and reload preference',()=>{const f=fixture();f.see(true);f.click();assert(f.svg.paused);assert.equal(f.button.attrs['aria-pressed'],'true');assert.equal(f.storage.get('sadeq-map-motion'),'paused');f.mutate();f.hide(true);f.hide(false);f.events.pagehide();f.events.pageshow();f.see(false);f.see(true);assert(f.svg.paused);const restored=fixture({saved:'paused'});restored.see(true);assert(restored.svg.paused);restored.click();assert(!restored.svg.paused);});
check('reduced motion is still, keeps manual intent and remains selectable',()=>{const f=fixture({reduced:true});f.see(true);assert(f.svg.paused);assert(f.button.disabled);assert.equal(f.document.body.dataset.mapMotion,'reduced');f.edge.dataset.selected='false';f.mutate();assert.equal(f.signals[0].dataset.active,'false');f.media.matches=false;f.media.change();assert(!f.svg.paused);f.click();f.media.matches=true;f.media.change();f.media.matches=false;f.media.change();assert(f.svg.paused);});
check('pagehide cancels native motion and pageshow resumes only an eligible map',()=>{const f=fixture();f.see(true);f.events.pagehide();assert(f.svg.paused);f.events.pageshow();assert(!f.svg.paused);f.see(false);f.events.pagehide();f.events.pageshow();assert(f.svg.paused);});
check('storage denial and unsupported animation keep a usable static map',()=>{const denied=fixture({denied:true});denied.see(true);denied.click();assert(denied.svg.paused);const fallback=fixture({supported:false});fallback.see(true);assert(fallback.button.disabled);assert.equal(fallback.document.body.dataset.mapMotion,'unavailable');});
console.log(count+' map direction, native looping, selection and pause/lifecycle checks passed.');

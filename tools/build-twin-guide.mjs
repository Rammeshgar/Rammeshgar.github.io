import {withTheme} from './portfolio-theme-build.mjs';
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {homedir} from 'node:os';
const here=dirname(fileURLToPath(import.meta.url)),root=resolve(here,'..'),out=join(root,'digital-twin');
const kitDir=process.env.ANATOMY_KIT_DIR||join(homedir(),'.codex','skills','anatomy','kit');
const k=await import(pathToFileURL(join(kitDir,'iso-kit.mjs'))),A=await import(pathToFileURL(join(kitDir,'audit.mjs')));
mkdirSync(out,{recursive:true});
// Each item is one actual, supported wooden or metal slab. No proxy audit shapes.
const P=k.fitProjection([[-106,-40,-12],[106,56,-12],[-86,-34,153],[86,28,153]],460,380,{pad:24,azimuth:62,elevation:24});
const R=A.recorder(P),items=[],parts=[];
function box(name,part,x,y,z,w,d,h,tone='mid',move=[0,0,0],ride='fixed',lit=false){
 const plan={x,y,w,d,r:Math.min(.8,w/5,d/5)},paths=k.slabOf(plan,z,h,P,3,.4);
 const shape=R.solid(A.slab(plan,z,h,{name,owner:name,ground:name.startsWith('stand.foot')},3));
 const at=[x+w/2,y+d/2,z+h/2],svg=k.solidSvg(paths,{tone,lit});
 const item=R.put({name,piece:ride,ride,move,at,svg,shapes:[shape]});item.part=part;items.push(item);parts.push({name,part,plan,z,h,move,ride});return item;
}
// Ground and framing.
for(const [x,y]of[[-87,-28],[77,-28],[-87,36],[77,36]])box(`stand.foot.${x}.${y}`,'avatar',x,y,-12,10,10,8,'lo');
box('base.deck','avatar',-98,-38,-4,196,94,8,'lo');
box('base.apron','avatar',-98,52,4,196,4,12,'mid');
for(const x of[-98,94])box(`base.trim.${x}`,'avatar',x,-38,4,4,90,3,'mid');
for(let i=0;i<3;i++)box(`base.board.${i}`,'avatar',-89+i*60,-31,4,58,77,1,'lo');
box('base.step.low','fallback',-37,66,-4,74,10,4,'lo');box('base.step.high','fallback',-33,56,0,66,10,4,'mid');
for(const x of[-84,76]){
 box(`frame.rear.${x}`,'context',x,-34,5,8,8,130);
 box(`frame.front.${x}`,'avatar',x,22,11,8,8,118);
 for(const z of[5,129])box(`frame.cap.${x}.${z}`,'avatar',x-3,19,z,14,14,6,'hi');
 box(`frame.bracket.${x}`,'context',x,-26,128,8,45,4);
 for(const z of[14,120])box(`frame.screw.${x}.${z}`,'avatar',x+3,30,z,2,1,2,'hi');
}
box('frame.backbar','context',-84,-34,135,168,8,7);
box('frame.frontbar','avatar',-87,19,135,174,14,7,'hi');
box('frame.crown','avatar',-66,21,142,132,10,8,'hi');
// Foreground curtain track: closed screens really cover the puppet, not its backdrop.
box('curtain.track.12','avatar',-76,12,127,152,3,3,'lo');
box('curtain.track.19','avatar',-73,19,127,146,3,3,'lo');
for(const x of[-73,69])box(`curtain.stop.${x}`,'avatar',x,12,130,4,10,3,'hi');
for(const side of[-1,1]){
 const ride=side<0?'curtainL':'curtainR',start=side<0?-64:0;
 box(`${ride}.carrier`,'avatar',start,12,124,64,10,3,'mid',[side*30,0,0],ride);
 for(let i=0;i<5;i++)box(`${ride}.pleat.${i}`,'avatar',start+i*12.8,14+(i%2)*2,11,12.8,5,113,i%2?'mid':'lo',[side*30,0,0],ride);
 box(`${ride}.hem`,'avatar',start,14,5,64,5,6,'mid',[side*30,0,0],ride);
}
// A block-carved mechanical puppet, supported from the stage, not a floating avatar.
box('puppet.support','context',-2,-9,5,4,4,93,'lo');
box('puppet.hip','avatar',-12,-5,43,24,13,6,'hi');
box('puppet.torso','avatar',-14,-5,49,28,14,36,'hi');
for(const x of[-11,3]){box(`puppet.leg.${x}`,'avatar',x,-3,12,8,10,31,'mid');box(`puppet.shoe.${x}`,'avatar',x,0,5,8,10,7,'hi');}
box('puppet.neck','voice',-4,0,85,8,6,4,'mid');
box('puppet.head','voice',-12,-3,99,24,13,23,'hi');
box('puppet.jawtrack','voice',-3,-3,87,6,3,12,'lo');
box('puppet.jaw','voice',-12,0,93,24,10,6,'hi',[0,0,-4],'jaw',true);
for(const x of[-7,5])box(`puppet.eye.${x}`,'avatar',x,10,110,2,1,2,'lo');
box('puppet.arm.left','avatar',-29,-2,67,15,7,8,'mid');
box('puppet.hand.left','avatar',-35,-2,67,6,9,8,'hi');
box('puppet.arm.right','avatar',14,-2,67,8,7,8,'mid');
box('puppet.hand.right','avatar',22,-2,67,7,9,8,'hi',[0,4,0],'hand');
// Cue rail and transcript tray are below the puppet so text survives a closed stage.
box('cue.rail','input',-87,34,5,56,12,2,'mid');
box('cue.card','input',-85,36,7,22,8,1,'hi',[25,0,0],'cue');
box('cue.contextstop','context',-31,34,5,4,12,6,'hi');
box('reply.tray','reply',34,34,5,47,14,2,'mid');
box('reply.card','fallback',36,36,7,43,10,1,'hi');
// Actual engraved/printed rules on the card, not floating connectors.
const rules=[0,1,2].map(i=>k.lineSvg(k.lineOnTop([39,38+i*2.5],[73-i*5,38+i*2.5],8.1,P),{tone:'lo',free:true})).join('');
const motionStates=Array.from({length:25},(_,i)=>{const m=modelAt(i/2,'typed');return{label:`teaching ${i/2}s`,shares:{curtainL:m.curtain,curtainR:m.curtain,jaw:m.jaw,hand:m.hand,cue:m.cue,fixed:0}};});
A.settle(R,P,{states:[0,...motionStates]});R.items.sort((a,b)=>a.key-b.key);
const art=R.items.map(i=>`<g data-moving="${i.ride}" data-component="${i.part}" data-vector='${JSON.stringify(i.move)}' data-key="${i.key}" data-lift="${k.depthOf(i.move,P)}">${i.svg}${i.name==='reply.card'?rules:''}</g>`).join('');
const svg=k.figureSvg({width:460,height:380,label:'A miniature wooden puppet theatre. A question cue slides to a stop, curtains open, and a supported puppet moves its jaw and hand while a transcript remains on a tray.',body:`<path class="iso-halo" d="${k.haloOf({x:-98,y:-38,w:196,d:94,r:2},-12,8,P)}"/>${art}`});
export const scenarios=['typed','speech','no-mic','no-model'];
export function modelAt(t,scenario='typed'){
 t=Math.max(0,Math.min(12,t));const smooth=(a,b)=>{const x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*(3-2*x);};
 const ready=smooth(2,4),speaking=(scenario==='speech'||scenario==='typed')&&t>4&&t<10;
 return {t,cue:smooth(.5,2),curtain:scenario==='no-model'?0:ready,jaw:speaking?(Math.sin(t*9)**2)*.8:0,hand:speaking?(Math.sin((t-4)*2)**2)*.8:0,
 phase:t<2?'Question enters':t<4?'Using my work profile':scenario==='no-model'?'3D unavailable · text remains':scenario==='no-mic'?'Microphone unavailable · type instead':t<10?'Reply text + simulated performance':'Text stays available',
 transcript:t<4?'Reply appears after the context step.':scenario==='no-model'?'The 3D view is unavailable. You can still read and type.':scenario==='no-mic'?'No microphone? Type your question; speech input is optional.':'The reply uses a maintained profile of my work. AI can still be wrong.'};
}
const runtime=`
const P=${JSON.stringify(P)},modelAt=${modelAt.toString()},scenarios=${JSON.stringify(scenarios)};
const parts=['input','context','reply','voice','avatar','fallback'];
const params=new URLSearchParams(location.search),embedded=parent!==window,preview=params.get('layout')==='preview';
document.body.classList.toggle('preview',preview);document.body.classList.toggle('compact',params.get('layout')==='compact');
const nodes=[...document.querySelectorAll('[data-moving]')].map(el=>({el,ride:el.dataset.moving,v:JSON.parse(el.dataset.vector),key:Number(el.dataset.key),lift:Number(el.dataset.lift),sort:0}));let paintedOrder=nodes.map(n=>n.el);const movingNodes=nodes.filter(n=>n.ride!=='fixed');for(const n of nodes)n.sort=n.key;
const play=document.getElementById('play'),range=document.getElementById('progress'),readout=document.getElementById('readout'),caption=document.getElementById('transcript'),partText=document.getElementById('part-detail');
const still=matchMedia('(prefers-reduced-motion: reduce)');let open=!embedded,visible=true,userPaused=false,time=still.matches?6:0,scenario='typed',frame=0,last=0,selected='input',suspended=false,hold=0,cycles=0;
const details={input:'Your question: the sliding card represents what you type or say. Typing does not require microphone permission.',context:'My work profile: the card stop represents the maintained information used to guide a reply. AI can still be wrong.',reply:'Text reply: the front tray represents the readable answer. Voice and the 3D character are optional.',voice:'Voice: the moving jaw represents approximate mouth movement as the reply is read aloud.',avatar:'3D character: the opening curtains reveal the optional character, whose gestures blend while the reply plays.',fallback:'Text fallback: the closed stage and open front tray show that you can keep reading and typing if the microphone or 3D character is unavailable.'};
function project(v){const a=P.azimuth*Math.PI/180,e=P.elevation*Math.PI/180,s=P.scale*Math.sqrt(1.6);return[(v[0]*Math.sin(a)-v[1]*Math.cos(a))*s,((v[0]*Math.cos(a)+v[1]*Math.sin(a))*Math.sin(e)-v[2]*Math.cos(e))*s];}
function draw(){const m=modelAt(time,scenario);for(const n of movingNodes){const share=n.ride==='curtainL'||n.ride==='curtainR'?m.curtain:n.ride==='jaw'?m.jaw:n.ride==='hand'?m.hand:n.ride==='cue'?m.cue:0;const p=project(n.v.map(x=>x*share));n.sort=n.key+n.lift*share;n.el.setAttribute('transform','translate('+p[0].toFixed(3)+' '+p[1].toFixed(3)+')');}const ordered=[...nodes].sort((a,b)=>a.sort-b.sort).map(n=>n.el);if(ordered.some((el,i)=>el!==paintedOrder[i])){const layer=ordered[0].parentElement;for(const el of ordered)layer.appendChild(el);paintedOrder=ordered;}
 if(readout.textContent!==m.phase)readout.textContent=m.phase;if(caption.textContent!==m.transcript)caption.textContent=m.transcript;range.value=String(time);if(document.body.dataset.phase!==m.phase)document.body.dataset.phase=m.phase;document.body.dataset.time=time.toFixed(3);document.body.dataset.cycles=String(cycles);document.body.dataset.userPaused=String(userPaused);const playLabel=userPaused?'Play':'Pause';if(play.textContent!==playLabel)play.textContent=playLabel;}
function halt(){cancelAnimationFrame(frame);frame=0;last=0;}
function run(){if(!frame&&open&&visible&&!userPaused&&!still.matches&&!document.hidden&&!suspended)frame=requestAnimationFrame(tick);}
function tick(now){const dt=last?Math.min((now-last)/1000,1/30):0;last=now;if(time<12)time=Math.min(12,time+dt);else{hold+=dt;if(hold>=.9){time=0;hold=0;cycles++;}}draw();frame=0;run();}
function select(part,nextScenario){if(parts.includes(part)){selected=part;hold=0;last=0;time={input:0,context:1.5,reply:4,voice:4.5,avatar:3.5,fallback:4}[part];}if(scenarios.includes(nextScenario))scenario=nextScenario;else if(part==='fallback')scenario='no-model';else if(part==='voice')scenario='speech';if(still.matches)time=Math.max(6,time);for(const b of document.querySelectorAll('[data-select-part]'))b.setAttribute('aria-pressed',String(b.dataset.selectPart===selected));for(const b of document.querySelectorAll('[data-scenario]'))b.setAttribute('aria-pressed',String(b.dataset.scenario===scenario));for(const n of nodes)n.el.dataset.selected=String(n.el.dataset.component===selected);if(partText.textContent!==details[selected])partText.textContent=details[selected];draw();run();}
for(const b of document.querySelectorAll('[data-scenario]'))b.addEventListener('click',()=>{select(selected,b.dataset.scenario);});
for(const b of document.querySelectorAll('[data-select-part]'))b.addEventListener('click',()=>{select(b.dataset.selectPart);const stage=document.getElementById('stage');stage.scrollIntoView({block:'nearest',behavior:'auto'});stage.focus({preventScroll:true});if(embedded)parent.postMessage({type:'portfolio-guide-selection',part:selected,scenario},location.origin);});
document.getElementById('stage').addEventListener('click',event=>{const fill=event.target.closest?.('.iso-fill, .iso-top, .iso-shade'),physical=fill?.closest('[data-component]'),stage=document.getElementById('stage');if(!physical||!stage.contains(physical)||!parts.includes(physical.dataset.component))return;select(physical.dataset.component);if(embedded)parent.postMessage({type:'portfolio-guide-selection',part:selected,scenario},location.origin);});
play.addEventListener('click',()=>{userPaused=!userPaused;if(userPaused)halt();draw();run();});document.getElementById('replay').addEventListener('click',()=>{time=0;hold=0;userPaused=false;draw();run();});
range.addEventListener('input',()=>{userPaused=true;hold=0;halt();time=Number(range.value);draw();});
document.getElementById('stage').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();halt();userPaused=true;hold=0;time=e.key==='Home'?0:e.key==='End'?12:Math.max(0,Math.min(12,time+(e.key==='ArrowRight'?.5:-.5)));draw();});
new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(!visible)halt();else run();},{threshold:.01}).observe(document.getElementById('stage'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)halt();else run();});window.addEventListener('pagehide',()=>{suspended=true;halt();});window.addEventListener('pageshow',()=>{suspended=false;run();});
still.addEventListener('change',()=>{halt();play.disabled=still.matches;if(still.matches)time=6;draw();run();});
window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent||!event.data||typeof event.data!=='object')return;const m=event.data;if(m.type==='portfolio-figure'&&typeof m.open==='boolean'){open=m.open;if(m.theme==='light'||m.theme==='dark')document.body.dataset.theme=m.theme;if(!open)halt();else run();}else if(m.type==='portfolio-guide-selection'&&parts.includes(m.part)&&(m.scenario===undefined||scenarios.includes(m.scenario))){select(m.part,m.scenario);}});
play.disabled=still.matches;select(parts.includes(params.get('part'))?params.get('part'):'input',scenarios.includes(params.get('scenario'))?params.get('scenario'):undefined);if(embedded)parent.postMessage({type:'portfolio-figure-ready'},location.origin);run();
`;
const css=`${k.ISO_CSS}
:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;padding:20px;background:#eee9df;color:#173b34;font:15px/1.5 system-ui,sans-serif}body[data-theme=dark]{background:#122b27;color:#eee9df}main{max-width:860px;margin:auto}h1{font:normal 32px/1.1 Georgia,serif;margin:8px 0 12px}h2{font-size:15px;margin:0}.eyebrow{font-size:11px;letter-spacing:.14em;text-transform:uppercase}.figure-card{border:1px solid #798780;border-radius:8px;overflow:hidden}.card-head,.card-foot{padding:12px 16px;display:flex;justify-content:space-between;gap:12px;font-size:12px}.card-head{border-bottom:1px solid #798780}.card-foot{border-top:1px solid #798780;flex-wrap:wrap}.iso-stage{background:#e7e3d8;outline-offset:-4px;touch-action:pan-y}.iso-stage svg{display:block;width:100%;height:auto;max-height:420px}body[data-theme=dark] .iso-stage{background:#172f2a}.iso{--anatomy-paper:#e7e3d8;--anatomy-face:#d2d1c5;--anatomy-top:#eeeadf;--anatomy-hi:#173b34;--anatomy-mid:#4a6058;--anatomy-lo:#748078;--anatomy-faint:#a9b0a4;--anatomy-lit:#9f4c2e}body[data-theme=dark].iso{--anatomy-paper:#172f2a;--anatomy-hi:#ece6d9;--anatomy-mid:#b4bdb0;--anatomy-lo:#7e9488;--anatomy-faint:#4b655b;--anatomy-lit:#e5af8d}.controls{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}button,a{color:inherit}button{font:inherit;border:1px solid #839184;border-radius:5px;background:transparent;min-height:44px;padding:8px 12px;cursor:pointer}button[aria-pressed=true]{background:#173b34;color:#f5f0e5}body[data-theme=dark] button[aria-pressed=true]{background:#e5c4aa;color:#173b34}button:focus-visible,a:focus-visible,input:focus-visible,#stage:focus-visible{outline:3px solid #a95131;outline-offset:2px}label{font-size:12px}input[type=range]{width:100%;accent-color:#895134;min-height:32px}.explanation{border-top:1px solid #9aab9e;padding-top:14px}p{margin:8px 0 14px}.fine{font-size:12px;color:#53655d}body[data-theme=dark] .fine{color:#b9c5ba}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}.preview{padding:0}.preview .intro,.preview .controls,.preview .timeline,.preview .explanation,.preview footer,.preview .card-foot{display:none}.preview .figure-card{border:0;border-radius:0}.preview .card-head{padding:8px 14px}.preview .iso-stage svg{max-height:none}.compact{padding:10px}.compact .intro{display:none}.compact .card-head{padding:8px 10px}.compact .card-foot{padding:8px 10px}.compact button{font-size:12px;padding:6px 9px}.compact .iso-stage svg{max-height:280px}.compact .explanation{font-size:13px}.compact .controls{margin:8px 0;gap:5px}.compact .fine{font-size:11px} [data-component][data-selected=true] .iso-edge{stroke:var(--anatomy-lit)}@media(max-width:440px){body{padding:10px}h1{font-size:27px}.card-head,.card-foot{font-size:11px}.controls button{font-size:12px}.iso-stage svg{min-height:230px}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}`;
const themeCss=`body.iso[data-theme="light"]{--anatomy-paper:#e7e3d8;--anatomy-face:#d3dfcc;--anatomy-top:#e3e5d8;--anatomy-shade-0:#849a88;--anatomy-shade-1:#a5b59f;--anatomy-shade-2:#bdc9b3;--anatomy-shade-3:#d3dbc7;--anatomy-hi:#173b34;--anatomy-mid:#476150;--anatomy-lo:#6d7e67;--anatomy-faint:#a2ad94;--anatomy-lit:#8c432c;--anatomy-lit-top:#ddb498;--anatomy-lit-shade:#bd8160;--anatomy-halo:#78846d;--anatomy-halo-opacity:.22}body.iso[data-theme="dark"]{--anatomy-paper:#172f2a;--anatomy-face:#4a6252;--anatomy-top:#55705d;--anatomy-shade-0:#203c32;--anatomy-shade-1:#2c493b;--anatomy-shade-2:#3b5847;--anatomy-shade-3:#496753;--anatomy-hi:#e9e6d9;--anatomy-mid:#b0c0a8;--anatomy-lo:#7f997d;--anatomy-faint:#516d54;--anatomy-lit:#f1c3a5;--anatomy-lit-top:#ba8866;--anatomy-lit-shade:#87614b;--anatomy-halo:#071711;--anatomy-halo-opacity:.55}`;
const thumbnailCss=readFileSync(new URL('./thumbnail-layout.css',import.meta.url),'utf8');
const labels={typed:'Typed question',speech:'Simulated speech','no-mic':'No microphone','no-model':'No 3D model'};
const clarityCss='.mapping-key{font-size:13px;line-height:1.5;padding:8px 12px;border-left:2px solid #a15234;margin:8px 0 12px}.compact .intro{display:block}.compact .intro h1,.compact .intro .eyebrow,.compact .intro>p:not(.mapping-key){display:none}.compact .mapping-key{font-size:11px;padding:5px 8px;margin:0 0 8px}[data-component]{cursor:pointer}.iso-stage .iso-fill,.iso-stage .iso-top,.iso-stage .iso-shade{pointer-events:visiblePainted}.iso-stage .iso-edge,.iso-stage .iso-crease,.iso-stage .iso-bevel,.iso-stage .iso-line{pointer-events:none}.iso-stage [data-component]:hover .iso-edge{stroke:var(--anatomy-lit)}.part-readout{font-size:13px;line-height:1.45;margin:0;padding:10px 14px;border-top:1px solid #9aab9e}.compact .part-readout{font-size:12px;padding:8px 10px}.preview .part-readout{display:none}.preview .intro{display:none}';
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src data:; base-uri 'none'; form-action 'none'"><title>Digital Twin · the reply theatre</title><style>${css}</style></head><body class="iso" data-theme="light"><main><header class="intro"><p class="eyebrow">Digital Twin / how a reply is shown</p><h1>Watch a question become a reply</h1><p>The app answers questions about my work in text, with optional voice and a moving character. This example uses no microphone or AI service.</p><p class="mapping-key">Card = question · Card stop = my work profile<br>Puppet = optional voice/3D · Front tray = readable reply</p></header><section class="figure-card" aria-label="The reply theatre"><div class="card-head"><span>DIGITAL TWIN / REPLY EXAMPLE</span><strong>Voice and 3D are optional</strong></div><div id="stage" class="iso-stage" tabindex="0" role="group" aria-label="Reply theatre. Arrow keys step through the example, Home and End jump to the start and finish.">${svg}</div><div class="card-foot"><span>Select a part to see what it does</span><strong id="readout">Question enters</strong></div><p id="part-detail" class="part-readout">Your question: the card represents what you type or say.</p></section><div class="controls" aria-label="Example scenarios">${scenarios.map(s=>`<button type="button" data-scenario="${s}" aria-pressed="${s==='typed'}">${labels[s]}</button>`).join('')}</div><div class="timeline"><div class="controls"><button type="button" id="play">Pause</button><button type="button" id="replay">Replay</button></div><label for="progress">Move through the example</label><input type="range" id="progress" min="0" max="12" step="0.1" value="0"></div><section class="explanation"><h2>The readable reply</h2><p id="transcript">Reply appears after the context step.</p><div class="controls" aria-label="Inspect a component">${['input','context','reply','voice','avatar','fallback'].map((p,i)=>`<button type="button" data-select-part="${p}" aria-pressed="${i===0}">${({input:'Your question',context:'My work profile',reply:'Text reply',voice:'Voice',avatar:'3D character',fallback:'Text fallback'})[p]}</button>`).join('')}</div><p class="fine">The theatre represents the software. Open the original demo to use the real character and assistant.</p></section><footer><a href="./">Back to the case study</a></footer><noscript><p>The cue enters the context stop, the puppet represents optional speech/gesture output, and the front tray is the text fallback. All explanations remain readable; animation controls require JavaScript.</p></noscript></main><script>${runtime}</script></body></html>`;
const noScriptFacts='<ul><li>Input: typed questions work without microphone permission.</li><li>Context: the server uses a maintained professional profile; replies can still be wrong.</li><li>Reply: readable chat text is the foundation.</li><li>Voice: audio energy and transcript timing drive approximate, not phoneme-perfect mouth cues.</li><li>Avatar: authored gesture states blend; the optional 3D view is represented by the curtains.</li><li>Fallback: readable text remains when microphone or model loading is unavailable.</li></ul>';
const finalHtml=html.replace('</style>',themeCss+clarityCss+thumbnailCss+'</style>').replace('<noscript><p>','<noscript>'+noScriptFacts+'<p>').replace('<div class="controls" aria-label="Inspect a component">','<p class="fine">Choose a part to see how it connects to Digital Twin.</p><div class="controls" aria-label="Inspect a component">');
writeFileSync(join(out,'guide.html'),withTheme(finalHtml));writeFileSync(join(out,'guide-light.html'),finalHtml);writeFileSync(join(out,'guide-dark.html'),finalHtml.replace('<body class="iso" data-theme="light">','<body class="iso" data-theme="dark">'));
writeFileSync(join(out,'parts.json'),JSON.stringify({count:parts.length,projection:P,parts},null,2)+'\n');
A.auditOrExit(R,P,{frames:motionStates});console.log(`Twin theatre: ${parts.length} real solids; standalone guide built.`);

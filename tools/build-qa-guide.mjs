import {withTheme} from './portfolio-theme-build.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as k from './qa-kit/iso-kit.mjs';
import * as A from './qa-kit/audit.mjs';
import {qaAt,DURATION,SCENARIOS,PARTS,clamp,smooth,smokeEmailAllowed} from '../qa-suite/model.mjs';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const BASE={x:-132,y:-60,w:272,d:138,r:8};
const P=k.fitProjection([...k.boxCorners(BASE,-8,12),[-20,-48,94],[132,70,48]],660,380,{pad:32,azimuth:42,elevation:30});
export function scene(q=qaAt('pass',0)){
 const R=A.recorder(P),items=[];
 function slab(name,x,y,w,d,z,h,{tone='mid',part='run',move=null,lit=false,r=1,inner=''}={}){
  const plan={x,y,w,d,r},shape=A.slab(plan,z,h,{name,ground:name==='stand.bedplate'},5);
  const svg=k.solidSvg(k.slabOf(plan,z,h,P,5,Math.min(.6,h/3)),{tone,lit,inner});
  const item=R.put({name,piece:part,ride:move||part,at:[x+w/2,y+d/2,z+h/2],svg,shapes:[R.solid(shape)],moving:move});items.push(item);return item;
 }
 function round(name,x,y,r,z,h){const svg=k.solidSvg(k.cylinder(x,y,r,z,h,P,40,.4),{tone:'hi'});const item=R.put({name,piece:'checks',at:[x,y,z+h/2],svg,shapes:[R.solid(A.cylinder(x,y,r,z,h,{name},40))]});items.push(item);}
 slab('stand.bedplate',BASE.x,BASE.y,BASE.w,BASE.d,0,12,{tone:'lo',r:8});
 for(const [x,y]of [[-116,-44],[112,-44],[-116,58],[112,58]]){slab('stand.foot-pad.'+x+'.'+y,x,y,12,12,-8,3,{tone:'lo',r:3});slab('stand.foot.'+x+'.'+y,x+2,y+2,8,8,-5,5,{tone:'mid',r:2});}
 for(const x of [-108,102])slab('run.cross-member.'+x,x,-32,8,64,12,4);
 slab('run.deck',-112,-32,236,64,16,4,{tone:'lo'});
 for(const y of [-36,32])slab('run.bearing-rail.'+y,-116,y,244,4,12,8);
 for(let i=0;i<14;i++)slab('run.belt-slat.'+i,-111+i*16.5,-30,15,60,20,2,{tone:'mid',r:.7});
 for(const y of [-48,40]){slab('checks.gantry-post.'+y,-18,y,12,8,12,72);slab('checks.post-cap.'+y,-20,y,16,8,84,4,{tone:'hi'});}
 slab('checks.bridge',-18,-40,12,80,84,6,{tone:'hi'});
 slab('checks.camera',-25,-16,26,32,70,14,{tone:'hi',r:3,inner:k.lineSvg(k.sideSeam({x:-25,y:-16,w:26,d:32,r:3},78,P,5),{tone:'faint'})});
 round('checks.lens-mount',-12,0,12,65,5);round('checks.lens-barrel',-12,0,9,61,4);round('checks.lens-rim',-12,0,7,59,2);
 slab('checks.shutter',-19+q.shutter,-6,14,12,58,1,{tone:'hi',move:'shutter',lit:true,r:.5});
 for(const y of [-8,6])slab('checks.shutter-guide.'+y,-21,y,20,2,58,1);
 const sx=-98+q.sampleX,sy=q.sampleY;
 slab('checks.specimen-pallet',sx-13,sy-9,26,18,22,3,{tone:'hi',move:'sample',r:2});
 slab('checks.specimen-face',sx-10,sy-6,20,12,25,2,{tone:'hi',move:'sample',r:.5});
 for(const y of [-8,6])slab('checks.locating-pad.'+y,sx-12,sy+y,3,2,25,3,{move:'sample',tone:'mid'});
 for(const x of [62,96])slab('run.exit-guide.'+x,x,36,4,2,12,22,{r:.4});
 slab('run.diverter',66,34-q.diverter,30,24,30,3,{move:'diverter',tone:'hi'});
 slab('evidence.tray-floor',60,44,58,28,12,2,{tone:'lo'});
 for(const [x,w] of [[60,36],[96,22]])slab('evidence.tray-wall.44.'+x,x,44,w,2,14,5,{r:0});
 slab('evidence.tray-wall.70',60,70,58,2,14,5);
 for(const x of [60,116])slab('evidence.tray-end.'+x,x,46,2,24,14,5);
 slab('evidence.record',72,48+q.evidence/2,30,10,14,1.2,{tone:'hi',move:'record',r:.3,inner:k.lineSvg([0,1,2].map(i=>k.lineOnTop([75,50+q.evidence/2+i*2],[96-i*3,50+q.evidence/2+i*2],15.2,P)).join(''),{tone:'lo',free:true})});
 slab('evidence.clip',72,48+q.evidence/2,3,10,15.2,.8,{move:'record',tone:'mid',r:.2});
 slab('alerts.mount',-116,44,20,22,12,4,{tone:'mid'});slab('alerts.post',-110,50,6,8,16,34);
 slab('alerts.flag',-104,51,16,2,28+q.alert,7,{tone:'hi',move:'alert',r:.5});
 slab('review.control-housing',-64,44,34,20,12,9,{tone:'mid',r:3});
 for(const x of [-58,-44])slab('review.button.'+x,x,49,8,8,21,3,{tone:'hi',r:2});
 A.settle(R,P);R.items.sort((a,b)=>a.key-b.key);
 return {P,R,items:R.items,svg:R.items.map(i=>`<g id="qa-${i.name}" data-solid="${i.name}" data-motion="${i.moving||''}" data-part="${i.piece}">${i.svg}</g>`).join('')};
}
const base=scene();
const modelOffsets=q=>({sample:[q.sampleX,q.sampleY,0],shutter:[q.shutter,0,0],diverter:[0,-q.diverter,0],record:[0,q.evidence/2,0],alert:[0,0,q.alert]});
const motionStates=SCENARIOS.flatMap(s=>Array.from({length:57},(_,i)=>({label:s+' '+i/4,shares:{},offsets:modelOffsets(qaAt(s,i/4))})));
A.settle(base.R,P,{states:motionStates});base.items.sort((a,b)=>a.key-b.key);
const surfacePart=name=>/^checks\.(camera|lens|shutter|specimen)/.test(name)?'checks':/^run\.(deck|belt-slat|diverter)/.test(name)?'run':/^evidence\./.test(name)?'evidence':/^alerts\.(flag|post)/.test(name)?'alerts':/^review\./.test(name)?'review':null;
const assemblyOf=name=>PARTS.includes(name.split('.')[0])?name.split('.')[0]:'base';
const art=base.items.map(i=>`<g id="qa-${i.name}" data-solid="${i.name}" data-motion="${i.moving||''}" data-part="${assemblyOf(i.name)}"${surfacePart(i.name)?` data-hit-part="${surfacePart(i.name)}"`:''}>${i.svg}</g>`).join('');
const svg=k.figureSvg({width:660,height:380,label:'An optical inspection conveyor moves a selected check through a camera gate, separates a failure and keeps an evidence record for human investigation.',body:`<path class="iso-halo" d="${k.haloOf(BASE,-8,8,P)}"/><g id="qa-solids">${art}</g>`});
const font=readFileSync(join(root,'assets/inter-latin.woff2')).toString('base64');
const css=`@font-face{font-family:PortfolioInter;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900;font-display:swap}`+readFileSync(join(root,'qa-suite/guide.css'),'utf8')+'body.iso[data-theme]{font-family:PortfolioInter,Arial,sans-serif}';
const thumbnailCss=readFileSync(join(root,'tools/thumbnail-layout.css'),'utf8');
const code=readFileSync(join(root,'qa-suite/guide.js'),'utf8');
const payload=`const P=${JSON.stringify(P)},DEPTH=${JSON.stringify(base.items.map(i=>({name:i.name,key:i.key,moving:i.moving||null})))};const DURATION=${DURATION},SCENARIOS=${JSON.stringify(SCENARIOS)},PARTS=${JSON.stringify(PARTS)};const clamp=${clamp.toString()},smooth=${smooth.toString()},smokeEmailAllowed=${smokeEmailAllowed.toString()},qaAt=${qaAt.toString()};`;
const body=`<header class="guide-header"><p>FIG 02 · QA / illustrative mechanism</p><h1>Inspect. Record. Investigate.</h1><p>A selected check travels through inspection. Its evidence remains useful even when a repeat email is suppressed.</p></header><div class="guide-controls"><label for="scenario">Teaching example</label><select id="scenario"><option value="fail">Failing check + evidence</option><option value="pass">Passing selected check</option><option value="cooldown">Repeat notification suppressed</option><option value="paused">Dashboard monitor paused</option></select><div class="playback"><button id="play" type="button">Pause example</button><button id="replay" type="button">Replay</button><button id="theme" type="button">Dark theme</button></div><label for="progress">Example timeline</label><input id="progress" type="range" min="0" max="14" step=".05" value="0"></div>${k.plateHtml({fig:'Fig 02',title:'A check runs; its evidence stays available',hint:'Choose a part or teaching example',readout:'Selected check enters',keys:[{mark:'lit',label:'Camera shutter: selected behaviour is inspected'},{mark:'raised',label:'Record tray: evidence available for investigation'}],caption:'Illustrative workflow only. No clinic requests, private artifacts or patient information. A pass does not prove clinical accuracy or availability.',body:`<div id="qa-stage" class="iso-stage" tabindex="0" role="group" aria-label="Inspection station. Use the named part buttons or timeline to explore.">${svg}</div>`})}<p id="result">Selected check: in progress.</p><p id="notification">Notification not reached.</p><div class="parts">${PARTS.map((p,i)=>`<button type="button" data-select-part="${p}" aria-pressed="false">0${i+1} ${({checks:'Selected checks',run:'Scheduled checks',evidence:'Screenshots & history',alerts:'Smoke email policy',review:'Human review'})[p]}</button>`).join('')}</div><section class="explanation"><h2 id="part-title">What the station means</h2><p id="part-copy">The moving specimen represents one selected check, not a person. The optical gate represents an assertion; a result still needs context and investigation.</p></section><details><summary>Every example, in plain language</summary><p>Passing: a selected assertion passes, not every behaviour. Failing: available screenshots and history support investigation. Cooldown: the illustrated smoke email is suppressed while its failed result remains visible. Paused: a dashboard monitor setting is shown; GitHub scheduling is not assumed disabled.</p><p>Smoke email policy only: failure, UTC hour from 04:00 inclusive to 16:00 exclusive, and more than 3600 seconds since an existing notification timestamp. The illustration uses fixed fictional examples, not your account state.</p></details><footer><a href="https://github.com/Rammeshgar/PC-test-automation/blob/ebe41cbe080f87084eceede27b3ad91976658456/.github/workflows/smoke_test.yml" target="_blank" rel="noopener">Pinned smoke workflow ↗</a> · Anatomy kit MIT; original portfolio figure.</footer>`;
// Keep the existing mechanism and control IDs; explain its software meaning first.
const firstLook=`<header class="guide-header"><p>PEOPLES CLINIC QA SUITE</p><h1>Watch a check fail and keep its evidence.</h1><p>Scheduled checks look for problems in selected browser and API journeys. Saved screenshots and run history help a person investigate a failure.</p></header><p class="mapping-key"><strong>What you are watching</strong> The conveyor item is a test run. The camera is a check, the tray holds evidence, and the flag shows whether an email is sent.</p>`;
const oldControls=body.match(/<div class="guide-controls">[\s\S]*?<input id="progress"[^>]*><\/div>/)[0];
const controls=oldControls.replace('Teaching example','Choose an example');
let arranged=body.replace(/<header class="guide-header">[\s\S]*?<\/header>/,firstLook).replace(oldControls,'');
arranged=arranged.replace('<p id="result">',controls+'<p id="result">');
arranged=arranged.replace('Inspection & evidence station','How a failed check leaves evidence').replace('Choose a part or teaching example','Select a part to see what it does').replace('What the station means','How this relates to the QA suite').replace('The moving specimen represents one selected check, not a person. The optical gate represents an assertion; a result still needs context and investigation.','The item moves through a check. When it fails, the saved record represents screenshots and run history that a person can inspect.').replace('Every example, in plain language','Examples, email rules and source').replace('Illustrative workflow only. No clinic requests, private artifacts or patient information. A pass does not prove clinical accuracy or availability.','Illustrative example. No clinic tests run and no patient information is loaded. A pass does not prove clinical accuracy or availability.');
arranged=arranged.replace('<label for="progress">Example timeline</label><input id="progress" type="range" min="0" max="14" step=".05" value="0">','<details class="timeline-details"><summary>Move through the example</summary><label for="progress">Example timeline</label><input id="progress" type="range" min="0" max="14" step=".05" value="0"></details>');
let html=k.pageHtml({title:'How QA failures leave evidence',theme:'light',width:1100,body:arranged,script:payload+'\n'+code});html=html.replace('</head>',`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data:; connect-src 'none'; img-src data:; base-uri 'none'"><meta name="robots" content="noindex"><style>${css}${thumbnailCss}</style></head>`);
writeFileSync(join(root,'qa-suite/guide.html'),withTheme(html));
writeFileSync(join(root,'qa-suite/guide-light.html'),html);
writeFileSync(join(root,'qa-suite/guide-dark.html'),html.replace('<body class="iso" data-theme="light">','<body class="iso" data-theme="dark">'));
writeFileSync(join(root,'qa-suite/parts.json'),JSON.stringify(base.items.map(i=>({name:i.name,part:assemblyOf(i.name),moving:i.moving||null})),null,2)+'\n');
if(process.argv.includes('--audit')){console.log('Actual runtime order: 228 quarter-second model states');A.auditOrExit(base.R,P,{frames:process.argv.includes('--rest')?[]:motionStates,apart:false});}
console.log('Built QA figure:',base.items.length,'true solids.');

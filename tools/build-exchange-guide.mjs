import {withTheme} from './portfolio-theme-build.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
let html=readFileSync(join(root,'tools/vendor/exchange-guide.base.html'),'utf8');
const font=readFileSync(join(root,'assets/inter-latin.woff2')).toString('base64');
const modes=readFileSync(join(root,'tools/exchange-guide.css'),'utf8');
const css=`@font-face{font-family:PortfolioInter;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900;font-display:swap}.iso[data-theme="light"]{--anatomy-page:#eee9df;--anatomy-card:#eee9df;--anatomy-paper:#eee9df;--anatomy-strong:#142e2e;--anatomy-text:#142e2e;--anatomy-muted:#53635d}.iso-page,body{font-family:PortfolioInter,Inter,Arial,sans-serif!important}body[data-presentation="guide"] #guide-narrative h2{font-size:20px}body[data-presentation="guide"] #mode-note{border-color:#9b4a30}body[data-presentation="guide"] .parts{margin-top:16px}body[data-presentation="guide"] #motion-note{display:block!important}`;
const bridge=`
// Portfolio-only navigation. This frame never receives a live server snapshot.
if(portfolioLayout==='preview'){story='refresh';guideTime=6;playing=!stillness.matches;liveById('guide-story').value=story;}
window.addEventListener('message',event=>{
 if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='exchange-case-selection')return;
 const m=event.data;if(!['cache','worker','queue','gate'].includes(m.part)||!['compare','refresh','history','wait'].includes(m.story))return;
 liveById('guide-story').value=m.story;
 liveById('guide-story').dispatchEvent(new Event('change'));
 inspect(m.part);showGuide(true);run();
});
`;
// Add the physical-to-software key before the machine, then place playback below it.
const mapping='<p class="mapping-key"><strong>What you are watching</strong> The drawer holds saved rates. The press represents a request to APILayer. The tray holds waiting requests, and the gate prevents another request while the app must wait.</p>';
const machineStart=html.indexOf('<div class="machine" id="machine">');
const machineEnd=html.indexOf('<section id="guide-narrative"',machineStart);
const machineBlock=html.slice(machineStart,machineEnd);
if(machineStart<0||machineEnd<0)throw Error('Missing original machine wrapper');
html=html.replace(machineBlock,'').replace('<section id="guide-controls"',mapping+machineBlock+'<section id="guide-controls"');
html=html.replace('This is a physical metaphor, not real equipment. The guide is a simplified example. Live status describes only this Shiny server process. This panel never fetches rates or modifies its queue.','This example does not fetch rates or change the live app. The code references in the case study explain the implementation.');
html=html.replace("style-src 'unsafe-inline';","style-src 'unsafe-inline'; font-src data:;");
html=html.replace('</head>',`<meta name="robots" content="noindex"><style>${css}\n${modes}</style></head>`);
function replaceOnce(before,after){if(!html.includes(before))throw Error('Guide runtime contract changed: '+before.slice(0,70));html=html.replace(before,after);}
replaceOnce("const presentation=new URLSearchParams(location.search).get('view');","const portfolioLayout=new URLSearchParams(location.search).get('layout');\nif(['compact','preview'].includes(portfolioLayout))document.body.dataset.layout=portfolioLayout;\nconst presentation=new URLSearchParams(location.search).get('view');");
replaceOnce('transport=false,panelOpen=true,visible=false','transport=false,panelOpen=parent===window,visible=false');
replaceOnce("story='refresh';liveById('guide-story').value=story;index=GUIDE_STORIES[story].steps.findIndex(s=>s.part===part);","story=part==='gate'?'wait':'refresh';liveById('guide-story').value=story;index=GUIDE_STORIES[story].steps.findIndex(s=>s.part===part);");
replaceOnce("seek(index*3+(part==='worker'?1.5:0));","guideTime=Math.max(0,index*3);paused=userPaused;playing=!userPaused&&!stillness.matches;poseRequested=true;\n    setText('pause-illustration',paused?'Resume illustration':'Pause illustration');liveById('pause-illustration').setAttribute('aria-pressed',String(paused));showGuide(true);");
replaceOnce('guideTime=Math.min(GUIDE_SECONDS,guideTime+dt);','guideTime+=dt;');
replaceOnce('if(guideTime>=GUIDE_SECONDS)playing=false;','if(guideTime>=GUIDE_SECONDS+.7){guideTime=0;cycles++;}');
replaceOnce("else{if(guideTime>=GUIDE_SECONDS)guideTime=0;playing=!playing;showGuide(true);run();}","else{if(guideTime>=GUIDE_SECONDS)guideTime=0;playing=!playing;paused=!playing;userPaused=paused;setText('pause-illustration',paused?'Resume illustration':'Pause illustration');liveById('pause-illustration').setAttribute('aria-pressed',String(paused));showGuide(true);run();}");
replaceOnce("paused=!paused;liveById('pause-illustration').setAttribute('aria-pressed',String(paused));setText('pause-illustration',paused?'Resume illustration':'Pause illustration');run();","paused=!paused;userPaused=paused;liveById('pause-illustration').setAttribute('aria-pressed',String(paused));setText('pause-illustration',paused?'Resume illustration':'Pause illustration');if(mode==='guide'){playing=!paused&&!stillness.matches;if(playing&&guideTime>=GUIDE_SECONDS)guideTime=0;showGuide(true);}run();");
replaceOnce("function seek(seconds){playing=false;guideTime=", "function seek(seconds){playing=false;userPaused=true;paused=true;poseRequested=true;guideTime=");
replaceOnce('zoomed=false;','zoomed=false,userPaused=false,poseRequested=false,cycles=0;');
replaceOnce('function showGuide(force=false){',"function showGuide(force=false){setText('pause-illustration',userPaused?'Resume illustration':'Pause illustration');liveById('pause-illustration').setAttribute('aria-pressed',String(userPaused));");
replaceOnce("guideTime=0;playing=!stillness.matches;paused=false;setText('pause-illustration'","guideTime=0;playing=!userPaused&&!stillness.matches;paused=userPaused;poseRequested=true;setText('pause-illustration'");
replaceOnce("guideTime=0;playing=!stillness.matches;paused=false;liveById('pause-illustration'","guideTime=0;userPaused=false;poseRequested=true;playing=!stillness.matches;paused=false;liveById('pause-illustration'");
replaceOnce("liveById('guide-progress').addEventListener('focus',()=>{playing=false;showGuide();});",'');
replaceOnce("if(!paused||calm){drawerAt=follow", "if(paused&&poseRequested){drawerAt=state.drawer;latchAt=state.latch;strokeAt=state.stroke;poseRequested=false;}\n  if(!paused||calm){drawerAt=follow");
replaceOnce("machine.dataset.frameCount=String(Number(machine.dataset.frameCount||0)+1);","machine.dataset.userPaused=String(userPaused);machine.dataset.cycles=String(cycles);machine.dataset.frameCount=String(Number(machine.dataset.frameCount||0)+1);");
replaceOnce("if(presentation!=='guide')machine.scrollIntoView", "if(presentation!=='guide'&&!portfolioLayout)machine.scrollIntoView");
replaceOnce("if(m.disconnected===true)transport=false;else if(acceptSnapshot(m.snapshot)){snapshot=m.snapshot;received=performance.now();transport=true;}","// Portfolio teaching frames never accept live app snapshots.\n  transport=false;");
const ready="setMode(presentation==='live'?'live':'guide');statusText();parent.postMessage({type:'exchange-anatomy-ready'},location.origin);";
if(!html.includes(ready))throw Error('Vendored guide runtime changed; review navigation bridge insertion.');
// Insert in the existing module scope; its controller is deliberately not global.
const deepLink=`const requested=new URLSearchParams(location.search),requestedPart=requested.get('part'),requestedStory=requested.get('story');if(['cache','worker','queue','gate'].includes(requestedPart)&&['compare','refresh','history','wait'].includes(requestedStory)){liveById('guide-story').value=requestedStory;liveById('guide-story').dispatchEvent(new Event('change'));inspect(requestedPart);showGuide(true);run();}`;
html=html.replace(ready,bridge+'\n'+ready+'\n'+deepLink);
writeFileSync(join(root,'exchange-universe/guide.html'),withTheme(html));
console.log('Built portfolio guide:',Buffer.byteLength(html),'bytes; geometry unchanged; compact/preview modes and guarded playback bridge added.');

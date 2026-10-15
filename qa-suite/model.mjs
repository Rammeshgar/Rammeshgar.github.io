export const DURATION=14;
export const SCENARIOS=['pass','fail','cooldown','paused'];
export const PARTS=['checks','run','evidence','alerts','review'];
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const smooth=v=>{const x=clamp(v);return x*x*(3-2*x)};
export function smokeEmailAllowed({failed,utcHour,elapsedSeconds}){return failed&&utcHour>=4&&utcHour<16&&elapsedSeconds>3600;}
export function qaAt(scenario,time){
 if(!SCENARIOS.includes(scenario))throw Error('Unknown teaching scenario');
 const t=clamp(time,0,DURATION),paused=scenario==='paused',failed=scenario==='fail'||scenario==='cooldown';
 const phase=paused?'Monitor paused':t<3?'Selected check enters':t<6?'Inspect selected behaviour':t<9?'Result recorded':t<12?'Evidence for review':'Human investigation';
 const travel=paused?0:smooth((t-.6)/8.4),divert=failed?smooth((t-7)/2):0;
 const email=!paused&&smokeEmailAllowed({failed,utcHour:10,elapsedSeconds:scenario==='cooldown'?600:7200})&&t>=10;
 return {t,phase,paused,failed,result:paused?'Paused monitor':t<7?'In progress':failed?'Selected check failed':'Selected check passed',
  sampleX:travel*196,sampleY:divert*24,shutter:paused?0:Math.sin(Math.PI*smooth((t-3)/3))*6,
  diverter:divert*18,evidence:!paused?smooth((t-8)/4)*24:0,alert:email?12:0,
  evidenceKept:!paused&&t>=9,notification:paused?'No example run':!failed?'No failure notification':t<10?'Notification not reached':email?'Illustrative email allowed':'Repeat email suppressed; failure retained'};
}

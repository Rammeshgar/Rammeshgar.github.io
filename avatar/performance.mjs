export const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export function smoothDamp(current,target,dt,seconds=.28){return current+(target-current)*(1-Math.exp(-Math.max(0,dt)/seconds));}
// An amplitude envelope, not a speech-speed multiplier. Gesture timing stays 4.8s.
export function gestureStrength(time,cues){
 const cue=cues.find(c=>time>=c.start&&time<c.end);
 const quiet=cue?.value==='X';
 return (quiet?.42:.84)+.1*Math.sin(time*.49);
}
export function blinkWeight(t){
 // Uneven but repeatable spacing; all changes are eyelid shapes only.
 const period=17.9,events=[1.4,5.8,9.1,9.48,14.4],phase=((t%period)+period)%period;
 for(const at of events){const d=phase-at;if(d>=0&&d<.22)return d<.075?d/.075:1-(d-.075)/.145;}
 return 0;
}

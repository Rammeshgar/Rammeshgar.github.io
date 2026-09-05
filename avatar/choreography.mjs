export function makeSchedule(cues,clips,duration,speed=1){
 const gestures=clips.filter(c=>c.category==='gesture');if(!gestures.length)return [];
 speed=Math.max(1,Math.min(2,Number(speed)||1));
 // A fixed shuffled deck makes seeking repeatable and prevents reuse until
 // all ten gestures have been offered. Selection does not infer speech meaning.
 const deck=[0,5,1,8,2,4,7,3,6,9].map(i=>gestures[i%gestures.length]);
 const speech=cues.filter(c=>c.value!=='X'),events=[];let cursor=speech.length?speech[0].start:.18,index=0;
 const finish=Math.min(duration-.08,speech.length?speech[speech.length-1].end:duration-.08);
 if(cues.length&&!speech.length)return [];
 while(cursor<duration-.7){
  const start=cursor,clip=deck[index%deck.length],rate=speed;
  // Cut only the neutral lead-in/tail; keep the original motion time scale.
  // Overlap recovery with the next preparation instead of parking at rest.
  const sourceIn=index?clip.duration*.1:0;
  const end=Math.min(finish,start+(clip.duration*.9-sourceIn)/rate);
  if(end<=start)break;
  events.push({name:clip.name,start,end,rate,sourceIn});
  if(end>=finish)break;
  cursor=end-Math.min(.30/rate,(end-start)*.28);index++;
 }
 return events;
}
export function eventAt(schedule,t){return schedule.find(e=>t>=e.start&&t<e.end)||null;}
export function blendAt(schedule,t){
 const active=schedule.filter(e=>t>=e.start&&t<e.end);
 if(active.length<2)return active.map(event=>({event,weight:1}));
 const [a,b]=active,u=Math.max(0,Math.min(1,(t-b.start)/(a.end-b.start))),w=u*u*(3-2*u);
 return [{event:a,weight:1-w},{event:b,weight:w}];
}
export function quietClip(clips,state,t){const pool=clips.filter(c=>c.category===state);if(!pool.length)return null;const duration=pool.reduce((sum,c)=>sum+c.duration,0);let time=((t%duration)+duration)%duration;for(const clip of pool){if(time<clip.duration)return {name:clip.name,time};time-=clip.duration;}return {name:pool[0].name,time:0};}

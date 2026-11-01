/* One bounded render owner. Pausing preserves scene time, including across tab sleep. */
export function fieldPointer(event,width,height){
 if(event.type==='click'&&event.target?.closest?.('a,button,input,select,textarea,label,iframe,summary,details'))return null;
 if(event.type!=='click'&&event.pointerType==='touch')return null;
 if(!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY)||width<=0||height<=0)return null;
 const clamp=n=>Math.max(-1,Math.min(1,n));
 return{x:clamp(event.clientX/width*2-1),y:clamp(1-event.clientY/height*2)};
}
export function createFieldLoop({request,cancel,draw,onError=()=>{},fps=30}){
 let active=false,frame=0,last=null,time=0,limit=fps;
 function stop(){active=false;if(frame)cancel(frame);frame=0;last=null;}
 function tick(stamp){
  frame=0;if(!active)return;
  const elapsed=last===null?1000/limit:stamp-last;
  if(elapsed>=1000/limit-.5){
   time+=Math.min(elapsed,80)/1000;last=stamp;
   try{draw(time);}catch(error){stop();onError(error);return;}
  }
  if(active)frame=request(tick);
 }
 return{
  setActive(value){if(!value){stop();return;}if(active)return;active=true;last=null;frame=request(tick);},
  setFPS(value){limit=value;},
  still(){try{draw(time);}catch(error){stop();onError(error);}},
  stop,
  get time(){return time;},get active(){return active;}
 };
}

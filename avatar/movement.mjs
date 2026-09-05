import * as THREE from 'three';
import {makeSchedule,blendAt,quietClip} from './choreography.mjs';
import {createPresence} from './presence.mjs';
export function createMovement(root,clips,specs){
 const bones=[];root.traverse(b=>{if(b.isBone)bones.push({b,q:b.quaternion.clone(),p:b.position.clone()});});
 const compiled=new Map(clips.map(c=>[c.name,c.tracks.map(track=>{const p=THREE.PropertyBinding.parseTrackName(track.name);return {object:root.getObjectByName(p.nodeName),property:p.propertyName,i:track.createInterpolant()};})]));
 const presence=createPresence(root);let plan=[],wasSpeaking=false,previousDuration=0;
 function sample(name,t){for(const n of bones){n.b.quaternion.copy(n.q);n.b.position.copy(n.p);}for(const tr of compiled.get(name)||[]){if(tr.object&&['position','quaternion','scale'].includes(tr.property))tr.object[tr.property].fromArray(tr.i.evaluate(t));}}
 function snapshot(){return bones.map(n=>({q:n.b.quaternion.clone(),p:n.b.position.clone()}));}
 function blend(from,w){bones.forEach((n,i)=>{n.b.quaternion.slerpQuaternions(from[i].q,n.b.quaternion.clone(),w);n.b.position.lerpVectors(from[i].p,n.b.position.clone(),w);});}
 return {update({now,delta,speaking,time,duration=300,state='idle',enabled=true}){
  presence.restore();const previous=snapshot();
  if(speaking&&(!wasSpeaking||duration!==previousDuration)){plan=makeSchedule([],specs,duration,1);previousDuration=duration;}
  wasSpeaking=speaking;
  const layers=enabled&&speaking?blendAt(plan,time):[];
  if(layers.length){
   const a=layers[0].event;sample(a.name,a.sourceIn+(time-a.start)*a.rate);
   if(layers.length===2){const first=snapshot(),b=layers[1].event;sample(b.name,b.sourceIn+(time-b.start)*b.rate);blend(first,layers[1].weight);}
  }else{const quiet=quietClip(specs,state,now);sample(quiet?.name,enabled?quiet?.time||0:0);}
  if(enabled)blend(previous,1-Math.exp(-delta/(speaking?.045:.22)));
  presence.update(now,enabled);
 }};
}

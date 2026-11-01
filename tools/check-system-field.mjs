import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildDepthScene} from '../assets/system-field-3d.mjs';
import {createFieldLoop,fieldPointer} from '../assets/system-field-loop.mjs';
import {Vector3} from '../avatar/vendor/three/build/three.module.js';
let count=0;const check=(name,run)=>{run();count++;console.log('PASS:',name);};
const projected=(model,point)=>new Vector3(point.x,point.y,-4).applyMatrix4(model.group.matrixWorld).project(model.camera);
function loopFixture(){
 const frames=new Map(),draws=[],errors=[];let next=0;
 const loop=createFieldLoop({request:fn=>{const id=++next;frames.set(id,fn);return id;},cancel:id=>frames.delete(id),draw:time=>draws.push(time),onError:e=>errors.push(e),fps:30});
 return{loop,frames,draws,errors,step(time){const [id,fn]=frames.entries().next().value;frames.delete(id);fn(time);}};
}
check('the ribbon and surrounding cloud contain real depth and finite geometry',()=>{
 const model=buildDepthScene(),positions=model.ribbon.geometry.getAttribute('position').array;
 const z=[];for(let i=2;i<positions.length;i+=3)z.push(positions[i]);
 assert(Math.max(...z)-Math.min(...z)>6);assert([...positions].every(Number.isFinite));
 assert.equal(model.ribbon.geometry.getAttribute('position').count,92*27);assert.equal(model.stars.geometry.getAttribute('position').count,380);model.dispose();
});
check('small-device geometry is bounded and the camera uses perspective projection',()=>{
 const model=buildDepthScene({small:true});assert.equal(model.ribbon.geometry.getAttribute('position').count,54*15);assert.equal(model.stars.geometry.getAttribute('position').count,125);
 assert(model.camera.isPerspectiveCamera);model.resize(1200,800,1);model.update(0,0,0);
 const near=new Vector3(1,0,0).project(model.camera),far=new Vector3(1,0,-15).project(model.camera);assert(Math.abs(near.x)>Math.abs(far.x));model.dispose();
});
check('pointer input changes the actual camera and projected object position',()=>{
 const model=buildDepthScene();model.resize(1400,800,1.25);model.update(1,-1,.5);const left=new Vector3(2,1,-3).project(model.camera);
 model.update(1,1,-.5);const right=new Vector3(2,1,-3).project(model.camera);assert(left.distanceTo(right)>.03);assert.equal(model.camera.position.x,3.6);assert.equal(model.camera.position.y,-1.1);model.dispose();
});
check('scene time, pointer deformation, resolution and intensity reach the shader uniforms',()=>{
 const model=buildDepthScene();model.resize(1200,800,1.25);model.theme(true);model.update(4,.7,-.3,1.12);
 for(const m of model.materials){assert.equal(m.uniforms.uTime.value,4);assert.equal(m.uniforms.uRatio.value,1.25);const p=projected(model,m.uniforms.uPointer.value);assert(Math.abs(p.x-.7)<1e-6);assert(Math.abs(p.y+.3)<1e-6);assert.equal(m.uniforms.uStrength.value,1.12);}
 model.theme(false);model.update(4,0,0,.42);assert.equal(model.materials[0].uniforms.uStrength.value,.42*.86);model.dispose();
});
check('mouse and pen input work in narrow windows and MouseEvent-only previews',()=>{
 for(const pointerType of ['mouse','pen',undefined]){
  const p=fieldPointer({type:'mousemove',pointerType,clientX:240,clientY:185},320,740);
  assert.deepEqual(p,{x:.5,y:.5});
 }
 assert.equal(fieldPointer({type:'pointermove',pointerType:'touch',clientX:10,clientY:10},320,740),null);
});
check('taps produce a bounded 3D ripple while buttons and links keep their native actions',()=>{
 const tap=fieldPointer({type:'click',pointerType:'touch',clientX:160,clientY:370},320,740);assert.deepEqual(tap,{x:0,y:0});
 assert.equal(fieldPointer({type:'click',clientX:160,clientY:370,target:{closest:()=>({})}},320,740),null);
 for(const tag of ['summary','details','button','select','a'])assert.equal(fieldPointer({type:'click',clientX:160,clientY:370,target:{closest:selector=>selector.split(',').includes(tag)?{}:null}},320,740),null,tag+' must not trigger the background');
 const model=buildDepthScene();model.pulse(.5,-.25,3.2);
 for(const m of model.materials){assert.equal(m.uniforms.uPulseStart.value,3.2);const p=projected(model,m.uniforms.uPulseOrigin.value);assert(Math.abs(p.x-.5)<1e-6);assert(Math.abs(p.y+.25)<1e-6);}
 model.update(4,0,0,1.12);assert.equal(model.materials[0].uniforms.uMotion.value,1);model.update(4,0,0,.42);assert.equal(model.materials[0].uniforms.uMotion.value,.4);model.dispose();
});
check('ripples project back under edge clicks across phone, desktop and ultrawide views',()=>{
 for(const[width,height]of [[390,844],[1536,782],[3440,1440]]){
  const model=buildDepthScene({small:width<700});model.resize(width,height,1);
  for(const[px,py]of [[-.995,.3],[.995,-.3],[0,.9],[0,-.9]]){
   model.update(2,px*.3,py*.3);model.pulse(px,py,2.5);
   for(const m of model.materials){const p=projected(model,m.uniforms.uPulseOrigin.value);assert(Math.abs(p.x-px)<1e-6,width+' x '+px);assert(Math.abs(p.y-py)<1e-6,height+' y '+py);}
  }
  assert(model.group.scale.x>=1);if(width/height>1.8)assert(model.group.scale.x>1);
  model.dispose();
 }
});
check('one render chain caps drawn frames and refuses duplicate starts',()=>{
 const f=loopFixture();f.loop.setActive(true);f.loop.setActive(true);assert.equal(f.frames.size,1);f.step(0);f.step(10);f.step(20);f.step(34);assert.equal(f.draws.length,2);assert.equal(f.frames.size,1);f.loop.stop();assert.equal(f.frames.size,0);
});
check('pause cancels pending work and preserves time while a still frame is requested',()=>{
 const f=loopFixture();f.loop.setActive(true);f.step(0);const time=f.loop.time;f.loop.setActive(false);assert.equal(f.frames.size,0);f.loop.still();assert.equal(f.loop.time,time);assert.equal(f.draws.at(-1),time);
});
check('resuming after a hidden-tab interval does not jump the scene clock',()=>{
 const f=loopFixture();f.loop.setActive(true);f.step(0);f.loop.stop();const before=f.loop.time;f.loop.setActive(true);f.step(600000);assert(f.loop.time-before<.04);f.loop.stop();
});
check('a failed render stops rather than spinning, with lifecycle/preferences guards in the owner',()=>{
 const pending=new Map();let error=false,id=0;const loop=createFieldLoop({request:fn=>{pending.set(++id,fn);return id;},cancel:id=>pending.delete(id),draw(){throw Error('GPU lost');},onError(){error=true;}});
 loop.setActive(true);const fn=pending.get(1);pending.delete(1);fn(0);assert(error);assert(!loop.active);assert.equal(pending.size,0);
 const source=readFileSync(new URL('../assets/system-field.mjs',import.meta.url),'utf8');for(const marker of ['prefers-reduced-motion','saveData','visibilitychange','pagehide','pageshow','localStorage.setItem','import(\'./system-field-3d.mjs\')'])assert(source.includes(marker),marker);
});
console.log(`${count} real 3D geometry, perspective, camera and render-loop checks passed.`);

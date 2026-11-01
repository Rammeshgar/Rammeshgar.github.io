import * as THREE from '../avatar/vendor/three/build/three.module.js';

const vertex=`
 attribute float aSize;
 uniform float uTime,uRatio,uKind,uStrength,uMotion,uPulseStart;
 uniform vec2 uPointer,uPulseOrigin;
 varying float vAlpha,vTint,vPulse;
 void main(){
  vec3 p=position;
  if(uKind<0.5){
   p.y+=sin(p.x*.28+uTime*.75)*1.1*uMotion;
   p.z+=cos(p.x*.24+uTime*.55)*1.25*uMotion;
   float d=length(p.xy-uPointer);
   p.z+=exp(-d*d*.045)*2.7*uMotion;
   p.y+=sin(d*1.1-uTime*1.6)*exp(-d*d*.04)*.4*uMotion;
  }else{
   p.x+=sin(uTime*.2+position.z)*.75*uMotion;
   p.y+=cos(uTime*.25+position.x)*.75*uMotion;
   p.z=-24.+mod(position.z+24.+uTime*.9*uMotion,30.);
  }
  float age=uTime-uPulseStart;
  float radius=length(p.xy-uPulseOrigin);
  float front=exp(-pow((radius-age*5.)*.58,2.));
  float pulse=sin(radius*1.9-age*7.)*front*exp(-max(age,0.)*.55)*step(0.,age)*(1.-step(5.,age));
  p.z+=pulse*3.8*uMotion;
  p.y+=pulse*.7*uMotion;
  vPulse=abs(pulse)*uMotion;
  vec4 mv=modelViewMatrix*vec4(p,1.);
  gl_Position=projectionMatrix*mv;
  gl_PointSize=clamp(aSize*uRatio*62./max(1.,-mv.z),1.1,7.);
  float edge=smoothstep(1.5,10.,abs(p.x));
  vAlpha=(uKind<.5?mix(.48,.92,edge):.52)*uStrength*clamp(28./max(1.,-mv.z),.35,1.);
  vAlpha+=vPulse*.6;
  vTint=sin(position.x*.3+position.z*.25)*.5+.5;
 }`;
const fragment=`
 uniform vec3 uColor,uAccent;
 varying float vAlpha,vTint,vPulse;
 void main(){
  float d=length(gl_PointCoord-.5);
  float core=1.-smoothstep(.06,.31,d);
  float halo=(1.-smoothstep(.1,.5,d))*.25;
  float alpha=(core+halo)*vAlpha;
  if(alpha<.015)discard;
  gl_FragColor=vec4(mix(uColor,uAccent,max(vTint*.35,vPulse)),alpha);
  #include <colorspace_fragment>
 }`;

// The actual geometry is three-dimensional before any animation is applied.
export function buildDepthScene({small=false}={}){
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(47,1,.1,100);
 camera.position.set(0,0,16);camera.lookAt(0,0,-3);camera.updateMatrixWorld();
 const group=new THREE.Group();scene.add(group);
 let seed=77401;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 function geometry(count,fill){
  const positions=new Float32Array(count*3),sizes=new Float32Array(count);
  for(let i=0;i<count;i++){const p=fill(i);positions.set(p,i*3);sizes[i]=1.1+random()*1.1;}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));return geo;
 }
 const columns=small?54:92,rows=small?15:27;
 const ribbonGeo=geometry(columns*rows,i=>{
  const x=(i%columns/(columns-1)-.5)*35,v=(Math.floor(i/columns)/(rows-1)-.5)*2,twist=x*.24;
  return[x,Math.sin(x*.23)*2.8+Math.cos(twist)*v*2.6,Math.sin(twist)*v*3.5+Math.cos(x*.19)*2-4];
 });
 const starGeo=geometry(small?125:380,()=>[(random()-.5)*38,(random()-.5)*23,-20+random()*25]);
 const materials=[];
 function cloud(geo,kind){
  const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,depthTest:false,blending:THREE.NormalBlending,uniforms:{uTime:{value:0},uRatio:{value:1},uKind:{value:kind},uStrength:{value:1},uMotion:{value:1},uPointer:{value:new THREE.Vector2()},uPulseOrigin:{value:new THREE.Vector2()},uPulseStart:{value:-100},uColor:{value:new THREE.Color('#b9bfb0')},uAccent:{value:new THREE.Color('#d9b190')}}});
  materials.push(material);const points=new THREE.Points(geo,material);points.frustumCulled=false;group.add(points);return points;
 }
 const ribbon=cloud(ribbonGeo,0),stars=cloud(starGeo,1);
 // Project the actual viewport point onto the ribbon's local interaction plane.
 // Fixed x/y multipliers drift inward at the edges and on wide displays.
 const plane=new THREE.Plane(),normal=new THREE.Vector3(),planePoint=new THREE.Vector3();
 const ray=new THREE.Ray(),through=new THREE.Vector3(),hit=new THREE.Vector3();
 function pointAt(px,py){
  group.updateMatrixWorld(true);
  normal.set(0,0,1).transformDirection(group.matrixWorld);
  planePoint.set(0,0,-4).applyMatrix4(group.matrixWorld);
  plane.setFromNormalAndCoplanarPoint(normal,planePoint);
  ray.origin.copy(camera.position);through.set(px,py,.5).unproject(camera);
  ray.direction.copy(through).sub(ray.origin).normalize();
  if(!ray.intersectPlane(plane,hit))return null;
  return group.worldToLocal(hit);
 }
 let dark=true;
 function theme(value){dark=value;for(const m of materials){m.uniforms.uColor.value.set(dark?'#b9bfb0':'#6c776b');m.uniforms.uAccent.value.set(dark?'#d9b190':'#a37457');}}
 function update(time,px,py,strength=1){
  const motion=strength>.7?1:.4;
  camera.position.set(px*3.6,py*2.2,16);camera.lookAt(-px*.75,-py*.5,-3);camera.updateMatrixWorld();
  group.rotation.set(py*.13,px*.24+Math.sin(time*.18)*.12*motion,Math.sin(time*.12)*.045*motion);
  const pointer=pointAt(px,py);
  for(const m of materials){m.uniforms.uTime.value=time;if(pointer)m.uniforms.uPointer.value.set(pointer.x,pointer.y);m.uniforms.uStrength.value=strength*(dark?1.0:.86);m.uniforms.uMotion.value=motion;}
 }
 function pulse(px,py,time){const point=pointAt(px,py);if(!point)return;for(const m of materials){m.uniforms.uPulseOrigin.value.set(point.x,point.y);m.uniforms.uPulseStart.value=time;}}
 function resize(width,height,ratio){camera.aspect=width/height;camera.updateProjectionMatrix();group.scale.x=Math.max(1,camera.aspect/1.8);for(const m of materials)m.uniforms.uRatio.value=ratio;}
 function dispose(){ribbonGeo.dispose();starGeo.dispose();materials.forEach(m=>m.dispose());}
 return{scene,camera,group,ribbon,stars,materials,update,pulse,resize,theme,dispose};
}

export function createDepthField(canvas,{small=false,dark=true,onFault=()=>{},onRestore=()=>{}}={}){
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'low-power'});
 renderer.setClearColor(0x000000,0);const model=buildDepthScene({small});model.theme(dark);
 renderer.debug.onShaderError=()=>onFault(new Error('Background shader unavailable'));
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();onFault(new Error('Graphics context paused'));});
 canvas.addEventListener('webglcontextrestored',onRestore);
 let x=0,y=0;
 return{
  resize(width,height,ratio){renderer.setPixelRatio(ratio);renderer.setSize(width,height,false);model.resize(width,height,ratio);},
  theme: model.theme,
  pulse: model.pulse,
  render(time,targetX,targetY,strength,held=false){if(!held){x+=(targetX-x)*.11;y+=(targetY-y)*.11;}model.update(time,x,y,strength);renderer.render(model.scene,model.camera);},
  dispose(){model.dispose();renderer.dispose();}
 };
}

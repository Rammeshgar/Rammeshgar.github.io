import * as THREE from './assets/three.module.js';

/* V3 private art direction: the same authored Signal Path instrument, given
   a three-shot cinematic sequence. The chambers illustrate request, routing
   and proof; the scene neither reads nor processes live information. The
   camera and materials intentionally remain quiet at rest. */

const PI = Math.PI;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// No cutaways, clipping, or frantic camera loops: all three compositions
// retain the full workflow and drift toward the chamber that owns the signal.
const SHOTS = [
  { azimuth:.29, elevation:.565, aimX:-.21, aimY:.76, aimZ:.06, zoom:1.045 },
  { azimuth:.12, elevation:.678, aimX:0, aimY:.78, aimZ:-.03, zoom:1.035 },
  { azimuth:.38, elevation:.590, aimX:.24, aimY:.86, aimZ:.10, zoom:1.065 },
];
const shotKeys=['azimuth','elevation','aimX','aimY','aimZ','zoom'];
const cinematicEase=t=>t*t*t*(t*(6*t-15)+10);

function roundRect(w, d, r) {
  const x = -w / 2, y = -d / 2;
  return new THREE.Shape()
    .moveTo(x+r,y).lineTo(x+w-r,y).quadraticCurveTo(x+w,y,x+w,y+r)
    .lineTo(x+w,y+d-r).quadraticCurveTo(x+w,y+d,x+w-r,y+d)
    .lineTo(x+r,y+d).quadraticCurveTo(x,y+d,x,y+d-r)
    .lineTo(x,y+r).quadraticCurveTo(x,y,x+r,y);
}

function material(color, roughness=.45, metalness=.2, extra={}) {
  return new THREE.MeshStandardMaterial({color, roughness, metalness, ...extra});
}

function plate(parent, w, d, h, r, mat, x=0, y=0, z=0, bevel=.026) {
  const geometry = new THREE.ExtrudeGeometry(roundRect(w,d,r), {
    depth: h, bevelEnabled: bevel > 0, bevelSize: bevel,
    bevelThickness: bevel, bevelSegments: 3, curveSegments: 7, steps: 1,
  });
  geometry.rotateX(-PI/2);
  const obj = new THREE.Mesh(geometry,mat);
  obj.position.set(x,y,z);
  parent.add(obj);
  return obj;
}

function block(parent,w,h,d,mat,x,y,z) {
  const obj = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  obj.position.set(x,y,z); parent.add(obj); return obj;
}

function disk(parent, radius, height, mat, x,y,z, segments=48, bottom=radius) {
  const obj = new THREE.Mesh(new THREE.CylinderGeometry(radius,bottom,height,segments),mat);
  obj.position.set(x,y,z); parent.add(obj); return obj;
}

function ring(parent,r,tube,mat,x,y,z,segments=64) {
  const obj = new THREE.Mesh(new THREE.TorusGeometry(r,tube,7,segments),mat);
  obj.rotation.x = -PI/2; obj.position.set(x,y,z); parent.add(obj); return obj;
}

function line(parent, points, thickness, mat, tension=.2) {
  const curve = new THREE.CatmullRomCurve3(points,false,'catmullrom',tension);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(16,points.length*9),thickness,7,false),mat);
  parent.add(mesh); return curve;
}

function linear(parent,a,b,thickness,mat) {
  const dir = b.clone().sub(a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(thickness,thickness,dir.length(),7),mat);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(V(0,1,0),dir.normalize());
  parent.add(mesh); return mesh;
}

// Telescoping hardware keeps the lifted plates mechanically anchored. These
// meshes change their transform only; there is no geometry rebuild per frame.
function makeLink(parent,anchor,r,mat) {
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,1,12),mat);
  parent.add(mesh);return {mesh,anchor,delta:new THREE.Vector3(),end:new THREE.Vector3(),axis:V(0,1,0)};
}
function poseLink(link,x,y,z) {
  link.end.set(x,y,z);link.delta.copy(link.end).sub(link.anchor);
  const length=Math.max(.001,link.delta.length());
  link.mesh.position.copy(link.anchor).addScaledVector(link.delta,.5);
  link.mesh.scale.y=length;link.mesh.quaternion.setFromUnitVectors(link.axis,link.delta.normalize());
}

function topTexture(parent, label, w,d, x,y,z, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = Math.round(640*d/w);
  const c = canvas.getContext('2d');
  draw(c,canvas.width,canvas.height,label);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy=4;
  const m = new THREE.MeshBasicMaterial({ map:tex, transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-1 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w,d),m);
  mesh.rotation.x=-PI/2; mesh.position.set(x,y,z); parent.add(mesh);
  return mesh;
}

function brandStrip(c,w,h,label) {
  c.clearRect(0,0,w,h);
  c.fillStyle='#9c9d95'; c.font='500 35px monospace'; c.fillText(label[0],20,41);
  c.fillStyle='#e6dfd0'; c.font='600 48px Arial'; c.fillText(label[1],20,99);
  c.fillStyle='#adaba0'; c.font='400 22px monospace'; c.fillText(label[2],22,139);
  c.strokeStyle='#63665f'; c.lineWidth=1.6; c.beginPath(); c.moveTo(w-98,20);c.lineTo(w-98,h-18);c.stroke();
  c.strokeStyle='#ae7d50'; c.lineWidth=3; c.strokeRect(w-71,33,48,48);c.fillStyle='#ae7d50';
  c.beginPath();c.moveTo(w-59,57);c.lineTo(w-47,44);c.lineTo(w-35,57);c.lineTo(w-47,69);c.closePath();c.fill();
}

function makeEnvironment(renderer) {
  const c = document.createElement('canvas'); c.width=512; c.height=256;
  const x = c.getContext('2d');
  let g=x.createLinearGradient(0,0,0,256);
  g.addColorStop(0,'#aeb3ac'); g.addColorStop(.34,'#4c575a'); g.addColorStop(.55,'#202628');g.addColorStop(1,'#0e1114');
  x.fillStyle=g; x.fillRect(0,0,512,256);
  // Broad studio softboxes produce measured highlights, not neon outlines.
  const softbox=(cx,cy,rx,ry,a,b)=> {
    x.save();x.translate(cx,cy);x.scale(rx,ry);
    const gg=x.createRadialGradient(0,0,.08,0,0,1);
    gg.addColorStop(0,a);gg.addColorStop(1,b);x.fillStyle=gg;x.fillRect(-1,-1,2,2);x.restore();
  };
  softbox(125,81,112,51,'rgba(255,247,224,.98)','rgba(255,247,224,0)');
  softbox(369,98,45,66,'rgba(205,223,220,.86)','rgba(205,223,220,0)');
  softbox(480,141,36,27,'rgba(230,164,103,.5)','rgba(230,164,103,0)');
  const t = new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.mapping=THREE.EquirectangularReflectionMapping;
  const pmrem=new THREE.PMREMGenerator(renderer);
  const env=pmrem.fromEquirectangular(t);t.dispose();pmrem.dispose();return env;
}

async function loadEnvironment(renderer) {
  // Baked offline from makeEnvironment's original 512×256 studio gradient
  // and the same Three r160 PMREM. GPU sRGB sampling restores linear values;
  // the atlas already contains the roughness convolution at each CubeUV LOD.
  // No remote texture, no runtime PMREM shader/convolution on WebGL 2.
  if(renderer.capabilities.isWebGL2){
    try{
      const loader=new THREE.TextureLoader();
      const tex=await loader.loadAsync(new URL('./assets/instrument-environment.webp',import.meta.url).href).catch(()=>loader.loadAsync(new URL('./assets/instrument-environment.png',import.meta.url).href));
      tex.mapping=THREE.CubeUVReflectionMapping;tex.colorSpace=THREE.SRGBColorSpace;
      tex.flipY=false;tex.generateMipmaps=false;tex.minFilter=tex.magFilter=THREE.LinearFilter;
      tex.name='Signal Path studio PMREM';tex.needsUpdate=true;
      return {texture:tex,dispose:()=>tex.dispose()};
    }catch{/* The procedural original is still a valid local fallback. */}
  }
  return makeEnvironment(renderer);
}

// Join opaque, motionless sibling meshes that share one material. All source
// vertices, normals, UVs and the real physical pick surfaces remain intact;
// the animated links, shaft, pulse and independently transparent layers do not
// enter a batch. Register the stage pick geometry *after* this operation.
function batchStatic(parent,excluded){
  let count=0;const sets=new Map();
  for(const child of [...parent.children]){
    if(!child.isMesh){count+=batchStatic(child,excluded);continue;}
    const geometry=child.geometry,mat=child.material;
    if(excluded.has(child)||child.isInstancedMesh||Array.isArray(mat)||mat.transparent||!geometry?.attributes?.position||!geometry.attributes.normal||!geometry.attributes.uv)continue;
    if(!sets.has(mat))sets.set(mat,[]);sets.get(mat).push(child);
  }
  for(const [mat,meshes] of sets){
    if(meshes.length<2)continue;
    const vertexCount=meshes.reduce((sum,m)=>sum+m.geometry.attributes.position.count,0);
    const indexCount=meshes.reduce((sum,m)=>sum+(m.geometry.index?.count||m.geometry.attributes.position.count),0);
    const positions=new Float32Array(vertexCount*3),normals=new Float32Array(vertexCount*3),uvs=new Float32Array(vertexCount*2),indices=vertexCount>65535?new Uint32Array(indexCount):new Uint16Array(indexCount);
    let vo=0,io=0;
    for(const mesh of meshes){
      mesh.updateMatrix();const geometry=mesh.geometry;geometry.applyMatrix4(mesh.matrix);
      const vcount=geometry.attributes.position.count;positions.set(geometry.attributes.position.array,vo*3);normals.set(geometry.attributes.normal.array,vo*3);uvs.set(geometry.attributes.uv.array,vo*2);
      const index=geometry.index;if(index)for(let i=0;i<index.count;i++)indices[io++]=index.getX(i)+vo;else for(let i=0;i<vcount;i++)indices[io++]=vo+i;
      vo+=vcount;parent.remove(mesh);geometry.dispose();
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));geometry.setIndex(new THREE.BufferAttribute(indices,1));geometry.computeBoundingSphere();
    const batch=new THREE.Mesh(geometry,mat);batch.name='Machined sibling batch';parent.add(batch);count+=meshes.length-1;
  }
  return count;
}

function makeShadow(parent) {
  const c=document.createElement('canvas'); c.width=256; c.height=128;
  const x=c.getContext('2d');x.save();x.translate(128,64);x.scale(112,50);
  const g=x.createRadialGradient(0,0,.05,0,0,1);g.addColorStop(0,'rgba(0,0,0,.88)');g.addColorStop(.58,'rgba(0,0,0,.56)');g.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=g;x.fillRect(-1,-1,2,2);x.restore();
  const map=new THREE.CanvasTexture(c);
  const m=new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,opacity:.82});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(10.4,7.1),m);mesh.rotation.x=-PI/2;mesh.position.set(0,-.15,.15);parent.add(mesh);
  return m;
}

function build(scene) {
  const root=new THREE.Group();scene.add(root);
  const shadow=makeShadow(scene);
  const caseMat=material('#242b2c',.44,.49), edgeMat=material('#424a4b',.29,.68), lipMat=material('#111819',.49,.24);
  const graphite=material('#303939',.58,.4), inlay=material('#141b1d',.72,.18);
  const copper=material('#ad7148',.35,.72), copperDull=material('#71503b',.48,.56);
  const warmMetal=material('#9e9381',.44,.68), ceramic=material('#d4c8ad',.66,.06);
  const glass=material('#899d9a',.18,.27,{transparent:true,opacity:.19,depthWrite:false});
  const glassEdge=material('#7a8b88',.20,.63);
  const ink=material('#292d2b',.65,.16);
  const amber=material('#ffbd79',.29,.21,{emissive:'#f2a55d',emissiveIntensity:1.4});

  // Stacked, bevelled enclosure with a finely inset faceplate.
  plate(root,6.58,4.08,.12,.30,lipMat,0,.03,0,.034);
  plate(root,6.63,4.13,.22,.31,caseMat,0,.18,0,.044);
  plate(root,6.64,4.12,.045,.30,edgeMat,0,.433,0,.017);
  plate(root,6.46,3.96,.033,.25,lipMat,0,.50,0,.015);
  plate(root,6.26,3.74,.045,.21,graphite,0,.55,0,.022);
  // Flush front rail, serial marking and low copper detail.
  block(root,5.62,.036,.028,copperDull,0,.465,2.08);
  for(const x of [-2.82,2.82]) for(const z of [-1.74,1.74]) {
    disk(root,.089,.032,lipMat,x,.614,z,16);
    disk(root,.060,.037,warmMetal,x,.634,z,24);
    block(root,.068,.008,.014,ink,x,.660,z).rotation.y=PI/5;
  }
  for(let i=0;i<19;i++) {
    const x=-1.49+i*.166;
    block(root,.108,.041,.022,inlay,x,.285,2.091);
  }
  for(let i=0;i<10;i++) {
    const z=-.76+i*.18;
    block(root,.018,.083,.092,lipMat,3.342,.289,z);
  }
  topTexture(root,'',2.38,.28,0,.622,-1.75,(c,w,h)=>{
    c.clearRect(0,0,w,h);c.fillStyle='#aaa79a';c.font='400 22px monospace';c.textAlign='center'; c.fillText('S R   /   S I G N A L   P A T H',w/2,39);
  });

  const labels=[['01','INPUT','REQUEST'],['02','ROUTING','SYSTEM'],['03','EVIDENCE','PROOF']];
  const stageX=[-2.10,0,2.10], stageW=[1.82,2.03,1.82];
  const stageMat=[],stageLamps=[],stageBodies=[];
  for(let i=0;i<3;i++) {
    const cx=stageX[i],w=stageW[i];
    // Existing visible chamber surfaces double as the physical pick targets;
    // the empty scene and the common chassis are deliberately not targets.
    const chamber=new THREE.Group();root.add(chamber);stageBodies.push(chamber);
    plate(chamber,w,2.76,.055,.13,lipMat,cx,.625,-.06,.021);
    plate(chamber,w-.10,2.65,.035,.10,inlay,cx,.706,-.06,.014);
    const rim=material('#895c3e',.37,.52,{emissive:'#af6a34',emissiveIntensity:0});stageMat.push(rim);
    // Four precise segments make the chamber seam visible without encasing it in a glowing UI box.
    for(const [z,sz] of [[-1.343,-1],[1.22,1]]) {
      block(chamber,w-.31,.021,.028,rim,cx,.772,z);
      for(const side of [-1,1])block(chamber,.028,.022,.095,rim,cx+side*(w/2-.156),.772,z-sz*.04);
    }
    for(const side of [-1,1])block(chamber,.027,.021,2.27,rim,cx+side*(w/2-.156),.772,-.06);
    plate(chamber,w-.13,.44,.042,.065,caseMat,cx,.738,1.523,.013);
    topTexture(chamber,labels[i],w-.26,.41,cx,.8,1.523,brandStrip);
    const lampMat=material('#b47f48',.28,.33,{emissive:'#ee9a49',emissiveIntensity:0});stageLamps.push(lampMat);
    disk(chamber,.055,.028,lipMat,cx+w*.38,.825,1.523,20);
    disk(chamber,.032,.025,lampMat,cx+w*.38,.848,1.523,20);
  }

  // INPUT: the requested work is represented by an actual milled slot, a
  // laminated instruction plate and a sliding brass contact.
  const input=new THREE.Group();input.position.set(-2.1,.80,-.04);root.add(input);
  plate(input,1.45,1.91,.11,.09,caseMat,0,0,-.16,.025);
  plate(input,1.28,1.71,.038,.07,edgeMat,0,.15,-.16,.012);
  plate(input,1.15,1.58,.038,.055,inlay,0,.21,-.16,.011);
  const inputHead=new THREE.Group();inputHead.position.set(0,.29,-.06);input.add(inputHead);
  const inputLinks=[-.34,.34].map(x=>makeLink(input,V(x,.251,-.30),.033,warmMetal));
  plate(inputHead,.89,1.18,.054,.045,warmMetal,0,0,-.10,.018);
  plate(inputHead,.84,1.12,.042,.04,ceramic,0,.081,-.10,.013);
  topTexture(inputHead,'',.76,1.02,0,.136,-.10,(c,w,h)=>{
    c.clearRect(0,0,w,h);c.fillStyle='#4f514a';c.font='600 39px monospace';c.fillText('01',48,100);
    c.font='500 62px Arial';c.fillText('INPUT',48,182);
    c.strokeStyle='#987253';c.lineWidth=4; c.beginPath();c.moveTo(48,222);c.lineTo(w-48,222);c.stroke();
    c.fillStyle='#7e7c6c';for(let i=0;i<4;i++)c.fillRect(48,279+i*84,w-(i%2===0?96:195),9);
    c.strokeStyle='#9d7650';c.lineWidth=5;c.strokeRect(48,h-136,77,77);c.beginPath();c.moveTo(62,h-98);c.lineTo(82,h-80);c.lineTo(111,h-117);c.stroke();
  });
  // Four retention guides and a small contact comb near the edge.
  for(const side of [-1,1]) {
    block(input,.056,.094,1.42,copperDull,side*.56,.28,-.17);
    for(const z of [-.76,.45])disk(input,.048,.089,warmMetal,side*.62,.22,z,12);
  }
  for(let i=0;i<8;i++)block(input,.062,.029,.17,i===4?amber:copperDull,-.36+i*.102,.29,.71);
  // A smoked window hovers over the first edge of the instruction plate.
  plate(input,1.20,.28,.074,.035,glassEdge,0,.294,-.79,.011);
  plate(input,1.14,.22,.087,.02,glass,0,.38,-.79,.013);

  // ROUTING: precision rotary bus with real traces entering and leaving via
  // two independent channels. Rotation reveals the position of its selector.
  const center=new THREE.Group();center.position.set(0,.80,-.10);root.add(center);
  plate(center,1.68,1.79,.12,.15,caseMat,0,0,-.03,.026);
  plate(center,1.55,1.64,.05,.12,copperDull,0,.149,-.03,.018);
  plate(center,1.48,1.56,.06,.12,graphite,0,.227,-.03,.016);
  disk(center,.705,.10,lipMat,0,.355,-.08,64);
  disk(center,.665,.075,edgeMat,0,.447,-.08,64);
  ring(center,.623,.024,copper,0,.49,-.08,80);
  disk(center,.619,.040,inlay,0,.492,-.08,64);
  // Radial engraving uses an instanced mesh instead of separate draw calls.
  const tickGeom=new THREE.BoxGeometry(1,1,1), tickMat=warmMetal;
  const ticks=new THREE.InstancedMesh(tickGeom,tickMat,48);
  const transform=new THREE.Object3D();
  for(let i=0;i<48;i++) {
    const a=i*PI/24, long=i%4===0;
    transform.position.set(Math.sin(a)*.568,.517,-.08+Math.cos(a)*.568);
    transform.rotation.set(0,a,0); transform.scale.set(long?.018:.009,.010,long?.09:.048);transform.updateMatrix();ticks.setMatrixAt(i,transform.matrix);
  }
  center.add(ticks);
  ring(center,.43,.016,copperDull,0,.512,-.08,64);
  const selector=new THREE.Group();selector.position.set(0,.526,-.08);center.add(selector);
  const selectorShaft=disk(center,.10,1,copper,0,.52,-.08,30);
  selectorShaft.scale.y=.04;
  disk(selector,.365,.095,glassEdge,0,.045,0,64);
  disk(selector,.339,.027,glass,0,.106,0,64);
  ring(selector,.307,.012,copper,0,.111,0,56);
  disk(selector,.16,.059,caseMat,0,.09,0,40);
  disk(selector,.133,.042,copper,0,.142,0,40);
  ring(selector,.079,.011,amber,0,.167,0,40);
  for(const side of [-1,1]) {
    block(selector,.045,.035,.118,copper,0,.12,side*.238);
    block(selector,.078,.023,.046,edgeMat,side*.249,.13,0);
  }
  // The two channels are raised, etched glass strips with their end fittings.
  for(const side of [-1,1]) {
    const z=side*.59;
    plate(center,1.30,.12,.042,.024,copperDull,0,.329,z,.008);
    for(const x of [-.66,.66])disk(center,.061,.065,warmMetal,x,.40,z,16);
    plate(center,1.12,.088,.060,.016,glass,0,.424,z,.008);
  }
  // Solid standoff corners; a dark optical module reads as hardware.
  for(const x of [-.77,.77])for(const z of [-.84,.78]) {
    disk(center,.068,.125,copperDull,x,.145,z,16);disk(center,.042,.054,warmMetal,x,.234,z,16);
  }

  // EVIDENCE: a paper-like output card slides onto a finished inspection bed.
  const proof=new THREE.Group();proof.position.set(2.10,.80,-.04);root.add(proof);
  plate(proof,1.42,1.89,.12,.11,caseMat,0,0,-.15,.025);
  plate(proof,1.30,1.75,.049,.08,inlay,0,.154,-.15,.013);
  plate(proof,1.13,1.62,.044,.05,copperDull,0,.227,-.10,.011);
  const evidence=new THREE.Group();evidence.position.set(0,.305,-.18);proof.add(evidence);
  const proofLinks=[-.39,.39].map(x=>{
    disk(proof,.046,.026,edgeMat,x,.275,-.28,18);
    return makeLink(proof,V(x,.28,-.28),.041,warmMetal);
  });
  plate(evidence,1.03,1.36,.036,.045,warmMetal,0,0,0,.013);
  plate(evidence,.99,1.31,.055,.038,ceramic,0,.061,0,.012);
  topTexture(evidence,'',.91,1.22,0,.131,0,(c,w,h)=>{
    c.clearRect(0,0,w,h);c.fillStyle='#4f514a';c.font='600 39px monospace';c.fillText('03',44,89);
    c.fillStyle='#303833';c.font='600 61px Arial';c.fillText('PROOF',44,175);
    c.strokeStyle='#9b7955';c.lineWidth=4;c.beginPath();c.moveTo(44,215);c.lineTo(w-44,215);c.stroke();
    c.strokeStyle='#776e5e';c.lineWidth=3;
    for(let i=0;i<3;i++){
      const y=278+i*106;c.strokeRect(48,y,42,42);c.beginPath();c.moveTo(58,y+21);c.lineTo(69,y+32);c.lineTo(82,y+10);c.stroke();
      c.fillStyle='#6e7166';c.fillRect(116,y+8,w-(162+i*28),8);c.fillStyle='#aaa28e';c.fillRect(116,y+30,w-(197+i*35),5);
    }
    c.strokeStyle='#9b7955';c.lineWidth=3;c.beginPath();c.moveTo(45,h-89);c.lineTo(w-45,h-89);c.stroke();
  });
  for(const side of [-1,1]) {
    block(proof,.065,.10,1.53,copperDull,side*.60,.28,-.12);
    for(const z of [-.75,.60])disk(proof,.047,.085,edgeMat,side*.643,.24,z,16);
  }
  // Recessed lip and front gripping comb.
  plate(proof,1.17,.14,.075,.04,edgeMat,0,.30,.80,.012);
  for(let i=0;i<6;i++)block(proof,.080,.018,.080,ink,-.32+i*.128,.395,.80);

  // ROUTE: matte copper conducts the three-stage visual metaphor. The pulse
  // follows an actual tube, then changes channels only through the rotary bus.
  const paths=[];const pathMats=[],routeGroups=[];
  const pathPts=[
    [V(-2.1,.925,.67),V(-2.10,.91,.925),V(-1.58,.91,.925),V(-1.25,.91,.79),V(-1.15,.94,.42),V(-1.02,.95,.09),V(-.84,1.04,.09)],
    // Route along the rim of the selector housing, above the bevel and well
    // outside the ring itself. The visible pulse and the selected branch now
    // remain legible even from the lower camera angle.
    [V(-.84,1.04,.09),V(-.80,1.14,-.15),V(-.70,1.23,-.72),V(-.40,1.25,-.82),V(.32,1.25,-.82),V(.70,1.23,-.72),V(.82,1.14,-.12),V(.92,1.04,.09)],
    [V(-.84,1.04,.09),V(-.76,1.15,.34),V(-.64,1.23,.61),V(-.36,1.25,.66),V(.36,1.25,.66),V(.65,1.23,.60),V(.82,1.15,.13),V(.92,1.04,.09)],
    [V(.92,1.04,.09),V(1.06,.965,.10),V(1.25,.91,.79),V(1.56,.91,.925),V(2.10,.91,.925),V(2.10,.935,.72)]
  ];
  for(const [index,p] of pathPts.entries()) {
    const m=material('#a46944',.31,.63,{emissive:'#d47d31',emissiveIntensity:.03});pathMats.push(m);
    const group=new THREE.Group();root.add(group);routeGroups.push(group);
    line(group,p,(index===1||index===2) ? .036 : .052,lipMat,.12);
    const curve=line(group,p,.022,m,.12); paths.push(curve);
  }
  for(const p of [pathPts[0][0],pathPts[0].at(-1),pathPts[3][0],pathPts[3].at(-1)]) {
    disk(root,.069,.023,lipMat,p.x,p.y-.016,p.z,24);disk(root,.043,.031,copper,p.x,p.y+.009,p.z,22);
  }
  const pulseGroup=new THREE.Group();root.add(pulseGroup);
  const beadGeo=new THREE.SphereGeometry(.063,13,9), beadMat=new THREE.MeshBasicMaterial({color:'#ffd384'});
  const bead=new THREE.Mesh(beadGeo,beadMat);pulseGroup.add(bead);
  const haloMat=new THREE.MeshBasicMaterial({color:'#f69a46',transparent:true,opacity:.19,depthWrite:false});
  const halo=new THREE.Mesh(new THREE.SphereGeometry(.14,12,8),haloMat);pulseGroup.add(halo);
  const trail=[];
  for(let i=0;i<4;i++) {
    const t=new THREE.Mesh(new THREE.SphereGeometry(.038-i*.004,9,7),new THREE.MeshBasicMaterial({color:'#ffb55d',transparent:true,opacity:.45-i*.09,depthWrite:false}));root.add(t);trail.push(t);
  }
  // Two tiny calibration traces on the lower faceplate, at unlit base level.
  for(const sx of [-1,1]) {
    linear(root,V(sx*2.15,.646,-1.55),V(sx*.78,.646,-1.55),.009,copperDull);
    for(let i=0;i<10;i++)block(root,.018,.010,.045,copperDull,sx*(.83+i*.135),.649,-1.61);
  }
  const mergedMeshes=batchStatic(root,new Set([selectorShaft,halo,...trail,...inputLinks.map(link=>link.mesh),...proofLinks.map(link=>link.mesh)]));
  const pickMeshes=[];
  const register=(group,stage)=>group.traverse(mesh=>{
    if(mesh.isMesh){mesh.userData.instrumentStage=stage;pickMeshes.push(mesh);}
  });
  stageBodies.forEach(register);
  [input,center,proof].forEach(register);
  routeGroups.forEach((group,index)=>register(group,index===0?0:index===3?2:1));
  // Diagnostic projections use visible surfaces, never invisible proxies.
  const pickAnchors=[
    {node:inputHead,point:V(0,.145,-.10)},
    {node:selector,point:V(0,.182,0)},
    {node:evidence,point:V(0,.138,0)},
  ];
  return {root,shadow,caseMat,edgeMat,copper,stageMat,stageLamps,pathMats,paths,inputHead,inputLinks,selector,selectorShaft,evidence,proofLinks,
    pulseGroup,halo,trail,pickMeshes,pickAnchors,mergedMeshes};
}

function mountPoster(container) {
  let img=container.querySelector('.instrument-poster');
  if(!img){
    img=document.createElement('img'); img.className='instrument-poster';
    img.alt=''; img.src=new URL('./assets/instrument-poster.svg',import.meta.url).href;
    Object.assign(img.style,{position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:'contain',pointerEvents:'none'});
    container.append(img);
  }
  img.hidden=false;img.style.display='';return img;
}

export async function mountInstrument(container,{onStage,theme='dark',initialStage=0,initialPaused=false,shouldMount=()=>true}={}) {
  if(!container)return null;
  const poster=mountPoster(container);
  let activeStage=clamp(Math.round(Number(initialStage)||0),0,2),disposed=false,paused=Boolean(initialPaused);
  container.dataset.stage=String(activeStage);container.dataset.renderer='static';container.dataset.paused=String(paused);container.dataset.hoverStage='none';container.dataset.objectPicks='0';container.dataset.hitPoints='[]';
  container.style.cursor='default';
  const basic={
    setStage(index){const n=clamp(Math.round(Number(index)||0),0,2);if(n===activeStage)return;activeStage=n;container.dataset.stage=String(n);},
    setPaused(state){paused=Boolean(state);container.dataset.paused=String(paused);},setTheme(){},dispose(){disposed=true;}
  };
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  // Respect data saving without initiating a renderer. The same stage labels
  // remain available in the enclosing HTML.
  if(reduced.matches||navigator.connection?.saveData)return basic;
  if(!shouldMount())return null;
  const phase={start:performance.now()};
  const markPhase=(name,start)=>{const end=performance.now();phase[name]=Math.round((end-start)*10)/10;return end;};
  const yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0));
  let renderer;
  try { renderer=new THREE.WebGLRenderer({alpha:true, antialias:true, powerPreference:'low-power',preserveDrawingBuffer:false}); }
  catch { return basic; }
  let phaseStart=markPhase('context',phase.start);
  const canvas=renderer.domElement;
  canvas.className='instrument-canvas'; canvas.setAttribute('aria-hidden','true');
  Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',display:'block',visibility:'hidden',pointerEvents:'none'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;
  renderer.setClearColor(0,0);
  let shaderFailed=false;renderer.debug.onShaderError=()=>{shaderFailed=true;};
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-4,4,4,-4,.1,70);
  const hemi=new THREE.HemisphereLight('#e4e2d4','#4c534f',1.36);scene.add(hemi);
  const key=new THREE.DirectionalLight('#fff0d9',3.0);key.position.set(-6,9,7);scene.add(key);
  const rim=new THREE.DirectionalLight('#aecac9',1.72);rim.position.set(5,6,-6);scene.add(rim);
  const bounce=new THREE.DirectionalLight('#dc9d68',.68);bounce.position.set(-3,2,-6);scene.add(bounce);
  let environment;
  try{environment=await loadEnvironment(renderer);scene.environment=environment.texture;}catch{}
  phaseStart=markPhase('environment',phaseStart);
  if(!shouldMount()){environment?.dispose();renderer.dispose();return null;}
  await yieldTask();
  let art;
  try{art=build(scene);}catch{environment?.dispose();renderer.dispose();return basic;}
  phaseStart=markPhase('geometry',phaseStart);
  const releaseResources=()=>{
    const mats=new Set(),geometries=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material){for(const m of(Array.isArray(o.material)?o.material:[o.material])){mats.add(m);if(m.map)textures.add(m.map);}}});
    geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());mats.forEach(m=>m.dispose());environment?.dispose();renderer.dispose();canvas.remove();
  };
  if(!shouldMount()){releaseResources();return null;}
  container.append(canvas);

  let inView=true,contextOK=true,frame=0,last=0,nextDue=0,elapsed=0,frameInterval=1000/30,firstFrame=false,readyForDraw=false;
  let pointerX=0,pointerY=0,rect=null,rectDirty=true,currentTheme=theme,appliedTheme=null,aspect=1.36,hoveredStage=-1,objectPicks=0;
  let renderWidth=0,renderHeight=0,renderDpr=0,qualityIndex=0,qualityList=[],smallViewport=false;
  let sampleSpan=0,sampleCost=0,sampleCount=0,fastWindows=0,warmUntil=0,frameCount=0,lastFramePublish=0,diagnosticIdle=0;
  let latestPointer=null,pointerFrame=0;
  const state=[1,0,0];
  const hoverState=[0,0,0],pickRay=new THREE.Raycaster(),pickNDC=new THREE.Vector2(),projected=new THREE.Vector3();
  let lastDiagnostic=0,lastHitPoints='';
  let branchWeight=0, cameraTransition=null,boundsDirty=true;
  const fitShot=index=>{
    const shot=SHOTS[index];
    // Resolve responsive composition once on resize; portrait frames keep a
    // wider field than the cinematic desktop composition, preserving edges.
    const wide=clamp((aspect-1.05)/.40,0,1);
    // Give the wider opening a slightly closer view, not a taller scene.
    // Narrow phones already use most of their available width; preserve that
    // fit while reserving a little edge clearance during the stage orbit.
    const roomy=clamp((aspect-1.38)/.21,0,1);
    const narrowClearance=.070*(1-clamp((aspect-1.25)/.17,0,1));
    const gain=.043*roomy+.012*clamp((aspect-1.25)/.13,0,1)-narrowClearance;
    return {...shot,aimX:shot.aimX*(.48+.52*wide)*(1-.22*roomy),zoom:1+(shot.zoom-1)*(.38+.62*wide)+gain};
  };
  let cameraPose=fitShot(0);
  const applyCamera=pose=>{
    const distance=17.3,horiz=Math.cos(pose.elevation)*distance;
    camera.position.set(pose.aimX+Math.sin(pose.azimuth)*horiz,
      pose.aimY+Math.sin(pose.elevation)*distance,pose.aimZ+Math.cos(pose.azimuth)*horiz);
    camera.lookAt(pose.aimX,pose.aimY,pose.aimZ);
    if(Math.abs(camera.zoom-pose.zoom)>1e-7){camera.zoom=pose.zoom;camera.updateProjectionMatrix();}
  };
  const snapCamera=()=>{cameraTransition=null;cameraPose=fitShot(activeStage);applyCamera(cameraPose);boundsDirty=true;};
  const beginCamera=()=>{cameraTransition={from:{...cameraPose},to:fitShot(activeStage),time:0,duration:1.28};boundsDirty=true;};
  const updateCamera=(dt,force)=>{
    if(force){snapCamera();return;}
    if(!cameraTransition)return;
    cameraTransition.time+=dt;
    const progress=clamp(cameraTransition.time/cameraTransition.duration,0,1),ease=cinematicEase(progress);
    for(const k of shotKeys)cameraPose[k]=cameraTransition.from[k]+(cameraTransition.to[k]-cameraTransition.from[k])*ease;
    applyCamera(cameraPose);
    if(progress===1)cameraTransition=null;
  };
  const getMotion=()=>!paused&&!reduced.matches&&inView&&!document.hidden&&contextOK&&!disposed;
  const setVisual=(dt, force=false)=>{
    if(force){elapsed=0;branchWeight=0;}
    const factor=force?1:1-Math.exp(-dt*4.8);
    for(let i=0;i<3;i++){
      const target=i===activeStage?1:0;
      state[i]+=(target-state[i])*factor;
      hoverState[i]+=((hoveredStage===i?1:0)-hoverState[i])*(force?1:1-Math.exp(-dt*7.0));
    }
    for(let i=0;i<3;i++){
      const completed=i===0?state[1]+state[2]:i===1?state[2]:0;
      art.stageMat[i].emissiveIntensity=.02+.50*state[i]+.13*completed+.20*hoverState[i];
      art.stageLamps[i].emissiveIntensity=.08+1.65*state[i]+.32*completed+.29*hoverState[i];
    }
    const [a,b,c]=state;
    // Tangible action: slide the request onto the reader, raise the routing
    // selector, then lift the evidence card towards the inspection edge.
    art.inputHead.position.z=-.06+.28*a;
    art.inputHead.position.y=.29+.194*a;
    art.inputHead.rotation.x=-.035*a;
    art.inputLinks.forEach(link=>poseLink(link,link.anchor.x,art.inputHead.position.y+.007,art.inputHead.position.z-.22));
    art.selector.position.y=.526+.285*b;
    art.selectorShaft.scale.y=Math.max(.04,art.selector.position.y-.497);
    art.selectorShaft.position.y=.497+art.selectorShaft.scale.y*.5;
    // Channel selection and the moving amber pulse agree: the rotary head
    // changes route each time the two centre branches alternate.
    const channel=Math.floor(elapsed/3.0)%2;
    branchWeight+=(channel-branchWeight)*factor;
    const angle=activeStage===1?(channel===0?PI*.37:-PI*.31):activeStage===2?PI*.54:0;
    art.selector.rotation.y += (angle-art.selector.rotation.y)*factor;
    art.evidence.position.z=-.18+.43*c;art.evidence.position.y=.305+.37*c;art.evidence.rotation.x=.05*c;
    art.proofLinks.forEach(link=>poseLink(link,link.anchor.x,art.evidence.position.y+.015,art.evidence.position.z-.15));
    // Completed copper segments retain a restrained residual glow: the path
    // accumulates through the story rather than looking like three alerts.
    art.pathMats[0].emissiveIntensity=.06+1.16*a+.31*(b+c);
    art.pathMats[1].emissiveIntensity=.06+(.36+.88*branchWeight)*b+.28*c;
    art.pathMats[2].emissiveIntensity=.06+(1.24-.88*branchWeight)*b+.28*c;
    art.pathMats[3].emissiveIntensity=.06+1.28*c;
    const motionless=force||reduced.matches||paused;
    const pathIndex=activeStage===0?0:activeStage===2?3:(channel===0?2:1);
    const curve=art.paths[pathIndex];
    const t=motionless?.61:(elapsed%3.0)/3.0;
    curve.getPointAt(t,art.pulseGroup.position);art.pulseGroup.position.y+=.024;
    art.halo.scale.setScalar(1+Math.sin(elapsed*4)*.13);
    art.trail.forEach((mesh,i)=>{
      const p=t-(i+1)*.035;mesh.visible=!motionless&&p>0;
      if(mesh.visible){curve.getPointAt(p,mesh.position);mesh.position.y+=.024;}
    });
    // Pointer motion is deliberately small and never alters the document layout.
    const rx=motionless?0:pointerY*.034,rz=motionless?0:-pointerX*.038;
    art.root.rotation.x+=(rx-art.root.rotation.x)*factor;
    art.root.rotation.z+=(rz-art.root.rotation.z)*factor;
    updateCamera(dt,force);
  };
  const getPickPoints=()=>art.pickAnchors.map(({node,point})=>{
    projected.copy(point).applyMatrix4(node.matrixWorld).project(camera);
    return [Number(((projected.x+1)*.5).toFixed(4)),Number(((1-projected.y)*.5).toFixed(4))];
  });
  // The responsive art is measured from its real rendered vertices only on
  // a settled shot/resize, rather than synthesized by screen coordinates.
  // Also useful for comparing physical clipping in the private QA fixture.
  const getProjectedBounds=()=>{
    const bounds={left:Infinity,top:Infinity,right:-Infinity,bottom:-Infinity},point=new THREE.Vector3(),instance=new THREE.Matrix4(),matrix=new THREE.Matrix4(),projection=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),projectedWorld=new THREE.Matrix4();
    const sample=(positions,world)=>{projectedWorld.multiplyMatrices(projection,world);for(let i=0;i<positions.count;i++){
      point.fromBufferAttribute(positions,i).applyMatrix4(projectedWorld);
      const x=(point.x+1)/2,y=(1-point.y)/2;
      bounds.left=Math.min(bounds.left,x);bounds.right=Math.max(bounds.right,x);bounds.top=Math.min(bounds.top,y);bounds.bottom=Math.max(bounds.bottom,y);
    }};
    art.root.traverse(mesh=>{
      if(!mesh.isMesh||!mesh.visible||!mesh.geometry?.attributes?.position)return;
      if(mesh.isInstancedMesh)for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,instance);matrix.multiplyMatrices(mesh.matrixWorld,instance);sample(mesh.geometry.attributes.position,matrix);}
      else sample(mesh.geometry.attributes.position,mesh.matrixWorld);
    });
    for(const key of Object.keys(bounds))bounds[key]=Number(bounds[key].toFixed(4));return bounds;
  };
  const publishPickPoints=(force=false)=>{
    const now=performance.now();if(!force&&now-lastDiagnostic<120)return;lastDiagnostic=now;
    const points=JSON.stringify(getPickPoints());if(points!==lastHitPoints){lastHitPoints=points;container.dataset.hitPoints=points;}
  };
  const showPoster=()=>{poster.hidden=false;poster.style.display='';container.dataset.renderer='static';container.dataset.hitPoints='[]';delete container.dataset.artBounds;lastHitPoints='';};
  const setHover=n=>{
    if(n===hoveredStage)return;
    hoveredStage=n;container.dataset.hoverStage=n<0?'none':String(n);container.style.cursor=n<0?'default':'pointer';
  };
  const cancelBounds=()=>{if(diagnosticIdle){if('cancelIdleCallback'in window)cancelIdleCallback(diagnosticIdle);else clearTimeout(diagnosticIdle);diagnosticIdle=0;}};
  const publishBounds=()=>{diagnosticIdle=0;if(disposed||!contextOK||!firstFrame||cameraTransition||!boundsDirty)return;container.dataset.artBounds=JSON.stringify(getProjectedBounds());boundsDirty=false;};
  const scheduleBounds=()=>{if(diagnosticIdle||!boundsDirty||cameraTransition||!firstFrame||!inView)return;diagnosticIdle='requestIdleCallback'in window?requestIdleCallback(publishBounds,{timeout:400}):setTimeout(publishBounds,20);};
  const flushFrame=()=>{container.dataset.instrumentFrame=String(frameCount);lastFramePublish=performance.now();};
  const draw=()=>{
    if(disposed||!contextOK||!readyForDraw||!inView||document.hidden)return null;
    const start=performance.now();
    try{renderer.render(scene,camera);}catch{shaderFailed=true;}
    if(shaderFailed){contextOK=false;stop();setHover(-1);canvas.style.visibility='hidden';showPoster();return null;}
    frameCount++;
    if(!firstFrame){
      firstFrame=true;
      // The author stylesheet can override the browser's [hidden] default.
      // An inline display declaration prevents the vector duplicate from
      // appearing through the transparent live canvas.
      poster.hidden=true;poster.style.display='none';canvas.style.visibility='';container.dataset.renderer='webgl';container.dataset.instrumentDrawCalls=String(renderer.info.render.calls);container.dataset.instrumentMerged=String(art.mergedMeshes);publishPickPoints(true);flushFrame();
    }else publishPickPoints();
    if(performance.now()-lastFramePublish>230)flushFrame();scheduleBounds();
    return performance.now()-start;
  };
  const qualityOptions=(w,h,mobile)=>{
    const device=Math.max(.5,window.devicePixelRatio||1),pixelCap=Math.sqrt((mobile?650000:1350000)/Math.max(1,w*h));
    // Prefer holding legible artwork over chasing frame rate on a slow GPU.
    const requested=mobile?[[24,1.25],[24,.98],[24,.80],[20,.70],[18,.62],[14,.62]]:[[30,1.65],[30,1.25],[30,1],[30,.83],[24,.74],[20,.70],[14,.70]];
    const result=[];for(const [fps,cap]of requested){const dpr=Math.max(.35,Math.min(device,pixelCap,cap));if(!result.some(x=>x.fps===fps&&Math.abs(x.dpr-dpr)<.015))result.push({fps,dpr});}return result;
  };
  const resetSamples=(warm=260)=>{sampleSpan=sampleCost=sampleCount=fastWindows=0;warmUntil=performance.now()+warm;};
  const applyQuality=(index,w=renderWidth,h=renderHeight)=>{
    if(!qualityList.length||!w||!h)return;
    qualityIndex=clamp(index,0,qualityList.length-1);const quality=qualityList[qualityIndex];frameInterval=1000/quality.fps;
    container.dataset.instrumentDpr=quality.dpr.toFixed(2);container.dataset.instrumentTargetFps=String(quality.fps);container.dataset.instrumentQuality=String(qualityIndex);
    if(renderWidth!==w||renderHeight!==h||Math.abs(renderDpr-quality.dpr)>.005){if(Math.abs(renderDpr-quality.dpr)>.005)renderer.setPixelRatio(quality.dpr);renderer.setSize(w,h,false);renderWidth=w;renderHeight=h;renderDpr=quality.dpr;}
  };
  const samplePerformance=(now,gap,cost)=>{
    if(!Number.isFinite(cost)||gap<=0||now<warmUntil)return;
    sampleSpan+=gap;sampleCost+=cost;sampleCount++;
    if(sampleSpan<600||sampleCount<2)return;
    const avgGap=sampleSpan/sampleCount,avgCost=sampleCost/sampleCount,measured=1000/avgGap,slow=avgGap>frameInterval*1.41||avgCost>frameInterval*.9,verySlow=avgGap>frameInterval*2.45||avgCost>frameInterval*1.7;
    container.dataset.instrumentMeasuredFps=measured.toFixed(1);sampleSpan=sampleCost=sampleCount=0;
    if(slow&&qualityIndex<qualityList.length-1){applyQuality(qualityIndex+(verySlow?(avgGap>frameInterval*5?3:2):1));resetSamples(350);nextDue=now+frameInterval;return;}
    fastWindows=avgGap<frameInterval*1.14&&avgCost<frameInterval*.56?fastWindows+1:0;
    if(fastWindows>=9&&qualityIndex>0){applyQuality(qualityIndex-1);resetSamples(450);nextDue=now+frameInterval;}
  };
  const tick=(now)=>{
    frame=0;if(!getMotion())return;
    if(!last){last=now;nextDue=now+frameInterval;}
    if(now+.9>=nextDue){const delta=Math.max(0,now-last),dt=Math.min(delta/1000,.16),late=Math.max(0,now-nextDue);last=now;nextDue=now+frameInterval-Math.min(frameInterval*.68,late);elapsed+=dt;setVisual(dt);const cost=draw();if(cost!==null)samplePerformance(now,delta,cost);}
    if(getMotion())frame=requestAnimationFrame(tick);
  };
  const stop=()=>{if(frame)cancelAnimationFrame(frame);frame=0;last=nextDue=0;flushFrame();};
  const maybeStart=()=>{if(getMotion()&&readyForDraw){if(!frame){last=nextDue=0;resetSamples();frame=requestAnimationFrame(tick);}}else stop();};
  const chooseStage=(index,source='programmatic')=>{
    const n=clamp(Math.round(Number(index)||0),0,2);
    if(n!==activeStage){
      activeStage=n;container.dataset.stage=String(n);elapsed=0;
      if(!getMotion()){setVisual(0,true);draw();if(contextOK&&firstFrame){publishPickPoints(true);if(inView){cancelBounds();publishBounds();}}}else{beginCamera();last=nextDue=0;maybeStart();}
    }
    // Only a physical click is reported to the parent. Its programmatic
    // setStage() may safely follow without recirculating the callback.
    if(source==='object'){
      container.dataset.objectPicks=String(++objectPicks);
      onStage?.(n,'object');
    }
  };
  const resize=()=>{
    if(disposed)return;
    rect=container.getBoundingClientRect();
    const w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));
    if(w===renderWidth&&h===renderHeight){rectDirty=false;return;}
    // Keep both edges of the instrument inside the viewport on narrow phones.
    const a=w/h, mobile=w<480;aspect=a;
    const priorQuality=smallViewport===mobile?qualityIndex:0;smallViewport=mobile;
    qualityList=qualityOptions(w,h,mobile);applyQuality(priorQuality,w,h);resetSamples();
    const height=Math.max(6.12,8.28/a);
    camera.top=height/2;camera.bottom=-height/2;camera.left=-height*a/2;camera.right=height*a/2;
    snapCamera();camera.updateProjectionMatrix();
    if(contextOK&&w>1&&h>1)draw();
  };
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);
  const intersection=new IntersectionObserver(entries=>{
    inView=Boolean(entries[0]?.isIntersecting);if(inView&&contextOK)draw();else setHover(-1);maybeStart();
  },{threshold:0.01});intersection.observe(container);
  const motionChange=()=>{setVisual(0,true);draw();maybeStart();};
  const visibilityChange=()=>{if(!document.hidden&&inView&&contextOK)draw();maybeStart();};
  const pointerEnter=()=>{rect=container.getBoundingClientRect();};
  const pointerLocation=e=>{
    // Read the current bounds once for each genuine input; page scroll can
    // move the instrument while the pointer remains within the scene.
    rect=container.getBoundingClientRect();
    if(!rect.width||!rect.height||e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)return null;
    return {x:(e.clientX-rect.left)/rect.width,y:(e.clientY-rect.top)/rect.height};
  };
  const pickStage=position=>{
    if(!position||!firstFrame||!inView||!contextOK||disposed)return -1;
    pickNDC.set(position.x*2-1,1-position.y*2);
    camera.updateMatrixWorld();pickRay.setFromCamera(pickNDC,camera);
    const hit=pickRay.intersectObjects(art.pickMeshes,false)[0];
    return Number.isInteger(hit?.object.userData.instrumentStage)?hit.object.userData.instrumentStage:-1;
  };
  const pointerMove=e=>{
    if(e.pointerType==='touch'||!contextOK||disposed)return;
    const position=pointerLocation(e);setHover(pickStage(position));
    if(position&&getMotion()){
      pointerX=clamp(position.x*2-1,-1,1);pointerY=clamp(position.y*2-1,-1,1);
    }
  };
  const pointerLeave=()=>{pointerX=pointerY=0;setHover(-1);};
  const click=e=>{
    if(e.button!==0||!contextOK||disposed)return;
    // A genuine browser tap generates a click, so touch and mouse share the
    // same geometry hit without intercepting scrolling or placing proxies.
    const index=pickStage(pointerLocation(e));
    if(e.pointerType!=='touch')setHover(index);
    if(index>=0)chooseStage(index,'object');
  };
  const lose=e=>{e.preventDefault();contextOK=false;stop();setHover(-1);canvas.style.visibility='hidden';showPoster();};
  const restore=()=>{contextOK=true;shaderFailed=false;firstFrame=false;canvas.style.visibility='hidden';renderWidth=0;resize();maybeStart();};
  reduced.addEventListener('change',motionChange);document.addEventListener('visibilitychange',visibilityChange);
  container.addEventListener('pointerenter',pointerEnter,{passive:true});container.addEventListener('pointermove',pointerMove,{passive:true});container.addEventListener('pointerleave',pointerLeave,{passive:true});
  container.addEventListener('click',click,{passive:true});
  canvas.addEventListener('webglcontextlost',lose);canvas.addEventListener('webglcontextrestored',restore);
  function setTheme(value){
    const light=value==='light'||value==='day';currentTheme=light?'light':'dark';
    if(appliedTheme===currentTheme)return;appliedTheme=currentTheme;
    art.caseMat.color.set(light?'#3d4140':'#242b2c');art.edgeMat.color.set(light?'#666b65':'#424a4b');
    art.shadow.opacity=light?.47:.86;key.intensity=light?3.4:3.0;hemi.intensity=light?1.58:1.36;rim.intensity=light?1.3:1.72;
    renderer.toneMappingExposure=light?1.20:1.13;draw();
  }
  setVisual(0,true);resize();setTheme(currentTheme);
  // The fallback remains visible while the setup task yields, including on
  // devices that need time to compile shaders for the first live frame.
  await yieldTask();
  // The supported parallel-compile extension lets shader compilation finish
  // without a synchronous wait inside the first paint of the live scene.
  if(renderer.extensions.has('KHR_parallel_shader_compile')&&typeof renderer.compileAsync==='function'){
    try{await renderer.compileAsync(scene,camera);}catch{/* render() retains the still if the program cannot compile */}
  }
  phaseStart=markPhase('programs',phaseStart);
  await yieldTask();readyForDraw=true;draw();markPhase('firstDraw',phaseStart);
  container.dataset.instrumentSetup=JSON.stringify(phase);maybeStart();

  return {
    setStage(index){chooseStage(index);},
    setPaused(value){
      paused=Boolean(value);container.dataset.paused=String(paused);
      // A Pause holds the last rendered pose exactly. Selecting a different
      // semantic stage while paused is still allowed through setStage().
      if(paused)stop();else maybeStart();
    },
    setTheme,
    getPickPoints,getProjectedBounds,
    dispose(){
      if(disposed)return;disposed=true;stop();cancelBounds();resizeObserver.disconnect();intersection.disconnect();
      reduced.removeEventListener('change',motionChange);document.removeEventListener('visibilitychange',visibilityChange);
      container.removeEventListener('pointerenter',pointerEnter);container.removeEventListener('pointermove',pointerMove);container.removeEventListener('pointerleave',pointerLeave);
      container.removeEventListener('click',click);setHover(-1);
      canvas.removeEventListener('webglcontextlost',lose);canvas.removeEventListener('webglcontextrestored',restore);
      const mats=new Set(),geometries=new Set(),textures=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material){for(const m of(Array.isArray(o.material)?o.material:[o.material])){mats.add(m);if(m.map)textures.add(m.map);}}});
      geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());mats.forEach(m=>m.dispose());environment?.dispose();renderer.dispose();canvas.remove();showPoster();
    }
  };
}

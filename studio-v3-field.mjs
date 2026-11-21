import * as THREE from './assets/three.module.js';

/* An engraved relief, not a simulated dataset. Heights, contours and the
   copper route all come from the same original, deterministic landscape. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
const v3=(x,y,z)=>new THREE.Vector3(x,y,z);

function hill(x,z,cx,cz,sx,sz,angle,height){
  const u=x-cx,v=z-cz,c=Math.cos(angle),s=Math.sin(angle);
  const p=(u*c+v*s)/sx,q=(-u*s+v*c)/sz;
  return height*Math.exp(-(p*p+q*q));
}
function routeZ(x){return .52+.70*Math.sin((x+.8)*.33)+.21*Math.sin(x*.77);}
function relief(x,z){
  const right=ease(-6,3,x),groove=z-routeZ(x);
  return .05
    +hill(x,z,6.4,-2.35,4.6,1.85,-.39,2.25)
    +hill(x,z,10.1,-4.7,2.7,1.72,.45,1.14)
    +hill(x,z,11.4,2.45,2.6,2.05,-.31,2.31)
    +hill(x,z,7.05,4.7,4.3,1.82,.24,1.72)
    +hill(x,z,1.2,6.15,5.2,1.75,-.08,.92)
    +hill(x,z,-6.9,6.8,4.6,1.2,.16,.31)
    +hill(x,z,-2,-4.8,4.9,1.25,-.12,.28)
    +right*(.095*Math.sin(.71*x+.67*Math.cos(.64*z))+.07*Math.sin(1.31*z+.38*x))
    -.40*right*Math.exp(-(groove*groove)/.79);
}

// Each chapter has its own topography, route and survey angle. Work retains
// the original east-facing ridgeline; Approach is a chain of three terraces;
// Contact is the quietest, most oblique view of a crescent-shaped basin.
function approachRoute(x){return -.58+1.10*Math.sin((x+3.8)*.29)+.25*Math.sin(x*.72);}
function approachRelief(x,z){
  const g=z-approachRoute(x);
  return .07
    +hill(x,z,-10.0,4.50,3.6,1.65,.23,1.35)
    +hill(x,z,-5.65,2.65,3.05,1.42,-.31,1.12)
    +hill(x,z,.55,-3.32,3.3,1.80,.27,1.65)
    +hill(x,z,5.30,-4.25,3.35,1.40,-.25,1.74)
    +hill(x,z,9.20,2.75,3.45,2.25,.30,2.12)
    +hill(x,z,12.2,4.65,2.25,1.48,-.40,.94)
    +.06*Math.sin(x*.63+z*.24)+.055*Math.sin(z*1.25-x*.34)
    -.29*Math.exp(-(g*g)/.70);
}
function contactRoute(x){
  const towardBasin=(x-6.4)/4.5;
  return .52+.34*Math.sin((x+1.4)*.31)-1.78*Math.exp(-towardBasin*towardBasin)+.18*Math.sin(x*.74);
}
function contactRelief(x,z){
  const px=(x-7.15)/4.9,pz=(z+1.45)/3.0,rad=Math.hypot(px,pz);
  const crescent=(.73+.27*Math.cos(Math.atan2(pz,px)+.78))*Math.exp(-((rad-.91)*(rad-.91))/.086);
  const g=z-contactRoute(x),right=ease(-5.8,4,x);
  return .04
    +1.96*crescent
    +hill(x,z,11.6,-4.9,2.5,1.6,-.2,1.24)
    +hill(x,z,12.25,3.5,2.6,2.2,.3,.93)
    +hill(x,z,4.1,5.6,4.8,1.45,-.1,.55)
    +hill(x,z,-4.9,6.2,4.8,1.5,.24,.31)
    +right*(.07*Math.sin(x*.83+z*.62)+.045*Math.sin(z*1.32))
    -.33*right*Math.exp(-(g*g)/.65);
}
const landscapes={
  work:{id:0,relief,route:routeZ,contour:.145,waypoints:[.60,.76,.90],speed:.115,opacity:1,trace:1,
    camera:{x:2.25,y:11.65,z:18.6,lookY:.36,lookZ:.1,narrowFocus:5.4,width:24.5,scale:8.55,narrowWidth:12.2,pointerX:1.25,pointerY:.80},poster:'contour-field-poster.svg'},
  approach:{id:1,relief:approachRelief,route:approachRoute,contour:.153,waypoints:[.24,.51,.78],speed:.132,opacity:.93,trace:.93,
    camera:{x:1.05,y:14.1,z:18.2,lookY:.3,lookZ:.22,narrowFocus:2.3,width:25.2,scale:8.8,narrowWidth:12.6,pointerX:1.05,pointerY:.70},poster:'contour-field-approach.svg'},
  contact:{id:2,relief:contactRelief,route:contactRoute,contour:.127,waypoints:[.52,.73,.92],speed:.096,opacity:.92,trace:1.03,
    camera:{x:4.35,y:9.70,z:20.2,lookY:.39,lookZ:-.50,narrowFocus:5.8,width:25.8,scale:9.0,narrowWidth:12.8,pointerX:1.10,pointerY:.67},poster:'contour-field-contact.svg'}
};
// Chapter mounts share a learned, session-local rendering budget. A device
// that has already adapted the work terrain does not repeat the same slow
// high-resolution warm-up when the next chapter enters view.
const learnedQuality={wide:null,compact:null};

const rippleGLSL=`
  uniform vec2 uRippleOrigin;
  uniform float uRippleAge;
  float rippleDistance(vec2 p){return length(p-uRippleOrigin);}
  float wave(vec2 p){
    // Ripple is an explicit, short-lived interaction. Skip its expensive
    // distance/exponential work during the normal idle animation.
    if(uRippleAge>=2.20)return 0.0;
    float d=rippleDistance(p)-uRippleAge*4.4;
    return exp(-d*d/1.18)*sin(d*6.0)*exp(-uRippleAge*.86)*.16;
  }
  float waveFront(vec2 p){
    if(uRippleAge>=2.20)return 0.0;
    float d=rippleDistance(p)-uRippleAge*4.4;
    return exp(-d*d/.038)*exp(-uRippleAge*.55);
  }
`;
const terrainVertex=`
  varying vec3 vGround;
  varying vec3 vNormal;
  varying float vHeight;
  ${rippleGLSL}
  void main(){
    vec3 p=position;
    vGround=position;vNormal=normal;
    p.y+=wave(position.xz);
    vHeight=p.y;
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
  }
`;
const screenMaskGLSL=`
  uniform vec2 uResolution;
  uniform float uVariant;
  vec2 screenUV(){return gl_FragCoord.xy/max(uResolution,vec2(1.0));}
  float screenCoverage(vec2 s){
    float right=smoothstep(.24,.78,s.x);
    float lower=1.0-smoothstep(.16,.96,s.y);
    float edge=smoothstep(0.0,.10,s.y)*(1.0-smoothstep(.91,1.0,s.y));
    if(uVariant<.5)return (.09+.66*right+.16*lower)*edge;
    if(uVariant<1.5){
      float edgeTerrace=1.0-smoothstep(.10,.47,s.x);
      float surveyRight=smoothstep(.39,.94,s.x);
      return (.065+.42*surveyRight+.15*lower+.18*edgeTerrace*lower)*edge;
    }
    float basinRight=smoothstep(.31,.82,s.x);
    return (.035+.70*basinRight+.14*lower*basinRight)*edge;
  }
`;
const terrainFragment=`
  varying vec3 vGround;
  varying vec3 vNormal;
  varying float vHeight;
  uniform vec3 uDepth,uSurface,uCrest,uInk,uCopper,uHighlight;
  uniform float uOpacity,uDark,uContourStep;
  ${rippleGLSL}
  ${screenMaskGLSL}
  float lineAt(float t,float aa,float width){
    float d=abs(fract(t+.5)-.5);
    // Narrow incised marks; the gradient-derived width keeps the contours
    // coherent across zoom and device pixel ratio rather than shimmering.
    return 1.0-smoothstep(width,width+min(aa*.82,.23),d);
  }
  void main(){
    vec2 s=screenUV();
    vec3 n=normalize(vNormal);
    vec3 key=normalize(vec3(-.71,.69,.42));
    float lit=clamp(dot(n,key)*.79+.36,0.0,1.0);
    float slope=1.0-clamp(n.y,0.0,1.0);
    float h=clamp((vHeight+.40)/3.0,0.0,1.0);
    vec3 stone=mix(uDepth,uSurface,smoothstep(.17,.92,lit));
    stone=mix(stone,uCrest,h*.19+lit*.085);
    // Grain-free laminae and a highlight-shade pair suggest carved paper
    // / stone relief instead of a fluorescent digital wireframe.
    // All three carved marks share the same screen-space derivative.
    float heightBand=vHeight/uContourStep;
    float aa=max(fwidth(heightBand),.002);
    float fine=lineAt(heightBand,aa,.016);
    float cut=lineAt(heightBand+.014/uContourStep,aa,.012);
    float major=lineAt(heightBand*.2,max(aa*.2,.002),.015);
    float horizon=step(.02,vHeight+.3);
    float groove=(fine*.57+major*.22)*(0.78+.22*slope)*horizon;
    stone=mix(stone,uInk,groove);
    stone=mix(stone,uHighlight,cut*.18*(1.0-fine));
    stone=mix(stone,uCopper,major*.13);
    float rim=waveFront(vGround.xz);
    stone=mix(stone,uCopper,rim*.82);
    float landEdge=(1.-smoothstep(13.1,15.,abs(vGround.x)))*(1.-smoothstep(7.0,8.5,abs(vGround.z)));
    float coverage=screenCoverage(s)*landEdge*uOpacity;
    coverage=max(coverage, rim*.48*landEdge);
    gl_FragColor=vec4(stone,coverage);
    #include <colorspace_fragment>
  }
`;
const traceVertex=`
  varying float vTravel;
  varying vec3 vGround;
  varying float vTraceRim;
  ${rippleGLSL}
  void main(){
    vTravel=uv.x;vGround=position;
    vTraceRim=max(0.0,normalize(normalMatrix*normal).z);
    vec3 p=position;p.y+=wave(p.xz);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
  }
`;
const traceFragment=`
  varying float vTravel;
  varying vec3 vGround;
  varying float vTraceRim;
  uniform vec3 uCopper,uSignal;
  uniform float uTime,uOpacity,uTravelSpeed;
  uniform vec3 uWaypoints;
  ${screenMaskGLSL}
  void main(){
    float p=mod(uTime*uTravelSpeed,1.29)-.145;
    float delta=p-vTravel;
    float head=exp(-delta*delta/.00075);
    float trail=exp(-max(delta,0.)*14.5)*step(0.,delta)*(1.-smoothstep(.17,.37,delta));
    float edge=smoothstep(0.,.035,vTravel)*(1.-smoothstep(.965,1.,vTravel));
    vec2 s=screenUV();
    float coverage=screenCoverage(s);
    float a0=(vTravel-uWaypoints.x)/.007,a1=(vTravel-uWaypoints.y)/.007,a2=(vTravel-uWaypoints.z)/.007;
    float waypoint=max(exp(-a0*a0),max(exp(-a1*a1),exp(-a2*a2)));
    vec3 c=mix(uCopper,uSignal,clamp(head*.92+trail*.41+waypoint*.16,0.,1.));
    // Soften the tube silhouette rather than asking the entire framebuffer
    // for MSAA. This keeps the copper line calm at low adaptive resolutions.
    float softRim=smoothstep(.025,.57,vTraceRim);
    float a=edge*coverage*uOpacity*clamp(.67+head*.70+trail*.44,0.,1.)*softRim;
    gl_FragColor=vec4(c,a);
    #include <colorspace_fragment>
  }
`;

const palettes={
  light:{depth:'#85694e',surface:'#cab393',crest:'#f4e4c9',ink:'#75583b',copper:'#a8663c',highlight:'#fff1d8',signal:'#f5c17a',opacity:.94,traceOpacity:1.10},
  dark:{depth:'#141d24',surface:'#405159',crest:'#69767a',ink:'#969894',copper:'#c9905c',highlight:'#afb6b3',signal:'#ffbc73',opacity:.94,traceOpacity:1.12},
};

function makeField(landscape,compact){
  const scene=new THREE.Scene();
  const geometry=new THREE.PlaneGeometry(30,17,compact?126:174,compact?72:98);geometry.rotateX(-Math.PI/2);
  const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++)positions.setY(i,landscape.relief(positions.getX(i),positions.getZ(i)));
  positions.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere();
  const uniforms={
    uResolution:{value:new THREE.Vector2(1,1)},uRippleOrigin:{value:new THREE.Vector2(5,.6)},uRippleAge:{value:8},
    uDepth:{value:new THREE.Color()},uSurface:{value:new THREE.Color()},uCrest:{value:new THREE.Color()},uInk:{value:new THREE.Color()},
    uCopper:{value:new THREE.Color()},uHighlight:{value:new THREE.Color()},uOpacity:{value:.84},uDark:{value:0},
    uVariant:{value:landscape.id},uContourStep:{value:landscape.contour},
  };
  const mat=new THREE.ShaderMaterial({uniforms,vertexShader:terrainVertex,fragmentShader:terrainFragment,transparent:true,depthWrite:true,side:THREE.FrontSide,toneMapped:false,extensions:{derivatives:true}});
  const terrain=new THREE.Mesh(geometry,mat);terrain.frustumCulled=false;terrain.renderOrder=0;scene.add(terrain);
  const routePoints=[];
  for(let i=0;i<=142;i++){
    const x=-13.8+i/142*27.3,z=landscape.route(x);
    routePoints.push(v3(x,landscape.relief(x,z)+.058,z));
  }
  const path=new THREE.CatmullRomCurve3(routePoints,false,'centripetal');
  const traceGeometry=new THREE.TubeGeometry(path,compact?180:220,.034,compact?5:7,false);
  const traceUniforms={
    uResolution:uniforms.uResolution,uRippleOrigin:uniforms.uRippleOrigin,uRippleAge:uniforms.uRippleAge,
    uCopper:{value:new THREE.Color()},uSignal:{value:new THREE.Color()},uTime:{value:5.4},uOpacity:{value:1},
    uVariant:uniforms.uVariant,uTravelSpeed:{value:landscape.speed},uWaypoints:{value:new THREE.Vector3(...landscape.waypoints)},
  };
  const traceMaterial=new THREE.ShaderMaterial({uniforms:traceUniforms,vertexShader:traceVertex,fragmentShader:traceFragment,transparent:true,depthWrite:false,toneMapped:false});
  const trace=new THREE.Mesh(traceGeometry,traceMaterial);trace.renderOrder=1;scene.add(trace);
  return {scene,terrain,geometry,mat,uniforms,trace,traceGeometry,traceMaterial,traceUniforms};
}

function findPoster(container,landscape){
  let img=container.querySelector('img.contour-poster,img.contour-field-poster,img.field-poster,img[data-field-poster]');
  if(!img){
    img=document.createElement('img');img.className='contour-poster';img.alt='';
    img.src=new URL('./assets/'+landscape.poster,import.meta.url).href;
    Object.assign(img.style,{position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'});container.append(img);
  }
  img.hidden=false;return img;
}

export function mountContourField(container,{theme='light',interactionRoot=container,variant='work',initialPaused=false}={}){
  if(!container)return null;
  const name=Object.hasOwn(landscapes,variant)?variant:'work',landscape=landscapes[name];
  const poster=findPoster(container,landscape),reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection=navigator.connection;
  const themeFor=value=>name==='contact'||value==='dark'||value==='night'?'dark':'light';
  let currentTheme=themeFor(theme);
  let disposed=false,failed=false,contextOK=true,paused=Boolean(initialPaused),inView=false,ready=false;
  let renderer=null,art=null,camera=null,canvas=null,firstDraw=false,rect=null,rectDirty=true,shaderFailed=false;
  let frame=0,last=0,nextDue=0,elapsed=name==='contact'?6.8:5.4,rippleAge=8,frameCount=0,pulseCount=0,frameInterval=1000/60;
  let pointerX=0,pointerY=0,xNow=0,yNow=0,focusX=0,baseHeight=9.0,baseWidth=25.0,pointerChanged=false;
  let compact=false,qualityIndex=0,qualityList=[],renderWidth=0,renderHeight=0,renderDpr=0;
  let sampleSpan=0,sampleCount=0,sampleCost=0,slowWindows=0,fastWindows=0,warmUntil=0;
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
  const dataset=container.dataset;
  dataset.renderer='static';dataset.paused=String(paused);dataset.fieldState='offscreen';dataset.fieldVariant=name;
  dataset.fieldFrame='0';dataset.fieldPulse='0';dataset.fieldPointer='0,0';dataset.fieldRippling='false';
  dataset.fieldBaseFps='0';dataset.fieldTargetFps='0';dataset.fieldDpr='0';dataset.fieldQuality='0';dataset.fieldMeasuredFps='0';
  let io=null,ro=null;
  const interactions=interactionRoot||container;
  const interactive='a,button,input,textarea,select,summary,label,details,[role="button"],[role="link"],[role="slider"],[contenteditable],[data-no-field],[data-field-control]';

  const renderAllowed=()=>ready&&contextOK&&!disposed&&inView&&!document.hidden&&!paused&&!reduce.matches&&!connection?.saveData;
  const updateState=()=>{
    let state=disposed||failed||!contextOK?'static':reduce.matches||connection?.saveData?'reduced':paused?'paused':document.hidden?'hidden':!inView?'offscreen':ready?'running':'static';
    dataset.fieldState=state;dataset.paused=String(paused);
  };
  const updatePalette=()=>{
    dataset.theme=currentTheme;poster.style.colorScheme=currentTheme;
    if(!art)return;
    const p=palettes[currentTheme];
    for(const [key,name] of [['depth','uDepth'],['surface','uSurface'],['crest','uCrest'],['ink','uInk'],['copper','uCopper'],['highlight','uHighlight']])art.uniforms[name].value.set(p[key]);
    art.uniforms.uOpacity.value=p.opacity*landscape.opacity;art.uniforms.uDark.value=currentTheme==='dark'?1:0;
    art.traceUniforms.uCopper.value.set(p.copper);art.traceUniforms.uSignal.value.set(p.signal);art.traceUniforms.uOpacity.value=p.traceOpacity*landscape.trace;
  };
  const placeCamera=()=>{
    if(!camera)return;
    const c=landscape.camera;
    camera.position.set(focusX+c.x+xNow*c.pointerX,c.y+yNow*c.pointerY,c.z);
    camera.lookAt(focusX+xNow*.26,c.lookY,c.lookZ+yNow*.26);
  };
  const draw=()=>{
    if(!ready||!contextOK||disposed||!rect||rect.width<2||rect.height<2||!inView||document.hidden||reduce.matches||connection?.saveData)return null;
    const renderStarted=performance.now();
    try{renderer.render(art.scene,camera);}catch{shaderFailed=true;}
    // Three reports shader compilation failure through its diagnostic hook;
    // never hide the vector poster merely because render() returned.
    if(shaderFailed){failed=true;ready=false;stop();poster.hidden=false;poster.style.display='';canvas?.remove();dataset.renderer='static';dataset.fieldRippling='false';updateState();return null;}
    dataset.fieldFrame=String(++frameCount);
    if(!firstDraw){firstDraw=true;poster.hidden=true;poster.style.display='none';canvas.style.visibility='';dataset.renderer='webgl';}
    return performance.now()-renderStarted;
  };
  // The first tier targets the physical display rate, with a bounded pixel
  // budget. Only sustained missed frame deadlines reduce the quality, in
  // order to avoid quality oscillation after a single long browser task.
  const qualityOptions=(w,h,small)=>{
    const device=Math.max(.5,window.devicePixelRatio||1);
    const limit=small?1050000:2200000;
    const maxArea=Math.sqrt(limit/Math.max(1,w*h));
    const requested=small?[[40,1.15],[40,.96],[30,.82],[30,.70],[30,.57],[30,.46]]:[[60,1.35],[60,1.0],[45,.87],[45,.73],[30,.61],[30,.50],[30,.42]];
    const unique=[];
    for(const [fps,cap] of requested){
      const dpr=Math.max(.35,Math.min(device,cap,maxArea));
      if(!unique.some(item=>item.fps===fps&&Math.abs(item.dpr-dpr)<.015))unique.push({fps,dpr});
    }
    return unique;
  };
  const resetSamples=(warm=650)=>{
    sampleSpan=sampleCount=sampleCost=slowWindows=fastWindows=0;
    warmUntil=performance.now()+warm;
  };
  const rememberQuality=()=>{
    const q=qualityList[qualityIndex];
    if(q)learnedQuality[compact?'compact':'wide']={fps:q.fps,pixels:renderWidth*renderHeight*q.dpr*q.dpr};
  };
  const applyQuality=(index,w,h)=>{
    if(!renderer||!art||!qualityList.length)return;
    qualityIndex=clamp(index,0,qualityList.length-1);
    const q=qualityList[qualityIndex];
    frameInterval=1000/q.fps;
    dataset.fieldTargetFps=String(q.fps);dataset.fieldDpr=q.dpr.toFixed(2);dataset.fieldQuality=String(qualityIndex);
    if(Math.abs(renderDpr-q.dpr)>.005||renderWidth!==w||renderHeight!==h){
      if(Math.abs(renderDpr-q.dpr)>.005)renderer.setPixelRatio(q.dpr);
      renderer.setSize(w,h,false);renderer.getDrawingBufferSize(art.uniforms.uResolution.value);
      renderDpr=q.dpr;renderWidth=w;renderHeight=h;
    }
  };
  const samplePerformance=(now,gap,cost)=>{
    if(!Number.isFinite(cost)||gap<=0||now<warmUntil)return;
    sampleSpan+=gap;sampleCost+=cost;sampleCount++;
    if(sampleSpan<1150||sampleCount<6)return;
    const meanGap=sampleSpan/sampleCount,meanCost=sampleCost/sampleCount,measured=1000/meanGap;
    dataset.fieldMeasuredFps=measured.toFixed(1);
    const slow=meanGap>frameInterval*1.32+.7||meanCost>frameInterval*.83;
    const severe=meanGap>frameInterval*1.68||meanCost>frameInterval*1.23;
    const smooth=meanGap<frameInterval*1.16+.8&&meanCost<frameInterval*.58;
    slowWindows=slow?slowWindows+1:0;fastWindows=smooth?fastWindows+1:0;
    sampleSpan=sampleCount=sampleCost=0;
    if((slowWindows>=2||severe)&&qualityIndex<qualityList.length-1){
      const verySlow=measured<qualityList[qualityIndex].fps*.48;
      applyQuality(qualityIndex+(verySlow?2:1),renderWidth,renderHeight);rememberQuality();resetSamples(760);nextDue=now+frameInterval;
    }else if(fastWindows>=6&&qualityIndex>0){
      applyQuality(qualityIndex-1,renderWidth,renderHeight);rememberQuality();resetSamples(950);nextDue=now+frameInterval;
    }
  };
  const updateRect=()=>{
    rect=container.getBoundingClientRect();rectDirty=false;
    if(!ready||rect.width<2||rect.height<2||!inView||document.hidden)return;
    const w=Math.round(rect.width),h=Math.round(rect.height),a=w/h;
    // The narrower portrait focuses each chapter's own subject. Desktop
    // retains the full panoramic composition and a quieter writing area.
    const c=landscape.camera,small=w<640;
    const narrow=clamp((1.95-a)/1.12,0,1);
    focusX=c.narrowFocus*narrow;
    baseWidth=Math.max(c.narrowWidth,a*c.scale,c.width*(1-narrow)+c.narrowWidth*narrow);
    baseHeight=baseWidth/a;
    camera.left=-baseWidth/2;camera.right=baseWidth/2;camera.top=baseHeight/2;camera.bottom=-baseHeight/2;camera.updateProjectionMatrix();
    const resized=renderWidth!==w||renderHeight!==h||!qualityList.length||small!==compact;
    if(resized){
      const seed=!qualityList.length||small!==compact;
      if(small!==compact)qualityIndex=0;
      compact=small;qualityList=qualityOptions(w,h,small);dataset.fieldBaseFps=String(small?40:60);
      if(seed){
        const learned=learnedQuality[small?'compact':'wide'];
        if(learned){
          const inherited=qualityList.findIndex(q=>q.fps<=learned.fps&&w*h*q.dpr*q.dpr<=learned.pixels*1.22);
          qualityIndex=inherited<0?qualityList.length-1:inherited;
        }
      }
      applyQuality(qualityIndex,w,h);resetSamples();
    }
    placeCamera();if(contextOK&&!paused)draw();
  };
  const tick=now=>{
    frame=0;if(!renderAllowed()){updateState();return;}
    if(!last){last=now;nextDue=now;}
    // Carry fractional deadlines forward on 60/90/120 Hz screens instead of
    // rounding to whole rAF intervals. Camera damping uses actual elapsed time.
    if(now+.9>=nextDue){
      const gap=Math.max(0,now-last),dt=Math.min(gap/1000,.26);
      last=now;const late=Math.max(0,now-nextDue);
      nextDue=now+frameInterval-Math.min(frameInterval*.68,late);
      elapsed+=dt;rippleAge=Math.min(8,rippleAge+dt);
      if(rippleAge>=2.20&&dataset.fieldRippling==='true')dataset.fieldRippling='false';
      const factor=1-Math.exp(-dt*5.65);xNow+=(pointerX-xNow)*factor;yNow+=(pointerY-yNow)*factor;
      if(Math.abs(xNow-pointerX)<.0001)xNow=pointerX;if(Math.abs(yNow-pointerY)<.0001)yNow=pointerY;
      if(pointerChanged){dataset.fieldPointer=`${pointerX.toFixed(3)},${pointerY.toFixed(3)}`;pointerChanged=false;}
      art.uniforms.uRippleAge.value=rippleAge;art.traceUniforms.uTime.value=elapsed;placeCamera();const cost=draw();
      if(cost!==null)samplePerformance(now,gap,cost);
    }
    if(renderAllowed())frame=requestAnimationFrame(tick);
  };
  const stop=()=>{if(frame)cancelAnimationFrame(frame);frame=0;last=nextDue=0;};
  const maybeRun=()=>{
    updateState();if(renderAllowed()){if(!frame){last=nextDue=0;resetSamples();frame=requestAnimationFrame(tick);}}else stop();
  };
  const lose=e=>{e.preventDefault();contextOK=false;stop();poster.hidden=false;poster.style.display='';if(canvas)canvas.style.visibility='hidden';dataset.renderer='static';dataset.fieldRippling='false';updateState();};
  const restore=()=>{if(disposed)return;contextOK=true;firstDraw=false;canvas.style.visibility='';updateRect();maybeRun();};
  const init=()=>{
    if(ready||failed||disposed||paused||!inView||document.hidden||reduce.matches||connection?.saveData){updateState();return;}
    try{
      const small=(rect?.width||innerWidth)<640;
      // The engraved lines already use shader derivative antialiasing.
      // Avoid costly default-framebuffer MSAA on this transparent backdrop.
      renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:small?'low-power':'high-performance',preserveDrawingBuffer:false});
      renderer.debug.onShaderError=()=>{shaderFailed=true;};
      renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0,0);
      canvas=renderer.domElement;canvas.className='contour-canvas';canvas.setAttribute('aria-hidden','true');
      Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',display:'block',pointerEvents:'none'});
      camera=new THREE.OrthographicCamera(-12,12,5,-5,.1,85);art=makeField(landscape,small);
      canvas.addEventListener('webglcontextlost',lose);canvas.addEventListener('webglcontextrestored',restore);
      container.append(canvas);ready=true;updatePalette();updateRect();maybeRun();
    }catch{
      failed=true;ready=false;renderer?.dispose();canvas?.remove();poster.hidden=false;poster.style.display='';dataset.renderer='static';updateState();
    }
  };
  const blocked=e=>{
    const node=e?.target;
    return node instanceof Element&&Boolean(node.closest(interactive));
  };
  const normalizedPoint=(clientX,clientY,refresh=false)=>{
    if(refresh||rectDirty||!rect){rect=container.getBoundingClientRect();rectDirty=false;}
    if(!rect.width||!rect.height||clientX<rect.left||clientX>rect.right||clientY<rect.top||clientY>rect.bottom)return null;
    return {x:clamp((clientX-rect.left)/rect.width,0,1),y:clamp((clientY-rect.top)/rect.height,0,1)};
  };
  const move=e=>{
    if(e.pointerType==='touch'||blocked(e)||!renderAllowed())return;
    // Scroll only invalidates the cached bounds. Pointer movement therefore
    // needs no layout read until a scroll or resize has changed geometry.
    const p=normalizedPoint(e.clientX,e.clientY);if(!p)return;
    pointerX=(p.x-.5)*2;pointerY=(p.y-.5)*2;pointerChanged=true;
  };
  const leave=()=>{pointerX=pointerY=0;pointerChanged=true;dataset.fieldPointer='0,0';};
  const enter=()=>{rect=container.getBoundingClientRect();rectDirty=false;};
  const invalidateRect=()=>{rectDirty=true;};
  const pulse=(point,y)=>{
    if(disposed||paused||reduce.matches||connection?.saveData||!inView||document.hidden)return false;
    init();if(!ready||!contextOK)return false;
    let p=null;
    if(typeof point==='number'&&typeof y==='number')p=normalizedPoint(point,y,true);
    else if(point&&Number.isFinite(point.clientX)&&Number.isFinite(point.clientY))p=normalizedPoint(point.clientX,point.clientY,true);
    else if(point&&Number.isFinite(point.x)&&Number.isFinite(point.y))p={x:clamp(point.x,0,1),y:clamp(point.y,0,1)};
    else p={x:.69,y:.60}; // same unobscured centre-right point for keyboard controls
    if(!p)return false;
    ndc.set(p.x*2-1,1-p.y*2);camera.updateMatrixWorld();ray.setFromCamera(ndc,camera);
    const hit=ray.intersectObject(art.terrain,false)[0];
    const centre=hit?.point||v3(focusX+3.7,0,landscape.route(focusX+3.7));
    art.uniforms.uRippleOrigin.value.set(centre.x,centre.z);rippleAge=0;art.uniforms.uRippleAge.value=0;
    dataset.fieldPulse=String(++pulseCount);dataset.fieldRippling='true';draw();maybeRun();return true;
  };
  const click=e=>{if(!blocked(e)&&e.button===0&&normalizedPoint(e.clientX,e.clientY,true))pulse(e);};
  const vis=()=>{if(!document.hidden&&inView){init();if(ready){updateRect();maybeRun();}}else maybeRun();};
  const preference=()=>{
    if(reduce.matches||connection?.saveData){
      rippleAge=8;dataset.fieldRippling='false';pointerX=pointerY=xNow=yNow=0;firstDraw=false;stop();
      if(art)art.uniforms.uRippleAge.value=8;
      poster.hidden=false;poster.style.display='';if(canvas)canvas.style.visibility='hidden';dataset.renderer='static';updateState();return;
    }
    if(inView){init();if(ready)updateRect();}maybeRun();
  };
  const measured=container.getBoundingClientRect();rect=measured;rectDirty=false;
  inView=measured.bottom>0&&measured.top<innerHeight&&measured.right>0&&measured.left<innerWidth;
  io=new IntersectionObserver(entries=>{const was=inView;inView=Boolean(entries[0]?.isIntersecting);rectDirty=true;if(inView){init();if(ready&&!was)updateRect();}maybeRun();},{threshold:.015});io.observe(container);
  ro=new ResizeObserver(()=>{updateRect();if(inView)init();});ro.observe(container);
  document.addEventListener('visibilitychange',vis);reduce.addEventListener('change',preference);connection?.addEventListener?.('change',preference);
  window.addEventListener('scroll',invalidateRect,{capture:true,passive:true});
  interactions.addEventListener('pointerenter',enter,{passive:true});interactions.addEventListener('pointermove',move,{passive:true});interactions.addEventListener('pointerleave',leave,{passive:true});interactions.addEventListener('click',click,{passive:true});
  updatePalette();init();maybeRun();
  return {
    setTheme(value){if(disposed)return;currentTheme=themeFor(value);updatePalette();if(ready&&inView&&!document.hidden)draw();},
    setPaused(value){paused=Boolean(value);if(!paused&&inView)init();maybeRun();},pulse,
    dispose(){
      if(disposed)return;disposed=true;stop();io?.disconnect();ro?.disconnect();document.removeEventListener('visibilitychange',vis);window.removeEventListener('scroll',invalidateRect,true);
      reduce.removeEventListener('change',preference);connection?.removeEventListener?.('change',preference);
      interactions.removeEventListener('pointerenter',enter);interactions.removeEventListener('pointermove',move);interactions.removeEventListener('pointerleave',leave);interactions.removeEventListener('click',click);
      canvas?.removeEventListener('webglcontextlost',lose);canvas?.removeEventListener('webglcontextrestored',restore);
      if(art){art.geometry.dispose();art.mat.dispose();art.traceGeometry.dispose();art.traceMaterial.dispose();}
      renderer?.dispose();canvas?.remove();poster.hidden=false;poster.style.display='';dataset.renderer='static';dataset.fieldRippling='false';updateState();
    }
  };
}

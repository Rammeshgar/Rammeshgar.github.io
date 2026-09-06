export function applyPapercutFinish(mesh){
 if(/glass|lence|mouth_cavity/i.test(mesh.name))return;
 const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
 const isSkin=/new_head/i.test(mesh.name),isBody=/^body$/i.test(mesh.name),isHair=/^hair/i.test(mesh.name);
 const strength=isSkin?.19:isBody?.23:.17;
 const palette=isSkin?`diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.16,.82,.66),.48);diffuseColor.rgb+=vec3(.018,.006,0.);`:isBody?`float ivoryMask=smoothstep(.52,.88,paperLuma);vec3 midnightCloth=diffuseColor.rgb*vec3(.72,.91,1.08);vec3 warmIvory=diffuseColor.rgb*vec3(1.16,.82,.66);diffuseColor.rgb=mix(midnightCloth,warmIvory,ivoryMask*.82);`:isHair?`diffuseColor.rgb*=vec3(.68,.80,1.);`:'';
 for(const material of materials){
  if(!material?.isMeshStandardMaterial)continue;
  material.roughness=Math.max(material.roughness??0,isHair?.98:isSkin?.90:isBody?.92:.88);material.metalness=Math.min(material.metalness??0,.02);material.envMapIntensity=Math.min(material.envMapIntensity??1,isHair?.18:isSkin?.30:.42);material.flatShading=true;
  material.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vPaperPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvPaperPosition=position;');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>\nvarying vec3 vPaperPosition;float paperHash(vec3 p){p=fract(p*.3183099+vec3(.17,.31,.53));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}float paperNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(paperHash(i),paperHash(i+vec3(1,0,0)),f.x),mix(paperHash(i+vec3(0,1,0)),paperHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(paperHash(i+vec3(0,0,1)),paperHash(i+vec3(1,0,1)),f.x),mix(paperHash(i+vec3(0,1,1)),paperHash(i+vec3(1,1,1)),f.x),f.y),f.z);}`).replace('#include <color_fragment>',`#include <color_fragment>\nfloat paperBroad=paperNoise(vPaperPosition*18.),paperFiber=paperNoise(vPaperPosition*115.),paperGrain=mix(paperBroad,paperFiber,.42),paperValue=mix(.88,1.08,paperGrain),paperLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(vec3(paperLuma),diffuseColor.rgb,1.12);diffuseColor.rgb*=mix(1.,paperValue,${strength.toFixed(3)});diffuseColor.rgb*=vec3(1.018,1.,.965);${palette}`);
  };
  material.customProgramCacheKey=()=>`papercut-v2-${strength}`;material.needsUpdate=true;
 }
}

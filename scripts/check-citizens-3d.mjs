import assert from 'node:assert/strict';
import { footPose, solveLimb, roadPose, HIP_HEIGHT, LEG_LENGTH, ANKLE_HEIGHT, ROUTE_LENGTH } from '../public/trials/citizens-3d/gait.mjs';
import { CITIZENS, createCitizen, poseCitizen } from '../public/trials/citizens-3d/character.mjs';
import { Vector3 } from '../public/trials/citizens-3d/vendor/three.module.min.js';

const near=(a,b,epsilon=1e-7)=>assert.ok(Math.abs(a-b)<epsilon,`${a} != ${b}`);
for(let i=1;i<57;i++){
 const p=i/100,step=.0001,stride=1.02;
 const a=footPose(p,stride),b=footPose(p+step,stride);
 assert.equal(a.planted,true);near(a.lift,0);near(a.z+p*stride,b.z+(p+step)*stride);
}
console.log('PASS: feet stay fixed in world space throughout straight-road contact.');
for(let i=0;i<1000;i++){
 const p=i/1000,f=footPose(p),hip=HIP_HEIGHT+.017*Math.cos(p*Math.PI*4);
 const solution=solveLimb(hip-ANKLE_HEIGHT-f.lift,f.z,LEG_LENGTH,LEG_LENGTH);
 const y=hip-LEG_LENGTH*Math.cos(solution.upper)-LEG_LENGTH*Math.cos(solution.upper+solution.lower);
 const z=-LEG_LENGTH*Math.sin(solution.upper)-LEG_LENGTH*Math.sin(solution.upper+solution.lower);
 near(y,ANKLE_HEIGHT+f.lift);near(z,f.z);assert.ok(f.lift>=0);
}
console.log('PASS: knee and ankle poses reach the intended contact and swing positions.');
for(let d=0;d<ROUTE_LENGTH;d+=.01){
 const a=roadPose(d),b=roadPose(d+.0001),c=roadPose(d+ROUTE_LENGTH);
 near(a.x,c.x);near(a.z,c.z);
 near((b.x-a.x)/.0001,Math.sin(a.yaw),.00005);
 near((b.z-a.z)/.0001,Math.cos(a.yaw),.00005);
}
console.log('PASS: road circuit closes continuously and citizens face their travel direction.');
for(const spec of CITIZENS){
 const c=createCitizen(spec);assert.equal(c.tunic.isSkinnedMesh,true);assert.equal(c.skeleton.bones.length,17);
 for(const activity of ['walk','carry','idle'])for(let i=0;i<24;i++){
  poseCitizen(c,i/24,activity,i/24);
  c.root.traverse(object=>assert.ok(object.matrixWorld.elements.every(Number.isFinite)));
  assert.equal(c.basket.visible,activity==='carry');
  for(let side=0;side<2;side++){
   const ankle=c.legs[side].ankle.getWorldPosition(new Vector3());
   const target=activity==='idle'?0:footPose(i/24+side*.5,spec.stride/spec.scale).lift;
   near(ankle.y,(ANKLE_HEIGHT+target)*spec.scale,1e-6);
  }
 }
}
console.log('PASS: all six actual 3D rigs have valid skinning and grounded feet in walk/carry/idle poses.');

import assert from 'node:assert/strict';
import { createBuildings } from '../public/trials/citizens-3d/buildings.mjs';
import { Box3 } from '../public/trials/citizens-3d/vendor/three.module.min.js';
import { roadPose, TURN_RADIUS, TAU } from '../public/trials/citizens-3d/gait.mjs';

const groundHeight=-.13,town=createBuildings(groundHeight);
town.animate(0);
assert.deepEqual(new Set(town.buildings.map(b=>b.kind)),new Set(['house','forum','market','workshop','well','garden','bath','theater']));
assert.equal(town.buildings.length,10);
for(const b of town.buildings){
 const bounds=new Box3().setFromObject(b.root);
 assert.ok(Math.abs(bounds.min.y-groundHeight)<1e-6,`${b.name}: foundation must meet the terrain, got ${bounds.min.y}`);
 assert.ok(bounds.max.y-bounds.min.y>1.5,`${b.name} must be a volumetric model`);
 b.root.traverse(o=>{
  assert.ok(o.matrixWorld.elements.every(Number.isFinite),`${b.name}: invalid transform`);
  if(o.geometry){for(const attr of Object.values(o.geometry.attributes))assert.ok(attr.array.every(Number.isFinite),`${b.name}: invalid geometry`);}
 });
}
console.log('PASS: all eight building types exist as finite 3D models, with every foundation touching the terrain.');

function snapshot(root){
 const result=[];
 root.traverse(o=>{
  result.push(...o.position.toArray(),...o.rotation.toArray().slice(0,3),...o.scale.toArray());
  if(o.material?.opacity!==undefined)result.push(o.material.opacity);
  if(o.material?.uniforms?.time)result.push(o.material.uniforms.time.value);
  if(o.userData.dynamic&&o.geometry?.attributes.position)result.push(...o.geometry.attributes.position.array);
 });return result;
}
town.animate(.7);const early=town.buildings.map(b=>snapshot(b.root));
town.animate(.7);town.buildings.forEach((b,i)=>assert.deepEqual(snapshot(b.root),early[i],`${b.name}: repeated time must freeze animation`));
town.animate(3.3);town.buildings.forEach((b,i)=>assert.notDeepEqual(snapshot(b.root),early[i],`${b.name}: building has no visible animation`));
town.animate(.7);town.buildings.forEach((b,i)=>assert.deepEqual(snapshot(b.root),early[i],`${b.name}: animation is not deterministic`));
console.log('PASS: every building animates, repeated timestamps freeze motion, and seeking reproduces the same pose.');

const length=28.8*2+TAU*TURN_RADIUS;
for(let d=0;d<length;d+=.05){
 const p=roadPose(d,28.8),loop=roadPose(d+length,28.8);
 assert.ok(Math.hypot(p.x-loop.x,p.z-loop.z)<1e-8);
 for(const b of town.buildings){
  const inside=Math.abs(p.x-b.x)<b.w/2+.26&&Math.abs(p.z-b.z)<b.d/2+.26;
  assert.equal(inside,false,`Citizen route enters ${b.name}`);
 }
}
for(let i=0;i<town.buildings.length;i++)for(let j=i+1;j<town.buildings.length;j++){
 const a=town.buildings[i],b=town.buildings[j];
 assert.ok(Math.abs(a.x-b.x)>=(a.w+b.w)/2||Math.abs(a.z-b.z)>=(a.d+b.d)/2,`${a.name} overlaps ${b.name}`);
}
console.log('PASS: building lots are separate and the extended citizen route stays clear of every building.');

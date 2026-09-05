import * as THREE from './vendor/three.module.min.js';
import { TAU, HIP_HEIGHT, LEG_LENGTH, ANKLE_HEIGHT, footPose, solveLimb } from './gait.mjs';

export const CITIZENS = [
 { name: 'Lucius', cloth: '#ba673b', trim: '#f6d894', skin: '#d8a17d', hair: '#493022', hairStyle: 'crop', scale: 1, stride: 1.02 },
 { name: 'Livia', cloth: '#547e78', trim: '#c9e0c3', skin: '#bd805d', hair: '#30241f', hairStyle: 'bun', scale: .96, stride: .98 },
 { name: 'Titus', cloth: '#eee0bd', trim: '#985344', skin: '#ae704a', hair: '#3a2924', hairStyle: 'curl', scale: 1.04, stride: 1.06, beard: true },
 { name: 'Claudia', cloth: '#856082', trim: '#eed89e', skin: '#e5b594', hair: '#75503a', hairStyle: 'bun', scale: .98, stride: 1.00 },
 { name: 'Felix', cloth: '#b59945', trim: '#f5e3bb', skin: '#875039', hair: '#211d1b', hairStyle: 'curl', scale: 1.02, stride: 1.04 },
 { name: 'Aelia', cloth: '#758157', trim: '#e9cb96', skin: '#cd9166', hair: '#59382b', hairStyle: 'crop', scale: .94, stride: .96 },
];

const sphere = new THREE.SphereGeometry(1, 20, 14);
const smallSphere = new THREE.SphereGeometry(1, 12, 8);
const leather = new THREE.MeshStandardMaterial({ color: '#634533', roughness: .94 });
const sole = new THREE.MeshStandardMaterial({ color: '#46372a', roughness: 1 });
const gold = new THREE.MeshStandardMaterial({ color: '#d8b468', roughness: .48, metalness: .35 });
const ivory = new THREE.MeshStandardMaterial({ color: '#fff2db', roughness: .9 });
const eyeMaterial = new THREE.MeshStandardMaterial({ color: '#272820', roughness: .46 });
const basketMaterial = new THREE.MeshStandardMaterial({ color: '#ad7a42', roughness: 1 });
const basketRimMaterial = new THREE.MeshStandardMaterial({ color: '#d3a469', roughness: .97 });
const appleMaterial = new THREE.MeshStandardMaterial({ color: '#a74931', roughness: .75 });
const leafMaterial = new THREE.MeshStandardMaterial({ color: '#648251', roughness: .93 });

function mesh(parent, geometry, material, position = [0, 0, 0], scale = [1, 1, 1]) {
 const m = new THREE.Mesh(geometry, material); m.position.set(...position); m.scale.set(...scale);
 m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function ellipsoid(parent, material, position, scale, detail = true) {
 return mesh(parent, detail ? sphere : smallSphere, material, position, scale);
}
function tapered(length, top, bottom, segments = 16) {
 const points = [[.001, 0], [top * .72, -.008], [top, -.035], [top * .97, -length * .20],
  [bottom * 1.08, -length * .70], [bottom, -length + .025], [bottom * .65, -length], [.001, -length - .008]];
 return new THREE.LatheGeometry(points.reverse().map(([r, y]) => new THREE.Vector2(r, y)), segments);
}
function curve(parent, points, radius, material) {
 return mesh(parent, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 16, radius, 6, false), material);
}
function bone(parent, name, position) { const b = new THREE.Bone(); b.name = name; b.position.set(...position); parent.add(b); return b; }

function garment(skeleton, bones, material, trimMaterial) {
 const rings = [[.69,.345,.24],[.72,.347,.242],[.89,.31,.225],[1.08,.27,.185],[1.14,.262,.178],
  [1.30,.30,.195],[1.46,.34,.205],[1.51,.335,.20],[1.56,.22,.16]];
 const positions = [], normals = [], indices = [], weights = [], joints = [], groups = [], segments = 40;
 rings.forEach(([y,rx,rz], ring) => {
  for(let i=0;i<=segments;i++) {
   const a=i/segments*TAU, pleat=(Math.cos(a*12)+.25*Math.cos(a*24))*.009*(1.6-y);
   positions.push(Math.cos(a)*(rx+pleat),y,Math.sin(a)*(rz+pleat));
   normals.push(Math.cos(a),0,Math.sin(a));
   const spineWeight = Math.max(0,Math.min(1,(y-1.08)/.28));
   const chestWeight = Math.max(0,Math.min(1,(y-1.36)/.19));
   joints.push(bones.indexOf(skeleton.bones[0]),1,2,0);
   weights.push(1-spineWeight,spineWeight*(1-chestWeight),spineWeight*chestWeight,0);
   if(ring<rings.length-1&&i<segments){
    const a0=ring*(segments+1)+i,b0=a0+segments+1,start=indices.length;
    indices.push(a0,b0,a0+1,b0,b0+1,a0+1);
    // Woven borders and two narrow Roman clavi are actual material regions on the mesh.
    const front=Math.sin((i+.5)/segments*TAU)>.55;
    const stripe=front&&(i===7||i===12);
    groups.push([start,6,ring===0||ring===7||stripe?1:0]);
   }
  }
 });
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setIndex(indices);
 geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(joints,4));geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 // Consolidate adjacent regions, keeping the tunic to a handful of draw calls.
 for(const [start,count,index] of groups){const last=geo.groups.at(-1);if(last&&last.materialIndex===index&&last.start+last.count===start)last.count+=count;else geo.addGroup(start,count,index);}
 geo.computeVertexNormals();
 const tunic=new THREE.SkinnedMesh(geo,[material,trimMaterial]);tunic.castShadow=true;tunic.receiveShadow=true;tunic.frustumCulled=false;
 return tunic;
}

function createBasket() {
 const group=new THREE.Group();
 const body=mesh(group,new THREE.CylinderGeometry(.255,.20,.26,24,1,true),basketMaterial,[0,0,0]);
 body.material.side=THREE.DoubleSide;
 for(let i=0;i<8;i++){
  const y=-.115+i*.032,r=.203+(y+.13)/.26*.052;
  const ring=mesh(group,new THREE.TorusGeometry(r,.007,5,32),basketRimMaterial,[0,y,0]);ring.rotation.x=Math.PI/2;
 }
 for(let i=0;i<18;i++){
  const a=i/18*TAU;
  curve(group,[[Math.sin(a)*.205,-.13,Math.cos(a)*.205],[Math.sin(a)*.232,0,Math.cos(a)*.232],[Math.sin(a)*.255,.13,Math.cos(a)*.255]],.005,basketRimMaterial);
 }
 const rim=mesh(group,new THREE.TorusGeometry(.256,.017,7,32),basketRimMaterial,[0,.13,0]);rim.rotation.x=Math.PI/2;
 for(let i=0;i<7;i++){
  const a=i*2.399,r=i? .15:0;
  ellipsoid(group,appleMaterial,[Math.cos(a)*r,.10+((i%3)*.018),Math.sin(a)*r],[.073,.068,.07],false);
  ellipsoid(group,leafMaterial,[Math.cos(a)*r+.02,.172+((i%3)*.018),Math.sin(a)*r],[.035,.009,.015],false);
 }
 return group;
}

export function createCitizen(spec) {
 const root=new THREE.Group();root.name=spec.name;
 const skin=new THREE.MeshStandardMaterial({color:spec.skin,roughness:.83});
 const cloth=new THREE.MeshStandardMaterial({color:spec.cloth,roughness:.96,side:THREE.DoubleSide});
 const trim=new THREE.MeshStandardMaterial({color:spec.trim,roughness:.96,side:THREE.DoubleSide});
 const hair=new THREE.MeshStandardMaterial({color:spec.hair,roughness:.96});
 const blush=new THREE.MeshStandardMaterial({color:new THREE.Color(spec.skin).multiplyScalar(.89),roughness:1});
 const hips=bone(root,'hips',[0,HIP_HEIGHT,0]);
 const spine=bone(hips,'spine',[0,.22,0]);
 const chest=bone(spine,'chest',[0,.30,0]);
 const neck=bone(chest,'neck',[0,.10,0]);
 const head=bone(neck,'head',[0,.26,.005]);
 const legs=[];
 for(const side of [-1,1]){
  const hip=bone(hips,`hip${side}`,[side*.165,0,0]);
  const knee=bone(hip,`knee${side}`,[0,-LEG_LENGTH,0]);
  const ankle=bone(knee,`ankle${side}`,[0,-LEG_LENGTH,0]);
  mesh(hip,tapered(LEG_LENGTH,.119,.079),skin);
  ellipsoid(knee,skin,[0,0,0],[.08,.09,.081]);
  mesh(knee,tapered(LEG_LENGTH,.077,.054),skin);
  ellipsoid(ankle,skin,[0,-.02,.055],[.069,.064,.135]);
  ellipsoid(ankle,sole,[0,-.072,.068],[.083,.027,.158]);
  // Sandals have a heel strap, a toe strap and two crossing leather bands.
  ellipsoid(ankle,leather,[0,-.008,.139],[.077,.037,.023]);
  ellipsoid(ankle,leather,[0,.005,-.040],[.071,.030,.016]);
  for(const side of [-1,1]){
   const strap=ellipsoid(ankle,leather,[side*.026,.014,.067],[.015,.018,.082]);strap.rotation.y=side*.50;
  }
  legs.push({hip,knee,ankle,side});
 }
 const arms=[];
 for(const side of [-1,1]){
  const shoulder=bone(chest,`shoulder${side}`,[side*.34,.025,0]);
  const elbow=bone(shoulder,`elbow${side}`,[0,-.30,0]);
  const hand=bone(elbow,`hand${side}`,[0,-.28,0]);
  mesh(shoulder,tapered(.30,.109,.066),skin);
  mesh(shoulder,tapered(.17,.139,.123),cloth);
  const cuff=mesh(shoulder,new THREE.CylinderGeometry(.125,.125,.028,20),trim,[0,-.159,0]);
  ellipsoid(elbow,skin,[0,0,0],[.067,.071,.069]);
  mesh(elbow,tapered(.28,.068,.046),skin);
  ellipsoid(hand,skin,[0,-.043,.012],[.054,.076,.048]);
  ellipsoid(hand,skin,[-side*.041,-.024,.03],[.022,.039,.025]);
  arms.push({shoulder,elbow,hand,side,cuff});
 }
 ellipsoid(neck,skin,[0,.014,0],[.104,.16,.097]);
 // A deliberately sculpted silhouette: broad cheeks, a softer jaw and a rounded cranium.
 ellipsoid(head,skin,[0,.015,0],[.284,.324,.253]);
 ellipsoid(head,skin,[0,-.115,.039],[.236,.203,.225]);
 for(const side of [-1,1]){
  ellipsoid(head,skin,[side*.276,-.012,.004],[.059,.094,.052]);
  ellipsoid(head,blush,[side*.301,-.013,.036],[.023,.052,.012]);
  const eye=ellipsoid(head,ivory,[side*.104,.033,.235],[.052,.063,.025]);eye.rotation.y=side*.12;
  ellipsoid(head,eyeMaterial,[side*.102,.029,.258],[.026,.035,.013]);
  ellipsoid(head,ivory,[side*.095,.043,.268],[.008,.011,.006],false);
  curve(head,[[side*.158,.116,.221],[side*.109,.134,.245],[side*.062,.125,.245]],.014,hair);
  ellipsoid(head,blush,[side*.165,-.074,.225],[.043,.017,.012]);
 }
 ellipsoid(head,skin,[0,-.015,.260],[.051,.066,.070]);
 curve(head,[[-.054,-.133,.251],[0,-.148,.266],[.054,-.131,.251]],.009,blush);
 const cap=mesh(head,new THREE.SphereGeometry(1,24,16,0,TAU,0,Math.PI*.51),hair,[0,.050,-.006],[.305,.335,.278]);
 cap.rotation.x=-.10;
 if(spec.hairStyle==='bun'){
  ellipsoid(head,hair,[0,-.04,-.19],[.282,.245,.145]);
  ellipsoid(head,hair,[0,.09,-.302],[.135,.127,.121]);
  for(let i=0;i<6;i++){
   const tuft=ellipsoid(head,hair,[-.22+i*.075,.202,.163],[.083,.10,.064]);tuft.rotation.z=-.4;
  }
 } else {
  for(let i=0;i<7;i++){
   const x=-.224+i*.074;
   const tuft=ellipsoid(head,hair,[x,.211-.05*Math.abs(x)/.224,.181],[.074,.095,.075]);tuft.rotation.z=.35;
  }
  if(spec.hairStyle==='curl')for(let i=0;i<10;i++){
   const a=i/10*TAU;ellipsoid(head,hair,[Math.cos(a)*.19,.289,Math.sin(a)*.18],[.098,.083,.09],false);
  }
 }
 if(spec.beard){
  ellipsoid(head,hair,[0,-.202,.116],[.212,.097,.16]);
  for(const side of [-1,1])ellipsoid(head,hair,[side*.168,-.141,.177],[.056,.105,.059]);
 }
 const bones=[hips,spine,chest,neck,head,...legs.flatMap(x=>[x.hip,x.knee,x.ankle]),...arms.flatMap(x=>[x.shoulder,x.elbow,x.hand])];
 root.updateMatrixWorld(true);
 const skeleton=new THREE.Skeleton(bones);
 const tunic=garment(skeleton,bones,cloth,trim);root.add(tunic);tunic.bind(skeleton);
 const belt=mesh(spine,new THREE.CylinderGeometry(.283,.290,.066,32,1,true),leather,[0,-.033,0],[1,1,.76]);
 mesh(spine,new THREE.BoxGeometry(.075,.075,.024),gold,[0,-.033,.224]);
 const pin=ellipsoid(chest,gold,[-.24,.019,.192],[.037,.037,.016]);
 const basket=createBasket();basket.position.set(0,-.27,.44);chest.add(basket);basket.visible=false;
 root.scale.setScalar(spec.scale);
 return {root,spec,hips,spine,chest,head,legs,arms,tunic,skeleton,basket,belt,pin};
}

export function poseCitizen(citizen, phase, activity='walk', time=0) {
 const {hips,spine,chest,head,legs,arms,basket,spec}=citizen;
 const walking=activity!=='idle',carrying=activity==='carry';
 const bob=walking?.017*Math.cos(phase*TAU*2):.006*Math.sin(time*1.7);
 hips.position.y=HIP_HEIGHT+bob;
 hips.rotation.y=0;
 spine.rotation.set(carrying?.065:walking?.025:0,walking?-.060*Math.sin(phase*TAU):0,walking?.015*Math.cos(phase*TAU):0);
 chest.rotation.y=walking?-.025*Math.sin(phase*TAU):.025*Math.sin(time*.6);
 head.rotation.set(0,walking?.02*Math.sin(phase*TAU):.10*Math.sin(time*.45),walking?.012*Math.sin(phase*TAU):0);
 for(let i=0;i<2;i++){
  const leg=legs[i],foot=walking?footPose(phase+i*.5,spec.stride/spec.scale):{z:0,lift:0,pitch:0};
  const angle=solveLimb(HIP_HEIGHT+bob-ANKLE_HEIGHT-foot.lift,foot.z,LEG_LENGTH,LEG_LENGTH);
  leg.hip.rotation.x=angle.upper;leg.knee.rotation.x=angle.lower;
  leg.ankle.rotation.x=-angle.upper-angle.lower+foot.pitch;
  const arm=arms[i];
  if(carrying){
   const reach=solveLimb(.30,.42,.30,.28,-1);
   arm.shoulder.rotation.set(reach.upper,0,-arm.side*.13);arm.elbow.rotation.x=reach.lower;
  } else {
   arm.shoulder.rotation.set(walking?.34*Math.cos((phase+i*.5)*TAU):.035,0,arm.side*.07);
   arm.elbow.rotation.x=-.18-(walking?.10*(1-Math.sin((phase+i*.5)*TAU)):0);
  }
 }
 basket.visible=carrying;
 citizen.root.updateMatrixWorld(true);
}

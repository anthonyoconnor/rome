import * as THREE from './vendor/three.module.min.js';
import { CITIZENS, createCitizen, poseCitizen } from './character.mjs';
import { ROAD_HEIGHT, TURN_RADIUS, TAU, roadPose } from './gait.mjs';
import { createBuildings } from './buildings.mjs';

const STREET_LENGTH=28.8,ROUTE_LENGTH=STREET_LENGTH*2+TAU*TURN_RADIUS;

const canvas=document.querySelector('#scene');
const inspector=document.querySelector('.citizen-panel'),inspectorToggle=document.querySelector('#inspector-toggle');
function collapseInspector(collapse){inspector.classList.toggle('collapsed',collapse);inspectorToggle.setAttribute('aria-expanded',String(!collapse));}
collapseInspector(innerWidth<=760);
inspectorToggle.addEventListener('click',()=>collapseInspector(!inspector.classList.contains('collapsed')));
const scene=new THREE.Scene();scene.background=new THREE.Color('#939d79');
const camera=new THREE.OrthographicCamera(-15,15,10,-10,.1,120);
const look=new THREE.Vector3(0,.4,0),pan=new THREE.Vector3(),offset=new THREE.Vector3(32,26.1,32);
const cameraRadius=offset.length(),isoYaw=Math.PI/4,isoTilt=Math.atan2(26.1,Math.hypot(32,32));
const orbit={yaw:isoYaw,tilt:isoTilt,mode:'rotate'};
function setCameraAngle(yaw,tilt){
 orbit.yaw=((yaw%TAU)+TAU)%TAU;orbit.tilt=Math.max(Math.PI/18,Math.min(Math.PI*4/9,tilt));
 document.querySelector('#camera-angle').textContent=`Tilt ${Math.round(orbit.tilt*180/Math.PI)}°`;
}
const state={time:0,buildingTime:0,buildingMotion:true,paused:false,speed:1,activity:'walk',view:'street',focus:'building',selectedBuilding:0,selected:0,zoom:1,travel:0};
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});}
catch(error){document.querySelector('#loading').hidden=true;const note=document.querySelector('#error');note.hidden=false;note.textContent='The 3D preview needs WebGL. Enable hardware acceleration in your browser, then reload this page.';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
const ambient=new THREE.HemisphereLight('#fff2d5','#607058',2.4);scene.add(ambient);
const sun=new THREE.DirectionalLight('#fff2d1',3.1);sun.position.set(-14,25,15);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-26;sun.shadow.camera.right=26;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;
sun.shadow.camera.near=.5;sun.shadow.camera.far=70;sun.shadow.normalBias=.025;sun.shadow.bias=-.00008;sun.shadow.radius=3;scene.add(sun);

const ground=new THREE.Mesh(new THREE.PlaneGeometry(250,250),new THREE.MeshStandardMaterial({color:'#939d79',roughness:1}));
ground.rotation.x=-Math.PI/2;ground.position.y=-.13;ground.receiveShadow=true;scene.add(ground);

function shape(width,depth,radius){
 const s=new THREE.Shape(),x=-width/2,y=-depth/2,r=radius;
 s.moveTo(x+r,y);s.lineTo(x+width-r,y);s.quadraticCurveTo(x+width,y,x+width,y+r);
 s.lineTo(x+width,y+depth-r);s.quadraticCurveTo(x+width,y+depth,x+width-r,y+depth);
 s.lineTo(x+r,y+depth);s.quadraticCurveTo(x,y+depth,x,y+depth-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
 return s;
}
function stoneGeometry(width,depth,height,bevel=.035,radius=.035){
 const g=new THREE.ExtrudeGeometry(shape(width-2*bevel,depth-2*bevel,radius),{depth:height-2*bevel,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:3});
 g.rotateX(-Math.PI/2);g.translate(0,bevel,0);return g;
}
const road=new THREE.Group();scene.add(road);
const foundation=new THREE.Mesh(stoneGeometry(34.8,5,.18,.055,.22),new THREE.MeshStandardMaterial({color:'#9a977f',roughness:1}));
foundation.position.y=-.12;foundation.receiveShadow=true;foundation.castShadow=true;road.add(foundation);
const stoneMaterial=new THREE.MeshStandardMaterial({color:'#c9c1a7',roughness:.94});
const stoneGeo=stoneGeometry(.76,.53,.12,.027,.025);
const cells=[];
for(let row=0;row<8;row++)for(let col=0;col<43;col++){
 const x=(col-21)*.78+(row%2?.19:-.19),z=(row-3.5)*.55;
 cells.push([x,z,row,col]);
}
const paving=new THREE.InstancedMesh(stoneGeo,stoneMaterial,cells.length);
const dummy=new THREE.Object3D(),color=new THREE.Color();
const random=(a,b)=>{const r=Math.sin(a*127.1+b*311.7)*43758.5453;return r-Math.floor(r);};
cells.forEach(([x,z,row,col],i)=>{
 dummy.position.set(x,0,z);dummy.rotation.set(0,(random(row,col)-.5)*.055,0);dummy.scale.set(.97+random(row+2,col)*.05,1,.97+random(row+8,col)*.05);dummy.updateMatrix();paving.setMatrixAt(i,dummy.matrix);
 color.set('#d0c5aa').multiplyScalar(.86+random(row+7,col)*.22);paving.setColorAt(i,color);
});paving.receiveShadow=true;paving.castShadow=true;road.add(paving);
const curbGeo=stoneGeometry(.80,.24,.18,.025,.025),curbs=new THREE.InstancedMesh(curbGeo,stoneMaterial,86);
let ci=0;for(const sign of [-1,1])for(let i=0;i<43;i++){
 dummy.position.set((i-21)*.80,-.015,sign*2.34);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();curbs.setMatrixAt(ci,dummy.matrix);curbs.setColorAt(ci++,new THREE.Color('#d8d0b4').multiplyScalar(.90+random(i,sign)*.13));
}curbs.castShadow=true;curbs.receiveShadow=true;road.add(curbs);

const town=createBuildings();
for(const building of town.buildings){
 scene.add(building.root);
 const nearEdge=building.z-Math.sign(building.z)*building.d/2;
 const length=Math.max(.35,Math.abs(nearEdge)-2.32);
 const path=new THREE.Mesh(stoneGeometry(1.5,length,.12,.025,.03),stoneMaterial);
 path.position.set(building.x,0,Math.sign(building.z)*(2.32+length/2));path.receiveShadow=true;scene.add(path);
}
const buildingOutline=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1,.035,1)),new THREE.LineBasicMaterial({color:'#f4e3a4',transparent:true,opacity:.85}));scene.add(buildingOutline);

const citizens=CITIZENS.map((spec,index)=>{const citizen=createCitizen(spec);citizen.routeOffset=ROUTE_LENGTH*index/CITIZENS.length+2.2;scene.add(citizen.root);return citizen;});
const ring=new THREE.Mesh(new THREE.RingGeometry(.42,.445,48),new THREE.MeshBasicMaterial({color:'#faf0b5',transparent:true,opacity:.88,depthWrite:false,side:THREE.DoubleSide}));
ring.rotation.x=-Math.PI/2;ring.position.y=ROAD_HEIGHT+.006;scene.add(ring);

const citizenList=document.querySelector('#citizen-list');
citizens.forEach((c,index)=>{
 const button=document.createElement('button');button.type='button';button.setAttribute('aria-pressed',String(index===state.selected));button.setAttribute('aria-label',`Follow ${c.spec.name}`);
 const swatch=document.createElement('span');swatch.className='swatch';swatch.style.setProperty('--cloth',c.spec.cloth);swatch.style.setProperty('--skin',c.spec.skin);swatch.style.setProperty('--hair',c.spec.hair);swatch.setAttribute('aria-hidden','true');
 button.append(swatch,document.createTextNode(c.spec.name));button.addEventListener('click',()=>selectCitizen(index,true));citizenList.append(button);
});
function selectCitizen(index,follow=false){
 state.focus='citizen';state.selected=index;document.querySelector('#selected-name').textContent=citizens[index].spec.name;
 document.querySelector('#selection-detail').textContent='A jointed 3D citizen. Try walking, carrying or standing.';
 document.querySelector('#activity-status').textContent={walk:'Walking',carry:'Carrying produce',idle:'Standing'}[state.activity];
 citizenList.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
 setSubject('citizens',false);
 if(follow){setView('close');if(innerWidth<=760)collapseInspector(true);}
}
const buildingList=document.querySelector('#building-list');
town.buildings.forEach((building,index)=>{
 const button=document.createElement('button');button.type='button';button.setAttribute('aria-pressed',String(index===0));button.setAttribute('aria-label','Inspect '+building.name);
 const swatch=document.createElement('span');swatch.className='building-swatch';swatch.style.background=building.color;swatch.setAttribute('aria-hidden','true');
 button.append(swatch,document.createTextNode(building.name));button.addEventListener('click',()=>selectBuilding(index,true));buildingList.append(button);
});
function selectBuilding(index,close=false){
 state.focus='building';state.selectedBuilding=index;const building=town.buildings[index];
 document.querySelector('#selected-name').textContent=building.name;document.querySelector('#activity-status').textContent=state.buildingMotion?'Animated':'Motion paused';document.querySelector('#selection-detail').textContent=building.motion;
 buildingList.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
 setSubject('buildings',false);if(close){setView('close');if(innerWidth<=760)collapseInspector(true);}
}
function setSubject(subject,select=true){
 document.querySelector('#building-list').hidden=subject!=='buildings';citizenList.hidden=subject!=='citizens';
 document.querySelectorAll('[data-subject]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.subject===subject)));
 if(select){if(subject==='buildings')selectBuilding(state.selectedBuilding);else selectCitizen(state.selected);if(state.view==='close')setView('close');}
}
function setView(view){state.view=view;state.zoom=1;pan.set(0,0,0);document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));document.querySelector('#view-label').textContent={street:'Town overview',close:state.focus==='building'?town.buildings[state.selectedBuilding].name:'Following '+citizens[state.selected].spec.name,game:'Game scale'}[view];}
document.querySelectorAll('[data-subject]').forEach(b=>b.addEventListener('click',()=>setSubject(b.dataset.subject)));
document.querySelector('#building-motion').addEventListener('change',e=>{state.buildingMotion=e.target.checked;if(state.focus==='building')document.querySelector('#activity-status').textContent=state.buildingMotion?'Animated':'Motion paused';});
selectBuilding(0);
function setPaused(paused){state.paused=paused;document.querySelector('#play-icon').textContent=paused?'▶':'Ⅱ';document.querySelector('#play-label').textContent=paused?'Play':'Pause';document.querySelector('#pause').setAttribute('aria-label',paused?'Play animation':'Pause animation');}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.querySelectorAll('[data-activity]').forEach(b=>b.addEventListener('click',()=>{
 state.activity=b.dataset.activity;document.querySelectorAll('[data-activity]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
 if(state.focus==='citizen')document.querySelector('#activity-status').textContent={walk:'Walking',carry:'Carrying produce',idle:'Standing'}[state.activity];
}));
document.querySelector('#pause').addEventListener('click',()=>setPaused(!state.paused));
document.querySelector('#step').addEventListener('click',()=>{setPaused(true);advance(1/30);});
document.querySelector('#speed').addEventListener('change',e=>state.speed=Number(e.target.value));
document.querySelector('#reset').addEventListener('click',()=>{setView('street');setCameraAngle(isoYaw,isoTilt);});
document.querySelectorAll('[data-camera-mode]').forEach(button=>button.addEventListener('click',()=>{
 orbit.mode=button.dataset.cameraMode;
 document.querySelectorAll('[data-camera-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 document.querySelector('#drag-hint').textContent=orbit.mode==='rotate'?'Drag to rotate & tilt':'Drag to pan';
}));
document.querySelector('#isometric').addEventListener('click',()=>setCameraAngle(isoYaw,isoTilt));
document.querySelector('#overhead').addEventListener('click',()=>setCameraAngle(0,Math.PI*4/9));
setCameraAngle(isoYaw,isoTilt);
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!['INPUT','SELECT','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();setPaused(!state.paused);}});

let drag=null;
canvas.addEventListener('pointerdown',e=>{
 if(drag||e.button>2)return;
 drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false,select:e.button===0&&!e.shiftKey,mode:e.button!==0||e.shiftKey?'pan':orbit.mode};
 canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 drag.moved ||= Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>=5;
 if(drag.moved){
  if(drag.mode==='rotate')setCameraAngle(orbit.yaw-dx*.007,orbit.tilt+dy*.005);
  else{
   // Project screen movement onto the ground at the current camera angle.
   const units=(camera.right-camera.left)/canvas.clientWidth/camera.zoom;
   const rightX=Math.cos(orbit.yaw),rightZ=-Math.sin(orbit.yaw),depth=dy*units/Math.sin(orbit.tilt);
   pan.x-=dx*units*rightX;pan.z-=dx*units*rightZ;
   pan.x-=depth*Math.sin(orbit.yaw);pan.z-=depth*Math.cos(orbit.yaw);
  }
 }
 drag.x=e.clientX;drag.y=e.clientY;
});
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
canvas.addEventListener('pointerup',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 if(drag.select&&!drag.moved&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<5){
  const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects([...citizens.map(c=>c.root),...town.buildings.filter(b=>b.root.visible).map(b=>b.root)],true);
  const hit=hits.find(h=>!(h.object.material?.transparent&&h.object.material.opacity<.4));
  if(hit){let target=hit.object;while(target.parent&&target.parent!==scene)target=target.parent;const index=citizens.findIndex(c=>c.root===target);if(index>=0)selectCitizen(index,true);else{const building=town.buildings.findIndex(b=>b.root===target);if(building>=0)selectBuilding(building,true);}}
 }
 drag=null;
 if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
});
for(const event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(drag?.id===e.pointerId)drag=null;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{e.preventDefault();state.zoom=Math.max(.55,Math.min(2.7,state.zoom*Math.exp(-e.deltaY*.001)));},{passive:false});
function resize(){renderer.setSize(canvas.clientWidth,canvas.clientHeight,false);}
window.addEventListener('resize',resize);resize();
function advance(dt){state.time+=dt;if(state.buildingMotion)state.buildingTime+=dt;if(state.activity!=='idle')state.travel+=dt*1.10;}
const desired=new THREE.Vector3();
let last=performance.now(),first=true;
function draw(now){
 const dt=document.hidden?0:Math.min(.05,(now-last)/1000);last=now;
 if(!state.paused)advance(dt*state.speed);
 for(const citizen of citizens){
  const distance=state.travel+citizen.routeOffset,position=roadPose(distance,STREET_LENGTH);
  citizen.root.position.set(position.x,ROAD_HEIGHT,position.z);citizen.root.rotation.y=position.yaw;
  poseCitizen(citizen,distance/citizen.spec.stride,state.activity,state.time);
 }
 town.animate(state.buildingTime);
 for(let index=0;index<town.buildings.length;index++)town.buildings[index].root.visible=state.view!=='close'||(state.focus==='building'&&index===state.selectedBuilding);
 const selected=citizens[state.selected],building=town.buildings[state.selectedBuilding];ring.visible=state.focus==='citizen';ring.position.x=selected.root.position.x;ring.position.z=selected.root.position.z;
 buildingOutline.visible=state.focus==='building';buildingOutline.position.set(building.x,.25,building.z);buildingOutline.scale.set(building.w,1,building.d);
 desired.copy(state.view==='close'?(state.focus==='building'?building.root.position:selected.root.position):new THREE.Vector3(.6,0,0));desired.y=state.view==='close'?(state.focus==='building'?building.focusHeight-(innerWidth<=760?.5:.25):1.10):.8;
 desired.add(pan);
 const aspect=canvas.clientWidth/canvas.clientHeight;
 const viewHeight=state.view==='close'?(state.focus==='building'?building.view:5.8):state.view==='game'?canvas.clientHeight*2.15/36:Math.max(25,46/aspect);
 if(state.view!=='close'){
  const margin=Math.min(2.8,1.8/aspect)*Math.SQRT2;
  desired.x-=margin*Math.cos(orbit.yaw);desired.z+=margin*Math.sin(orbit.yaw);
 }
 if(first)look.copy(desired);else look.lerp(desired,1-Math.exp(-dt*10));
 camera.left=-viewHeight*aspect/2;camera.right=viewHeight*aspect/2;camera.top=viewHeight/2;camera.bottom=-viewHeight/2;
 offset.set(Math.sin(orbit.yaw)*Math.cos(orbit.tilt),Math.sin(orbit.tilt),Math.cos(orbit.yaw)*Math.cos(orbit.tilt)).multiplyScalar(cameraRadius);
 camera.zoom=state.zoom;camera.position.copy(look).add(offset);camera.lookAt(look);camera.updateProjectionMatrix();
 renderer.render(scene,camera);
 if(first){first=false;document.querySelector('#loading').hidden=true;document.documentElement.dataset.ready='true';}
 requestAnimationFrame(draw);
}
document.addEventListener('visibilitychange',()=>last=performance.now());
requestAnimationFrame(draw);

import * as THREE from './vendor/three.module.min.js';

const TAU=Math.PI*2;
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.9,...extra});
const M={plaster:mat('#e6d8b4'),cream:mat('#f1e4c5'),stone:mat('#c5bea4'),edge:mat('#ded1ad'),
 roof:mat('#b95834'),roofLight:mat('#d07846'),roofDark:mat('#95432b'),wood:mat('#6d4d33'),darkWood:mat('#483626'),
 opening:mat('#393e32'),teal:mat('#4d827c'),red:mat('#a94737'),linen:mat('#fff0cc'),gold:mat('#b99348',{metalness:.32,roughness:.5}),
 leaf:mat('#73814d'),leafLight:mat('#899557'),leafDark:mat('#526b43'),earth:mat('#7c6748'),pot:mat('#b97245'),
 metal:mat('#454b45',{metalness:.5}),grape:mat('#7a527a'),apple:mat('#a94e35'),green:mat('#8c9b47')};
const boxGeo=new THREE.BoxGeometry(1,1,1),ballGeo=new THREE.SphereGeometry(1,12,9);
const animations=[];
function mesh(parent,geometry,material,pos=[0,0,0],scale=[1,1,1]){
 const o=new THREE.Mesh(geometry,material);o.position.set(...pos);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
}
function box(parent,material,pos,size){return mesh(parent,boxGeo,material,pos,size);}
function ball(parent,material,pos,size){return mesh(parent,ballGeo,material,pos,size);}
function cylinder(parent,r1,r2,height,material,pos,segments=20){return mesh(parent,new THREE.CylinderGeometry(r1,r2,height,segments),material,pos);}
function dynamic(object){object.userData.dynamic=true;return object;}
function group(parent,pos=[0,0,0]){const g=new THREE.Group();g.position.set(...pos);parent.add(g);return g;}
function tube(parent,points,radius,material){return mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),20,radius,6,false),material);}
function archShape(w,h){const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h-w/2);s.absarc(0,h-w/2,w/2,0,Math.PI,false);s.lineTo(-w/2,0);return s;}
function arch(parent,x,y,z,w,h,material=M.opening,depth=.07){return mesh(parent,new THREE.ExtrudeGeometry(archShape(w,h),{depth,bevelEnabled:false,curveSegments:12}),material,[x,y,z]);}
function doorway(parent,x,z,h=2.25,w=1.05){
 arch(parent,x,.17,z,w+.23,h+.13,M.edge,.10);arch(parent,x,.18,z+.105,w,h,M.darkWood,.025);
 for(let i=0;i<5;i++)box(parent,M.wood,[x-w/2+.12+i*w/5,.95,z+.138],[.023,1.50,.014]);
 ball(parent,M.gold,[x+w*.28,1.13,z+.19],[.036,.036,.027]);
 box(parent,M.edge,[x,.14,z+.20],[w+.40,.20,.52]);
}
function windowFrame(parent,x,y,z,w=.66,h=.84,shutters=false){
 arch(parent,x,y,z,w+.17,h+.10,M.edge,.06);arch(parent,x,y+.035,z+.07,w,h,M.opening,.015);
 box(parent,M.wood,[x,y+h*.48,z+.095],[.045,h-.04,.035]);box(parent,M.edge,[x,y-.035,z+.11],[w+.24,.12,.23]);
 if(shutters){
  for(const sign of [-1,1]){
   const hinge=dynamic(group(parent,[x+sign*w/2,y+h/2,z+.13]));
   box(hinge,M.teal,[sign*w*.25,0,0],[w*.46,h,.07]);
   for(let i=0;i<5;i++)box(hinge,M.darkWood,[sign*w*.25,(i-2)*h/6,.044],[w*.42,.024,.014]);
   animations.push(t=>hinge.rotation.y=sign*(.42+.09*Math.sin(t*.45+x)));
  }
 }
}
// Every facade is built facing its own outward normal, including animated details.
function wallFace(parent,x,z,yaw){const face=group(parent,[x,0,z]);face.rotation.y=yaw;return face;}
function wallBands(parent,w,d,h,base=.19){
 box(parent,M.stone,[0,base+.16,0],[w+.10,.28,d+.10]);
 box(parent,M.edge,[0,base+h-.12,0],[w+.13,.17,d+.13]);
 for(const x of [-1,1])for(const z of [-1,1])for(let row=0;row<Math.floor(h/.32);row++){
  const wide=row%2?.33:.46,narrow=row%2?.46:.33;
  box(parent,row%3?M.edge:M.stone,[x*(w/2-.11),base+.17+row*.32,z*(d/2-.11)],[wide,.22,narrow]);
 }
}
function vent(parent,x,y,z,w=.52,h=.44){
 box(parent,M.edge,[x,y,z+.04],[w+.18,h+.16,.10]);box(parent,M.opening,[x,y,z+.10],[w,h,.04]);
 for(let i=0;i<4;i++)box(parent,M.wood,[x,y+(i-1.5)*h/4,z+.135],[w-.07,.045,.045]);
}
function roundel(parent,x,y,z,r=.19){
 const frame=mesh(parent,new THREE.TorusGeometry(r,.045,6,20),M.edge,[x,y,z]);
 const inset=cylinder(parent,r-.025,r-.025,.035,M.teal,[x,y,z]);inset.rotation.x=Math.PI/2;
 box(parent,M.gold,[x,y,z+.025],[r*1.5,.035,.025]);box(parent,M.gold,[x,y,z+.025],[.035,r*1.5,.025]);
 return frame;
}
function crate(parent,x,y,z,size=.62){
 const c=group(parent,[x,y,z]);box(c,M.darkWood,[0,size/2,0],[size,size,size]);
 for(const sign of [-1,1])for(let i=0;i<4;i++){
  box(c,M.wood,[0,(i+.5)*size/4,sign*(size/2+.012)],[size+.03,size/4-.025,.045]);
  box(c,M.wood,[sign*(size/2+.012),(i+.5)*size/4,0],[.045,size/4-.025,size+.03]);
 }
 for(let i=0;i<4;i++)box(c,M.wood,[(i-1.5)*size/4,size+.014,0],[size/4-.018,.04,size+.03]);
 for(const sign of [-1,1]){const brace=box(c,M.edge,[0,size/2,sign*(size/2+.04)],[.05,size*1.22,.035]);brace.rotation.z=.68;}
 return c;
}
function barrel(parent,x,z,y=0,scale=1){
 const b=group(parent,[x,y,z]);b.scale.setScalar(scale);
 cylinder(b,.30,.30,.70,M.wood,[0,.35,0],14);
 for(const h of [.09,.58]){const band=mesh(b,new THREE.TorusGeometry(.307,.032,6,18),M.metal,[0,h,0]);band.rotation.x=Math.PI/2;}
 for(let i=0;i<5;i++)box(b,M.darkWood,[(i-2)*.105,.708,0],[.012,.016,Math.sqrt(Math.max(0,.09-((i-2)*.105)**2))*2]);
 return b;
}
function wallLamp(parent,x,y,z){
 box(parent,M.metal,[x,y+.15,z+.10],[.09,.36,.18]);box(parent,M.metal,[x,y+.27,z+.22],[.27,.07,.25]);
 box(parent,M.gold,[x,y+.07,z+.22],[.18,.27,.16]);
 for(const side of [-1,1])box(parent,M.metal,[x+side*.085,y+.07,z+.31],[.025,.28,.025]);
 box(parent,M.metal,[x,y-.10,z+.22],[.25,.06,.23]);
}
function roof(parent,w,d,y,rise=1.15){
 const hw=w/2,hd=d/2;
 // Closed sloping slabs give the eaves a visible underside from low angles.
 const slope=Math.atan2(rise,hw),length=Math.hypot(hw,rise);
 for(const sign of [-1,1]){
  const slab=box(parent,M.roof,[sign*hw/2,y+rise/2-.025,0],[length+.04,.13,d]);slab.rotation.z=-sign*slope;
 }
 const tileGeo=new THREE.BoxGeometry(.35,.070,.42),countX=Math.ceil(hw/.34),countZ=Math.ceil(d/.39);
 const tiles=new THREE.InstancedMesh(tileGeo,M.roofLight,countX*countZ*2),dummy=new THREE.Object3D(),color=new THREE.Color();let i=0;
 for(const sign of [-1,1])for(let x=0;x<countX;x++)for(let z=0;z<countZ;z++){
  const xx=(x+.5)*hw/countX;
  dummy.position.set(sign*xx,y+rise*(1-xx/hw)+.036,-hd+(z+.5)*d/countZ);
  dummy.rotation.set(0,0,-sign*Math.atan2(rise,hw));dummy.scale.set(hw/countX/.35*1.06,1,d/countZ/.42*1.02);dummy.updateMatrix();tiles.setMatrixAt(i,dummy.matrix);
  color.set('#cc6c40').multiplyScalar(.91+.16*((x*7+z*3)%11)/10);tiles.setColorAt(i++,color);
 }
 tiles.castShadow=true;tiles.receiveShadow=true;parent.add(tiles);
 const ridge=cylinder(parent,.115,.115,d+.12,M.roofDark,[0,y+rise+.09,0]);ridge.rotation.x=Math.PI/2;
 for(const sign of [-1,1])box(parent,M.roofDark,[sign*hw,y-.035,0],[.14,.18,d+.14]);
 for(const z of [-hd+.08,hd-.24]){
  const triangle=new THREE.Shape();triangle.moveTo(-hw+.12,0);triangle.lineTo(hw-.12,0);triangle.lineTo(0,rise-.07);triangle.closePath();
  mesh(parent,new THREE.ExtrudeGeometry(triangle,{depth:.16,bevelEnabled:false}),M.cream,[0,y-.04,z]);
 }
 for(const sign of [-1,1]){
  box(parent,M.edge,[0,y-.07,sign*(hd-.07)],[w-.12,.13,.17]);
  for(const side of [-1,1]){const fascia=box(parent,M.roofDark,[side*hw/2,y+rise/2,sign*hd],[length+.18,.15,.15]);fascia.rotation.z=-side*slope;}
 }
}
function column(parent,x,z,height=2.8,y=.20){
 box(parent,M.edge,[x,y+.07,z],[.53,.14,.53]);cylinder(parent,.23,.255,.14,M.cream,[x,y+.19,z]);
 cylinder(parent,.15,.19,height-.46,M.cream,[x,y+height/2,z],20);
 cylinder(parent,.245,.18,.15,M.edge,[x,y+height-.21,z]);box(parent,M.cream,[x,y+height-.06,z],[.52,.13,.52]);
}
function pot(parent,x,z,y=0,scale=1){
 const points=[[.10,0],[.19,.07],[.28,.29],[.24,.47],[.14,.53],[.15,.59],[.19,.61]];
 const p=group(parent,[x,y,z]);p.scale.setScalar(scale);
 mesh(p,new THREE.LatheGeometry(points.map(a=>new THREE.Vector2(...a)),16),M.pot);
 const lip=mesh(p,new THREE.TorusGeometry(.17,.027,6,18),M.roofDark,[0,.61,0]);lip.rotation.x=Math.PI/2;
 cylinder(p,.145,.145,.015,M.opening,[0,.598,0]);return p;
}
function planter(parent,x,z,size=.7){
 box(parent,M.edge,[x,.22,z],[size,.35,size]);box(parent,M.earth,[x,.41,z],[size-.12,.035,size-.12]);
 for(let i=0;i<5;i++)ball(parent,i%2?M.leaf:M.leafLight,[x+Math.sin(i*2.4)*size*.25,.58+(i%2)*.10,z+Math.cos(i*2.4)*size*.25],[size*.25,.26,size*.25]);
}
function cloth(parent,{x=0,y=0,z=0,w=1,h=1,color=M.linen,phase=0,horizontal=false,striped=false}){
 const geo=new THREE.PlaneGeometry(w,h,16,10),material=striped?new THREE.MeshStandardMaterial({color:'#fff0d2',roughness:1,side:THREE.DoubleSide,vertexColors:true}):color.clone();material.side=THREE.DoubleSide;
 const pos=geo.attributes.position,base=Float32Array.from(pos.array);
 if(striped){const colors=[];for(let i=0;i<pos.count;i++){const c=new THREE.Color(Math.floor((pos.getX(i)/w+.501)*8)%2?'#f4e6bd':'#af5141');colors.push(c.r,c.g,c.b);}geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));}
 const sheet=dynamic(mesh(parent,geo,material,[x,y,z]));if(horizontal)sheet.rotation.x=-Math.PI*.40;
 animations.push(time=>{
  for(let i=0;i<pos.count;i++){
   const xx=base[i*3],yy=base[i*3+1],free=(h/2-yy)/h;
   pos.setZ(i,Math.sin(xx*3.1+time*1.6+phase)*.065*free+Math.sin(time*1.1+free*4+phase)*.07*free);
  }pos.needsUpdate=true;geo.computeVertexNormals();
 });return sheet;
}
function laundry(parent,w,d,y){
 const z=d/2+.8;
 for(const sign of [-1,1])cylinder(parent,.037,.043,1.5,M.wood,[sign*w*.43,y+.25,z]);
 tube(parent,[[-w*.43,y+.97,z],[0,y+.85,z],[w*.43,y+.97,z]],.012,M.darkWood);
 for(let i=0;i<3;i++)cloth(parent,{x:(i-1)*w*.25,y:y+.55,z:z+.015,w:w*.20,h:.62,color:i===1?M.teal:M.linen,phase:i*2});
}
function water(parent,x,y,z,w,d){
 const material=new THREE.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 vUv;uniform float time;void main(){vec2 p=vUv;float a=sin(p.x*32.+p.y*14.+time*1.3);float b=sin(p.x*15.-p.y*27.-time*.9);float glint=pow(max(0.,a*b),12.);float ripple=sin(length(p-.5)*90.-time*3.);float edge=smoothstep(0.,.045,min(min(p.x,1.-p.x),min(p.y,1.-p.y)));vec3 c=mix(vec3(.16,.48,.46),vec3(.30,.69,.64),.5+.20*a+.13*b);c+=glint*.34+ripple*.014;c=mix(vec3(.49,.77,.68),c,edge);gl_FragColor=vec4(c,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`});
 const surface=dynamic(mesh(parent,new THREE.PlaneGeometry(w,d),material,[x,y,z]));surface.rotation.x=-Math.PI/2;surface.castShadow=false;
 animations.push(t=>material.uniforms.time.value=t);return surface;
}
function puffs(parent,x,y,z,{steam=false,count=10}={}){
 const cloud=dynamic(group(parent,[x,y,z]));
 const particles=[];
 for(let i=0;i<count;i++){
  const material=new THREE.MeshStandardMaterial({color:steam?'#f5f1db':'#b7b4a2',transparent:true,opacity:0,depthWrite:false,roughness:1});
  const particle=ball(cloud,material,[0,0,0],[.1,.1,.1]);particle.castShadow=false;particle.receiveShadow=false;particles.push(particle);
 }
 animations.push(t=>particles.forEach((p,i)=>{
  const age=(t*(steam?.12:.16)+i/count)%1,s=.10+age*(steam?.45:.62);
  p.position.set(Math.sin(age*3+i)*.11+age*.6,age*(steam?1.5:2.3),Math.cos(i*2.7+age)*.10+age*.14);
  p.scale.set(s,s*.85,s);p.material.opacity=Math.sin(age*Math.PI)*(steam?.12:.20);
 }));return cloud;
}

function makeHome(tall=false){
 const root=new THREE.Group(),w=3.5,d=3.4,h=tall?4.7:2.9;
 box(root,M.stone,[0,.12,0],[w+.35,.24,d+.35]);box(root,tall?M.cream:M.plaster,[0,h/2+.19,0],[w,h,d]);
 wallBands(root,w,d,h);
 doorway(root,-.55,d/2+.012);windowFrame(root,.94,1.35,d/2+.025,.63,.83,true);
 if(tall){
  box(root,M.edge,[0,2.75,0],[w+.12,.17,d+.12]);
  for(const x of [-.96,.95])windowFrame(root,x,3.23,d/2+.025,.72,.98,true);
  box(root,M.edge,[0,2.86,d/2+.32],[2.8,.13,.75]);
  for(let i=0;i<8;i++)box(root,M.wood,[-1.2+i*.34,3.18,d/2+.68],[.035,.53,.035]);
  box(root,M.wood,[0,3.46,d/2+.68],[2.8,.07,.07]);
 }else laundry(root,w,d,1.25);
 const rear=wallFace(root,0,-d/2-.025,Math.PI);
 doorway(rear,-.73,0,2.12,.87);windowFrame(rear,.93,1.37,0,.63,.83,true);wallLamp(rear,-1.40,1.97,.04);
 if(tall)for(const x of [-.93,.93])windowFrame(rear,x,3.23,0,.72,.98,true);
 else{pot(rear,1.22,.51,0,.75);planter(rear,.31,.49,.46);}
 for(const sign of [-1,1]){
  const side=wallFace(root,sign*(w/2+.025),0,sign*Math.PI/2);
  for(const x of [-.81,.81])windowFrame(side,x,1.40,0,.62,.80,true);
  if(tall)for(const x of [-.81,.81])windowFrame(side,x,3.23,0,.67,.98,true);
 }
 roof(root,w+.48,d+.48,h+.18,1.02);
 for(const sign of [-1,1]){const gable=wallFace(root,0,sign*(d/2+.17),sign===1?0:Math.PI);roundel(gable,0,h+.51,.01,.16);}
 for(const sign of [-1,1])planter(root,sign*(w/2-.3),d/2+.55,.53);
 pot(root,w/2+.38,.80,0,.95);return root;
}
function makeVilla(){
 const root=new THREE.Group();box(root,M.stone,[0,.1,0],[5.35,.20,4.8]);
 // Three separate wings surround an open garden court.
 for(const side of [-1,1]){
  const wing=group(root,[side*1.83,0,0]);box(wing,M.cream,[0,1.49,0],[1.30,2.72,4.25]);wallBands(wing,1.30,4.25,2.72,.13);roof(wing,1.68,4.63,2.86,.65);
  windowFrame(wing,0,1.32,2.14,.55,.73,true);
  const outside=wallFace(wing,side*.665,0,side*Math.PI/2);
  for(const x of [-1.35,0,1.35])windowFrame(outside,x,1.34,0,.56,.83);
  const inside=wallFace(wing,-side*.665,0,-side*Math.PI/2);
  doorway(inside,.32,0,2.04,.70);windowFrame(inside,-1.17,1.37,0,.49,.73);
  const back=wallFace(wing,0,-2.14,Math.PI);windowFrame(back,0,1.32,0,.55,.73,true);
 }
 const rear=group(root,[0,0,-1.62]);box(rear,M.plaster,[0,1.46,0],[3.3,2.66,1.0]);wallBands(rear,3.3,1,2.66,.13);
 const rearRoof=group(rear);rearRoof.rotation.y=Math.PI/2;roof(rearRoof,1.4,3.7,2.86,.65);
 const rearFace=wallFace(rear,0,-.515,Math.PI);windowFrame(rearFace,0,1.09,0,.81,1.18);
 doorway(rear,0,.515,2.07,.79);
 box(root,M.edge,[0,.15,.28],[2.26,.12,3.14]);
 for(const x of [-1.12,1.12])for(const z of [-.9,.30,1.5])column(root,x,z,2.45);
 for(const x of [-1.12,1.12])box(root,M.edge,[x,2.67,.3],[.29,.21,3.22]);
 box(root,M.teal,[0,.225,.20],[1.28,.035,1.40]);water(root,0,.25,.20,1.16,1.28);
 planter(root,0,1.52,.64);planter(root,0,-.86,.58);return root;
}
function makeForum(){
 const root=new THREE.Group();
 for(let i=0;i<4;i++)box(root,M.edge,[0,.075+i*.15,1.13-i*.14],[5.8-i*.32,.15,5.0-i*.30]);
 box(root,M.cream,[0,2.13,-.6],[3.6,3.08,2.55]);
 const hall=group(root,[0,0,-.6]);wallBands(hall,3.6,2.55,3.08,.59);
 const back=wallFace(root,0,-1.892,Math.PI);back.position.y=.44;
 doorway(back,0,0,2.19,.94);
 for(const x of [-1.12,1.12])windowFrame(back,x,1.22,0,.52,1.11);
 for(const sign of [-1,1]){
  const side=wallFace(root,sign*1.818,-.6,sign*Math.PI/2);
  for(const x of [-.67,.67])windowFrame(side,x,1.52,0,.61,1.25);
  box(root,M.edge,[sign*1.71,2.10,-1.87],[.23,3.0,.16]);
 }
 doorway(root,0,.69,2.55,1.20);
 for(const x of [-2.02,-.68,.68,2.02])column(root,x,2.16,3.13,.58);
 for(const sign of [-1,1])column(root,sign*2.02,.65,3.13,.58);
 box(root,M.edge,[0,3.79,.47],[4.93,.30,4.32]);roof(group(root,[0,0,.47]),5.22,4.58,3.99,1.26);
 const rearGable=wallFace(root,0,-1.80,Math.PI);roundel(rearGable,0,4.49,.03,.24);
 for(const sign of [-1,1]){const frieze=wallFace(root,sign*2.48,.47,sign*Math.PI/2);for(let i=0;i<10;i++)box(frieze,M.gold,[-1.88+i*.42,3.79,.025],[.10,.10,.055]);}
 const medallion=cylinder(root,.28,.28,.08,M.gold,[0,4.49,2.77]);medallion.rotation.x=Math.PI/2;
 for(const side of [-1,1]){
  cylinder(root,.033,.043,3.40,M.wood,[side*2.47,2.07,2.44]);
  cloth(root,{x:side*2.47,y:2.97,z:2.48,w:.62,h:1.10,color:M.red,phase:side});
  const finial=ball(root,M.gold,[side*2.47,3.81,2.44],[.09,.13,.09]);finial.castShadow=false;
 }return root;
}
function makeMarket(){
 const root=new THREE.Group();box(root,M.stone,[0,.08,0],[5.3,.16,3.65]);
 for(const side of [-1,1]){
  const stall=group(root,[side*1.28,0,0]);
  for(const x of [-1.03,1.03])for(const z of [-1.2,1.17])box(stall,M.wood,[x,1.43,z],[.12,2.72,.12]);
  box(stall,M.wood,[0,2.8,-1.2],[2.28,.14,.14]);box(stall,M.wood,[0,2.24,1.17],[2.28,.12,.12]);
  for(const sign of [-1,1]){
   const brace=box(stall,M.darkWood,[sign*.80,2.52,-1.2],[.09,.64,.09]);brace.rotation.z=-sign*.70;
   box(stall,M.wood,[sign*1.03,1.30,-.56],[.10,.12,1.25]);
  }
  const canopy=cloth(stall,{x:0,y:2.56,z:0,w:2.45,h:2.7,horizontal:true,striped:true,phase:side});canopy.rotation.x=-Math.PI*.43;
  cloth(stall,{x:0,y:2.14,z:1.31,w:2.43,h:.31,striped:true,phase:side});
  const back=wallFace(stall,0,-1.31,Math.PI);cloth(back,{x:0,y:2.69,z:0,w:2.43,h:.25,striped:true,phase:side+.5});
  box(stall,M.wood,[0,.97,.85],[2.21,.22,.75]);
  for(let bin=0;bin<3;bin++){
   const x=(bin-1)*.68;box(stall,M.darkWood,[x,1.09,.87],[.62,.13,.65]);
   for(let i=0;i<7;i++)ball(stall,[M.apple,M.green,M.grape][bin],[x+Math.cos(i*2.4)*.18,1.23+(i%2)*.045,.87+Math.sin(i*2.4)*.19],[.105,.10,.105]);
  }
  for(let i=0;i<3;i++)crate(stall,-.78+i*.74,.10,-.70,.61);
  crate(stall,-.78,.75,-.70,.47);pot(stall,.68,-.70,.73,.62);
  box(stall,M.wood,[0,1.43,-1.03],[1.84,.11,.43]);
  for(const x of [-.54,0,.54])pot(stall,x,-1.04,1.49,.47);
 }
 const sign=dynamic(group(root,[0,2.78,1.42]));box(sign,M.wood,[0,-.28,0],[.68,.46,.09]);
 for(const side of [-1,1]){const emblem=mesh(sign,new THREE.TorusGeometry(.10,.02,6,16),M.gold,[0,-.28,side*.061]);emblem.rotation.z=.15;}
 animations.push(t=>sign.rotation.z=Math.sin(t*1.1)*.065);
 pot(root,2.15,1.1,0,1.0);pot(root,-2.15,1.18,0,.85);return root;
}
function makeWell(){
 const root=new THREE.Group();cylinder(root,1.08,1.11,.18,M.stone,[0,.09,0],32);
 cylinder(root,.75,.75,.10,M.opening,[0,.18,0],32);
 for(let row=0;row<4;row++)for(let i=0;i<12;i++){
  const a=(i+(row%2)*.5)/12*TAU,block=box(root,row%2?M.edge:M.cream,[Math.sin(a)*.77,.26+row*.18,Math.cos(a)*.77],[.39,.17,.25]);block.rotation.y=a;
 }
 const rim=mesh(root,new THREE.TorusGeometry(.77,.135,8,32),M.edge,[0,.96,0]);rim.rotation.x=Math.PI/2;
 for(const side of [-1,1])box(root,M.wood,[side*.95,1.57,0],[.16,2.72,.16]);
 for(const side of [-1,1])for(const front of [-1,1]){
  const brace=box(root,M.darkWood,[side*.95,2.56,front*.29],[.10,.67,.10]);brace.rotation.x=front*.65;
 }
 for(const side of [-1,1]){const face=wallFace(root,side*1.055,0,side*Math.PI/2);for(const y of [.57,1.85,2.67])ball(face,M.metal,[0,y,.01],[.045,.045,.025]);}
 box(root,M.wood,[0,2.83,0],[2.27,.18,.19]);roof(root,2.65,1.9,2.99,.67);
 const axle=dynamic(group(root,[0,2.45,0]));const spindle=cylinder(axle,.13,.13,2.1,M.wood,[0,0,0]);spindle.rotation.z=Math.PI/2;
 box(axle,M.wood,[1.16,-.16,0],[.09,.42,.09]);const grip=cylinder(axle,.06,.06,.25,M.darkWood,[1.29,-.33,0]);grip.rotation.z=Math.PI/2;
 const bucket=dynamic(group(root,[0,1.35,0]));cylinder(bucket,.23,.17,.36,M.wood,[0,0,0]);
 for(const y of [-.12,.12]){const hoop=mesh(bucket,new THREE.TorusGeometry(y>0?.218:.178,.018,6,18),M.metal,[0,y,0]);hoop.rotation.x=Math.PI/2;}
 tube(bucket,[[-.20,.15,0],[-.19,.40,0],[0,.49,0],[.19,.40,0],[.20,.15,0]],.017,M.metal);
 const rope=dynamic(cylinder(root,.015,.015,1,M.linen,[0,2,0],6));
 animations.push(t=>{const lift=.85+.40*Math.sin(t*.65);bucket.position.y=lift;const bottom=lift+.49;rope.scale.y=2.45-bottom;rope.position.y=(2.45+bottom)/2;axle.rotation.x=lift/.13;});
 return root;
}
function makeWorkshop(){
 const root=new THREE.Group();box(root,M.stone,[0,.12,0],[4.5,.24,3.9]);box(root,M.plaster,[0,1.47,-.25],[4.04,2.64,2.84]);
 wallBands(group(root,[0,0,-.25]),4.04,2.84,2.64,.15);
 roof(group(root,[0,0,-.25]),4.6,3.33,2.92,1.08);
 const rear=wallFace(root,0,-1.686,Math.PI);doorway(rear,-.67,0,2.20,1.05);vent(rear,.92,1.97,.02,.72,.47);wallLamp(rear,-1.55,2.08,.02);
 barrel(rear,.63,.47,.15,.72);crate(rear,1.40,.13,.40,.48);
 for(const side of [-1,1]){
  const face=wallFace(root,side*2.035,-.25,side*Math.PI/2);windowFrame(face,.55,1.34,0,.62,.86);vent(face,-.63,1.93,.01,.55,.40);
 }
 const gable=wallFace(root,0,-1.91,Math.PI);vent(gable,0,3.20,.02,.56,.34);
 arch(root,.76,.18,1.18,1.52,1.94,M.roofDark,.19);arch(root,.76,.18,1.39,1.17,1.60,M.opening,.035);
 windowFrame(root,-1.02,1.33,1.19,.68,.81);
 const chimney=group(root,[1.03,0,-.64]);box(chimney,M.roofDark,[0,3.87,0],[.59,2.66,.63]);
 for(let i=0;i<7;i++)box(chimney,M.roofLight,[0,2.85+i*.31,0],[.64,.07,.68]);box(chimney,M.edge,[0,5.22,0],[.83,.15,.88]);box(chimney,M.opening,[0,5.31,0],[.53,.035,.59]);
 puffs(root,1.03,5.35,-.64,{count:12});
 const fire=dynamic(group(root,[.76,.3,1.52]));
 const fireMaterial=new THREE.MeshStandardMaterial({color:'#ee8d32',emissive:'#ff5a13',emissiveIntensity:1.4,roughness:1});
 const tongues=[];for(let i=0;i<5;i++)tongues.push(mesh(fire,new THREE.ConeGeometry(.12,.58,7),fireMaterial,[(i-2)*.17,.24,0]));
 animations.push(t=>tongues.forEach((f,i)=>{f.scale.y=.70+.30*Math.sin(t*7+i*1.7);f.rotation.z=.10*Math.sin(t*5+i);f.position.y=.20+f.scale.y*.10;}));
 const glow=new THREE.PointLight('#ff9b43',2.0,3.1,2);glow.position.set(.76,.86,1.70);root.add(glow);animations.push(t=>glow.intensity=1.7+.30*Math.sin(t*9)+.12*Math.sin(t*14));
 box(root,M.wood,[-.7,.9,2.02],[2.1,.16,.70]);for(const side of [-1,1])box(root,M.darkWood,[-.7+side*.86,.48,2.02],[.10,.82,.11]);
 for(let i=0;i<3;i++)pot(root,-1.4+i*.6,2.02,.99,.6);pot(root,1.58,1.73,0,1.05);
 const wheel=dynamic(group(root,[-1.57,1.18,2.02]));cylinder(wheel,.28,.28,.08,M.edge,[0,0,0]);
 for(let i=0;i<4;i++)box(wheel,M.pot,[0,.05,(i-1.5)*.08],[.02,.014,.40]);animations.push(t=>wheel.rotation.y=t*.9);
 return root;
}
function makeGarden(){
 const root=new THREE.Group();box(root,M.stone,[0,.08,0],[4.30,.16,4.0]);box(root,M.earth,[0,.16,0],[3.94,.07,3.63]);
 for(const x of [-1.49,1.49])for(const z of [-1.35,1.35])planter(root,x,z,.85);
 for(const x of [-1.85,1.85])box(root,M.edge,[x,.23,0],[.16,.25,3.8]);for(const z of [-1.80,1.80])box(root,M.edge,[0,.23,z],[3.86,.25,.16]);
 box(root,M.edge,[0,.22,0],[2.26,.20,2.16]);box(root,M.teal,[0,.35,0],[1.95,.08,1.87]);water(root,0,.41,0,1.85,1.77);
 cylinder(root,.20,.27,.78,M.cream,[0,.75,0]);
 const bowl=mesh(root,new THREE.TorusGeometry(.45,.095,8,28),M.edge,[0,1.20,0]);bowl.rotation.x=Math.PI/2;
 cylinder(root,.42,.25,.15,M.cream,[0,1.14,0]);cylinder(root,.09,.12,.64,M.edge,[0,1.52,0]);ball(root,M.gold,[0,1.88,0],[.12,.12,.12]);
 const drops=dynamic(group(root)),dropMaterial=mat('#8dcfbb',{transparent:true,opacity:.8,roughness:.24});
 for(let jet=0;jet<4;jet++){
  const angle=jet*Math.PI/2,points=[];
  for(let i=0;i<=12;i++){const p=i/12;points.push([Math.cos(angle)*p*.74,1.71+.65*p-1.95*p*p,Math.sin(angle)*p*.74]);}
  tube(root,points,.014,dropMaterial);
 }
 const stream=[];for(let i=0;i<24;i++)stream.push(ball(drops,dropMaterial,[0,0,0],[.025,.07,.025]));
 animations.push(t=>stream.forEach((drop,i)=>{const p=(t*.72+i/6)%1,angle=Math.floor(i/6)*Math.PI/2;drop.position.set(Math.cos(angle)*p*.74,1.71+.65*p-1.95*p*p,Math.sin(angle)*p*.74);drop.scale.y=.07*(.8+p*.6);}));
 for(let i=0;i<4;i++){
  const ripple=dynamic(mesh(root,new THREE.RingGeometry(.16,.18,24),new THREE.MeshBasicMaterial({color:'#cbf0d7',transparent:true,opacity:.3,depthWrite:false}),[0,.43,0]));ripple.rotation.x=-Math.PI/2;
  animations.push(t=>{const p=(t*.55+i*.25)%1;ripple.scale.setScalar(1+p*3);ripple.material.opacity=(1-p)*.36;});
 }
 for(const side of [-1,1]){box(root,M.wood,[side*1.48,.58,0],[.43,.12,1.42]);for(const z of [-.5,.5])box(root,M.edge,[side*1.48,.36,z],[.20,.40,.18]);}
 for(const sign of [-1,1]){
  for(let i=0;i<3;i++)box(root,M.edge,[0,.22,sign*(1.26+i*.26)],[.63,.09,.21]);
  for(const x of [-.77,.77]){pot(root,x,sign*1.46,.20,.49);ball(root,M.leafLight,[x,.67,sign*1.46],[.21,.23,.21]);}
 }
 return root;
}
function makeBath(){
 const root=new THREE.Group();box(root,M.stone,[0,.1,0],[5.7,.20,5.2]);
 box(root,M.plaster,[0,1.68,-1.25],[4.65,3.13,1.83]);
 wallBands(group(root,[0,0,-1.25]),4.65,1.83,3.13,.115);
 const rear=wallFace(root,0,-2.18,Math.PI);
 doorway(rear,0,0,2.20,1.02);
 for(const x of [-1.50,1.50])windowFrame(rear,x,1.10,0,.76,1.46);
 for(const x of [-.76,.76])wallLamp(rear,x,1.95,.02);
 for(const side of [-1,1]){
  const face=wallFace(root,side*2.34,-1.25,side*Math.PI/2);windowFrame(face,0,1.19,0,.90,1.31);
  planter(rear,side*1.94,.58,.54);
 }
 for(const x of [-1.6,0,1.6]){arch(root,x,.26,-.31,.84,2.15,M.edge,.10);arch(root,x,.29,-.19,.63,1.94,M.opening,.025);}
 box(root,M.edge,[0,3.32,-1.25],[4.95,.22,2.98]);
 cylinder(root,1.40,1.40,.22,M.edge,[0,3.43,-1.25],32);
 const dome=mesh(root,new THREE.SphereGeometry(1,32,16,0,TAU,0,Math.PI/2),M.roof,[0,3.54,-1.25],[1.36,1.05,1.36]);
 for(let i=0;i<12;i++){
  const a=i/12*TAU,points=[];for(let j=0;j<12;j++){const p=j/11*Math.PI/2;points.push([Math.sin(p)*Math.cos(a)*1.38,3.54+Math.cos(p)*1.07,-1.25+Math.sin(p)*Math.sin(a)*1.38]);}tube(root,points,.025,M.edge);
 }
 ball(root,M.gold,[0,4.68,-1.25],[.12,.15,.12]);
 box(root,M.edge,[0,.20,1.08],[4.14,.25,2.48]);box(root,M.teal,[0,.37,1.08],[3.73,.10,2.07]);water(root,0,.435,1.08,3.59,1.93);
 for(const x of [-2.36,2.36])for(const z of [-.10,1.93])column(root,x,z,2.70);
 for(const x of [-2.36,2.36])box(root,M.edge,[x,3.0,.91],[.52,.25,2.69]);
 for(const x of [-1.3,.9])puffs(root,x,.60,1.0,{steam:true,count:7});
 pot(root,-2.25,2.34,0,.85);pot(root,2.25,2.34,0,.85);return root;
}
function makeTheater(){
 const root=new THREE.Group();box(root,M.stone,[0,.08,.30],[7.20,.16,6.00]);
 for(let row=0;row<5;row++){
  const inner=1.30+row*.43,outer=inner+.43,height=.27+row*.33,s=new THREE.Shape();
  s.absarc(0,0,outer,0,Math.PI,false);s.absarc(0,0,inner,Math.PI,0,true);s.closePath();
  const geo=new THREE.ExtrudeGeometry(s,{depth:height,bevelEnabled:false,curveSegments:30});geo.rotateX(Math.PI/2);geo.translate(0,height+.16,.10);
  mesh(root,geo,row%2?M.cream:M.edge);
 }
 box(root,M.wood,[0,.33,-.88],[4.9,.32,1.5]);box(root,M.plaster,[0,1.82,-1.76],[5.70,3.33,.36]);
 wallBands(group(root,[0,0,-1.76]),5.70,.36,3.33,.155);
 const backstage=wallFace(root,0,-1.958,Math.PI);
 for(const x of [-1.92,1.92])doorway(backstage,x,0,2.22,.84);
 windowFrame(backstage,0,1.32,0,.78,1.35);wallLamp(backstage,-.93,2.03,.01);wallLamp(backstage,.93,2.03,.01);
 for(const x of [-2.73,-.67,.67,2.73]){box(backstage,M.edge,[x,1.86,.05],[.18,3.22,.18]);box(backstage,M.cream,[x,3.41,.08],[.33,.17,.25]);}
 crate(backstage,.54,.17,.50,.51);barrel(backstage,-.53,.50,.17,.72);
 // A curved retaining facade completes the outside of the seating bowl.
 const outerRadius=3.53,outerHeight=1.92;
 for(let i=0;i<11;i++){
  const a=(i+.5)/11*Math.PI,face=wallFace(root,Math.cos(a)*outerRadius,.10+Math.sin(a)*outerRadius,Math.PI/2-a);
  arch(face,0,.23,0,.61,1.46,M.edge,.09);arch(face,0,.25,.10,.45,1.20,M.opening,.025);
  box(face,M.edge,[0,outerHeight,.02],[.85,.17,.20]);
  for(const side of [-1,1])box(face,M.stone,[side*.41,1.04,.025],[.10,1.72,.15]);
 }
 for(const x of [-2.48,2.48])column(root,x,-1.46,3.25);
 box(root,M.edge,[0,3.62,-1.56],[6.10,.23,.83]);roof(group(root,[0,0,-1.56]),6.43,1.06,3.81,.83);
 arch(root,0,.50,-1.55,2.98,2.49,M.opening,.05);
 for(const side of [-1,1])cloth(root,{x:side*1.28,y:1.92,z:-1.33,w:.90,h:2.48,color:M.red,phase:side*2});
 for(const side of [-1,1]){cylinder(root,.035,.04,3.6,M.wood,[side*3.11,1.95,-1.72]);cloth(root,{x:side*3.11,y:2.98,z:-1.66,w:.48,h:.95,color:M.teal,phase:side});}
 return root;
}

// Static detail is combined by material. Moving pieces and roof instances stay separate.
function batchStatic(root){
 root.updateMatrixWorld(true);const buckets=new Map(),remove=[];
 function visit(o){
  if(o.userData.dynamic||o.isInstancedMesh)return;
  if(o.isMesh&& !Array.isArray(o.material)){
   const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);
   const bucket=buckets.get(o.material)||[];bucket.push(g);buckets.set(o.material,bucket);remove.push(o);
  } else for(const child of [...o.children])visit(child);
 }for(const child of [...root.children])visit(child);
 for(const [material,geos] of buckets){
  const count=geos.reduce((n,g)=>n+g.attributes.position.count,0),p=new Float32Array(count*3),n=new Float32Array(count*3),uv=new Float32Array(count*2);let cursor=0;
  for(const geo of geos){p.set(geo.attributes.position.array,cursor*3);n.set(geo.attributes.normal.array,cursor*3);if(geo.attributes.uv)uv.set(geo.attributes.uv.array,cursor*2);cursor+=geo.attributes.position.count;geo.dispose();}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(p,3));geometry.setAttribute('normal',new THREE.BufferAttribute(n,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));mesh(root,geometry,material);
 }remove.forEach(o=>o.removeFromParent());
}

export function createBuildings(groundHeight=0){
 animations.length=0;
 const definitions=[
  {id:'forum',name:'Forum',kind:'forum',x:-11,z:-6.4,w:5.8,d:5.9,view:11,color:'#d1b879',motion:'Banners catch the breeze above the portico.',make:makeForum},
  {id:'cottage',name:'Cottage',kind:'house',x:-5.2,z:-5.3,w:4.5,d:5.5,view:8.8,color:'#c58a58',motion:'Laundry and wooden shutters move in the breeze.',make:()=>makeHome(false)},
  {id:'townhouse',name:'Townhouse',kind:'house',x:.0,z:-5.5,w:4.5,d:4.8,view:10,color:'#ddcc9e',motion:'Hinged shutters move gently on the upper floor.',make:()=>makeHome(true)},
  {id:'villa',name:'Courtyard home',kind:'house',x:6.0,z:-5.7,w:5.4,d:5.0,view:10,color:'#9b9c74',motion:'Water shimmers inside the open courtyard.',make:makeVilla},
  {id:'workshop',name:'Workshop',kind:'workshop',x:12.4,z:-5.7,w:4.7,d:5.1,view:10,color:'#b76a48',motion:'The kiln flickers, smoke rises, and a pottery wheel turns.',make:makeWorkshop},
  {id:'theater',name:'Theater',kind:'theater',x:-11.5,z:6.0,w:7.3,d:6.5,view:12,color:'#a3534b',motion:'Stage curtains and pennants stir in the wind.',make:makeTheater},
  {id:'market',name:'Market',kind:'market',x:-4.0,z:5.6,w:5.4,d:3.8,view:9,color:'#b95c4a',motion:'Striped awnings ripple and the hanging sign swings.',make:makeMarket},
  {id:'garden',name:'Garden',kind:'garden',x:1.5,z:5.1,w:4.4,d:4.2,view:8,color:'#788d5b',motion:'Fountain jets fall into an animated pool with spreading ripples.',make:makeGarden},
  {id:'bath',name:'Bathhouse',kind:'bath',x:7.6,z:6.0,w:5.8,d:6.5,view:11,color:'#628f85',motion:'Pool water shimmers as warm steam rises between the columns.',make:makeBath},
  {id:'well',name:'Well',kind:'well',x:13.3,z:4.7,w:3.0,d:3.0,view:8,color:'#8d7954',motion:'A turning windlass lowers and raises the bucket on its rope.',make:makeWell},
 ];
 const buildings=definitions.map(def=>{
  const root=def.make();
  // Each model starts with its foundation. Ground that solid base, not moving effects.
  const base=new THREE.Box3().setFromObject(root.children[0]);
  batchStatic(root);
  const center=new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
  root.position.set(def.x,groundHeight-base.min.y,def.z);root.name=def.id;root.userData.building=def.id;
  return {...def,focusHeight:center.y+root.position.y,root};
 });
 const updates=[...animations];
 return {buildings,animate(time){for(const update of updates)update(time);},animationCount:updates.length};
}

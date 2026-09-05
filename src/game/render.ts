import { DEFS, SIZE, type Kind, type Service } from './config';
import { adjacent, appealDetails, buildingAt, canPlace, flood, key, terrain, type Building, type City } from './simulation';

export interface Camera { x: number; y: number; zoom: number; }
export interface View { camera: Camera; hover: [number,number] | null; tool: Kind | 'inspect' | 'demolish'; selected: number | null; overlay: 'none' | 'roads' | 'appeal' | Service; grid: boolean; time: number; }
type Point=[number,number];
const p=(x:number,y:number,z=0):Point=>[(x-y)*32,(x+y)*16-z];
export const project=p;
export function pick(sx:number,sy:number,c:Camera):Point { const x=(sx-c.x)/c.zoom,y=(sy-c.y)/c.zoom;return [Math.floor(y/32+x/64),Math.floor(y/32-x/64)]; }
const hash=(x:number,y:number)=>{const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);};
const pal={wall:'#efe1b5',left:'#c9b785',right:'#b59b6a',roof:'#ba563b',roofLight:'#e58b5d',roofDark:'#853d30'};
export class Renderer {
 ctx:CanvasRenderingContext2D; width=0;height=0;dpr=1;
 seen=new Map<number,number>(); tiers=new Map<number,number>(); sparkles=new Map<number,number>();
 walkers:{x:number;y:number;nx:number;ny:number;px:number;py:number;progress:number}[]=[];
 previousTime=0;
 constructor(public canvas:HTMLCanvasElement){this.ctx=canvas.getContext('2d')!;}
 resize(w:number,h:number){this.width=w;this.height=h;this.dpr=Math.min(window.devicePixelRatio||1,2);this.canvas.width=w*this.dpr;this.canvas.height=h*this.dpr;}
 poly(points:Point[],color:string,stroke?:string){const c=this.ctx;c.beginPath();points.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.65;c.stroke();}}
 line(points:Point[],color:string,width=1){const c=this.ctx;c.beginPath();points.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.stroke();}
 ellipse(x:number,y:number,rx:number,ry:number,color:string){const c=this.ctx;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
 tile(x:number,y:number,color:string,inset=0,z=0){this.poly([p(x+inset,y+inset,z),p(x+1-inset,y+inset,z),p(x+1-inset,y+1-inset,z),p(x+inset,y+1-inset,z)],color);}
 slab(x:number,y:number,w:number,d:number,h:number,top=pal.wall,left=pal.left,right=pal.right,z=0){
  this.poly([p(x,y+d,z),p(x+w,y+d,z),p(x+w,y+d,h+z),p(x,y+d,h+z)],left);
  this.poly([p(x+w,y,z),p(x+w,y+d,z),p(x+w,y+d,h+z),p(x+w,y,h+z)],right);
  this.poly([p(x,y,h+z),p(x+w,y,h+z),p(x+w,y+d,h+z),p(x,y+d,h+z)],top);
 }
 roof(x:number,y:number,w:number,d:number,h:number,rise:number,straw=false){
  const a=p(x-.05,y-.06,h),b=p(x+w+.05,y-.06,h),c=p(x+w+.05,y+d+.06,h),e=p(x-.05,y+d+.06,h),r1=p(x+w/2,y-.06,h+rise),r2=p(x+w/2,y+d+.06,h+rise);
  this.poly([a,r1,r2,e],straw?'#d3ac61':pal.roofLight);this.poly([r1,b,c,r2],straw?'#ac834b':pal.roof);this.poly([e,r2,c],straw?'#c89b53':pal.roofDark);
  this.line([r1,r2],straw?'#e3c07b':'#f0b27e',2);
  for(let i=1;i<6;i++){const t=i/6;this.line([[r1[0]+(b[0]-r1[0])*t,r1[1]+(b[1]-r1[1])*t],[r2[0]+(c[0]-r2[0])*t,r2[1]+(c[1]-r2[1])*t]],straw?'#c49b5c':'#a94b37',.7);}
 }
 window(x:number,y:number,z:number,side:'x'|'y',door=false){
  const w=door?.18:.12,h=door?11:6;
  const a=p(x,y,z),b=side==='x'?p(x+w,y,z):p(x,y+w,z);
  this.poly([a,b,[b[0],b[1]-h],[a[0],a[1]-h]],door?'#654a33':'#476761');
  if(!door)this.line([[a[0]-1,a[1]+1],[b[0]+1,b[1]+1]],'#f5e9c8',1.7);
 }
 tree(x:number,y:number,scale=1,cypress=false){
  const[sx,sy]=p(x,y);this.ellipse(sx+7*scale,sy+3,13*scale,5*scale,'#264c3929');this.line([[sx,sy],[sx,sy-20*scale]],'#77623a',3*scale);
  if(cypress){this.poly([[sx-7*scale,sy-12*scale],[sx-5*scale,sy-33*scale],[sx,sy-55*scale],[sx+6*scale,sy-32*scale],[sx+8*scale,sy-12*scale]],'#315941');this.poly([[sx-7*scale,sy-12*scale],[sx-5*scale,sy-33*scale],[sx,sy-55*scale],[sx,sy-13*scale]],'#547c48');}
  else {this.ellipse(sx,sy-25*scale,17*scale,13*scale,'#476b3d');this.ellipse(sx-8*scale,sy-30*scale,11*scale,9*scale,'#74904e');this.ellipse(sx+8*scale,sy-29*scale,10*scale,10*scale,'#5e8344');this.ellipse(sx-3*scale,sy-36*scale,10*scale,7*scale,'#91a760');this.ellipse(sx+8*scale,sy-36*scale,6*scale,6*scale,'#839e56');for(let i=0;i<7;i++){const angle=i*2.4,radius=hash(x+i,y)*12*scale;this.ellipse(sx+Math.cos(angle)*radius,sy-30*scale+Math.sin(angle)*radius*.5,1.4*scale,1*scale,'#b1bc7a66');}}
 }
 house(b:Building){const{x,y,tier}=b;
  this.slab(x+.08,y+.08,1.84,1.84,2,'#d5c396','#b8a477','#b8a477');
  if(tier===1){for(const [dx,dy] of [[.25,.23],[.92,1]]){this.slab(x+dx,y+dy,.65,.7,12,'#d5bc88','#ccb17e','#b29b6e',2);this.roof(x+dx,y+dy,.65,.7,14,10,true);this.window(x+dx+.2,y+dy+.705,2,'x',true);}this.ellipse(...p(x+1.45,y+.35,3),5,3,'#b29869');}
  if(tier===2){this.slab(x+.2,y+.3,1.1,1.25,22);this.roof(x+.2,y+.3,1.1,1.25,22,14);this.window(x+.6,y+1.56,2,'x',true);this.window(x+.3,y+1.56,12,'x');this.window(x+1.31,y+.7,12,'y');this.tree(x+1.65,y+.65,.45);this.slab(x+1.42,y+1.35,.3,.35,3,'#527b45');}
  if(tier===3){this.slab(x+.15,y+.2,.65,1.5,29);this.roof(x+.15,y+.2,.65,1.5,29,11);this.slab(x+.8,y+.2,.98,.65,23);this.roof(x+.8,y+.2,.98,.65,23,12);this.slab(x+.98,y+1.06,.58,.45,3,'#6da49a');this.window(x+.35,y+1.71,3,'x',true);for(const dy of [.4,.95,1.4])this.window(x+.805,y+dy,18,'y');this.tree(x+1.7,y+1.7,.4,true);}
  if(tier===4){this.slab(x+.1,y+.13,1.2,1.6,42,'#f0e5c7','#e4d8b6','#c9b994');this.slab(x+.06,y+.09,1.28,1.68,3,'#e9dcb4','#b9a878','#c5b589',22);this.roof(x+.05,y+.08,1.3,1.7,44,16);for(const z of [12,33])for(const dy of [.4,.85,1.3])this.window(x+1.31,y+dy,z,'y');for(const dx of [.25,.8])this.window(x+dx,y+1.74,33,'x');this.window(x+.55,y+1.74,3,'x',true);this.slab(x+1.45,y+.32,.32,1.35,5,'#75914c');this.tree(x+1.6,y+.6,.65,true);this.tree(x+1.6,y+1.4,.65,true);this.line([p(x+.2,y+1.8,25),p(x+1.2,y+1.8,25)],'#f8edcf',2);}
 }
 structure(b:Building,time:number){const{x,y,kind}=b,s=DEFS[kind].size;
  const[shx,shy]=p(x+s/2,y+s/2);this.ellipse(shx+15,shy+7,s*24,s*10,'#233e3029');
  if(kind==='house'){this.house(b);return;}
  if(kind==='garden'){this.slab(x+.06,y+.06,.88,.88,4,'#a3aa67','#c6bd8e','#a2a16e');this.slab(x+.17,y+.17,.66,.66,5,'#5c8a48','#476b3e','#476b3e',4);this.tree(x+.5,y+.5,.6,hash(x,y)>.5);for(let i=0;i<4;i++){const[qx,qy]=p(x+.15+i*.2,y+.87,10);this.ellipse(qx,qy,2,1.5,i%2?'#e9d18c':'#cf876b');}return;}
  this.slab(x+.04,y+.04,s-.08,s-.08,4,'#d6c89f','#b7aa83','#b7aa83');
  if(kind==='well'){
   const[qx,qy]=p(x+.5,y+.5,5);this.ellipse(qx,qy,13,7,'#aaab91');this.ellipse(qx,qy-6,13,7,'#e5dcba');this.ellipse(qx,qy-6,8,4,'#3e756e');
   for(const dx of [.15,.85])this.slab(x+dx,y+.45,.07,.08,29,'#c1a470','#997748','#775b3e');this.roof(x+.1,y+.25,.8,.5,29,9);this.line([p(x+.5,y+.5,29),p(x+.5,y+.5,8)],'#6a5943',1);return;
  }
  if(kind==='market'){
   for(const[dx,dy]of[[.15,.13],[.95,.8]]){this.slab(x+dx,y+dy,.72,.8,12,'#bf9760','#9d7746','#866242',4);for(let i=0;i<4;i++)this.poly([p(x+dx+i*.18,y+dy,30),p(x+dx+(i+1)*.18,y+dy,30),p(x+dx+(i+1)*.18,y+dy+.9,23),p(x+dx+i*.18,y+dy+.9,23)],i%2?'#f5e7c3':'#c95f49');for(let i=0;i<3;i++){const[qx,qy]=p(x+dx+.13+i*.23,y+dy+.86,17);this.ellipse(qx,qy,3.5,2.5,['#dd9553','#6c8a46','#b6573d'][i]);}this.line([p(x+dx,y+dy+.9,4),p(x+dx,y+dy+.9,23)],'#826841',2);}return;
  }
  if(kind==='workshop'){this.slab(x+.2,y+.2,1.6,1.4,24,'#c9ac7c','#b19369','#8c7958');this.roof(x+.2,y+.2,1.6,1.4,24,13);this.slab(x+.35,y+.5,.23,.24,47,'#bda57d','#ae8e69','#8e6f52');this.window(x+.9,y+1.61,3,'x',true);for(const dy of [.6,1.1])this.window(x+1.81,y+dy,14,'y');for(let i=0;i<3;i++){const[qx,qy]=p(x+.55+i*.4,y+1.85,5);this.ellipse(qx,qy-3,5,6,'#a76743');this.ellipse(qx,qy-8,4,2,'#d68b50');}if(!b.paused&&b.connected){for(let i=0;i<3;i++){const drift=(time*.28+i*.32)%1,[qx,qy]=p(x+.45,y+.6,50);this.ellipse(qx+drift*14,qy-drift*28,4+drift*6,3+drift*4,`rgba(238,227,202,${.3*(1-drift)})`);}}return;}
  if(kind==='bath'){this.slab(x+.15,y+.2,1.7,1.05,29,'#efe5c7','#d6cbaa','#c0b087');this.roof(x+.15,y+.2,1.7,1.05,29,9);const[dx,dy]=p(x+1.1,y+.62,39);this.ellipse(dx,dy,16,8,'#ddc4a0');this.ctx.beginPath();this.ctx.moveTo(dx-16,dy);this.ctx.bezierCurveTo(dx-16,dy-24,dx+16,dy-24,dx+16,dy);this.ctx.fillStyle='#d7c9a4';this.ctx.fill();this.ctx.beginPath();this.ctx.moveTo(dx-16,dy);this.ctx.bezierCurveTo(dx-16,dy-20,dx+3,dy-24,dx+3,dy-17);this.ctx.lineTo(dx,dy+4);this.ctx.fillStyle='#f0e0b9';this.ctx.fill();this.slab(x+.35,y+1.35,1.3,.48,5,'#ece0bd');this.slab(x+.45,y+1.4,1.1,.34,6,'#61aaa5');for(const column of [.35,.8,1.25])this.window(x+column,y+1.26,5,'x',true);this.line([p(x+.55,y+1.5,6),p(x+1.2,y+1.5,6)],'#b5ded080',1);return;}
  if(kind==='forum'){
   this.slab(x+.12,y+.12,2.76,2.76,3,'#e1d5ad','#cabb96','#baab85',4);this.slab(x+.35,y+.3,2.3,1.7,33,'#e6d9b6','#c6b997','#b7aa8a',7);
   for(let i=0;i<6;i++){this.slab(x+.38+i*.39,y+2.05,.15,.22,32,'#f7edd1','#ede1bd','#c9ba93',7);this.slab(x+.34+i*.39,y+2.01,.23,.3,3,'#eee3c4','#cabd97','#b7aa87',37);}
   this.slab(x+.26,y+.18,2.49,2.14,5,'#f3e6c3','#cbbc95','#bfae86',40);this.roof(x+.23,y+.15,2.55,2.2,45,20);
   for(const dx of [.5,2.3]){this.line([p(x+dx,y+2.65,4),p(x+dx,y+2.65,29)],'#a88d55',1.5);this.poly([p(x+dx,y+2.65,28),p(x+dx+.25,y+2.65,28),p(x+dx+.25,y+2.65,17),p(x+dx+.1,y+2.65,20),p(x+dx,y+2.65,17)],'#9c4a4b');}return;
  }
  if(kind==='theater'){
   for(let ring=0;ring<5;ring++){const radius=1.25-ring*.17;const pts:Point[]=[];for(let i=0;i<=24;i++){const a=Math.PI*.12+i/24*Math.PI*1.45;pts.push(p(x+1.5+Math.cos(a)*radius,y+1.5+Math.sin(a)*radius,29-ring*5));}this.line(pts,ring%2?'#c4b88d':'#e4d6af',8);}
   this.slab(x+.5,y+.27,1.7,.45,32,'#e9d9b6','#d6c7a3','#bbaa84');this.roof(x+.4,y+.2,1.9,.55,32,10);this.slab(x+1,y+1,.85,.65,4,'#bc8d66');this.poly([p(x+.72,y+.73,29),p(x+1.02,y+.73,29),p(x+1.02,y+.73,6),p(x+.72,y+.73,6)],'#954850');
  }
 }
 draw(c:City,v:View){const ctx=this.ctx;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,this.width,this.height);
  const sky=ctx.createLinearGradient(0,0,this.width,this.height);sky.addColorStop(0,'#dbe2cd');sky.addColorStop(.5,'#e4e7d1');sky.addColorStop(1,'#b9cdbd');ctx.fillStyle=sky;ctx.fillRect(0,0,this.width,this.height);
  ctx.translate(v.camera.x,v.camera.y);ctx.scale(v.camera.zoom,v.camera.zoom);
  this.poly([p(0,32),p(32,32),p(32,32,-30),p(0,32,-30)],'#a2946b');this.poly([p(32,0),p(32,32),p(32,32,-30),p(32,0,-30)],'#837d58');
  for(const z of [-10,-22]){this.line([p(5,32,z),p(32,32,z)],'#bcaa7c60',2);this.line([p(32,1,z),p(32,32,z)],'#a4966a50',2);}
  let serviceReach:Map<string,number>|null=null;const selected=c.buildings.find(b=>b.id===v.selected);
  if(['well','market','bath','theater'].includes(v.overlay)){serviceReach=new Map();for(const b of c.buildings.filter(b=>b.kind===v.overlay))for(const [k,d]of(c.serviceRoutes.get(b.id)??[]))serviceReach.set(k,d);}
  if(selected&&DEFS[selected.kind].range)serviceReach=c.serviceRoutes.get(selected.id)??null;
  if(v.hover&&v.tool!=='inspect'&&v.tool!=='demolish'&&DEFS[v.tool].range)serviceReach=flood(c.connectedRoads,adjacent({kind:v.tool,x:v.hover[0],y:v.hover[1]}),DEFS[v.tool].range);
  for(let d=0;d<64;d++)for(let x=0;x<SIZE;x++){const y=d-x;if(y<0||y>=SIZE)continue;const t=terrain(x,y),h=hash(x,y);
   const softness=Math.sin(x*.25+y*.17)*2;
   const color=t==='grass'?`hsl(${79+h*3},${26+h*3}%,${59+softness+h*2}%)`:t==='water'?`hsl(${181+x},${26+x*1.2}%,${47+x*.7+h*1.5}%)`:t==='sand'?'#c9c39b':'#a3a28a';this.tile(x,y,color);
   if(t==='water'){const wave=Math.sin(v.time*.8+x*.5+y)*2;const[a,b]=p(x+.25,y+.35);this.line([[a-9,b+wave],[a+5,b+wave+1]],'#bcdfd35a',1);if(h>.6)this.line([[a+4,b+6+wave],[a+10,b+6+wave]],'#dce9c549',.8);}
   if(t==='sand'&&h>.35){const[a,b]=p(x+.6,y+.3);this.ellipse(a,b,2.4,1.2,'#9ea27466');for(let i=0;i<3;i++)this.line([[a+i*2,b],[a+i*2-2,b-5-i]],'#779268',.8);}
   if(t==='grass'&&h>.72&&!buildingAt(c,x,y)&&!c.roads.has(key(x,y))){for(let j=0;j<3;j++){const[a,b]=p(x+.2+j*.2,y+.5);this.line([[a,b],[a-1,b-3]],'#66864455',.8);}}
   if(c.roads.has(key(x,y))){this.tile(x,y,'#b8ac83',.01,1);this.tile(x,y,'#ddcda8',.07,1.2);for(let i=0;i<3;i++)this.line([p(x+.1+i*.26,y+.1,1.5),p(x+.1+i*.26,y+.9,1.5)],'#b4a58460',.65);this.line([p(x+.1,y+.5,1.5),p(x+.9,y+.5,1.5)],'#b4a5844a',.65);}
   if(v.grid&&t!=='water')this.line([p(x+1,y),p(x+1,y+1),p(x,y+1)],'#44614826',.7);
   if(v.overlay==='roads'&&c.roads.has(key(x,y)))this.tile(x,y,c.connectedRoads.has(key(x,y))?'#61bea694':'#d875648f',.08,2);
   if(serviceReach?.has(key(x,y)))this.tile(x,y,'#76c9c2aa',.09,2);
   if(v.overlay==='appeal'&&t==='grass'){const value=appealDetails(c,{kind:'garden',x,y}).total;this.tile(x,y,`hsla(${25+value*1.1},45%,${48+value*.15}%,.65)`,.04,2);}
  }
  const objects:{depth:number;draw:()=>void}[]=[];
  for(let x=5;x<32;x++)for(let y=0;y<32;y++){const h=hash(x,y);if(terrain(x,y)==='grass'&&!buildingAt(c,x,y)&&!c.roads.has(key(x,y))&&((y<7||x>27||y>28)&&h>.42||x<8&&h>.5))objects.push({depth:x+y+1,draw:()=>this.tree(x+.5,y+.5,.7+h*.6,h>.8)});if(terrain(x,y)==='rock')objects.push({depth:x+y,draw:()=>this.slab(x+.1,y+.1,.8,.8,5+h*14,'#acac92','#8b8e79','#777e6e')});}
  for(const b of c.buildings){
   if(!this.seen.has(b.id))this.seen.set(b.id,v.time);
   if(this.tiers.has(b.id)&&this.tiers.get(b.id)!<b.tier)this.sparkles.set(b.id,v.time+2.2);this.tiers.set(b.id,b.tier);
   objects.push({depth:b.x+b.y+DEFS[b.kind].size,draw:()=>{ctx.save();const age=v.time-this.seen.get(b.id)!,s=DEFS[b.kind].size,[ax,ay]=p(b.x+s/2,b.y+s/2);if(age<.5&&b.kind!=='forum'){const scale=.8+.2*Math.sin(Math.min(1,age/.5)*Math.PI/2);ctx.translate(ax,ay);ctx.scale(1,scale);ctx.translate(-ax,-ay);ctx.globalAlpha=.5+Math.min(1,age/.5)*.5;}if(b.paused)ctx.globalAlpha*=.45;this.structure(b,v.time);ctx.restore();}});
  }
  const dt=Math.min(.1,Math.max(0,v.time-this.previousTime));this.previousTime=v.time;
  const roads=[...c.connectedRoads],count=Math.min(36,Math.ceil(c.population/7));this.walkers.length=Math.min(this.walkers.length,count);
  for(let i=0;i<count&&roads.length;i++){
   if(!this.walkers[i]||!c.connectedRoads.has(key(this.walkers[i].nx,this.walkers[i].ny))){const[x,y]=roads[(i*7)%roads.length].split(',').map(Number);this.walkers[i]={x,y,nx:x,ny:y,px:x,py:y,progress:1};}
   const w=this.walkers[i];w.progress+=dt*(.35+(i%3)*.1);
   if(w.progress>=1){w.px=w.x;w.py=w.y;w.x=w.nx;w.y=w.ny;const available=[[w.x+1,w.y],[w.x-1,w.y],[w.x,w.y+1],[w.x,w.y-1]].filter(([x,y])=>c.connectedRoads.has(key(x,y)));const forward=available.filter(([x,y])=>x!==w.px||y!==w.py);const choices=forward.length?forward:available;if(choices.length){const next=choices[Math.floor(hash(i,Math.floor(v.time))*choices.length)];w.nx=next[0];w.ny=next[1];}w.progress=0;}
   const x=w.x+(w.nx-w.x)*w.progress+.5,y=w.y+(w.ny-w.y)*w.progress+.5;
   objects.push({depth:x+y,draw:()=>{const[qx,qy]=p(x,y);this.ellipse(qx+1,qy+1,3,1.5,'#384c3933');const step=Math.sin(v.time*8+i)*1.2;this.line([[qx-1,qy],[qx-1-step,qy+1]],'#76644c',1);this.line([[qx+1,qy],[qx+1+step,qy+1]],'#76644c',1);this.line([[qx,qy-1],[qx,qy-5]],['#ad674e','#e9debe','#697a96','#5f7c5a'][i%4],3);this.ellipse(qx,qy-7,1.8,1.8,'#e0bc83');}});
  }
  const by=15+Math.sin(v.time*.025)*5;objects.push({depth:by+2,draw:()=>{const bx=1.5,[sx,sy]=p(bx,by);this.ellipse(sx+4,sy+4,23,6,'#d7ece51a');this.poly([p(bx-.25,by-.65),p(bx+.3,by-.4),p(bx+.3,by+.6),p(bx-.05,by+.8),p(bx-.3,by+.35)],'#866249');this.line([p(bx,by,0),p(bx,by,31)],'#796b4a',1.3);this.poly([p(bx,by,30),p(bx,by+.7,8),p(bx,by,8)],'#eadbb3');}});
  objects.sort((a,b)=>a.depth-b.depth);for(const o of objects)o.draw();
  for(const b of c.buildings){if(b.kind==='house'&&b.currentNeeds.length&&b.residents>0){const[x,y]=p(b.x+1,b.y+1,75);this.ellipse(x,y,7,7,'#f5ddb0');ctx.fillStyle='#945442';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText('!',x,y+3);}if(b.id===v.selected)this.outline(b.x,b.y,DEFS[b.kind].size,'#fff4cf',3);
   const until=this.sparkles.get(b.id)??0;if(until>v.time){ctx.save();ctx.globalAlpha=Math.min(1,(until-v.time));for(let i=0;i<3;i++){const[sx,sy]=p(b.x+.4+i*.55,b.y+1,65+(2.2-until+v.time)*10+i*6);this.line([[sx-3,sy],[sx+3,sy]],'#fff5c1',1.6);this.line([[sx,sy-4],[sx,sy+4]],'#fff5c1',1.6);}ctx.restore();}
  }
  if(v.hover){const[x,y]=v.hover;if(x>=0&&y>=0&&x<SIZE&&y<SIZE){const hovered=buildingAt(c,x,y);
   if(v.tool==='inspect'){if(hovered)this.outline(hovered.x,hovered.y,DEFS[hovered.kind].size,'#fff3d0',2);else this.outline(x,y,1,'#f5f2d48c',1.5);}
   else if(v.tool==='demolish'){this.outline(hovered?.x??x,hovered?.y??y,hovered?DEFS[hovered.kind].size:1,'#d16651',3);}
   else {const valid=canPlace(c,v.tool,x,y).valid,s=DEFS[v.tool].size;for(let dx=0;dx<s;dx++)for(let dy=0;dy<s;dy++)this.tile(x+dx,y+dy,valid?'#e9f1b878':'#d2685877',.04,4);if(v.tool!=='road'){ctx.save();ctx.globalAlpha=valid?.67:.3;this.structure({kind:v.tool,x,y,tier:1,connected:true,paused:false} as Building,v.time);ctx.restore();}this.outline(x,y,s,valid?'#fcf8c7':'#db7464',2.5);}
  }}ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
 }
 outline(x:number,y:number,size:number,color:string,width:number){this.line([p(x,y,3),p(x+size,y,3),p(x+size,y+size,3),p(x,y+size,3),p(x,y,3)],color,width);}
}

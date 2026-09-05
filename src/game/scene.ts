import { DEFS, SIZE, type Kind, type Service } from './config';
import { adjacent, appealDetails, buildingAt, canPlace, flood, key, terrain, type Building, type City } from './simulation';
import { buildingAsset, citizenFrames, sprites, type AssetName } from './assets';
import { advanceCitizens, citizenPose, type Citizen } from './citizens';
import { CITIZEN_POSES } from './citizen-art';

export interface Camera { x: number; y: number; zoom: number; }
export interface View { camera: Camera; hover: [number,number] | null; tool: Kind | 'inspect' | 'demolish'; selected: number | null; overlay: 'none' | 'roads' | 'appeal' | Service; grid: boolean; time: number; }
type Point = [number, number];
export const project = (x: number, y: number, z = 0): Point => [(x - y) * 64, (x + y) * 32 - z];
const p = project;
export function pick(sx: number, sy: number, camera: Camera): Point {
 const x = (sx - camera.x) / camera.zoom, y = (sy - camera.y) / camera.zoom;
 return [Math.floor(y / 64 + x / 128), Math.floor(y / 64 - x / 128)];
}
const hash = (x: number, y: number) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
const shore = (y: number) => 3.7 + Math.sin(y * .24) * 1.15;

export class Renderer {
 ctx: CanvasRenderingContext2D;
 width = 0; height = 0; dpr = 1;
 private patterns = new Map<string, CanvasPattern>();
 private seen = new Map<number, number>();
 private tiers = new Map<number, number>();
 private sparkles = new Map<number, number>();
 private walkers: Citizen[] = [];
 private previousTime = 0;
 private signature = '';
 private occupied = new Set<string>();
 private roadPoints: Point[] = [];
 private groundCanvas = document.createElement('canvas');
 private groundKey = '';
 private visible = { left: -Infinity, right: Infinity, top: -Infinity, bottom: Infinity };
 constructor(public canvas: HTMLCanvasElement) { this.ctx = canvas.getContext('2d', { alpha: false })!; }
 resize(w: number, h: number) {
  this.width = w; this.height = h; this.dpr = Math.min(window.devicePixelRatio || 1, 2);
  this.canvas.width = Math.round(w * this.dpr); this.canvas.height = Math.round(h * this.dpr);
  this.ctx.imageSmoothingEnabled = true; this.ctx.imageSmoothingQuality = 'high';
 }
 hitTest(sx: number, sy: number, camera: Camera, city: City): Point {
  const x = (sx - camera.x) / camera.zoom, y = (sy - camera.y) / camera.zoom;
  const buildings = [...city.buildings].sort((a,b) => b.x+b.y+DEFS[b.kind].size-a.x-a.y-DEFS[a.kind].size);
  for (const b of buildings) {
   const sprite = sprites.get(buildingAsset(b.kind,b.tier,b.x+b.y)); if (!sprite?.alpha) continue;
   const size=DEFS[b.kind].size,[cx,cy]=p(b.x+size/2,b.y+size/2);
   const width=size*128*(b.kind==='well'?.76:.97),height=width*sprite.height/sprite.width;
   const dx=x-(cx-width/2),dy=y-(cy+size*32-3-height);
   if(dx<0||dy<0||dx>=width||dy>=height)continue;
   const ix=Math.floor(sprite.x+dx/width*sprite.width),iy=Math.floor(sprite.y+dy/height*sprite.height);
   if(sprite.alpha[iy*sprite.image.naturalWidth+ix]>60)return[b.x,b.y];
  }
  return pick(sx,sy,camera);
 }
 private poly(points: Point[], fill: string) {
  const ctx = this.ctx; ctx.beginPath(); points.forEach((point, i) => i ? ctx.lineTo(...point) : ctx.moveTo(...point)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
 }
 private line(points: Point[], color: string, width = 1) {
  const ctx = this.ctx; ctx.beginPath(); points.forEach((point, i) => i ? ctx.lineTo(...point) : ctx.moveTo(...point)); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
 }
 private tile(x: number, y: number, fill: string, inset = 0, z = 1) { this.poly([p(x + inset, y + inset, z), p(x + 1 - inset, y + inset, z), p(x + 1 - inset, y + 1 - inset, z), p(x + inset, y + 1 - inset, z)], fill); }
 private outline(x: number, y: number, size: number, color: string, width = 2) { this.line([p(x,y,2),p(x+size,y,2),p(x+size,y+size,2),p(x,y+size,2),p(x,y,2)],color,width); }
 private ellipse(x: number, y: number, rx: number, ry: number, color: string) { const ctx = this.ctx; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
 private pattern(name: AssetName, span: number): CanvasPattern | string {
  const cacheKey = `${name}:${span}`;
  if (this.patterns.has(cacheKey)) return this.patterns.get(cacheKey)!;
  const sprite = sprites.get(name); if (!sprite) return name === 'water-texture' ? '#326e69' : name === 'road-texture' ? '#b5a68a' : '#626847';
  const pattern = this.ctx.createPattern(sprite.image, 'repeat')!;
  pattern.setTransform(new DOMMatrix().scale(span / sprite.image.naturalWidth, span / sprite.image.naturalHeight));
  this.patterns.set(cacheKey, pattern); return pattern;
 }
 private world(callback: () => void) { this.ctx.save(); this.ctx.transform(64, 32, -64, 32, 0, 0); callback(); this.ctx.restore(); }
 private isVisible(x: number, y: number, radius = 250) { return x + radius > this.visible.left && x - radius < this.visible.right && y + 80 > this.visible.top && y - radius < this.visible.bottom; }
 private sprite(name: AssetName, x: number, bottom: number, width: number, alpha = 1, flip = false) {
  const sprite = sprites.get(name); if (!sprite || !this.isVisible(x, bottom, width * 1.8)) return;
  const height = width * sprite.height / sprite.width, ctx = this.ctx;
  ctx.save(); ctx.globalAlpha *= alpha;
  if (flip) { ctx.translate(x * 2, 0); ctx.scale(-1, 1); }
  ctx.drawImage(sprite.image, sprite.x, sprite.y, sprite.width, sprite.height, x - width / 2, bottom - height, width, height);
  ctx.restore();
 }
 private shadow(name: AssetName, x: number, bottom: number, width: number, strength = .24) {
  const sprite=sprites.get(name);if(!sprite?.shadow||!this.isVisible(x,bottom,width*2))return;
  const height=width*sprite.height/sprite.width,ctx=this.ctx;
  ctx.save();ctx.globalAlpha=strength;ctx.translate(x,bottom);ctx.transform(1,.04,-.67,-.27,0,0);
  ctx.drawImage(sprite.shadow,-width/2,-height,width,height);ctx.restore();
 }
 private ground(c: City) {
  const ctx = this.ctx;
  this.world(() => {
   ctx.fillStyle = this.pattern('grass-texture', 7); ctx.fillRect(-70, -70, 170, 170);
   for (let x = -12; x < 46; x += 4) for (let y = -12; y < 46; y += 4) {
    const h = hash(x,y), gradient = ctx.createRadialGradient(x+2,y+2,0,x+2,y+2,3.8);
    gradient.addColorStop(0,h>.5?'#c7ad4420':'#203c251e'); gradient.addColorStop(1,'#35432400'); ctx.fillStyle=gradient;ctx.fillRect(x-2,y-2,8,8);
   }
   ctx.beginPath(); ctx.moveTo(-70,-70); ctx.lineTo(shore(-70)+.55,-70);
   for (let y=-70;y<=100;y+=.3)ctx.lineTo(shore(y)+.55,y);
   ctx.lineTo(-70,100);ctx.closePath();ctx.fillStyle='#a59b73';ctx.fill();
   ctx.beginPath();ctx.moveTo(-70,-70);ctx.lineTo(shore(-70),-70);
   for (let y=-70;y<=100;y+=.3)ctx.lineTo(shore(y),y);
   ctx.lineTo(-70,100);ctx.closePath();ctx.fillStyle=this.pattern('water-texture',9);ctx.fill();
   ctx.beginPath();for(let y=-25;y<65;y+=.2){if(y===-25)ctx.moveTo(shore(y)-.08,y);else ctx.lineTo(shore(y)-.08,y);}ctx.strokeStyle='#a9c1aa42';ctx.lineWidth=.13;ctx.stroke();
   ctx.fillStyle='#625b40';ctx.beginPath();for(const [x,y]of this.roadPoints)ctx.rect(x-.035,y-.035,1.07,1.07);ctx.fill();
   ctx.fillStyle=this.pattern('road-texture',1.5);ctx.beginPath();for(const[x,y]of this.roadPoints)ctx.rect(x,y,1,1);ctx.fill();
   ctx.lineWidth=.035;ctx.strokeStyle='#d6c6a082';ctx.beginPath();
   for(const[x,y]of this.roadPoints){if(!c.roads.has(key(x-1,y))){ctx.moveTo(x+.045,y+.04);ctx.lineTo(x+.045,y+.96);}if(!c.roads.has(key(x+1,y))){ctx.moveTo(x+.955,y+.04);ctx.lineTo(x+.955,y+.96);}if(!c.roads.has(key(x,y-1))){ctx.moveTo(x+.04,y+.045);ctx.lineTo(x+.96,y+.045);}if(!c.roads.has(key(x,y+1))){ctx.moveTo(x+.04,y+.955);ctx.lineTo(x+.96,y+.955);}}ctx.stroke();
  });
 }
 private structure(b: Building, time: number) {
  const size = DEFS[b.kind].size, [x, y] = p(b.x + size / 2, b.y + size / 2);
  const ctx = this.ctx, age = time - (this.seen.get(b.id) ?? time);
  const width = size * 128 * (b.kind === 'well' ? .76 : .97), bottom = y + size * 32 - 3;
  ctx.save();ctx.shadowColor='#1a211840';ctx.shadowBlur=15;this.ellipse(x+11,y+9,size*41,size*17,'#1a211833');ctx.restore();
  ctx.save();
  if(age<.45&&b.kind!=='forum'){const scale=.88+.12*Math.sin(Math.min(1,age/.45)*Math.PI/2);ctx.translate(x,bottom);ctx.scale(scale,scale);ctx.translate(-x,-bottom);ctx.globalAlpha=.35+.65*Math.min(1,age/.45);}
  this.sprite(buildingAsset(b.kind,b.tier,b.x+b.y),x,bottom,width,b.paused?.48:1);ctx.restore();
  if(b.kind==='workshop'&&b.connected&&!b.paused){for(let i=0;i<4;i++){const phase=(time*.18+i*.25)%1;const gradient=ctx.createRadialGradient(x+phase*28,y-size*27-phase*65,0,x+phase*28,y-size*27-phase*65,9+phase*18);gradient.addColorStop(0,`rgba(196,186,153,${.18*(1-phase)})`);gradient.addColorStop(1,'#b8b1a000');ctx.fillStyle=gradient;ctx.fillRect(x+phase*28-30,y-size*27-phase*65-30,60,60);}}
 }
 private badge(x: number, y: number, type: 'service' | 'warning') {
  const ctx = this.ctx;ctx.save();ctx.shadowColor='#0008';ctx.shadowBlur=5;
  this.ellipse(x,y,12,12,'#20271fee');ctx.shadowBlur=0;ctx.strokeStyle=type==='service'?'#cbb577':'#d69b63';ctx.lineWidth=1.2;ctx.stroke();
  if(type==='warning'){ctx.fillStyle='#efc17b';ctx.font='bold 15px Georgia';ctx.textAlign='center';ctx.fillText('!',x,y+5);}else {ctx.beginPath();ctx.moveTo(x,y-7);ctx.bezierCurveTo(x-2,y-3,x-6,y,x-5,y+3);ctx.bezierCurveTo(x-4,y+8,x+4,y+8,x+5,y+3);ctx.bezierCurveTo(x+6,y,x+2,y-3,x,y-7);ctx.fillStyle='#80c6be';ctx.fill();ctx.strokeStyle='#d7e4cc';ctx.lineWidth=.7;ctx.stroke();}ctx.restore();
 }
 draw(c: City, v: View) {
  const ctx=this.ctx,cam=v.camera;
  ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.fillStyle='#626847';ctx.fillRect(0,0,this.width,this.height);
  ctx.translate(cam.x,cam.y);ctx.scale(cam.zoom,cam.zoom);
  this.visible={left:-cam.x/cam.zoom,right:(this.width-cam.x)/cam.zoom,top:-cam.y/cam.zoom,bottom:(this.height-cam.y)/cam.zoom};
  const signature=[...c.roads].join('|')+';'+c.buildings.map(b=>`${b.id},${b.x},${b.y}`).join('|');
  if(signature!==this.signature){this.signature=signature;this.roadPoints=[...c.roads].map(k=>k.split(',').map(Number) as Point);this.occupied=new Set(c.roads);for(const b of c.buildings)for(let dx=0;dx<DEFS[b.kind].size;dx++)for(let dy=0;dy<DEFS[b.kind].size;dy++)this.occupied.add(key(b.x+dx,b.y+dy));}
  const groundKey=`${signature};${sprites.size};${this.canvas.width},${this.canvas.height};${cam.x},${cam.y},${cam.zoom}`;
  if(groundKey!==this.groundKey){
   this.groundKey=groundKey;this.groundCanvas.width=this.canvas.width;this.groundCanvas.height=this.canvas.height;
   const groundContext=this.groundCanvas.getContext('2d',{alpha:false})!;
   groundContext.setTransform(this.dpr,0,0,this.dpr,0,0);groundContext.translate(cam.x,cam.y);groundContext.scale(cam.zoom,cam.zoom);
   this.ctx=groundContext;this.ground(c);this.ctx=ctx;
  }
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(this.groundCanvas,0,0);ctx.restore();
  for(let i=0;i<24;i++){const y=-5+i*1.7,x=shore(y)-.4-hash(i,2)*3,[sx,sy]=p(x,y);if(this.isVisible(sx,sy,35)){const phase=(v.time*.2+i*.71)%1;this.line([[sx-8-phase*15,sy],[sx+8+phase*15,sy+2]],`rgba(205,229,201,${Math.sin(phase*Math.PI)*.12})`,.8);}}
  const selected=c.buildings.find(b=>b.id===v.selected);
  let reach:Map<string,number>|null=null;
  if(['well','market','bath','theater'].includes(v.overlay)){reach=new Map();for(const b of c.buildings.filter(b=>b.kind===v.overlay&&!b.paused))for(const[k,d]of(c.serviceRoutes.get(b.id)??[]))reach.set(k,d);}
  if(selected&&DEFS[selected.kind].range)reach=c.serviceRoutes.get(selected.id)??null;
  if(v.hover&&v.tool!=='inspect'&&v.tool!=='demolish'&&DEFS[v.tool].range)reach=flood(c.connectedRoads,adjacent({kind:v.tool,x:v.hover[0],y:v.hover[1]}),DEFS[v.tool].range);
  if(reach)for(const k of reach.keys()){const[x,y]=k.split(',').map(Number);this.tile(x,y,'#73cfc54d',.03);}
  if(v.overlay==='roads')for(const[x,y]of this.roadPoints)this.tile(x,y,c.connectedRoads.has(key(x,y))?'#65c5b955':'#dd80566a',.03);
  if(v.grid||v.overlay==='appeal')for(let x=0;x<SIZE;x++)for(let y=0;y<SIZE;y++)if(terrain(x,y)!=='water'){
   if(v.overlay==='appeal'){const value=appealDetails(c,{kind:'garden',x,y}).total;this.tile(x,y,`hsla(${25+value*1.1},52%,48%,.38)`,.035);}
   if(v.grid)this.line([p(x+1,y),p(x+1,y+1),p(x,y+1)],'#e6ddaa28',.8);
  }
  const objects:{depth:number;draw:()=>void;shadow?:()=>void}[]=[];
  for(let x=-9;x<44;x++)for(let y=-9;y<44;y++){
   const h=hash(x,y),[sx,sy]=p(x+.5,y+.5);if(!this.isVisible(sx,sy,230)||this.occupied.has(key(x,y)))continue;
   const closeToRoad=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>c.roads.has(key(x+dx,y+dy)));
   const distance=x-shore(y);
   if(distance>-.2&&distance<1.15&&h>.18){const xx=x+.15+h*.5,yy=y+.2+hash(y,x)*.5;objects.push({depth:xx+yy,draw:()=>{const[a,b]=p(xx,yy);this.sprite('riverbank',a,b+12,90+h*55);}});}
   if(distance<1.1)continue;
   if(h>.72&&!closeToRoad){this.sprite('meadow-detail',sx,sy+12,72+h*88,.85,h>.9);}
   const edge=x<8||x>27||y<8||y>28,grove=Math.sin(x*.58+y*.17)+Math.cos(y*.48-x*.25);
   const tree=!closeToRoad&&(edge?h>.46&&grove>-.4:h>.945&&grove>.6);
   if(tree){const xx=x+.25+h*.5,yy=y+.15+hash(y,x)*.7,cypress=h>.86,[a,b]=p(xx,yy),name=cypress?'cypress-tree':'olive-tree',width=cypress?49+h*17:90+h*53;objects.push({depth:xx+yy,draw:()=>this.sprite(name,a,b+6,width),shadow:()=>this.shadow(name,a,b+6,width,.28)});}
   else if(terrain(x,y)==='rock'||(!closeToRoad&&h>.88&&edge)){objects.push({depth:x+y+1,draw:()=>this.sprite('riverbank',sx,sy+10,60+h*40)});}
  }
  for(const b of c.buildings){
   if(!this.seen.has(b.id))this.seen.set(b.id,v.time);
   if(this.tiers.has(b.id)&&this.tiers.get(b.id)!<b.tier)this.sparkles.set(b.id,v.time+2.2);this.tiers.set(b.id,b.tier);
   const size=DEFS[b.kind].size,[sx,sy]=p(b.x+size/2,b.y+size/2);
   if(this.isVisible(sx,sy,size*160))objects.push({depth:b.x+b.y+size,draw:()=>this.structure(b,v.time),shadow:()=>this.shadow(buildingAsset(b.kind,b.tier,b.x+b.y),sx,sy+size*32-3,size*128*(b.kind==='well'?.76:.97),.27)});
  }
  const dt=Math.min(.1,Math.max(0,v.time-this.previousTime))*c.speed;this.previousTime=v.time;
  advanceCitizens(this.walkers,c.connectedRoads,c.population,dt);
  for(const citizen of this.walkers){
   const {x,y,facing,frame}=citizenPose(citizen),[a,b]=p(x,y);
   if(!this.isVisible(a,b,40))continue;
   objects.push({depth:x+y,draw:()=>{
    const pose=citizenFrames[facing*CITIZEN_POSES+frame];if(!pose)return;
    const scale=1/3;
    this.ellipse(a+2,b,4.5,2,'#18231c40');
    ctx.drawImage(pose.image,pose.x,pose.y,pose.width,pose.height,a-pose.anchorX*scale,b-pose.anchorY*scale,pose.width*scale,pose.height*scale);
   }});
  }
  const boatY=16+Math.sin(v.time*.018)*4,[bx,by]=p(1.8,boatY);
  objects.push({depth:boatY+1.8,draw:()=>{ctx.save();ctx.globalAlpha=.22;this.ellipse(bx+7,by+7,57,11,'#9ecbb5');ctx.restore();this.sprite('boat',bx,by+21+Math.sin(v.time)*1.2,113);}});
  objects.sort((a,b)=>a.depth-b.depth);for(const object of objects)object.shadow?.();for(const object of objects)object.draw();
  for(const b of c.buildings){const size=DEFS[b.kind].size,[x,y]=p(b.x+size/2,b.y+size/2);const sprite=sprites.get(buildingAsset(b.kind,b.tier,b.x+b.y));const top=y+size*32-(sprite?size*124*sprite.height/sprite.width:100)-15;
   if(b.kind==='house'&&b.residents>0&&b.currentNeeds.length)this.badge(x,top,'warning');
   else if(b.kind==='house'&&reach&&adjacent(b).some(k=>reach.has(k)))this.badge(x,top,'service');
   if(b.id===v.selected){ctx.save();ctx.shadowColor='#f5df8aaa';ctx.shadowBlur=9;this.outline(b.x,b.y,size,'#e9d194',2);ctx.restore();}
   const until=this.sparkles.get(b.id)??0;if(until>v.time){ctx.save();ctx.globalAlpha=Math.min(1,until-v.time);for(let i=0;i<4;i++){const sx=x-20+i*14,sy=top+35-(2.2-until+v.time)*18+i%2*9;this.line([[sx-3,sy],[sx+3,sy]],'#fff0b4',1.5);this.line([[sx,sy-4],[sx,sy+4]],'#fff0b4',1.5);}ctx.restore();}
  }
  if(v.hover){const[x,y]=v.hover;if(x>=0&&y>=0&&x<SIZE&&y<SIZE){const hovered=buildingAt(c,x,y);
   if(v.tool==='inspect'){if(hovered&&hovered.id!==v.selected)this.outline(hovered.x,hovered.y,DEFS[hovered.kind].size,'#f1e2b58c',1.5);}
   else if(v.tool==='demolish')this.outline(hovered?.x??x,hovered?.y??y,hovered?DEFS[hovered.kind].size:1,'#e09b72',2.5);
   else{const valid=canPlace(c,v.tool,x,y).valid,size=DEFS[v.tool].size;for(let dx=0;dx<size;dx++)for(let dy=0;dy<size;dy++)this.tile(x+dx,y+dy,valid?'#aedc9780':'#d46b6277',.02,3);
    if(v.tool!=='road'){const[a,b]=p(x+size/2,y+size/2);ctx.save();ctx.globalAlpha=valid?.62:.32;ctx.filter=valid?'sepia(.3) hue-rotate(30deg) saturate(.7)':'sepia(.5)';this.sprite(buildingAsset(v.tool,1),a,b+size*32-3,size*124);ctx.restore();}
    this.outline(x,y,size,valid?'#d5f0b9':'#eeac91',2);
    const[a,b]=p(x+size,y+size);ctx.save();ctx.font='16px Georgia';const label=`${DEFS[v.tool].name} · ${DEFS[v.tool].cost}`,width=ctx.measureText(label).width+24;ctx.fillStyle='#1c231eea';ctx.strokeStyle='#b39a62';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(a-width/2,b+10,width,30,4);ctx.fill();ctx.stroke();ctx.fillStyle='#f2e1b7';ctx.textAlign='center';ctx.fillText(label,a,b+30);ctx.restore();
   }
  }}
  ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
  const vignette=ctx.createRadialGradient(this.width*.53,this.height*.45,this.height*.35,this.width*.5,this.height*.5,Math.max(this.width,this.height)*.7);vignette.addColorStop(0,'#19241900');vignette.addColorStop(1,'#16201836');ctx.fillStyle=vignette;ctx.fillRect(0,0,this.width,this.height);
 }
}

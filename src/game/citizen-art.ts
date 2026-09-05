import { gaitFoot, WALK_FRAMES } from './citizens';

type Point = [number, number];
type Bone = { from: Point; to: Point; outline: number[] };
type Rig = { image: HTMLImageElement; scale: number; body: Bone; arms: [Bone, Bone][]; legs: [Bone, Bone, Bone][]; shoulders: Point[] };
export interface CitizenFrame { image: HTMLCanvasElement; x: number; y: number; width: number; height: number; anchorX: number; anchorY: number; }
export const CITIZEN_POSES = WALK_FRAMES + 1;
const bone = (from: Point, to: Point, outline: number[]): Bone => ({ from, to, outline });

// Landmarks are in the original artwork, so the renderer animates its textures and silhouette.
function frontRig(image: HTMLImageElement): Rig {
 return { image, scale: .028, shoulders: [[-5,-22],[4.2,-23.5]],
  body: bone([620,710],[616,220],[545,20,720,20,735,180,785,238,803,330,741,375,710,482,739,678,716,770,607,766,492,690,510,566,486,405,417,380,428,257,515,192]),
  arms: [
   [bone([440,380],[431,492],[414,358,469,366,465,423,460,507,411,507,400,453]),bone([431,492],[426,607],[412,469,462,480,457,555,457,611,432,651,405,638,398,575])],
   [bone([767,328],[812,425],[739,320,785,300,831,366,845,447,798,455,770,390]),bone([812,425],[834,551],[799,406,845,405,872,480,886,551,855,600,800,568,795,520])],
  ],
  legs: [
   [bone([550,710],[507,813],[522,674,600,718,558,788,528,850,475,837,486,772]),bone([507,813],[493,892],[479,791,533,822,520,888,551,920,510,946,466,907,449,852]),bone([493,892],[550,950],[466,867,518,871,544,910,592,942,579,976,531,980,486,946,454,907])],
   [bone([642,736],[670,897],[595,706,701,716,701,791,716,874,699,938,637,929,614,840,594,775]),bone([670,897],[723,1077],[630,877,701,889,723,966,752,1051,742,1100,694,1090,674,1022,636,944]),bone([723,1077],[816,1145],[695,1046,745,1038,773,1079,851,1117,886,1146,857,1177,799,1185,750,1155,699,1095])],
  ],
 };
}
function backRig(image: HTMLImageElement): Rig {
 return { image, scale: .0225, shoulders: [[-4,-21],[3.4,-19.5]],
  body: bone([535,990],[512,300],[420,55,615,45,646,265,623,308,667,358,718,531,686,594,637,610,650,724,707,949,680,995,631,1047,443,1037,359,963,383,863,399,726,421,661,388,589,377,520,302,483,287,435,335,329,414,284]),
  arms: [
   [bone([345,506],[345,658],[316,490,379,511,382,577,379,667,340,692,313,657,305,563]),bone([345,658],[362,747],[333,647,376,646,386,706,404,735,395,782,366,788,339,760,329,712])],
   [bone([661,585],[699,709],[619,581,684,554,708,642,728,721,690,735,654,691]),bone([699,709],[733,827],[683,699,729,687,752,754,771,809,756,868,720,880,698,852,708,809])],
  ],
  legs: [
   [bone([438,1020],[410,1140],[394,988,479,1026,455,1084,438,1160,400,1161,365,1124,375,1047]),bone([410,1140],[412,1265],[376,1105,443,1128,441,1194,446,1268,422,1290,394,1287,379,1224]),bone([412,1265],[483,1268],[386,1234,442,1240,484,1224,516,1240,514,1277,473,1310,425,1342,380,1336,370,1300])],
   [bone([590,1030],[585,1160],[548,1023,637,1012,626,1100,625,1184,574,1178,544,1119]),bone([585,1160],[589,1343],[551,1143,625,1149,633,1238,630,1345,587,1359,552,1323,550,1237]),bone([589,1343],[677,1375],[548,1311,627,1310,650,1324,697,1321,733,1355,726,1383,685,1411,612,1436,554,1423,542,1385])],
  ],
 };
}

/** Two-bone inverse kinematics keeps the ankle planted while the knee bends. */
function joint(start: Point, end: Point, upper: number, lower: number, bend = -1, maxBend = 1.4): Point {
 const dx=end[0]-start[0],dy=end[1]-start[1],distance=Math.max(.001,Math.hypot(dx,dy));
 const reach=Math.min(distance,upper+lower-.001),along=(upper*upper-lower*lower+reach*reach)/(2*reach);
 const across=Math.min(maxBend,Math.sqrt(Math.max(0,upper*upper-along*along)))*bend;
 return [start[0]+dx/distance*along-dy/distance*across,start[1]+dy/distance*along+dx/distance*across];
}
function drawBone(ctx: CanvasRenderingContext2D, rig: Rig, part: Bone, start: Point, end: Point) {
 const sx=part.to[0]-part.from[0],sy=part.to[1]-part.from[1],sourceLength=Math.hypot(sx,sy);
 const tx=end[0]-start[0],ty=end[1]-start[1],targetLength=Math.max(.001,Math.hypot(tx,ty));
 const ex=sx/sourceLength,ey=sy/sourceLength,fx=tx/targetLength,fy=ty/targetLength;
 const stretch=targetLength/sourceLength,width=rig.scale;
 const a=fx*stretch*ex+fy*width*ey,b=fy*stretch*ex-fx*width*ey;
 const c=fx*stretch*ey-fy*width*ex,d=fy*stretch*ey+fx*width*ex;
 ctx.save();ctx.transform(a,b,c,d,start[0]-a*part.from[0]-c*part.from[1],start[1]-b*part.from[0]-d*part.from[1]);
 ctx.beginPath();for(let i=0;i<part.outline.length;i+=2){if(i===0)ctx.moveTo(part.outline[i],part.outline[i+1]);else ctx.lineTo(part.outline[i],part.outline[i+1]);}ctx.closePath();ctx.clip();
 ctx.drawImage(rig.image,0,0);ctx.restore();
}
function drawPose(ctx: CanvasRenderingContext2D, rig: Rig, phase: number, back: boolean, idle: boolean) {
 const dx=.8944,dy=back?-.4472:.4472;
 const bob=idle?0:Math.cos(phase*Math.PI*4)*.24;
 const hipY=-11.5+bob,bodyHip:Point=[0,hipY];
 const feet:Point[]=[],offsets:number[]=[];
 for(let side=0;side<2;side++){
  // During stance, the foot moves back exactly as fast as the body moves forward.
  const gait=gaitFoot(phase+side*.5),offset=idle?0:gait.offset*Math.hypot(64,32),lift=idle?0:gait.lift;
  const lane=side===0?-1.8:1.8;
  feet.push([dx*offset-dy*lane,dy*offset+dx*lane*.45-lift]);offsets.push(offset);
 }
 const limbOrder=back?[1,0]:[0,1];
 const arm=(side:number)=>{
  const shoulder:Point=[rig.shoulders[side][0],rig.shoulders[side][1]+bob];
  const swing=-offsets[side]*.46;
  const hand:Point=[shoulder[0]+dx*swing,shoulder[1]+7.8+dy*swing];
  const elbow=joint(shoulder,hand,4.9,4.8,1,.6);
  drawBone(ctx,rig,rig.arms[side][0],shoulder,elbow);drawBone(ctx,rig,rig.arms[side][1],elbow,hand);
 };
 arm(limbOrder[0]);
 for(const side of limbOrder){
  const t=(phase+side*.5)%1,kneeBend=idle?0:t<.5?.25:.25+1.2*Math.sin((t-.5)*Math.PI*2);
  const hip:Point=[side===0?-1.6:1.6,hipY],ankle=feet[side],knee=joint(hip,ankle,7.2,8.2,-1,kneeBend);
  drawBone(ctx,rig,rig.legs[side][0],hip,knee);drawBone(ctx,rig,rig.legs[side][1],knee,ankle);
  drawBone(ctx,rig,rig.legs[side][2],ankle,[ankle[0]+dx*2.9,ankle[1]+dy*2.9]);
 }
 drawBone(ctx,rig,rig.body,bodyHip,[idle?0:Math.sin(phase*Math.PI*2)*.2,-25.5+bob]);
 arm(limbOrder[1]);
}

/** Bake a smooth textured skeletal walk once; the town still draws one sprite per person. */
export function buildCitizenFrames(front: HTMLImageElement, back: HTMLImageElement): CitizenFrame[] {
 const width=108,height=126,anchorX=54,anchorY=105;
 const atlas=document.createElement('canvas');atlas.width=width*CITIZEN_POSES;atlas.height=height*4;
 const ctx=atlas.getContext('2d')!;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 const rigs=[frontRig(front),backRig(back)],frames:CitizenFrame[]=[];
 // The original far leg is partly hidden by the tunic; use the complete leg texture for both limbs.
 rigs[0].legs[0]=rigs[0].legs[1];
 for(let facing=0;facing<4;facing++)for(let frame=0;frame<CITIZEN_POSES;frame++){
  const rear=facing>=2,mirror=facing===1||facing===2,x=frame*width,y=facing*height;
  ctx.save();ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();ctx.translate(x+anchorX,y+anchorY);ctx.scale(mirror?-3:3,3);
  drawPose(ctx,rigs[rear?1:0],frame/WALK_FRAMES,rear,frame===WALK_FRAMES);ctx.restore();
  frames.push({image:atlas,x,y,width,height,anchorX,anchorY});
 }
 return frames;
}

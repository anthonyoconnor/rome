import { CAPACITY, DEFS, GRACE, PERIOD, SERVICES, SIZE, START_COINS, TAX, UPGRADE_TIME, type Kind, type Service } from './config';

export interface Building { id: number; kind: Kind; x: number; y: number; tier: number; residents: number; growth: number; shortage: number; arrivals: number; paused: boolean; connected: boolean; appeal: number; born: number; assignments: Partial<Record<Service, number>>; needs: string[]; currentNeeds: string[]; }
export interface Event { id: number; title: string; message: string; type: 'growth' | 'unlock' | 'notice' | 'win'; }
export interface City { buildings: Building[]; roads: Set<string>; coins: number; elapsed: number; periodClock: number; month: number; speed: number; nextId: number; peak: number; population: number; jobs: number; employed: number; income: number; upkeep: number; net: number; prosperous: number; completed: boolean; continued: boolean; events: Event[]; connectedRoads: Set<string>; serviceUsed: Map<number, number>; serviceRoutes: Map<number, Map<string, number>>; }
export interface Placement { valid: boolean; reason: string; connected?: boolean; reached?: number; }
export const key = (x: number, y: number) => `${x},${y}`;
export const unkey = (k: string) => k.split(',').map(Number) as [number, number];
export const inMap = (x: number, y: number) => x >= 0 && y >= 0 && x < SIZE && y < SIZE;
export function terrain(x: number, y: number): 'grass' | 'sand' | 'water' | 'rock' {
 const shore = 3.2 + Math.sin(y * .24) * 1.15;
 if (x < shore) return 'water';
 if (x < shore + 1) return 'sand';
 if (x > 28 + Math.sin(y) && y < 8) return 'rock';
 return 'grass';
}
export function buildingAt(city: City, x: number, y: number) { return city.buildings.find(b => x >= b.x && y >= b.y && x < b.x + DEFS[b.kind].size && y < b.y + DEFS[b.kind].size); }
export function adjacent(b: Pick<Building, 'kind' | 'x' | 'y'>): string[] {
 const s = DEFS[b.kind].size, result: string[] = [];
 for (let i = 0; i < s; i++) result.push(key(b.x+i,b.y-1), key(b.x+i,b.y+s), key(b.x-1,b.y+i), key(b.x+s,b.y+i));
 return result;
}
export function flood(roads: Set<string>, starts: string[], max = Infinity): Map<string, number> {
 const distances = new Map<string, number>(); const queue: string[] = [];
 for (const k of starts) if (roads.has(k) && !distances.has(k)) { distances.set(k,0); queue.push(k); }
 for (let i=0;i<queue.length;i++) {
  const k=queue[i], d=distances.get(k)!; if(d>=max) continue;
  const [x,y]=unkey(k);
  for (const n of [key(x+1,y),key(x-1,y),key(x,y+1),key(x,y-1)]) if(roads.has(n)&&!distances.has(n)){distances.set(n,d+1);queue.push(n);}
 }
 return distances;
}
function makeBuilding(city: City, kind: Kind, x: number, y: number): Building {
 return { id: city.nextId++, kind, x, y, tier: kind==='house'?1:0, residents:0, growth:0, shortage:0, arrivals:0, paused:false, connected:false, appeal:0, born:city.elapsed, assignments:{}, needs:[], currentNeeds:[] };
}
export function createCity(): City {
 const c: City = { buildings:[], roads:new Set(), coins:START_COINS, elapsed:0, periodClock:0, month:0, speed:1, nextId:1, peak:0, population:0, jobs:0, employed:0, income:0, upkeep:0, net:0, prosperous:0, completed:false, continued:false, events:[], connectedRoads:new Set(), serviceUsed:new Map(), serviceRoutes:new Map() };
 c.buildings.push(makeBuilding(c,'forum',16,13));
 for(let x=10;x<=23;x++) c.roads.add(key(x,16));
 for(let y=17;y<SIZE;y++) c.roads.add(key(23,y));
 refresh(c); return c;
}
export function event(c: City, title: string, message: string, type: Event['type']='notice') { c.events.push({ id:c.nextId++, title,message,type }); if(c.events.length>25)c.events.shift(); }
export function canPlace(c: City, kind: Kind, x: number, y: number): Placement {
 const def=DEFS[kind];
 if(def.unlock && c.peak<def.unlock) return {valid:false,reason:`Unlocks at ${def.unlock} residents`};
 for(let dx=0;dx<def.size;dx++) for(let dy=0;dy<def.size;dy++) {
  if(!inMap(x+dx,y+dy))return {valid:false,reason:'Choose a place within your town'};
  const t=terrain(x+dx,y+dy);
  if(t==='water'||t==='rock')return {valid:false,reason:t==='water'?'Build on dry land':'This hillside is too rocky'};
  if(buildingAt(c,x+dx,y+dy)||c.roads.has(key(x+dx,y+dy)))return {valid:false,reason:'This space is already occupied'};
 }
 if(c.coins<def.cost)return {valid:false,reason:`Need ${def.cost} coins · pause surplus services to recover`};
 const connected=kind==='garden'||adjacent({kind,x,y}).some(k=>c.connectedRoads.has(k));
 let reached=0;
 if(def.range){const route=flood(c.connectedRoads,adjacent({kind,x,y}),def.range); reached=c.buildings.filter(b=>b.kind==='house'&&adjacent(b).some(k=>route.has(k))).length;}
 return { valid:true, connected, reached, reason:connected?(def.range?`Reaches ${reached} home${reached===1?'':'s'} · capacity ${def.capacity}`:kind==='road'?'Connected to the Forum':'Connected to the Forum'): 'Add a road to connect this building' };
}
export function place(c: City, kind: Kind, x: number, y: number): Placement {
 const check=canPlace(c,kind,x,y); if(!check.valid)return check;
 c.coins-=DEFS[kind].cost;
 if(kind==='road')c.roads.add(key(x,y));else c.buildings.push(makeBuilding(c,kind,x,y));
 refresh(c); return check;
}
export function demolish(c: City, x: number, y: number): boolean {
 const b=buildingAt(c,x,y);
 if(b?.kind==='forum')return false;
 if(b){c.coins+=DEFS[b.kind].cost*.75;c.buildings=c.buildings.filter(v=>v.id!==b.id);}
 else if(c.roads.delete(key(x,y)))c.coins+=DEFS.road.cost*.75;
 else return false;
 refresh(c); return true;
}
export function toggleBuilding(c: City, b: Building) { if(b.kind==='forum'||b.kind==='house')return; b.paused=!b.paused;refresh(c); }
export function appealDetails(c: City, b: Pick<Building,'x'|'y'|'kind'>) {
 const center=(v: typeof b)=>[v.x+DEFS[v.kind].size/2,v.y+DEFS[v.kind].size/2];
 const [x,y]=center(b); let gardens=0,civic=0,noise=0;
 for(const other of c.buildings){if(other.paused)continue;const[ox,oy]=center(other),d=Math.hypot(x-ox,y-oy);
  if(other.kind==='garden'&&d<=4.8)gardens+=12;
  if(other.connected&&other.kind==='forum'&&d<=7)civic+=16;
  if(other.connected&&other.kind==='bath'&&d<=6)civic+=18;
  if(other.connected&&other.kind==='theater'&&d<=7)civic+=22;
  if(other.connected&&other.kind==='workshop'&&d<=5)noise+=28;
 }
 return { base:12,gardens:Math.min(32,gardens),civic:Math.min(56,civic),noise:Math.min(56,noise),total:Math.max(0,Math.min(100,12+Math.min(32,gardens)+Math.min(56,civic)-Math.min(56,noise))) };
}
function distanceTo(c: City, p: Building, b: Building) { const route=c.serviceRoutes.get(p.id);if(!route)return Infinity;return Math.min(...adjacent(b).map(k=>route.get(k)??Infinity)); }
function providers(c: City, s: Service, b: Building) { return c.buildings.filter(p=>p.kind===s&&!p.paused&&p.connected&&distanceTo(c,p,b)!==Infinity).sort((a,z)=>distanceTo(c,a,b)-distanceTo(c,z,b)||a.id-z.id); }
function required(tier: number): Service[] { return SERVICES.slice(0,tier); }
function serviceMissing(c: City,b: Building,s: Service,targetTier: number) {
 const amount=CAPACITY[targetTier], assigned=c.buildings.find(p=>p.id===b.assignments[s]);
 const candidates=providers(c,s,b);
 const fits=candidates.some(p=>(DEFS[s].capacity!-(c.serviceUsed.get(p.id)??0)+(assigned?.id===p.id?CAPACITY[b.tier]:0))>=amount);
 if(fits)return '';
 const label={well:'Water',market:'Market',bath:'Bathhouse',theater:'Theater'}[s];
 return candidates.length?`${label} capacity is full`:`Needs ${label.toLowerCase()} within road reach`;
}
function blockers(c: City,b: Building,tier: number,current=false): string[] {
 if(!b.connected)return ['Connect a road to the Forum'];
 const result:string[]=[];
 for(const s of required(tier)){
  if(current){if(!b.assignments[s])result.push(serviceMissing(c,b,s,tier)||`Needs ${DEFS[s].name.toLowerCase()} service`);}
  else {const missing=serviceMissing(c,b,s,tier);if(missing)result.push(missing);}
 }
 const target=tier>=4?60:tier>=3?30:0;
 if(b.appeal<target)result.push(`Appeal ${Math.round(b.appeal)} / ${target} · add gardens or civic amenities`);
 return result;
}
export function refresh(c: City) {
 const forum=c.buildings.find(b=>b.kind==='forum')!;
 c.connectedRoads=new Set(flood(c.roads,adjacent(forum)).keys());
 c.serviceRoutes=new Map();c.serviceUsed=new Map();
 for(const b of c.buildings){b.connected=b.kind==='garden'||adjacent(b).some(k=>c.connectedRoads.has(k));if(SERVICES.includes(b.kind as Service)&&b.connected&&!b.paused)c.serviceRoutes.set(b.id,flood(c.connectedRoads,adjacent(b),DEFS[b.kind].range));}
 const homes=c.buildings.filter(b=>b.kind==='house');
 // First preserve valid reservations, then fill gaps. Construction order breaks ties.
 for(const s of SERVICES){
  for(const b of homes){const p=c.buildings.find(p=>p.id===b.assignments[s]);const need=CAPACITY[b.tier];
   if(!required(b.tier).includes(s)||!b.connected||!p||p.paused||!p.connected||distanceTo(c,p,b)===Infinity||(c.serviceUsed.get(p.id)??0)+need>DEFS[s].capacity!){delete b.assignments[s];continue;}
   c.serviceUsed.set(p.id,(c.serviceUsed.get(p.id)??0)+need);
  }
  for(const b of homes){if(!b.connected||b.assignments[s]||!required(b.tier).includes(s))continue;const need=CAPACITY[b.tier];
   const p=providers(c,s,b).find(p=>(c.serviceUsed.get(p.id)??0)+need<=DEFS[s].capacity!);
   if(p){b.assignments[s]=p.id;c.serviceUsed.set(p.id,(c.serviceUsed.get(p.id)??0)+need);}
  }
 }
 for(const b of homes){b.appeal=appealDetails(c,b).total;b.currentNeeds=blockers(c,b,b.tier,true);b.needs=b.tier===4?b.currentNeeds:blockers(c,b,b.tier+1);}
 c.population=homes.reduce((sum,b)=>sum+b.residents,0);c.peak=Math.max(c.peak,c.population);
 const active=c.buildings.filter(b=>b.connected&&!b.paused);
 c.jobs=active.reduce((sum,b)=>sum+DEFS[b.kind].jobs,0);
 const workers=Math.floor(c.population/2);c.employed=Math.min(workers,c.jobs);
 const civic=active.filter(b=>b.kind!=='workshop').reduce((sum,b)=>sum+DEFS[b.kind].jobs,0);
 const workshops=active.filter(b=>b.kind==='workshop').length;
 const staffed=Math.max(0,Math.min(workshops*24,workers-civic));
 c.income=homes.filter(b=>b.connected).reduce((sum,b)=>sum+b.residents*TAX[b.tier],0)+staffed*.5;
 c.upkeep=c.buildings.filter(b=>!b.paused).reduce((sum,b)=>sum+DEFS[b.kind].upkeep,0);
 c.net=c.income-c.upkeep;
}
function reserveUpgrade(c: City,b: Building) {
 const next=b.tier+1,amount=CAPACITY[next];
 const planned:Partial<Record<Service,number>>={};
 for(const s of required(next)){
  const old=b.assignments[s];
  const candidates=providers(c,s,b).sort((a,z)=>Number(z.id===old)-Number(a.id===old));
  const p=candidates.find(p=>(DEFS[s].capacity!-(c.serviceUsed.get(p.id)??0)+(p.id===old?CAPACITY[b.tier]:0))>=amount);
  if(!p)return false;planned[s]=p.id;
 }
 for(const s of required(next)){const old=b.assignments[s];if(old)c.serviceUsed.set(old,(c.serviceUsed.get(old)??0)-CAPACITY[b.tier]);const id=planned[s]!;c.serviceUsed.set(id,(c.serviceUsed.get(id)??0)+amount);}
 b.assignments=planned;b.tier=next;return true;
}
export function tick(c: City, dt: number) {
 const beforePeak=c.peak;c.elapsed+=dt;c.periodClock+=dt;
 const homes=c.buildings.filter(b=>b.kind==='house');
 for(const b of homes){
  if(b.currentNeeds.length){b.growth=0;b.shortage+=dt;
   if(b.shortage>=GRACE){b.residents=Math.max(0,b.residents-2*dt);if(b.tier>1){b.tier--;b.residents=Math.min(b.residents,CAPACITY[b.tier]);b.shortage=0;refresh(c);}}
  } else {
   b.shortage=0;
   const workers=Math.floor(c.population/2),employment=workers?Math.min(1,c.jobs/workers):1;
   b.arrivals+=dt*(employment<.65?.25:.7);
   if(b.arrivals>=1){const count=Math.floor(b.arrivals);b.arrivals-=count;b.residents=Math.min(CAPACITY[b.tier],b.residents+count);}
   if(b.tier<4&&b.needs.length===0&&b.residents>=CAPACITY[b.tier]*.5){b.growth+=dt;
    if(b.growth>=UPGRADE_TIME){if(reserveUpgrade(c,b)){event(c,'A neighborhood blossoms',`Your homes reached ${['','','cottages','courtyard homes','townhouses'][b.tier]}.`,'growth');refresh(c);}b.growth=0;}
   }else b.growth=0;
  }
 }
 refresh(c);
 for(const [threshold,name] of [[64,'Bathhouse'],[128,'Theater']] as const)if(beforePeak<threshold&&c.peak>=threshold)event(c,`${name} unlocked`,`Your town has welcomed ${threshold} residents. Find the ${name.toLowerCase()} in the build menu.`,'unlock');
 while(c.periodClock>=PERIOD){c.periodClock-=PERIOD;c.month++;c.coins+=c.net;c.prosperous=c.net>0?c.prosperous+1:0;
  if(!c.completed&&c.population>=256&&homes.filter(b=>b.tier===4).length>=8&&c.prosperous>=3){c.completed=true;event(c,'A town to be proud of','The charter is fulfilled. Little Rome has found its place in the world.','win');}
 }
}
export function charter(c: City) {
 const homes=c.buildings.filter(b=>b.kind==='house'),cottages=homes.filter(b=>b.tier>=2).length,top=homes.filter(b=>b.tier===4).length;
 return [
  {title:'A place to call home',text:'Welcome 16 residents',value:Math.min(16,c.peak),target:16,done:c.peak>=16},
  {title:'A lively neighborhood',text:'Grow 4 homes into cottages',value:Math.min(4,cottages),target:4,done:cottages>=4},
  {title:'Room to flourish',text:'Welcome 64 residents · unlock baths',value:Math.min(64,c.peak),target:64,done:c.peak>=64},
  {title:'The city finds its voice',text:'Welcome 128 residents · unlock theater',value:Math.min(128,c.peak),target:128,done:c.peak>=128},
  {title:'A flourishing town',text:'Reach 256 residents',value:Math.min(256,c.population),target:256,done:c.population>=256},
  {title:'A beautiful place to live',text:'Develop 8 townhouses',value:Math.min(8,top),target:8,done:top>=8},
  {title:'Built to prosper',text:'Earn a surplus for 3 months',value:Math.min(3,c.prosperous),target:3,done:c.prosperous>=3},
 ];
}

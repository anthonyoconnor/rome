import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

mkdirSync('work/sim', { recursive: true });
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc','src/game/config.ts','src/game/simulation.ts','--outDir','work/sim','--module','commonjs','--skipLibCheck','--target','ES2022','--moduleResolution','node','--noEmit','false']);
writeFileSync('work/sim/package.json', '{"type":"commonjs"}');
const require=createRequire(import.meta.url);
const { createCity, place, tick, refresh, demolish, toggleBuilding, key, flood, appealDetails }=require(path.resolve('work/sim/simulation.js'));
const { DEFS, CAPACITY }=require(path.resolve('work/sim/config.js'));
let passed=0;
function check(name,fn){fn();passed++;console.log(`PASS ${name}`);}
const advance=(c,seconds)=>{for(let i=0;i<seconds*2;i++)tick(c,.5);};
const put=(c,kind,x,y)=>{const r=place(c,kind,x,y);assert.ok(r.valid,`${kind} ${x},${y}: ${r.reason}`);return c.buildings.at(-1);};

check('Invalid construction spends nothing; demolition returns original cost only',()=>{
 const c=createCity(),cash=c.coins;assert.equal(place(c,'house',0,0).valid,false);assert.equal(c.coins,cash);
 const h=put(c,'house',10,17);h.tier=4;demolish(c,10,17);assert.equal(c.coins,cash-10);assert.equal(demolish(c,16,13),false);
});
check('Service reach follows roads, not direct geometric distance',()=>{
 const roads=new Set(['0,0','1,0','2,0','2,1','2,2','1,2','0,2']);
 const short=flood(roads,['0,0'],4);assert.equal(short.has('0,2'),false);assert.equal(flood(roads,['0,0'],6).get('0,2'),6);
});
check('Water starts immigration, and a broken road has a recoverable grace period',()=>{
 const c=createCity();put(c,'house',10,17);advance(c,20);assert.equal(c.population,0);put(c,'well',13,15);advance(c,20);assert.equal(c.population,8);
 const h=c.buildings.find(b=>b.kind==='house');demolish(c,10,16);demolish(c,11,16);assert.equal(h.connected,false);advance(c,30);assert.equal(h.residents,8);put(c,'road',11,16);advance(c,2);assert.equal(h.currentNeeds.length,0);assert.equal(h.residents,8);
});
check('Reservations cannot overbook and remain stable in a full neighborhood',()=>{
 const originalCapacity=DEFS.well.capacity;DEFS.well.capacity=64;
 const c=createCity();c.coins=10000;for(const x of [10,12,14,16,18,20])put(c,'house',x,17);const well=put(c,'well',15,15);put(c,'market',19,14);advance(c,100);
 const assigned=c.buildings.filter(b=>b.kind==='house').map(b=>({...b.assignments}));advance(c,100);
 c.buildings.filter(b=>b.kind==='house').forEach((b,i)=>assert.deepEqual(b.assignments,assigned[i]));
 for(const [id,used]of c.serviceUsed){const b=c.buildings.find(b=>b.id===id);assert.ok(used<=DEFS[b.kind].capacity);}
 assert.ok(c.buildings.some(b=>b.kind==='house'&&b.tier===2));assert.equal(c.serviceUsed.get(well.id),64);assert.ok(c.buildings.some(b=>b.needs.includes('Water capacity is full')));DEFS.well.capacity=originalCapacity;
});
check('Workshop noise and capped gardens create predictable appeal changes',()=>{
 const c=createCity();c.coins=10000;const h=put(c,'house',10,17),base=appealDetails(c,h).total;put(c,'workshop',12,17);assert.ok(appealDetails(c,h).total<base);
 for(const [x,y]of[[9,17],[9,18],[10,19],[11,19],[12,19]])put(c,'garden',x,y);
 assert.equal(appealDetails(c,h).gardens,32);
});
check('Suspending a building removes costs and output, with reopening available in debt',()=>{
 const c=createCity();const w=put(c,'workshop',19,17);const jobs=c.jobs;toggleBuilding(c,w);assert.equal(c.jobs,jobs-24);assert.equal(c.upkeep,0);c.coins=-10;toggleBuilding(c,w);assert.equal(c.jobs,jobs);assert.equal(c.upkeep,2);
});

check('A fresh town completes the entire charter using construction and earned income',()=>{
 const c=createCity();let waited=0;const actions=[];
 function build(kind,x,y){while(c.coins<DEFS[kind].cost){advance(c,10);waited+=10;assert.ok(waited<3600,'Economy stalled before an affordable building');}put(c,kind,x,y);actions.push({time:c.elapsed,kind,x,y});}
 for(let x=9;x<23;x++)build('road',x,22);for(let y=16;y<22;y++)build('road',9,y);
 for(const y of [17,20])for(const x of [10,12,14,16])build('house',x,y);
 build('well',13,15);build('well',13,23);build('market',19,17);build('market',19,20);
 while(c.population<128){advance(c,10);waited+=10;assert.ok(waited<1200,'Cottages did not fill');}
 for(const x of [10,11,12,13,14,15,16,17])build('garden',x,19);
 build('bath',10,14);build('bath',10,23);
 build('theater',19,13);build('theater',16,23);
 for(let y=16;y<=24;y++)build('road',24,y);
 for(const y of [16,19,22])build('workshop',25,y);
 while(!c.completed&&c.elapsed<2400)advance(c,10);
 const homes=c.buildings.filter(b=>b.kind==='house');
 console.log(JSON.stringify({seconds:c.elapsed,coins:Math.round(c.coins),population:c.population,net:c.net,homes:homes.map(h=>({x:h.x,y:h.y,tier:h.tier,appeal:h.appeal,needs:h.needs}))},null,2));
 assert.equal(c.completed,true,'Full charter must be attainable');assert.equal(c.population,256);assert.equal(homes.filter(h=>h.tier===4).length,8);assert.ok(c.coins>=0);
 for(const [id,used]of c.serviceUsed){const b=c.buildings.find(b=>b.id===id);assert.ok(used<=DEFS[b.kind].capacity);}
 const stable=homes.map(h=>[h.tier,h.residents]);advance(c,180);assert.deepEqual(homes.map(h=>[h.tier,h.residents]),stable);
 writeFileSync('work/charter-sequence.json',JSON.stringify(actions,null,2));
});
console.log(`${passed} mechanics checks passed.`);

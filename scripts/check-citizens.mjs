import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

mkdirSync('work/citizens', { recursive: true });
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', 'src/game/citizens.ts', '--outDir', 'work/citizens', '--module', 'commonjs', '--skipLibCheck', '--target', 'ES2022', '--moduleResolution', 'node', '--noEmit', 'false']);
writeFileSync('work/citizens/package.json', '{"type":"commonjs"}');
const require = createRequire(import.meta.url);
const { advanceCitizens, citizenPose, gaitFoot, WALK_FRAMES, WALK_STRIDE } = require(path.resolve('work/citizens/citizens.js'));
for(let i=0;i<50;i++){
 const phase=i/100,foot=gaitFoot(phase);
 assert.equal(foot.lift,0);
 assert.ok(Math.abs(phase*WALK_STRIDE+foot.offset-WALK_STRIDE/4)<1e-9,'A planted foot must stay fixed as the body travels');
}
assert.ok(gaitFoot(.75).lift>0);assert.equal(gaitFoot(0).offset,gaitFoot(1).offset);
console.log('PASS Planted feet stay fixed and swing feet lift in a continuous loop');
const roads = new Set(['0,0', '1,0', '2,0', '2,1', '2,2', '1,2', '0,2', '0,1']);
const citizens = [];
advanceCitizens(citizens, roads, 100, 0);
const paused = structuredClone(citizens);
for (let i = 0; i < 100; i++) advanceCitizens(citizens, roads, 100, 0);
assert.deepEqual(citizens, paused, 'Paused people must freeze their location, facing and gait');
console.log('PASS Pause freezes movement and animation');

const frames = new Set(), facings = new Set();
for (let i = 0; i < 1800; i++) {
 const previous = citizens.map(citizenPose);
 advanceCitizens(citizens, roads, 100, 1 / 30);
 citizens.forEach((citizen, index) => {
  const pose = citizenPose(citizen), before = previous[index];
  assert.ok(roads.has(`${Math.floor(pose.x)},${Math.floor(pose.y)}`), 'People must stay on actual streets');
  assert.ok(Math.hypot(pose.x - before.x, pose.y - before.y) < .02, 'Crossing a tile boundary must not teleport');
  const expectedFacing = citizen.nx > citizen.x ? 0 : citizen.ny > citizen.y ? 1 : citizen.nx < citizen.x ? 2 : 3;
  assert.equal(pose.facing, expectedFacing, 'The pose must face the direction of travel');
  frames.add(pose.frame); facings.add(pose.facing);
 });
}
assert.equal(frames.size, WALK_FRAMES); assert.equal(facings.size, 4);
console.log('PASS Full gait cycles, four directions, and continuous travel around corners');

const normal = structuredClone(paused), fast = structuredClone(paused), coarse = structuredClone(paused);
for (let i = 0; i < 270; i++) advanceCitizens(normal, roads, 100, 1 / 30);
for (let i = 0; i < 90; i++) advanceCitizens(fast, roads, 100, 3 / 30);
for (let i = 0; i < 30; i++) advanceCitizens(coarse, roads, 100, .3);
normal.forEach((citizen, index) => {
 for (const other of [fast[index], coarse[index]]) {
  assert.ok(Math.abs(citizen.distance - other.distance) < 1e-9);
  const a = citizenPose(citizen), b = citizenPose(other);
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 1e-9);
  assert.equal(a.frame, b.frame); assert.equal(a.facing, b.facing);
 }
});
console.log('PASS Fast speed and frame rate keep footsteps synchronized with travel');

const isolated = new Set(['8,8']);
advanceCitizens(citizens, isolated, 100, 1);
const waiting = structuredClone(citizens);
advanceCitizens(citizens, isolated, 100, 10);
assert.deepEqual(citizens, waiting, 'People without a street exit must stand still');
assert.ok(citizens.every(c => Math.floor(citizenPose(c).x) === 8 && Math.floor(citizenPose(c).y) === 8));
advanceCitizens(citizens, new Set(), 100, 1); assert.equal(citizens.length, 0);
console.log('PASS Removed roads and isolated streets do not produce walking in place or on grass');

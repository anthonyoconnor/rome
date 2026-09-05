type Point = [number, number];
export type Facing = 0 | 1 | 2 | 3; // SE, SW, NW, NE in the isometric view.
export interface Citizen {
 id: number;
 x: number; y: number; nx: number; ny: number;
 previousX: number; previousY: number;
 progress: number; distance: number; turns: number;
 facing: Facing;
}

const random = (id: number, salt: number) => {
 const value = Math.sin(id * 127.1 + salt * 311.7) * 43758.5453;
 return value - Math.floor(value);
};
const key = (x: number, y: number) => `${x},${y}`;
export const WALK_STRIDE = .24; // Road tiles covered by one complete left/right gait cycle.
const STRIDE = WALK_STRIDE;
export const WALK_FRAMES = 24;

export function gaitFoot(phase: number) {
 const t=((phase%1)+1)%1,stance=t<.5;
 return { offset: WALK_STRIDE*(stance?.25-t:t-.75), lift: stance?0:Math.sin((t-.5)*Math.PI*2)*1.5 };
}

function nextStreet(citizen: Citizen, roads: Set<string>) {
 const { x, y } = citizen;
 const neighbors: Point[] = [[x + 1, y], [x, y + 1], [x - 1, y], [x, y - 1]];
 const available = neighbors.filter(([nx, ny]) => roads.has(key(nx, ny)));
 const forward = available.filter(([nx, ny]) => nx !== citizen.previousX || ny !== citizen.previousY);
 const choices = forward.length ? forward : available;
 if (!choices.length) { citizen.nx = x; citizen.ny = y; return; }
 const [nx, ny] = choices[Math.floor(random(citizen.id, ++citizen.turns) * choices.length)];
 citizen.nx = nx; citizen.ny = ny;
 citizen.facing = nx > x ? 0 : ny > y ? 1 : nx < x ? 2 : 3;
}

/** Advance decorative residents using simulation time; no wall-clock animation while paused. */
export function advanceCitizens(citizens: Citizen[], roads: Set<string>, population: number, elapsed: number) {
 const count = roads.size ? Math.min(65, Math.ceil(population / 5)) : 0;
 citizens.length = Math.min(citizens.length, count);
 const streetKeys = [...roads];
 for (let id = 0; id < count; id++) {
  let citizen = citizens[id];
  if (!citizen || !roads.has(key(citizen.x, citizen.y)) || !roads.has(key(citizen.nx, citizen.ny))) {
   const [x, y] = streetKeys[Math.floor(random(id, 19) * streetKeys.length)].split(',').map(Number);
   citizen = { id, x, y, nx: x, ny: y, previousX: x, previousY: y, progress: 0,
    distance: random(id, 41) * STRIDE, turns: 0, facing: 0 };
   nextStreet(citizen, roads);
   citizens[id] = citizen;
  }
  let travel = Math.max(0, elapsed) * (.23 + random(id, 7) * .07);
  if (citizen.x === citizen.nx && citizen.y === citizen.ny && travel > 0) nextStreet(citizen, roads);
  while (travel > 0 && (citizen.x !== citizen.nx || citizen.y !== citizen.ny)) {
   const step = Math.min(travel, 1 - citizen.progress);
   citizen.progress += step; citizen.distance += step; travel -= step;
   if (citizen.progress >= 1 - 1e-10) {
    citizen.previousX = citizen.x; citizen.previousY = citizen.y;
    citizen.x = citizen.nx; citizen.y = citizen.ny; citizen.progress = 0;
    nextStreet(citizen, roads);
   }
  }
 }
}

export function citizenPose(citizen: Citizen) {
 const lane = .28 + random(citizen.id, 13) * .44;
 const moving = citizen.x !== citizen.nx || citizen.y !== citizen.ny;
 return {
  x: citizen.x + (citizen.nx - citizen.x) * citizen.progress + lane,
  y: citizen.y + (citizen.ny - citizen.y) * citizen.progress + lane,
  facing: citizen.facing,
  frame: moving ? Math.floor(citizen.distance / STRIDE * WALK_FRAMES) % WALK_FRAMES : WALK_FRAMES,
 };
}

import { DEFS, type Kind } from './config';
import { createCity, place, tick } from './simulation';

/** Development art review uses the real simulation and normal construction costs. */
export function createVisualScene(phase: string | null) {
 const city = createCity();
 if (!['early', 'growing', 'flourishing'].includes(phase ?? '')) return city;
 const advance = (seconds: number) => { for (let t = 0; t < seconds; t += .5) tick(city, .5); };
 const build = (kind: Kind, x: number, y: number) => {
  let wait = 0;
  while (city.coins < DEFS[kind].cost && wait < 3600) { advance(10); wait += 10; }
  const result = place(city, kind, x, y);
  if (!result.valid) throw new Error(`Visual scene ${kind}: ${result.reason}`);
 };
 for (let x = 9; x < 23; x++) build('road', x, 22);
 for (let y = 16; y < 22; y++) build('road', 9, y);
 for (const y of [17,20]) for (const x of [10,12,14,16]) build('house',x,y);
 build('well',13,15); build('well',13,23);
 build('market',19,17); build('market',19,20);
 advance(18);
 if (phase !== 'early') {
  while (city.population < 128 && city.elapsed < 1200) advance(10);
  for (let x = 10; x <= 17; x++) build('garden',x,19);
  build('bath',10,14); build('bath',10,23);
  advance(70);
  if (phase === 'flourishing') {
   build('theater',19,13); build('theater',16,23);
   for (let y = 16; y <= 24; y++) build('road',24,y);
   for (const y of [16,19,22]) build('workshop',25,y);
   while (!city.completed && city.elapsed < 2400) advance(10);
   advance(120);
   city.continued = true;
  }
 }
 city.speed = 0; city.events = [];
 return city;
}

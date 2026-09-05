export type Kind = 'road' | 'house' | 'well' | 'market' | 'workshop' | 'garden' | 'bath' | 'theater' | 'forum';
export type Service = 'well' | 'market' | 'bath' | 'theater';
export interface Definition { name: string; size: number; cost: number; upkeep: number; jobs: number; description: string; range?: number; capacity?: number; unlock?: number; shortcut: string; }
export const SIZE = 32;
export const START_COINS = 1400;
export const PERIOD = 10;
export const UPGRADE_TIME = 20;
export const GRACE = 60;
export const CAPACITY = [0, 8, 16, 24, 32];
export const TAX = [0, .18, .25, .34, .45];
export const TIERS = ['Empty plot', 'Huts', 'Cottages', 'Courtyard homes', 'Townhouses'];
export const SERVICES: Service[] = ['well', 'market', 'bath', 'theater'];
export const BUILD_ORDER: Kind[] = ['road', 'house', 'well', 'market', 'garden', 'workshop', 'bath', 'theater'];
export const DEFS: Record<Kind, Definition> = {
 road: { name: 'Road', size: 1, cost: 2, upkeep: 0, jobs: 0, description: 'Connect your neighborhoods to the Forum. Drag to lay a street.', shortcut: '1' },
 house: { name: 'Homes', size: 2, cost: 40, upkeep: 0, jobs: 0, description: 'A place to begin. Water welcomes residents; services help their homes flourish.', shortcut: '2' },
 well: { name: 'Well', size: 1, cost: 70, upkeep: 2, jobs: 0, description: 'Fresh water for 128 residents, within 8 steps along the road.', range: 8, capacity: 128, shortcut: '3' },
 market: { name: 'Market', size: 2, cost: 150, upkeep: 6, jobs: 6, description: 'A lively neighborhood market. Helps huts grow into cottages.', range: 12, capacity: 192, shortcut: '4' },
 garden: { name: 'Garden', size: 1, cost: 18, upkeep: .2, jobs: 0, description: 'A little breathing room. Adds nearby appeal, up to a combined garden bonus of 32.', shortcut: '5' },
 workshop: { name: 'Workshop', size: 2, cost: 120, upkeep: 2, jobs: 24, description: 'Creates 24 jobs and earns up to 12 coins per month. Keep the noise away from homes.', shortcut: '6' },
 bath: { name: 'Bathhouse', size: 2, cost: 220, upkeep: 8, jobs: 8, description: 'Civic comfort for courtyard homes. Adds 18 appeal nearby.', range: 12, capacity: 192, unlock: 64, shortcut: '7' },
 theater: { name: 'Theater', size: 3, cost: 320, upkeep: 10, jobs: 12, description: 'A stage for a growing town. Helps beautiful neighborhoods become townhouses.', range: 12, capacity: 256, unlock: 128, shortcut: '8' },
 forum: { name: 'Forum', size: 3, cost: 0, upkeep: 0, jobs: 16, description: 'The heart of Little Rome. Connected homes pay taxes here. Provides 16 civic jobs.', shortcut: '' },
};

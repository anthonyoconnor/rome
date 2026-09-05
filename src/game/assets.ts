import type { Kind } from './config';
import { buildCitizenFrames, type CitizenFrame } from './citizen-art';

export const ASSET_NAMES = ['house1', 'house2', 'house3', 'house4', 'house4-villa', 'house4-residence', 'well', 'market', 'workshop', 'garden', 'bath', 'theater', 'forum', 'grass-texture', 'road-texture', 'water-texture', 'olive-tree', 'cypress-tree', 'riverbank', 'meadow-detail', 'boat', 'citizen', 'citizen-back'] as const;
export type AssetName = typeof ASSET_NAMES[number];
export interface Sprite { image: HTMLImageElement; x: number; y: number; width: number; height: number; alpha?: Uint8Array; shadow?: HTMLCanvasElement; }
export const sprites = new Map<AssetName, Sprite>();
export const citizenFrames: CitizenFrame[] = [];
export const assetUrl = (name: AssetName) => `/art/${name}.png`;
export const buildingAsset = (kind: Kind, tier = 2, variant = 0): AssetName => kind === 'house' ? tier === 4 ? (['house4', 'house4-villa', 'house4-residence'] as const)[Math.abs(variant) % 3] : `house${Math.max(1, Math.min(4, tier))}` as AssetName : kind === 'road' ? 'road-texture' : kind;

let pending: Promise<void> | undefined;
export function loadArtwork(onProgress?: (count: number) => void): Promise<void> {
 if (pending) return pending;
 pending = Promise.all(ASSET_NAMES.map(name => new Promise<void>((resolve, reject) => {
  const image = new Image();
  image.onload = () => {
   try {
   let x = 0, y = 0, width = image.naturalWidth, height = image.naturalHeight;
   let alpha: Uint8Array | undefined;
   // Find the visible sprite, so transparent export margins never change its world scale.
   if (!name.endsWith('-texture')) {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, width, height).data;
    let left = width, top = height, right = 0, bottom = 0;
    alpha = new Uint8Array(width * height);
    for (let py = 0; py < height; py++) for (let px = 0; px < width; px++) {
     const value = pixels[(py * width + px) * 4 + 3]; alpha[py * width + px] = value;
     if (value > 20) { left = Math.min(left, px); right = Math.max(right, px); top = Math.min(top, py); bottom = Math.max(bottom, py); }
    }
    if (right > left && bottom > top) { x = left; y = top; width = right - left + 1; height = bottom - top + 1; }
   }
   let shadow: HTMLCanvasElement | undefined;
   if (alpha) {
    shadow = document.createElement('canvas'); shadow.width = 512; shadow.height = Math.ceil(512 * height / width);
    const context = shadow.getContext('2d')!;
    context.filter = 'blur(3px)';
    context.drawImage(image, x, y, width, height, 0, 0, shadow.width, shadow.height);
    context.filter = 'none';
    context.globalCompositeOperation = 'source-in'; context.fillStyle = '#142219'; context.fillRect(0, 0, shadow.width, shadow.height);
   }
   sprites.set(name, { image, x, y, width, height, alpha, shadow }); onProgress?.(sprites.size); resolve();
   } catch (error) { reject(error); }
  };
  image.onerror = () => reject(new Error(`Could not load ${name}`));
  image.src = assetUrl(name);
 }))).then(() => { citizenFrames.splice(0, citizenFrames.length, ...buildCitizenFrames(sprites.get('citizen')!.image, sprites.get('citizen-back')!.image)); }).catch(error => { pending = undefined; throw error; });
 return pending;
}

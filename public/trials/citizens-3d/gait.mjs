export const TAU = Math.PI * 2;
export const HIP_HEIGHT = .91;
export const LEG_LENGTH = .445;
export const ANKLE_HEIGHT = .105;
export const ROAD_HEIGHT = .12;
export const STRAIGHT = 12.8;
export const TURN_RADIUS = 1.15;
export const ROUTE_LENGTH = STRAIGHT * 2 + TAU * TURN_RADIUS;
export const wrap = (value, length = 1) => ((value % length) + length) % length;
export const smooth = t => t * t * (3 - 2 * t);

// The planted foot travels backwards by exactly the distance travelled by the body.
// A longer stance gives a short, natural interval with both feet on the ground.
export function footPose(phase, stride = 1.02) {
 const p = wrap(phase), contact = .58, half = stride * contact / 2;
 if (p < contact) return { z: half - stride * p, lift: 0, pitch: 0, planted: true };
 const swing = (p - contact) / (1 - contact);
 return { z: -half + half * 2 * smooth(swing), lift: .16 * Math.sin(Math.PI * swing) ** 1.3,
  pitch: -.24 * Math.sin(TAU * swing), planted: false };
}

export function solveLimb(down, forward, upper, lower, bend = 1) {
 const distance = Math.min(upper + lower - .00001, Math.max(.00001, Math.hypot(down, forward)));
 const clamp = x => Math.max(-1, Math.min(1, x));
 const a = Math.acos(clamp((upper * upper + distance * distance - lower * lower) / (2 * upper * distance)));
 const knee = Math.PI - Math.acos(clamp((upper * upper + lower * lower - distance * distance) / (2 * upper * lower)));
 return { upper: Math.atan2(-forward, down) - a * bend, lower: knee * bend };
}

// A continuous road circuit: two straight lanes and a semicircle at each end.
export function roadPose(distance, straight = STRAIGHT, radius = TURN_RADIUS) {
 let d = wrap(distance, straight * 2 + TAU * radius);
 if (d < straight) return { x: -straight / 2 + d, z: -radius, yaw: Math.PI / 2, straight: true };
 d -= straight;
 if (d < Math.PI * radius) {
  const a = d / radius;
  return { x: straight / 2 + Math.sin(a) * radius, z: -Math.cos(a) * radius, yaw: Math.PI / 2 - a, straight: false };
 }
 d -= Math.PI * radius;
 if (d < straight) return { x: straight / 2 - d, z: radius, yaw: -Math.PI / 2, straight: true };
 d -= straight;
 const a = d / radius;
 return { x: -straight / 2 - Math.sin(a) * radius, z: Math.cos(a) * radius, yaw: -Math.PI / 2 - a, straight: false };
}

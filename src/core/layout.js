// Active region facade. Every module reads the map through this file, so render, collision,
// pathfinding and minimap always agree. setRegion() swaps the whole map (live ES bindings).
import forest from './regions/forest.js';
import village from './regions/village.js';
export { mulberry32, WATER_LEVEL, BRIDGE_LEN, BRIDGE_RISE } from './regionkit.js';
export const REGIONS = { forest, village };
let cur = forest;
export let NAME, TITLE, SIZE, PLAY_RADIUS, RIVER_START, RIVER_END, WATERFALL, BRIDGES, STONES_Z, STONES, LANDMARKS, ENTRANCE, SPAWN, EXITS, PATHS, SOLIDS, TREES, ROCKS;
const listeners = [];
export function onRegionChange(f) { listeners.push(f); }
export function setRegion(name) {
  cur = REGIONS[name] || forest;
  ({ NAME, TITLE, SIZE, PLAY_RADIUS, RIVER_START, RIVER_END, WATERFALL, BRIDGES, STONES_Z, STONES, LANDMARKS, ENTRANCE, SPAWN, EXITS, PATHS, SOLIDS, TREES, ROCKS } = cur);
  for (const f of listeners) f(name);
}
setRegion('forest');
export const riverX = (z) => cur.riverX(z);
export const riverHalf = (z) => cur.riverHalf(z);
export const riverDistance = (x, z) => cur.riverDistance(x, z);
export const pathDistance = (x, z) => cur.pathDistance(x, z);
export const groundHeight = (x, z) => cur.groundHeight(x, z);
export const walkHeight = (x, z) => cur.walkHeight(x, z);
export const onBridge = (x, z) => cur.onBridge(x, z);
export const inWater = (x, z) => cur.inWater(x, z);
export const solidsNear = (x, z) => cur.solidsNear(x, z);
export const walkable = (x, z, r) => cur.walkable(x, z, r);
export const canStep = (ax, az, bx, bz, r) => cur.canStep(ax, az, bx, bz, r);
/** Landmark by id across all regions (quests refer to forest places while the player is elsewhere). */
export function landmarkOf(id) { for (const r of Object.values(REGIONS)) { const l = r.LANDMARKS.find((x) => x.id === id); if (l) return l; } return null; }

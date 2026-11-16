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
/** Opens or closes a bridge of any region; listeners (nav grid, minimap) refresh when the active map changed. */
export function setBridgeOpen(region, id, open) {
  const r = REGIONS[region]; if (!r || !r.setBridgeOpen(id, open)) return false;
  if (r === cur) for (const f of listeners) f(cur.NAME);
  return true;
}
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

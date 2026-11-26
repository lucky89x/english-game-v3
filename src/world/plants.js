// The user's plant and produce pack (24/11): birch and apple trees, berry and flower bushes, grass, ferns and wild flowers scattered over the
// village, pumpkins and corn by the farm, apples under the orchard trees, crates and baskets by the stalls. Each kind is drawn as instanced meshes
// (a few draw calls for hundreds of plants). Positions come from a seeded generator of its own, so the older scenery does not move.
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { restyle } from './foliage.js';
import { NEW_TREES, ORCHARD_TREES, STALLS } from '../core/regions/village.js';

const FILES = ['tree_birch', 'tree_apple', 'bush_red_berries', 'bush_white_flowers', 'grass_daisies', 'grass_buttercups', 'grass_lavender', 'grass_meadow', 'grass_dense', 'fern_lush', 'fern_upright', 'dandelion', 'wild_herb', 'clover_patch',
  'pumpkin', 'corn_plant_ripe', 'cabbage', 'apple_pile', 'apple_basket', 'apple_crate', 'corn_crate', 'orange_basket'];
function mulberry32(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const CELL = 40, ROOTS = new Set();
let DENSITY = 1;
function applyDetail(root) { for (const c of root.userData.cells || []) if (c.thin) c.inst.count = Math.max(1, Math.ceil(c.full * DENSITY)); }
/** Share of the grass, ferns and flowers that is drawn (graphics level): 1 = all of them. */
export function plantDetail(density) { DENSITY = Math.max(0.05, Math.min(1, density)); for (const r of [...ROOTS]) { if (!r.parent) { ROOTS.delete(r); continue; } applyDetail(r); } }
/** Hides the squares of small plants farther than `far` metres from the hero (called a few times a second). */
export function plantCull(x, z, far) { for (const r of ROOTS) if (r.visible) for (const c of r.userData.cells) c.inst.visible = Math.hypot(c.x - x, c.z - z) < far + CELL * 0.7; }
/** load(name) -> Promise<Object3D> (a clone of assets/models/<name>.glb). Returns a Group (add it to the scene; hide it outside the village). */
export async function buildPlants(load, region = 'village') {
  const V = region === 'village', R = L.REGIONS[region], root = new THREE.Group(); root.name = 'plants-' + region;
  const src = {};
  await Promise.all(FILES.map(async (f) => { try { src[f] = await load(`plants/${f}`); } catch (e) { /* the file is missing: that kind is skipped */ } }));
  for (const f of Object.keys(src)) restyle(f, src[f]);      // (25/11) soft crowns instead of the pack's paper-leaf cards (world/foliage.js)
  const lists = {}; const rnd = mulberry32(240411);
  const put = (kind, x, z, s = 1, ry = 0, dy = 0) => { if (!src[kind]) return; (lists[kind] || (lists[kind] = [])).push({ x, z, s, ry, dy }); };
  const solids = [...(R.solids || []), ...(R.lateSolids || [])];
  const ok = (x, z, clear = 0.7) => R.walkable(x, z, 0.3) && !R.inWater(x, z) && R.pathDistance(x, z) > 1.3 && R.groundHeight(x, z) > 0.05 && R.riverDistance(x, z) > 5.6 && !solids.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + clear);
  // trees (solid: NEW_TREES is also in the region's lateSolids)
  if (V) NEW_TREES.forEach(([x, z], i) => put(i % 2 ? 'tree_apple' : 'tree_birch', x, z, 1.55 + (i % 3) * 0.12, rnd() * 6.28));
  // bushes
  let n = 0; for (let k = 0; k < 2400 && n < (V ? 110 : 90); k++) { const a = rnd() * 6.28, r = (V ? 12 : 8) + rnd() * 82, x = Math.sin(a) * r, z = Math.cos(a) * r; if (!ok(x, z, 1.4) || R.lateClear && R.lateClear(x, z)) continue; put(n % 2 ? 'bush_red_berries' : 'bush_white_flowers', x, z, 0.9 + rnd() * 0.45, rnd() * 6.28); n++; }
  // grass, ferns and wild flowers: many small ones, clustered
  const GROUND = [['grass_meadow', 1.5, 90], ['grass_dense', 1.4, 80], ['grass_daisies', 1.5, 60], ['grass_buttercups', 1.5, 60], ['grass_lavender', 1.5, 45], ['fern_lush', 1.3, 30], ['fern_upright', 1.4, 30], ['dandelion', 1.5, 35], ['wild_herb', 1.5, 30], ['clover_patch', 2.0, 40]];
  const KIND = { village: null, harbor: /meadow|daisies|buttercups|lavender|dandelion|clover/, forest: /dense|fern|herb|lavender|clover|meadow/ }[region];
  for (const [kind, s, count] of GROUND) { if (KIND && !KIND.test(kind)) continue; let m = 0; for (let k = 0; k < count * 30 && m < count * 2.1; k++) { const a = rnd() * 6.28, r = 4 + Math.sqrt(rnd()) * 90, x = Math.sin(a) * r, z = Math.cos(a) * r; if (!ok(x, z, 0.5) || R.lateClear && R.lateClear(x, z) && rnd() < 0.7) continue; put(kind, x, z, s * (0.8 + rnd() * 0.5), rnd() * 6.28); m++; } }
  if (V) {
  // the farm: pumpkins at the south edge of the beds, cabbages in front, a row of corn along the east side
  for (let i = 0; i < 7; i++) put('pumpkin', -28.5 + i * 1.9 + rnd() * 0.4, 37.6 + rnd() * 0.6, 1.5 + rnd() * 0.4, rnd() * 6.28);
  for (let i = 0; i < 5; i++) put('cabbage', -29.2 + i * 2.6, 23.4 + rnd() * 0.3, 1.7, rnd() * 6.28);
  for (let i = 0; i < 9; i++) put('corn_plant_ripe', -14 + rnd() * 0.5, 24.5 + i * 1.5, 1.35 + rnd() * 0.25, rnd() * 6.28);
  // the orchard: windfall apples under the trees, a basket and a crate by the gate
  ORCHARD_TREES.forEach(([x, z], i) => { for (let k = 0; k < 2; k++) put('apple_pile', x + 1.3 * Math.cos(i * 2 + k * 3), z + 1.3 * Math.sin(i * 2 + k * 3), 1.5, rnd() * 6.28); });
  put('apple_basket', 38.4, 14.4, 1.5, 0.6); put('apple_crate', 40.6, 14.8, 1.5, -0.4); put('apple_basket', 33.6, 8.2, 1.4, 1.2);
  // by the fruit and vegetable stall
  const sp = STALLS.produce; put('corn_crate', sp.x - 0.3, sp.z - 2.7, 1.5, 0.3); put('apple_crate', sp.x - 0.2, sp.z + 2.7, 1.5, -0.2); put('orange_basket', sp.x - 1.6, sp.z + 2.9, 1.4, 0.8);
  }
  // draw each kind as instanced meshes
  // (26/11) The grass, ferns and bushes are cut into CELL-metre squares, each its own instanced mesh with a bounding sphere, so the
  // squares behind the camera are not drawn, the far ones are hidden (plantCull) and the low graphics levels draw fewer of them
  // (plantDetail). Before, every plant of the map (about four million triangles in the village) was drawn in every frame.
  const tmp = new THREE.Matrix4(), mm = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const groundKind = new Set(GROUND.map((g) => g[0])), cells = [];
  for (const [kind, list] of Object.entries(lists)) {
    const scene = src[kind]; scene.updateMatrixWorld(true);
    const small = groundKind.has(kind) || /^bush_/.test(kind), groups = new Map();
    for (const p of list) { const key = small ? Math.floor(p.x / CELL) + ',' + Math.floor(p.z / CELL) : 'all'; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(p); }
    scene.traverse((o) => {
      if (!o.isMesh) return;
      const local = o.matrixWorld;
      for (const part of groups.values()) {
        const inst = new THREE.InstancedMesh(o.geometry, o.material, part.length); let cx = 0, cz = 0;
        part.forEach((p, i) => { const y = R.groundHeight(p.x, p.z) + p.dy; q.setFromEuler(e.set(0, p.ry, 0)); mm.compose(v.set(p.x, y, p.z), q, sc.set(p.s, p.s, p.s)); tmp.multiplyMatrices(mm, local); inst.setMatrixAt(i, tmp); cx += p.x; cz += p.z; });
        inst.instanceMatrix.needsUpdate = true; inst.castShadow = /tree|bush|crate|basket|pumpkin|corn/.test(kind); inst.receiveShadow = false;
        inst.computeBoundingSphere(); inst.frustumCulled = true;
        if (small) cells.push({ inst, x: cx / part.length, z: cz / part.length, full: part.length, thin: groundKind.has(kind) });
        root.add(inst);
      }
    });
  }
  root.userData.cells = cells; ROOTS.add(root); applyDetail(root);
  return root;
}

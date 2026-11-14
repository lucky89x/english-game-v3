// Forest of Memories — single source of truth for the map (pure math, no three.js).
// Terrain height, river, paths, bridges, landmarks and obstacles all come from here, so the
// rendered world, the collision, the pathfinding and the minimap always agree.
// Axes: x = east, z = south, y = up; 1 unit = 1 m. Layout follows the forest reference painting:
// waterfall at the north cliff, river winding south, two arched bridges, stepping stones,
// ancient tree, ruins, woodcutter's cottage, crystal cave, giant mushrooms, camp, watchtower.

export const SIZE = 150;            // terrain edge length
export const PLAY_RADIUS = 68;      // the player stays inside this circle
export const WATER_LEVEL = -0.35;
export const RIVER_HALF = 3.4;
export const BRIDGE_LEN = 11.5;
export const BRIDGE_RISE = 0.95;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const gauss = (d, s) => Math.exp(-(d * d) / (2 * s * s));

export function riverX(z) { return -6 + 12 * Math.sin((z + 50) * 0.05) + 5 * Math.sin(z * 0.11); }
export const RIVER_START = -52;     // the waterfall
/** Half width of the river at z (wider pond around z = 22). */
export function riverHalf(z) { return RIVER_HALF + 2.6 * gauss(z - 22, 5); }
export function riverDistance(x, z) { return z < RIVER_START ? 99 : Math.abs(x - riverX(z)); }

export const BRIDGES = [
  { id: 'north', z: -14, name: 'North Bridge' },
  { id: 'south', z: 34, name: 'South Bridge' },
].map((b) => ({ ...b, x: riverX(b.z) }));
export const STONES_Z = 8;
export const STONES = (() => {
  const cx = riverX(STONES_Z), out = [];
  for (let i = -3; i <= 3; i++) out.push({ x: cx + i * 1.55, z: STONES_Z + (i % 2 ? 0.35 : -0.25), r: 0.72 });
  return out;
})();

/** Named places: en = the English word the quest teaches, spot = where its memory crystal lies. */
export const LANDMARKS = [
  { id: 'waterfall', en: 'waterfall', vi: 'thác nước', label: 'Waterfall', x: -2.5, z: -52, spot: [10, -43.5] },
  { id: 'tree', en: 'ancient tree', vi: 'cây cổ thụ', label: 'Ancient Tree', x: 17, z: -30, spot: [20.5, -24.5] },
  { id: 'ruins', en: 'ruins', vi: 'tàn tích', label: 'Old Ruins', x: -44, z: -40, spot: [-41, -35] },
  { id: 'cottage', en: 'cottage', vi: 'nhà tranh', label: 'Cottage', x: -41, z: 7, spot: [-35, 11] },
  { id: 'cave', en: 'cave', vi: 'hang động', label: 'Crystal Cave', x: 55, z: 2, spot: [49.5, 3] },
  { id: 'mushroom', en: 'mushroom', vi: 'cây nấm', label: 'Giant Mushrooms', x: 40, z: 21, spot: [36.5, 21.5] },
  { id: 'camp', en: 'camp', vi: 'khu cắm trại', label: 'Camp', x: 34, z: 47, spot: [29.5, 43.5] },
  { id: 'tower', en: 'tower', vi: 'tháp canh', label: 'Watchtower', x: 49, z: -44, spot: [45.5, -39.5] },
  { id: 'bridge', en: 'bridge', vi: 'cây cầu', label: 'South Bridge', x: BRIDGES[1].x, z: 34, spot: [BRIDGES[1].x + 8.2, 36.2] },
];
export const ENTRANCE = { x: -30, z: 58 };

const P = (w, ...pts) => ({ w, pts: pts.map(([x, z]) => ({ x, z })) });
const bw = (b) => [b.x - BRIDGE_LEN / 2 - 0.8, b.z];
const be = (b) => [b.x + BRIDGE_LEN / 2 + 0.8, b.z];
export const PATHS = [
  P(3.0, [-30, 60.5], [-32, 50], [-27, 37], bw(BRIDGES[1])),
  P(3.0, be(BRIDGES[1]), [0, 38], [18, 43], [29, 45.5]),
  P(2.6, [-27, 37], [-36, 22], [-37, 12], [-34, -3], [-20, -12], bw(BRIDGES[0])),
  P(2.6, be(BRIDGES[0]), [13, -20], [16.5, -25]),
  P(2.4, [-20, -12], [-33, -25], [-41, -35]),
  P(2.6, be(BRIDGES[0]), [24, -8], [40, -2], [49, 2.5]),
  P(2.4, [24, -8], [33, 8], [36.5, 20], [35, 33], [31, 43]),
  P(2.4, [24, -8], [34, -22], [42, -33], [46, -40]),
  P(2.2, [16.5, -25], [13, -37], [10.5, -43]),
  P(2.0, [-36, 14], [-20, 10], [STONES[0].x - 1.6, STONES_Z]),
  P(2.0, [STONES[6].x + 1.6, STONES_Z], [16, 4], [24, -6]),
];

function segDist(px, pz, a, b) {
  const abx = b.x - a.x, abz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((px - a.x) * abx + (pz - a.z) * abz) / (abx * abx + abz * abz || 1)));
  return Math.hypot(px - (a.x + abx * t), pz - (a.z + abz * t));
}
/** Distance to the nearest path edge (negative = on the path). */
export function pathDistance(x, z) {
  let best = 1e9;
  for (const p of PATHS) for (let i = 0; i < p.pts.length - 1; i++) best = Math.min(best, segDist(x, z, p.pts[i], p.pts[i + 1]) - p.w / 2);
  return best;
}

function noise(x, z) {
  return Math.sin(x * 0.11 + 1.3) * Math.cos(z * 0.09 - 0.4) * 0.55 + Math.sin(x * 0.043 - z * 0.051) * 0.6 + Math.sin(x * 0.27 + z * 0.31) * 0.08;
}
/** Ground height without bridges/stones. */
export function groundHeight(x, z) {
  let h = 0.35 + noise(x, z) * 0.55;
  h += 5.2 * gauss(Math.hypot(x - 49, z + 44), 12);            // watchtower hill
  h += 3.0 * gauss(Math.hypot(x + 44, z + 40), 10);            // ruins rise
  h += 2.2 * gauss(Math.hypot(x - 17, z + 30), 7);             // ancient tree mound
  const pd = pathDistance(x, z);
  if (pd < 1.5) h = h * (0.75 + 0.25 * smooth(-0.5, 1.5, pd)); // paths sit slightly flatter
  h += 9.0 * (1 - smooth(-57.5, -52.5, z));                   // north cliff with the waterfall
  h += 8.0 * smooth(58, 64, x) * (1 - 0.6 * gauss(z - 2, 3.2) * (1 - smooth(60, 66, x)));  // east rock wall (cave)
  const rim = Math.hypot(x, z);
  h += 7.0 * smooth(70, 84, rim);                              // rim hills hide the map edge
  if (z > RIVER_START - 3) {                                   // river bed
    const d = Math.abs(x - riverX(z)), hw = riverHalf(z);
    const k = 1 - smooth(hw - 0.6, hw + 2.6, d);
    const fade = smooth(RIVER_START - 3, RIVER_START + 1, z);
    h = h * (1 - k * fade) + (-1.25) * k * fade;
  } else if (z > -72) {                                        // upper stream on the plateau
    const d = Math.abs(x - riverX(RIVER_START)), k = 1 - smooth(2.2, 4.2, d);
    h -= 0.9 * k;
  }
  return h;
}

/** Height the player stands on: ground, bridge deck or stepping stone. */
export function walkHeight(x, z) {
  for (const b of BRIDGES) {
    const dx = x - b.x;
    if (Math.abs(z - b.z) < 1.45 && Math.abs(dx) < BRIDGE_LEN / 2 + 0.9) {
      const base = (groundHeight(b.x - BRIDGE_LEN / 2 - 0.9, b.z) + groundHeight(b.x + BRIDGE_LEN / 2 + 0.9, b.z)) / 2;
      const deck = base + BRIDGE_RISE * Math.cos(Math.PI * Math.max(-0.5, Math.min(0.5, dx / BRIDGE_LEN))) - 0.03;
      return Math.max(deck, groundHeight(x, z));
    }
  }
  for (const s of STONES) if (Math.hypot(x - s.x, z - s.z) < s.r) return WATER_LEVEL + 0.22;
  return groundHeight(x, z);
}
export function onBridge(x, z) {
  return BRIDGES.some((b) => Math.abs(z - b.z) < 1.45 && Math.abs(x - b.x) < BRIDGE_LEN / 2 + 0.9);
}
export function inWater(x, z) {
  if (onBridge(x, z)) return false;
  if (STONES.some((s) => Math.hypot(x - s.x, z - s.z) < s.r)) return false;
  return groundHeight(x, z) < WATER_LEVEL + 0.12;
}

// ---------------------------------------------------------------- scenery (seeded, shared by render + collision)
const KEEP_CLEAR = [
  ...LANDMARKS.map((l) => ({ x: l.spot[0], z: l.spot[1], r: 3.2 })),
  { x: 17, z: -30, r: 7.5 }, { x: -44, z: -40, r: 8 }, { x: -41, z: 7, r: 8.5 }, { x: 55, z: 2, r: 7 },
  { x: 40, z: 21, r: 6.5 }, { x: 34, z: 47, r: 8 }, { x: 49, z: -44, r: 6.5 }, { x: ENTRANCE.x, z: ENTRANCE.z, r: 7 },
  { x: -48, z: 48, r: 5 },
];
function clearOf(x, z, extra = 0) {
  return KEEP_CLEAR.every((c) => Math.hypot(x - c.x, z - c.z) > c.r + extra);
}
function slopeAt(x, z) {
  return Math.hypot(groundHeight(x + 0.6, z) - groundHeight(x - 0.6, z), groundHeight(x, z + 0.6) - groundHeight(x, z - 0.6)) / 1.2;
}

/** Solid things: circles {x, z, r}. Landmark buildings + every tree and big rock. */
export const SOLIDS = [
  { x: 17, z: -30, r: 3.3 },                               // ancient tree trunk
  { x: -41, z: 7, r: 4.6 },                                // cottage
  { x: -46.5, z: 11.5, r: 1.6 },                           // woodpile
  { x: 49, z: -44, r: 2.3 },                               // watchtower
  { x: 36.5, z: 49.5, r: 2.3 },                            // tent
  { x: 31.5, z: 47.5, r: 0.9 },                            // campfire
  { x: 41.5, z: 19, r: 1.3 }, { x: 43.5, z: 23.5, r: 1.0 }, { x: 39, z: 24.5, r: 0.7 }, // mushrooms
  { x: -47, z: -43, r: 1.0 }, { x: -41.5, z: -44.5, r: 1.0 }, { x: -48.5, z: -37.5, r: 0.9 }, { x: -44.2, z: -40.5, r: 1.1 }, // ruins
  { x: -48, z: 48, r: 1.1 },                               // blossom tree
  { x: ENTRANCE.x - 3.4, z: ENTRANCE.z + 3, r: 0.9 }, { x: ENTRANCE.x + 3.4, z: ENTRANCE.z + 3, r: 0.9 }, // gate posts
];
export const TREES = [];   // {x, z, s, kind: 'pine' | 'oak' | 'birch', r}
export const ROCKS = [];   // {x, z, s}
(function scatter() {
  const rnd = mulberry32(20261113);
  let guard = 0;
  while (TREES.length < 420 && guard++ < 9000) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 82;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const inside = d < PLAY_RADIUS + 2;
    if (inside && (pathDistance(x, z) < 2.2 || riverDistance(x, z) < riverHalf(z) + 2.4 || !clearOf(x, z, 1.5))) continue;
    if (z < -52 && Math.abs(x - riverX(RIVER_START)) < 5) continue;
    if (groundHeight(x, z) < 0 || (inside && slopeAt(x, z) > 0.75)) continue;
    if (TREES.some((t) => Math.hypot(t.x - x, t.z - z) < 3.1)) continue;
    const k = rnd();
    const kind = k < 0.56 ? 'pine' : k < 0.9 ? 'oak' : 'birch';
    TREES.push({ x, z, kind, s: 0.8 + rnd() * 0.55, rot: rnd() * 6.28 });
  }
  guard = 0;
  while (ROCKS.length < 70 && guard++ < 3000) {
    const x = (rnd() - 0.5) * 140, z = (rnd() - 0.5) * 140;
    const nearRiver = riverDistance(x, z) < riverHalf(z) + 3.5 && riverDistance(x, z) > riverHalf(z) + 0.6;
    if (!nearRiver && rnd() > 0.25) continue;
    if (pathDistance(x, z) < 1.6 || !clearOf(x, z, 0.5) || Math.hypot(x, z) > PLAY_RADIUS) continue;
    if (BRIDGES.some((b) => Math.abs(z - b.z) < 4 && Math.abs(x - b.x) < 10)) continue;
    if (Math.abs(z - STONES_Z) < 3 && riverDistance(x, z) < 12) continue;
    if (TREES.some((t) => Math.hypot(t.x - x, t.z - z) < 2.2)) continue;
    ROCKS.push({ x, z, s: 0.5 + rnd() * 0.9, rot: rnd() * 6.28 });
  }
  for (const t of TREES) SOLIDS.push({ x: t.x, z: t.z, r: 0.45 * t.s + 0.15 });
  for (const r of ROCKS) if (r.s > 0.75) SOLIDS.push({ x: r.x, z: r.z, r: 0.75 * r.s });
})();

const CELL = 4, GRID = new Map();
for (const s of SOLIDS) {
  for (let gx = Math.floor((s.x - s.r - 0.6) / CELL); gx <= Math.floor((s.x + s.r + 0.6) / CELL); gx++)
    for (let gz = Math.floor((s.z - s.r - 0.6) / CELL); gz <= Math.floor((s.z + s.r + 0.6) / CELL); gz++) {
      const k = gx + ',' + gz; if (!GRID.has(k)) GRID.set(k, []); GRID.get(k).push(s);
    }
}
export function solidsNear(x, z) { return GRID.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL)) || []; }

/** Can a body of radius r stand at (x, z)? Water, solids, cliffs and the map rim say no. */
export function walkable(x, z, r = 0.38) {
  if (Math.hypot(x, z) > PLAY_RADIUS) return false;
  if (inWater(x, z)) return false;
  for (const s of solidsNear(x, z)) if (Math.hypot(x - s.x, z - s.z) < s.r + r) return false;
  return true;
}
/** One step from a to b is allowed when both ends are walkable and the climb is not a cliff. */
export function canStep(ax, az, bx, bz, r = 0.38) {
  if (!walkable(bx, bz, r)) return false;
  const d = Math.hypot(bx - ax, bz - az) || 1e-6;
  return (walkHeight(bx, bz) - walkHeight(ax, az)) / d < 1.15 || onBridge(bx, bz);
}

// Region kit: turns a region config (river, paths, bridges, landmarks, hills) into the full map API:
// height, water, walkability, seeded trees/rocks and a spatial grid of solids. Pure math, no three.js.
export const WATER_LEVEL = -0.35;
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
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const gauss = (d, s) => Math.exp(-(d * d) / (2 * s * s));
function segDist(px, pz, a, b) {
  const abx = b.x - a.x, abz = b.z - a.z;
  const t = Math.max(0, Math.min(1, ((px - a.x) * abx + (pz - a.z) * abz) / (abx * abx + abz * abz || 1)));
  return Math.hypot(px - (a.x + abx * t), pz - (a.z + abz * t));
}
export const P = (w, ...pts) => ({ w, pts: pts.map(([x, z]) => ({ x, z })) });

/** cfg: { name, title, size, playRadius, riverX(z), riverHalf(z), riverStart, riverEnd, bridges:[{id,z,name}], stonesZ|null,
 *  landmarks, entrance, spawn, exits, paths(R), hills(x, z, h) -> h, keepClear, solids, trees, rocks, seed, waterfall } */
export function makeRegion(cfg) {
  const R = { ...cfg, WATER_LEVEL, BRIDGE_LEN, BRIDGE_RISE, NAME: cfg.name, TITLE: cfg.title, SIZE: cfg.size, PLAY_RADIUS: cfg.playRadius,
    RIVER_START: cfg.riverStart, RIVER_END: cfg.riverEnd ?? 1e9, WATERFALL: !!cfg.waterfall, ENTRANCE: cfg.entrance, SPAWN: cfg.spawn, EXITS: cfg.exits || [], LANDMARKS: cfg.landmarks };
  R.riverX = cfg.riverX; R.riverHalf = cfg.riverHalf;
  const hasRiver = (z) => z >= R.RIVER_START && z <= R.RIVER_END;
  R.riverDistance = (x, z) => (hasRiver(z) ? Math.abs(x - R.riverX(z)) : 99);
  R.BRIDGES = cfg.bridges.map((b) => ({ ...b, x: R.riverX(b.z) }));
  R.STONES_Z = cfg.stonesZ ?? null;
  R.STONES = [];
  if (R.STONES_Z !== null) { const cx = R.riverX(R.STONES_Z); for (let i = -3; i <= 3; i++) R.STONES.push({ x: cx + i * 1.55, z: R.STONES_Z + (i % 2 ? 0.35 : -0.25), r: 0.72 }); }
  R.PATHS = cfg.paths(R);
  R.pathDistance = (x, z) => {
    let best = 1e9;
    for (const p of R.PATHS) for (let i = 0; i < p.pts.length - 1; i++) best = Math.min(best, segDist(x, z, p.pts[i], p.pts[i + 1]) - p.w / 2);
    return best;
  };
  const noise = (x, z) => Math.sin(x * 0.11 + 1.3) * Math.cos(z * 0.09 - 0.4) * 0.55 + Math.sin(x * 0.043 - z * 0.051) * 0.6 + Math.sin(x * 0.27 + z * 0.31) * 0.08;
  R.groundHeight = (x, z) => {
    let h = 0.35 + noise(x, z) * (cfg.roughness ?? 0.55);
    h = cfg.hills(x, z, h);
    const pd = R.pathDistance(x, z);
    if (pd < 1.5) h = h * (0.75 + 0.25 * smooth(-0.5, 1.5, pd));
    h += 7.0 * smooth(R.PLAY_RADIUS + 2, R.PLAY_RADIUS + 16, Math.hypot(x, z));      // rim hills hide the map edge
    if (z > R.RIVER_START - 3 && z < R.RIVER_END + 3) {
      const d = Math.abs(x - R.riverX(z)), hw = R.riverHalf(z);
      const k = 1 - smooth(hw - 0.6, hw + 2.6, d);
      const fade = smooth(R.RIVER_START - 3, R.RIVER_START + 1, z) * (1 - smooth(R.RIVER_END - 1, R.RIVER_END + 3, z));
      h = h * (1 - k * fade) + (-1.25) * k * fade;
    } else if (R.WATERFALL && z <= R.RIVER_START - 3 && z > R.RIVER_START - 20) {
      const d = Math.abs(x - R.riverX(R.RIVER_START)), k = 1 - smooth(2.2, 4.2, d);
      h -= 0.9 * k;
    }
    return h;
  };
  R.onBridge = (x, z) => R.BRIDGES.some((b) => Math.abs(z - b.z) < 1.45 && Math.abs(x - b.x) < BRIDGE_LEN / 2 + 0.9);
  R.walkHeight = (x, z) => {
    for (const b of R.BRIDGES) {
      const dx = x - b.x;
      if (Math.abs(z - b.z) < 1.45 && Math.abs(dx) < BRIDGE_LEN / 2 + 0.9) {
        const base = (R.groundHeight(b.x - BRIDGE_LEN / 2 - 0.9, b.z) + R.groundHeight(b.x + BRIDGE_LEN / 2 + 0.9, b.z)) / 2;
        const deck = base + BRIDGE_RISE * Math.cos(Math.PI * Math.max(-0.5, Math.min(0.5, dx / BRIDGE_LEN))) - 0.03;
        return Math.max(deck, R.groundHeight(x, z));
      }
    }
    for (const s of R.STONES) if (Math.hypot(x - s.x, z - s.z) < s.r) return WATER_LEVEL + 0.22;
    return R.groundHeight(x, z);
  };
  R.inWater = (x, z) => {
    if (R.onBridge(x, z)) return false;
    if (R.STONES.some((s) => Math.hypot(x - s.x, z - s.z) < s.r)) return false;
    return R.groundHeight(x, z) < WATER_LEVEL + 0.12;
  };
  const KEEP = [...R.LANDMARKS.filter((l) => l.spot).map((l) => ({ x: l.spot[0], z: l.spot[1], r: 3.2 })), ...(cfg.keepClear || []), { x: R.ENTRANCE.x, z: R.ENTRANCE.z, r: 7 }, { x: R.SPAWN.x, z: R.SPAWN.z, r: 5 }];
  const clearOf = (x, z, extra = 0) => KEEP.every((c) => Math.hypot(x - c.x, z - c.z) > c.r + extra);
  const slopeAt = (x, z) => Math.hypot(R.groundHeight(x + 0.6, z) - R.groundHeight(x - 0.6, z), R.groundHeight(x, z + 0.6) - R.groundHeight(x, z - 0.6)) / 1.2;
  R.SOLIDS = [...cfg.solids]; R.TREES = []; R.ROCKS = [];
  const rnd = mulberry32(cfg.seed);
  let guard = 0;
  const spread = R.PLAY_RADIUS + 14;
  while (R.TREES.length < cfg.trees && guard++ < cfg.trees * 25) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * spread, x = Math.cos(a) * d, z = Math.sin(a) * d;
    const inside = d < R.PLAY_RADIUS + 2;
    if (inside && (R.pathDistance(x, z) < 3.6 || R.riverDistance(x, z) < R.riverHalf(z) + 2.4 || !clearOf(x, z, 1.5))) continue;
    if (inside && cfg.treeFree && cfg.treeFree(x, z)) continue;
    if (R.WATERFALL && z < R.RIVER_START && Math.abs(x - R.riverX(R.RIVER_START)) < 5) continue;
    if (R.groundHeight(x, z) < 0 || (inside && slopeAt(x, z) > 0.75)) continue;
    if (R.TREES.some((t) => Math.hypot(t.x - x, t.z - z) < 3.1)) continue;
    const k = rnd(), mix = cfg.treeMix || [0.56, 0.9];
    R.TREES.push({ x, z, kind: k < mix[0] ? 'pine' : k < mix[1] ? 'oak' : 'birch', s: 0.8 + rnd() * 0.55, rot: rnd() * 6.28 });
  }
  guard = 0;
  while (R.ROCKS.length < cfg.rocks && guard++ < cfg.rocks * 45) {
    const x = (rnd() - 0.5) * R.PLAY_RADIUS * 2, z = (rnd() - 0.5) * R.PLAY_RADIUS * 2;
    const rd = R.riverDistance(x, z), nearRiver = rd < R.riverHalf(z) + 3.5 && rd > R.riverHalf(z) + 0.6;
    if (!nearRiver && rnd() > 0.25) continue;
    if (R.pathDistance(x, z) < 1.6 || !clearOf(x, z, 0.5) || Math.hypot(x, z) > R.PLAY_RADIUS) continue;
    if (R.BRIDGES.some((b) => Math.abs(z - b.z) < 4 && Math.abs(x - b.x) < 10)) continue;
    if (R.STONES_Z !== null && Math.abs(z - R.STONES_Z) < 3 && rd < 12) continue;
    if (cfg.treeFree && cfg.treeFree(x, z)) continue;
    if (R.TREES.some((t) => Math.hypot(t.x - x, t.z - z) < 2.2)) continue;
    R.ROCKS.push({ x, z, s: 0.5 + rnd() * 0.9, rot: rnd() * 6.28 });
  }
  for (const t of R.TREES) R.SOLIDS.push({ x: t.x, z: t.z, r: 0.45 * t.s + 0.15 });
  for (const r of R.ROCKS) if (r.s > 0.75) R.SOLIDS.push({ x: r.x, z: r.z, r: 0.75 * r.s });
  const CELL = 4, GRID = new Map();
  for (const s of R.SOLIDS) for (let gx = Math.floor((s.x - s.r - 0.6) / CELL); gx <= Math.floor((s.x + s.r + 0.6) / CELL); gx++)
    for (let gz = Math.floor((s.z - s.r - 0.6) / CELL); gz <= Math.floor((s.z + s.r + 0.6) / CELL); gz++) { const k = gx + ',' + gz; if (!GRID.has(k)) GRID.set(k, []); GRID.get(k).push(s); }
  R.solidsNear = (x, z) => GRID.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL)) || [];
  R.walkable = (x, z, r = 0.38) => {
    if (Math.hypot(x, z) > R.PLAY_RADIUS) return false;
    if (R.inWater(x, z)) return false;
    for (const s of R.solidsNear(x, z)) if (Math.hypot(x - s.x, z - s.z) < s.r + r) return false;
    return true;
  };
  R.canStep = (ax, az, bx, bz, r = 0.38) => {
    if (!R.walkable(bx, bz, r)) return false;
    const d = Math.hypot(bx - ax, bz - az) || 1e-6;
    return (R.walkHeight(bx, bz) - R.walkHeight(ax, az)) / d < 1.15 || R.onBridge(bx, bz);
  };
  return R;
}

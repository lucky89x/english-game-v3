// Hunting grounds (24/11, "bãi quái"): every kind of monster lives in a ground of its own, never mixed with another kind, and the
// grounds climb with the level from the town outwards. The level of a monster is fixed by its kind (rules.js MONSTERS); this file only says
// WHERE it lives. Pure data and a seeded scatter (no three.js), tested in node: every monster stands on dry, walkable land outside the
// safe places. The centres were found by a probe over the real terrain (a circle of 6-7 m of clear ground).
import * as L from './layout.js';
import { inSafe } from './safe.js';

/** id, kind, centre x z, radius r, how many monsters n, the sign's name (Vietnamese) and emoji. Ordered by level inside each map. */
export const ZONES = {
  village: [      // Starter Village, levels 1-5 (25/11: spread along the whole east bank, north to south; the far bank opens with the bridge)
    { id: 'v_bunny', kind: 'bunny', x: 40, z: -16, r: 9, n: 5, vi: 'Bãi Thỏ Băng', icon: '🐰' },
    { id: 'v_slime', kind: 'slime', x: 44, z: 52, r: 9, n: 5, vi: 'Bãi Slime Xanh', icon: '🟢' },
    { id: 'v_goblin', kind: 'goblin', x: 64, z: -32, r: 9, n: 4, vi: 'Bãi Yêu Tinh Băng', icon: '👺' },
    { id: 'v_red', kind: 'red', x: 72, z: 30, r: 9, n: 4, vi: 'Bãi Slime Đỏ', icon: '🔴' },
    { id: 'v_imp', kind: 'imp', x: 80, z: -8, r: 9, n: 4, vi: 'Bãi Quỷ Lửa Nhỏ', icon: '😈' },
    { id: 'v_golem', kind: 'golem', x: 44, z: -70, r: 8, n: 2, vi: 'Bãi Golem Dung Nham', icon: '🌋' },
  ],
  harbor: [       // Sunny Harbor, levels 5-10
    { id: 'h_crab', kind: 'crab', x: 0, z: 56, r: 9, n: 5, vi: 'Bãi Cua Biển', icon: '🦀' },
    { id: 'h_jelly', kind: 'jelly', x: -60, z: 16, r: 9, n: 4, vi: 'Bãi Sứa Phát Sáng', icon: '🪼' },
    { id: 'h_gull', kind: 'gull', x: 16, z: -72, r: 9, n: 3, vi: 'Bãi Hải Âu Bão', icon: '🕊️' },
    { id: 'h_pirate', kind: 'pirate', x: 20, z: -40, r: 9, n: 4, vi: 'Bãi Cướp Biển Nhí', icon: '🏴‍☠️' },
  ],
  forest: [       // Memory Forest, levels 10-20 (out from the entrance in the south-west)
    { id: 'f_bat', kind: 'bat', x: -40, z: 28, r: 9, n: 5, vi: 'Bãi Dơi Bóng Tối', icon: '🦇' },
    { id: 'f_wisp', kind: 'wisp', x: 32, z: 40, r: 9, n: 4, vi: 'Bãi Ma Trơi Sét', icon: '✨' },
    { id: 'f_fox', kind: 'fox', x: -24, z: -26, r: 9, n: 4, vi: 'Bãi Cáo Lửa', icon: '🦊' },
    { id: 'f_shroom', kind: 'shroom', x: 64, z: -16, r: 8, n: 3, vi: 'Bãi Nấm Giận Dữ', icon: '🍄' },
    { id: 'f_orc', kind: 'orc', x: 0, z: -64, r: 9, n: 3, vi: 'Bãi Người Cây Cổ Thụ', icon: '🌳' },
  ],
};

/** (25/11) The grounds are spread over the whole map (village: all along the east bank, which the bridge quest opens; harbour and forest:
 *  a different side of the map for each ground) and the monsters of a ground stand apart: at least `GAP` metres from each other. */
export const GAP = 4.5;
/** Positions of the monsters of one ground: a sunflower spiral inside the circle, keeping only dry walkable spots outside the safe places,
 *  each at least GAP from the ones before. */
export function zoneSpots(region, z) {
  const R = L.REGIONS[region], out = [];
  for (let i = 0; out.length < z.n && i < z.n * 30; i++) {
    const a = i * 2.399963, rr = z.r * Math.sqrt((i + 0.5) / (z.n * 3)), x = +(z.x + Math.sin(a) * rr).toFixed(1), zz = +(z.z + Math.cos(a) * rr).toFixed(1);
    if (rr > z.r) break;
    if (out.some(([, ox, oz]) => Math.hypot(ox - x, oz - zz) < GAP)) continue;
    if (R.walkable(x, zz, 1.0) && !R.inWater(x, zz) && R.groundHeight(x, zz) > 0.02 && !inSafe(region, x, zz, 1.5)) out.push([z.kind, x, zz]);
  }
  return out;
}
/** [kind, x, z] of every monster of a map, ground after ground. */
export const spawnsOf = (region) => (ZONES[region] || []).flatMap((z) => zoneSpots(region, z));
/** The ground a monster kind lives in (its first ground on that map), or null. */
export const zoneOf = (region, kind) => (ZONES[region] || []).find((z) => z.kind === kind) || null;

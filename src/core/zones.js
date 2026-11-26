// Hunting grounds (24/11, "bãi quái"): every kind of monster lives in a ground of its own, never mixed with another kind, and the
// grounds climb with the level from the town outwards. The level of a monster is fixed by its kind (rules.js MONSTERS); this file only says
// WHERE it lives. Pure data and a seeded scatter (no three.js), tested in node: every monster stands on dry, walkable land outside the
// safe places. The centres were found by a probe over the real terrain (a circle of 6-7 m of clear ground).
import * as L from './layout.js';
import { inSafe } from './safe.js';

/** id, kind, centre x z, radius r, how many monsters n, the sign's name (Vietnamese) and emoji. Ordered by level inside each map. */
export const ZONES = {
  village: [      // Starter Village, levels 1-5 (25/11: spread along the whole east bank, north to south; the far bank opens with the bridge)
    { id: 'v_bunny', kind: 'bunny', x: 40, z: -16, r: 10, n: 7, vi: 'Bãi Hoa Ăn Thịt', icon: '🌺' },
    { id: 'v_slime', kind: 'slime', x: 44, z: 52, r: 10, n: 7, vi: 'Bãi Slime Nước', icon: '💧' },
    { id: 'v_goblin', kind: 'goblin', x: 64, z: -32, r: 10, n: 7, vi: 'Bãi Sói Bóng Tối', icon: '🐺' },
    { id: 'v_red', kind: 'red', x: 72, z: 30, r: 10, n: 7, vi: 'Bãi Slime Đỏ', icon: '🔴' },
    { id: 'v_imp', kind: 'imp', x: 80, z: -8, r: 10, n: 7, vi: 'Bãi Pha Lê Dung Nham', icon: '💎' },
    { id: 'v_golem', kind: 'golem', x: 58, z: 4, r: 8, n: 3, vi: 'Bãi Golem Dung Nham', icon: '🌋' },      // (26/11) down from the north-east plateau (a cliff from the meadow side: the child could not find the way up)
  ],
  harbor: [       // Sunny Harbor, levels 5-10
    { id: 'h_crab', kind: 'crab', x: 0, z: 56, r: 10, n: 6, vi: 'Bãi Cua Biển', icon: '🦀' },
    { id: 'h_jelly', kind: 'jelly', x: -60, z: 16, r: 10, n: 6, vi: 'Bãi Sứa Phát Sáng', icon: '🪼' },
    { id: 'h_gull', kind: 'gull', x: 16, z: -72, r: 10, n: 6, vi: 'Bãi Hải Âu Bão', icon: '🕊️' },
    { id: 'h_pirate', kind: 'pirate', x: 0, z: -46, r: 9, n: 5, vi: 'Bãi Cướp Biển Nhí', icon: '🏴‍☠️' },      // (26/11) off the lighthouse road (they stood on it and on a chest)
  ],
  forest: [       // Memory Forest, levels 10-20 (out from the entrance in the south-west)
    { id: 'f_bat', kind: 'bat', x: -40, z: 28, r: 10, n: 7, vi: 'Bãi Dơi Bóng Tối', icon: '🦇' },
    { id: 'f_wisp', kind: 'wisp', x: 14, z: 62, r: 9, n: 6, vi: 'Bãi Ma Trơi Sét', icon: '✨' },      // (26/11) away from the camp, its crystal and its chest
    { id: 'f_fox', kind: 'fox', x: -24, z: -26, r: 10, n: 6, vi: 'Bãi Cáo Lửa', icon: '🦊' },
    { id: 'f_shroom', kind: 'shroom', x: 48, z: -8, r: 10, n: 6, vi: 'Bãi Nấm Khổng Lồ', icon: '🍄' },      // (26/11) was on top of the east cliff (8 m up, no way from below)
    { id: 'f_orc', kind: 'orc', x: 22, z: -44, r: 9, n: 5, vi: 'Bãi Người Cây Cổ Thụ', icon: '🌳' },      // (26/11) was on top of the north cliff (9.6 m up)
  ],
  // (26/11) maps 4-7 (core/regions/lands.js). The hero arrives at the top level of the land before, so the grounds start there.
  desert: [       // Golden Desert: the hero comes at level 20, the land ends at 25
    { id: 'd_spark', kind: 'spark', x: 34, z: 46, r: 10, n: 7, vi: 'Bãi Xương Rồng Tia Lửa', icon: '🌵' },
    { id: 'd_scorpion', kind: 'scorpion', x: -44, z: 30, r: 10, n: 7, vi: 'Bãi Bọ Cạp Cát', icon: '🦂' },
    { id: 'd_tcactus', kind: 'tcactus', x: 54, z: 6, r: 10, n: 7, vi: 'Bãi Xương Rồng Sấm', icon: '⚡' },
    { id: 'd_djinn', kind: 'djinn', x: -46, z: -30, r: 10, n: 6, vi: 'Bãi Thần Gió Bụi', icon: '🌪️' },
    { id: 'd_dino', kind: 'dino', x: 34, z: -40, r: 9, n: 5, vi: 'Bãi Khủng Long Lửa', icon: '🦖' },
  ],
  mountain: [     // Snowy Peaks: 25 to 30
    { id: 'm_icebunny', kind: 'icebunny', x: -40, z: 46, r: 10, n: 7, vi: 'Bãi Thỏ Tuyết', icon: '🐇' },
    { id: 'm_seal', kind: 'seal', x: 44, z: 40, r: 10, n: 7, vi: 'Bãi Hải Cẩu Băng', icon: '🦭' },
    { id: 'm_frog', kind: 'frog', x: -52, z: 10, r: 10, n: 7, vi: 'Bãi Ếch Gió', icon: '🐸' },
    { id: 'm_yeti', kind: 'yeti', x: 52, z: -12, r: 10, n: 6, vi: 'Bãi Người Tuyết Yeti', icon: '❄️' },
    { id: 'm_icegolem', kind: 'icegolem', x: -30, z: -46, r: 9, n: 5, vi: 'Bãi Golem Băng', icon: '🧊' },
  ],
  ruins: [        // Ancient Ruins: 30 to 35
    { id: 'r_ghost', kind: 'ghost', x: 50, z: 40, r: 10, n: 7, vi: 'Bãi Ma Sấm', icon: '👻' },
    { id: 'r_moonfox', kind: 'moonfox', x: -50, z: 40, r: 10, n: 7, vi: 'Bãi Cáo Trăng', icon: '🌙' },
    { id: 'r_wraith', kind: 'wraith', x: 54, z: -10, r: 10, n: 7, vi: 'Bãi Bóng Câm', icon: '🌫️' },
    { id: 'r_whirl', kind: 'whirl', x: -18, z: -30, r: 9, n: 6, vi: 'Bãi Lốc Xoáy Nhỏ', icon: '🌀' },
    { id: 'r_turtle', kind: 'turtle', x: -54, z: -22, r: 9, n: 5, vi: 'Bãi Rùa Đá Cổ', icon: '🐢' },
  ],
  sky: [          // Sky Kingdom: 35 to 45
    { id: 's_skybird', kind: 'skybird', x: -50, z: 36, r: 10, n: 7, vi: 'Bãi Chim Gió', icon: '🐦' },
    { id: 's_squid', kind: 'squid', x: 50, z: 36, r: 10, n: 7, vi: 'Bãi Mực Mây', icon: '🦑' },
    { id: 's_sunfox', kind: 'sunfox', x: -58, z: -8, r: 10, n: 7, vi: 'Bãi Cáo Mặt Trời', icon: '🦊' },
    { id: 's_stormbird', kind: 'stormbird', x: 58, z: -10, r: 10, n: 6, vi: 'Bãi Chim Bão', icon: '🌩️' },
    { id: 's_stormgolem', kind: 'stormgolem', x: -36, z: -52, r: 9, n: 5, vi: 'Bãi Golem Bão', icon: '⛈️' },
  ],
  // (26/11, turn 63) maps 8-12
  fairy: [        // Fairy Isle: 45 to 50
    { id: 'y_pixie', kind: 'pixie', x: -48, z: 30, r: 10, n: 7, vi: 'Bãi Tiên Đom Đóm', icon: '✨' },
    { id: 'y_snapper', kind: 'snapper', x: 48, z: 32, r: 10, n: 7, vi: 'Bãi Hoa Cắn', icon: '🌸' },
    { id: 'y_dewfrog', kind: 'dewfrog', x: 58, z: -12, r: 10, n: 7, vi: 'Bãi Ếch Sương', icon: '🐸' },
    { id: 'y_sporeling', kind: 'sporeling', x: -56, z: -34, r: 10, n: 6, vi: 'Bãi Nấm Nhảy', icon: '🍄' },
    { id: 'y_thorn', kind: 'thorn', x: 34, z: -50, r: 9, n: 5, vi: 'Bãi Người Cây Gai', icon: '🌿' },
  ],
  volcano: [      // Volcano Valley: 50 to 55
    { id: 'o_shard', kind: 'shard', x: 46, z: 24, r: 9, n: 7, vi: 'Bãi Mảnh Dung Nham', icon: '🔥' },
    { id: 'o_lavafox', kind: 'lavafox', x: -54, z: 40, r: 9, n: 7, vi: 'Bãi Cáo Lửa', icon: '🦊' },
    { id: 'o_ashbat', kind: 'ashbat', x: -56, z: -2, r: 9, n: 7, vi: 'Bãi Dơi Tro', icon: '🦇' },
    { id: 'o_ashwisp', kind: 'ashwisp', x: 52, z: -32, r: 10, n: 6, vi: 'Bãi Ma Trơi Tro', icon: '🌋' },
    { id: 'o_titanling', kind: 'titanling', x: -40, z: -46, r: 9, n: 5, vi: 'Bãi Golem Nham Thạch', icon: '🪨' },
  ],
  crystal: [      // Crystal Cave: 55 to 60
    { id: 'c_cavebat', kind: 'cavebat', x: -36, z: 60, r: 9, n: 7, vi: 'Bãi Dơi Hang', icon: '🦇' },
    { id: 'c_gemslime', kind: 'gemslime', x: 36, z: 60, r: 9, n: 7, vi: 'Bãi Slime Đá Quý', icon: '💎' },
    { id: 'c_glowwisp', kind: 'glowwisp', x: 62, z: -24, r: 9, n: 7, vi: 'Bãi Đốm Sáng', icon: '💡' },
    { id: 'c_echo', kind: 'echo', x: -62, z: -24, r: 9, n: 6, vi: 'Bãi Tinh Thể Vọng', icon: '🔮' },
    { id: 'c_gemgolem', kind: 'gemgolem', x: 30, z: -52, r: 9, n: 5, vi: 'Bãi Golem Pha Lê', icon: '🧊' },
  ],
  city: [         // Future City: 60 to 65
    { id: 't_drone', kind: 'drone', x: 58, z: 46, r: 9, n: 7, vi: 'Bãi Drone Tia Điện', icon: '🛸' },
    { id: 't_wheelbot', kind: 'wheelbot', x: -58, z: 46, r: 9, n: 7, vi: 'Bãi Robot Bánh Xe', icon: '🤖' },
    { id: 't_boxbot', kind: 'boxbot', x: 62, z: -14, r: 9, n: 7, vi: 'Bãi Robot Hộp', icon: '📦' },
    { id: 't_laser', kind: 'laser', x: -62, z: -14, r: 9, n: 6, vi: 'Bãi Drone Laser', icon: '🔴' },
    { id: 't_guardbot', kind: 'guardbot', x: 30, z: -56, r: 9, n: 5, vi: 'Bãi Robot Canh Gác', icon: '🦾' },
  ],
  dream: [        // Dream Kingdom: 65 to 70
    { id: 'n_nightbat', kind: 'nightbat', x: 52, z: 44, r: 9, n: 7, vi: 'Bãi Dơi Ác Mộng', icon: '🦇' },
    { id: 'n_dreamfox', kind: 'dreamfox', x: -52, z: 44, r: 9, n: 7, vi: 'Bãi Cáo Mộng', icon: '🦊' },
    { id: 'n_shade', kind: 'shade', x: 64, z: -22, r: 9, n: 7, vi: 'Bãi Bóng Thì Thầm', icon: '🌫️' },
    { id: 'n_sleepghost', kind: 'sleepghost', x: -64, z: -22, r: 9, n: 6, vi: 'Bãi Ma Ngủ Gật', icon: '👻' },
    { id: 'n_nightgolem', kind: 'nightgolem', x: 30, z: -50, r: 9, n: 5, vi: 'Bãi Golem Ác Mộng', icon: '🌑' },
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

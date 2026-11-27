// The world of twelve maps (ten until 26/11) joined by portals (24/11, docs/THE_GIOI_10_MAP.md). Pure rules, tested in node:
// which maps exist, which roads join them, what the child still needs for a road, and where each portal stands.
// Three maps are built (village, harbor, forest); the other seven are listed so the world map and the portals can show them as
// "coming soon" and the roads are in place when the maps arrive.

/** no: the map number (Unit no. of the grade book); region: the layout key; lv: the level range printed on the user's world map picture
 *  (assets/ui/world_map.jpg: Village 1-5, Sea 5-10, Forest 10-20 ...; 24/11: the last two maps were stretched so the top is level 70 = every rank of one skill element, see core/progress.js); at: where the map's badge is in that picture (fractions of its width and height).
 *  The monsters of the built maps still use the old levels until they are re-balanced to these numbers. */
export const MAPS = [
  { no: 1, id: 'village', region: 'village', vi: 'Làng Khởi Đầu', en: 'Starter Village', lv: [1, 5], built: true, at: [0.41, 0.776] },
  { no: 2, id: 'harbor', region: 'harbor', vi: 'Biển cả · Cảng Mặt Trời', en: 'Sunny Harbor', lv: [5, 10], built: true, at: [0.17, 0.7] },
  { no: 3, id: 'forest', region: 'forest', vi: 'Rừng xanh · Rừng Ký Ức', en: 'Forest of Memories', lv: [10, 20], built: true, at: [0.68, 0.76] },
  { no: 4, id: 'desert', region: 'desert', vi: 'Sa mạc cát vàng', en: 'Golden Desert', lv: [15, 25], built: true, at: [0.136, 0.417] },
  { no: 5, id: 'mountain', region: 'mountain', vi: 'Núi tuyết', en: 'Snowy Peaks', lv: [20, 30], built: true, at: [0.535, 0.342] },
  { no: 7, id: 'sky', region: 'sky', vi: 'Vương quốc trên trời', en: 'Sky Kingdom', lv: [35, 45], built: true, at: [0.423, 0.129] },
  { no: 6, id: 'ruins', region: 'ruins', vi: 'Khu di tích cổ', en: 'Ancient Ruins', lv: [25, 35], built: true,      // (26/11) the ruins are land 6 and the sky land 7: the order of the levels (and of the units)
    at: [0.81, 0.495] },
  // (26/11, turn 63) maps 8-12 are built on the frame of maps 4-7; five levels each up to the top level, 70. The Future City and the
  // Dream Kingdom are the user's two new lands (12 lands = the 12 units of a school year); they are not in the map picture yet.
  { no: 8, id: 'fairy', region: 'fairy', vi: 'Đảo thần tiên', en: 'Fairy Isle', lv: [45, 50], built: true, at: [0.138, 0.257] },
  { no: 9, id: 'volcano', region: 'volcano', vi: 'Thung lũng núi lửa', en: 'Volcano Valley', lv: [50, 55], built: true, at: [0.68, 0.134] },
  { no: 10, id: 'crystal', region: 'crystal', vi: 'Hang tinh thể', en: 'Crystal Cave', lv: [55, 60], built: true, at: [0.868, 0.225] },
  { no: 11, id: 'city', region: 'city', vi: 'Thành phố tương lai', en: 'Future City', lv: [60, 65], built: true, at: [0.935, 0.60] },
  { no: 12, id: 'dream', region: 'dream', vi: 'Vương quốc mộng mơ', en: 'Dream Kingdom', lv: [65, 70], built: true, at: [0.262, 0.105] },
];
export const mapById = (id) => MAPS.find((m) => m.id === id) || null;
export const mapNo = (id) => (mapById(id) || {}).no || 0;

/** Roads between maps (they work both ways once open). `need` names a condition below; `built: false` when a map at an end does not exist yet. */
export const ROADS = [
  { a: 'village', b: 'forest', need: 'forest' },
  { a: 'village', b: 'harbor', need: 'sea' },
  { a: 'harbor', b: 'forest', need: 'coast' },      // the coast road of the plan (2-3): not walkable yet, both maps are reached from the village
  { a: 'forest', b: 'desert', need: 'desert' },
  { a: 'desert', b: 'mountain', need: 'mountain' },
  { a: 'mountain', b: 'ruins', need: 'ruins' },
  { a: 'ruins', b: 'sky', need: 'sky' },
  { a: 'mountain', b: 'sky', need: 'sky' },
  { a: 'sky', b: 'fairy', need: 'fairy' },
  { a: 'fairy', b: 'volcano', need: 'volcano' },
  { a: 'mountain', b: 'volcano', need: 'volcano' },
  { a: 'volcano', b: 'crystal', need: 'crystal' },
  { a: 'crystal', b: 'city', need: 'city' },
  { a: 'city', b: 'dream', need: 'dream' },
];

/** The conditions: what is missing (an array of Vietnamese lines; empty = open). */
const f = (p) => (p && p.flags) || {};
const need = (p, flag, bossVi, level, landVi) => { const m = []; if (!f(p)[flag]) m.push(`Đánh bại ${bossVi}.`); if (!(p && p.stats && p.stats.level >= level && p.gates && p.gates[level])) m.push(`Lên cấp ${level} (cấp cao nhất của ${landVi}) và qua bài thi của Cú Mèo.`); return m; };
export const CONDITIONS = {
  forest: (p) => { const m = []; if (!f(p).forest_open) m.push('Giúp Tom và Ben ở quảng trường để nhận huy hiệu Người Giữ Chữ.'); if (!(p && p.stats && p.stats.level >= 10 && p.gates && p.gates[10])) m.push('Lên cấp 10 ở Biển cả (cấp 5–10) và qua bài thi của Cú Mèo để vào Rừng Ký Ức (cấp 10–20).'); return m; },
  sea: (p) => { const m = []; if (!f(p).boss1) m.push('Đánh bại Vua Slime ở Đồng Hoang.'); if (!(p && p.stats && p.stats.level >= 5 && p.gates && p.gates[5])) m.push('Lên cấp 5 (cấp cao nhất của làng) và qua cổng ôn tập của Cú Mèo để mở Biển cả (cấp 5–10).'); return m; },
  coast: () => ['Con đường ven biển chưa làm xong: đi qua Làng.'],
  // (26/11) maps 4-7: the boss of the land before, its top level and the owl's exam at that level
  desert: (p) => need(p, 'boss2', 'Golem Cổ ở Rừng Ký Ức', 20, 'Rừng Ký Ức'),
  mountain: (p) => need(p, 'boss5', 'Rồng Cát ở Sa mạc', 25, 'Sa mạc'),
  ruins: (p) => need(p, 'boss6', 'Rồng Băng ở Núi tuyết', 30, 'Núi tuyết'),
  sky: (p) => need(p, 'boss7', 'Người Khổng Lồ Đá ở Di tích', 35, 'Di tích cổ'),
  fairy: (p) => need(p, 'boss8', 'Rồng Mặt Trời ở Vương quốc trên trời', 45, 'Vương quốc trên trời'),      // (26/11, turn 63) maps 8-12
  volcano: (p) => need(p, 'boss9', 'Nữ hoàng Gai ở Đảo thần tiên', 50, 'Đảo thần tiên'),
  crystal: (p) => need(p, 'boss10', 'Người Khổng Lồ Dung Nham ở Núi lửa', 55, 'Thung lũng núi lửa'),
  city: (p) => need(p, 'boss11', 'Rồng Pha Lê ở Hang tinh thể', 60, 'Hang tinh thể'),
  dream: (p) => need(p, 'boss12', 'Người Máy Canh Gác ở Thành phố tương lai', 65, 'Thành phố tương lai'),
  later: () => ['Vùng đất này còn chìm trong Gió Đen. Sắp mở!'],
};
export const roadBetween = (a, b) => ROADS.find((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a)) || null;
/** The maps joined to this one by a road (any state). */
export const neighbours = (id) => ROADS.filter((r) => r.a === id || r.b === id).map((r) => (r.a === id ? r.b : r.a));
/** Can the child go from this map to that one? { ok, missing[], built } — the admin goes anywhere that is built. */
/** The levels a land is really played at: it starts where the land before it ends (the desert's list says 15, but the forest goes up to 20). */
export const levelsOf = (m) => { const prev = MAPS.find((x) => x.no === m.no - 1); return [Math.max(m.lv[0], prev ? prev.lv[1] : 1), m.lv[1]]; };
export function canGo(profile, from, to) {
  const m = mapById(to), r = roadBetween(from, to);
  if (!m || !r) return { ok: false, missing: ['Không có đường nối.'], built: !!(m && m.built) };
  if (!m.built || !(mapById(from) || {}).built) return { ok: false, missing: ['Vùng đất này còn chìm trong Gió Đen. Sắp mở!'], built: false };
  if (profile && profile.admin) return { ok: true, missing: [], built: true };
  const missing = (CONDITIONS[r.need] || CONDITIONS.later)(profile);
  return { ok: !missing.length, missing, built: true };
}
/** Has the child opened this map (can reach it from some built neighbour)? Used to light it on the world map. */
export const opened = (profile, id) => id === 'village' || neighbours(id).some((n) => canGo(profile, n, id).ok && (n === 'village' || opened(profile, n) )) || false;

/** Where the portals stand. Each lists the maps it leads to (two or more: the child chooses) and where the hero arrives in the other map. */
export const PORTALS = {
  village: [{ x: -30, z: -41.4, r: 3.2, yaw: 0, routes: ['forest', 'harbor'] }],
  forest: [{ x: -30, z: 57.5, r: 3.0, yaw: Math.PI, routes: ['village', 'desert'] }],
  harbor: [{ x: 46, z: 2, r: 3.0, yaw: -Math.PI / 2, routes: ['village'] }],
  desert: [{ x: 0, z: 64, r: 3.0, yaw: Math.PI, routes: ['forest', 'mountain'] }],
  mountain: [{ x: 0, z: 64, r: 3.0, yaw: Math.PI, routes: ['desert', 'ruins', 'sky', 'volcano'] }],
  ruins: [{ x: 0, z: 64, r: 3.0, yaw: Math.PI, routes: ['mountain', 'sky'] }],
  sky: [{ x: 0, z: 64, r: 3.0, yaw: Math.PI, routes: ['ruins', 'mountain', 'fairy'] }],
  fairy: [{ x: 0, z: 64, r: 3.0, yaw: Math.PI, routes: ['sky', 'volcano'] }],
  volcano: [{ x: 0, z: 64, r: 3.0, yaw: Math.PI, routes: ['fairy', 'mountain', 'crystal'] }],
  crystal: [{ x: 0, z: 64, r: 3.0, yaw: Math.PI, routes: ['volcano', 'city'] }],
  city: [{ x: 0, z: 64, r: 3.0, yaw: Math.PI, routes: ['crystal', 'dream'] }],
  dream: [{ x: 0, z: 64, r: 3.0, yaw: Math.PI, routes: ['city'] }],
};
export const portalsOf = (region) => PORTALS[region] || [];
/** The portal the hero stands at (within its radius), or null. */
export const portalAt = (region, x, z) => portalsOf(region).find((p) => Math.hypot(x - p.x, z - p.z) < p.r) || null;
/** The routes of a portal as the chooser shows them: { to, map, ok, missing }. */
export const routesOf = (profile, region, portal) => portal.routes.map((to) => { const c = canGo(profile, region, to); return { to, map: mapById(to), ...c }; });

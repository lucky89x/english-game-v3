// The world of ten maps joined by portals (24/11, docs/THE_GIOI_10_MAP.md). Pure rules, tested in node:
// which maps exist, which roads join them, what the child still needs for a road, and where each portal stands.
// Three maps are built (village, harbor, forest); the other seven are listed so the world map and the portals can show them as
// "coming soon" and the roads are in place when the maps arrive.

/** no: the map number (Unit no. of the grade book); region: the layout key; lv: the level range of its monsters as they are now
 *  (the plan is Sea 5-10 and Forest 10-20; the numbers here are what the game really uses until that is re-balanced). */
export const MAPS = [
  { no: 1, id: 'village', region: 'village', vi: 'Làng Khởi Đầu', en: 'Starter Village', lv: [1, 15], built: true, at: [0.18, 0.62] },
  { no: 2, id: 'harbor', region: 'harbor', vi: 'Biển cả · Cảng Mặt Trời', en: 'Sunny Harbor', lv: [21, 28], built: true, at: [0.20, 0.30] },
  { no: 3, id: 'forest', region: 'forest', vi: 'Rừng xanh · Rừng Ký Ức', en: 'Forest of Memories', lv: [11, 18], built: true, at: [0.38, 0.55] },
  { no: 4, id: 'desert', vi: 'Sa mạc cát vàng', en: 'Golden Desert', lv: [15, 25], built: false, at: [0.55, 0.72] },
  { no: 5, id: 'mountain', vi: 'Núi non', en: 'Mountains', lv: [20, 30], built: false, at: [0.58, 0.45] },
  { no: 6, id: 'sky', vi: 'Vương quốc trên trời', en: 'Sky Kingdom', lv: [35, 45], built: false, at: [0.74, 0.16] },
  { no: 7, id: 'ruins', vi: 'Khu di tích cổ', en: 'Ancient Ruins', lv: [25, 35], built: false, at: [0.78, 0.55] },
  { no: 8, id: 'fairy', vi: 'Đảo thần tiên', en: 'Fairy Isle', lv: [30, 40], built: false, at: [0.90, 0.28] },
  { no: 9, id: 'volcano', vi: 'Thung lũng núi lửa', en: 'Volcano Valley', lv: [40, 50], built: false, at: [0.62, 0.84] },
  { no: 10, id: 'crystal', vi: 'Hang tinh thể', en: 'Crystal Cave', lv: [45, 55], built: false, at: [0.86, 0.86] },
];
export const mapById = (id) => MAPS.find((m) => m.id === id) || null;
export const mapNo = (id) => (mapById(id) || {}).no || 0;

/** Roads between maps (they work both ways once open). `need` names a condition below; `built: false` when a map at an end does not exist yet. */
export const ROADS = [
  { a: 'village', b: 'forest', need: 'forest' },
  { a: 'village', b: 'harbor', need: 'sea' },
  { a: 'harbor', b: 'forest', need: 'coast' },      // the coast road of the plan (2-3): not walkable yet, both maps are reached from the village
  { a: 'forest', b: 'desert', need: 'later' },
  { a: 'desert', b: 'mountain', need: 'later' },
  { a: 'mountain', b: 'ruins', need: 'later' },
  { a: 'mountain', b: 'sky', need: 'later' },
  { a: 'sky', b: 'fairy', need: 'later' },
  { a: 'mountain', b: 'volcano', need: 'later' },
  { a: 'volcano', b: 'crystal', need: 'later' },
];

/** The conditions: what is missing (an array of Vietnamese lines; empty = open). */
const f = (p) => (p && p.flags) || {};
export const CONDITIONS = {
  forest: (p) => (f(p).forest_open ? [] : ['Giúp Tom và Ben ở quảng trường để nhận huy hiệu Người Giữ Từ.']),
  sea: (p) => (f(p).map2 ? [] : ['Lên cấp 20, đánh bại Golem Cổ và qua bài thi của Cú Mèo để mở Map 2.']),
  coast: () => ['Con đường ven biển chưa làm xong: đi qua Làng.'],
  later: () => ['Khu này sắp mở, em đang xây.'],
};
export const roadBetween = (a, b) => ROADS.find((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a)) || null;
/** The maps joined to this one by a road (any state). */
export const neighbours = (id) => ROADS.filter((r) => r.a === id || r.b === id).map((r) => (r.a === id ? r.b : r.a));
/** Can the child go from this map to that one? { ok, missing[], built } — the admin goes anywhere that is built. */
export function canGo(profile, from, to) {
  const m = mapById(to), r = roadBetween(from, to);
  if (!m || !r) return { ok: false, missing: ['Không có đường nối.'], built: !!(m && m.built) };
  if (!m.built || !(mapById(from) || {}).built) return { ok: false, missing: ['Khu này sắp mở, em đang xây.'], built: false };
  if (profile && profile.admin) return { ok: true, missing: [], built: true };
  const missing = (CONDITIONS[r.need] || CONDITIONS.later)(profile);
  return { ok: !missing.length, missing, built: true };
}
/** Has the child opened this map (can reach it from some built neighbour)? Used to light it on the world map. */
export const opened = (profile, id) => id === 'village' || neighbours(id).some((n) => canGo(profile, n, id).ok && (n === 'village' || opened(profile, n) )) || false;

/** Where the portals stand. Each lists the maps it leads to (two or more: the child chooses) and where the hero arrives in the other map. */
export const PORTALS = {
  village: [{ x: -30, z: -41.4, r: 3.2, yaw: 0, routes: ['forest', 'harbor'] }],
  forest: [{ x: -30, z: 57.5, r: 3.0, yaw: Math.PI, routes: ['village'] }],
  harbor: [{ x: 46, z: 2, r: 3.0, yaw: -Math.PI / 2, routes: ['village'] }],
};
export const portalsOf = (region) => PORTALS[region] || [];
/** The portal the hero stands at (within its radius), or null. */
export const portalAt = (region, x, z) => portalsOf(region).find((p) => Math.hypot(x - p.x, z - p.z) < p.r) || null;
/** The routes of a portal as the chooser shows them: { to, map, ok, missing }. */
export const routesOf = (profile, region, portal) => portal.routes.map((to) => { const c = canGo(profile, region, to); return { to, map: mapById(to), ...c }; });

// The child's house upgrades (20/11: "start with one floor, later the child buys two or three floors, a villa, a bigger garden").
// Pure rules (no three.js): what can be bought, in what order, and which room each piece of furniture stands in.
export const house = (profile) => profile.house || (profile.house = { floors: 1, villa: false, garden: 0 });
/** The upgrade list shown inside the house, with the English name children read and the Vietnamese meaning. */
export const UPGRADES = [      // (21/11) "the upgrades are too cheap: after one or two maps the house is full": prices raised
  { id: 'garden1', en: 'Bigger Garden', vi: 'Vườn vừa: thêm luống rau, bồn hoa, một cây ăn quả', cost: 600, level: 4, needs: (h) => h.garden === 0 },
  { id: 'coop', en: 'Chicken Coop', vi: 'Chuồng gà: 3 con gà đẻ trứng, nhặt trứng mang bán', cost: 450, level: 5, needs: (h) => !h.coop },
  { id: 'floor2', en: 'Second Floor', vi: 'Tầng 2: phòng ngủ chuyển lên tầng trên, có cầu thang', cost: 1500, level: 8, needs: (h) => h.floors === 1 },
  { id: 'pen', en: 'Pig Pen', vi: 'Chuồng lợn: nuôi lợn con lớn lên rồi bán', cost: 900, level: 10, needs: (h) => !h.pen },
  { id: 'garden2', en: 'Big Garden', vi: 'Vườn rộng: nhiều luống rau, bồn hoa, ao nhỏ, cổng hoa', cost: 1600, level: 12, needs: (h) => h.garden === 1 },
  { id: 'floor3', en: 'Third Floor', vi: 'Tầng 3: phòng nhạc ở tầng áp mái', cost: 3200, level: 18, needs: (h) => h.floors === 2 },
  { id: 'villa', en: 'Villa Style', vi: 'Biệt thự: cột đá, sàn đá hoa, đèn chùm, nhà ngoài sang trọng', cost: 6000, level: 25, needs: (h) => h.floors >= 2 && !h.villa },
];
export const upgradeState = (profile, id) => {
  const u = UPGRADES.find((x) => x.id === id), h = house(profile); if (!u) return { ok: false, why: 'none' };
  if (isDone(h, id)) return { ok: false, why: 'have' };
  if (!u.needs(h)) return { ok: false, why: 'need' };
  if (profile.stats.level < u.level) return { ok: false, why: 'level' };
  if (profile.stats.gold < u.cost) return { ok: false, why: 'gold' };
  return { ok: true, why: '' };
};
const isDone = (h, id) => (id === 'garden1' ? h.garden >= 1 : id === 'garden2' ? h.garden >= 2 : id === 'floor2' ? h.floors >= 2 : id === 'floor3' ? h.floors >= 3 : id === 'coop' ? !!h.coop : id === 'pen' ? !!h.pen : h.villa);
export function buyUpgrade(profile, id) {
  const s = upgradeState(profile, id); if (!s.ok) return s;
  const u = UPGRADES.find((x) => x.id === id), h = house(profile); profile.stats.gold -= u.cost;
  if (id === 'garden1') h.garden = 1; else if (id === 'garden2') h.garden = 2; else if (id === 'floor2') h.floors = 2; else if (id === 'floor3') h.floors = 3; else if (id === 'coop') h.coop = true; else if (id === 'pen') h.pen = true; else h.villa = true;
  return { ok: true, why: '' };
}
/** Furniture groups: each room of the house gets one group (the item ids keep their place inside the room). */
export const GROUPS = {
  living: ['sofa', 'lamp', 'plant', 'picture', 'clock', 'rug'],
  study: ['table', 'bookcase', 'desk'],
  bedroom: ['bed', 'wardrobe', 'mirror'],
  music: ['guitar', 'piano', 'drum', 'violin'],
};
/** Each floor has four rooms in a 2 x 2 block: back-left, back-right, front-left, front-right. A room name or '' for an empty room.
 *  With one floor everything is on the ground floor; the second floor takes the bedroom, the third the music room. */
export function floorPlan(h) {
  if (h.floors >= 3) return [['living', 'study', '', ''], ['', 'bedroom', '', ''], ['music', '', '', '']];      // (21/11) the room by the top of the stairs stays free
  if (h.floors === 2) return [['living', 'study', '', 'music'], ['', 'bedroom', '', '']];
  return [['living', 'study', 'bedroom', 'music']];
}
/** The garden: how many vegetable beds and flower beds, trees, and whether the pond and the flower gate are there. */
// (24/11) "the garden is too small to grow vegetables and flowers for income": the plot is bigger, with rows of beds (six to a row) north and south of the house.
export const gardenOf = (h) => ({ veg: 4 + 4 * h.garden, flowers: 4 + 2 * h.garden, trees: h.garden, pond: h.garden >= 2, arch: h.garden >= 2 });
/** (20/11) The plot: a white picket fence round the lot (x from the house's west side to 10.4 m east, with a gate on the east side). (24/11) z from 6.5 to 9.5 m: room for rows of beds. */
export const PLOT = { x0: -6.5, x1: 10.4, z: 9.5, gate: 1.4 };
/** Where bed i lies, relative to the house's centre: vegetable beds on the north side (rows going north), flower beds on the south side. */
export const bedOffset = (i) => [-4 + (i % 6) * 2.55, -5.4 - Math.floor(i / 6) * 1.7];
export const flowerOffset = (i) => [-4 + (i % 6) * 2.55, 5.4 + Math.floor(i / 6) * 1.7];
// ---------------------------------------------------------------- (21/11) walking inside the house
// "pressing E at the house should take the hero into a small map of its own: walk around, arrange the furniture, change
// the colours; one floor at first, the second floor opens when bought (designed in advance)". Pure rules for the walker.
/** (24/11) "the ceiling is too low: three times higher" (the partitions inside stay as low as they were). */
export const CEIL_K = 3, FLOOR_BASE = 3.7, PARTITION_H = 3.4;
export const FLOOR_H = FLOOR_BASE * CEIL_K;
// (25/11) "the rooms still feel cramped: twice as big; the villa must really be wider; the stairs are narrow and plain".
// Each floor of an ordinary house is 32 x 24 m (twice as wide and twice as deep as before), a villa 44 x 32 m. The stairs are 3 m wide and run
// along a side wall over most of the depth, so they climb gently. Everything below takes the house h (floors, villa) to know its size.
export const SIZE = { home: { hw: 15.9, hd: 11.9 }, villa: { hw: 21.9, hd: 15.9 } };
export const dims = (h) => (h && h.villa ? SIZE.villa : SIZE.home);
export const HALF_W = SIZE.home.hw, HALF_D = SIZE.home.hd;      // the ordinary house (older callers)
export const DOOR_HALF = 1.7;      // the doorway in the middle wall
export const STAIR_HALF = 1.5;
/** The stairs of floor f: front (low, z0) to back (high, z1), along the left wall (even floors) or the right wall (odd floors). */
export const stairOf = (h) => { const { hd } = dims(h); return { half: STAIR_HALF, z0: hd - 1.8, z1: -hd + 2.8 }; };
export const STAIR = stairOf({});
export const stairX = (f, h) => (f % 2 === 0 ? -1 : 1) * (dims(h).hw - STAIR_HALF - 0.25);
export const inStairColumn = (f, x, h) => Math.abs(x - stairX(f, h)) < STAIR_HALF;
/** Height on the stairs of floor f at z (z0 = the floor, z1 = the floor above). */
export const stairY = (f, z, h) => { const s = stairOf(h); return (f + Math.max(0, Math.min(1, (s.z0 - z) / (s.z0 - s.z1)))) * FLOOR_H; };
/** The four room centres of a floor (back-left, back-right, front-left, front-right). */
export const cellsOf = (h) => { const { hw, hd } = dims(h); return [[-hw / 2, -hd / 2], [hw / 2, -hd / 2], [-hw / 2, hd / 2], [hw / 2, hd / 2]]; };
/** True when a body of radius r can stand at (x, z) on floor f: inside the walls, not in the middle wall, not on this floor's
 *  stair block, not over the stairwell of the floor below. The front side (z > hd) is the open doll's-house edge. */
export function freeAt(h, f, x, z, r = 0.3) {
  const { hw, hd } = dims(h), s = stairOf(h);
  if (Math.abs(x) > hw - r || z < -hd + r || z > hd - r) return false;
  if (Math.abs(x) < 0.08 + r && Math.abs(z) > DOOR_HALF - r) return false;      // the middle wall, with a doorway
  if (f < (h.floors || 1) - 1 && Math.abs(x - stairX(f, h)) < STAIR_HALF + r && z > s.z1 - r && z < s.z0) return false;      // the stair block
  if (f > 0 && Math.abs(x - stairX(f - 1, h)) < STAIR_HALF + 0.2 + r && z > s.z1 && z < s.z0 - 0.06 + r) return false;      // the stairwell from below
  return true;
}
/** Colours the child can paint the walls and floors with. */
export const WALL_COLORS = { cream: { hex: 0xf2e6d0, vi: 'kem' }, mint: { hex: 0xcdeedc, vi: 'xanh bạc hà' }, sky: { hex: 0xcfe4f6, vi: 'xanh da trời' }, pink: { hex: 0xf8d6e2, vi: 'hồng' }, lavender: { hex: 0xe0d6f4, vi: 'tím oải hương' }, peach: { hex: 0xf8dcc4, vi: 'cam đào' }, white: { hex: 0xfaf8f2, vi: 'trắng' }, sage: { hex: 0xd6dfc4, vi: 'xanh rêu nhạt' } };
export const FLOOR_COLORS = { oak: { hex: 0xc08a50, vi: 'gỗ sồi' }, walnut: { hex: 0x7a4a2a, vi: 'gỗ óc chó' }, maple: { hex: 0xe0c08a, vi: 'gỗ thích' }, grey: { hex: 0x9a9a9e, vi: 'xám' }, marble: { hex: 0xeae6de, vi: 'đá hoa' }, teal: { hex: 0x4f9a9a, vi: 'thảm xanh' }, rose: { hex: 0xc87a8a, vi: 'thảm hồng' } };
export function paintOf(h) { const p = h.paint || {}; return { wall: WALL_COLORS[p.wall] ? p.wall : 'cream', floor: FLOOR_COLORS[p.floor] ? p.floor : 'oak' }; }
// ---------------------------------------------------------------- (24/11) paint costs gold
// "wall colours and furniture all cost money, and dearer": the starting colours (cream walls, oak boards) are free; every other
// colour is bought once (then switching back to a colour already paid for costs nothing).
export const PAINT_BASE = { wall: 260, floor: 380 }, PAINT_PREMIUM = { marble: 2, walnut: 1.5, maple: 1.25, teal: 1.4, lavender: 1.2 };
export const PAINT_FREE = { wall: 'cream', floor: 'oak' };
export const paintCost = (kind, key) => (key === PAINT_FREE[kind] ? 0 : Math.round(PAINT_BASE[kind] * (PAINT_PREMIUM[key] || 1) / 10) * 10);
/** Has this colour been paid for (or is it the free one, or the one the house already wears from before paint cost money)? */
export const ownsPaint = (h, kind, key) => key === PAINT_FREE[kind] || !!(h.paint && h.paint[kind] === key) || !!(h.paintOwned && (h.paintOwned[kind] || []).includes(key));
/** Paints (and pays for) a wall or floor colour. why: 'gold' | 'none'. */
export function buyPaint(profile, kind, key) {
  const list = kind === 'wall' ? WALL_COLORS : kind === 'floor' ? FLOOR_COLORS : null; if (!list || !list[key]) return { ok: false, why: 'none' };
  const h = house(profile), owned = ownsPaint(h, kind, key), cost = owned ? 0 : paintCost(kind, key);
  if (profile.stats.gold < cost) return { ok: false, why: 'gold', cost };
  profile.stats.gold -= cost; const o = (h.paintOwned || (h.paintOwned = { wall: [], floor: [] }))[kind] || (h.paintOwned[kind] = []);
  if (!o.includes(key)) o.push(key); h.paint = { ...paintOf(h), [kind]: key }; return { ok: true, why: '', cost };
}
/** Where the child put a piece of furniture: { f, x, z, ry } or null (its own place in its room). */
export const placeOf = (h, id) => (h.place && h.place[id]) || null;
export function setPlace(h, id, at) { (h.place || (h.place = {}))[id] = { f: at.f, x: +at.x.toFixed(2), z: +at.z.toFixed(2), ry: +(at.ry || 0).toFixed(3) }; }

// (21/11 change) "the hero learns only ONE element; in it: passives, a melee skill, an AOE skill, a single-target skill; the
// element can be changed": the hero picks an element (magic.el) and only that element's six lines take points. The three
// inner lines are the passives (nội tại); the spells are melee (cận chiến), single (đánh đơn, follows the locked target)
// and aoe (diện rộng). Changing the element gives every point back; the first choice and the first change are free.
// Mana: about 30 spells in a full bar at level 10, refilling fast out of a fight ("2 monsters emptied the whole bar").
//
// Magic skills (20/11: "hệ thống kỹ năng phép thuật… 4 hệ lửa băng gió sét, nội năng và ngoại năng, đánh gần và xa,
// quái cũng có 4 hệ, tương sinh tương khắc"). Pure rules, no three.js: tested in node.
//
// Every level up gives 1 skill point (points = level - 1). Each element has 6 lines of 10 ranks = 60, four elements = 240
// ranks, more than the 179 points a level-180 hero will ever have: the child must choose.
//  - Inner power (nội năng, passive, makes the hero stronger): core, guard, flow.
//  - Outer power (ngoại năng, the spells the hero casts): a close spell, a far spell and an ultimate.
// Elements beat each other in a ring: Fire > Ice > Thunder > Wind > Fire (x1.5 damage; x0.7 the other way).
// The ring backwards is the feeding ring (tương sinh): a hit of element B on a monster that still carries the mark of the
// element that feeds B sets off a combo. The beaten element feeds its beater: Ice feeds Fire (Steam Burst), Thunder feeds Ice
// (Hailstorm), Wind feeds Thunder (Thunderstorm), Fire feeds Wind (Firestorm).

export const ELEMENTS = {
  fire: { en: 'Fire', vi: 'Lửa', icon: '🔥', color: '#ff6a2a', hex: 0xff6a2a },
  ice: { en: 'Ice', vi: 'Băng', icon: '❄️', color: '#6fd0ff', hex: 0x6fd0ff },
  wind: { en: 'Wind', vi: 'Gió', icon: '🌪️', color: '#6fe08a', hex: 0x6fe08a },
  thunder: { en: 'Thunder', vi: 'Sét', icon: '⚡', color: '#ffd23c', hex: 0xffd23c },
};
export const EL_IDS = Object.keys(ELEMENTS);
/** Khắc: the element each one beats, with the reason told to the child. */
export const BEATS = { fire: 'ice', ice: 'thunder', thunder: 'wind', wind: 'fire' };
export const BEAT_WHY = { fire: 'Lửa làm tan Băng', ice: 'Băng bọc kín, chặn Sét', thunder: 'Sét xé tan Gió', wind: 'Gió thổi tắt Lửa' };
/** Sinh: FEEDS[a] = the element that a feeds (the one that beats a). */
export const FEEDS = { ice: 'fire', thunder: 'ice', wind: 'thunder', fire: 'wind' };
/** The combo when a hit of element `to` lands on a monster marked by `from` (FEEDS[from] === to). */
export const COMBOS = {
  'ice>fire': { en: 'Steam Burst', vi: 'Nổ hơi nước', bonus: 0.6 },
  'thunder>ice': { en: 'Hailstorm', vi: 'Mưa đá', bonus: 0.3, stun: 1.2 },
  'wind>thunder': { en: 'Thunderstorm', vi: 'Giông bão', bonus: 0.3, chain: 2 },
  'fire>wind': { en: 'Firestorm', vi: 'Bão lửa', bonus: 0.3, spread: 3 },
};
export const comboOf = (mark, el) => (mark && FEEDS[mark] === el ? COMBOS[`${mark}>${el}`] : null);
/** Damage factor of an attack of element `atk` on a target of element `def` (either may be empty). */
export function elementFactor(atk, def) {
  if (!atk || !def) return 1;
  if (BEATS[atk] === def) return 1.5;
  if (BEATS[def] === atk) return 0.7;
  return 1;
}

export const MAX_RANK = 10;
/** The six lines of every element. kind: inner (passive) or outer (a spell). Numbers are per rank. */
export const TREE = {
  fire: [
    { id: 'fire_core', kind: 'inner', en: 'Fire Heart', vi: 'Tâm Lửa', what: '+2 công mỗi bậc' },
    { id: 'fire_guard', kind: 'inner', en: 'Fire Guard', vi: 'Kháng Gió', what: '−4% sát thương hệ Gió (hệ khắc Lửa) nhận vào mỗi bậc' },
    { id: 'fire_flow', kind: 'inner', en: 'Burning Blood', vi: 'Huyết Lửa', what: 'phép trúng quái hồi 1% máu mỗi bậc' },
    { id: 'flame_slash', kind: 'outer', range: 'near', type: 'melee', en: 'Flame Slash', vi: 'Chém Lửa', what: 'cận chiến: chém lửa vòng cung 3 m, đốt cháy 3 giây', mul: 1.8, cost: 8, cool: 1.6 },
    { id: 'fireball', kind: 'outer', range: 'far', type: 'single', en: 'Fireball', vi: 'Quả Cầu Lửa', what: 'đánh đơn: cầu lửa bay theo mục tiêu 16 m, nổ nhỏ', mul: 1.9, cost: 10, cool: 2.2, needLevel: 2 },
    { id: 'meteor', kind: 'outer', range: 'aoe', type: 'aoe', en: 'Meteor Rain', vi: 'Mưa Thiên Thạch', what: 'diện rộng: 3 thiên thạch rơi quanh mục tiêu, nổ 2,5 m', mul: 1.5, cost: 24, cool: 9, needLevel: 6, needPts: 4 },
    { id: 'inferno', kind: 'outer', range: 'ult', type: 'ultimate', en: 'Inferno Nova', vi: 'Hỏa Ngục Bùng Nổ', what: 'TUYỆT KỸ: vòng lửa khổng lồ 9 m quanh mình nổ liên tiếp, đốt cháy 5 giây', mul: 3.2, cost: 60, cool: 30, needLevel: 12, needPts: 10 },
  ],
  ice: [
    { id: 'ice_core', kind: 'inner', en: 'Ice Skin', vi: 'Da Băng', what: '+1 thủ và +8 máu mỗi bậc' },
    { id: 'ice_guard', kind: 'inner', en: 'Ice Guard', vi: 'Kháng Lửa', what: '−4% sát thương hệ Lửa (hệ khắc Băng) nhận vào mỗi bậc' },
    { id: 'ice_flow', kind: 'inner', en: 'Cold Spring', vi: 'Suối Lạnh', what: '+10 máu tối đa mỗi bậc' },
    { id: 'frost_strike', kind: 'outer', range: 'near', type: 'melee', en: 'Frost Strike', vi: 'Đòn Băng Giá', what: 'cận chiến: chém băng vòng cung 3 m, làm chậm 50% trong 3 giây', mul: 1.7, cost: 8, cool: 1.6 },
    { id: 'ice_spear', kind: 'outer', range: 'far', type: 'single', en: 'Ice Spear', vi: 'Giáo Băng', what: 'đánh đơn: giáo băng bay theo mục tiêu 16 m, làm chậm', mul: 1.8, cost: 10, cool: 2.2, needLevel: 2 },
    { id: 'blizzard', kind: 'outer', range: 'aoe', type: 'aoe', en: 'Blizzard', vi: 'Bão Tuyết', what: 'diện rộng: bão tuyết quanh mình 6 m trong 4 giây, làm chậm', mul: 1.5, cost: 24, cool: 9, needLevel: 6, needPts: 4 },
    { id: 'absolute_zero', kind: 'outer', range: 'ult', type: 'ultimate', en: 'Absolute Zero', vi: 'Độ Không Tuyệt Đối', what: 'TUYỆT KỸ: đóng băng mọi quái trong 9 m, choáng 2,5 giây, làm chậm thêm', mul: 2.6, cost: 60, cool: 30, needLevel: 12, needPts: 10 },
  ],
  wind: [
    { id: 'wind_core', kind: 'inner', en: 'Wind Steps', vi: 'Bước Gió', what: '+3% tốc chạy và +2% né đòn mỗi bậc' },
    { id: 'wind_guard', kind: 'inner', en: 'Wind Guard', vi: 'Kháng Sét', what: '−4% sát thương hệ Sét (hệ khắc Gió) nhận vào mỗi bậc' },
    { id: 'wind_flow', kind: 'inner', en: 'Fresh Breath', vi: 'Hơi Thở Gió', what: '+0,5 mana hồi mỗi giây mỗi bậc' },
    { id: 'whirlwind', kind: 'outer', range: 'near', type: 'melee', en: 'Whirlwind', vi: 'Lốc Xoáy', what: 'cận chiến: xoay kiếm gió quanh mình 3,2 m, hất văng quái', mul: 1.6, cost: 8, cool: 1.6 },
    { id: 'wind_blade', kind: 'outer', range: 'far', type: 'single', en: 'Wind Blade', vi: 'Lưỡi Gió', what: 'đánh đơn: lưỡi gió bay theo mục tiêu 18 m, rất nhanh', mul: 1.8, cost: 10, cool: 2.0, needLevel: 2 },
    { id: 'tornado', kind: 'outer', range: 'aoe', type: 'aoe', en: 'Tornado', vi: 'Vòi Rồng', what: 'diện rộng: vòi rồng đi tới mục tiêu, hút quái vào trong 4 giây', mul: 1.5, cost: 24, cool: 9, needLevel: 6, needPts: 4 },
    { id: 'storm_eye', kind: 'outer', range: 'ult', type: 'ultimate', en: 'Eye of the Storm', vi: 'Mắt Bão', what: 'TUYỆT KỸ: hai vòi rồng khổng lồ hút mọi quái trong 8 m vào tâm bão 4 giây', mul: 3.0, cost: 60, cool: 30, needLevel: 12, needPts: 10 },
  ],
  thunder: [
    { id: 'thunder_core', kind: 'inner', en: 'Spark Mind', vi: 'Mạch Sét', what: '+2% chí mạng (×1,8 sát thương) mỗi bậc' },
    { id: 'thunder_guard', kind: 'inner', en: 'Thunder Guard', vi: 'Kháng Băng', what: '−4% sát thương hệ Băng (hệ khắc Sét) nhận vào mỗi bậc' },
    { id: 'thunder_flow', kind: 'inner', en: 'Quick Charge', vi: 'Nạp Nhanh', what: '−3% thời gian chờ phép mỗi bậc' },
    { id: 'thunder_fist', kind: 'outer', range: 'near', type: 'melee', en: 'Thunder Fist', vi: 'Quyền Sấm', what: 'cận chiến: đấm sấm 2,8 m, làm choáng 0,8 giây', mul: 1.9, cost: 8, cool: 1.6 },
    { id: 'lightning', kind: 'outer', range: 'far', type: 'single', en: 'Lightning Bolt', vi: 'Tia Sét', what: 'đánh đơn: sét đánh trúng ngay mục tiêu trong 14 m; từ bậc 5 lan sang 1 con nữa', mul: 1.75, cost: 10, cool: 2.2, needLevel: 2 },
    { id: 'thunderstorm', kind: 'outer', range: 'aoe', type: 'aoe', en: 'Thunderstorm', vi: 'Lôi Bão', what: 'diện rộng: 6 tia sét đánh các quái quanh mình 10 m', mul: 1.3, cost: 24, cool: 9, needLevel: 6, needPts: 4 },
    { id: 'judgement', kind: 'outer', range: 'ult', type: 'ultimate', en: 'Heaven\'s Judgement', vi: 'Thiên Lôi Phán Xét', what: 'TUYỆT KỸ: 14 tia sét giáng xuống quái trong 14 m, mỗi tia làm choáng nhẹ', mul: 2.4, cost: 60, cool: 30, needLevel: 12, needPts: 10 },
  ],
};
export const NODES = Object.fromEntries(Object.entries(TREE).flatMap(([el, list]) => list.map((n) => [n.id, { ...n, el }])));
export const SPELLS = Object.values(NODES).filter((n) => n.kind === 'outer');
export const TOTAL_RANKS = Object.keys(NODES).length * MAX_RANK;      // 240

/** The skill data of a profile: ranks per node, the 4 hotbar slots, the energy (mp). */
export function magic(p) {
  const m = p.magic || (p.magic = { ranks: {}, bar: [null, null, null, null], mp: null, resets: 0, el: '' });
  if (!m.ranks) m.ranks = {}; if (!Array.isArray(m.bar)) m.bar = [null, null, null, null];
  if (m.el === undefined) {      // an old save from the four-element tree: keep the element with the most points, give the rest back
    let best = '', bp = 0; for (const el of EL_IDS) { const n = TREE[el].reduce((a, x) => a + (m.ranks[x.id] || 0), 0); if (n > bp) { bp = n; best = el; } }
    m.el = best; for (const id of Object.keys(m.ranks)) if (!NODES[id] || NODES[id].el !== best) delete m.ranks[id];
    m.bar = m.bar.map((id) => (id && m.ranks[id] ? id : null));
  }
  return m;
}
/** The chosen element ('' before the first choice). */
export const elOf = (p) => magic(p).el || '';
/** Gold to change the element: only the first choice is free, every change costs 400 + 80 per level. */
export const changeCost = (p) => (!magic(p).el ? 0 : 400 + 80 * ((p.stats && p.stats.level) || 1));      // (24/11) "changing the element must not be cheap": only the first choice is free
/** Picks (or changes to) an element: every point comes back, the hotbar is cleared. */
export function chooseEl(p, el) {
  if (!ELEMENTS[el]) return { ok: false, why: 'none' };
  const m = magic(p); if (m.el === el) return { ok: true, cost: 0 };
  const cost = changeCost(p); if ((p.stats.gold || 0) < cost) return { ok: false, why: 'gold', cost };
  p.stats.gold -= cost; if (m.el) m.changes = (m.changes || 0) + 1;
  m.el = el; m.ranks = {}; m.bar = [null, null, null, null]; return { ok: true, cost };
}
/** The element's spells in hotbar order: melee, single, aoe, ultimate. */
export const spellsOf = (el) => (TREE[el] || []).filter((n) => n.kind === 'outer');
export const rank = (p, id) => (magic(p).ranks[id] || 0);
export const spent = (p) => Object.values(magic(p).ranks).reduce((a, n) => a + n, 0);
export const earned = (p) => Math.max(0, ((p.stats && p.stats.level) || 1));      // (21/11) one point from level 1, for the first skill
export const free = (p) => earned(p) - spent(p);
export const spentIn = (p, el) => TREE[el].reduce((a, n) => a + rank(p, n.id), 0);
/** Why a rank cannot be added now ('' when it can). */
export function blocked(p, id) {
  const n = NODES[id]; if (!n) return 'không có';
  const el = elOf(p); if (!el) return 'chọn hệ trước'; if (n.el !== el) return 'khác hệ';
  if (rank(p, id) >= MAX_RANK) return 'đã tối đa';
  if (free(p) <= 0) return 'hết điểm';
  if (n.needLevel && p.stats.level < n.needLevel) return `cần cấp ${n.needLevel}`;
  if (n.needPts && spentIn(p, n.el) - rank(p, id) < n.needPts) return `cần ${n.needPts} điểm hệ ${ELEMENTS[n.el].vi}`;
  return '';
}
/** Adds one rank. A new spell goes to the first empty hotbar slot. */
export function learn(p, id) {
  if (blocked(p, id)) return false;
  const m = magic(p); m.ranks[id] = rank(p, id) + 1;
  if (NODES[id].kind === 'outer' && m.ranks[id] === 1 && !m.bar.includes(id)) { const i = m.bar.indexOf(null); if (i >= 0) m.bar[i] = id; }
  return true;
}
/** Puts a learnt spell in hotbar slot i (0-3); a spell already in another slot moves. */
export function assign(p, i, id) {
  const m = magic(p); if (i < 0 || i > 3) return false;
  if (id && (!NODES[id] || NODES[id].kind !== 'outer' || !rank(p, id))) return false;
  const was = m.bar.indexOf(id); if (id && was >= 0) m.bar[was] = null;
  m.bar[i] = id || null; return true;
}
/** Takes every point back: free up to level 3, then 150 + 30 gold per level. */
export const resetCost = (p) => (p.stats.level <= 3 ? 0 : 150 + 30 * p.stats.level);      // (24/11) dear enough to make the child think; free up to level 3 to fix a first mistake
export function reset(p) {
  const cost = resetCost(p); if ((p.stats.gold || 0) < cost) return { ok: false, cost };
  p.stats.gold -= cost; const m = magic(p); m.ranks = {}; m.bar = [null, null, null, null]; m.resets = (m.resets || 0) + 1; return { ok: true, cost };      // the element stays
}

// ------------------------------------------------------------------ what the points and the gear give
const gearOf = (p) => p.gear || {};
/** Everything derived: bonus attack/defence/health, speed, dodge, crit, resistances, energy, cooldown, life steal and
 *  the per-element damage bonus of the worn gear. */
export function powers(p) {
  const g = gearOf(p), r = (id) => rank(p, id), resist = {}, dmg = {};
  for (const el of EL_IDS) { resist[el] = Math.min(0.6, r(`${BEATS[el]}_guard`) * 0.04 + ((g.resist && g.resist[el]) || 0)); dmg[el] = (g.eldmg && g.eldmg[el]) || 0; }      // (24/11) resist[X]: the guard of the element that X beats (Fire Guard resists Wind), gear resist is keyed by the attacking element
  return {
    atk: r('fire_core') * 2, def: r('ice_core'), hp: r('ice_core') * 8 + r('ice_flow') * 10,
    speed: r('wind_core') * 0.03, dodge: Math.min(0.3, r('wind_core') * 0.02), crit: Math.min(0.4, r('thunder_core') * 0.02),
    lifesteal: r('fire_flow') * 0.01, cdr: Math.min(0.3, r('thunder_flow') * 0.03),
    mpMax: 100 + ((p.stats && p.stats.level) || 1) * 6, mpRegen: 4 + ((p.stats && p.stats.level) || 1) * 0.1 + r('wind_flow') * 0.5,
    resist, dmg, weaponEl: g.el || '', near: g.near || 0, far: g.far || 0,
  };
}
/** A spell's damage before the target's element: attack × (spell factor + 12% per extra rank) × the gear's bonuses. */
export function spellDamage(p, id, atk) {
  const n = NODES[id], lv = Math.max(1, rank(p, id)), pw = powers(p);
  const gearMul = 1 + (pw.dmg[n.el] || 0) + (n.range === 'near' ? pw.near : pw.far) * (pw.weaponEl === n.el ? 1 : 0.5);
  return Math.round(atk * (n.mul + 0.12 * (lv - 1)) * gearMul);
}
export const spellCost = (id) => NODES[id].cost;
export const spellCool = (p, id) => +(NODES[id].cool * (1 - powers(p).cdr)).toFixed(2);
/** Energy now (starts full); spend returns false when there is not enough. */
export function mpOf(p) { const m = magic(p), max = powers(p).mpMax; if (m.mp === null || m.mp === undefined || m.mp > max) m.mp = max; return m.mp; }
export function spend(p, n) { const now = mpOf(p); if (now < n) return false; magic(p).mp = now - n; return true; }
/** Mana potion: adds up to n, never past the maximum; returns what was added. */
export function restoreMp(p, n) { const max = powers(p).mpMax, now = mpOf(p), got = Math.max(0, Math.min(max - now, n)); magic(p).mp = now + got; return got; }
/** Mana comes back by itself; three times as fast out of a fight (calm). */
export function regen(p, dt, calm = false) { const max = powers(p).mpMax, m = magic(p); m.mp = Math.min(max, mpOf(p) + powers(p).mpRegen * (calm ? 3 : 1) * dt); return m.mp; }
/** Damage a monster's hit does after the element resistance (the plain armour is in rules.hurt). */
/** (24/11) the ring works against the hero too: a monster whose element beats the hero's hits 25% harder, one the hero's element beats hits 20% softer. */
export function incomingFactor(p, el) { const e = elOf(p); return !el || !e ? 1 : BEATS[el] === e ? 1.25 : BEATS[e] === el ? 0.8 : 1; }
export const resisted = (p, dmg, el) => Math.max(1, Math.round(dmg * incomingFactor(p, el) * (1 - (el ? powers(p).resist[el] : 0))));

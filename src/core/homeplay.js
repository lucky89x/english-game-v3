// (27/11, turn 64) The home as a reason to come back: "the child's house follows the child through all twelve lands, so it must
// give a purpose: build, decorate, upgrade, and learn English there". Pure rules, tested in node:
//  - WORD LABELS: every piece of furniture has an English name; the child "labels" a piece by hearing its name and picking it.
//  - COMFORT: points for the furniture, the labels, the upgrades, the colours and the compass pieces; levels with a name.
//  - REST: once a day a sleep in one's own bed fills the health and gives a little more EXP from monsters for a while
//    (more with a higher comfort level): `restMul` in save.js reads it.
//  - FIND IT!: Pip names a piece ("Find the lamp!", "Find the thing next to the bed!") and the child walks to it.
import { ITEMS, home, trophyOf } from './rules.js';
import { house, UPGRADES, paintOf, PAINT_FREE } from './house.js';
import { pieces as compassPieces } from './saga.js';

/** The labels a child has earned: { itemId: true }. */
export const labels = (p) => { const h = home(p); return h.labels || (h.labels = {}); };
export const isLabelled = (p, id) => !!labels(p)[id];
/** Labels a piece the child owns. Returns true when the label is new. */
export function addLabel(p, id) { if (!ITEMS[id] || !home(p).items.includes(id) || labels(p)[id]) return false; labels(p)[id] = true; return true; }

/** Comfort points of one piece: dearer pieces count more (1 to 6); a labelled piece counts LABEL_POINTS more. */
export const LABEL_POINTS = 2, UPGRADE_POINTS = 8, PAINT_POINTS = 3, COMPASS_POINTS = 4, SOUVENIR_POINTS = 8, TROPHY_POINTS = 5;      // a souvenir of a land and a boss trophy count more than furniture
export const piecePoints = (id) => { const it = ITEMS[id]; return !it || (it.slot !== 'home' && it.slot !== 'yard') ? 0 : it.land ? SOUVENIR_POINTS : it.trophy ? TROPHY_POINTS : Math.max(1, Math.min(6, Math.round(it.cost / 150))); };
export const COMFORT_LEVELS = [
  { at: 0, en: 'Bare', vi: 'Trống trải' }, { at: 12, en: 'Tidy', vi: 'Gọn gàng' }, { at: 30, en: 'Cosy', vi: 'Ấm cúng' }, { at: 55, en: 'Homely', vi: 'Thân thương' },
  { at: 90, en: 'Charming', vi: 'Xinh xắn' }, { at: 135, en: 'Lovely', vi: 'Đáng yêu' }, { at: 190, en: 'Splendid', vi: 'Lộng lẫy' }, { at: 255, en: 'Grand', vi: 'Tráng lệ' },
  { at: 330, en: 'Dream Home', vi: 'Ngôi nhà mơ ước' }, { at: 410, en: 'Palace of Words', vi: 'Cung điện Ngôn Từ' },      // the last two need souvenirs and trophies from the later lands
];
/** The trophies of the guards the child has beaten go to the home by themselves. Returns the ids that were added now. */
export function syncTrophies(p) { const got = [], h = home(p); for (const [flag, on] of Object.entries(p.flags || {})) { const id = trophyOf(flag); if (on && ITEMS[id] && ITEMS[id].trophy === flag && !h.items.includes(id)) { h.items.push(id); got.push(id); } } return got; }
/** { score, parts: { furniture, labels, house, paint, compass }, level (0…7), en, vi, next (points of the next level, or null), rest (% more EXP after a sleep) }. */
export function comfort(p) {
  const items = home(p).items || [], lb = labels(p), h = house(p), pt = paintOf(h);
  const parts = {
    furniture: items.reduce((n, id) => n + piecePoints(id), 0),
    labels: items.filter((id) => lb[id] && piecePoints(id)).length * LABEL_POINTS,
    house: (h.floors - 1 + (h.villa ? 1 : 0) + h.garden + (h.coop ? 1 : 0) + (h.pen ? 1 : 0)) * UPGRADE_POINTS,
    paint: ((pt.wall !== PAINT_FREE.wall ? 1 : 0) + (pt.floor !== PAINT_FREE.floor ? 1 : 0)) * PAINT_POINTS,
    compass: compassPieces(p).length * COMPASS_POINTS,
  };
  const score = Object.values(parts).reduce((a, b) => a + b, 0); let level = 0; COMFORT_LEVELS.forEach((l, i) => { if (score >= l.at) level = i; });
  const nx = COMFORT_LEVELS[level + 1];
  return { score, parts, level, en: COMFORT_LEVELS[level].en, vi: COMFORT_LEVELS[level].vi, next: nx ? nx.at : null, rest: restPct(level) };
}
export const MAX_UPGRADES = UPGRADES.length;

// ---------------------------------------------------------------- a sleep in one's own bed
export const REST_MINUTES = 20;
/** How much more EXP monsters give after a sleep: 5% in a bare house, one more for every comfort level (14% in a palace of words). */
export const restPct = (level) => 5 + Math.max(0, Math.min(COMFORT_LEVELS.length - 1, level));
/** Can the child sleep now? { ok, why: 'bed' (no bed yet) | 'day' (slept today already) }. */
export function canRest(p, today) { if (!home(p).items.includes('bed')) return { ok: false, why: 'bed' }; if (p.rest && p.rest.day === today) return { ok: false, why: 'day' }; return { ok: true, why: '' }; }
/** Goes to sleep: marks the day and when the rested time ends. The caller fills the health. Returns { ok, why, pct, minutes }. */
export function startRest(p, now, today) { const c = canRest(p, today); if (!c.ok) return c; const pct = comfort(p).rest; p.rest = { day: today, until: now + REST_MINUTES * 60000, pct }; return { ok: true, why: '', pct, minutes: REST_MINUTES }; }
/** Minutes of rested time left (0 when over). */
export const restLeft = (p, now) => (p && p.rest && p.rest.until > now ? Math.ceil((p.rest.until - now) / 60000) : 0);

// ---------------------------------------------------------------- Find it!
export const FIND_ROUNDS = 5, FIND_PAID = 2;      // five things a game; the first two games of a day pay EXP
const nameOf = (id) => ITEMS[id].en.toLowerCase();
/** The piece nearest to `ref` on its floor (not itself), or null; `max` metres at most. */
export function neighbour(list, ref, max = 3.2) { let best = null, bd = max; for (const q of list) { if (q.id === ref.id || q.f !== ref.f) continue; const d = Math.hypot(q.x - ref.x, q.z - ref.z); if (d < bd) { bd = d; best = q; } } return best; }
/** One round. list: the pieces in the house [{ id, f, x, z }]; not: ids asked already; hard: use "next to" clues more often.
 *  Returns { target, kind: 'name' | 'next', ref, en, vi } or null when the house has too few pieces. */
export function findRound(list, { not = [], hard = false, rnd = Math.random } = {}) {
  const pool = list.filter((q) => ITEMS[q.id]); if (pool.length < 3) return null;
  const fresh = pool.filter((q) => !not.includes(q.id)), from = fresh.length ? fresh : pool, target = from[Math.floor(rnd() * from.length) % from.length];
  // "next to": some other piece whose nearest neighbour is the target (so the clue has one answer)
  const refs = pool.filter((r) => r.id !== target.id && (neighbour(pool, r) || {}).id === target.id);
  if (refs.length && rnd() < (hard ? 0.6 : 0.3)) { const ref = refs[Math.floor(rnd() * refs.length) % refs.length]; return { target: target.id, kind: 'next', ref: ref.id, en: `Find the thing next to the ${nameOf(ref.id)}!`, vi: `Tìm món đồ ở cạnh ${ITEMS[ref.id].vi}.` }; }
  return { target: target.id, kind: 'name', ref: null, en: `Find the ${nameOf(target.id)}!`, vi: 'Đi tới đúng món đồ rồi bấm F.' };
}
/** Does this game still pay EXP today? Counts the game when it does. */
export function findPays(p, today) { const f = p.findDay && p.findDay.day === today ? p.findDay : (p.findDay = { day: today, n: 0 }); if (f.n >= FIND_PAID) return false; f.n += 1; return true; }

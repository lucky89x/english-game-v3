// Treasure maps in English (19/11): each map is a few short imperative sentences that lead to a spot on Treasure Isle
// ("Start at the old boat. Walk eight steps north, then five steps east. Dig there!"). Directions, numbers and place words are
// the practice. One step is one metre; north is up on the minimap (towards -z), east is to the right (+x). Pure rules: the
// island's places and a "can I stand here" test come in as arguments, so node can test every map that can be drawn.
import { mulberry32 } from './regionkit.js';

export const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen'];
export const DIRS = { north: { d: [0, -1], vi: 'phía bắc (lên trên bản đồ nhỏ)' }, south: { d: [0, 1], vi: 'phía nam (xuống dưới)' }, east: { d: [1, 0], vi: 'phía đông (sang phải)' }, west: { d: [-1, 0], vi: 'phía tây (sang trái)' } };
export const MAX_DAILY = 2, TOLERANCE = 1.9;
const SIDES = Object.keys(DIRS);
const pick = (rnd, a) => a[Math.floor(rnd() * a.length)];
const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const step = (n) => `${NUM[n]} step${n === 1 ? '' : 's'}`;
const KINDS = [null, ['near', 'walk1', 'walk1'], ['walk2', 'between', 'near', 'walk2'], ['walk2', 'walk3', 'between', 'walk3']];

/** One map: { kind, lines (English), vi (Vietnamese help), goal: { x, z }, start?, moves? }. ok(x, z): true when someone can stand there. */
export function makeMap(rnd, tier, marks, ok) {
  const ids = Object.keys(marks), spots = ids.filter((id) => marks[id].r >= 0.8);
  for (let tries = 0; tries < 120; tries++) {
    const kind = pick(rnd, KINDS[Math.max(1, Math.min(3, tier))]);
    if (kind === 'between') {
      const [a, b] = [pick(rnd, spots), pick(rnd, spots)]; if (a === b || Math.hypot(marks[a].x - marks[b].x, marks[a].z - marks[b].z) < 10) continue;
      const goal = { x: (marks[a].x + marks[b].x) / 2, z: (marks[a].z + marks[b].z) / 2 }; if (!ok(goal.x, goal.z) || ids.some((i) => Math.hypot(goal.x - marks[i].x, goal.z - marks[i].z) < marks[i].r + 1.5)) continue;
      return { kind, a, b, goal, lines: [`The treasure is exactly halfway between the ${marks[a].en} and the ${marks[b].en}.`, 'Dig there!'], vi: [`Kho báu nằm chính giữa ${marks[a].vi} và ${marks[b].vi}.`, 'Hãy đào ở đó!'] };
    }
    const s = pick(rnd, ids), m = marks[s];
    if (kind === 'near') {
      const side = pick(rnd, SIDES), v = DIRS[side].d, goal = { x: m.x + v[0] * (m.r + 1.7), z: m.z + v[1] * (m.r + 1.7) };
      if (!ok(goal.x, goal.z)) continue;
      return { kind, start: s, goal, lines: [`Go to the ${m.en}.`, `The treasure is on its ${side} side, right next to it. Dig there!`], vi: [`Đi tới ${m.vi}.`, `Kho báu ở ${DIRS[side].vi} của nó, sát bên cạnh. Hãy đào ở đó!`] };
    }
    const count = kind === 'walk1' ? 1 : kind === 'walk2' ? 2 : 3, first = pick(rnd, SIDES), moves = []; let { x, z } = m, last = first, good = true;
    for (let i = 0; i < count; i++) {
      const dir = i === 0 ? first : pick(rnd, SIDES.filter((d) => d !== last && !(DIRS[d].d[0] === -DIRS[last].d[0] && DIRS[d].d[1] === -DIRS[last].d[1]))), n = 3 + Math.floor(rnd() * 8);
      x += DIRS[dir].d[0] * n; z += DIRS[dir].d[1] * n; moves.push({ dir, n }); last = dir;
    }
    if (!good || !ok(x, z) || ids.some((i) => Math.hypot(x - marks[i].x, z - marks[i].z) < marks[i].r + 1.2)) continue;
    const say = moves.map((mv, i) => `${i === 0 ? 'Walk' : i === moves.length - 1 && moves.length > 1 ? 'Then walk' : 'Then walk'} ${step(mv.n)} ${mv.dir}`);
    return { kind, start: s, moves, goal: { x, z }, lines: [`Start at the ${m.en}.`, `${say.join('. ')}.`, 'Dig there!'], vi: [`Xuất phát từ ${m.vi}.`, moves.map((mv, i) => `${i ? 'Rồi đi' : 'Đi'} ${mv.n} bước về ${DIRS[mv.dir].vi}`).join('. ') + '.', 'Hãy đào ở đó! (1 bước = 1 mét)'] };
  }
  return null;
}
export const dist = (map, x, z) => Math.hypot(map.goal.x - x, map.goal.z - z);
export const isGoal = (map, x, z) => dist(map, x, z) <= TOLERANCE;
/** How warm a wrong dig is: the child hears it in English. */
export function warmth(d) {
  if (d < 4) return { en: 'Very hot! You are so close!', vi: 'Rất nóng! Con ở rất gần rồi!' }; if (d < 8) return { en: 'Warm. You are getting closer.', vi: 'Ấm. Con đang đến gần hơn.' };
  if (d < 14) return { en: 'Cool. Read the map again.', vi: 'Mát. Đọc lại bản đồ nhé.' }; return { en: 'Cold! The treasure is far from here.', vi: 'Lạnh! Kho báu còn xa chỗ này.' };
}
export const state = (p) => p.treasure || (p.treasure = { day: 0, n: 0, total: 0, map: null });
/** Today's current map for a child (made once, the same after a reload); null when today's maps are all found. */
export function current(p, day, tier, marks, ok) {
  const t = state(p); if (t.day !== day) { t.day = day; t.n = 0; t.map = null; }
  if (t.n >= MAX_DAILY) return null;
  if (!t.map) t.map = makeMap(mulberry32(hash(`${p.id}:${day}:${t.n}`)), tier, marks, ok);
  return t.map;
}
export function solved(p) { const t = state(p); t.n += 1; t.total += 1; t.map = null; return t; }
export const reward = (tier) => ({ gold: 30 + 15 * tier, exp: 70 + 40 * tier });

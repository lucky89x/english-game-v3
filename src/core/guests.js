// (27/11, turn 65) Guests at home: "a visitor who asks for things in English, with the grammar of the land's unit".
// Once a day one of the people the child has helped comes to the child's house and asks three things: to be shown a piece
// ("Can you show me your lamp?"), to be helped with a sentence (the grammar of that person's land = unit), and to have a piece
// moved ("Can you put the vase next to the sofa, please?" — prepositions of place, done in arrange mode). Pure rules, tested in node.
import { ITEMS } from './rules.js';
import { mobGold } from './progress.js';
import { neighbour } from './homeplay.js';

/** Who can come, in the order of the story. needs: the flag that makes this person a friend; unit: whose grammar they ask about. */
export const GUESTS = [
  { id: 'tom', who: 'Tom', file: 'npc_tom_elder_v03', unit: 1, needs: 'badge1', hi: 'What a lovely home! May I look around?' },
  { id: 'sam', who: 'Sam', file: 'npc_sam_fisherman_v02', unit: 2, needs: 'map2', hi: 'Ahoy! Your house is much drier than my boat.' },
  { id: 'lily', who: 'Lily', file: 'npc_lily_druid_v02', unit: 3, needs: 'boss2', hi: 'Hello! I brought the smell of the forest with me.' },
  { id: 'zara', who: 'Zara', file: 'npc_desert_elder_v01', unit: 4, needs: 'boss5', hi: 'May I come in? I have so many questions about your home!' },
  { id: 'bjorn', who: 'Bjorn', file: 'npc_forge_blacksmith_v01', unit: 5, needs: 'boss6', hi: 'Ho ho! Your home is warmer than my lodge.' },
  { id: 'ada', who: 'Professor Ada', file: 'npc_village_professor', unit: 6, needs: 'boss7', hi: 'Good day! Every home tells a story. Let me read yours.' },
  { id: 'aria', who: 'Aria', file: 'npc_desert_guide_v01', unit: 7, needs: 'boss8', hi: 'Hi! I flew down from the sky to see you.' },
  { id: 'flora', who: 'Flora', file: 'npc_lily_druid_v02', unit: 8, needs: 'boss9', hi: 'Hello, hello! Is this where the hero lives? How pretty!' },
  { id: 'brann', who: 'Brann', file: 'npc_forge_blacksmith_v01', unit: 9, needs: 'boss10', hi: 'Evening! No lava here. I like it already.' },
  { id: 'opal', who: 'Opal', file: 'npc_desert_guide_v01', unit: 10, needs: 'boss11', hi: 'Hi! I got your message, so here I am.' },
  { id: 'nova', who: 'Nova', file: 'npc_village_professor', unit: 11, needs: 'boss12', hi: 'Hello! If you show me round, I will tell you about my new robot.' },
  { id: 'hugh', who: 'Hugh', file: 'npc_hush_lord_v01', unit: 12, needs: 'boss13', hi: 'Hello… friend. Thank you for asking me to come.' },
];
export const guestById = (id) => GUESTS.find((g) => g.id === id) || null;
/** The friends who can visit this child now. */
export const roster = (p) => GUESTS.filter((g) => p && p.flags && p.flags[g.needs]);
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
/** Today's guest: one of the friends, the same all day, another one most days; null when nobody can come yet or the visit is over. */
export function todayGuest(p, today) {
  const r = roster(p); if (!r.length || (p.guestDay === today)) return null;
  return r[hash(today + ':' + (p.id || p.name || '')) % r.length];
}
/** The visits this child has had: { guestId: count }. */
export const visits = (p) => p.guests || (p.guests = {});
export const friendsMade = (p) => Object.keys((p && p.guests) || {}).filter((id) => p.guests[id] > 0 && guestById(id)).length;

/** Too big to ask a child to carry about for a guest (they can still be arranged with B). */
export const HEAVY = new Set(['bed', 'wardrobe', 'bookcase', 'sofa', 'table', 'desk', 'dining', 'fridge', 'stove', 'counter', 'fireplace', 'piano', 'dresser', 'tv', 'aquarium', 'statue', 'drum']);
export const PUT_NEAR = 2.2;      // "next to": the two pieces stand this close (centre to centre, same floor)
const low = (id) => ITEMS[id].en.toLowerCase();
/** Is piece `a` next to piece `b` now? list: [{ id, f, x, z }]. */
export function putDone(list, a, b) { const A = list.find((q) => q.id === a), B = list.find((q) => q.id === b); return !!(A && B && A.f === B.f && Math.hypot(A.x - B.x, A.z - B.z) <= PUT_NEAR); }
/**
 * The three things a guest asks. list: the pieces of the house [{ id, f, x, z, wall, flat }]; grammar: items of the guest's unit for
 * the child's grade ([] when none is written: another "show me" instead). Returns [] when the house has fewer than three pieces.
 * A task: { kind: 'show' | 'next' | 'grammar' | 'put', en, vi, target?, ref?, a?, b?, item? }.
 */
export function planVisit(list, { grammar = [], rnd = Math.random } = {}) {
  const pool = list.filter((q) => ITEMS[q.id]); if (pool.length < 3) return [];
  const pick = (arr) => arr[Math.floor(rnd() * arr.length) % arr.length], tasks = [], used = [];
  const show = () => { const fresh = pool.filter((q) => !used.includes(q.id)), t = pick(fresh.length ? fresh : pool); used.push(t.id); return { kind: 'show', target: t.id, en: `Can you show me your ${low(t.id)}?`, vi: 'Đi tới đúng món đồ rồi bấm F.' }; };
  tasks.push(show());
  if (grammar.length) { const g = pick(grammar); tasks.push({ kind: 'grammar', item: g, en: `Help me say this the right way: ${g.q}`, vi: 'Chọn dạng đúng điền vào chỗ trống.' }); }
  else { const refs = pool.filter((r) => { const n = neighbour(pool, r); return n && !used.includes(n.id); }); if (refs.length) { const ref = pick(refs), t = neighbour(pool, ref); used.push(t.id); tasks.push({ kind: 'next', target: t.id, ref: ref.id, en: `What is next to the ${low(ref.id)}? Please show me.`, vi: `Tìm món đồ ở cạnh ${ITEMS[ref.id].vi} rồi bấm F.` }); } else tasks.push(show()); }
  // "put A next to B": A can be carried (not on a wall, not a rug), B stands somewhere else, and they are not together already
  const light = pool.filter((q) => !q.wall && !q.flat && !HEAVY.has(q.id)), movers = light.length ? light : pool.filter((q) => !q.wall && !q.flat), pairs = [];      // a guest asks for a lamp to be moved, not a bed
  for (const a of movers) for (const b of pool) { if (a.id === b.id || b.wall || b.flat) continue; if (a.f !== b.f || Math.hypot(a.x - b.x, a.z - b.z) > PUT_NEAR + 1) pairs.push([a, b]); }
  if (pairs.length) { const [a, b] = pick(pairs); tasks.push({ kind: 'put', a: a.id, b: b.id, en: `Can you put the ${low(a.id)} next to the ${low(b.id)}, please?`, vi: `Bấm B để sắp xếp: nhấc ${ITEMS[a.id].vi} lên, đặt sát ${ITEMS[b.id].vi}.` }); }
  else tasks.push(show());
  return tasks;
}
/** The visit is over: counts it, closes the day. Returns { gold, first (the first visit of this friend) }. */
export function finishVisit(p, guestId, today) {
  const v = visits(p), first = !v[guestId]; v[guestId] = (v[guestId] || 0) + 1; p.guestDay = today;
  return { gold: Math.max(20, Math.round(mobGold(p.stats.level) * 10 / 5) * 5), first };
}

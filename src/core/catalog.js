// Read-only curriculum data copied from the Godot project's data/learning (stable ids g6_u01...).
// A grade only ever gets its own content; missing content returns null/[] and the caller says so.
const cache = new Map();
let units = null;
const BASE = new URL('../../data/learning/', import.meta.url);
export async function loadUnits() {
  if (!units) units = (await (await fetch(new URL('units.json', BASE))).json()).units;
  return units;
}
export async function unit(grade, n) {
  const id = `g${grade}_u${String(n).padStart(2, '0')}`;
  if (cache.has(id)) return cache.get(id);
  let data = null;
  try { const r = await fetch(new URL(id + '.json', BASE)); if (r.ok) data = await r.json(); } catch { data = null; }
  if (data && Number(data.grade) !== grade) data = null;
  cache.set(id, data);
  return data;
}
/** Loads the 12 units of one grade in parallel (once). */
export async function loadGrade(grade) {
  return Promise.all(Array.from({ length: 12 }, (_, i) => unit(grade, i + 1)));
}
/** Finds `word` in this grade's units 1..12 only. Returns {id, word, vi} or null. */
export async function findWord(grade, word) {
  const units = await loadGrade(grade);
  for (let n = 1; n <= 12; n++) {
    const u = units[n - 1];
    const hit = u && (u.vocabulary || []).find((w) => w.word.toLowerCase() === word.toLowerCase());
    if (hit) return { id: `g${grade}_u${String(n).padStart(2, '0')}:${word.toLowerCase()}`, word: hit.word, vi: hit.vi };
  }
  return null;
}

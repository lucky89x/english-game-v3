// Read-only curriculum data copied from the Godot project's data/learning (stable ids g6_u01...).
// A grade only ever gets its own content; missing content returns null/[] and the caller says so.
const cache = new Map();
const BASE = new URL('../../data/learning/', import.meta.url);
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

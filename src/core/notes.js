// (27/11, turn 72) The parent's review notes ("a debug panel on F1 for the admin: I note what I want changed right where
// it is, then export one file so the fixes follow what I mean"). A note keeps what was written and WHERE: the land and the
// spot, what the hero stood beside, the talk or window that was open, the spell just cast, a small picture of the screen.
// This file is the plain data: making, keeping, listing and exporting notes. The panel is ui/notes.js.

export const KEY = 'eq-review-notes', VERSION = 1, FILE_KIND = 'english-quest-notes';
export const KINDS = [['vfx', 'Hiệu ứng chiêu'], ['art', 'Hình ảnh · mô hình'], ['text', 'Chữ · tiếng Anh'], ['play', 'Cách chơi · độ khó'], ['bug', 'Lỗi'], ['sound', 'Âm thanh'], ['other', 'Khác']];
export const LEVELS = [['must', 'Cần sửa'], ['nice', 'Nên sửa'], ['idea', 'Ý tưởng']];
const label = (table, id) => (table.find((r) => r[0] === id) || table[table.length - 1])[1];
export const kindVi = (id) => label(KINDS, id), levelVi = (id) => label(LEVELS, id);
const str = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
const num = (v) => (Number.isFinite(Number(v)) ? Math.round(Number(v) * 10) / 10 : null);

/** The place of a note, cleaned: only known fields, short strings. */
export function cleanWhere(w = {}) {
  const o = { region: str(w.region, 24), land: str(w.land, 60), x: num(w.x), z: num(w.z), inside: str(w.inside, 30), near: str(w.near, 120), mob: str(w.mob, 40), dialog: str(w.dialog, 300), window: str(w.window, 80), spell: str(w.spell, 40), picked: str(w.picked, 300),
    px: num(w.px), pz: num(w.pz), quality: str(w.quality, 12), grade: num(w.grade), level: num(w.level), quest: str(w.quest, 120) };
  for (const k of Object.keys(o)) if (o[k] === '' || o[k] === null) delete o[k];
  return o;
}
export function cleanNote(n = {}, k = 0) {
  return { id: Number.isInteger(n.id) && n.id > 0 ? n.id : k + 1, at: str(n.at, 30) || new Date(0).toISOString(), kind: KINDS.some((r) => r[0] === n.kind) ? n.kind : 'other', level: LEVELS.some((r) => r[0] === n.level) ? n.level : 'must',
    text: String(n.text == null ? '' : n.text).trim().slice(0, 2000), where: cleanWhere(n.where), shot: typeof n.shot === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(n.shot) && n.shot.length < 400000 ? n.shot : '', done: !!n.done };
}
export function load(storage = globalThis.localStorage) {
  try { const d = JSON.parse(storage.getItem(KEY) || '[]'); return (Array.isArray(d) ? d : []).map(cleanNote).filter((n) => n.text); } catch { return []; }
}
/** Keeps the notes; when the storage is full the oldest pictures are dropped first (the words are never lost for a picture). */
export function save(list, storage = globalThis.localStorage) {
  const data = list.map(cleanNote);
  for (let drop = 0; drop <= data.length; drop++) {
    try { storage.setItem(KEY, JSON.stringify(data)); return { ok: true, dropped: drop }; } catch { const k = data.findIndex((n) => n.shot); if (k < 0) break; data[k].shot = ''; list[k].shot = ''; }
  }
  return { ok: false, dropped: 0 };
}
export function add(list, note, now = new Date()) {
  const n = cleanNote({ ...note, id: list.reduce((m, x) => Math.max(m, x.id), 0) + 1, at: now.toISOString() }); if (!n.text) return null;
  list.push(n); return n;
}
export const remove = (list, id) => { const i = list.findIndex((n) => n.id === id); if (i >= 0) list.splice(i, 1); return i >= 0; };
export const here = (list, region) => list.filter((n) => n.where.region === region);

/** One line that says where a note was made. */
export function whereLine(w = {}) {
  const parts = [];
  if (w.land || w.region) parts.push((w.land || w.region) + (w.x != null && w.z != null ? ` (${w.x}, ${w.z})` : ''));
  if (w.inside) parts.push('trong: ' + w.inside);
  if (w.window) parts.push('bảng đang mở: ' + w.window);
  if (w.spell) parts.push('chiêu: ' + w.spell);
  if (w.near) parts.push('đứng cạnh: ' + w.near);
  if (w.mob) parts.push('quái gần nhất: ' + w.mob);
  if (w.picked) parts.push('chỉ vào: "' + w.picked + '"' + (w.px != null && w.pz != null ? ` (${w.px}, ${w.pz})` : ''));
  if (w.dialog) parts.push('hộp thoại: "' + w.dialog + '"');
  return parts.join(' · ');
}
const two = (n) => String(n).padStart(2, '0');
export const fileName = (d = new Date()) => `english-quest-gop-y-${d.getFullYear()}${two(d.getMonth() + 1)}${two(d.getDate())}-${two(d.getHours())}${two(d.getMinutes())}.json`;
/** The file the parent sends back: every note, with its place and picture. */
export function exportFile(list, meta = {}, now = new Date()) {
  return JSON.stringify({ kind: FILE_KIND, version: VERSION, made: now.toISOString(), game: { build: str(meta.build, 40), quality: str(meta.quality, 12), screen: str(meta.screen, 20), gpu: str(meta.gpu, 120) }, notes: list.map(cleanNote) }, null, 1);
}
/** The same notes as plain words (no pictures), to paste into a chat. */
export function exportText(list, now = new Date()) {
  const open = list.filter((n) => !n.done), lines = [`GÓP Ý ENGLISH QUEST · ${now.toISOString().slice(0, 16).replace('T', ' ')} · ${open.length} ghi chú`];
  for (const [kind, vi] of KINDS) {
    const of = open.filter((n) => n.kind === kind); if (!of.length) continue;
    lines.push('', `## ${vi} (${of.length})`);
    for (const n of of) lines.push(`#${n.id} [${levelVi(n.level)}] ${n.text}`, `   ở: ${whereLine(n.where) || 'không rõ'}${n.where.quality ? ` · đồ hoạ ${n.where.quality}` : ''}${n.shot ? ' · có ảnh trong file' : ''}`);
  }
  return lines.join('\n');
}
/** Reads an exported file (or the plain list kept in the storage): { notes, made, game } or null. */
export function parse(text) {
  try { const d = JSON.parse(text); if (Array.isArray(d)) return { notes: d.map(cleanNote), made: '', game: {} }; if (!d || d.kind !== FILE_KIND || !Array.isArray(d.notes)) return null; return { notes: d.notes.map(cleanNote), made: str(d.made, 30), game: d.game || {} }; } catch { return null; }
}

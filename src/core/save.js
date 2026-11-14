// Local, versioned saves with several child profiles. Nothing leaves the browser.
// Layout: { version, last, profiles: [{ id, name, grade, unit, created, quests, flags, words, skills, stats }] }
export const SAVE_VERSION = 2;
export const KEY = 'english-quest-web';
export const GRADES = [6, 7, 8, 9];

export function emptyStore() { return { version: SAVE_VERSION, last: '', profiles: [] }; }
export function newProfile(name, grade, id) {
  return { id: id || 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    name: String(name || '').trim().slice(0, 20) || 'Người chơi', grade: GRADES.includes(grade) ? grade : 6, unit: 1,
    created: new Date().toISOString(), quests: {}, flags: {}, words: {}, skills: {}, stats: { gold: 0, exp: 0, level: 1 } };
}
/** v1 (single profile, no skills/unit) -> v2. Unknown newer versions are refused, never downgraded. */
export function migrate(data) {
  if (!data || typeof data !== 'object') return emptyStore();
  let v = Number(data.version) || 1;
  if (v > SAVE_VERSION) throw new Error('Tệp lưu từ phiên bản mới hơn (' + v + ')');
  if (v === 1) {
    const p = newProfile(data.name || 'Người chơi 1', Number(data.grade) || 6, 'legacy');
    Object.assign(p, { quests: data.quests || {}, flags: data.flags || {}, words: data.words || {}, stats: { gold: 0, exp: 0, level: 1, ...(data.stats || {}) } });
    data = { version: 2, last: 'legacy', profiles: [p] };
    v = 2;
  }
  data.version = v;
  data.profiles = (data.profiles || []).map((p) => ({ ...newProfile(p.name, p.grade, p.id), ...p, stats: { gold: 0, exp: 0, level: 1, ...(p.stats || {}) } }));
  return data;
}
export function load(storage = globalThis.localStorage) {
  try { const raw = storage.getItem(KEY); return raw ? migrate(JSON.parse(raw)) : emptyStore(); }
  catch (e) { console.warn('save: cannot load, starting fresh', e); return emptyStore(); }
}
export function persist(store, storage = globalThis.localStorage) {
  const text = JSON.stringify(store);
  const old = storage.getItem(KEY);
  if (old) storage.setItem(KEY + '.bak', old);          // keep the last good save
  storage.setItem(KEY, text);
}
export function exportProfile(profile) { return JSON.stringify({ kind: 'english-quest-profile', version: SAVE_VERSION, profile }, null, 2); }
export function importProfile(store, text) {
  const data = JSON.parse(text);
  if (data.kind !== 'english-quest-profile' || !data.profile) throw new Error('Không phải tệp hồ sơ English Quest');
  if (Number(data.version) > SAVE_VERSION) throw new Error('Tệp hồ sơ từ phiên bản mới hơn');
  const p = { ...newProfile(data.profile.name, data.profile.grade), ...data.profile };
  const i = store.profiles.findIndex((x) => x.id === p.id);
  if (i >= 0) store.profiles[i] = p; else store.profiles.push(p);
  return p;
}
/** Per skill counters: {attempts, correct, firstTry, hints}. */
export function recordSkill(profile, skill, correct, hints) {
  const row = profile.skills[skill] || (profile.skills[skill] = { attempts: 0, correct: 0, firstTry: 0, hints: 0 });
  row.attempts += 1; row.hints += hints || 0;
  if (correct) { row.correct += 1; if (!hints) row.firstTry += 1; }
}
export function addExp(profile, amount) {
  const s = profile.stats; s.exp += amount;
  let need = 60 + (s.level - 1) * 30, ups = 0;
  while (s.exp >= need) { s.exp -= need; s.level += 1; ups += 1; need = 60 + (s.level - 1) * 30; }
  return ups;
}

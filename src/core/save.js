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
/** EXP needed to go from `level` to the next one. Map 1 (levels 1-20) needs 9,405 EXP in all: about 8-10 hours of
 *  mixed play at roughly 1,000 EXP an hour (fights, hunts, chests, a few mini games). Change this line to retune. */
export const expNeed = (level) => 90 + (level - 1) * 45;
/** Total EXP from level 1 to `level`. */
export const expTo = (level) => { let t = 0; for (let l = 1; l < level; l++) t += expNeed(l); return t; };
/** Unit being studied: the one a parent picked, otherwise the unit of the map reached (Map 1 = Unit 1, Map 2 = Unit 2). */
export const unitOf = (profile) => profile.unitPick || (profile.flags && profile.flags.map2 ? 2 : 1);
/** Hit points grow with the level; equipment adds on top (profile.gear, later). */
export const maxHp = (profile) => 100 + (profile.stats.level - 1) * 12 + ((profile.gear && profile.gear.hp) || 0);
/** Knowledge gates: at these levels the bar fills but the next level waits for a short word review (the owl). */
export const GATES = [5, 10, 15, 20, 25, 30];          // 25 and 30: Map 2 (Unit 2 words)
export const gateWaiting = (profile) => { const L = profile.stats.level; return GATES.includes(L) && !(profile.gates && profile.gates[L]) ? L : 0; };
export function passGate(profile, level) { (profile.gates || (profile.gates = {}))[level] = true; return addExp(profile, 0); }
export function addExp(profile, amount) {
  const s = profile.stats; s.exp += amount;
  let need = expNeed(s.level), ups = 0;
  while (s.exp >= need && !gateWaiting(profile)) { s.exp -= need; s.level += 1; ups += 1; need = expNeed(s.level); }
  if (gateWaiting(profile)) s.exp = Math.min(s.exp, need);        // full bar, nothing wasted beyond it
  return ups;
}

// Local, versioned saves with several child profiles. Nothing leaves the browser.
// Layout: { version, last, profiles: [{ id, name, grade, unit, created, quests, flags, words, skills, stats }] }
import { rankHp } from './saga.js';
import { powers } from './skills.js';
import { EXP_K, expNeed, expTo, levelCap, expFactor } from './progress.js';
export { EXP_K, expNeed, expTo };      // (24/11) the curve moved to progress.js, next to the level caps
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
/** The desktop app (desktop/preload.js) also keeps the save in a file; browsers have only the page storage. */
const desk = () => (typeof globalThis.eqDesktop === 'object' && globalThis.eqDesktop) || null;
export function load(storage = globalThis.localStorage) {
  try {
    let raw = storage.getItem(KEY);
    if (!raw && storage === globalThis.localStorage && desk()) { raw = desk().readSave(); if (raw) storage.setItem(KEY, raw); }      // empty page storage: restore from the file
    return raw ? migrate(JSON.parse(raw)) : emptyStore();
  } catch (e) { console.warn('save: cannot load, starting fresh', e); return emptyStore(); }
}
export function persist(store, storage = globalThis.localStorage) {
  const text = JSON.stringify(store);
  const old = storage.getItem(KEY);
  if (old) storage.setItem(KEY + '.bak', old);          // keep the last good save
  storage.setItem(KEY, text);
  if (storage === globalThis.localStorage && desk()) desk().writeSave(text);
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
/** hooks.skill(profile, correct): set by the game to count right answers for the daily quests. */
export const hooks = { skill: null };
export function recordSkill(profile, skill, correct, hints) {
  if (hooks.skill) hooks.skill(profile, correct);
  const row = profile.skills[skill] || (profile.skills[skill] = { attempts: 0, correct: 0, firstTry: 0, hints: 0 });
  row.attempts += 1; row.hints += hints || 0;
  if (correct) { row.correct += 1; if (!hints) row.firstTry += 1; }
}
/** Unit being studied: the one a parent picked, otherwise the unit of the map reached (Map 1 = Unit 1, Map 2 = Unit 2). */
/** (24/11) The unit follows the MAP the child is in, and the grade she registered: Map N teaches Global Success Unit N
 *  (docs/LO_TRINH_12_UNIT.md; the world map of docs/THE_GIOI_10_MAP.md: 1 village, 2 sea, 3 forest…). The parent's unit picker is gone;
 *  `unitPick` stays only as an override for the admin and the tests. */
export const MAP_NO = { village: 1, harbor: 2, isle: 2, forest: 3 };
export const unitOf = (profile) => profile.unitPick || MAP_NO[profile.region] || (profile.flags && profile.flags.map2 ? 2 : 1);
/** Hit points grow with the level; equipment adds on top (profile.gear, later). */
export const maxHp = (profile) => 100 + (profile.stats.level - 1) * 12 + ((profile.gear && profile.gear.hp) || 0) + rankHp(profile) + powers(profile).hp;      // + the Word Keeper rank (saga.js) and skill points (skills.js)
/** Knowledge gates: at these levels the bar fills but the next level waits for a short word review (the owl). */
export const GATES = Array.from({ length: 14 }, (_, i) => (i + 1) * 5);          // every 5 levels up to 70 (the owl's review)
export const gateWaiting = (profile) => { const L = profile.stats.level; return GATES.includes(L) && !(profile.gates && profile.gates[L]) ? L : 0; };
export function passGate(profile, level) { (profile.gates || (profile.gates = {}))[level] = true; return addExp(profile, 0); }
/** (24/11) The hero stops at the top level of the map they are in (core/progress.js `levelCap`): nothing earns EXP there any more, so
 *  grinding the same ground pays nothing and the child must move on. Returns how many levels were gained. */
export function addExp(profile, amount) {
  const s = profile.stats, cap = levelCap(profile);
  if (s.level >= cap) { s.exp = Math.min(s.exp, expNeed(s.level)); return 0; }
  s.exp += amount;
  let need = expNeed(s.level), ups = 0;
  while (s.exp >= need && !gateWaiting(profile) && s.level < cap) { s.exp -= need; s.level += 1; ups += 1; need = expNeed(s.level); }
  if (gateWaiting(profile) || s.level >= cap) s.exp = Math.min(s.exp, need);        // full bar, nothing wasted beyond it
  return ups;
}
/** Is the hero at the top level of this map (no more EXP here)? */
export const atCap = (profile) => profile.stats.level >= levelCap(profile);
/** EXP a kill of a monster of level `mLevel` really gives: the base EXP, less for monsters far below the hero, none at the cap. */
export function killExp(profile, base, mLevel) { return atCap(profile) ? 0 : Math.max(1, Math.round(base * expFactor(profile.stats.level, mLevel || 1))); }

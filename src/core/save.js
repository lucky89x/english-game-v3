// Local, versioned saves with several child profiles. Nothing leaves the browser.
// Layout: { version, last, profiles: [{ id, name, grade, unit, created, quests, flags, words, skills, stats }] }
import { rankHp } from './saga.js';
import { powers } from './skills.js';
import { expNeed, expTo, levelCap, expFactor, capGoldFactor, scaleExp } from './progress.js';
export { expNeed, expTo, scaleExp };      // (24/11) the curve moved to progress.js, next to the level caps
export const SAVE_VERSION = 2;
export const KEY = 'english-quest-web';
export const GRADES = [6, 7, 8, 9];

export function emptyStore() { return { version: SAVE_VERSION, last: '', profiles: [] }; }
export function newProfile(name, grade, id) {
  return { id: id || 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    name: String(name || '').replace(/[<>&"'`]/g, '').trim().slice(0, 20) || 'Người chơi', grade: GRADES.includes(grade) ? grade : 6, unit: 1,
    created: new Date().toISOString(), quests: {}, flags: {}, words: {}, skills: {}, stats: { gold: 0, exp: 0, level: 1 } };
}
/** v1 (single profile, no skills/unit) -> v2. Unknown newer versions are refused, never downgraded.
 *  (26/11) One broken profile no longer loses the others: entries that are not objects are dropped, missing or null fields get their
 *  defaults, and level / exp / gold are forced back to numbers (a NaN there stopped the hero from ever levelling). */
const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const num = (x, d) => (Number.isFinite(Number(x)) && x !== null && x !== '' ? Number(x) : d);
export function cleanProfile(p) {
  const q = { ...newProfile(p.name, p.grade, p.id), ...p }, s = obj(p.stats);
  q.name = String(q.name || '').replace(/[<>&"'`]/g, '').trim().slice(0, 20) || 'Người chơi';      // the name goes into the panels' HTML
  q.quests = obj(p.quests); q.flags = obj(p.flags); q.words = obj(p.words); q.skills = obj(p.skills);
  q.stats = { ...s, gold: Math.max(0, num(s.gold, 0)), exp: Math.max(0, num(s.exp, 0)), level: Math.max(1, Math.floor(num(s.level, 1))) };
  return q;
}
export function migrate(data) {
  if (!data || typeof data !== 'object') return emptyStore();
  let v = Number(data.version) || (Array.isArray(data.profiles) ? SAVE_VERSION : 1);      // a v2 store that lost its version field is still a v2 store
  if (v > SAVE_VERSION) throw new Error('Tệp lưu từ phiên bản mới hơn (' + v + ')');
  if (v === 1) {
    const p = newProfile(data.name || 'Người chơi 1', Number(data.grade) || 6, 'legacy');
    Object.assign(p, { quests: data.quests || {}, flags: data.flags || {}, words: data.words || {}, stats: { gold: 0, exp: 0, level: 1, ...(data.stats || {}) } });
    data = { version: 2, last: 'legacy', profiles: [p] };
    v = 2;
  }
  data.version = v;
  data.profiles = (Array.isArray(data.profiles) ? data.profiles : []).filter((p) => p && typeof p === 'object').map(cleanProfile);
  return data;
}
/** The desktop app (desktop/preload.js) also keeps the save in a file; browsers have only the page storage. */
const desk = () => (typeof globalThis.eqDesktop === 'object' && globalThis.eqDesktop) || null;
const get = (storage, key) => { try { return storage.getItem(key); } catch { return null; } };
const put = (storage, key, text) => { try { storage.setItem(key, text); return true; } catch { return false; } };
const parse = (raw) => { if (!raw) return null; try { return migrate(JSON.parse(raw)); } catch { return null; } };
/** What the last load() found: recovered = 'bak' | 'file' when the main save could not be read and a copy was used; lost = true when
 *  nothing could be read at all (the unreadable text is kept under KEY + '.corrupt', never thrown away). The game tells the parent. */
export const loadInfo = { recovered: '', lost: false };
let goodText = null;      // the text of the save we last read or wrote successfully (so persist can tell a good save from a broken one cheaply)
/** (26/11) A save that cannot be read is no longer treated as "nobody has played": the copy before the last save (.bak) is tried, then
 *  the desktop file; the broken text is put aside. Before, the next save overwrote everything and the .bak was never read. */
export function load(storage = globalThis.localStorage) {
  loadInfo.recovered = ''; loadInfo.lost = false; goodText = null;
  const local = storage === globalThis.localStorage, d = local ? desk() : null;
  const fileRaw = () => { try { return d ? d.readSave() : ''; } catch { return ''; } };
  const raw = get(storage, KEY), main = parse(raw);
  if (main) { goodText = raw; return main; }
  if (raw) put(storage, KEY + '.corrupt', raw);          // unreadable (broken, or written by a newer game): keep it for a rescue
  const bakRaw = raw ? get(storage, KEY + '.bak') : null, bak = parse(bakRaw);
  if (bak) { loadInfo.recovered = 'bak'; put(storage, KEY, bakRaw); goodText = bakRaw; return bak; }
  const fRaw = fileRaw(), file = parse(fRaw);
  if (file) { if (raw) loadInfo.recovered = 'file'; put(storage, KEY, fRaw); goodText = fRaw; return file; }      // empty page storage: restore from the file (as before)
  if (raw) { loadInfo.lost = true; console.warn('save: cannot read the save; it was kept under ' + KEY + '.corrupt'); }
  return emptyStore();
}
export function persist(store, storage = globalThis.localStorage) {
  const text = JSON.stringify(store), old = get(storage, KEY);
  if (old && old !== text && (old === goodText || parse(old))) put(storage, KEY + '.bak', old);          // keep the last GOOD save (never a broken one)
  let err = null; try { storage.setItem(KEY, text); goodText = text; } catch (e) { err = e; }
  if (storage === globalThis.localStorage && desk()) { try { desk().writeSave(text); } catch (e) { err = err || e; } }      // the file is written even when the page storage is full
  if (err) throw err;
}
export function exportProfile(profile) { return JSON.stringify({ kind: 'english-quest-profile', version: SAVE_VERSION, profile }, null, 2); }
export function importProfile(store, text) {
  const data = JSON.parse(text);
  if (data.kind !== 'english-quest-profile' || !data.profile) throw new Error('Không phải tệp hồ sơ English Quest');
  if (Number(data.version) > SAVE_VERSION) throw new Error('Tệp hồ sơ từ phiên bản mới hơn');
  const p = cleanProfile(data.profile); delete p.admin;      // (26/11) a file cannot make itself the admin; broken fields get their defaults
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
export const MAP_NO = { village: 1, harbor: 2, isle: 2, forest: 3, desert: 4, mountain: 5, ruins: 6, sky: 7, fairy: 8, volcano: 9, crystal: 10, city: 11, dream: 12 };      // (26/11) maps 4-7 teach units 4-7
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
  const s = profile.stats, cap = levelCap(profile); amount = Number(amount) || 0; if (!Number.isFinite(s.exp)) s.exp = 0;      // never a NaN in the bar
  if (s.level >= cap) { s.exp = Math.min(s.exp, expNeed(s.level)); return 0; }
  s.exp += amount;
  let need = expNeed(s.level), ups = 0;
  while (s.exp >= need && !gateWaiting(profile) && s.level < cap) { s.exp -= need; s.level += 1; ups += 1; need = expNeed(s.level); }
  if (gateWaiting(profile) || s.level >= cap) s.exp = Math.min(s.exp, need);        // full bar, nothing wasted beyond it
  return ups;
}
/** (25/11) EXP of a quest or a story step, written in the old units of the code and scaled to the bar of the hero's level now. */
export const bonusExp = (profile, base) => addExp(profile, scaleExp(profile.stats.level, base));
/** Is the hero at the top level of this map (no more EXP here)? */
export const atCap = (profile) => profile.stats.level >= levelCap(profile);
/** EXP a kill of a monster of level `mLevel` really gives: the base EXP, less for monsters far below the hero, none at the cap. */
/** (27/11) After a sleep at home (core/homeplay.js) monsters give a little more EXP until `rest.until`. */
export const restMul = (profile, now = Date.now()) => (profile && profile.rest && profile.rest.until > now ? 1 + (Number(profile.rest.pct) || 0) / 100 : 1);
export function killExp(profile, base, mLevel) { return atCap(profile) ? 0 : Math.max(1, Math.round(base * expFactor(profile.stats.level, mLevel || 1) * restMul(profile))); }
/** (24/11) Gold of a monster or a quest for this hero: full below the map's top level; at the top level half, fading to none with every reward
 *  taken there (`profile.capN[cap]` counts them; a new map has a new cap, so the gold comes back). */
export function capGold(profile, gold) {
  if (!gold || !atCap(profile)) return gold;
  const cap = levelCap(profile), n = ((profile.capN || (profile.capN = {}))[cap]) || 0; profile.capN[cap] = n + 1;
  return Math.round(gold * capGoldFactor(n));
}

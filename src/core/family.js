// The family ship and the weekly board (19/11): both children share one save, so everything they do adds points to one ship
// that grows level by level (a reward for each child at each level), and every week the two children compete for the crown.
// A parent also gets a short weekly report (questions answered, how many right, words met). Pure rules; the data lives in
// store.family so it is shared by all profiles. The admin never scores.
export const POINTS = { right: 2, kill: 1, chest: 3, bubble: 2, mini: 3, star: 2, song: 2, shopquest: 3, sea_kill: 1, sea_chest: 2, sea_bubble: 1, sea_job: 6, sea_game: 2, sea_fish: 1, treasure: 8, pet: 2 };
/** Cumulative points needed for each ship level (level 0 is the start). */
export const SHIP = [0, 150, 400, 800, 1400, 2200, 3200, 4500];
export const SHIP_NAMES = [
  { en: 'Rowboat', vi: 'thuyền chèo' }, { en: 'Sailboat', vi: 'thuyền buồm' }, { en: 'Fishing boat', vi: 'tàu cá' }, { en: 'Ferry', vi: 'phà' },
  { en: 'Steamship', vi: 'tàu hơi nước' }, { en: 'Cargo ship', vi: 'tàu chở hàng' }, { en: 'Cruise ship', vi: 'du thuyền' }, { en: 'Pirate galleon', vi: 'thuyền hải tặc' },
];
export const shipLevel = (pts) => SHIP.filter((n) => pts >= n).length - 1;
export const nextNeed = (pts) => SHIP.find((n) => n > pts) ?? null;
/** Weeks start on Monday (epoch day 0 was a Thursday). */
export const weekOf = (day) => Math.floor((day + 3) / 7);
export const fam = (store) => store.family || (store.family = { pts: 0, week: 0, scores: {}, last: null, claimed: {}, snap: {} });
const kids = (profiles) => profiles.filter((p) => !p.admin);
const total = (p, key) => Object.values(p.skills || {}).reduce((a, s) => a + (s[key] || 0), 0);
const snapshot = (profiles) => Object.fromEntries(kids(profiles).map((p) => [p.id, { right: total(p, 'correct'), tries: total(p, 'attempts'), words: Object.keys(p.words || {}).length }]));
export function champion(scores, profiles) {
  let best = null, bn = 0, tie = false;
  for (const p of kids(profiles)) { const n = scores[p.id] || 0; if (n > bn) { best = p.id; bn = n; tie = false; } else if (n === bn && n > 0) tie = true; }
  return tie ? null : best;
}
/** Starts a new week when the day has moved on: the old board is kept as last week's, the report counters restart. Returns true then. */
export function roll(store, day, profiles = store.profiles || []) {
  const f = fam(store), w = weekOf(day); if (f.week === w) return false;
  if (f.week) f.last = { week: f.week, scores: { ...f.scores }, champ: champion(f.scores, profiles) };
  f.week = w; f.scores = {}; f.snap = snapshot(profiles); return true;
}
/** Adds the points of a game event for this child. Returns { n, up } (up: the new ship level when the ship just grew). */
export function addPoints(store, profile, ev, day) {
  const n = POINTS[ev] || 0; if (!n || profile.admin) return { n: 0, up: 0 };
  roll(store, day); const f = fam(store), before = shipLevel(f.pts);
  f.pts += n; f.scores[profile.id] = (f.scores[profile.id] || 0) + n; const after = shipLevel(f.pts);
  return { n, up: after > before ? after : 0 };
}
/** Ship levels this child has not been paid for yet, and the gold (40 per level number: level 3 pays 120). */
export function pending(store, profile) { const lvl = shipLevel(fam(store).pts), done = fam(store).claimed[profile.id] || 0, list = []; for (let l = done + 1; l <= lvl; l++) list.push(l); return { levels: list, gold: list.reduce((a, l) => a + 40 * l, 0) }; }
export function claim(store, profile) { const r = pending(store, profile); if (!r.levels.length) return null; fam(store).claimed[profile.id] = r.levels[r.levels.length - 1]; profile.stats.gold += r.gold; return r; }
/** The weekly report: for each child the points, questions answered, how many were right and the words met since the week began. */
export function weekReport(store, profiles) {
  const f = fam(store);
  return kids(profiles).map((p) => { const s = f.snap[p.id] || { right: 0, tries: 0, words: 0 }, right = total(p, 'correct') - s.right, tries = total(p, 'attempts') - s.tries;
    return { id: p.id, name: p.name, grade: p.grade, pts: f.scores[p.id] || 0, tries: Math.max(0, tries), right: Math.max(0, right), words: Math.max(0, Object.keys(p.words || {}).length - s.words), pct: tries > 0 ? Math.round(right / tries * 100) : 0 }; });
}

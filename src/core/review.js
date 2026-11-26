// Spaced repetition (Leitner boxes) per word, kept in the student's profile.
// wrong -> box 0 (again today); right with a hint -> stays low (short interval);
// right without a hint -> up one box (longer interval); repeated mastery -> up to 30 days.
export const INTERVAL_DAYS = [0, 1, 2, 4, 7, 15, 30];
export const MAX_BOX = INTERVAL_DAYS.length - 1;
/** Day number in the player's own time zone, so "tomorrow" starts at local midnight (UTC would flip at 07:00 in Vietnam). */
export const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);

/** result: {correct, hints, ms}. Returns the updated row. */
export function record(words, id, result, day = today()) {
  const was = words[id] ? { due: words[id].due } : null; let keep = false;
  const row = words[id] || { box: 0, due: day, seen: 0, right: 0, wrong: 0, firstTry: 0, hints: 0, ms: 0, last: day };
  row.seen += 1; row.last = day; row.hints += result.hints || 0; row.ms = Math.round(result.ms || 0);
  if (!result.correct) { row.wrong += 1; row.box = 0; }
  else {
    row.right += 1;
    // (26/11) a word climbs one box only when it was DUE (or new): six right answers in one afternoon used to push it 30 days away
    if ((result.hints || 0) === 0) { row.firstTry += 1; if (!was || was.due <= day) row.box = Math.min(row.box + 1, MAX_BOX); else keep = true; }
    else row.box = 1;      // needed help: review again tomorrow
  }
  if (!keep) row.due = day + INTERVAL_DAYS[row.box];      // an early right answer leaves the date alone
  words[id] = row;
  return row;
}
export function dueIds(words, day = today()) {
  return Object.keys(words).filter((id) => words[id].due <= day).sort((a, b) => words[a].box - words[b].box);
}
export function learned(words) { return Object.values(words).filter((r) => r.right > 0).length; }

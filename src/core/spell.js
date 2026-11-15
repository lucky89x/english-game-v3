// Letter-lock rules for the word chests (pure). The child rebuilds the English word from shuffled letter tiles.
const ABC = 'abcdefghijklmnopqrstuvwxyz';
export const letters = (word) => [...word.toLowerCase()].filter((ch) => ch !== ' ' && ch !== '-' && ch !== "'");
/** Tiles: the word's letters plus `decoys` extra ones, shuffled. Each tile {ch, used}. */
export function tiles(word, rnd, decoys = 2) {
  const t = letters(word).map((ch) => ({ ch, used: false }));
  for (let i = 0; i < decoys; i++) t.push({ ch: ABC[Math.floor(rnd() * 26)], used: false });
  for (let i = t.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [t[i], t[j]] = [t[j], t[i]]; }
  return t;
}
/** state {word, typed, wrong}. Pressing tile i: right letter is placed, wrong one counts a mistake. Returns 'ok' | 'wrong' | 'done' | 'used'. */
export function press(state, tl, i) {
  const t = tl[i]; if (!t || t.used) return 'used';
  const need = letters(state.word)[state.typed.length];
  if (t.ch !== need) { state.wrong += 1; return 'wrong'; }
  t.used = true; state.typed += t.ch;
  return state.typed.length === letters(state.word).length ? 'done' : 'ok';
}
/** Shows the word with the typed letters filled in and spaces kept: "pen_il ca__". */
export function shown(state) {
  let k = 0; const ls = letters(state.word);
  return [...state.word].map((ch) => (/[ \-']/.test(ch) ? ch : k < state.typed.length ? ls[k++] : (k++, '_'))).join('');
}
/** Words that fit a chest: 3..12 letters. */
export const spellable = (w) => { const n = letters(w).length; return n >= 3 && n <= 12 && /^[a-z \-']+$/i.test(w); };
export const chestReward = (wrong) => ({ gold: Math.max(6, 15 - wrong * 3), exp: Math.max(8, 20 - wrong * 4) });

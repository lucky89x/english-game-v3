// The map exam (18/11: "a test of vocabulary, grammar and sentences before changing map: 8 of 10 to pass, otherwise go back
// and learn it again; a different paper every time"). Pure rules, no DOM. The owl asks it at the levels that open a new map.
// Ten questions: 4 vocabulary (both directions), 3 grammar (pick the right form), 3 sentences (pick the correctly built
// sentence among scrambled ones). Each paper is drawn at random and avoids what the last papers asked, while enough remains.

export const EXAM_GATES = [10, 20, 25, 30, 35, 45, 50, 55, 60, 65, 70];      // (26/11, turn 63) 50 fairy isle, 55 volcano, 60 crystal cave, 65 future city, 70 dream kingdom;      // (26/11) and the last level of every land after it: 25 desert, 30 peaks, 35 ruins, 45 sky
export const EXAM_OLD = [10, 20];        // (24/11) 10 ends the sea (opens the forest), 20 ends the forest (opens the next map)
/** The unit each map exam asks about: the map just finished (Map 1 = Unit 1, Map 2 = Unit 2), not the unit of the map it opens (19/11). */
export const EXAM_UNIT = { 10: 2, 20: 3, 25: 4, 30: 5, 35: 6, 45: 7, 50: 8, 55: 9, 60: 10, 65: 11, 70: 12 };
export const EXAM_TOTAL = 10, EXAM_PASS = 8;
const shuffle = (a, rnd) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/** Same words, wrong order: shuffles until it differs from the original (and from the others already offered). */
const PROPER = /^(Mai|Nam|Lan|Tom|Ben|Sam|Pip|Anna|Rose|Lily|Mia|Leo|Viet|Vietnam|Hanoi|English|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mr|Mrs|Ms|Tet|Zara|Omar|Bjorn|Greta|Ada|Professor|Milo|Aria|Nimbus|Flora|Thistle|Brann|Cinder|Opal|Flint|Nova|Bolt|Luma|Dozy|Hugh|Lord|Hush|Fire|Sun|Ice|Sand|Stone|Thorn|Magma|Crystal|Iron|Moon|Star|Glow|Solar|Cloud|Fairy|Dream|Future|Mars|Earth|January|February|March|April|May|June|July|August|September|October|November|December)\b/;      // (26/11, turn 63) the people of maps 4-12, months
export function scramble(sentence, rnd = Math.random, not = []) {
  // (26/11) the capital letter and the full stop gave the right sentence away (only it began with a capital and ended with a stop):
  // the wrong ones are re-dressed the same way, so the child has to read the word order
  const end = (/[.?!]$/.exec(sentence) || [''])[0], bare = sentence.slice(0, sentence.length - end.length), words = bare.split(/\s+/);
  if (words.length < 3) return null;
  const lower = (w, first) => (first && w !== 'I' && !/^[A-Z][a-z]*[A-Z]/.test(w) && !PROPER.test(w) ? w.charAt(0).toLowerCase() + w.slice(1) : w), base = words.map((w, i) => lower(w, i === 0));
  for (let t = 0; t < 40; t++) { const sh = shuffle(base, rnd), s = sh.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(' ') + end; if (s !== sentence && !not.includes(s)) return s; }
  return null;
}

/** Puts a correct answer among wrong ones and says where it ended up. */
function mix(right, wrong, rnd) {
  const options = shuffle([right, ...wrong], rnd);
  return { options, a: options.indexOf(right) };
}

/**
 * cards: word cards {id, word, vi}; grammar: items {q, options, a, why}; avoid: ids asked in the last papers.
 * Returns { questions, ids } or null when there are too few words to ask anything sensible.
 * A question: { id, kind: 'vocab'|'grammar'|'sentence', en, vi?, options, a, card?, explain: { en, vi } }.
 */
export function buildExam({ cards, grammar = [], rnd = Math.random, avoid = [] }) {
  const pool = cards.filter((c) => c && c.word && c.vi && c.word.length <= 22);
  if (pool.length < 4) return null;
  const skip = new Set(avoid), prefer = (list, key) => { const fresh = list.filter((x) => !skip.has(key(x))), old = list.filter((x) => skip.has(key(x))); return [...shuffle(fresh, rnd), ...shuffle(old, rnd)]; };
  const gItems = prefer(grammar.map((g, i) => ({ ...g, id: 'g:' + g.q })), (x) => x.id);
  const nSentence = Math.min(3, Math.max(0, gItems.length - 3)), nGrammar = Math.min(3, gItems.length - nSentence);
  const nVocab = EXAM_TOTAL - nGrammar - nSentence, qs = [];
  const picked = prefer(pool, (c) => c.id).slice(0, nVocab);
  picked.forEach((c, i) => {
    const toEn = i % 2 === 0, others = shuffle(pool.filter((x) => x.id !== c.id && x.vi !== c.vi && x.word !== c.word), rnd).slice(0, 3);
    const right = toEn ? c.word : c.vi, { options, a } = mix(right, others.map((o) => (toEn ? o.word : o.vi)), rnd);
    qs.push({ id: c.id, kind: 'vocab', en: toEn ? 'Which English word is it?' : `What does "${c.word}" mean?`, vi: toEn ? c.vi : undefined, options, a, card: c, explain: { en: c.word, vi: c.vi } });
  });
  for (const g of gItems.slice(0, nGrammar)) {
    const right = g.options[g.a], { options, a } = mix(right, g.options.filter((_, i) => i !== g.a), rnd);
    qs.push({ id: g.id, kind: 'grammar', en: g.q, vi: 'Chọn dạng đúng điền vào chỗ trống.', options, a, explain: { en: g.q.replace('___', right), vi: g.why } });
  }
  for (const g of gItems.slice(nGrammar, nGrammar + nSentence)) {
    const sentence = g.q.replace('___', g.options[g.a]), wrong = [];
    for (let i = 0; i < 2; i++) { const w = scramble(sentence, rnd, wrong); if (w) wrong.push(w); }
    if (!wrong.length) continue;
    const { options, a } = mix(sentence, wrong, rnd);
    qs.push({ id: 's:' + g.q, kind: 'sentence', en: 'Which sentence is built correctly?', vi: 'Chọn câu đúng ngữ pháp và đúng thứ tự từ.', options, a, explain: { en: sentence, vi: g.why } });
  }
  const need = EXAM_TOTAL - qs.length;           // a unit with little grammar: more vocabulary instead
  if (need > 0) {
    const used = new Set(picked.map((c) => c.id));
    for (const c of prefer(pool.filter((x) => !used.has(x.id)), (x) => x.id).slice(0, need)) {
      const others = shuffle(pool.filter((x) => x.id !== c.id && x.vi !== c.vi && x.word !== c.word), rnd).slice(0, 3), { options, a } = mix(c.word, others.map((o) => o.word), rnd);
      qs.push({ id: c.id, kind: 'vocab', en: 'Which English word is it?', vi: c.vi, options, a, card: c, explain: { en: c.word, vi: c.vi } });
    }
  }
  const questions = shuffle(qs, rnd);
  return { questions, ids: questions.map((q) => q.id) };
}

/** Marks a finished paper. wrong: the questions answered badly (they are studied again before the next try). */
export function grade(questions, answers) {
  const wrong = questions.filter((q, i) => answers[i] !== q.a), right = questions.length - wrong.length;
  return { right, total: questions.length, pass: right >= Math.min(EXAM_PASS, questions.length), wrong };
}

/** What the save remembers about the exam: tries and the ids of the last papers (so the next paper is different). */
export const examState = (p) => p.exam || (p.exam = { tries: 0, passed: false, last: [] });
export function recordExam(p, ids, pass) {
  const e = examState(p); e.tries += 1; if (pass) e.passed = true;
  e.last = [...ids, ...e.last].slice(0, 30);      // the last three papers
  return e;
}

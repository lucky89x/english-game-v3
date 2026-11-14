// "Echoes of the Forest": Pip gives an English clue, Ngọc walks to the right landmark crystal.
// Progressive support (H key): 1 English only -> 2 keyword highlighted -> 3 Vietnamese meaning of the
// keyword -> 4 marker on the minimap. A wrong crystal explains what that place is (and is recorded,
// so guessing is never rewarded). Finale: the ancient tree asks for 3 of the words by definition.
import { LANDMARKS, mulberry32 } from '../core/layout.js';
import { CLUES, DEFINITIONS, TOM_INTRO } from './content.js';
import * as Review from '../core/review.js';
import { recordSkill, addExp } from '../core/save.js';

export const TARGETS = 5;
const GOLD = [5, 4, 3, 1];           // by hint level used (0..3)
const spots = LANDMARKS.filter((l) => l.id !== 'tree');
export const landmark = (id) => LANDMARKS.find((l) => l.id === id);

export class ForestQuest {
  /** api: { profile, save(), ui, sfx(name), wordId(en) -> id, onChange() } */
  constructor(api) { this.api = api; this.clueStart = 0; }
  get q() {
    const qs = this.api.profile.quests;
    if (!qs.forest) qs.forest = { step: 'intro', order: [], idx: 0, found: [], hint: 0, wrongNow: 0, review: 0 };
    return qs.forest;
  }
  get step() { return this.q.step; }
  get targetId() { return this.q.step === 'seek' ? this.q.order[this.q.idx] : null; }
  get clue() {
    const id = this.targetId; if (!id) return null;
    const row = CLUES[id][this.api.profile.grade];
    return row ? { id, text: row[0], key: row[1] } : null;           // null = not authored for this grade
  }
  crystalIds() { return this.q.step === 'seek' ? spots.map((s) => s.id).filter((id) => !this.q.found.includes(id)) : []; }

  talkTom() {
    const { ui, profile } = this.api;
    if (this.step === 'intro') {
      ui.dialogue(TOM_INTRO(profile.name), () => this.start());
    } else if (this.step === 'done') {
      ui.dialogue([{ who: 'Tom', en: 'You gave the forest its words back. Thank you!' }, { who: 'Tom', en: 'The compass piece points to the desert now…' }]);
    } else ui.dialogue([{ who: 'Tom', en: 'Pip knows the way. Read the clue again.', vi: 'Xem lời Pip ở khung phía trên. Nhấn H để xin gợi ý.' }]);
  }
  start() {
    const q = this.q, rnd = mulberry32(Date.now() & 0xffff), pool = spots.map((s) => s.id);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    Object.assign(q, { step: 'seek', order: pool.slice(0, TARGETS), idx: 0, found: [], hint: 0, wrongNow: 0 });
    this.beginClue();
  }
  beginClue() { this.q.hint = 0; this.q.wrongNow = 0; this.clueStart = performance.now(); this.api.save(); this.api.onChange(); }

  hint() {
    if (this.step !== 'seek') return 0;
    this.q.hint = Math.min(3, this.q.hint + 1);
    this.api.sfx('tick'); this.api.save(); this.api.onChange();
    return this.q.hint;
  }
  /** Ngọc presses E at the crystal of landmark `id`. Returns true when it was the right one. */
  touch(id) {
    const q = this.q, { profile, ui } = this.api, target = this.targetId;
    if (!target) return false;
    const t = landmark(target), here = landmark(id), ms = performance.now() - this.clueStart;
    if (id !== target) {
      q.wrongNow += 1;
      Review.record(profile.words, this.api.wordId(t.en), { correct: false, hints: q.hint, ms });
      recordSkill(profile, 'reading', false, q.hint);
      this.api.sfx('wrong');
      ui.dialogue([{ who: 'Pip', en: `Not here! This is the ${here.en}.`, vi: `${here.en} = ${here.vi}. Pip nói: “${this.clue ? this.clue.text : ''}”` }]);
      this.api.save(); this.api.onChange();
      return false;
    }
    const clean = q.hint === 0 && q.wrongNow === 0;
    Review.record(profile.words, this.api.wordId(t.en), { correct: q.wrongNow === 0, hints: q.hint, ms });
    if (q.wrongNow === 0) recordSkill(profile, 'reading', true, q.hint);
    const gold = q.wrongNow > 0 ? 1 : GOLD[q.hint];
    profile.stats.gold += gold; addExp(profile, 10);
    q.found.push(id); q.idx += 1;
    this.api.sfx(clean ? 'fanfare' : 'correct');
    const last = q.idx >= q.order.length;
    if (last) q.step = 'tree';
    ui.dialogue([{ who: 'Pip', en: `${clean ? 'Brilliant' : 'Yes'}! This is the ${t.en}. (+${gold} gold)` },
      ...(last ? [{ who: 'Pip', en: 'We have all five! Take them to the ancient tree.', vi: 'Mang pha lê tới cây cổ thụ (dấu sao trên bản đồ).' }] : [])], () => { if (!last) this.beginClue(); });
    this.api.save(); this.api.onChange();
    return true;
  }
  /** At the ancient tree: three words asked by their English definition. */
  treeChallenge() {
    const q = this.q, { ui, profile } = this.api;
    if (q.step !== 'tree') return;
    const ask = (n, right) => {
      if (n >= 3) return this.finish(right);
      const id = q.order[n], word = landmark(id).en, rnd = mulberry32(n * 31 + q.order.length);
      const options = [id, ...q.order.filter((o) => o !== id).sort(() => rnd() - 0.5).slice(0, 2)].sort(() => rnd() - 0.5);
      const started = performance.now();
      ui.choose({ who: 'Ancient Tree', en: `I remember… ${DEFINITIONS[id]}. What is its name?` }, options.map((o) => landmark(o).en), (i) => {
        const ok = options[i] === id;
        Review.record(profile.words, this.api.wordId(word), { correct: ok, hints: 0, ms: performance.now() - started });
        recordSkill(profile, 'vocabulary', ok, 0);
        this.api.sfx(ok ? 'correct' : 'wrong');
        if (ok) ask(n + 1, right + 1);
        else ui.dialogue([{ who: 'Ancient Tree', en: `Hmm, not quite. It is the ${word}.`, vi: `${word} = ${landmark(id).vi}` }], () => ask(n + 1, right));
      });
    };
    ask(0, 0);
  }
  finish(right) {
    const q = this.q, { profile, ui } = this.api;
    q.step = 'done'; q.review = right;
    profile.stats.gold += 10 + right * 5; addExp(profile, 50);
    profile.flags.compass_piece_forest = true;
    this.api.sfx('fanfare');
    ui.dialogue([
      { who: 'Ancient Tree', en: `My memories are back! You named ${right} of 3 on the first try.` },
      { who: 'Pip', en: 'Look! A piece of the Language Compass! It points to the Golden Wind Desert.' },
      { who: 'Pip', en: 'See you in the next chapter!', vi: 'Hết phần Rừng Ký Ức. Các từ con còn nhầm sẽ quay lại ở lần chơi sau.' },
    ]);
    this.api.save(); this.api.onChange();
  }
}

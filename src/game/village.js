// Chapter I chain in the Starter Village: arrive -> The Lost Letter -> Ben's Word Jars -> the forest
// gate opens. Texts are original; the letter itself comes from the grade's own curriculum file
// (activities.lost_letter). A grade without that activity is told so and moves on, nothing is borrowed.
import { mulberry32 } from '../core/regionkit.js';
import * as Review from '../core/review.js';
import { recordSkill, addExp } from '../core/save.js';

export const CUSTOMERS = 5, JARS = 4;

export class VillageStory {
  /** api: { profile, save(), ui, sfx(name), onChange(), letter: object|null, cards: [{id, word, vi}], cardOf(id) } */
  constructor(api) { this.api = api; this.market = null; }
  get q() { const qs = this.api.profile.quests; if (!qs.village) qs.village = { step: 'arrive', letterWrong: 0, rounds: 0 }; return qs.village; }
  get step() { return this.q.step; }
  set(step) { this.q.step = step; this.api.save(); this.api.onChange(); }

  // ---------------------------------------------------------------- Tom
  talkTom() {
    const { ui, profile } = this.api, s = this.step;
    if (s === 'arrive') ui.dialogue([
      { who: 'Tom', en: `Welcome to our village, ${profile.name}! I am Tom.` },
      { who: 'Tom', en: 'Oh dear! The wind took my letter. It is near the door of my hall.' },
      { who: 'Tom', en: 'My eyes are weak. Can you find it and read it for me?', vi: 'Đi theo đường lên phía Bắc tới nhà trưởng làng (dấu ✉ trên bản đồ), nhấn E để nhặt thư.' },
    ], () => this.set('letter_find'));
    else if (s === 'letter_find') ui.dialogue([{ who: 'Tom', en: 'The letter is near the door of my hall, in the north.' }]);
    else if (s === 'letter_return') {
      profile.stats.gold += 20; addExp(profile, 30); this.api.sfx('fanfare');
      ui.dialogue([{ who: 'Tom', en: 'Thank you for reading it to me! (+20 gold)' },
        { who: 'Tom', en: 'Ben is very busy at the market today. Can you help him?', vi: 'Chợ của Ben ở phía Nam quảng trường (dấu ! trên bản đồ).' }], () => this.set('jars'));
    } else if (s === 'jars' || s === 'jars_play') ui.dialogue([{ who: 'Tom', en: 'Ben is waiting for you at the market.' }]);
    else if (s === 'open') {
      profile.flags.forest_open = true; this.api.sfx('fanfare');
      ui.dialogue([{ who: 'Tom', en: 'You are a great helper! Now, something strange is happening…' },
        { who: 'Tom', en: 'The Forest of Memories has lost its words. The gate is open. Pip is waiting for you there.', vi: 'Cổng rừng ở phía Tây Bắc làng (dấu ★ trên bản đồ).' }], () => this.set('done'));
    } else ui.dialogue([{ who: 'Tom', en: 'The forest gate is in the north-west. Good luck!' }]);
  }

  // ---------------------------------------------------------------- the letter
  readLetter() {
    const { ui, letter, profile } = this.api;
    if (this.step !== 'letter_find') return;
    if (!letter) {     // not authored for this grade: say so, never use another grade's letter
      ui.dialogue([{ who: 'Ngọc', en: 'The letter is too wet to read…', vi: `Bài đọc thư cho lớp ${profile.grade} chưa được soạn. Con mang thư về cho Tom nhé.` }], () => this.set('letter_return'));
      return;
    }
    const pages = String(letter.letter).split(/\n\n+/).map((p) => ({ who: 'The letter', en: p.replace(/\n/g, ' ') }));
    ui.dialogue(pages, () => this.askLetter(false));
  }
  askLetter(retry) {
    const { ui, letter, profile } = this.api, started = Date.now();
    ui.choose({ who: 'Ngọc', en: letter.question, vi: retry ? 'Gợi ý: ' + letter.hint : undefined }, letter.choices, (i) => {
      const ok = i === Number(letter.answer), first = this.q.letterWrong === 0;
      recordSkill(profile, 'reading', ok, ok && !first ? 1 : 0);
      this.api.sfx(ok ? 'correct' : 'wrong');
      if (!ok) { this.q.letterWrong += 1; this.api.save(); return this.askLetter(true); }
      profile.stats.gold += first ? 10 : 3; addExp(profile, 15);
      this.q.letterMs = Date.now() - started;
      ui.dialogue([{ who: 'Ngọc', en: `I understand the letter now! (+${first ? 10 : 3} gold)`, vi: 'Mang thư về cho trưởng làng Tom ở quảng trường.' }], () => this.set('letter_return'));
    });
  }

  // ---------------------------------------------------------------- Ben's word jars
  talkBen() {
    const { ui, cards } = this.api, s = this.step;
    if (this.market) return;
    if (s === 'arrive' || s === 'letter_find' || s === 'letter_return') { ui.dialogue([{ who: 'Ben', en: 'Hello! Come back later. I am busy now.' }]); return; }
    if (cards.length < JARS) { ui.dialogue([{ who: 'Ben', en: 'Sorry, I have no jars today.', vi: `Từ vựng Unit ${this.api.profile.unit} lớp ${this.api.profile.grade} chưa có.` }], () => { if (s === 'jars') this.set('open'); }); return; }
    ui.dialogue([{ who: 'Ben', en: s === 'jars' ? 'Travellers are here, and they only speak English! Please give them the right word jar.' : 'More travellers! Can you help me again?',
      vi: 'Đọc món khách cần, đi tới hũ có nghĩa đúng rồi nhấn E.' }], () => this.startMarket());
  }
  startMarket(seed = Date.now() & 0xffff) {
    const { cards, profile, cardOf } = this.api, rnd = mulberry32(seed);
    const due = Review.dueIds(profile.words).map(cardOf).filter(Boolean).slice(0, 2);          // spaced review first
    const fresh = cards.filter((c) => !due.some((d) => d.id === c.id)).sort((a, b) => (profile.words[a.id] ? 1 : 0) - (profile.words[b.id] ? 1 : 0) || rnd() - 0.5);
    this.market = { rnd, queue: [...due, ...fresh].slice(0, CUSTOMERS), index: 0, tries: 0, firstTry: 0, gold: 0, missed: [], options: [], started: Date.now() };
    if (this.step === 'jars') this.q.step = 'jars_play';
    this.nextCustomer();
  }
  nextCustomer() {
    const m = this.market, { cards } = this.api;
    if (m.index >= m.queue.length) return this.endMarket();
    const target = m.queue[m.index], seen = new Set([target.vi.toLowerCase()]), others = [];
    for (const c of [...cards].sort(() => m.rnd() - 0.5)) { if (others.length >= JARS - 1) break; if (!seen.has(c.vi.toLowerCase()) && c.id !== target.id) { seen.add(c.vi.toLowerCase()); others.push(c); } }
    m.options = [target, ...others].sort(() => m.rnd() - 0.5); m.tries = 0; m.started = Date.now();
    this.api.onChange();
  }
  get customer() { const m = this.market; return m ? { target: m.queue[m.index], options: m.options, index: m.index, total: m.queue.length, gold: m.gold, said: m.said || '' } : null; }
  /** Ngọc hands over jar i. Returns true when it is the right jar. */
  serve(i) {
    const m = this.market, { profile } = this.api; if (!m || !m.options[i]) return false;
    const target = m.queue[m.index], given = m.options[i], ok = given.id === target.id;
    if (m.tries === 0) { Review.record(profile.words, target.id, { correct: ok, hints: 0, ms: Date.now() - m.started }); recordSkill(profile, 'vocabulary', ok, 0); }
    m.tries += 1;
    if (!ok) { if (m.tries === 1) m.missed.push(target); m.said = `That's "${given.word}"! I need "${target.word}".`; this.api.sfx('wrong'); this.api.save(); this.api.onChange(); return false; }
    const gold = m.tries === 1 ? 3 : 1; if (m.tries === 1) m.firstTry += 1;
    m.gold += gold; profile.stats.gold += gold; addExp(profile, 5); m.said = ''; m.index += 1;
    this.api.sfx('correct'); this.api.save();
    this.nextCustomer();
    return true;
  }
  endMarket() {
    const m = this.market, { ui } = this.api; this.market = null; this.q.rounds += 1;
    const lines = [{ who: 'Ben', en: `Well done! ${m.firstTry} of ${m.queue.length} jars were right the first time. (+${m.gold} gold)` }];
    if (m.missed.length) lines.push({ who: 'Ben', en: 'Remember: ' + m.missed.slice(0, 3).map((c) => `${c.word}`).join(', ') + '.', vi: m.missed.slice(0, 3).map((c) => `${c.word} = ${c.vi}`).join(' · ') });
    if (this.step === 'jars_play') { lines.push({ who: 'Ben', en: 'Tom wants to see you at the square.' }); this.q.step = 'open'; }
    this.api.save(); this.api.onChange();
    ui.dialogue(lines);
  }
  leaveMarket() { if (!this.market) return; this.market = null; if (this.step === 'jars_play') this.q.step = 'jars'; this.api.onChange(); }
}

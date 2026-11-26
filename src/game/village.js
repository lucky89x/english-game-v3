// Chapter I chain in the Starter Village: arrive -> The Lost Letter -> Ben's Word Jars -> Fix the Bridge
// (Sam names the things, Ngọc picks the rope and log among look-alikes, earns Ben's axe, puts Pip's plan
// in order) -> the forest gate opens. Texts are original; the letter itself comes from the grade's own curriculum file
// (activities.lost_letter). A grade without that activity is told so and moves on, nothing is borrowed.
import { unitOf } from '../core/save.js';
import { mulberry32 } from '../core/regionkit.js';
import * as Review from '../core/review.js';
import { recordSkill, bonusExp, addExp } from '../core/save.js';
import { jarExp } from '../core/progress.js';
import { BADGE } from './saga.js';

export const CUSTOMERS = 5, JARS = 4;

export class VillageStory {
  /** api: { profile, save(), ui, sfx(name), onChange(), letter: object|null, cards: [{id, word, vi}], cardOf(id),
   *  bridge: grade's BRIDGE content or null, onBridgeFixed() } */
  constructor(api) { this.api = api; this.market = null; }
  get q() { const qs = this.api.profile.quests; if (!qs.village) qs.village = { step: 'arrive', letterWrong: 0, rounds: 0 }; return qs.village; }
  get step() { return this.q.step; }
  set(step) { this.q.step = step; this.api.save(); this.api.onChange(); }

  // ---------------------------------------------------------------- Tom
  talkTom() {
    const { ui, profile } = this.api, s = this.step;
    if (s === 'arrive') ui.dialogue([
      { who: 'Tom', en: `Hi, ${profile.name}! I am Tom. The wind took my letter!` },
      { who: 'Tom', en: 'It is near my hall. Can you find it?', vi: 'Đi lên phía Bắc tới nhà trưởng làng (dấu ✉ trên bản đồ), nhấn E để nhặt thư.' },
    ], () => this.set('letter_find'));
    else if (s === 'letter_find') ui.dialogue([{ who: 'Tom', en: 'The letter is near the door of my hall, in the north.' }]);
    else if (s === 'letter_return') {
      profile.stats.gold += 20; bonusExp(profile, 30); this.api.sfx('fanfare');
      ui.dialogue([{ who: 'Tom', en: 'Thank you! (+20 gold) Now, can you help Ben at the market?', vi: 'Chợ hũ chữ của Ben ở khu trại phía Nam, cạnh đống lửa (dấu ! trên bản đồ).' }], () => this.set('jars'));
    } else if (s === 'jars' || s === 'jars_play') ui.dialogue([{ who: 'Tom', en: 'Ben is waiting for you at the market.' }]);
    else if (s === 'tom_bridge') ui.dialogue([{ who: 'Tom', en: 'Oh no! The storm broke the bridge. Please help Sam!', vi: 'Cầu phía Nam bị gãy. Tới đầu cầu gặp Sam (dấu ! trên bản đồ).' }], () => this.set('bridge'));
    else if (s === 'bridge' || s === 'gather' || s === 'plan') ui.dialogue([{ who: 'Tom', en: 'Sam is waiting for you at the south bridge.' }]);
    else if (s === 'open') {
      profile.flags.forest_open = true; profile.flags.badge1 = true; this.api.sfx('fanfare');      // (19/11) Tom's Word Keeper badge
      ui.dialogue(BADGE(profile.name), () => this.set('done'));
    } else ui.dialogue([{ who: 'Tom', en: 'The Wild Meadow is across the river. Grow strong there, then find the Slime King in the north!', vi: 'Đồng Hoang ở bên kia sông: đánh quái để lên cấp (theo mũi tên vàng), lên cấp 4 thì tìm Vua Slime ở phía Bắc. Sổ nhiệm vụ: phím N.' }]);
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
      profile.stats.gold += first ? 10 : 3; bonusExp(profile, 15);
      this.q.letterMs = Date.now() - started;
      ui.dialogue([{ who: 'Ngọc', en: `I understand the letter now! (+${first ? 10 : 3} gold)`, vi: 'Mang thư về cho trưởng làng Tom ở quảng trường.' }], () => this.set('letter_return'));
    });
  }

  // ---------------------------------------------------------------- Ben's word jars
  talkBen() {
    const { ui, cards } = this.api, s = this.step;
    if (this.market) return;
    if (s === 'arrive' || s === 'letter_find' || s === 'letter_return') { ui.dialogue([{ who: 'Ben', en: 'Hello! Come back later. I am busy now.' }]); return; }
    const wantsAxe = s === 'gather' && !this.q.items.includes('axe');
    if (cards.length < JARS) {
      ui.dialogue([{ who: 'Ben', en: wantsAxe ? 'I have no jars today, but here is my axe!' : 'Sorry, I have no jars today.', vi: `Từ vựng Unit ${unitOf(this.api.profile)} lớp ${this.api.profile.grade} chưa có.` }], () => {
        if (s === 'jars') this.set('tom_bridge'); else if (wantsAxe) this.take('axe'); });
      return;
    }
    ui.dialogue([{ who: 'Ben', en: s === 'jars' ? 'Help me, please! Give each traveller the right word jar.' : wantsAxe ? 'An axe? Sure! But first, help me with these travellers, please.' : 'More travellers! Can you help me again?',
      vi: 'Đọc món khách cần, đi tới hũ có nghĩa đúng rồi nhấn E.' }], () => this.startMarket());
  }
  startMarket(seed = Date.now() & 0xffff) {
    const { cards, profile, cardOf } = this.api, rnd = mulberry32(seed);
    const due = Review.dueIds(profile.words).map(cardOf).filter(Boolean).slice(0, 2);          // spaced review first
    const met = (c) => (profile.words[c.id] ? 2 : profile.seen && profile.seen[c.id] ? 0 : 1);      // words just learned from the bubbles first, then new ones, then answered ones
    const fresh = cards.filter((c) => !due.some((d) => d.id === c.id)).sort((a, b) => met(a) - met(b) || rnd() - 0.5);
    this.market = { rnd, queue: [...due, ...fresh].slice(0, CUSTOMERS), index: 0, tries: 0, firstTry: 0, gold: 0, missed: [], options: [], started: Date.now() };
    if (this.step === 'jars') this.q.step = 'jars_play';
    this.nextCustomer();
    if (this.api.teach) this.api.teach(this.market.queue);      // new words first, as big cards read aloud
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
    m.gold += gold; profile.stats.gold += gold; addExp(profile, Math.max(1, Math.round(jarExp(profile.stats.level) * (m.tries === 1 ? 1 : 0.5)))); m.said = ''; m.index += 1;      // (26/11) a modest EXP that shrinks as the hero grows; half when it took more than one try
    this.api.sfx('correct'); this.api.save();
    this.nextCustomer();
    return true;
  }
  endMarket() {
    const m = this.market, { ui } = this.api; this.market = null; this.q.rounds += 1;
    const lines = [{ who: 'Ben', en: `Well done! ${m.firstTry} of ${m.queue.length} jars were right the first time. (+${m.gold} gold)` }];
    if (m.missed.length) lines.push({ who: 'Ben', en: 'Remember: ' + m.missed.slice(0, 3).map((c) => `${c.word}`).join(', ') + '.', vi: m.missed.slice(0, 3).map((c) => `${c.word} = ${c.vi}`).join(' · ') });
    if (this.step === 'jars_play') { lines.push({ who: 'Ben', en: 'Tom wants to see you at the square.' }); this.q.step = 'tom_bridge'; }
    const axe = this.step === 'gather' && !this.q.items.includes('axe');
    if (axe) lines.push({ who: 'Ben', en: 'Thank you! Here is my axe. Be careful, it is sharp!' });
    this.api.save(); this.api.onChange();
    ui.dialogue(lines, axe ? () => this.take('axe') : undefined);
  }
  leaveMarket() { if (!this.market) return; this.market = null; if (this.step === 'jars_play') this.q.step = 'jars'; this.api.onChange(); }

  // ---------------------------------------------------------------- Fix the Bridge
  get items() { return this.q.items || (this.q.items = []); }
  /** Things still lying on the ground (right ones and decoys) while Ngọc is gathering. */
  groundItems() { if (this.step !== 'gather' || !this.api.bridge) return []; return ['rope', 'chain', 'log', 'boulder'].filter((id) => !this.items.includes(id)); }
  talkSam() {
    const { ui, bridge, profile } = this.api, s = this.step;
    if (s === 'bridge') {
      if (!bridge) {      // not written for this grade: say so and open the bridge, never borrow another grade's text
        ui.dialogue([{ who: 'Sam', en: 'Look! The bridge is fixed now.', vi: `Nhiệm vụ Sửa cây cầu cho lớp ${profile.grade} chưa được soạn. Cầu đã mở, con quay lại gặp Tom nhé.` }], () => this.fixBridge());
        return;
      }
      this.q.items = []; this.q.decoys = 0;
      ui.dialogue(bridge.need, () => this.set('gather'));
    } else if (s === 'gather') {
      const left = ['rope', 'log', 'axe'].filter((id) => !this.items.includes(id));
      if (left.length) ui.dialogue([{ who: 'Sam', en: `We still need: ${left.map((id) => (id === 'axe' ? 'an axe' : 'a ' + id)).join(', ')}.` }]);
      else { this.set('plan'); ui.dialogue([{ who: 'Sam', en: 'Great, we have everything! Pip, can you read the plan for us?' }, ...bridge.plan], () => this.askStep(0, false)); }
    } else if (s === 'plan') ui.dialogue(bridge.plan, () => this.askStep(this.q.order || 0, false));
    else ui.dialogue([{ who: 'Sam', en: 'Hello! The fish are jumping today.' }]);
  }
  /** Ngọc picks up a thing on the ground. Decoys are explained and recorded, never taken. */
  pick(id) {
    const { ui, bridge, profile } = this.api;
    if (!this.groundItems().includes(id)) return false;
    const right = id === 'rope' || id === 'log', item = right ? bridge.items[id] : Object.values(bridge.items).find((it) => it.decoy === id);
    recordSkill(profile, 'vocabulary', right, 0);
    if (!right) { this.q.decoys = (this.q.decoys || 0) + 1; this.api.sfx('wrong'); this.api.save(); ui.dialogue([{ who: 'Sam', en: item.wrong, vi: item.wrongVi }]); return false; }
    ui.dialogue([{ who: 'Ngọc', en: `I found the ${item.en}!` }], () => this.take(id));
    return true;
  }
  take(id) {
    if (this.items.includes(id)) return;
    this.items.push(id); this.api.profile.stats.gold += 2; bonusExp(this.api.profile, 5); this.api.sfx('correct');
    if (['rope', 'log', 'axe'].every((k) => this.items.includes(k))) this.api.ui.dialogue([{ who: 'Ngọc', en: 'I have the rope, the log and the axe!', vi: 'Mang đồ về cho Sam ở đầu cầu phía Nam.' }]);
    this.api.save(); this.api.onChange();
  }
  /** Pip's plan: the steps are asked one by one, options shuffled, no sequence words in them. */
  askStep(n, retry) {
    const { ui, bridge, profile } = this.api;
    if (n >= bridge.steps.length) return this.fixBridge();
    this.q.order = n; this.api.save();
    const rnd = mulberry32(n * 7 + 3), left = bridge.steps.slice(n), options = [...left].sort(() => rnd() - 0.5);
    ui.choose({ who: 'Pip', en: bridge.ask[n], vi: retry ? bridge.hint : undefined }, options, (i) => {
      const ok = options[i] === bridge.steps[n];
      recordSkill(profile, 'reading', ok, retry && ok ? 1 : 0);
      this.api.sfx(ok ? 'correct' : 'wrong');
      if (!ok) { this.q.orderWrong = (this.q.orderWrong || 0) + 1; this.api.save(); return this.askStep(n, true); }
      if (!retry) profile.stats.gold += 3;
      this.askStep(n + 1, false);
    });
  }
  fixBridge() {
    const { profile, ui } = this.api;
    profile.flags.bridge_fixed = true; bonusExp(profile, 30); this.api.sfx('fanfare');
    this.q.step = 'open'; this.api.save(); this.api.onBridgeFixed(); this.api.onChange();
    if (this.api.bridge) ui.dialogue([{ who: 'Sam', en: 'The bridge is strong again. Thank you! Go and tell Tom.', vi: 'Quay lại quảng trường gặp Tom.' }]);
  }
}

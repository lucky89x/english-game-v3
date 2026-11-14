// node --test web-rebuild/tests/unit.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../src/core/layout.js';
import { findPath, isReachableCell } from '../src/core/nav.js';
import * as R from '../src/core/review.js';
import * as S from '../src/core/save.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };

test('layout: river is water, bridges and stones are walkable', () => {
  for (const z of [-30, 0, 20, 50]) assert.ok(L.inWater(L.riverX(z), z), 'river centre at z=' + z);
  for (const b of L.BRIDGES) { assert.ok(!L.inWater(b.x, b.z)); assert.ok(L.walkable(b.x, b.z)); assert.ok(L.walkHeight(b.x, b.z) > L.WATER_LEVEL + 0.8); }
  for (const s of L.STONES) assert.ok(L.walkable(s.x, s.z, 0.2));
});
test('layout: every landmark spot and the entrance are walkable and dry', () => {
  for (const l of L.LANDMARKS) assert.ok(L.walkable(l.spot[0], l.spot[1]), l.id);
  assert.ok(L.walkable(L.ENTRANCE.x, L.ENTRANCE.z - 3));
});
test('layout: no tree or rock stands on a path', () => {
  for (const t of L.TREES) if (Math.hypot(t.x, t.z) < L.PLAY_RADIUS) assert.ok(L.pathDistance(t.x, t.z) > 1.2, 'tree on path');
  for (const r of L.ROCKS) assert.ok(L.pathDistance(r.x, r.z) > 1.0, 'rock on path');
  assert.ok(L.TREES.length > 300);
});
test('layout: the north cliff blocks walking, the map rim stops the player', () => {
  assert.ok(!L.canStep(20, -51, 20, -55.5));
  assert.ok(!L.walkable(0, L.PLAY_RADIUS + 1));
});
test('nav: a route exists from the entrance to every landmark and never touches water', () => {
  for (const l of L.LANDMARKS) {
    const path = findPath(L.ENTRANCE.x, L.ENTRANCE.z - 3, l.spot[0], l.spot[1]);
    assert.ok(path && path.length > 5, 'route to ' + l.id);
    for (const p of path) assert.ok(!L.inWater(p.x, p.z), 'dry route to ' + l.id);
  }
});
test('nav: destinations in water or inside a solid are refused', () => {
  assert.equal(findPath(L.ENTRANCE.x, L.ENTRANCE.z - 3, L.riverX(0), 0), null);
  assert.ok(!isReachableCell(17, -30));
  assert.equal(findPath(L.ENTRANCE.x, L.ENTRANCE.z - 3, 17, -30), null);
});
test('review: wrong repeats today, hint keeps the interval short, clean answers space out', () => {
  const w = {};
  assert.equal(R.record(w, 'a', { correct: false }, 100).due, 100);
  assert.equal(R.record(w, 'a', { correct: true, hints: 1 }, 100).due, 101);
  R.record(w, 'a', { correct: true, hints: 0 }, 101);
  assert.equal(w.a.box, 2); assert.equal(w.a.due, 103);
  for (let d = 0; d < 8; d++) R.record(w, 'a', { correct: true, hints: 0 }, 110 + d);
  assert.equal(w.a.box, R.MAX_BOX); assert.equal(w.a.due - w.a.last, 30);
  assert.deepEqual(R.dueIds(w, 117), []);
  assert.deepEqual(R.dueIds({ x: { box: 2, due: 5 }, y: { box: 0, due: 5 } }, 6), ['y', 'x']);
});
test('save: profiles are separate, saves are versioned, v1 migrates, newer versions are refused', () => {
  const st = mem(), store = S.emptyStore();
  const a = S.newProfile('An', 6), b = S.newProfile('Minh', 8);
  store.profiles.push(a, b); a.stats.gold = 50;
  S.persist(store, st);
  const back = S.load(st);
  assert.equal(back.version, S.SAVE_VERSION); assert.equal(back.profiles.length, 2);
  assert.equal(back.profiles[0].stats.gold, 50); assert.equal(back.profiles[1].stats.gold, 0);
  const old = S.migrate({ version: 1, name: 'Bé', grade: 7, words: { w: { box: 1 } } });
  assert.equal(old.version, 2); assert.equal(old.profiles[0].grade, 7); assert.ok(old.profiles[0].words.w);
  assert.throws(() => S.migrate({ version: 99 }));
  assert.equal(S.newProfile('x', 3).grade, 6);
});
test('save: export / import round-trips a profile', () => {
  const store = S.emptyStore(), p = S.newProfile('An', 9); p.words.k = { box: 3 };
  const text = S.exportProfile(p), other = S.emptyStore();
  const got = S.importProfile(other, text);
  assert.equal(got.name, 'An'); assert.equal(other.profiles[0].words.k.box, 3);
  assert.throws(() => S.importProfile(store, '{"kind":"other"}'));
});
test('save: skill counters separate first-try from hinted answers; exp levels up', () => {
  const p = S.newProfile('An', 6);
  S.recordSkill(p, 'reading', true, 0); S.recordSkill(p, 'reading', true, 2); S.recordSkill(p, 'reading', false, 1);
  assert.deepEqual(p.skills.reading, { attempts: 3, correct: 2, firstTry: 1, hints: 3 });
  assert.equal(S.addExp(p, 70), 1); assert.equal(p.stats.level, 2);
});

// ---------------------------------------------------------------- quest logic (no browser)
import { ForestQuest, TARGETS, landmark } from '../src/game/quest.js';
import { CLUES } from '../src/game/content.js';
function harness(grade = 6) {
  const profile = S.newProfile('An', grade), log = [];
  const ui = { dialogue: (pages, done) => { log.push(pages); if (done) done(); }, choose: (page, options, pick) => { ui.pending = { page, options, pick }; } };
  const quest = new ForestQuest({ profile, save() {}, ui, sfx() {}, wordId: (w) => 'forest:' + w, onChange() {} });
  return { profile, quest, ui, log };
}
test('content: every landmark has a clue for grades 6-9 and the key phrase is inside the clue', () => {
  for (const [id, row] of Object.entries(CLUES)) for (const g of [6, 7, 8, 9]) { assert.ok(row[g], id + ' g' + g); assert.ok(row[g][0].includes(row[g][1]), id + ' key g' + g); assert.ok(landmark(id)); }
  assert.ok(!CLUES.waterfall[9][0].includes('waterfall'), 'grade 9 paraphrases instead of naming the place');
});
test('quest: wrong crystal is explained and recorded, hints lower the reward, guessing is not rewarded', () => {
  const { profile, quest, log } = harness(6);
  quest.talkTom();
  assert.equal(quest.step, 'seek'); assert.equal(quest.q.order.length, TARGETS);
  const first = quest.targetId, other = quest.crystalIds().find((id) => id !== first);
  assert.equal(quest.touch(other), false);
  assert.ok(log.at(-1)[0].vi.includes(landmark(other).vi), 'explains what the wrong place is');
  assert.equal(profile.words['forest:' + landmark(first).en].box, 0);
  assert.equal(quest.touch(first), true);
  assert.equal(profile.stats.gold, 1, 'after a wrong guess only 1 gold');
  quest.hint(); quest.hint();
  assert.equal(quest.q.hint, 2);
  const second = quest.targetId; quest.touch(second);
  assert.equal(profile.stats.gold, 1 + 3);
  assert.equal(profile.words['forest:' + landmark(second).en].box, 1, 'hinted answer stays on a short interval');
  const third = quest.targetId; quest.touch(third);
  assert.equal(profile.stats.gold, 4 + 5);
  assert.equal(profile.skills.reading.firstTry, 1);
  assert.ok(!quest.crystalIds().includes(first), 'collected crystals are gone');
});
test('quest: five crystals lead to the tree challenge and a clear ending', () => {
  const { profile, quest, ui } = harness(8);
  quest.talkTom();
  for (let i = 0; i < TARGETS; i++) quest.touch(quest.targetId);
  assert.equal(quest.step, 'tree');
  quest.treeChallenge();
  for (let n = 0; n < 3; n++) { const want = landmark(quest.q.order[n]).en; ui.pending.pick(ui.pending.options.indexOf(want)); }
  assert.equal(quest.step, 'done'); assert.equal(quest.q.review, 3);
  assert.ok(profile.flags.compass_piece_forest); assert.ok(profile.skills.vocabulary.correct === 3);
});

// ---------------------------------------------------------------- village region
test('village: landmarks, spawn and both bridges are walkable; forest gate is reachable; no tree in the square', () => {
  L.setRegion('village');
  try {
    assert.equal(L.NAME, 'village');
    assert.ok(L.walkable(L.SPAWN.x, L.SPAWN.z));
    const [vb, sb] = L.BRIDGES;
    assert.ok(L.walkable(vb.x, vb.z) && !L.inWater(vb.x, vb.z));
    assert.ok(L.inWater(sb.x, sb.z), 'broken south bridge cannot be crossed');
    L.setBridgeOpen('village', 'south', true);
    assert.ok(L.walkable(sb.x, sb.z) && findPath(-2, 36, sb.x + 8, sb.z), 'repaired bridge is walkable and routable');
    L.setBridgeOpen('village', 'south', false);
    assert.equal(findPath(4, 39.5, sb.x, sb.z), null);
    assert.ok(L.inWater(L.riverX(20), 20));
    for (const l of L.LANDMARKS.filter((x) => x.spot)) assert.ok(L.walkable(l.spot[0], l.spot[1]), l.id);
    const ex = L.EXITS[0];
    for (const [x, z] of [[ex.x, ex.z + 1.5], [40, 8], [-20, 30], [15.5, 15]]) assert.ok(findPath(L.SPAWN.x, L.SPAWN.z, x, z), 'route to ' + x + ',' + z);
    assert.equal(findPath(L.SPAWN.x, L.SPAWN.z, 0, -25.5), null, 'inside the hall');
    assert.ok(L.TREES.every((t) => Math.hypot(t.x, t.z - 4) > 9 && L.pathDistance(t.x, t.z) > 1.2 || Math.hypot(t.x, t.z) > L.PLAY_RADIUS));
  } finally { L.setRegion('forest'); }
});

// ---------------------------------------------------------------- village story (no browser)
import { VillageStory, CUSTOMERS } from '../src/game/village.js';
function villageHarness({ grade = 6, letter = { letter: 'Dear Tom,\n\nPlease give it to the librarian.', question: 'Who gets it?', choices: ['The librarian', 'Nam', 'Mai'], answer: 0, hint: 'đọc lại' }, n = 8 } = {}) {
  const profile = S.newProfile('An', grade), log = [];
  const cards = Array.from({ length: n }, (_, i) => ({ id: `g${grade}_u01:w${i}`, word: 'w' + i, vi: 'nghĩa ' + i }));
  const ui = { dialogue: (pages, done) => { log.push(pages); if (done) done(); }, choose: (page, options, pick) => { ui.pending = { page, options, pick }; } };
  const bridgeState = { open: false };
  const bridge = arguments[0] && arguments[0].noBridge ? null : { sam_request: 'We need a rope, an axe and a log.\nBen has an axe.', pip_intro: 'I can read the book!',
    materials: [{ id: 'rope', word: 'rope', vi: 'dây thừng', decoy: { word: 'chain', vi: 'dây xích' } }, { id: 'axe', word: 'axe', vi: 'cái rìu', decoy: { word: 'pickaxe', vi: 'cuốc' } }, { id: 'log', word: 'log', vi: 'khúc gỗ', decoy: { word: 'rock', vi: 'tảng đá' } }],
    instructions: [{ en: 'First, cut the log.', vi: 'Xẻ gỗ' }, { en: 'Next, put the planks.', vi: 'Đặt ván' }, { en: 'Finally, tie the rope.', vi: 'Buộc dây' }], clue: 'Footprints go to the forest!' };
  const story = new VillageStory({ profile, save() {}, ui, sfx() {}, onChange() {}, letter, bridge, setBridge: (o) => { bridgeState.open = o; }, cards, cardOf: (id) => cards.find((c) => c.id === id) });
  return { profile, story, ui, log, cards, bridgeState };
}
test('village: letter read with a wrong then a right answer, hint only after the mistake, reward once', () => {
  const { profile, story, ui } = villageHarness();
  story.talkTom(); assert.equal(story.step, 'letter_find');
  story.readLetter();
  assert.equal(ui.pending.page.vi, undefined, 'no Vietnamese before the first try');
  ui.pending.pick(1);
  assert.ok(ui.pending.page.vi.includes('đọc lại'), 'hint after a wrong answer');
  ui.pending.pick(0);
  assert.equal(story.step, 'letter_return'); assert.equal(profile.stats.gold, 3);
  assert.deepEqual(profile.skills.reading, { attempts: 2, correct: 1, firstTry: 0, hints: 1 });
  story.talkTom(); assert.equal(story.step, 'jars'); assert.equal(profile.stats.gold, 23);
  story.talkTom(); assert.equal(profile.stats.gold, 23, 'Tom pays once');
});
test('village: a grade without a letter is told so and continues (no borrowed content)', () => {
  const { story, log } = villageHarness({ grade: 7, letter: null });
  story.talkTom(); story.readLetter();
  assert.ok(log.at(-1)[0].vi.includes('lớp 7 chưa được soạn')); assert.equal(story.step, 'letter_return');
});
test('village: word jars — wrong jar teaches, first-try pays more, due words come first, gate opens after', () => {
  const { profile, story, cards } = villageHarness();
  story.q.step = 'jars';
  R.record(profile.words, cards[5].id, { correct: false }, R.today());          // due review word
  story.talkBen();
  assert.ok(story.market && story.step === 'jars_play');
  assert.equal(story.customer.target.id, cards[5].id, 'due word asked first');
  assert.equal(story.customer.options.length, 4);
  assert.equal(new Set(story.customer.options.map((o) => o.vi)).size, 4);
  const wrong = story.customer.options.findIndex((o) => o.id !== story.customer.target.id);
  assert.equal(story.serve(wrong), false);
  assert.ok(story.customer.said.includes('I need'));
  const g0 = profile.stats.gold;
  story.serve(story.customer.options.findIndex((o) => o.id === story.customer.target.id));
  assert.equal(profile.stats.gold, g0 + 1);
  for (let i = 1; i < CUSTOMERS; i++) story.serve(story.customer.options.findIndex((o) => o.id === story.customer.target.id));
  assert.equal(story.market, null); assert.equal(story.step, 'bridge_ask');
  assert.equal(profile.stats.gold, g0 + 1 + 3 * (CUSTOMERS - 1));
  assert.ok(!profile.flags.forest_open);
});
test('village: no vocabulary for the unit -> Ben says so and the story is not blocked', () => {
  const { story, log } = villageHarness({ n: 0 });
  story.q.step = 'jars'; story.talkBen();
  assert.ok(log.at(-1)[0].vi.includes('chưa có')); assert.equal(story.step, 'open');
});

test('village: bridge repair — decoy refused, axe from Ben after a market shift, steps in order, bridge opens, then the gate', () => {
  const { profile, story, ui, log, bridgeState } = villageHarness();
  story.q.step = 'bridge_ask'; story.talkTom(); assert.equal(story.step, 'bridge_sam');
  assert.equal(story.talkSam(), true); assert.equal(story.step, 'bridge_collect');
  assert.deepEqual(story.itemsOut(), ['rope', 'log']);
  assert.equal(story.pick('rope', false), false);
  assert.ok(log.at(-1)[0].vi.includes('dây xích'), 'decoy is explained');
  assert.equal(story.pick('rope', true), true); assert.equal(story.pick('rope', true), false, 'no double pick');
  story.pick('log', true);
  assert.deepEqual(story.itemsOut(), []); assert.ok(story.needsAxe());
  story.talkSam(); assert.equal(story.step, 'bridge_collect', 'Sam repeats until all three are there');
  story.talkBen(); assert.ok(story.market, 'Ben trades the axe for a shift');
  for (let i = 0; i < CUSTOMERS; i++) story.serve(story.customer.options.findIndex((o) => o.id === story.customer.target.id));
  assert.ok(story.q.items.includes('axe')); assert.equal(story.step, 'bridge_collect');
  story.talkSam(); assert.equal(story.step, 'bridge_fix');
  const pickVi = (vi) => ui.pending.pick(ui.pending.options.indexOf(vi));
  pickVi('Buộc dây');
  assert.ok(ui.pending.page.en.includes('Read again') && ui.pending.page.en.includes('First, cut the log.'), 'wrong step: Pip repeats that line');
  assert.equal(bridgeState.open, false);
  pickVi('Xẻ gỗ'); pickVi('Đặt ván'); pickVi('Buộc dây');
  assert.equal(story.step, 'open'); assert.equal(bridgeState.open, true); assert.equal(profile.flags.bridge_repaired, true);
  story.talkTom(); assert.equal(story.step, 'done'); assert.equal(profile.flags.forest_open, true);
});
test('village: a grade without bridge content — Sam says so, bridge opens, story continues', () => {
  const { story, log, bridgeState } = villageHarness({ noBridge: true });
  story.q.step = 'bridge_sam'; story.talkSam();
  assert.ok(log.at(-1)[0].vi.includes('chưa được soạn')); assert.equal(bridgeState.open, true); assert.equal(story.step, 'open');
});

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
test('village: landmarks, spawn and the village bridge are walkable; forest gate is reachable; no tree in the square', () => {
  L.setRegion('village');
  try {
    assert.equal(L.NAME, 'village');
    assert.ok(L.walkable(L.SPAWN.x, L.SPAWN.z));
    const [vb] = L.BRIDGES; assert.ok(L.walkable(vb.x, vb.z) && !L.inWater(vb.x, vb.z));
    assert.ok(L.inWater(L.riverX(20), 20));
    for (const l of L.LANDMARKS.filter((x) => x.spot)) assert.ok(L.walkable(l.spot[0], l.spot[1]), l.id);
    const ex = L.EXITS[0];
    for (const [x, z] of [[ex.x, ex.z + 1.5], [40, 8], [-20, 30], [15.5, 15]]) assert.ok(findPath(L.SPAWN.x, L.SPAWN.z, x, z), 'route to ' + x + ',' + z);
    assert.equal(findPath(L.SPAWN.x, L.SPAWN.z, 0, -25.5), null, 'inside the hall');
    assert.ok(L.TREES.every((t) => Math.hypot(t.x, t.z - 4) > 9 && L.pathDistance(t.x, t.z) > 1.2 || Math.hypot(t.x, t.z) > L.PLAY_RADIUS));
  } finally { L.setRegion('forest'); }
});

test('village: the south bridge starts broken; minimap routes go round by the village bridge until it is fixed', () => {
  L.setRegion('village');
  try {
    const s = L.BRIDGES.find((b) => b.id === 'south'), w = [s.x - 7.5, s.z], e = [s.x + 7.5, s.z];
    const onSouth = (p) => Math.abs(p.z - s.z) < 1.5 && Math.abs(p.x - s.x) < L.BRIDGE_LEN / 2;
    assert.equal(s.open, false);
    assert.ok(!L.walkable(s.x, s.z) && L.inWater(s.x, s.z), 'broken middle is water');
    assert.ok(!L.canStep(s.x - 0.5, s.z, s.x + 0.5, s.z));
    const round = findPath(...w, ...e);
    assert.ok(round && round.length > 40 && !round.some(onSouth), 'detour by the village bridge, never over the gap');
    assert.ok(round.some((p) => Math.abs(p.z - L.BRIDGES[0].z) < 1.5 && L.onBridge(p.x, p.z)), 'the detour uses the village bridge');
    assert.ok(L.setBridgeOpen('village', 'south', true));
    assert.ok(L.walkable(s.x, s.z) && !L.inWater(s.x, s.z) && L.walkHeight(s.x, s.z) > L.WATER_LEVEL + 0.8);
    const straight = findPath(...w, ...e);
    assert.ok(straight.length < 20 && straight.some(onSouth), 'fixed bridge is the short way');
    assert.equal(L.setBridgeOpen('village', 'south', true), false, 'no change, no rebuild');
  } finally { L.setBridgeOpen('village', 'south', false); L.setRegion('forest'); }
});
test('village: bridge things and Sam / Pip spots are on dry, reachable ground', () => {
  L.setRegion('village');
  try { for (const [id, [x, z]] of Object.entries(BRIDGE_SPOTS)) assert.ok(L.walkable(x, z, 0.9) && findPath(L.SPAWN.x, L.SPAWN.z, x, z), id); }
  finally { L.setRegion('forest'); }
});
test('content: bridge quest is written for grades 6 and 8 only, English lines carry no Vietnamese', () => {
  assert.deepEqual(Object.keys(BRIDGE).map(Number), [6, 8]);
  const vi = /[àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]/i;
  for (const b of Object.values(BRIDGE)) {
    assert.equal(b.steps.length, 4); assert.equal(b.ask.length, 4); assert.equal(new Set(b.steps).size, 4);
    for (const line of [...b.need, ...b.plan]) assert.ok(!vi.test(line.en), line.en);
    for (const st of b.steps) assert.ok(!/\b(first|next|then|finally|before|after)\b/i.test(st), 'no sequence word in an option: ' + st);
    assert.deepEqual(Object.values(b.items).map((i) => i.decoy).sort(), ['boulder', 'chain']);
  }
});

// ---------------------------------------------------------------- village story (no browser)
import { VillageStory, CUSTOMERS } from '../src/game/village.js';
import { BRIDGE, BRIDGE_SPOTS } from '../src/game/content.js';
function villageHarness({ grade = 6, letter = { letter: 'Dear Tom,\n\nPlease give it to the librarian.', question: 'Who gets it?', choices: ['The librarian', 'Nam', 'Mai'], answer: 0, hint: 'đọc lại' }, n = 8 } = {}) {
  const profile = S.newProfile('An', grade), log = [];
  const cards = Array.from({ length: n }, (_, i) => ({ id: `g${grade}_u01:w${i}`, word: 'w' + i, vi: 'nghĩa ' + i }));
  const ui = { dialogue: (pages, done) => { log.push(pages); if (done) done(); }, choose: (page, options, pick) => { ui.pending = { page, options, pick }; } };
  const fixed = { n: 0 };
  const story = new VillageStory({ profile, save() {}, ui, sfx() {}, onChange() {}, letter, cards, cardOf: (id) => cards.find((c) => c.id === id), bridge: BRIDGE[grade] || null, onBridgeFixed: () => fixed.n++ });
  return { profile, story, ui, log, cards, fixed };
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
  assert.equal(story.market, null); assert.equal(story.step, 'tom_bridge');
  assert.equal(profile.stats.gold, g0 + 1 + 3 * (CUSTOMERS - 1));
  assert.ok(!profile.flags.forest_open);
});
const serveAll = (story) => { while (story.market) story.serve(story.customer.options.findIndex((o) => o.id === story.customer.target.id)); };
test('village: Fix the Bridge — Sam names the things, decoys teach, Ben trades the axe, Pip\'s plan in order opens the bridge', () => {
  const { profile, story, ui, log, fixed } = villageHarness({ grade: 6 });
  story.q.step = 'tom_bridge';
  story.talkSam(); assert.equal(story.step, 'tom_bridge', 'Sam does not start it before Tom');
  story.talkTom(); assert.equal(story.step, 'bridge');
  assert.deepEqual(story.groundItems(), []);
  story.talkSam(); assert.equal(story.step, 'gather');
  assert.ok(log.at(-1).some((l) => l.en.includes('a rope, a log and an axe')));
  assert.deepEqual(story.groundItems(), ['rope', 'chain', 'log', 'boulder']);
  assert.equal(story.pick('chain'), false);
  assert.ok(log.at(-1)[0].en.includes('chain') && log.at(-1)[0].vi.includes('dây xích'), 'decoy is explained');
  assert.equal(story.pick('boulder'), false);
  assert.ok(story.groundItems().includes('chain'), 'decoys are never taken');
  assert.deepEqual(profile.skills.vocabulary, { attempts: 2, correct: 0, firstTry: 0, hints: 0 });
  assert.equal(story.pick('rope'), true); assert.equal(story.pick('log'), true);
  assert.deepEqual(story.items, ['rope', 'log']);
  story.talkSam(); assert.ok(log.at(-1)[0].en.includes('an axe'), 'Sam says what is still missing'); assert.equal(story.step, 'gather');
  story.talkBen(); assert.ok(story.market, 'Ben asks for one market round first'); serveAll(story);
  assert.ok(story.items.includes('axe'), 'Ben gives the axe after the round');
  assert.equal(story.step, 'gather');
  story.talkSam(); assert.equal(story.step, 'plan');
  assert.ok(ui.pending && ui.pending.options.length === 4 && ui.pending.page.vi === undefined);
  const wrong = ui.pending.options.findIndex((o) => o !== BRIDGE[6].steps[0]); ui.pending.pick(wrong);
  assert.ok(ui.pending.page.vi.includes('First'), 'hint after a wrong order');
  for (let n = 0; n < 4; n++) ui.pending.pick(ui.pending.options.indexOf(BRIDGE[6].steps[n]));
  assert.equal(story.step, 'open'); assert.equal(profile.flags.bridge_fixed, true); assert.equal(fixed.n, 1);
  assert.equal(story.q.orderWrong, 1);
  story.talkTom(); assert.equal(story.step, 'done'); assert.equal(profile.flags.forest_open, true);
});
test('village: grade 7 has no bridge plan — Sam says so and the bridge opens by itself', () => {
  const { profile, story, log, fixed } = villageHarness({ grade: 7, letter: null });
  story.q.step = 'bridge'; story.talkSam();
  assert.ok(log.at(-1)[0].vi.includes('lớp 7 chưa được soạn'));
  assert.equal(story.step, 'open'); assert.ok(profile.flags.bridge_fixed); assert.equal(fixed.n, 1);
  assert.deepEqual(story.groundItems(), []);
});
test('village: no vocabulary for the unit -> Ben says so and the story is not blocked', () => {
  const { story, log } = villageHarness({ n: 0 });
  story.q.step = 'jars'; story.talkBen();
  assert.ok(log.at(-1)[0].vi.includes('chưa có')); assert.equal(story.step, 'tom_bridge');
  story.q.step = 'gather'; story.q.items = []; story.talkBen();
  assert.ok(story.items.includes('axe'), 'no jars: Ben still hands over the axe');
});

// ---------------------------------------------------------------- mini games (rules and places)
test('mini games: stars, race rings and start signs are on reachable ground', async () => {
  const STARS = [[-46, -6], [-38, -34], [-12, -38], [30, -30], [48, -12], [52, 20], [44, 38], [10, 50], [-22, 50], [-48, 30], [-30, 14], [8, -36]];
  const RACE = [[-20, 2], [-32, 4], [-42, 14], [-40, 28], [-34, 42], [-18, 46], [-6, 44], [-8, 30], [-20, 2]];
  const STARTS = [[19.8, 19.2], [33.5, 6], [-22, 4], [-4.4, -8.5], [-20, -4], [-26, -2]];
  const src = (await import('node:fs')).readFileSync(new URL('../src/game/minigames.js', import.meta.url), 'utf8');
  assert.ok(src.includes(JSON.stringify(STARS).replace(/,/g, ', ').replace(/\], \[/g, '], [')), 'test list matches the game list');
  L.setRegion('village');
  try { for (const [x, z] of [...STARS, ...RACE, ...STARTS]) assert.ok(L.walkable(x, z, 0.9) && findPath(L.SPAWN.x, L.SPAWN.z, x, z), x + ',' + z); }
  finally { L.setRegion('forest'); }
});

// ---------------------------------------------------------------- combat rules
import { MONSTERS, SPAWNS, playerAtk, hurt, inArc } from '../src/core/rules.js';
test('combat: attack grows with level and weapon, armour never blocks everything, the arc is in front only', () => {
  const p = S.newProfile('An', 6);
  assert.equal(playerAtk(p), 10); p.stats.level = 5; p.gear = { atk: 6, def: 4 };
  assert.equal(playerAtk(p), 24); assert.equal(hurt(11, p), 7); assert.equal(hurt(2, p), 1);
  assert.ok(inArc(0, 0, 0, 0, 2)); assert.ok(!inArc(0, 0, 0, 0, -2), 'behind'); assert.ok(!inArc(0, 0, 0, 0, 3), 'too far'); assert.ok(inArc(0, 0, Math.PI / 2, 2, 0));
  assert.ok(Math.ceil(MONSTERS.slime.hp / 10) <= 3, 'a level 1 child beats a slime in 3 hits');
  assert.equal(S.maxHp(S.newProfile('x', 6)), 100);
});
test('combat: every monster spawn is on reachable ground east of the river', () => {
  L.setRegion('village');
  try { for (const [kind, x, z] of SPAWNS) { assert.ok(MONSTERS[kind]); assert.ok(L.walkable(x, z, 1) && findPath(L.SPAWN.x, L.SPAWN.z, x, z), kind + ' ' + x + ',' + z); assert.ok(Math.hypot(x, z - 4) > 25, 'not in the village square'); } }
  finally { L.setRegion('forest'); }
});

// ---------------------------------------------------------------- shop
import { ITEMS, bag, wear, buy, eat, shopList } from '../src/core/rules.js';
test('shop: buying needs gold and level, puts the item on, owned items are free to wear again, bread heals', () => {
  const p = S.newProfile('An', 6);
  assert.deepEqual(buy(p, 'wood_sword'), { ok: false, why: 'gold' });
  p.stats.gold = 500;
  assert.equal(buy(p, 'iron_sword').why, 'level');
  assert.ok(buy(p, 'wood_sword').ok); assert.equal(p.stats.gold, 460); assert.equal(bag(p).weapon, 'wood_sword'); assert.equal(playerAtk(p), 15);
  p.stats.level = 5; assert.ok(buy(p, 'iron_sword').ok); assert.equal(playerAtk(p), 10 + 8 + 12);
  const g = p.stats.gold; assert.equal(buy(p, 'wood_sword').why, 'owned'); assert.equal(p.stats.gold, g, 'no second payment'); assert.equal(bag(p).weapon, 'wood_sword');
  assert.ok(buy(p, 'leather_vest').ok); assert.equal(S.maxHp(p), 100 + 4 * 12 + 20); assert.equal(hurt(6, p), 4);
  assert.ok(buy(p, 'bread').ok && buy(p, 'bread').ok); assert.equal(bag(p).food, 2);
  p.stats.hp = 30; assert.equal(eat(p, S.maxHp(p)), 50); assert.equal(p.stats.hp, 80); assert.equal(bag(p).food, 1);
  p.stats.hp = S.maxHp(p); assert.equal(eat(p, S.maxHp(p)), 0, 'not wasted at full health'); assert.equal(bag(p).food, 1);
  assert.deepEqual(shopList('rose'), ['clover', 'bread']); assert.equal(shopList('forge').length, 5);
  for (const it of Object.values(ITEMS)) assert.ok(it.en && it.vi && it.cost > 0);
});

// ---------------------------------------------------------------- match-3 rules
import * as M3 from '../src/core/match3.js';
test('match-3: fresh boards have no match but always a move; a good swap clears, falls and refills; a bad swap is undone', () => {
  const rnd = L.mulberry32(5);
  for (let k = 0; k < 20; k++) { const b = M3.newBoard(rnd); assert.equal(M3.matches(b).size, 0); assert.equal(b.length, 49); assert.ok(b.every((g) => g >= 0 && g < M3.KINDS)); }
  const b = M3.newBoard(L.mulberry32(9)); let found = null;
  for (let i = 0; i < 49 && !found; i++) for (const j of [i + 1, i + 7]) { if (j >= 49 || !M3.adjacent(i, j)) continue; const c = [...b]; if (M3.move(c, i, j, L.mulberry32(1)).ok) { found = [i, j]; break; } }
  assert.ok(found, 'a move exists'); assert.ok(M3.hasMove(b));
  const r = M3.move(b, found[0], found[1], L.mulberry32(1));
  assert.ok(r.ok && r.cleared >= 3 && r.score >= 30 && r.combo >= 1); assert.ok(b.every((g) => g >= 0), 'refilled'); assert.equal(M3.matches(b).size, 0, 'cascades resolved');
  const flat = Array.from({ length: 49 }, (_, i) => (i + Math.floor(i / 7)) % 6), copy = [...flat];
  assert.equal(M3.move(flat, 0, 2, rnd).ok, false, 'not neighbours'); assert.deepEqual(flat, copy);
  assert.ok(!M3.adjacent(6, 7), 'row ends are not neighbours');
  assert.deepEqual(M3.candyReward(600), { gold: 10, exp: 15 }); assert.deepEqual(M3.candyReward(99999), { gold: 30, exp: 40 });
});

// ---------------------------------------------------------------- falling blocks rules
import * as B from '../src/core/blocks.js';
test('blocks: pieces stay inside walls, rotate with kicks, a full row clears and the rest falls', () => {
  const b = B.empty();
  for (let k = 0; k < 7; k++) { const p = B.spawn(k); assert.ok(B.fits(b, p)); for (let r = 0; r < 4; r++) assert.equal(B.cells({ ...p, r }).length, 4); }
  let p = B.spawn(1); for (let i = 0; i < 12; i++) p = B.shift(b, p, -1, 0); assert.equal(Math.min(...B.cells(p).map((c) => c[0])), 0, 'stops at the left wall');
  const i0 = { k: 0, r: 1, x: 8, y: 5 }; assert.ok(B.fits(b, B.shift(b, i0, 0, 0, 1)), 'kicked off the right wall when turning');
  for (let x = 0; x < 8; x++) b[19 * B.W + x] = 3;
  const o = B.drop(b, { k: 1, r: 0, x: 8, y: 0 }); assert.equal(o.y, 18);
  assert.equal(B.lock(b, o), 1); assert.equal(b[19 * B.W + 8], 2, 'top half of the O fell into the bottom row'); assert.equal(b.filter(Boolean).length, 2);
  assert.deepEqual(B.blocksReward(800), { gold: 10, exp: 16 });
});

// node --test tests/unit.test.mjs
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
  assert.equal(S.addExp(p, S.expNeed(1) + 10), 1); assert.equal(p.stats.level, 2);
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
    for (const [x, z] of [[ex.x, ex.z + 1.5], [40, 8], [-15.5, 30], [15.5, 15]]) assert.ok(findPath(L.SPAWN.x, L.SPAWN.z, x, z), 'route to ' + x + ',' + z);
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
test('content: bridge quest is written for grades 6-9, English lines carry no Vietnamese', () => {
  assert.deepEqual(Object.keys(BRIDGE).map(Number), [6, 7, 8, 9]);
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
function villageHarness({ noBridge = false, grade = 6, letter = { letter: 'Dear Tom,\n\nPlease give it to the librarian.', question: 'Who gets it?', choices: ['The librarian', 'Nam', 'Mai'], answer: 0, hint: 'đọc lại' }, n = 8 } = {}) {
  const profile = S.newProfile('An', grade), log = [];
  const cards = Array.from({ length: n }, (_, i) => ({ id: `g${grade}_u01:w${i}`, word: 'w' + i, vi: 'nghĩa ' + i }));
  const ui = { dialogue: (pages, done) => { log.push(pages); if (done) done(); }, choose: (page, options, pick) => { ui.pending = { page, options, pick }; } };
  const fixed = { n: 0 };
  const story = new VillageStory({ profile, save() {}, ui, sfx() {}, onChange() {}, letter, cards, cardOf: (id) => cards.find((c) => c.id === id), bridge: noBridge ? null : BRIDGE[grade] || null, onBridgeFixed: () => fixed.n++ });
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
test('village: a grade with no bridge plan — Sam says so and the bridge opens by itself', () => {
  const { profile, story, log, fixed } = villageHarness({ grade: 7, letter: null, noBridge: true });
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
  const STARS = [[-36, 20], [-38, -34], [-12, -38], [30, -30], [48, -12], [52, 20], [44, 38], [10, 50], [-22, 50], [-35, 38], [-30, 14], [8, -36]];
  const RACE = [[-20, 2], [-32, 4], [-42, 14], [-40, 28], [-34, 42], [-22, 47], [-6, 44], [-8, 30], [-20, 2]];
  const STARTS = [[18.4, 19.2], [33.5, 6], [-25, -76], [-62, -60], [-61, 68], [-82, 32]];
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
  assert.ok(Math.ceil(MONSTERS.bunny.hp / 10) <= 4, 'a level 1 child with no weapon beats a level 1 monster in 4 hits');
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
  assert.ok(buy(p, 'wood_sword').ok); assert.equal(p.stats.gold, 500 - ITEMS.wood_sword.cost); assert.equal(bag(p).weapon, 'wood_sword'); assert.equal(playerAtk(p), 10 + ITEMS.wood_sword.atk);
  p.stats.level = 5; assert.ok(buy(p, 'iron_sword').ok); assert.equal(playerAtk(p), 10 + 8 + ITEMS.iron_sword.atk);
  const g = p.stats.gold; assert.equal(buy(p, 'wood_sword').why, 'owned'); assert.equal(p.stats.gold, g, 'no second payment'); assert.equal(bag(p).weapon, 'wood_sword');
  assert.ok(buy(p, 'leather_vest').ok); assert.equal(S.maxHp(p), 100 + 4 * 12 + ITEMS.leather_vest.hp); assert.equal(hurt(6, p), Math.max(1, 6 - ITEMS.leather_vest.def));
  assert.ok(buy(p, 'bread').ok && buy(p, 'bread').ok); assert.equal(bag(p).food, 2);
  p.stats.hp = 30; assert.equal(eat(p, S.maxHp(p)), 50); assert.equal(p.stats.hp, 80); assert.equal(bag(p).food, 1);
  p.stats.hp = S.maxHp(p); assert.equal(eat(p, S.maxHp(p)), 0, 'not wasted at full health'); assert.equal(bag(p).food, 1);
  assert.deepEqual(shopList('rose'), ['clover', 'bread', 'fire_amulet', 'ice_amulet', 'wind_amulet', 'thunder_amulet']); assert.equal(shopList('forge').length, 13);      // + element swords, staffs, amulets (20/11)
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

// ---------------------------------------------------------------- word chests (letter lock)
import * as SP from '../src/core/spell.js';
test('spell: tiles hold every letter plus decoys, only the next letter is accepted, spaces are kept in the hint', () => {
  const rnd = L.mulberry32(3), word = 'pencil case', tl = SP.tiles(word, rnd);
  assert.equal(tl.length, 10 + 2);
  const st = { word, typed: '', wrong: 0 };
  assert.equal(SP.shown(st), '______ ____');
  const wrongI = tl.findIndex((t) => t.ch !== 'p'); assert.equal(SP.press(st, tl, wrongI), 'wrong'); assert.equal(st.wrong, 1);
  let last = '';
  for (const ch of SP.letters(word)) { const i = tl.findIndex((t) => !t.used && t.ch === ch); last = SP.press(st, tl, i); }
  assert.equal(last, 'done'); assert.equal(SP.shown(st), 'pencil case');
  assert.ok(SP.spellable('school bag') && !SP.spellable('a') && !SP.spellable('extraordinarily long words'));
  assert.deepEqual(SP.chestReward(0), { gold: 15, exp: 20 }); assert.deepEqual(SP.chestReward(9), { gold: 6, exp: 8 });
});

// ---------------------------------------------------------------- hunts and boss
import { HUNTS, hunt, countKill, huntLine, BOSS, SHIELDS, shieldDue } from '../src/core/rules.js';
test('hunts: only the asked monster counts, only while active, finishing returns true once; English lines by grade', () => {
  const p = S.newProfile('An', 6), h = hunt(p);
  assert.equal(countKill(p, 'slime'), false, 'not active yet'); h.active = true;
  assert.equal(countKill(p, 'red'), false); assert.equal(h.got, 0);
  assert.equal(countKill(p, 'slime'), false); assert.equal(countKill(p, 'slime'), false); assert.equal(countKill(p, 'slime'), true); assert.equal(countKill(p, 'slime'), false);
  assert.ok(huntLine(HUNTS[0], 6).length < huntLine(HUNTS[0], 9).length);
  for (const q of HUNTS) for (const t of Object.values(q.en)) assert.ok(!/[àáảãạăâđêôơư]/i.test(t), 'English only');
  assert.ok(shieldDue(450, 600, 0) && !shieldDue(460, 600, 0) && !shieldDue(100, 600, 3) && shieldDue(100, 600, 2));
  assert.equal(SHIELDS.length, 3); assert.ok(BOSS.hp > 0);
});

test('knowledge gates: level 5 waits for the owl review, extra EXP is capped, passing lets the level go up once the map allows it', () => {
  const p = S.newProfile('An', 6); p.stats.level = 4; p.region = 'harbor';      // the sea allows levels 5-10
  S.addExp(p, S.expTo(5) + 500); assert.equal(p.stats.level, 5); assert.equal(S.gateWaiting(p), 5); assert.equal(p.stats.exp, S.expNeed(5), 'bar full, rest not stored');
  S.addExp(p, 999); assert.equal(p.stats.level, 5);
  assert.equal(S.passGate(p, 5), 1); assert.equal(p.stats.level, 6); assert.equal(S.gateWaiting(p), 0); assert.equal(p.stats.exp, 0);
});

// ---------------------------------------------------------------- level caps of the maps, the skills' top level, monsters by level (24/11)
import * as PR from '../src/core/progress.js';
import * as W from '../src/core/world.js';
import { ZONES, spawnsOf } from '../src/core/zones.js';
test('progress: the top level comes from the skill tree (7 lines x 10 ranks = level 70), every map has a hard cap, the cap stops EXP', () => {
  assert.equal(PR.POINTS_PER_ELEMENT, 70); assert.equal(PR.POINTS_ALL_ELEMENTS, 280); assert.equal(PR.MAX_LEVEL, 70); assert.ok(PR.HIGHEST_SKILL_LEVEL <= PR.MAX_LEVEL);
  assert.deepEqual(['village', 'harbor', 'forest', 'desert'].map(PR.capOfMap), [5, 10, 20, 25], 'the caps are the tops of the ranges of the world map picture');
  assert.equal(Math.max(...W.MAPS.map((m) => m.lv[1])), PR.MAX_LEVEL, 'the last map ends at the top level');
  assert.equal(PR.capOfRegion('isle'), 10, 'the treasure isle belongs to the sea');
  const p = S.newProfile('An', 6); p.region = 'village'; p.stats.level = 4;
  assert.equal(S.killExp(p, 100, 4), 100); S.addExp(p, S.expNeed(4)); assert.equal(p.stats.level, 5);
  assert.equal(S.atCap(p), true); assert.equal(S.killExp(p, 100, 5), 0, 'no EXP for a kill at the cap'); const before = p.stats.exp; S.addExp(p, 5000); assert.equal(p.stats.level, 5); assert.equal(p.stats.exp, before, 'nothing is added at the cap');
  p.region = 'harbor'; assert.equal(S.atCap(p), false); assert.ok(S.killExp(p, 100, 6) > 0);
  assert.equal(PR.levelCap({ admin: true, region: 'village' }), PR.MAX_LEVEL, 'the admin has no cap');
  assert.ok(S.killExp({ ...p, stats: { ...p.stats, level: 8 } }, 100, 5) < 100 && S.killExp({ ...p, stats: { ...p.stats, level: 8 } }, 100, 5) >= 15, 'a monster far below the hero pays less');
});
test('at the top level of a map the gold of monsters and quests is halved and fades to nothing, and comes back on a new map (24/11)', () => {
  const p = S.newProfile('An', 6); p.region = 'village'; p.stats.level = 4;
  assert.equal(S.capGold(p, 100), 100, 'below the cap: full gold'); assert.ok(!p.capN);
  p.stats.level = 5; assert.equal(S.atCap(p), true);
  assert.equal(S.capGold(p, 100), 50, 'the first reward at the cap pays half');
  const got = []; for (let i = 0; i < 40; i++) got.push(S.capGold(p, 100));
  assert.ok(got.every((g, i) => i === 0 || g <= got[i - 1]) && got[0] < 50 && got[0] > 40, 'it fades with every reward');
  assert.equal(got[got.length - 1], 0, 'after about thirty rewards no gold is left'); assert.equal(PR.capGoldFactor(0), 0.5); assert.equal(PR.capGoldFactor(30), 0); assert.equal(PR.capGoldFactor(99), 0);
  p.region = 'harbor'; assert.equal(S.capGold(p, 100), 100, 'a new map (cap 10): the gold is back');
  p.stats.level = 10; assert.equal(S.capGold(p, 100), 50, 'and has its own count at its own cap');
});
test('monsters: one level per kind, stats follow the level, one hunting ground per kind in the right map, the gear of the level wins', () => {
  const R2 = { village: [1, 5], harbor: [5, 10], forest: [10, 20] };
  for (const [region, list] of Object.entries(ZONES)) {
    const kinds = list.map((z) => z.kind); assert.equal(new Set(kinds).size, kinds.length, region + ': one ground per kind');
    const levels = kinds.map((k) => MONSTERS[k].level); assert.deepEqual(levels, [...levels].sort((a, b) => a - b), region + ': the grounds climb with the level');
    for (const k of kinds) assert.ok(MONSTERS[k].level >= R2[region][0] && MONSTERS[k].level <= R2[region][1], `${k} (lv ${MONSTERS[k].level}) belongs to the ${region} range`);
    const sp = spawnsOf(region); for (const z of list) assert.equal(sp.filter(([k]) => k === z.kind).length, z.n, z.id + ' is full');
    for (let i = 0; i < sp.length; i++) for (let j = i + 1; j < sp.length; j++) if (sp[i][0] !== sp[j][0]) assert.ok(Math.hypot(sp[i][1] - sp[j][1], sp[i][2] - sp[j][2]) > 4, `${sp[i][0]} and ${sp[j][0]} are not mixed`);
  }
  const lv = (k) => MONSTERS[k].level; assert.ok(lv('bunny') < lv('slime') && lv('crab') >= 5 && lv('bat') >= 10 && lv('orc') <= 20);
  for (const L of [1, 5, 10, 20, 40, 70]) {
    const m = PR.mobStats(L), hits = m.hp / PR.heroAtkAt(L); assert.ok(hits >= 2 && hits <= 7.01, `level ${L}: ${hits.toFixed(1)} hits with the gear of the level`);
    if (L >= 10 && L <= 20) { const old = PR.baseAtk(L) + PR.weaponAtk(L - 10); assert.ok(m.hp / old > hits * 1.15, `level ${L}: gear ten levels old needs clearly more hits`); }
    assert.ok(PR.mobStats(L, 'elite').exp > m.exp && PR.mobStats(L + 1).exp > m.exp && PR.mobStats(L + 1).hp > m.hp, 'EXP and hp grow with the level');
  }
  const kills = (L) => PR.expNeed(L) / PR.mobStats(L).exp; for (const L of [1, 10, 30, 60]) assert.ok(kills(L) >= 8 && kills(L) <= 30, `level ${L} takes ${kills(L).toFixed(1)} kills`);
  // weapons: made for a level, price from the monsters' gold, sold in the map of that level
  for (const [id, it] of Object.entries(ITEMS)) if (it.slot === 'weapon' && !it.rare) { assert.ok(it.atk >= Math.round(PR.weaponAtk(it.level) * 0.7) && it.atk <= PR.weaponAtk(it.level), `${id} gives the attack of level ${it.level}`); assert.ok(it.cost >= 40); }
  const sellers = { forge: [1, 5], harbor: [6, 10], forest: [11, 20] };
  for (const [seller, [lo, hi]] of Object.entries(sellers)) for (const id of shopList(seller)) { const it = ITEMS[id]; if (it.slot === 'weapon' || it.slot === 'armor' || it.slot === 'charm') assert.ok(it.level >= lo && it.level <= hi, `${id} (lv ${it.level}) sold at ${seller}`); }
  assert.ok(shopList('forest').some((id) => ITEMS[id].level === 20) && shopList('harbor').some((id) => ITEMS[id].level === 10), 'each shop has its top piece');
});
test('mini games: a fee that grows with the level, no pay; the race has no letters', () => {
  assert.ok(PR.gameFee('candy', 1) >= 5 && PR.gameFee('candy', 20) > PR.gameFee('candy', 1) && PR.gameFee('race', 10) > PR.gameFee('candy', 10));
  assert.ok(PR.gameFee('candy', 1) <= MONSTERS.bunny.gold * 4, 'a few kills of gold pay for a game at the start');
  assert.ok(!/CHỮ CÁI/.test(readFileSync(new URL('../src/ui/race3d.js', import.meta.url), 'utf8').split('\n').filter((l) => l.includes('g.help')).join('')), 'the race help no longer talks about letters');
});

// ---------------------------------------------------------------- review round: pay limits, Map 2, units, grammar, old saves
import { map2Ready, forestReady, BOSSES } from '../src/core/rules.js';
import { GRAMMAR, grammarFor } from '../src/core/grammar.js';
test('the sea (Map 2) opens at level 5 with the Slime King beaten and the owl review passed, the forest (Map 3) at level 10; the unit follows the map unless a parent picks one', () => {
  const p = S.newProfile('An', 8);
  assert.equal(S.unitOf(p), 1); assert.equal(BOSSES[0].level, 4, 'the Slime King wakes at level 4, one below the village cap'); assert.ok(BOSSES[1].level >= 19);
  p.flags.boss1 = true; p.stats.level = 4; assert.equal(map2Ready(p), false);
  p.stats.level = 5; assert.equal(map2Ready(p), false, 'the owl review is still missing');
  p.gates = { 5: true }; assert.equal(map2Ready(p), true); p.flags.map2 = true; assert.equal(S.unitOf(p), 2);
  p.flags.forest_open = true; p.stats.level = 9; p.gates[10] = true; assert.equal(forestReady(p), false); p.stats.level = 10; assert.equal(forestReady(p), true);
  p.unitPick = 5; assert.equal(S.unitOf(p), 5);
  assert.equal(S.expTo(20), 9405 * S.EXP_K, 'levels 1-20 need the old 9,405 EXP times EXP_K (24/11: longer bar)');
});
test('grammar gate items: valid answers, English-only sentences with one blank, only written units', () => {
  for (const [id, list] of Object.entries(GRAMMAR)) for (const g of list) {
    assert.ok(/^g[6-9]_u\d\d$/.test(id)); assert.equal(g.q.split('___').length, 2, g.q);
    assert.ok(g.a >= 0 && g.a < g.options.length && new Set(g.options).size === g.options.length);
    assert.ok(!/[àáảãạăâđêôơư]/i.test(g.q + g.options.join('')), g.q); assert.ok(g.why.length > 3);
  }
  assert.equal(grammarFor(6, 1).length, 2); assert.equal(grammarFor(9, 1).length, 2); assert.equal(grammarFor(7, 2).length, 2, 'Unit 2 has grammar since 19/11'); assert.equal(grammarFor(8, 2, 6).length, 6); assert.deepEqual(grammarFor(6, 3), [], 'Unit 3 is not written yet');
});
test('old saves (v1 and v2 before bag, hunts, chests, gates) load and play on (K5)', () => {
  const v1 = S.migrate({ version: 1, name: 'Bé', grade: 8, quests: { village: { step: 'done' } }, flags: { forest_open: true }, words: { 'g8_u01:hobby': { box: 2, due: 1 } }, stats: { gold: 12 } });
  const p = v1.profiles[0]; assert.equal(p.grade, 8); assert.equal(p.stats.gold, 12); assert.equal(p.stats.level, 1); assert.equal(S.unitOf(p), 1);
  const v2 = S.migrate({ version: 2, last: 'a', profiles: [{ id: 'a', name: 'An', grade: 6, unit: 1, quests: {}, flags: {}, words: {}, skills: {}, stats: { gold: 5, exp: 3, level: 4 } }] }), q = v2.profiles[0];
  assert.deepEqual(bag(q), { owned: [], weapon: '', armor: '', charm: '', food: 0 }); assert.deepEqual(wear(q), { atk: 0, def: 0, hp: 0, el: '', near: 0, far: 0, resist: {}, eldmg: {} });
  assert.equal(hunt(q).active, false); assert.equal(S.gateWaiting(q), 0); assert.equal(S.addExp(q, S.expNeed(4)), 1); assert.equal(S.gateWaiting(q), 5);
  assert.equal(map2Ready(q), false);
});

import { sell, sellPrice } from '../src/core/rules.js';
test('shop: selling pays half, takes the item off, bread one by one, nothing for what is not owned', () => {
  const p = S.newProfile('An', 6); p.stats.level = 8; p.stats.gold = 1000;
  assert.ok(buy(p, 'iron_armor').ok); assert.equal(p.gear.def, ITEMS.iron_armor.def);
  assert.equal(sell(p, 'iron_armor'), sellPrice('iron_armor')); assert.equal(p.inv.armor, ''); assert.equal(p.gear.def, 0); assert.ok(!p.inv.owned.includes('iron_armor'));
  assert.equal(sell(p, 'iron_armor'), 0, 'already sold');
  buy(p, 'bread'); buy(p, 'bread'); const g = p.stats.gold; assert.equal(sell(p, 'bread'), 3); assert.equal(p.inv.food, 1); assert.equal(p.stats.gold, g + 3);
});

import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
test('every source file parses (catches a stray brace or comment before the browser does)', () => {
  const walk = (d) => readdirSync(d).flatMap((f) => { const p = d + '/' + f; return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : []; });
  for (const f of walk(new URL('../src', import.meta.url).pathname)) {
    const r = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: readFileSync(f) });
    assert.equal(r.status, 0, f + ': ' + String(r.stderr).split('\n').slice(0, 4).join(' '));
  }
});

test('keys: Vietnamese input method letters still walk and act (Unikey / Telex on)', async () => {
  const { keyCode } = await import('../src/core/keys.js');
  assert.equal(keyCode({ code: 'KeyW', key: 'w' }), 'KeyW');
  assert.equal(keyCode({ code: '', key: 'ư' }), 'KeyW');
  assert.equal(keyCode({ code: '', key: 'Ư' }), 'KeyW');
  assert.equal(keyCode({ code: '', key: 'á' }), 'KeyS');
  assert.equal(keyCode({ code: '', key: 'đ' }), 'KeyD');
  assert.equal(keyCode({ code: '', key: 'a' }), 'KeyA');
  assert.equal(keyCode({ code: 'Unidentified', key: 'e' }), 'KeyE');
  assert.equal(keyCode({ code: '', key: ' ' }), 'Space');
  assert.equal(keyCode({ code: '', key: 'Backspace' }), '');
});

test('Forest (Map 3, levels 10-20): own hunts, the Mushroom Queen before the Ancient Golem, owl gates every 5 levels', async () => {
  const R = await import('../src/core/rules.js');
  const p = S.newProfile('An', 8), hv = R.hunt(p), hf = R.hunt(p, 'forest');
  assert.notEqual(hv, hf, 'two separate hunts'); assert.ok(p.hunt2);
  hf.active = true; assert.equal(R.FOREST_HUNTS[0].kind, 'bat');
  assert.equal(R.countKill(p, 'bat'), false); assert.equal(R.countKill(p, 'bat'), false); assert.equal(R.countKill(p, 'bat'), true);
  assert.equal(hv.got, 0, 'village hunt untouched');
  for (const q of R.FOREST_HUNTS) for (const t of Object.values(q.en)) assert.ok(!/[àáảãạăâđêôơư]/i.test(t), 'English only');
  const q3 = R.BOSSES.find((b) => b.flag === 'boss3'); assert.equal(q3.region, 'forest'); assert.equal(q3.level, 17); assert.ok(q3.level < R.BOSSES.find((b) => b.flag === 'boss2').level, 'the Queen comes before the Golem');
  for (const k of ['bat', 'shroom']) assert.ok(R.MONSTERS[k].level >= 10 && R.MONSTERS[k].level <= 20, k + ' is a forest monster');
  assert.equal(R.forestChapter({ quests: {} }), false); assert.equal(R.forestChapter({ quests: { forest: { step: 'seek' } } }), false); assert.equal(R.forestChapter({ quests: { forest: { step: 'done' } } }), true, 'the chapter wakes after the crystal quest');
  assert.ok(S.GATES.includes(25) && S.GATES.includes(70) && S.GATES.every((g) => g % 5 === 0));
});

test('desktop app: every save is mirrored to a file and an empty page storage is restored from it', async () => {
  const { load, persist, KEY, newProfile } = await import('../src/core/save.js');
  const mem2 = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };
  const files = []; globalThis.eqDesktop = { readSave: () => files[files.length - 1] || '', writeSave: (t) => files.push(t) };
  const realLS = globalThis.localStorage; const ls = mem2(); Object.defineProperty(globalThis, 'localStorage', { value: ls, configurable: true });
  try {
    const store = load(); store.profiles.push(newProfile('An', 6)); store.profiles[0].stats.level = 9; persist(store);
    assert.equal(files.length, 1, 'written to the file');
    const fresh = mem2(); Object.defineProperty(globalThis, 'localStorage', { value: fresh, configurable: true });   // page storage wiped
    const back = load(); assert.equal(back.profiles[0].stats.level, 9, 'restored from the file'); assert.ok(fresh.getItem(KEY), 'page storage refilled');
  } finally { delete globalThis.eqDesktop; if (realLS) Object.defineProperty(globalThis, 'localStorage', { value: realLS, configurable: true }); else delete globalThis.localStorage; }
});

test('quest journal: main quests follow the save, daily quests count events and pay once', async () => {
  const Q = await import('../src/core/quests.js');
  const p = S.newProfile('An', 6); p.quests.village = { step: 'jars' };
  assert.equal(Q.mainCurrent(p).id, 'jars', 'letter done, jars next');
  assert.deepEqual(Q.claimMain(p, 'letter'), { gold: 20, exp: 40 }); assert.equal(Q.claimMain(p, 'letter'), null, 'paid once');
  assert.equal(Q.claimMain(p, 'bridge'), null, 'not done yet');
  const d = Q.dailyOf(p, 100); assert.equal(d.ids.length, 3); assert.deepEqual(Q.dailyOf(p, 100).ids, d.ids, 'same three all day');
  const id = d.ids[0], q = Q.DAILY.find((x) => x.id === id);
  assert.equal(Q.claimDaily(p, 100, id), null, 'nothing before it is done');
  const fin = Q.track(p, 100, q.ev, q.need); assert.ok(fin.some((x) => x.id === id));
  assert.ok(Q.claimDaily(p, 100, id).gold > 0); assert.equal(Q.claimDaily(p, 100, id), null);
  assert.notEqual(Q.dailyOf(p, 101), d, 'a new day, new quests');
  for (const x of [...Q.MAIN, ...Q.DAILY]) assert.ok(!/[àáảãạăâđêôơư]/i.test(x.en), 'English titles');
});

// ---------------------------------------------------------------- map exam (18/11)
import * as Exam from '../src/core/exam.js';
test('map exam: ten questions, 4 words + 3 grammar + 3 sentences, each answer inside its options', () => {
  const cards = Array.from({ length: 20 }, (_, i) => ({ id: 'w' + i, word: 'word' + i, vi: 'nghia' + i }));
  const paper = Exam.buildExam({ cards, grammar: grammarFor(6, 1, 6) });
  assert.equal(paper.questions.length, 10); assert.equal(paper.ids.length, 10);
  const kinds = {}; for (const q of paper.questions) { kinds[q.kind] = (kinds[q.kind] || 0) + 1; assert.ok(q.options[q.a], q.en); assert.equal(new Set(q.options).size, q.options.length, 'distinct options: ' + q.en); }
  assert.deepEqual(kinds, { vocab: 4, grammar: 3, sentence: 3 });
  for (const q of paper.questions.filter((x) => x.kind === 'sentence')) assert.ok(!/___/.test(q.options[q.a]) && q.options.length >= 2);
});
test('map exam: papers differ and avoid the last one; pass mark is 8 of 10; thin grammar falls back to words', () => {
  const cards = Array.from({ length: 40 }, (_, i) => ({ id: 'w' + i, word: 'word' + i, vi: 'nghia' + i }));
  const a = Exam.buildExam({ cards, grammar: grammarFor(8, 1, 6) }), b = Exam.buildExam({ cards, grammar: grammarFor(8, 1, 6), avoid: a.ids });
  assert.ok(b.ids.filter((id) => id.startsWith('w') && a.ids.includes(id)).length === 0, 'fresh words first');
  const none = Exam.buildExam({ cards, grammar: [] }); assert.equal(none.questions.length, 10); assert.ok(none.questions.every((q) => q.kind === 'vocab'));
  assert.equal(Exam.buildExam({ cards: cards.slice(0, 3), grammar: [] }), null);
  const g = (n) => Exam.grade(a.questions, a.questions.map((q, i) => (i < n ? q.a : q.a + 1)));
  assert.equal(g(10).pass, true); assert.equal(g(8).pass, true); assert.equal(g(7).pass, false); assert.equal(g(7).wrong.length, 3);
  const p = {}; Exam.recordExam(p, a.ids, false); Exam.recordExam(p, b.ids, true);
  assert.equal(p.exam.tries, 2); assert.equal(p.exam.passed, true); assert.deepEqual(p.exam.last.slice(0, 10), b.ids);
  assert.deepEqual(Exam.EXAM_GATES, [10, 20]);
});

// ---------------------------------------------------------------- mini game tiers (18/11)
import { tierOf, TIER_PAY, rule } from '../src/core/tiers.js';
import { candyGame, blocksGame, slingGame, raceGame, withTier } from '../src/ui/arcade.js';
test('mini game tiers: by level, harder numbers and better pay at higher tiers', () => {
  assert.deepEqual([1, 9, 10, 19, 20, 30].map(tierOf), [1, 1, 2, 2, 3, 3]);
  assert.ok(TIER_PAY[3] > TIER_PAY[2] && TIER_PAY[2] > TIER_PAY[1]);
  assert.ok(rule('candy', 3).moves < rule('candy', 1).moves && rule('blocks', 3).fall < rule('blocks', 1).fall);
  assert.ok(rule('sling', 3).speed > rule('sling', 1).speed && rule('sling', 3).shots < rule('sling', 1).shots && rule('race', 3).rival > rule('race', 1).rival);
});
test('mini game tiers: the four boards build at every tier and carry the tier in the title and result', () => {
  const cards = Array.from({ length: 8 }, (_, i) => ({ id: 'w' + i, word: 'cat' + 'abcdefgh'[i], vi: 'mèo' + i }));
  for (const t of [1, 2, 3]) {
    const games = [candyGame(Math.random, t), blocksGame(Math.random, cards, t), slingGame(Math.random, t), raceGame(Math.random, cards, t)].map((g) => withTier(g, t));
    for (const g of games) { assert.match(g.title, /Bậc/); assert.equal(g.tier, t); }
  }
  assert.equal(candyGame(Math.random, 3).moves, 20); assert.equal(slingGame(Math.random, 2).shots, 11);
  const g = withTier(candyGame(Math.random, 2), 2); g.moves = 0; g.flash = 0; assert.equal(g.done().tier, 2);
});

test('candy groups: runs of 3–6 and L shapes, bonus per shape, fall distances', () => {
  const b = new Array(M3.N * M3.N).fill(0).map((_, i) => (i * 7 + Math.floor(i / 7) * 3) % 5 + 1);      // busy background, kinds 1..5
  const put = (cells, k) => { for (const [r, c] of cells) b[M3.idx(r, c)] = k; };
  put([[0, 0], [0, 1], [0, 2], [0, 3]], 0);                 // four in a row
  const g4 = M3.groups(b).find((x) => x.kind === 0); assert.equal(g4.shape, 4); assert.equal(M3.shapeBonus(4), 30);
  const b2 = new Array(M3.N * M3.N).fill(-1).map((_, i) => 1 + (i % 2) + (Math.floor(i / 7) % 2) * 2);
  for (const [r, c] of [[2, 2], [2, 3], [2, 4], [3, 2], [4, 2]]) b2[M3.idx(r, c)] = 0;      // an L
  const gl = M3.groups(b2).find((x) => x.kind === 0); assert.equal(gl.shape, 'L'); assert.equal(gl.cells.length, 5);
  const b3 = [...b2]; const fall = M3.collapseWithFall(b3, new Set(gl.cells), () => 0.5);
  assert.ok(b3.every((v) => v >= 0)); assert.equal(fall[M3.idx(0, 3)], 1); assert.equal(fall[M3.idx(4, 2)], 3);
});

// ---------------------------------------------------------------- homes and new shops (18/11)
import * as RH from '../src/core/rules.js';
test('homes: furniture goes into the home once, fruit is eaten after bread, the admin gets no house', () => {
  const p = { stats: { gold: 1000, level: 9, hp: 10 } };
  assert.equal(RH.buy(p, 'bed').ok, true); assert.equal(RH.buy(p, 'bed').why, 'have'); assert.deepEqual(RH.home(p).items, ['bed']); assert.equal(p.stats.gold, 1000 - RH.ITEMS.bed.cost); assert.equal(RH.ITEMS.bed.cost, 300, 'furniture costs 2.5 times the old price');
  assert.equal(RH.buy(p, 'flowers').ok, true); assert.ok(RH.home(p).items.includes('flowers'));
  RH.buy(p, 'apple'); RH.buy(p, 'watermelon'); assert.equal(RH.foodCount(p, 'apple'), 1);
  assert.equal(RH.eat(p, 100), 60); assert.equal(RH.foodCount(p, 'watermelon'), 0);      // the biggest fruit first
  assert.equal(RH.sell(p, 'bed'), RH.ITEMS.bed.cost / 2); assert.ok(!RH.home(p).items.includes('bed'));
  for (const s of ['home', 'garden', 'produce', 'music']) assert.ok(RH.shopList(s).length >= 4, s);
  assert.deepEqual(RH.owners([{ id: 'a', admin: true }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }, { id: 'f' }]).map((x) => x.id), ['b', 'c', 'd', 'e'], 'four lots since 24/11');
});

// ---------------------------------------------------------------- Map 2: Sunny Harbor (18/11)
import * as ST from '../src/ui/style.js';
test('harbor: sea on the east, piers and every shop reachable from the boat', async () => {
  const H = await import('../src/core/regions/harbor.js'), LH = H.default;
  assert.ok(LH.inWater(50, 20) && !LH.inWater(-12, 2), 'sea east, town west');
  for (const [x, z] of [[40, 2], [30, 28], [-23.5, -8], [-23.5, 14], [-12, -18], [2, 12], [12, 38], [28, -35]]) assert.ok(LH.walkable(x, z, 0.5), `${x},${z}`);
});
test('style studio: orders can be worn together, read well, and score the outfit', () => {
  let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 40; i++) { const o = ST.makeOrder(rnd, 4); assert.equal(o.length, 4); assert.ok(!(o.some((x) => x.item === 'dress') && o.some((x) => x.item === 'skirt' || x.item === 'T-shirt' || x.item === 'trousers'))); }
  assert.equal(ST.orderText([{ item: 'hat', color: 'orange' }, { item: 'shoes', color: 'red' }]), "I'd like an orange hat and red shoes, please.");
  const order = [{ item: 'hat', color: 'pink' }, { item: 'bag', color: 'blue' }];
  assert.deepEqual(ST.scoreOutfit(order, { hat: 'pink', bag: 'blue' }), { right: 2, total: 2, points: 40 });
  assert.equal(ST.scoreOutfit(order, { hat: 'pink', bag: 'red', shoes: 'black' }).points, 10);
});

// ---------------------------------------------------------------- Map 2 gameplay in the harbor (18/11)
import * as CA from '../src/ui/cafe.js';
import * as SA from '../src/ui/salon.js';
test('harbor: monsters, boss, hunt board, chests and word bubbles all stand on ground the hero can reach', async () => {
  const H = await import('../src/core/regions/harbor.js'), R = await import('../src/core/rules.js');
  L.setRegion('harbor');
  try {
    const reach = (x, z, what) => assert.ok(findPath(40, 2, x, z), `${what} at ${x},${z} must be reachable from the pier`);
    for (const [k, x, z] of R.HARBOR_SPAWNS) { assert.ok(R.MONSTERS[k] && R.MONSTERS[k].model, k + ' has a model'); assert.ok(L.walkable(x, z, 0.5), `${k} ${x},${z} walkable`); reach(x, z, k); }
    for (const [x, z] of H.PLAY.chests) { assert.ok(L.walkable(x, z, 1.2), `chest ${x},${z}`); reach(x, z, 'chest'); }
    for (const [x, z] of H.PLAY.spots) reach(x, z, 'bubble');
    reach(H.PLAY.board.x, H.PLAY.board.z + 1.5, 'board'); reach(H.PLAY.boss.x, H.PLAY.boss.z, 'boss');
    const near = (x, z, r, what) => { let hit = false; for (let a = 0; a < 6.28 && !hit; a += 0.4) for (const d of [0.6, 1.2, 1.8, 2.2]) if (d < r && findPath(40, 2, x + Math.cos(a) * d, z + Math.sin(a) * d)) hit = true; assert.ok(hit, `${what}: the hero can stand within ${r} m of E point ${x},${z}`); };
    near(H.HARBOR.shop.x + 1.6, H.HARBOR.shop.z + 0.6, 2.4, "Willow's stall"); reach(H.HARBOR.cafe.door[0] + 1, H.HARBOR.cafe.door[1], 'café door'); reach(H.HARBOR.salon.door[0], H.HARBOR.salon.door[1] + 1, 'salon door'); reach(H.HARBOR.boutique.door[0] + 1, H.HARBOR.boutique.door[1], 'boutique door');
    assert.ok(Math.hypot(H.PLAY.boss.x - 34, H.PLAY.boss.z + 40) > 5, 'the boss stands clear of the lighthouse');
  } finally { L.setRegion('forest'); }
});
test('Map 2 (harbor, levels 5-10): own hunt board, Captain Octopus wakes at level 9, kills count for the right board only', async () => {
  const R = await import('../src/core/rules.js'), p = S.newProfile('An', 8);
  const h = R.hunt(p, 'harbor'); assert.ok(p.hunt3 && h === p.hunt3); assert.notEqual(h, R.hunt(p, 'forest'));
  h.active = true; assert.equal(R.HARBOR_HUNTS[0].kind, 'crab');
  assert.equal(R.countKill(p, 'crab'), false); assert.equal(R.countKill(p, 'crab'), false); assert.equal(R.countKill(p, 'crab'), true);
  assert.equal(R.hunt(p).got, 0, 'village hunt untouched'); assert.equal(R.hunt(p, 'forest').got, 0, 'forest hunt untouched');
  for (const q of R.HARBOR_HUNTS) { assert.ok(R.MONSTERS[q.kind], q.kind); assert.ok(R.HARBOR_SPAWNS.filter(([k]) => k === q.kind).length >= q.need, `${q.kind} x${q.need} fit the spawns`); for (const t of Object.values(q.en)) assert.ok(!/[àáảãạăâđêôơư]/i.test(t), 'English only'); }
  const o = R.BOSSES.find((b) => b.flag === 'boss4'); assert.equal(o.region, 'harbor'); assert.equal(o.level, 9); assert.ok(o.model);
  for (const m of ['crab', 'jelly', 'pirate']) assert.ok(R.MONSTERS[m].level >= 5 && R.MONSTERS[m].level <= 10, m + ' is a Map 2 level');
  const Q = await import('../src/core/quests.js'), q = { flags: {}, stats: { level: 30 }, gates: {} };
  const at = (id) => Q.MAIN.findIndex((x) => x.id === id);
  assert.ok(at('owl5') < at('boss1') && at('boss1') < at('map2') && at('map2') < at('harbor') && at('harbor') < at('shops') && at('shops') < at('hunt3') && at('hunt3') < at('boss4') && at('boss4') < at('owl10'), 'the sea chain comes right after the village (levels 1-5 -> 5-10)');
  assert.ok(at('owl10') < at('crystals') && at('crystals') < at('hunt2') && at('hunt2') < at('owl15') && at('owl15') < at('boss3') && at('boss3') < at('boss2') && at('boss2') < at('owl20') && at('owl20') === Q.MAIN.length - 1, 'the forest chain (levels 10-20) ends with the Ancient Golem and the level-20 exam');
  assert.ok(R.map3Ready({ flags: { boss2: true }, gates: { 20: true }, stats: { level: 20 } }) && !R.map3Ready({ flags: { boss2: true }, gates: {}, stats: { level: 20 } }) && !R.map3Ready({ flags: {}, gates: { 20: true }, stats: { level: 20 } }), 'the next map needs the Ancient Golem and the level-20 exam');
  const shops = Q.MAIN.find((x) => x.id === 'shops'); assert.equal(shops.done(q), false);
  q.mini = { best: { style: 10, cafe: 20 } }; assert.equal(shops.done(q), false); q.mini.best.salon = 5; assert.equal(shops.done(q), true);
});
test('café: orders read well, score by dish, fillings and drink, and the whole game can be played through', () => {
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const tier of [1, 2, 3]) for (let i = 0; i < 60; i++) {
    const o = CA.makeOrder(rnd, tier); assert.equal(o.fill.length, tier <= 1 ? 2 : 3); assert.equal(new Set(o.fill).size, o.fill.length); assert.equal(!!o.drink, tier >= 3);
    for (const f of o.fill) assert.ok(CA.DISHES[o.dish].fill.includes(f), `${f} goes on a ${o.dish}`);
    assert.ok(/^(I'd like|Could I have|I'll have) /.test(CA.orderText(o)));
  }
  const o = { dish: 'burger', fill: ['cheese', 'tomato'], drink: null, k: 0 };
  assert.equal(CA.orderText(o), "I'd like a burger with cheese and tomato, please.");
  assert.equal(CA.orderText({ ...o, drink: 'tea', k: 1 }), 'Could I have a burger with cheese and tomato and a cup of tea, please?');
  assert.deepEqual(CA.scoreOrder(o, { dish: 'burger', fill: ['tomato', 'cheese'], drink: null }), { right: 3, total: 3, extra: 0, points: 50 });
  assert.equal(CA.scoreOrder(o, { dish: 'pizza', fill: ['cheese', 'ham'], drink: null }).points, 10, 'wrong dish 0, cheese 15, ham -5');
  assert.equal(CA.scoreOrder({ ...o, drink: 'milk' }, { dish: 'burger', fill: ['cheese', 'tomato'], drink: 'water' }).points, 45, 'wrong drink -5');
  const g = CA.cafeGame(rnd, 3); assert.equal(g.done(), null);
  for (let n = 0; n < 5; n++) { g.click(311, 510); assert.equal(g.n, n); g.click(475, 510); assert.equal(g.n, n + 1, 'SERVE works'); }      // the listen and serve buttons both answer
  g.update(2); assert.equal(g.done().id, 'cafe'); assert.ok(g.done().gold >= 0);
  const g2 = CA.cafeGame(rnd, 1); g2.click(236 + 79 * 2 + 5, 110); assert.equal(g2.dish, 'pizza', 'dish tab'); g2.click(250, 160); assert.equal(g2.fill.length, 1, 'tap an ingredient'); g2.click(250, 160); assert.equal(g2.fill.length, 0, 'tap again to remove');
});
test('salon: orders read well, never match the starting look, score by part, and DONE works on every tab', () => {
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const tier of [1, 2, 3]) for (let i = 0; i < 60; i++) {
    const o = SA.makeOrder(rnd, tier), asked = ['style', 'hair', 'lips', 'eyes', 'nails'].filter((k) => o[k]);
    assert.equal(asked.length, 2 + tier); assert.ok(!(o.style === SA.DEFAULT_LOOK.style && o.hair === SA.DEFAULT_LOOK.hair)); assert.ok(SA.STYLES.includes(o.style));
    assert.ok(SA.scoreLook(o, SA.DEFAULT_LOOK).points < asked.length * 20, 'not done by default');
  }
  assert.equal(SA.orderText({ style: 'curly', hair: 'pink', lips: 'red', k: 0 }), "I'd like curly pink hair and red lipstick, please.");
  assert.equal(SA.orderText({ style: 'ponytail', hair: 'orange', eyes: 'blue', nails: 'purple', k: 1 }), 'Could you give me an orange ponytail, blue eyeshadow and purple nails, please?');
  assert.equal(SA.hairText('braids', 'black'), 'black braids'); assert.equal(SA.hairText('ponytail', 'pink'), 'a pink ponytail');
  const o = { style: 'long', hair: 'red', lips: 'pink', k: 0 };
  assert.deepEqual(SA.scoreLook(o, { style: 'long', hair: 'red', lips: 'pink', eyes: null, nails: null }), { right: 3, total: 3, extra: 0, points: 60 });
  assert.equal(SA.scoreLook(o, { style: 'long', hair: 'blue', lips: null, eyes: 'red', nails: 'red' }).points, 20 - 10, 'one right, two things nobody asked for');
  const g = SA.salonGame(rnd, 2); g.click(236 + 216 + 10, 166); assert.equal(g.look.style, 'curly', 'style tile');
  g.click(236 + 63 + 5, 110); assert.equal(g.tab, 'hair'); g.click(250, 170); assert.equal(g.look.hair, 'red', 'hair colour tile');
  g.click(236 + 63 * 2 + 5, 110); g.click(250, 170); assert.equal(g.look.lips, 'red'); g.click(250, 170); assert.equal(g.look.lips, null, 'tap again clears lipstick');
  for (let n = 0; n < 5; n++) { g.click(475, 510); assert.equal(g.n, n + 1, 'DONE works'); }
  g.update(2); assert.equal(g.done().id, 'salon');
  const g2 = SA.salonGame(rnd, 1); g2.click(475, 510); assert.equal(g2.n, 1, 'DONE works on the style tab too (it once hid under the style tiles)');
});

test('daily quests: once Map 2 is open each day has one harbor quest and two others; Map 1 players never get a harbor one', async () => {
  const Q = await import('../src/core/quests.js');
  for (let day = 200; day < 260; day++) {
    const a = Q.dailyOf({ id: 'a', flags: {}, stats: { level: 5 }, mini: { stars: [] } }, day), b = Q.dailyOf({ id: 'b', flags: { map2: true }, stats: { level: 25 }, mini: { stars: [] } }, day);
    assert.equal(a.ids.length, 3); assert.ok(!a.ids.some((id) => id.startsWith('sea_')), 'Map 1 player day ' + day);
    assert.equal(b.ids.length, 3); assert.equal(new Set(b.ids).size, 3); assert.equal(b.ids.filter((id) => id.startsWith('sea_')).length, 1, 'Map 2 player day ' + day);
  }
  const p = { id: 'c', flags: { map2: true }, stats: { level: 25 }, mini: { stars: [] } }, d = Q.dailyOf(p, 300), sea = Q.DAILY.find((q) => q.id === d.ids.find((id) => id.startsWith('sea_')));
  assert.ok(Q.track(p, 300, sea.ev, sea.need).some((x) => x.id === sea.id), 'the harbor event finishes it');
  for (const q of Q.DAILY.filter((x) => x.map === 2)) { assert.ok(!/[àáảãạăâđêôơư]/i.test(q.en), 'English title'); assert.ok(q.need >= 1 && q.vi.length > 10); }
});

test('the sea-map exam (level 30, Unit 2): 4 words + 3 grammar + 3 sentences for every grade, and the next paper differs', async () => {
  const fs = await import('node:fs'), EX = await import('../src/core/exam.js');
  for (const g of [6, 7, 8, 9]) {
    const d = JSON.parse(fs.readFileSync(`data/learning/g${g}_u02.json`, 'utf8')), cards = d.vocabulary.filter((w) => w.word.length <= 22 && w.vi.length <= 34).map((w) => ({ id: `g${g}_u02:${w.word.toLowerCase()}`, word: w.word, vi: w.vi }));
    assert.ok(cards.length >= d.vocabulary.length - 1, `grade ${g}: almost every Unit 2 word fits a card (${cards.length}/${d.vocabulary.length})`);
    let seed = g * 13, avoid = []; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647), papers = [];
    for (let k = 0; k < 3; k++) {
      const paper = EX.buildExam({ cards, grammar: grammarFor(g, 2, 10), rnd, avoid }), kinds = { vocab: 0, grammar: 0, sentence: 0 };
      assert.equal(paper.questions.length, 10); for (const q of paper.questions) { kinds[q.kind] += 1; assert.equal(q.options.length >= 3, true); assert.equal(typeof q.a, 'number'); }
      assert.deepEqual(kinds, { vocab: 4, grammar: 3, sentence: 3 }, `grade ${g} paper ${k}`); avoid = [...paper.ids, ...avoid]; papers.push(paper.ids.join('|'));
    }
    assert.equal(new Set(papers).size, 3, `grade ${g}: three different papers`);
  }
});

// ---------------------------------------------------------------- fishing and the Sea Dex (19/11)
import * as SEA from '../src/core/sea.js';
import { fishGame } from '../src/ui/fish.js';
test('Sea Dex: fish are rolled by rarity, first finds pay once, milestones pay once, the market buys the bucket', () => {
  let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647), seen = new Set(), by = [0, 0, 0, 0];
  for (let i = 0; i < 4000; i++) { const f = SEA.rollFish(rnd, 2); seen.add(f.id); if (!f.junk) by[f.r] += 1; assert.ok(SEA.entry(f.id)); }
  assert.ok(by[0] > by[1] && by[1] > by[2] && by[2] > by[3] && by[3] > 0, 'commoner fish bite more often: ' + by);
  for (const f of SEA.FISH) assert.ok(seen.has(f.id), f.id + ' can be caught');
  for (const e of [...SEA.CREATURES, ...SEA.JUNK]) { assert.ok(e.en && e.vi && e.icon); assert.ok(!/[àáảãạăâđêôơư]/i.test(e.en)); }
  assert.equal(SEA.DEX_TOTAL, 20);
  const p = { stats: { gold: 0 } }, r1 = SEA.discover(p, 'sardine', 1), r2 = SEA.discover(p, 'sardine', 1);
  assert.ok(r1.isNew && r1.gold === 10 && !r2.isNew && r2.gold === 0 && SEA.dex(p).sardine.n === 2);
  let bonus = 0; for (const f of SEA.FISH.slice(1, 5)) bonus += SEA.discover(p, f.id, 1).bonus; assert.equal(bonus, 50, 'five different creatures: the first milestone, once');
  assert.equal(SEA.discover(p, 'dolphin', 1).gold, 55, 'a legendary first find pays more');
  SEA.keep(p, SEA.entry('sardine')); SEA.keep(p, SEA.entry('sardine')); SEA.keep(p, SEA.JUNK[0]); assert.equal(SEA.bucketCount(p), 3);
  assert.deepEqual(SEA.sellAll(p), { gold: 7, n: 3 }); assert.equal(p.stats.gold, 7); assert.equal(SEA.bucketCount(p), 0);
});
test('fishing game: cast, wait, bite, reel in the zone; too early or off the zone loses the cast; five casts end it', () => {
  let seed = 9; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647), g = fishGame(rnd, 1);
  const tick = (s) => { for (let t = 0; t < s; t += 0.05) g.update(0.05); };
  assert.equal(g.done(), null); g.click(); assert.equal(g.phase, 'wait'); g.click(); assert.equal(g.phase, 'result'); assert.equal(g.n, 1, 'too early costs the cast'); assert.equal(g.caught.length, 0);
  tick(3); assert.equal(g.phase, 'ready');
  let caught = 0;
  for (let k = 0; k < 4; k++) {
    g.click(); tick(3.5); assert.equal(g.phase, 'bite', 'something bites');
    if (k % 2) { g.marker = (g.zone[0] + g.zone[1]) / 2; g.click(); assert.equal(g.ok, true); caught += 1; } else { g.marker = g.zone[1] + 10; g.click(); assert.equal(g.ok, false); }
    tick(3);
  }
  assert.equal(g.phase, 'end'); assert.equal(g.caught.length, caught); g.update(2);
  const res = g.done(); assert.equal(res.id, 'fish'); assert.equal(res.fish.length, 2); assert.ok(res.gold >= 0 && res.exp > 0);
});

// ---------------------------------------------------------------- the wardrobe (19/11)
import * as WR from '../src/core/wardrobe.js';
import * as STY from '../src/ui/style.js';
import * as SAL from '../src/ui/salon.js';
test('wardrobe: pieces unlock once, wear and take off by slot, perfect customers pay in wearable pieces', () => {
  const p = {}; assert.equal(WR.unlock(p, 'hat', 'pink'), true); assert.equal(WR.unlock(p, 'hat', 'pink'), false); assert.equal(WR.unlock(p, 'tutu', 'pink'), false, 'unknown kind'); assert.equal(WR.unlock(p, 'hat', 'plaid'), false, 'unknown colour');
  WR.unlock(p, 'hat', 'blue'); WR.unlock(p, 'glasses', 'black');
  assert.equal(WR.wear(p, 'hat:pink'), 'hat:pink'); assert.equal(WR.wear(p, 'hat:blue'), 'hat:blue', 'one piece per slot'); assert.equal(WR.wear(p, 'hat:blue'), null, 'again takes it off'); assert.equal(WR.wear(p, 'bag:red'), null, 'not owned');
  assert.equal(WR.itemName('hat:pink'), 'pink hat'); assert.equal(WR.itemName('bow:red'), 'red hair bow');
  for (const [k, v] of Object.entries(WR.KINDS)) { assert.ok(v.en && v.vi && v.icon && WR.SLOTS.some((s) => s.id === v.slot), k); assert.ok(!/[àáảãạăâđêôơư]/i.test(v.en)); }
  assert.deepEqual(WR.fromStyleOrder([{ item: 'hat', color: 'pink' }, { item: 'T-shirt', color: 'red' }, { item: 'shoes', color: 'blue' }]), [{ kind: 'hat', color: 'pink' }, { kind: 'top', color: 'red' }, { kind: 'shoes', color: 'blue' }], 'a T-shirt is a top');
  assert.deepEqual(WR.fromSalonOrder({ style: 'long', hair: 'red', eyes: 'blue', nails: 'pink' }), [{ kind: 'hairstyle', color: 'long' }, { kind: 'haircolor', color: 'red' }, { kind: 'bow', color: 'red' }, { kind: 'headband', color: 'blue' }, { kind: 'bracelet', color: 'pink' }]);
  const q = {}; WR.unlock(q, 'hairstyle', 'curly'); WR.unlock(q, 'top', 'red'); WR.unlock(q, 'dress', 'pink'); assert.equal(WR.unlock(q, 'hairstyle', 'pink'), false, 'a hair style is not a colour'); assert.equal(WR.itemName('hairstyle:curly'), 'curly hair'); assert.equal(WR.itemName('hairstyle:braids'), 'braids');
  WR.wear(q, 'top:red'); WR.wear(q, 'dress:pink'); assert.equal(q.wardrobe.worn.top, null, 'a dress replaces the top'); WR.wear(q, 'top:red'); assert.equal(q.wardrobe.worn.body, null, 'a top replaces the dress');
  // a perfect Style customer: the game result carries the wearable pieces
  const g = STY.styleGame(() => 0.31, 1); for (let n = 0; n < 5; n++) { g.worn = {}; for (const o of g.order) g.worn[o.item] = o.color; g.click(475, 510); }
  g.update(2); const res = g.done(); assert.ok(res && Array.isArray(res.unlock) && res.unlock.every((x) => WR.KINDS[x.kind]), 'style result unlocks pieces');
  const s = SAL.salonGame(() => 0.4, 3); for (let n = 0; n < 5; n++) { const o = s.order; s.look = { style: o.style, hair: o.hair, lips: o.lips || null, eyes: o.eyes || null, nails: o.nails || null }; s.click(475, 510); }
  s.update(2); const r2 = s.done(); assert.ok(r2.unlock.length >= 5 && r2.unlock.some((x) => x.kind === 'bow'), 'salon result unlocks a bow per perfect customer');
});

// ---------------------------------------------------------------- the family ship and the weekly board (19/11)
import * as FAM from '../src/core/family.js';
test('family ship: points from events grow one ship, each child is paid per level, the week rolls, the report counts the week', () => {
  const a = { id: 'a', name: 'An', grade: 6, stats: { gold: 0 }, skills: { vocabulary: { attempts: 10, correct: 7 } }, words: { w1: {} } }, b = { id: 'b', name: 'Bình', grade: 8, stats: { gold: 0 }, skills: {}, words: {} }, admin = { id: 'x', admin: true, stats: { gold: 0 } };
  const store = { profiles: [a, b, admin] }, day = 20000;      // day 20000 is a Wednesday
  assert.equal(FAM.weekOf(20000), FAM.weekOf(20000 - 2), 'Monday and Wednesday share a week'); assert.notEqual(FAM.weekOf(20000), FAM.weekOf(20000 + 5), 'the next Monday starts a new week');
  assert.equal(FAM.addPoints(store, admin, 'kill', day).n, 0, 'the admin never scores'); assert.equal(FAM.addPoints(store, a, 'nonsense', day).n, 0);
  FAM.roll(store, day, store.profiles); a.skills.vocabulary.attempts += 5; a.skills.vocabulary.correct += 4; a.words.w2 = {};
  for (let i = 0; i < 40; i++) FAM.addPoints(store, a, 'right', day); for (let i = 0; i < 20; i++) FAM.addPoints(store, b, 'kill', day);
  assert.equal(FAM.fam(store).pts, 100); assert.equal(FAM.champion(FAM.fam(store).scores, store.profiles), 'a');
  const up = FAM.addPoints(store, b, 'sea_job', day); for (let i = 0; i < 9; i++) FAM.addPoints(store, b, 'sea_job', day);
  assert.ok(FAM.fam(store).pts >= 150 && FAM.shipLevel(FAM.fam(store).pts) === 1, 'level 1 at 150 points'); assert.ok(up.up === 0 || up.up === 1);
  const pa = FAM.pending(store, a); assert.deepEqual(pa.levels, [1]); assert.equal(pa.gold, 40); assert.equal(FAM.claim(store, a).gold, 40); assert.equal(a.stats.gold, 40); assert.equal(FAM.claim(store, a), null, 'paid once'); assert.equal(FAM.pending(store, b).gold, 40, 'the other child is paid too');
  const rep = FAM.weekReport(store, store.profiles); assert.equal(rep.length, 2); const ra = rep.find((r) => r.id === 'a'); assert.equal(ra.tries, 5); assert.equal(ra.right, 4); assert.equal(ra.pct, 80); assert.equal(ra.words, 1);
  assert.equal(FAM.roll(store, day + 7, store.profiles), true, 'a new week'); assert.equal(FAM.fam(store).last.champ, null, 'a tie has no champion (80 points each)'); assert.deepEqual(FAM.fam(store).scores, {});
  assert.equal(FAM.shipLevel(0), 0); assert.equal(FAM.shipLevel(4500), FAM.SHIP.length - 1); assert.equal(FAM.nextNeed(4500), null);
  for (const n of FAM.SHIP_NAMES) assert.ok(n.en && n.vi && !/[àáảãạăâđêôơư]/i.test(n.en));
});

// ---------------------------------------------------------------- the sea pet (19/11)
import * as PET from '../src/core/pet.js';
test('pet: adopt once, hunger falls with time, English questions have one right picture, care pays up to the daily cap, gifts once a day', () => {
  const p = { stats: { gold: 0 } }; assert.equal(PET.adopt(p, 'dragon', 1), null); const pet = PET.adopt(p, 'gull', 100, 0); assert.ok(pet && pet.name === 'Skye'); assert.equal(PET.adopt(p, 'otter', 100), null, 'one pet at a time');
  PET.tick(pet, 60 * 60 * 1000); assert.ok(pet.hunger < 80 && pet.hunger > 60, 'about 12 points an hour'); PET.tick(pet, 40 * 60 * 60 * 1000); assert.equal(pet.hunger, 0); assert.ok(pet.joy < 60, 'a hungry pet is sad');
  assert.equal(PET.goldMul(p), 1, 'no bonus without bond'); let seed = 4; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 80; i++) for (const q of [PET.foodQuestion(rnd), PET.trickQuestion(rnd)]) { assert.equal(q.options.length, 3); assert.equal(new Set(q.options.map((o) => o.id)).size, 3); assert.equal(q.options[q.a].id, q.answer); assert.ok(/[A-Za-z]/.test(q.say) && !/[àáảãạăâđêôơư]/i.test(q.say)); }
  pet.hunger = 50; let paid = 0; for (let i = 0; i < 9; i++) if (PET.feed(p, 100).paid) paid += 1; assert.equal(paid, PET.MAX_CARES, 'only the first care actions of a day raise the bond'); assert.equal(pet.bond, 3 * PET.MAX_CARES); assert.equal(pet.hunger, 100);
  assert.deepEqual(PET.train(p, 'sit', 101), { isNew: true, paid: true }); assert.equal(PET.train(p, 'sit', 101).isNew, false); assert.deepEqual(pet.tricks, ['sit']);
  pet.bond = 90; assert.equal(PET.bondLevel(pet), 3); assert.equal(PET.goldMul(p), 1.12); pet.bond = 5000; assert.equal(PET.goldMul(p), 1.2, 'capped');
  pet.joy = 80; pet.hunger = 60; const g = PET.dailyGift(p, 101); assert.ok(g && g.gold > 8); assert.equal(PET.dailyGift(p, 101), null); assert.ok(PET.dailyGift(p, 102));
  for (const x of [...PET.FOODS, ...PET.TRICKS]) assert.ok(x.en && x.vi && x.icon);
});

// ---------------------------------------------------------------- Treasure Isle and the English treasure maps (19/11)
import * as TRS from '../src/core/treasure.js';
import { MARKS as ISLE_MARKS } from '../src/core/regions/isle.js';
test('Treasure Isle: boat landing and every named place are reachable; the sea closes round the island', async () => {
  const I = (await import('../src/core/regions/isle.js')).default;
  L.setRegion('isle');
  try {
    assert.ok(L.isSea(), 'a sea map'); assert.ok(L.walkable(L.SPAWN.x, L.SPAWN.z, 0.5), 'landing is on the beach'); assert.ok(L.inWater(40, 0) && L.inWater(0, 36) && !L.inWater(0, 2), 'sea all round');
    const ex = L.EXITS[0]; assert.ok(findPath(L.SPAWN.x, L.SPAWN.z, ex.x + 1.8, ex.z), 'the way back to the boat');
    for (const [id, m] of Object.entries(ISLE_MARKS)) { assert.ok(findPath(L.SPAWN.x, L.SPAWN.z, m.x - (m.r + 1.4) * 0.7, m.z + (m.r + 1.4) * 0.7), id + ' can be reached'); assert.ok(!I.walkable(m.x, m.z, 0.2), id + ' is solid'); assert.ok(m.en && m.vi && !/[àáảãạăâđêôơư]/i.test(m.en)); }
  } finally { L.setRegion('forest'); }
});
test('treasure maps: every map for every tier is English, solvable, and leads to a reachable spot; daily maps are stable', async () => {
  L.setRegion('isle');
  try {
    const ok = (x, z) => L.REGIONS.isle.walkable(x, z, 0.8);
    for (const tier of [1, 2, 3]) for (let k = 0; k < 80; k++) {
      let seed = tier * 1000 + k; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647), m = TRS.makeMap(rnd, tier, ISLE_MARKS, ok);
      assert.ok(m, `tier ${tier} map ${k}`); assert.ok(ok(m.goal.x, m.goal.z)); assert.ok(findPath(L.SPAWN.x, L.SPAWN.z, m.goal.x, m.goal.z), `goal ${m.goal.x},${m.goal.z} reachable`);
      assert.ok(m.lines.length >= 2 && m.lines.every((l) => /^[A-Za-z]/.test(l) && !/[àáảãạăâđêôơư]/i.test(l)), m.lines.join(' ')); assert.equal(m.vi.length, m.lines.length);
      assert.ok(TRS.isGoal(m, m.goal.x, m.goal.z) && !TRS.isGoal(m, m.goal.x + 5, m.goal.z)); assert.ok(m.lines.join(' ').endsWith('Dig there!') || m.kind === 'between' || m.kind === 'near');
      if (m.moves) { let x = ISLE_MARKS[m.start].x, z = ISLE_MARKS[m.start].z; for (const mv of m.moves) { x += TRS.DIRS[mv.dir].d[0] * mv.n; z += TRS.DIRS[mv.dir].d[1] * mv.n; assert.ok(m.lines[1].includes(`${TRS.NUM[mv.n]} step`) && m.lines[1].includes(mv.dir)); } assert.ok(Math.hypot(x - m.goal.x, z - m.goal.z) < 1e-6, 'the written steps lead to the goal'); }
    }
    const p = { id: 'k1', stats: { level: 5 } }, m1 = TRS.current(p, 100, 1, ISLE_MARKS, ok), m2 = TRS.current(p, 100, 1, ISLE_MARKS, ok); assert.ok(m1 && m1 === m2, 'same map until it is solved');
    const p2 = { id: 'k1' }; assert.deepEqual(TRS.current(p2, 100, 1, ISLE_MARKS, ok).goal, m1.goal, 'a reload gives the same map');
    TRS.solved(p); const m3 = TRS.current(p, 100, 1, ISLE_MARKS, ok); assert.ok(m3 && m3 !== m1); TRS.solved(p); assert.equal(TRS.current(p, 100, 1, ISLE_MARKS, ok), null, 'two a day'); assert.ok(TRS.current(p, 101, 1, ISLE_MARKS, ok), 'a new day, a new map'); assert.equal(p.treasure.total, 2);
    assert.match(TRS.warmth(2).en, /hot/i); assert.match(TRS.warmth(30).en, /cold/i); assert.deepEqual(TRS.reward(2), { gold: 60, exp: 150 });
  } finally { L.setRegion('forest'); }
});

test('map exams ask the map just finished: level 10 is Unit 2 (the sea), level 20 is Unit 3 (the forest)', async () => {
  const EX = await import('../src/core/exam.js'); assert.deepEqual(EX.EXAM_UNIT, { 10: 2, 20: 3 });
  for (const g of EX.EXAM_GATES) assert.ok(EX.EXAM_UNIT[g], 'every exam gate has a unit');
  for (const grade of [6, 7, 8, 9]) assert.ok(grammarFor(grade, EX.EXAM_UNIT[10], 10).length >= 6, `grade ${grade}: the level-10 exam (Unit 2) has grammar`);      // Unit 3 grammar is not written yet: its exam falls back to words
});

// ---------------------------------------------------------------- creator starters + Mia's tailor shop (19/11)
test('wardrobe: creator starters are free and worn, Mia sells pieces for gold, jewellery has metal and gem colours', () => {
  const p = S.newProfile('Mi', 6);
  WR.starterLook(p, [['hairstyle', 'braids'], ['haircolor', 'black'], ['top', 'yellow'], ['skirt', 'blue']]);
  assert.deepEqual(p.wardrobe.worn, { style: 'hairstyle:braids', haircolor: 'haircolor:black', top: 'top:yellow', bottom: 'skirt:blue', body: null });
  assert.equal(p.wardrobe.owned.length, 4); assert.equal(p.stats.gold, 0, 'starters cost nothing');
  WR.starterLook(p, [['hairstyle', 'long'], ['haircolor', 'black'], ['dress', 'pink']]);
  assert.equal(p.wardrobe.worn.top, null); assert.equal(p.wardrobe.worn.body, 'dress:pink');
  assert.equal(WR.priceOf('necklace:gold'), 300, 'gold doubles the price'); assert.equal(WR.priceOf('necklace:pink'), 150); assert.equal(WR.priceOf('bad:id'), 0);
  assert.deepEqual(WR.buyPiece(p, 'tiara:silver'), { ok: false, why: 'gold', cost: 330 });
  p.stats.gold = 400; const r = WR.buyPiece(p, 'tiara:silver');
  assert.equal(r.ok, true); assert.equal(p.stats.gold, 70); assert.equal(p.wardrobe.worn.head, 'tiara:silver', 'bought pieces are put on');
  assert.equal(WR.buyPiece(p, 'tiara:silver').why, 'owned'); assert.equal(p.stats.gold, 70, 'owned pieces are free again');
  assert.equal(WR.itemName('earrings:blue'), 'blue earrings'); assert.ok(WR.parse('hairclip:gold') && !WR.parse('hairclip:brown'));
});

// ---------------------------------------------------------------- the backbone story (19/11)
import * as SAGA from '../src/core/saga.js';
test('saga: badge and exams give ranks with bonuses, bosses give compass pieces', () => {
  const p = S.newProfile('An', 6);
  assert.equal(SAGA.rankOf(p), 0);
  const atk0 = playerAtk(p), hp0 = S.maxHp(p);
  p.flags.badge1 = true; assert.equal(SAGA.rankOf(p), 1); assert.equal(playerAtk(p), atk0, "apprentice: no bonus yet");
  p.flags.boss1 = true; assert.deepEqual(SAGA.pieces(p), [1], 'the Slime King holds the first piece');
  p.flags.map2 = true; assert.equal(SAGA.rankOf(p), 2); assert.equal(playerAtk(p), atk0 + 4); assert.equal(S.maxHp(p), hp0 + 30);
  p.flags.boss4 = true; p.gates = { 10: true }; assert.equal(SAGA.rankOf(p), 3); assert.deepEqual(SAGA.pieces(p), [1, 2]);
  p.flags.boss2 = true; p.gates[20] = true; assert.equal(SAGA.rankOf(p), 4); assert.deepEqual(SAGA.pieces(p), [1, 2, 3]);
  assert.equal(SAGA.LANDS.length, 10);
  assert.ok(SAGA.nextGoal(p).length > 10);
});

// ---------------------------------------------------------------- magic skills (20/11)
import * as SK from '../src/core/skills.js';
test('skills (21/11): one element, a point per level from level 1, passives + melee/single/aoe, element change, mana', () => {
  const p = S.newProfile('An', 6); p.stats.level = 13; p.stats.gold = 500;
  assert.equal(SK.earned(p), 13); assert.equal(SK.free(p), 13); assert.equal(SK.elOf(p), '');
  assert.equal(SK.EL_IDS.length, 4); for (const el of SK.EL_IDS) assert.equal(SK.TREE[el].filter((n) => n.kind === 'inner').length, 3);
  for (const el of SK.EL_IDS) assert.deepEqual(SK.spellsOf(el).map((n) => n.type), ['melee', 'single', 'aoe', 'ultimate']);
  assert.equal(SK.blocked(p, 'fire_core'), 'chọn hệ trước');
  assert.ok(SK.chooseEl(p, 'fire').ok); assert.equal(SK.elOf(p), 'fire'); assert.equal(SK.blocked(p, 'ice_core'), 'khác hệ', 'only the chosen element');
  const atk0 = playerAtk(p);
  assert.ok(SK.learn(p, 'fire_core')); assert.equal(playerAtk(p), atk0 + 2, 'Fire Heart adds attack');
  assert.ok(SK.learn(p, 'flame_slash')); assert.deepEqual(SK.magic(p).bar, ['flame_slash', null, null, null], 'a new spell goes to the hotbar');
  assert.equal(SK.blocked(p, 'meteor'), 'cần 4 điểm hệ Lửa'); for (let i = 0; i < 2; i++) SK.learn(p, 'fire_core');
  assert.ok(SK.learn(p, 'meteor'), 'the area spell opens after 4 fire points and level 6');
  for (let i = 0; i < 7; i++) SK.learn(p, 'fire_core'); assert.equal(SK.blocked(p, 'fire_core'), 'đã tối đa');
  assert.ok(SK.assign(p, 3, 'flame_slash')); assert.deepEqual(SK.magic(p).bar, [null, 'meteor', null, 'flame_slash'], 'a spell moves between slots');
  assert.ok(!SK.assign(p, 0, 'fire_core'), 'only spells go on the bar');
  // the ring
  assert.equal(SK.elementFactor('fire', 'ice'), 1.5); assert.equal(SK.elementFactor('ice', 'fire'), 0.7); assert.equal(SK.elementFactor('fire', 'thunder'), 1);
  assert.equal(SK.elementFactor('', 'fire'), 1);
  for (const el of SK.EL_IDS) { assert.equal(SK.FEEDS[SK.BEATS[el]], el, 'the beaten element feeds its beater'); assert.ok(SK.comboOf(SK.BEATS[el], el)); }
  assert.equal(SK.comboOf('ice', 'fire').en, 'Steam Burst'); assert.equal(SK.comboOf('fire', 'ice'), null);
  // mana: a level-10 bar holds well over 10 spells and comes back three times as fast out of a fight
  const p10 = S.newProfile('B', 8); p10.stats.level = 10; const max = SK.powers(p10).mpMax; assert.ok(max / SK.spellCost('fireball') >= 15, 'about 16 single spells per bar');
  SK.spend(p10, 60); const a = SK.regen(p10, 1); SK.spend(p10, a - (max - 60)); SK.magic(p10).mp = max - 60; const b = SK.regen(p10, 1, true); assert.ok(b - (max - 60) > 2.5 * (a - (max - 60)));
  assert.ok(SK.spellDamage(p, 'meteor', 100) > 0 && SK.spellDamage(p, 'fireball', 100) > SK.spellDamage(p, 'meteor', 100) * 0.9, 'the single spell hits one monster hard, the area spell many');
  assert.equal(SK.mpOf(p), SK.powers(p).mpMax); assert.ok(SK.spend(p, 40)); assert.ok(!SK.spend(p, 10000)); SK.regen(p, 1000); assert.equal(SK.mpOf(p), SK.powers(p).mpMax);
  p.stats.gold = 2000; p.stats.level = 8; assert.ok(buy(p, 'ember_staff').ok); assert.equal(p.gear.el, 'fire'); assert.equal(p.gear.far, 0.25);
  const before = SK.spellDamage({ ...p, gear: {} }, 'fireball', 100); assert.ok(SK.spellDamage(p, 'fireball', 100) > before, 'a fire staff makes fire spells stronger');
  assert.ok(buy(p, 'ice_amulet').ok); assert.equal(SK.powers(p).resist.fire, 0.15, 'the ice amulet resists FIRE, the element that beats ice (24/11)'); assert.ok(hurt(40, p, 'fire') < hurt(40, { ...p, gear: { ...p.gear, resist: {} } }, 'fire'), 'resistance lowers the hit of that element');
  for (const k of Object.keys(MONSTERS)) assert.ok(SK.ELEMENTS[MONSTERS[k].el], k + ' has an element');
  p.stats.gold = 3000; const r = SK.reset(p); assert.ok(r.ok && r.cost === SK.resetCost({ ...p, stats: { ...p.stats } }) && SK.spent(p) === 0 && SK.elOf(p) === 'fire', 'a reset keeps the element (it costs gold now, 24/11)'); assert.ok(SK.resetCost(p) >= 150);
  // changing element: every point comes back and every change costs gold (24/11)
  SK.learn(p, 'fire_core'); p.stats.gold = 5000; assert.ok(SK.changeCost(p) >= 400); assert.ok(SK.chooseEl(p, 'ice').ok); assert.equal(SK.spent(p), 0); assert.equal(SK.elOf(p), 'ice');
  assert.ok(SK.changeCost(p) >= 400); p.stats.gold = 0; assert.equal(SK.chooseEl(p, 'wind').why, 'gold');
  // an old save with points in two elements keeps the bigger one
  const old = S.newProfile('C', 6); old.stats.level = 20; old.magic = { ranks: { fire_core: 3, ice_core: 5, ice_spear: 1 }, bar: ['ice_spear', 'fireball', null, null], mp: null };
  assert.equal(SK.elOf(old), 'ice'); assert.deepEqual(SK.magic(old).ranks, { ice_core: 5, ice_spear: 1 }); assert.deepEqual(SK.magic(old).bar, ['ice_spear', null, null, null]);
});

import { consumables, setQuick, quick, useItem, useQuick, lootRoll, giveLoot, MONSTERS as MON2, ITEMS as ITM2 } from '../src/core/rules.js';
import * as SK2 from '../src/core/skills.js';
test('potions: buying stacks them, Q ignores them, health and mana potions refill up to the cap, quick slots 5-8 use them', () => {
  const p = S.newProfile('An', 6); p.stats.level = 10; p.stats.gold = 500; const hpMax = S.maxHp(p);
  assert.ok(buy(p, 'hp_s').ok && buy(p, 'hp_s').ok && buy(p, 'mp_s').ok);
  assert.deepEqual(consumables(p).map((c) => [c.id, c.n]), [['hp_s', 2], ['mp_s', 1]]);
  p.stats.hp = 10; assert.equal(eat(p, hpMax), 0, 'Q never drinks a potion');
  assert.ok(setQuick(p, 0, 'hp_s') && setQuick(p, 1, 'mp_s')); assert.ok(setQuick(p, 2, 'hp_s')); assert.deepEqual(quick(p), ['', 'mp_s', 'hp_s', '']);
  const r = useQuick(p, 2, hpMax); assert.ok(r.ok && r.heal === 40 && p.stats.hp === 50 && consumables(p)[0].n === 1);
  p.stats.hp = hpMax; assert.equal(useItem(p, 'hp_s', hpMax).why, 'full'); assert.equal(consumables(p)[0].n, 1, 'nothing is spent at full health');
  SK2.spend(p, 80); const m = useQuick(p, 1, hpMax); assert.ok(m.ok && m.mana === 60 && SK2.mpOf(p) === SK2.powers(p).mpMax - 20);
  assert.equal(useItem(p, 'mp_s', hpMax).why, 'empty');
  assert.equal(setQuick(p, 0, 'iron_sword'), false, 'gear cannot be put in a quick slot');
});
test('loot: only elites and bosses drop, rarely, only unowned rare gear near the hero level, never sold in shops', () => {
  const p = S.newProfile('An', 6); p.stats.level = 12;
  assert.equal(lootRoll(p, { id: 'slime', hp: 30 }, false, () => 0), null, 'plain monsters drop nothing');
  assert.ok(MON2.golem.elite && !MON2.slime.elite);
  const id = lootRoll(p, { id: 'golem' }, false, () => 0.01); assert.ok(id && ITM2[id].rare && ITM2[id].level <= 15);
  assert.equal(lootRoll(p, { id: 'golem' }, false, () => 0.5), null, 'a 5% chance');
  assert.ok(lootRoll(p, { id: 'king', flag: 'boss1', hp: 600 }, true, () => 0.2), 'first boss defeat: 25%');
  assert.equal(lootRoll(p, { id: 'king', flag: 'boss1', hp: 600 }, false, () => 0.2), null, 'after that only 12%');
  assert.ok(giveLoot(p, id) && p.inv.owned.includes(id) && !giveLoot(p, id));
  for (const [k, it] of Object.entries(ITM2)) if (it.rare) assert.ok(!it.seller, k + ' is not sold');
});

import { house as HOUSE, UPGRADES as UPG, upgradeState, buyUpgrade, floorPlan, gardenOf, GROUPS } from '../src/core/house.js';
test('house upgrades: start with one floor, buy in order, level and gold are checked, furniture rooms move up', () => {
  const p = S.newProfile('An', 6); p.stats.level = 25; p.stats.gold = 20000; const g0 = p.stats.gold;
  assert.deepEqual(HOUSE(p), { floors: 1, villa: false, garden: 0 });
  assert.ok(UPG.find((u) => u.id === 'floor2').cost >= 1500 && UPG.find((u) => u.id === 'villa').cost >= 5000, '(21/11) upgrades cost more');
  assert.equal(upgradeState(p, 'floor3').why, 'need', 'the third floor needs the second first');
  assert.equal(upgradeState(p, 'villa').why, 'need');
  assert.ok(buyUpgrade(p, 'floor2').ok && HOUSE(p).floors === 2 && p.stats.gold === g0 - UPG.find((u) => u.id === 'floor2').cost);
  assert.equal(buyUpgrade(p, 'floor2').why, 'have'); assert.ok(buyUpgrade(p, 'floor3').ok && buyUpgrade(p, 'villa').ok && HOUSE(p).villa);
  assert.ok(buyUpgrade(p, 'garden1').ok && buyUpgrade(p, 'garden2').ok); assert.equal(buyUpgrade(p, 'garden2').why, 'have');
  const q = S.newProfile('Bo', 6); q.stats.level = 1; q.stats.gold = 5000; assert.equal(upgradeState(q, 'floor2').why, 'level'); q.stats.level = 8; q.stats.gold = 10; assert.equal(upgradeState(q, 'floor2').why, 'gold');
  assert.equal(floorPlan({ floors: 1 }).length, 1); assert.deepEqual(floorPlan({ floors: 2 })[1], ['', 'bedroom', '', '']); assert.equal(floorPlan({ floors: 3 }).length, 3);
  const all = Object.values(GROUPS).flat(); for (const id of all) assert.ok(ITEMS[id] && ITEMS[id].slot === 'home', id); assert.deepEqual(gardenOf({ garden: 0 }), { veg: 4, flowers: 4, trees: 0, pond: false, arch: false }); assert.equal(gardenOf({ garden: 2 }).pond, true);
});

import { lootCloth, CLOTH_LOOT } from '../src/core/rules.js';
import * as WR2 from '../src/core/wardrobe.js';
import * as L2 from '../src/core/layout.js';
test('cloth loot: only elites and bosses, low chance, always something the wardrobe accepts', () => {
  const p = S.newProfile('An', 6);
  assert.equal(lootCloth(p, { id: 'slime', hp: 30 }, false, () => 0), null);
  assert.ok(lootCloth(p, { id: 'golem' }, false, () => 0.01)); assert.equal(lootCloth(p, { id: 'golem' }, false, () => 0.5), null);
  assert.ok(lootCloth(p, { id: 'king', flag: 'boss1', hp: 600 }, true, () => 0.3)); assert.equal(lootCloth(p, { id: 'king', flag: 'boss1', hp: 600 }, false, () => 0.3), null);
  for (const c of CLOTH_LOOT) assert.ok(WR2.unlock(S.newProfile('Z', 6), c.kind, c.color), c.kind);
  assert.equal(lootCloth(p, { id: 'orc' }, false, () => 0, () => true), null, 'nothing left to win');
});
test('village (24/11): no pond any more; Ben\'s jar market stands by the campfire on walkable ground; Lily\'s stall is gone', async () => {
  L2.setRegion('village');
  try {
    const { BEN_MARKET, STALLS, SOUTH } = await import('../src/core/regions/village.js');
    assert.equal(L2.REGIONS.village.PONDS.length, 0, 'no ponds'); assert.ok(L2.walkable(-3, 52, 0.4), 'the old pond spot is dry land'); assert.ok(!('healer' in STALLS), "Lily's stall is gone");
    for (const [x, z] of [...BEN_MARKET.jars, BEN_MARKET.spot]) assert.ok(L2.walkable(x, z, 0.4), `${x},${z} is walkable (Ben himself stands behind his counter)`);
    assert.ok(Math.hypot(BEN_MARKET.stall[0] - SOUTH.fire[0], BEN_MARKET.stall[1] - SOUTH.fire[1]) < 10, 'the jars are by the campfire');
    assert.ok(L2.walkable(SOUTH.fire[0] + 4, SOUTH.fire[1] - 2, 0.3), 'the camp is reachable');
  } finally { L2.setRegion('village'); }
});

// ---------------------------------------------------------------- 21/11: playtest 5
import { SAFE, inSafe, CHASE, RESPAWN, SPAWNS as SP21 } from '../src/core/rules.js';
import { dotsAlong, simplify } from '../src/core/nav.js';
import { GOODS, addGood, sellable, sellGoods } from '../src/core/goods.js';
import * as FARM from '../src/core/farm.js';
import { freeAt, stairY, stairX, STAIR, FLOOR_H as FH, paintOf, setPlace, placeOf, house as HOUSE2 } from '../src/core/house.js';
import * as PET2 from '../src/core/pet.js';
import { KINDS as WK, baseOf, patOf, parse as wparse, priceOf as wprice } from '../src/core/wardrobe.js';
test('safe places: no monster lives in one; the orchard, the mini games and the shops are safe; chase is slower, respawn later', () => {
  for (const [kind, x, z] of SP21) assert.ok(!inSafe('village', x, z, 1), `${kind} at ${x},${z} spawns outside the safe places`);
  for (const [x, z] of [[40, 11], [36, 0], [45, 18], [-25, -76], [-62, -60], [-61, 68], [-82, 32], [0, 0], [-50, -5]]) assert.ok(inSafe('village', x, z), `${x},${z} is safe`);
  assert.ok(inSafe('harbor', -12, 2) && !inSafe('harbor', 12, 45));
  assert.ok(CHASE < 0.8 && RESPAWN.normal >= 30 && RESPAWN.elite > RESPAWN.normal);
});
test('quest trail: dots every metre or so along the path, the zigzag of the grid removed', () => {
  const path = [{ x: 0, z: 0 }, { x: 1, z: 0 }, { x: 2, z: 0 }, { x: 3, z: 0 }, { x: 3, z: 1 }, { x: 3, z: 2 }];
  assert.equal(simplify(path).length, 3);
  const d = dotsAlong(path, 1, 0.5); assert.ok(d.length === 5 && Math.abs(d[0].x - 0.5) < 1e-9 && Math.abs(d[4].z - 1.5) < 1e-9);
});
test('goods: apples, vegetables, eggs, pigs and fish go into the bag and sell at the shop', () => {
  const p = S.newProfile('An', 6); p.stats.gold = 0;
  addGood(p, 'apple', 5); addGood(p, 'gold_apple', 2); addGood(p, 'nope', 3); p.fish = { carp: 2, sardine: 1, boot: 1 };
  const list = sellable(p); assert.deepEqual(list.map((x) => x.id).sort(), ['apple', 'boot', 'carp', 'gold_apple', 'sardine']);
  assert.equal(sellGoods(p, 'apple').gold, 5 * GOODS.apple.price); assert.equal(p.goods.apple, undefined);
  const r = sellGoods(p); assert.ok(r.n === 6 && p.stats.gold === 5 + r.gold && !sellable(p).length);
});
test('farm: plant, wait, harvest; hens lay eggs; a piglet fed four times grows and sells', () => {
  const p = S.newProfile('An', 6); p.stats.gold = 500; const t0 = 1e12, min = 60000;
  assert.equal(FARM.bedCount(p), 4); assert.ok(FARM.plant(p, 0, 'carrot', t0).ok && p.stats.gold === 498); assert.equal(FARM.plant(p, 0, 'corn', t0).why, 'busy'); assert.equal(FARM.plant(p, 5, 'corn', t0).why, 'none');
  assert.equal(FARM.stageOf(FARM.farm(p).beds[0], t0 + min), 2); assert.equal(FARM.harvest(p, 0, t0 + min).why, 'young');
  const h = FARM.harvest(p, 0, t0 + 3 * min); assert.ok(h.ok && p.goods.carrot === 3 && !FARM.farm(p).beds[0]);
  assert.equal(FARM.eggsReady(p, t0), 0, 'no coop, no eggs'); HOUSE2(p).coop = true; FARM.eggsReady(p, t0); assert.equal(FARM.eggsReady(p, t0 + 9 * min), 3); assert.equal(FARM.collectEggs(p, t0 + 9 * min), 3); assert.equal(p.goods.egg, 3);
  assert.equal(FARM.eggsReady(p, t0 + 999 * min), FARM.EGG_MAX);
  assert.equal(FARM.buyPiglet(p, t0).why, 'pen'); HOUSE2(p).pen = true; assert.ok(FARM.buyPiglet(p, t0).ok);
  let t = t0; for (let i = 0; i < 4; i++) { t += FARM.FEED_GAP * min; assert.ok(FARM.feedPig(p, t).ok); }
  assert.equal(p.goods.carrot, 0, 'the pig ate the carrots first, then gold'); assert.ok(!FARM.pigGrown(FARM.farm(p).pig, t0 + 5 * min));
  assert.ok(FARM.pigGrown(FARM.farm(p).pig, t0 + 30 * min) && FARM.takePig(p, t0 + 30 * min) && p.goods.pig === 1);
});
test('house walking: walls, the doorway, the stairs between floors, colours and saved furniture places', () => {
  const h = { floors: 2 };
  assert.ok(freeAt(h, 0, -4, 3) && freeAt(h, 0, 0, 0.5) && !freeAt(h, 0, 0, 3), 'the middle wall has a doorway');
  assert.ok(freeAt(h, 0, -1, 0) && freeAt(h, 0, -4, 0), '24/11: no low wall across the middle any more');
  assert.ok(!freeAt(h, 0, stairX(0), 0), 'the stair block'); assert.ok(!freeAt(h, 1, stairX(0), 0), 'the stairwell above it'); assert.ok(freeAt(h, 1, stairX(0), -5.1), 'the landing at the top');
  assert.equal(stairY(0, STAIR.z0), 0); assert.equal(stairY(0, STAIR.z1), FH); assert.ok(Math.abs(stairY(1, (STAIR.z0 + STAIR.z1) / 2) - 1.5 * FH) < 1e-9);
  assert.deepEqual(paintOf({}), { wall: 'cream', floor: 'oak' }); assert.deepEqual(paintOf({ paint: { wall: 'mint', floor: 'bad' } }), { wall: 'mint', floor: 'oak' });
  const hh = {}; setPlace(hh, 'sofa', { f: 1, x: 2.123, z: -1, ry: Math.PI / 2 }); assert.deepEqual(placeOf(hh, 'sofa'), { f: 1, x: 2.12, z: -1, ry: 1.571 }); assert.equal(placeOf(hh, 'bed'), null);
});
test('pets: buy puppies and kittens in the village shop, keep several, take one along', () => {
  const p = S.newProfile('An', 6); p.stats.gold = 300;
  assert.equal(PET2.buyPet(p, 'gull').why, 'none', 'sea pets are adopted, not sold');
  assert.ok(PET2.buyPet(p, 'puppy').ok && p.pet.kind === 'puppy' && p.stats.gold === 180); assert.equal(PET2.buyPet(p, 'puppy').why, 'have');
  assert.ok(PET2.buyPet(p, 'kitten').ok && p.pet.kind === 'kitten' && p.pets.puppy); assert.equal(PET2.buyPet(p, 'bunny').why, 'gold');
  assert.deepEqual(PET2.owned(p).sort(), ['kitten', 'puppy']); assert.ok(PET2.switchPet(p, 'puppy') && p.pet.kind === 'puppy' && p.pets.kitten && !p.pets.puppy);
});
test('fashion: printed tops, skirts and dresses wear as their base shape; four new kinds of shoes; English names', () => {
  for (const [k, v] of Object.entries(WK)) if (v.base) { assert.ok(WK[v.base], `${k} has a base`); assert.ok(patOf(k)); assert.equal(WK[v.base].slot === 'top' || WK[v.base].slot === 'bottom' || WK[v.base].slot === 'body', true); }
  assert.equal(baseOf('tee_stripe'), 'top'); assert.equal(baseOf('hoodie'), 'hoodie'); assert.ok(wparse('tee_dots:red') && wprice('tee_dye:blue') > 0);
  for (const k of ['hightops', 'boots', 'sandals', 'flats']) assert.equal(WK[k].slot, 'feet'); assert.ok(!/[ăâđêôơưáàảãạ]/i.test(WK.aodai.en), 'the áo dài has an English name');
});

test('skills (24/11): an ultimate per element, guards resist the element that beats yours, dearer change and reset, the ring works against the hero', async () => {
  const { hurt } = await import('../src/core/rules.js');
  for (const el of SK.EL_IDS) { const u = SK.spellsOf(el)[3]; assert.equal(u.range, 'ult'); assert.ok(u.cost >= 60 && u.cool >= 30 && u.needLevel >= 12, el); }
  const p = S.newProfile('An', 6); p.stats.level = 12; p.stats.gold = 5000; SK.chooseEl(p, 'fire');
  assert.equal(SK.blocked(p, 'inferno'), 'cần 10 điểm hệ Lửa'); for (let i = 0; i < 10; i++) SK.learn(p, 'fire_core'); p.stats.level = 13; assert.equal(SK.blocked(p, 'inferno'), '', 'ultimate opens at level 12 with 10 fire points');
  assert.ok(SK.learn(p, 'inferno')); assert.ok(SK.magic(p).bar.includes('inferno'));
  // Fire Guard resists WIND (the element that beats fire), not fire
  const q = S.newProfile('B', 6); q.stats.level = 10; SK.chooseEl(q, 'fire'); for (let i = 0; i < 5; i++) SK.learn(q, 'fire_guard');
  assert.ok(SK.powers(q).resist.wind > 0.19 && SK.powers(q).resist.wind < 0.21); assert.equal(SK.powers(q).resist.fire, 0);
  assert.equal(SK.NODES.fire_guard.vi, 'Kháng Gió');
  // the ring against the hero: wind beats fire (x1.25 for a fire hero), fire beats ice (x0.8 when a fire hero is hit by ice)
  const r = S.newProfile('C', 6); r.stats.level = 10; SK.chooseEl(r, 'fire');
  assert.equal(SK.incomingFactor(r, 'wind'), 1.25); assert.equal(SK.incomingFactor(r, 'ice'), 0.8); assert.equal(SK.incomingFactor(r, 'thunder'), 1); assert.equal(SK.incomingFactor(r, ''), 1);
  assert.ok(hurt(40, r, 'wind') > hurt(40, r, 'thunder') && hurt(40, r, 'thunder') > hurt(40, r, 'ice'));
  // gear: the flame mail (fire) resists wind
  r.stats.gold = 9000; r.stats.level = 26; assert.ok(buy(r, 'flame_mail').ok); assert.ok(r.gear.resist.wind >= 0.3 && !r.gear.resist.fire);
  // prices: only the first choice is free, a change costs 400 + 80 per level, a reset is free up to level 3 then 150 + 30 per level
  const t = S.newProfile('D', 6); t.stats.level = 10; t.stats.gold = 2000; assert.equal(SK.changeCost(t), 0); SK.chooseEl(t, 'ice'); assert.equal(SK.changeCost(t), 1200);
  assert.ok(SK.chooseEl(t, 'wind').ok && t.stats.gold === 800 && SK.changeCost(t) === 1200, 'every change pays');
  assert.equal(SK.resetCost(t), 450); t.stats.level = 3; assert.equal(SK.resetCost(t), 0);
});

test('voice (24/11): a reading counts when what the recogniser heard is close enough to the word', async () => {
  const V = await import('../src/ui/voice.js');
  assert.equal(V.clean('  Hello, World! '), 'hello world'); assert.equal(V.distance('cat', 'cut'), 1); assert.equal(V.similarity('apple', 'apple'), 1);
  assert.ok(V.heardOk(['apple'], 'apple').ok); assert.ok(V.heardOk(['an apple', 'apple'], 'Apple').ok, 'any alternative may match');
  assert.ok(V.heardOk(['aple'], 'apple').ok, 'a small slip is allowed on a longer word'); assert.ok(!V.heardOk(['table'], 'apple').ok);
  assert.ok(V.heardOk(['ten'], 'ten').ok && !V.heardOk(['tan'], 'ten').ok, 'short words must be exact');
  assert.ok(V.heardOk(['the old man'], 'old man').ok, 'a phrase: every word heard');assert.ok(!V.heardOk([], 'apple').ok);
  assert.ok(V.heardOk(['good morning'], 'good morning').ok && !V.heardOk(['good evening'], 'good morning').ok);
  assert.equal(V.available(), false, 'node has no speech recognition: the old reward flow stays');
});

test('day and night (24/11): noon is bright, midnight is dark, dusk is warm, the lamps are on in the dark', async () => {
  const D = await import('../src/core/daynight.js');
  const noon = D.phaseOf(12), mid = D.phaseOf(0), dawn = D.phaseOf(6.2), dusk = D.phaseOf(17.9), late = D.phaseOf(21);
  assert.ok(noon.day > 0.99 && noon.night < 0.01 && noon.lamps < 0.01 && noon.sun[1] > 0.9, 'noon');
  assert.ok(mid.day < 0.01 && mid.lamps > 0.99, 'midnight is dark with the lamps on'); assert.ok(late.day < 0.01 && late.lamps > 0.9, '21:00 is night');
  assert.ok(dawn.warm > 0.5 && dusk.warm > 0.5 && noon.warm < 0.1, 'the sun is warm when low'); assert.ok(dusk.day > 0.2 && dusk.day < 0.9, 'dusk is in between');
  for (const h of [0, 3, 6, 9, 12, 15, 18, 21, 23.9]) { const p = D.phaseOf(h); assert.ok(Math.abs(Math.hypot(...p.sun) - 1) < 1e-9 && Math.abs(Math.hypot(...p.moon) - 1) < 1e-9 && p.sun[1] > 0 && p.moon[1] > 0, 'unit vectors above the horizon'); }
  assert.equal(D.clockHour(13.5), 13.5); assert.ok(D.clockHour() >= 0 && D.clockHour() < 24); assert.equal(D.phaseOf(25).hour, 1);
});

test('house paint (24/11): the starting colours are free, other colours are paid once, owned colours switch for nothing', async () => {
  const H = await import('../src/core/house.js');
  const p = { stats: { gold: 100, level: 5 } };
  assert.equal(H.paintCost('wall', 'cream'), 0); assert.ok(H.paintCost('wall', 'pink') >= 260 && H.paintCost('floor', 'oak') === 0 && H.paintCost('floor', 'marble') > H.paintCost('floor', 'grey'));
  assert.equal(H.buyPaint(p, 'wall', 'pink').why, 'gold'); assert.equal(p.stats.gold, 100, 'a failed purchase costs nothing');
  p.stats.gold = 2000; const c = H.paintCost('wall', 'pink'); assert.ok(H.buyPaint(p, 'wall', 'pink').ok); assert.equal(p.stats.gold, 2000 - c); assert.equal(H.paintOf(p.house).wall, 'pink');
  assert.ok(H.buyPaint(p, 'wall', 'cream').ok && p.stats.gold === 2000 - c, 'the free colour costs nothing'); assert.ok(H.buyPaint(p, 'wall', 'pink').ok && p.stats.gold === 2000 - c, 'a paid colour switches back for free');
  assert.equal(H.buyPaint(p, 'wall', 'nope').why, 'none'); assert.equal(H.buyPaint(p, 'roof', 'pink').why, 'none');
  const old = { stats: { gold: 5 }, house: { floors: 1, paint: { wall: 'mint' } } }; assert.ok(H.ownsPaint(old.house, 'wall', 'mint'), 'a colour the house already wears stays free');
});
test('homes (24/11): four lots with bigger plots that do not touch each other, the furniture shop or the lane; every bed lies inside its plot', async () => {
  const V = await import('../src/core/regions/village.js'), H = await import('../src/core/house.js'), HG = H, L2 = (await import('../src/core/layout.js')).REGIONS.village;
  assert.equal(V.HOMES.length, 4);
  const box = (h) => ({ x0: h.x + HG.PLOT.x0, x1: h.x + HG.PLOT.x1, z0: h.z - HG.PLOT.z, z1: h.z + HG.PLOT.z });
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const a = box(V.HOMES[i]), b = box(V.HOMES[j]); assert.ok(a.z1 <= b.z0 || b.z1 <= a.z0, `plots ${i} and ${j} overlap`); }
  const F = V.FURNITURE; for (const h of V.HOMES) { const b = box(h); assert.ok(F.x - 4.6 > b.x1 || F.z + 4.6 < b.z0 || F.z - 4.6 > b.z1, 'the furniture shop stands outside the plots'); assert.ok(L2.walkable(h.door[0] + 1.5, h.z, 0.4), `the front door of ${h.z} can be reached`); assert.ok(L2.walkable(-40, h.z, 0.4), 'the lane passes the gate'); }
  assert.ok(L2.walkable(F.door[0] + 0.9, F.door[1], 0.4), 'the furniture shop door can be reached');
  for (const tier of [0, 1, 2]) { const g = H.gardenOf({ garden: tier }); for (let i = 0; i < g.veg; i++) { const [dx, dz] = H.bedOffset(i); assert.ok(dx > HG.PLOT.x0 + 1 && dx < HG.PLOT.x1 - 1 && Math.abs(dz) < HG.PLOT.z - 0.4 && Math.abs(dz) > 4.4, `bed ${i} of tier ${tier} is inside the plot, outside the house`); } for (let i = 0; i < g.flowers; i++) { const [dx, dz] = H.flowerOffset(i); assert.ok(dx > HG.PLOT.x0 && dx < HG.PLOT.x1 - 1 && dz > 4.4 && dz < HG.PLOT.z - 0.4); } }
  assert.ok(H.gardenOf({ garden: 2 }).veg >= 12, 'a big garden holds a dozen vegetable beds for income');
  assert.ok(H.FLOOR_H >= 3 * 3.7 - 1e-9 && H.PARTITION_H <= 3.4, 'the ceiling is three times higher, the partitions are not taller than before');
});
test('world (24/11): ten maps, roads between them, what a road needs, portals and where they stand', async () => {
  const W = await import('../src/core/world.js'), V = await import('../src/core/regions/village.js');
  assert.equal(W.MAPS.length, 10); assert.deepEqual(W.MAPS.map((m) => m.no), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(W.mapNo('village'), 1); assert.equal(W.mapNo('harbor'), 2); assert.equal(W.mapNo('forest'), 3); assert.equal(S.MAP_NO.harbor, W.mapNo('harbor')); assert.equal(S.MAP_NO.forest, W.mapNo('forest'));
  assert.deepEqual(W.MAPS.filter((m) => m.built).map((m) => m.id), ['village', 'harbor', 'forest']);
  for (const r of W.ROADS) { assert.ok(W.mapById(r.a) && W.mapById(r.b), 'both ends exist'); }
  assert.deepEqual(W.neighbours('mountain').sort(), ['desert', 'ruins', 'sky', 'volcano'].sort(), 'the mountains are the crossroads of the plan');
  const p = { flags: {}, stats: { level: 3 }, gates: {} };
  assert.equal(W.canGo(p, 'village', 'forest').ok, false); assert.ok(W.canGo(p, 'village', 'forest').missing.length);
  p.flags.forest_open = true; assert.equal(W.canGo(p, 'village', 'forest').ok, false, "Tom's badge is not enough: the forest needs level 10 and the owl's exam (24/11)");
  p.stats.level = 10; p.gates[10] = true; assert.ok(W.canGo(p, 'village', 'forest').ok && W.canGo(p, 'forest', 'village').ok, 'a road works both ways');
  assert.equal(W.canGo(p, 'village', 'harbor').ok, false, 'the sea needs the Slime King and level 5 with the owl review'); p.flags.boss1 = true; p.gates[5] = true; assert.ok(W.canGo(p, 'village', 'harbor').ok);
  assert.equal(W.canGo(p, 'forest', 'desert').ok, false, 'maps not built yet stay closed'); assert.equal(W.canGo(p, 'village', 'desert').missing[0], 'Không có đường nối.');
  assert.ok(W.canGo({ admin: true, flags: {} }, 'village', 'harbor').ok && !W.canGo({ admin: true, flags: {} }, 'forest', 'desert').ok, 'the admin goes anywhere built, not into maps that do not exist');
  const gate = W.portalsOf('village')[0]; assert.deepEqual(gate.routes, ['forest', 'harbor'], 'two roads from the village gate: the child chooses');
  assert.equal(W.portalAt('village', gate.x, gate.z + 1), gate); assert.equal(W.portalAt('village', 0, 0), null);
  for (const region of ['village', 'forest', 'harbor']) for (const pt of W.portalsOf(region)) { const R = (await import('../src/core/layout.js')).REGIONS[region]; assert.ok(R.walkable(pt.x, pt.z, 0.4), `${region} portal stands on walkable ground`); for (const to of pt.routes) assert.ok(W.roadBetween(region, to), `${region} -> ${to} is a road`); }
  assert.deepEqual(W.routesOf(p, 'village', gate).map((r) => [r.to, r.ok]), [['forest', true], ['harbor', true]]);
  assert.deepEqual(W.MAPS.slice(0, 3).map((m) => m.lv), [[1, 5], [5, 10], [10, 20]], 'the level ranges of the world map picture');
});

test('outer ring cottages (harbour, forest): on dry land, apart from each other, solid, and the race places stay reachable', async () => {
  const { OUTER } = await import('../src/core/regions/outer.js'); const SITES = { harbor: [-65, 40], forest: [-81, 20] };
  for (const [name, list] of Object.entries(OUTER)) {
    const R = L.REGIONS[name]; assert.ok(list.length >= 8, name + ' has its new cottages');
    list.forEach((b, i) => {
      assert.ok(!R.inWater(b.x, b.z) && R.groundHeight(b.x, b.z) > 0.2, `${name} cottage ${i} is on dry land`);
      assert.ok(Math.hypot(b.x, b.z) < R.PLAY_RADIUS, `${name} cottage ${i} is inside the play radius`);
      assert.ok(!R.walkable(b.x, b.z, 0.3), `${name} cottage ${i} is solid`);
      for (const o of list.slice(i + 1)) assert.ok(Math.hypot(b.x - o.x, b.z - o.z) > 12, `${name} cottages ${i} apart`);
      { const s = { x: SITES[name][0], z: SITES[name][1] }; assert.ok(Math.hypot(b.x - s.x, b.z - s.z) > 9, `${name} cottage ${i} is not on a mini game place`); }
    });
  }
});

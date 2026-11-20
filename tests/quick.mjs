// Quick browser checks (3–5 min) for small changes: node tests/quick.mjs [--only boot,combat,owl,arcade,unit,forest]
// Each group sets up the state it needs through the debug API, so groups run on their own. The full story
// (Chapter I, bridge, forest quest, reload) stays in tests/e2e.mjs, run once per batch of changes.
import { serve, open } from './shot.mjs';
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null;
let failed = 0;
const check = (ok, name) => { if (!ok) failed++; console.log((ok ? 'PASS: ' : 'FAIL: ') + name); };
const { server, url } = await serve(); const { browser, page, logs } = await open(url);
const ev = (f, a) => page.evaluate(f, a), wait = (ms) => page.waitForTimeout(ms);
const answerGate = async () => {          // the three words asked before Candy Match and the Kart Race (18/11)
  for (let k = 0; k < 40 && await page.isVisible('#dialog') && !(await page.evaluate(() => __eq.arcade.open)); k++) {
    if (await page.isVisible('#dialog .opts')) {
      const i = await page.evaluate(() => { const en = document.querySelector('#dialog .en').textContent, m = /What does "(.+)" mean/.exec(en), cards = [...__eq.chests.api.cards(), ...Object.keys(__eq.profile.words).map(__eq.cardOf).filter(Boolean)]; return __eq.ui.options.indexOf(cards.find((x) => x.word === m[1]).vi); });
      await page.keyboard.press('Digit' + (i + 1)); await new Promise((r) => setTimeout(r, 260));
    } else { await page.keyboard.press('KeyE'); await new Promise((r) => setTimeout(r, 220)); }
  }
};
const passCards = async () => { for (let k = 0; k < 8 && await page.isVisible('#dialog .card-w'); k++) { await page.keyboard.press('KeyE'); await wait(220); } };   // "new word" cards come before a question
const closeDialogs = async () => { for (let k = 0; k < 14 && await page.isVisible('#dialog'); k++) { await page.keyboard.press('KeyE'); await wait(180); } };
const run = async (name, fn) => { if (only && !only.includes(name)) return; const t = Date.now(); await fn(); console.log(`  [${name}] ${((Date.now() - t) / 1000).toFixed(0)} s`); };

await page.click('#mnew'); await page.fill('#mname', 'Quick'); await page.click('[data-g="8"]'); await page.click('#mgo');
await page.waitForFunction(() => __eq.started, null, { timeout: 90000 });
await ev(() => { const p = __eq.profile; p.flags.forest_open = true; p.flags.bridge_fixed = true; p.stats.hp = 9999; __eq.wild.mobs.forEach((m) => { if (!m.boss) { m.dead = 999; m.g.visible = false; } }); __eq.refresh(); });

await run('boot', async () => {
  check(await ev(() => __eq.errors.length === 0 && __eq.region === 'village'), 'Boot: no script errors, grade 8 profile in the village');
  check(!(await page.isVisible('#gu')) && await page.isVisible('#gopen'), 'Settings folded into a ⚙ button');
  await page.click('#gopen'); check(await page.isVisible('#gu'), 'The ⚙ panel has the parent Unit picker'); await page.click('#gclose');
  const k0 = await ev(() => { __eq.teleport(0, 12); return { x: __eq.player.pos.x, z: __eq.player.pos.z }; }); await wait(400);
  await ev(() => { for (let i = 0; i < 30; i++) setTimeout(() => { dispatchEvent(new KeyboardEvent('keydown', { key: 'ư' })); dispatchEvent(new KeyboardEvent('keyup', { key: 'ư' })); }, i * 40); }); await wait(3000);
  check(await ev((k) => Math.hypot(__eq.player.pos.x - k.x, __eq.player.pos.z - k.z) > 0.8, k0), 'Vietnamese input method on: "ư" from the W key still walks');
  check(await ev(() => __eq.friends.every((f) => f.npc.actions.Idle && f.npc.actions.Talk)), 'Lily, Rose and Anna play Ngọc\'s shared clips (K3)');
  await ev(() => { const a = __eq.friends.find((f) => f.who === 'Anna').npc; __eq.teleport(a.x + 1.5, a.z + 1.5); }); await wait(1200);
  check(await ev(() => { const a = __eq.friends.find((f) => f.who === 'Anna').npc; let moved = false; a.root.traverse((o) => { if (o.isBone && /spine|chest/i.test(o.name) && Math.abs(o.quaternion.x) + Math.abs(o.quaternion.z) > 1e-4) moved = true; }); return moved; }), 'Anna\'s bones move (idle animation runs)');
});

await run('combat', async () => {
  await ev(() => { __eq.profile.stats.level = 7; }); await wait(400);
  check(await ev(() => !__eq.wild.bosses[0].g.visible), 'Slime King sleeps below level 8');
  await ev(() => { __eq.profile.stats.level = 8; }); await wait(400);
  check(await ev(() => __eq.wild.bosses[0].g.visible && !__eq.wild.bosses[1].g.visible), 'Level 8: Slime King awake, Ancient Golem still asleep');
  await ev(() => { __eq.profile.stats.level = 18; }); await wait(400);
  check(await ev(() => __eq.wild.bosses[1].g.visible), 'Level 18: the Ancient Golem appears in the golem fields');
  await ev(() => { const m = __eq.wild.bosses[1]; m.hp = m.def.hp * 0.76; __eq.wild.cool = 0; __eq.teleport(m.x, m.z - 2.8); __eq.player.yaw = 0; __eq.profile.stats.hp = 9999; }); await wait(250);
  await page.keyboard.press('KeyJ'); await wait(400);
  check(await ev(() => __eq.wild.bosses[1].shieldOn), 'The golem raises a word shield too');
  await ev(() => { const m = __eq.wild.bosses[1]; __eq.teleport(m.x, m.z - 2.8); }); await wait(300);
  check((await page.textContent('#prompt')).includes('Golem Cổ'), 'Prompt names the Ancient Golem');
  await page.keyboard.press('KeyE'); await wait(350); await passCards();
  const qi = await ev(() => { const vi = document.querySelector('#dialog .vi').textContent; const card = __eq.chests.api.cards().find((c) => vi.includes('"' + c.vi + '"')); return __eq.ui.options.indexOf(card.word); });
  check((await page.textContent('#dialog')).includes('Ancient Golem'), 'The shield question is asked by the golem');
  await page.keyboard.press('Digit' + (qi + 1)); await wait(400);
  check(await ev(() => !__eq.wild.bosses[1].shieldOn && __eq.wild.bosses[1].broken === 1), 'Right word breaks the golem shield');
  await ev(() => { const m = __eq.wild.bosses[1]; m.broken = 3; m.hp = 3; __eq.wild.cool = 0; __eq.teleport(m.x, m.z - 2.8); __eq.player.yaw = 0; }); await wait(250);
  await page.keyboard.press('KeyJ'); await wait(500);
  check(await ev(() => __eq.profile.flags.boss2 && !__eq.profile.flags.map2) && (await page.textContent('#dialog')).includes('Ancient Golem'), 'Golem beaten at level 18: flag saved, Map 2 still closed');
  await closeDialogs();
  await ev(() => { __eq.profile.stats.level = 20; __eq.profile.gates = { 5: true, 10: true, 15: true, 20: true }; __eq.refresh(); }); await wait(300);
  check(await ev(() => __eq.profile.flags.map2) && (await page.textContent('#dialog')).includes('Map 2'), 'Level 20 with the golem beaten: Map 2 opens');
  await closeDialogs(); await wait(800);
  check(await ev(() => __eq.chests.api.cards().every((c) => c.id.startsWith('g8_u02:')) && __eq.chests.api.cards().length > 0), 'Words now come from Unit 2');
  // (20/11) magic skills: T opens the skill book, a learnt spell goes to slot 1, key 1 casts it on a slime (energy spent, element ring)
  await ev(() => { delete __eq.profile.flags.boss2; __eq.profile.flags.map2 = false; }); await closeDialogs();
  await page.keyboard.press('KeyT'); await wait(400);
  check(await page.isVisible('#skillbook') && (await page.textContent('#skillbook')).includes('Fire Heart'), 'T opens the skill book with the four elements');
  await page.click('#skillbook [data-a="learn"][data-v="flame_slash"]'); await wait(300);
  check(await ev(() => __eq.profile.magic.ranks.flame_slash === 1 && __eq.profile.magic.bar[0] === 'flame_slash'), 'Learning Flame Slash puts it in slot 1');
  await page.keyboard.press('Escape'); await wait(300);
  const sl = await ev(() => { const W = __eq.wild, m = W.mobs.find((x) => x.kind === 'slime'); m.dead = 0; m.g.visible = true; m.hp = m.def.hp; m.x = m.home.x; m.z = m.home.z; __eq.teleport(m.x, m.z - 1.6); __eq.player.yaw = 0; m.stun = 3; return { i: W.mobs.indexOf(m), hp: m.hp }; }); await wait(600);
  const mp0 = await ev(() => __eq.profile.magic.mp);
  await page.keyboard.press('Digit1'); await wait(500);
  check(await ev((s) => { const m = __eq.wild.mobs[s.i]; return m.dead || m.hp < s.hp; }, sl) && await ev((v) => __eq.profile.magic.mp < v, mp0), 'Key 1 casts Flame Slash: the slime is hurt, energy is spent');
  check(await ev((s) => { const m = __eq.wild.mobs[s.i]; return m.dead || (m.burn && m.mark && m.mark.el === 'fire'); }, sl), 'The slime burns and carries the fire mark');
});

await run('unit', async () => {
  if (!(await page.isVisible('#gu'))) await page.click('#gopen');
  await ev(() => { const s = document.getElementById('gu'); s.value = '3'; s.dispatchEvent(new Event('change')); }); await wait(1200);
  check(await ev(() => __eq.profile.unitPick === 3 && __eq.chests.api.cards().every((c) => c.id.startsWith('g8_u03:'))), 'Parent picks Unit 3: words follow');
  await ev(() => { const s = document.getElementById('gu'); s.value = '0'; s.dispatchEvent(new Event('change')); }); await wait(1200);
  check(await ev(() => !__eq.profile.unitPick), '"Theo map" clears the pick');
  await page.click('#gclose');
});

await run('owl', async () => {
  await ev(() => { const p = __eq.profile; delete p.unitPick; p.flags.map2 = false; p.stats.level = 10; p.gates = { 5: true }; }); await ev(() => __eq.refresh());
  await closeDialogs(); await wait(1000);
  await ev(() => __eq.teleport(2.9, 15.6)); await wait(450);
  await page.keyboard.press('KeyE'); await wait(250);
  check((await page.textContent('#dialog')).includes('ngữ pháp'), 'Gate 10 announces grammar questions');
  await page.keyboard.press('KeyE'); await wait(300);
  let grammar = 0;
  for (let n = 0; n < 7; n++) {
    await passCards();
    const pick = await ev(async () => {
      const en = document.querySelector('#dialog .en').textContent, vi = ((document.querySelector('#dialog .vi') || {}).textContent || '').trim(), cards = [...__eq.chests.api.cards(), ...Object.keys(__eq.profile.words).map(__eq.cardOf).filter(Boolean)], m = /"(.+)" mean/.exec(en);
      if (en.includes('___')) { const G = await import('./src/core/grammar.js'); const g = G.GRAMMAR.g8_u01.find((x) => x.q === en); return { i: __eq.ui.options.indexOf(g.options[g.a]), g: 1 }; }
      if (m) return { i: __eq.ui.options.indexOf(cards.find((x) => x.word === m[1]).vi), g: 0 };
      return { i: __eq.ui.options.indexOf(cards.find((x) => x.vi === vi).word), g: 0 };
    });
    grammar += pick.g; await page.keyboard.press('Digit' + (pick.i + 1)); await wait(300);
  }
  check(grammar === 2, 'Two grammar questions (Unit 1 grade 8: verb + V-ing)');
  check(await ev(() => __eq.profile.gates[10] && __eq.profile.stats.level >= 10 && __eq.profile.skills.grammar.attempts === 2) && (await page.textContent('#dialog')).includes('Wonderful'), '7 of 7: gate 10 passes, grammar counted');
  await closeDialogs();
});

await run('exam', async () => {        // map exam at level 20: 10 questions, 8 to pass, failed paper is studied again, next paper differs
  await ev(() => { const p = __eq.profile; delete p.unitPick; p.flags.map2 = false; p.exam = undefined; p.stats.level = 20; p.stats.exp = 0; p.gates = { 5: true, 10: true, 15: true }; }); await ev(() => __eq.refresh());
  await closeDialogs(); await wait(800);
  const right = () => ev(async () => {          // index of the right option for the question on screen
    const en = document.querySelector('#dialog .en').textContent, vi = ((document.querySelector('#dialog .vi') || {}).textContent || '').trim(), opts = __eq.ui.options;
    const cards = [...__eq.cardsOfUnit(1), ...__eq.chests.api.cards(), ...Object.keys(__eq.profile.words).map(__eq.cardOf).filter(Boolean)], G = await import('./src/core/grammar.js'), list = G.GRAMMAR['g' + __eq.profile.grade + '_u01'] || [];      // the level 20 exam asks Unit 1 (the map just finished) even after Map 2 opened
    if (en.includes('___')) { const g = list.find((x) => x.q === en); return { i: opts.indexOf(g.options[g.a]), n: opts.length }; }
    if (en.startsWith('Which sentence')) { const g = list.find((x) => opts.includes(x.q.replace('___', x.options[x.a]))); if (!g) throw new Error('no grammar item matches the sentence options: ' + JSON.stringify({ opts, unit: __eq.profile.unitPick, map2: __eq.profile.flags.map2, grade: __eq.profile.grade, n: list.length })); return { i: opts.indexOf(g.q.replace('___', g.options[g.a])), n: opts.length }; }
    const m = /What does "(.+)" mean/.exec(en);
    if (m) return { i: opts.indexOf(cards.find((x) => x.word === m[1]).vi), n: opts.length };
    return { i: opts.indexOf(cards.find((x) => x.vi === vi).word), n: opts.length };
  });
  const askOwl = async () => { await ev(() => __eq.teleport(2.9, 15.6)); await wait(450); await page.keyboard.press('KeyE'); await wait(250); };
  const sit = async (wrongOn) => {          // answers the ten questions; wrongOn = how many to get wrong
    let done = 0;
    for (let n = 0; n < 10; n++) {
      const before = await ev(() => { const e = document.querySelector('#dialog .en'); return e ? e.textContent : ''; }), r = await right(); const pick = n < wrongOn ? (r.i + 1) % r.n : r.i; await page.keyboard.press('Digit' + (pick + 1));
      await page.waitForFunction((b) => { const e = document.querySelector('#dialog .en'); return !e || e.textContent !== b; }, before, { timeout: 20000 }).catch(() => {}); await wait(150); done += 1;      // wait for the next question to be on screen (a slow machine used to answer the old options)
    }
    return done;
  };
  await askOwl();
  check((await page.textContent('#dialog')).includes('8/10') && (await page.textContent('#dialog')).includes('khác nhau'), 'Level 20 gate announces the exam: 8 of 10, a different paper each time');
  await page.keyboard.press('KeyE'); await wait(300);
  const first = await ev(() => __eq.ui.options.length);
  await sit(3);          // 7 of 10
  check((await page.textContent('#dialog')).includes('7 of 10') && await ev(() => !__eq.profile.gates[20] && __eq.profile.exam.tries === 1), '7 of 10 fails: the gate stays shut, the try is counted');
  let redone = 0;          // the study screens, then every missed question again until it is right
  for (let n = 0; n < 60 && await page.isVisible('#dialog'); n++) {
    if (await page.isVisible('#dialog .opts')) { const r = await right(); await page.keyboard.press('Digit' + (r.i + 1)); redone += 1; await wait(250); }
    else { await page.keyboard.press('KeyE'); await wait(200); }
  }
  check(redone === 3, 'The three missed questions are asked again (' + redone + ')');
  check(await ev(() => !__eq.profile.gates[20]), 'Studying the missed questions again does not open the gate by itself');
  await closeDialogs();
  const last1 = await ev(() => [...__eq.profile.exam.last]);
  await askOwl(); await wait(400); await page.keyboard.press('KeyE'); await wait(500);
  await sit(0);          // 10 of 10 on a new paper
  const last2 = await ev(() => [...__eq.profile.exam.last].slice(0, 10));
  check((await page.textContent('#dialog')).includes('Wonderful') && await ev(() => __eq.profile.gates[20] && __eq.profile.exam.passed && __eq.profile.exam.tries === 2), '10 of 10 on the second paper opens the gate');
  check(last2.join() !== last1.slice(0, 10).join(), 'The second paper is a different set of questions');
  await closeDialogs();
});

await run('arcade', async () => {
  await ev(() => { __eq.profile.plays = undefined; }); const g0 = await ev(() => __eq.profile.stats.gold);
  const paid = [];
  for (let n = 0; n < 4; n++) {
    await ev(() => __eq.teleport(10.6, 28.6)); await wait(400); await page.keyboard.press('KeyE'); await wait(500); await answerGate(); await wait(400);
    const before = await ev(() => __eq.profile.stats.gold);
    await ev(() => { __eq.arcade.game.coins = 10; __eq.arcade.game.time = 0; }); await page.waitForFunction(() => !__eq.arcade.open, null, { timeout: 60000 });
    paid.push((await ev(() => __eq.profile.stats.gold)) - before); await wait(200);
    if (n === 3) check((await page.textContent('#dialog')).includes('20%'), 'Fourth race of the day says the pay is lower');
    await closeDialogs();
  }
  check(paid[0] > 0 && paid[0] === paid[2] && paid[3] < paid[0] && paid[3] >= 1, `Cart race pays in full three times, then less (${paid.join(', ')}; start ${g0})`);
});

await run('map2', async () => {        // the forest is the last chapter of Map 1 (19/11): its monsters, board, chests, bubbles and Queen need the forest gate, not Map 2
  await ev(() => { const p = __eq.profile; p.flags.forest_open = true; delete p.flags.boss2; p.flags.map2 = false; __eq.enterRegion('forest'); });      // boss2 is cleared too: an earlier group may have beaten the Golem, and refresh() would reopen Map 2 await page.waitForFunction(() => __eq.region === 'forest' && __eq.started, null, { timeout: 120000 }); await wait(600);
  check(await ev(() => !__eq.profile.flags.map2), 'The forest chapter is played before Map 2 opens');
  await ev(() => { __eq.profile.stats.level = 3; __eq.wild.mobs.forEach((m) => { if (m.region === 'forest') m.dead = 0; }); }); await wait(700);
  check(await ev(() => __eq.wild.mobs.filter((m) => m.g.visible).length === 0), 'The crystal quest is not done: the forest is quiet for a young hero');
  await ev(() => { const p = __eq.profile; p.quests.forest = p.quests.forest || {}; p.quests.forest.step = 'done'; p.stats.level = 12; p.stats.hp = 9999; }); await wait(900);
  check(await ev(() => __eq.wild.mobs.filter((m) => m.g.visible).every((m) => m.region === 'forest') && __eq.wild.mobs.filter((m) => m.g.visible).length === 19), 'Forest chapter of Map 1: 19 monsters (bats, mushrooms, orcs, wisps, foxes) before Map 2, none from the meadow ' + await ev(() => __eq.wild.mobs.filter((m) => m.g.visible).map((m) => m.kind).join(',')));
  const r = await ev(() => { const w = __eq.wild, m = w.mobs.find((m) => m.kind === 'bat' && !m.dead), e0 = __eq.profile.stats.exp, l0 = __eq.profile.stats.level; w.kill(m, __eq.profile); return { exp: __eq.profile.stats.exp !== e0 || __eq.profile.stats.level !== l0, dead: m.dead > 0 }; });
  check(r.exp && r.dead, 'Defeating a Shadow Bat pays EXP');
  await closeDialogs();
  await ev(() => { __eq.teleport(-32.4, 46.6); __eq.wild.mobs.forEach((m) => { if (!m.boss) { m.dead = 999; m.g.visible = false; } }); }); await wait(500);
  check((await page.textContent('#prompt')).includes('Bảng nhiệm vụ'), 'Forest quest board by the entrance path');
  await page.keyboard.press('KeyE'); await wait(400);
  check(/bats/i.test(await page.textContent('#dialog .en')), 'The forest board asks for Shadow Bats in English');
  await closeDialogs();
  check(await ev(() => __eq.profile.hunt2 && __eq.profile.hunt2.active && !(__eq.profile.hunt && __eq.profile.hunt.active && __eq.profile.hunt.i > 99)), 'Forest hunt accepted (its own record)');
  check(await ev(() => __eq.chests.list.filter((c) => c.region === 'forest').every((c) => c.g.visible) && __eq.chests.list.filter((c) => c.region === 'village').every((c) => !c.g.visible)), 'Five word chests in the forest');
  check(await ev(() => __eq.spots.list.filter((s) => s.region === 'forest' && s.sp.visible).length === 10), 'Ten word bubbles along the forest paths');
  check(await ev(() => !__eq.wild.bosses[2].g.visible), 'Mushroom Queen sleeps below level 16');
  await ev(() => { __eq.profile.stats.level = 16; }); await wait(800);
  check(await ev(() => __eq.wild.bosses[2].g.visible && __eq.wild.markers().some((m) => m.text === '♛')), 'Level 16: the Mushroom Queen wakes in the west glade');
  await ev(() => __eq.enterRegion('village')); await page.waitForFunction(() => __eq.region === 'village' && __eq.started, null, { timeout: 120000 }); await wait(600);
  check(await ev(() => __eq.wild.mobs.filter((m) => m.g.visible).every((m) => m.region === 'village')), 'Back in the village: only meadow monsters');
  await closeDialogs();
});

await run('harbor', async () => {        // Map 2 in Sunny Harbor: sea monsters, Captain Octopus, board, chests, bubbles and the two new shop games (18/11)
  await closeDialogs();
  await ev(() => { const p = __eq.profile; p.flags.map2 = true; p.stats.level = 27; p.stats.hp = 9999; p.god = true; __eq.enterRegion('harbor'); });
  await page.waitForFunction(() => __eq.region === 'harbor' && __eq.started, null, { timeout: 180000 }); await wait(1000);
  const vis = await ev(() => __eq.wild.mobs.filter((m) => m.g.visible).map((m) => m.kind));
  check(vis.length === 17 && vis.every((k) => ['crab', 'jelly', 'pirate', 'gull'].includes(k)), `Harbor at level 27: 17 sea monsters (with the storm gulls), no boss yet, none from the other maps (${vis.length})`);
  check(await ev(() => __eq.wild.mobs.filter((m) => m.region === 'harbor' && m.mixer).length === 18), 'The Blender monsters and the octopus carry their own Idle/Walk clips');
  await ev(() => { __eq.profile.stats.level = 28; }); await wait(900);
  check(await ev(() => __eq.wild.bosses[3].g.visible && __eq.wild.markers().some((m) => m.text === '♛')), 'Level 28: Captain Octopus rises by the lighthouse');
  check(await ev(() => __eq.chests.list.filter((c) => c.region === 'harbor' && c.g.visible).length === 6 && __eq.chests.list.filter((c) => c.region !== 'harbor').every((c) => !c.g.visible)), 'Six word chests in the harbor');
  check(await ev(() => __eq.spots.list.filter((s) => s.region === 'harbor' && s.sp.visible).length === 10), 'Ten word bubbles in the harbor');
  await ev(() => { __eq.wild.mobs.forEach((m) => { if (!m.boss) { m.dead = 999; m.g.visible = false; } }); __eq.teleport(-2, -0.2); }); await wait(600);
  check((await page.textContent('#prompt')).includes('Bảng nhiệm vụ'), 'Harbor quest board beside the square');
  await page.keyboard.press('KeyE'); await wait(400);
  check(/crabs/i.test(await page.textContent('#dialog .en')), 'The harbor board asks for crabs in English');
  await closeDialogs();
  check(await ev(() => !!(__eq.profile.hunt3 && __eq.profile.hunt3.active)), 'Harbor hunt accepted (its own record)');
  check(await ev(() => { const w = __eq.wild, m = w.mobs.find((m) => m.kind === 'crab'); m.dead = 0; w.kill(m, __eq.profile); return __eq.profile.hunt3.got === 1 && !(__eq.profile.hunt && __eq.profile.hunt.got); }), 'A defeated crab counts for the harbor hunt only');
  await closeDialogs();
  await ev(() => __eq.teleport(-24.4, 14)); await wait(600);
  check((await page.textContent('#prompt')).includes('Café'), 'Seaside Café door has its prompt');
  await page.keyboard.press('KeyE'); await wait(500);
  check(await ev(() => __eq.arcade.open && __eq.arcade.game.title.includes('Café')), 'E at the café door starts the cooking game');
  await page.keyboard.press('Escape'); await wait(300);
  await ev(() => __eq.teleport(-12, -18.4)); await wait(600);
  check((await page.textContent('#prompt')).includes('Salon'), 'Beauty Salon door has its prompt');
  await page.keyboard.press('KeyE'); await wait(500);
  check(await ev(() => __eq.arcade.open && __eq.arcade.game.title.includes('Salon')), 'E at the salon door starts the beauty game');
  await page.keyboard.press('Escape'); await wait(300);
  check(await ev(() => __eq.errors.length === 0), 'Harbor: no script errors');
  await ev(() => __eq.enterRegion('village')); await page.waitForFunction(() => __eq.region === 'village' && __eq.started, null, { timeout: 120000 }); await wait(600);
  check(await ev(() => __eq.wild.mobs.filter((m) => m.g.visible).every((m) => m.region === 'village')), 'Back in the village: the sea monsters are gone');
  await closeDialogs();
});

await run('extras', async () => {        // the sea extras (19/11): fishing, Sea Dex, fish market, wardrobe, family ship, pet
  await closeDialogs();
  await ev(() => { const p = __eq.profile; p.flags.map2 = true; p.stats.level = 22; p.stats.hp = 9999; p.god = true; __eq.enterRegion('harbor'); });
  await page.waitForFunction(() => __eq.region === 'harbor' && __eq.started, null, { timeout: 180000 }); await wait(900);
  await ev(() => { __eq.wild.mobs.forEach((m) => { m.dead = 999; m.g.visible = false; }); __eq.teleport(33.2, 28); }); await wait(700);
  check((await page.textContent('#prompt')).includes('Câu cá'), 'The end of the fishing pier offers fishing');
  await page.keyboard.press('KeyE'); await wait(500);
  check(await ev(() => __eq.fishing.active && __eq.fishing.state === 'wait'), 'E puts the rod in hand: the float is in the water and the hero waits');
  await ev(() => { const f = __eq.fishing; f.biteAt = 0; f.hold = true; }); await page.waitForFunction(() => __eq.fishing.state === 'bite', null, { timeout: 180000 });
  check((await page.textContent('#fishhud')).includes('BITE'), 'A bite shows BITE and the sliding bar');
  const fish0 = await ev(() => Object.values(__eq.profile.fish || {}).reduce((a, b) => a + b, 0)); await wait(500); await page.keyboard.press('KeyE'); await wait(400);
  check(await ev((n) => Object.values(__eq.profile.fish || {}).reduce((a, b) => a + b, 0) === n + 1, fish0), 'The mark in the green zone lands the catch in the bucket');
  await page.keyboard.press('Escape'); await wait(300);
  check(await ev(() => !__eq.fishing.active), 'Esc puts the rod away');
  await ev(() => { __eq.profile.fish = {}; __eq.profile.dex = {}; __eq.catchFish(['sardine', 'dolphin', 'boot']); });
  check(await ev(() => { const d = __eq.profile.dex; return !!d.sardine && !!d.dolphin && !d.boot && __eq.profile.fish.boot === 1 && __eq.profile.fish.sardine === 1; }), 'Catches fill the bucket; only creatures enter the Sea Dex');
  await page.keyboard.press('KeyG'); await wait(400);
  check(await page.isVisible('#dexwin') && (await page.textContent('#dexwin')).includes('sardine') && (await page.textContent('#dexwin')).includes('dolphin'), 'G opens the Sea Dex with the found creatures');
  await page.keyboard.press('Escape'); await wait(300);
  await ev(() => __eq.teleport(2, 14.6)); await wait(700);
  check((await page.textContent('#prompt')).includes('Bán'), 'The fish market buys the bucket');
  const g0 = await ev(() => __eq.profile.stats.gold); await page.keyboard.press('KeyE'); await wait(400); await closeDialogs();
  check(await ev((g) => __eq.profile.stats.gold > g && Object.keys(__eq.profile.fish).length === 0, g0), 'Selling pays gold and empties the bucket');
  await ev(() => __eq.gainItems([{ kind: 'hat', color: 'pink' }, { kind: 'shoes', color: 'blue' }])); await closeDialogs();
  await page.keyboard.press('KeyU'); await wait(400);
  check(await page.isVisible('#wardwin') && (await page.textContent('#wardwin')).includes('pink hat'), 'V opens the wardrobe with the won pieces');
  await page.click('#wardwin [data-a="wear"][data-v="hat:pink"]'); await wait(300);
  check(await ev(() => __eq.profile.wardrobe.worn.head === 'hat:pink' && __eq.player.root.getObjectByProperty('isMesh', true) !== undefined), 'Clicking a piece wears it');
  await page.keyboard.press('Escape'); await wait(300);
  await page.keyboard.press('KeyN'); await wait(400); await page.click('#journal [data-v="family"]'); await wait(300);
  check((await page.textContent('#journal')).includes('Tàu gia đình') && (await page.textContent('#journal')).includes('Rowboat'), 'The journal has the family ship tab');
  await page.keyboard.press('Escape'); await wait(300);
  await page.keyboard.press('KeyP'); await wait(400);
  check(await page.isVisible('#petwin') && (await page.textContent('#petwin')).includes('seagull'), 'P offers the three pets');
  await page.click('#petwin [data-v="gull"]'); await wait(300);
  check(await ev(() => __eq.profile.pet && __eq.profile.pet.kind === 'gull' && __eq.pet.root.visible), 'Adopting shows the pet in the world');
  await page.click('#petwin [data-a="feed"]'); await wait(300);
  const right = await ev(() => __eq.petPanel.q.a); await page.click(`#petwin [data-a="ans"][data-v="${right}"]`); await wait(300);
  check(await ev(() => __eq.profile.pet.bond >= 3), 'A right answer feeds the pet and raises the bond');
  await page.keyboard.press('Escape'); await wait(300);
  await ev(() => __eq.teleport(22, 28.6)); await wait(700);
  check((await page.textContent('#prompt')).includes('Đảo Kho Báu'), 'The boat at the fishing pier offers Treasure Isle');
  await page.keyboard.press('KeyE'); await page.waitForFunction(() => __eq.region === 'isle' && __eq.started, null, { timeout: 180000 }); await wait(900);
  check(await page.isVisible('#trwin') && (await page.textContent('#trwin')).includes('Start at') || (await page.textContent('#trwin')).includes('halfway') || (await page.textContent('#trwin')).includes('Go to'), 'On Treasure Isle the English treasure map opens');
  await page.keyboard.press('Escape'); await wait(300);
  await ev(() => __eq.teleport(-18, 2)); await wait(600); await page.keyboard.press('KeyE'); await wait(400);
  check((await page.textContent('#dialog')).includes('Nothing here'), 'Digging in the wrong place says hot or cold in English'); await closeDialogs();
  await ev(() => { const g = __eq.profile.treasure.map.goal; __eq.teleport(g.x, g.z); }); await wait(600); await page.keyboard.press('KeyE'); await wait(400);
  check((await page.textContent('#dialog')).includes('found the treasure') && await ev(() => __eq.profile.treasure.total === 1 && __eq.profile.wardrobe.owned.length >= 3), 'Digging at the goal finds the treasure: gold, EXP and a new wardrobe piece'); await closeDialogs();
  await ev(() => __eq.teleport(-21.4, 2)); await wait(600);
  check((await page.textContent('#prompt')).includes('Cảng Mặt Trời'), 'The isle has its way back to the harbor'); await page.keyboard.press('KeyE'); await page.waitForFunction(() => __eq.region === 'harbor' && __eq.started, null, { timeout: 180000 }); await wait(600);
  check(await ev(() => __eq.errors.length === 0), 'Extras: no script errors');
  await ev(() => __eq.enterRegion('village')); await page.waitForFunction(() => __eq.region === 'village' && __eq.started, null, { timeout: 120000 }); await wait(600); await closeDialogs();
});

await run('forest', async () => {
  await ev(() => __eq.enterRegion('forest')); await page.waitForFunction(() => __eq.region === 'forest' && __eq.started, null, { timeout: 90000 });
  check(await ev(() => __eq.errors.length === 0 && __eq.wild.mobs.every((m) => m.region === 'forest' || !m.g.visible)), 'Forest loads, no monsters from the meadow there');
});

await run('bag', async () => {          // A6: bag screen and gear on the body
  await ev(() => { const p = __eq.profile; p.inv = { owned: ['wood_sword', 'iron_armor', 'clover'], weapon: 'wood_sword', armor: 'iron_armor', charm: 'clover', food: 2 }; __eq.setWear(); __eq.teleport(0, 13); }); await wait(300);
  check(await ev(() => !!__eq.armor && __eq.armor.parent.name === 'chest'), 'Iron armour is shown on Ngọc\'s chest');
  await page.keyboard.press('KeyI'); await wait(300);
  check((await page.textContent('#dialog')).includes('Iron Armor') && (await page.textContent('#dialog')).includes('Phòng thủ 5'), 'I opens the bag with gear and numbers');
  const k = await ev(() => __eq.ui.options.findIndex((o) => o.includes('Iron Armor')));
  await page.keyboard.press('Digit' + (k + 1)); await wait(300);
  check(await ev(() => !__eq.armor && __eq.profile.inv.armor === '' && __eq.profile.gear.def === 0), 'Picking the worn armour takes it off');
  await page.keyboard.press('Digit' + (k + 1)); await wait(300);
  check(await ev(() => !!__eq.armor && __eq.profile.gear.def === 5), 'Picking it again puts it back on');
  await closeDialogs(); await page.keyboard.press('Escape'); await wait(200);
  for (let n = 0; n < 3 && await page.isVisible('#dialog'); n++) { const last = await ev(() => __eq.ui.options ? __eq.ui.options.length : 0); if (last) await page.keyboard.press('Digit' + last); await wait(200); }
});

await run('shop', async () => {         // the shop door opens the inside view: buy, wear, sell
  if (await ev(() => __eq.region !== 'village')) { await ev(() => __eq.enterRegion('village')); await page.waitForFunction(() => __eq.region === 'village' && __eq.started, null, { timeout: 120000 }); }
  await ev(() => { const p = __eq.profile; p.inv = { owned: [], weapon: '', armor: '', charm: '', food: 0 }; p.stats.gold = 300; p.stats.level = 6; __eq.setWear(); __eq.teleport(7.6, -8); }); await wait(600);
  check((await page.textContent('#prompt')).includes('Vào cửa hàng'), 'Prompt at the shop door');
  await page.keyboard.press('KeyE'); await wait(500);
  check(await page.isVisible('#shopwin') && (await page.textContent('#shopwin')).includes('Iron Sword') && (await page.textContent('#shopwin')).includes('Honey Bread'), 'Inside the shop: both counters with their goods');
  await page.click('#shopwin button[data-act="buy"][data-id="wood_sword"]'); await wait(400);
  check(await ev(() => __eq.profile.inv.owned.includes('wood_sword') && __eq.profile.stats.gold === 260 && !!__eq.sword), 'Buy: gold paid, sword in her hand');
  await page.click('#shopwin button[data-act="sell"][data-id="wood_sword"]'); await wait(400);
  check(await ev(() => !__eq.profile.inv.owned.includes('wood_sword') && __eq.profile.stats.gold === 280 && !__eq.sword), 'Sell: half the price back, sword gone');
  await page.keyboard.press('Escape'); await wait(300);
  check(!(await page.isVisible('#shopwin')), 'Esc leaves the shop');
});

await run('intro', async () => {        // a new child starts in front of their own home (20/11; before: by boat) (?intro=1 shows it to tests)
  await ev(() => __eq.pause(true)); const tp = await browser.newPage({ viewport: { width: 1024, height: 700 } }); tp.setDefaultTimeout(120000); await tp.goto(url + '?intro=1');
  await tp.waitForFunction(() => globalThis.__eq && document.getElementById('loading').classList.contains('hidden') && !document.getElementById('menu').classList.contains('hidden'), null, { timeout: 180000 });
  await tp.click('#mnew'); await tp.fill('#mname', 'Boat'); await tp.click('[data-g="6"]'); await tp.click('#mgo');
  await tp.waitForFunction(() => __eq.started, null, { timeout: 120000 }); await tp.waitForTimeout(1500);
  check((await tp.textContent('#dialog')).includes('Kingdom of Words') && !(await tp.isVisible('[data-act="skip"]')), 'Opening story first, with no skip button');
  for (let k = 0; k < 6 && await tp.isVisible('#dialog'); k++) { await tp.keyboard.press('KeyE'); await tp.waitForTimeout(250); }
  await tp.waitForTimeout(800);
  check(await tp.evaluate(() => { const lot = __eq.homes.lotOf(__eq.profile); return !!lot && __eq.profile.flags.arrived && Math.hypot(__eq.player.pos.x - (lot.h.door[0] + 1.8), __eq.player.pos.z - lot.h.door[1]) < 1.5; }), 'After the story the new child stands in front of their own home door');
  check(await tp.evaluate(() => __eq.errors.length === 0), 'Intro page: no script errors');
  await tp.close(); await ev(() => __eq.pause(false));
});

await run('admin', async () => {        // admin account (password 321) and click-to-walk (18/11)
  await closeDialogs(); await ev(() => __eq.teleport(0, 13)); await wait(600);
  const box = await page.locator('#view').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.8); await page.mouse.down(); await page.mouse.up(); await wait(400);
  check(await ev(() => !!__eq.player.route && __eq.player.route.length > 0), 'A short click on the ground plans a walk there');
  await ev(() => { __eq.player.route = null; });
  await ev(() => __eq.pause(true)); const tp = await browser.newPage({ viewport: { width: 1280, height: 720 } }); tp.setDefaultTimeout(120000); await tp.goto(url);
  await tp.waitForFunction(() => globalThis.__eq && document.getElementById('loading').classList.contains('hidden') && !document.getElementById('menu').classList.contains('hidden'), null, { timeout: 180000 });
  await tp.click('#madmin'); await tp.fill('#mpass', '123'); await tp.click('#mpok');
  check((await tp.textContent('#mpmsg')).includes('Sai'), 'Admin: a wrong password is refused');
  await tp.fill('#mpass', '321'); await tp.click('#mpok'); await tp.waitForFunction(() => __eq.started, null, { timeout: 120000 }); await tp.waitForTimeout(800);
  check(await tp.isVisible('#adminbtn'), 'Admin: the 🛠 button appears');
  await tp.click('#adminbtn'); await tp.waitForTimeout(400);
  check(await tp.isVisible('#admin') && (await tp.textContent('#admin')).includes('Nữ hoàng Nấm'), 'Admin panel lists places in every map');
  await tp.click('#admin [data-a="unlock"]'); await tp.waitForTimeout(600);
  check(await tp.evaluate(() => __eq.profile.flags.map2 && __eq.profile.flags.forest_open && __eq.profile.flags.bridge_fixed), 'Admin: unlock everything');
  await tp.click('#admin [data-a="go"]:has-text("Nữ hoàng Nấm")'); await tp.waitForFunction(() => __eq.region === 'forest' && __eq.started, null, { timeout: 180000 }); await tp.waitForTimeout(600);
  check(await tp.evaluate(() => Math.hypot(__eq.player.pos.x + 40, __eq.player.pos.z + 24) < 4), 'Admin: jump straight to the Map 2 boss');
  check(await tp.evaluate(() => __eq.errors.length === 0), 'Admin page: no script errors');
  await tp.close(); await ev(() => __eq.pause(false));
});

await run('touch', async () => {         // T4: a tablet page (?touch=1) with the joystick and buttons
  await ev(() => __eq.pause(true)); const tp = await browser.newPage({ viewport: { width: 1024, height: 700 } }); await tp.goto(url + '?touch=1');
  await tp.waitForFunction(() => globalThis.__eq && document.getElementById('loading').classList.contains('hidden') && !document.getElementById('menu').classList.contains('hidden'), null, { timeout: 180000 });
  tp.setDefaultTimeout(120000); await tp.click('#mnew'); await tp.fill('#mname', 'Tab'); await tp.click('[data-g="6"]'); await tp.click('#mgo');
  await tp.waitForFunction(() => __eq.started, null, { timeout: 90000 }); await tp.waitForTimeout(500);
  check(await tp.isVisible('#touch .stick') && await tp.isVisible('#touch [data-k="KeyE"]'), 'Tablet: joystick and buttons shown');
  const p0 = await tp.evaluate(() => ({ x: __eq.player.pos.x, z: __eq.player.pos.z }));
  const box = await tp.locator('#touch .stick').boundingBox(), cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await tp.mouse.move(cx, cy); await tp.mouse.down(); await tp.mouse.move(cx, cy - 40, { steps: 4 }); await tp.waitForTimeout(1500);
  const p1 = await tp.evaluate(() => ({ x: __eq.player.pos.x, z: __eq.player.pos.z }));
  await tp.mouse.up(); await tp.waitForTimeout(300);
  check(Math.hypot(p1.x - p0.x, p1.z - p0.z) > 1.2, 'Pushing the joystick walks Ngọc');
  await tp.evaluate(() => __eq.teleport(1.6, 9.2)); await tp.waitForTimeout(500);
  await tp.locator('#touch [data-k="KeyE"]').dispatchEvent('pointerdown'); await tp.locator('#touch [data-k="KeyE"]').dispatchEvent('pointerup'); await tp.waitForTimeout(300);
  check((await tp.textContent('#dialog')).includes('I am Tom'), 'The E button talks to Tom');
  for (let k = 0; k < 6 && await tp.isVisible('#dialog'); k++) { await tp.click('#dialog'); await tp.waitForTimeout(200); }
  await tp.evaluate(async () => { const A = await import('./src/ui/arcade.js'); __eq.arcade.start(A.blocksGame()); }); await tp.waitForTimeout(400);
  const y0 = await tp.evaluate(() => __eq.arcade.game.piece.x);
  await tp.locator('#touch [data-k="ArrowLeft"]').dispatchEvent('pointerdown'); await tp.locator('#touch [data-k="ArrowLeft"]').dispatchEvent('pointerup'); await tp.waitForTimeout(200);
  check(y0 !== await tp.evaluate(() => __eq.arcade.game.piece.x), 'The ◀ button moves the falling block');
  check(await tp.isVisible('#touch .dpad') && !(await tp.isVisible('#touch .stick')), 'Board game open: the direction pad replaces the joystick');
  check(await tp.evaluate(() => __eq.errors.length === 0), 'Tablet page: no script errors ' + await tp.evaluate(() => __eq.errors.join(' | ').slice(0, 300)));
  await tp.close(); await ev(() => __eq.pause(false));
});

check(await ev(() => __eq.errors.length === 0), 'No script errors at the end');
console.log(failed ? `${failed} FAILED` : 'ALL PASS', logs.filter((l) => !/ReadPixels|GPU stall/.test(l)).slice(0, 5));
await browser.close(); server.close(); process.exit(failed ? 1 : 0);

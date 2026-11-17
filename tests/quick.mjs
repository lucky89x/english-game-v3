// Quick browser checks (3–5 min) for small changes: node tests/quick.mjs [--only boot,combat,owl,arcade,unit,forest]
// Each group sets up the state it needs through the debug API, so groups run on their own. The full story
// (Chapter I, bridge, forest quest, reload) stays in tests/e2e.mjs, run once per batch of changes.
import { serve, open } from './shot.mjs';
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1].split(',') : null;
let failed = 0;
const check = (ok, name) => { if (!ok) failed++; console.log((ok ? 'PASS: ' : 'FAIL: ') + name); };
const { server, url } = await serve(); const { browser, page, logs } = await open(url);
const ev = (f, a) => page.evaluate(f, a), wait = (ms) => page.waitForTimeout(ms);
const closeDialogs = async () => { for (let k = 0; k < 6 && await page.isVisible('#dialog'); k++) { await page.keyboard.press('KeyE'); await wait(180); } };
const run = async (name, fn) => { if (only && !only.includes(name)) return; const t = Date.now(); await fn(); console.log(`  [${name}] ${((Date.now() - t) / 1000).toFixed(0)} s`); };

await page.click('#mnew'); await page.fill('#mname', 'Quick'); await page.click('[data-g="8"]'); await page.click('#mgo');
await page.waitForFunction(() => __eq.started, null, { timeout: 90000 });
await ev(() => { const p = __eq.profile; p.flags.forest_open = true; p.flags.bridge_fixed = true; p.stats.hp = 9999; __eq.wild.mobs.forEach((m) => { if (!m.boss) { m.dead = 999; m.g.visible = false; } }); __eq.refresh(); });

await run('boot', async () => {
  check(await ev(() => __eq.errors.length === 0 && __eq.region === 'village'), 'Boot: no script errors, grade 8 profile in the village');
  check(await page.isVisible('#gu'), 'Settings bar has the parent Unit picker');
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
  await page.keyboard.press('KeyE'); await wait(350);
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
});

await run('unit', async () => {
  await ev(() => { const s = document.getElementById('gu'); s.value = '3'; s.dispatchEvent(new Event('change')); }); await wait(1200);
  check(await ev(() => __eq.profile.unitPick === 3 && __eq.chests.api.cards().every((c) => c.id.startsWith('g8_u03:'))), 'Parent picks Unit 3: words follow');
  await ev(() => { const s = document.getElementById('gu'); s.value = '0'; s.dispatchEvent(new Event('change')); }); await wait(1200);
  check(await ev(() => !__eq.profile.unitPick), '"Theo map" clears the pick');
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
    const pick = await ev(async () => {
      const en = document.querySelector('#dialog .en').textContent, vi = ((document.querySelector('#dialog .vi') || {}).textContent || '').trim(), cards = __eq.chests.api.cards(), m = /"(.+)" mean/.exec(en);
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

await run('arcade', async () => {
  await ev(() => { __eq.profile.plays = undefined; }); const g0 = await ev(() => __eq.profile.stats.gold);
  const paid = [];
  for (let n = 0; n < 4; n++) {
    await ev(() => __eq.teleport(10.6, 28.6)); await wait(400); await page.keyboard.press('KeyE'); await wait(500);
    const before = await ev(() => __eq.profile.stats.gold);
    await ev(() => { __eq.arcade.game.coins = 10; __eq.arcade.game.time = 0; }); await page.waitForFunction(() => !__eq.arcade.open, null, { timeout: 60000 });
    paid.push((await ev(() => __eq.profile.stats.gold)) - before); await wait(200);
    if (n === 3) check((await page.textContent('#dialog')).includes('20%'), 'Fourth race of the day says the pay is lower');
    await closeDialogs();
  }
  check(paid[0] > 0 && paid[0] === paid[2] && paid[3] < paid[0] && paid[3] >= 1, `Cart race pays in full three times, then less (${paid.join(', ')}; start ${g0})`);
});

await run('map2', async () => {        // Map 2 monsters in the forest, only once Map 2 is open
  await ev(() => { const p = __eq.profile; p.flags.forest_open = true; p.flags.map2 = false; __eq.enterRegion('forest'); }); await page.waitForFunction(() => __eq.region === 'forest' && __eq.started, null, { timeout: 120000 }); await wait(600);
  check(await ev(() => __eq.wild.mobs.every((m) => !m.g.visible)), 'Forest before Map 2: no monsters');
  await ev(() => { const p = __eq.profile; p.flags.map2 = true; p.stats.level = 22; p.stats.hp = 9999; __eq.wild.mobs.forEach((m) => { if (m.region === 'forest') m.dead = 0; }); });   // the setup at the top parks every monster await page.waitForFunction(() => __eq.wild.mobs.filter((m) => m.g.visible).length >= 10, null, { timeout: 60000 }).catch(() => {});
  check(await ev(() => __eq.wild.mobs.filter((m) => m.g.visible).every((m) => m.region === 'forest') && __eq.wild.mobs.filter((m) => m.g.visible).length === 10), 'Map 2 open: 10 forest monsters, none from the meadow ' + await ev(() => __eq.wild.mobs.filter((m) => m.g.visible).map((m) => m.kind).join(',')));
  const r = await ev(() => { const w = __eq.wild, m = w.mobs.find((m) => m.kind === 'bat' && !m.dead), e0 = __eq.profile.stats.exp, l0 = __eq.profile.stats.level; w.kill(m, __eq.profile); return { exp: __eq.profile.stats.exp !== e0 || __eq.profile.stats.level !== l0, dead: m.dead > 0 }; });
  check(r.exp && r.dead, 'Defeating a Shadow Bat pays EXP');
  await ev(() => __eq.enterRegion('village')); await page.waitForFunction(() => __eq.region === 'village' && __eq.started, null, { timeout: 120000 }); await wait(600);
  check(await ev(() => __eq.wild.mobs.filter((m) => m.g.visible).every((m) => m.region === 'village')), 'Back in the village: only meadow monsters');
  await closeDialogs();
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

await run('intro', async () => {        // a new child arrives by boat (?intro=1 shows it to tests)
  await ev(() => __eq.pause(true)); const tp = await browser.newPage({ viewport: { width: 1024, height: 700 } }); tp.setDefaultTimeout(120000); await tp.goto(url + '?intro=1');
  await tp.waitForFunction(() => globalThis.__eq && document.getElementById('loading').classList.contains('hidden') && !document.getElementById('menu').classList.contains('hidden'), null, { timeout: 180000 });
  await tp.click('#mnew'); await tp.fill('#mname', 'Boat'); await tp.click('[data-g="6"]'); await tp.click('#mgo');
  await tp.waitForFunction(() => __eq.started, null, { timeout: 120000 }); await tp.waitForTimeout(1500);
  check(await tp.evaluate(() => __eq.intro && __eq.intro.active && __eq.player.pos.y < 0.4), 'New child starts in a boat on the river');
  await tp.keyboard.press('KeyE'); await tp.waitForTimeout(800);
  check(await tp.evaluate(() => !__eq.intro.active && __eq.profile.flags.arrived && Math.hypot(__eq.player.pos.x - 18.2, __eq.player.pos.z - 18.6) < 1.5), 'E skips: Ngọc stands on the dock');
  check(await tp.evaluate(() => __eq.errors.length === 0), 'Intro page: no script errors');
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
  check((await tp.textContent('#dialog')).includes('Welcome'), 'The E button talks to Tom');
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

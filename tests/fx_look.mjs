// Pictures of the spell effects, frame by frame: node tests/fx_look.mjs <out folder> [low|medium|high] [id,id,…] [--night]
// One sheet per spell (<out>/<id>.png): the same scene (the hero, three monsters in front) at fixed moments after the cast.
// The game's own loop is stopped and the effects are stepped by hand, so a slow machine draws exactly the same frames as a
// fast one. Used to look at an effect before and after it is redrawn (27/11: "the skill effects are ugly and weak").
import fs from 'node:fs'; import path from 'node:path';
import { serve, open } from './shot.mjs';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--')), out = args[0] || 'fx_look', quality = args[1] || 'medium', only = args[2] ? args[2].split(',') : null, night = process.argv.includes('--night');
fs.mkdirSync(out, { recursive: true });
const W = 800, H = 450, TIMES = { melee: [0.04, 0.1, 0.18, 0.28, 0.42, 0.7], single: [0.05, 0.15, 0.28, 0.42, 0.6, 0.9], aoe: [0.1, 0.5, 0.9, 1.3, 1.8, 2.6, 3.4, 4.2], ultimate: [0.1, 0.5, 0.95, 1.2, 1.6, 2.2, 3.0, 4.0] };
const { server, url } = await serve(); const { browser, page, logs } = await open(url, { width: W, height: H });
page.setDefaultTimeout(900000);
await page.click('#mnew'); await page.fill('#mname', 'An'); await page.click('[data-g="6"]'); await page.click('#mgo');
await page.waitForFunction(() => globalThis.__eq.started, null, { timeout: 900000 });
const ev = (f, a) => page.evaluate(f, a), wait = (ms) => page.waitForTimeout(ms);
await ev(([q, night]) => { __eq.setQuality(q); __eq.voiceDisable(true); __eq.friendsStay = true; const p = __eq.profile; p.god = true; p.stats.level = 70; p.stats.hp = 99999; p.flags.taught = true; if (night && __eq.dayNight && __eq.dayNight.set) __eq.dayNight.set(22); }, [quality, night]);
for (let i = 0; i < 10 && await ev(() => __eq.ui.busy); i++) { await page.keyboard.press('KeyE'); await wait(1200); }
await page.addStyleTag({ content: 'body > *:not(canvas) { visibility: hidden !important; }' });
// the stage: the hero on the red slime meadow looking east, three monsters a few steps in front
const stage = () => ev(() => {
  const g = __eq, w = g.wild, hx = 66, hz = 30; g.teleport(hx, hz); g.player.yaw = Math.PI / 2; g.player.sync && g.player.sync();
  const mobs = w.mobs.filter((m) => m.region === 'village' && !m.boss).slice(0, 3), at = [[70.6, 30], [72.2, 32], [72.6, 28.2]];
  mobs.forEach((m, i) => { m.x = at[i][0]; m.z = at[i][1]; m.dead = 0; m.dying = 0; m.hp = m.def.hp * 50; m.g.visible = true; w.place(m); m.g.rotation.y = -Math.PI / 2; });
  for (const m of w.mobs) if (!mobs.includes(m) && !m.boss && m.region === 'village') { m.g.visible = false; m.x = 300; }
  w.setTarget(mobs[0]); const c = g.cam; c.yaw = c.tYaw = 0.15; c.pitch = c.tPitch = 0.42; c.dist = c.tDist = 12.5; for (let i = 0; i < 4; i++) c.update(0.5, { x: hx + 2.6, y: g.player.pos.y, z: hz });
  return mobs.length;
});
await wait(3000); await ev(() => __eq.pause(true)); await wait(500);
const ids = await ev(async () => { const SK = await import('./src/core/skills.js'); return SK.SPELLS.map((n) => ({ id: n.id, el: n.el, type: n.type, en: n.en || n.id })); });
const sheet = await browser.newPage({ viewport: { width: W * 2 + 30, height: 100 } });
for (const sp of ids) {
  if (only && !only.includes(sp.id) && !only.includes(sp.el) && !only.includes(sp.type)) continue;
  await stage();
  await ev(async (id) => {
    const g = __eq, s = g.spells; s.clear();
    if (s.demo) { s.demo(id); return; }      // the new code: a free cast for looking at an effect
    const SK = await import('./src/core/skills.js'), p = g.profile, n = SK.NODES[id], m = SK.magic(p); m.el = n.el; m.ranks[id] = SK.MAX_RANK; m.mp = 99999; s.cool = {}; s.cast(id);
  }, sp.id);
  const shots = []; let t = 0;
  for (const until of TIMES[sp.type] || TIMES.single) {
    await ev(([from, to]) => { const g = __eq; for (let x = from; x < to - 1e-6; x += 1 / 60) { const dt = Math.min(1 / 60, to - x); g.spells.update(dt); if (g.floaters) g.floaters.update(dt); } g.renderNow(); }, [t, until]); t = until;
    shots.push({ t: until, png: (await page.screenshot({ type: 'jpeg', quality: 88 })).toString('base64') });
  }
  await sheet.setContent(`<body style="margin:0;background:#111;font:700 15px system-ui;color:#fff"><div style="padding:6px 10px">${sp.id} · ${sp.el} · ${sp.type} · ${quality}${night ? ' · night' : ''}</div><div style="display:grid;grid-template-columns:repeat(2, ${W}px);gap:6px;padding:0 6px 6px">${shots.map((s) => `<div style="position:relative"><img src="data:image/jpeg;base64,${s.png}" width="${W}"><span style="position:absolute;left:6px;top:4px;background:#000a;padding:1px 6px;border-radius:6px">${s.t.toFixed(2)} s</span></div>`).join('')}</div></body>`);
  await sheet.screenshot({ path: path.join(out, `${sp.id}.jpg`), type: 'jpeg', quality: 85, fullPage: true });
  console.log('shot', sp.id, sp.type);
}
console.log('errors', JSON.stringify(await ev(() => __eq.errors)), logs.filter((l) => !/KHR_parallel|ReadPixels/.test(l)).slice(0, 6));
await browser.close(); server.close();

// Recoloured clothes, hair and boots on the hero. node tests/hero_colors.mjs <out-prefix>
import { serve, open } from './shot.mjs';
const out = process.argv[2] || 'hc';
const { server, url } = await serve(); const { browser, page, logs } = await open(url, { width: 900, height: 700 });
await page.click('#mnew'); await page.fill('#mname', 'An'); await page.click('[data-g="6"]'); await page.click('#mgo');
await page.waitForFunction(() => globalThis.__eq.started, null, { timeout: 400000 });
await page.evaluate(() => { __eq.profile.avatar = 'hero'; __eq.applyLook(); });
await page.waitForFunction(() => __eq.player.actions.Walk && __eq.player.root.getObjectByName('Outfit_dress'), null, { timeout: 400000 });
await page.evaluate(() => { for (const id of ['hud', 'clue', 'mapbox', 'gear', 'prompt']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } __eq.wild.root.visible = false; });
const SETS = {
  c0: {},
  c1: { body: 'dress:blue', haircolor: 'haircolor:black', feet: 'boots:green' },
  c2: { top: 'top:pink', bottom: 'skirt:purple', haircolor: 'haircolor:yellow', feet: 'boots:white' },
  c3: { body: 'dress:white', haircolor: 'haircolor:red' },
  c4: { top: 'top:black', bottom: 'skirt:orange', haircolor: 'haircolor:pink', feet: 'boots:blue' },
};
const only = process.argv[3] && process.argv[3].split(',');
for (const [name, worn] of Object.entries(SETS)) {
  if (only && !only.includes(name)) continue;
  await page.evaluate((worn) => { const w = __eq.profile.wardrobe || (__eq.profile.wardrobe = { owned: [], worn: {} }); w.worn = worn; w.owned = Object.values(worn); __eq.applyLook(); }, worn);
  await page.waitForTimeout(5000);
  for (const [v, [yaw, pitch, dist]] of Object.entries({ f: [0.5, 0.1, 2.6], s: [0.5 + 2.4, 0.1, 2.6] })) {
    await page.evaluate(([yaw, pitch, dist]) => { const g = __eq; g.teleport(0.6, 15.5); g.player.yaw = 0.5; g.cam.yaw = g.cam.tYaw = yaw; g.cam.pitch = g.cam.tPitch = pitch; g.cam.dist = g.cam.tDist = dist; }, [yaw, pitch, dist]);
    await page.waitForTimeout(1800); await page.screenshot({ path: `${out}_${name}_${v}.png` });
  }
}
console.log(JSON.stringify({ errors: await page.evaluate(() => __eq.errors), logs: logs.filter((l) => !l.includes('ReadPixels')).slice(0, 8) }));
await browser.close(); server.close();

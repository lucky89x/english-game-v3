// Art review shots in the real game (merged with the old views.mjs):
//   node tests/look.mjs <out-prefix> [village|forest] [quality] [name,name…]
// village: Ngọc front/back, Tom, a house, the square. forest: the twelve forest spots (+ draw stats per view in the log).
import { serve, open } from './shot.mjs';
const [out = 'look', where = 'village', quality = 'medium', only] = process.argv.slice(2);
// village: [x, z, face, yaw, pitch, dist]; forest: [x, z, yaw, pitch, dist] (Ngọc faces the camera)
const VILLAGE = { ngoc_front: [0.6, 15.5, 0.5, 0.5, 0.12, 3.0], ngoc_back: [0.6, 15.5, 0.5 + Math.PI, 0.5, 0.2, 3.4], tom: [2.2, 9.6, 2.9, 2.9, 0.1, 3.2], house: [-7.5, -3.5, 2.0, 0.9, 0.22, 12], square: [1.5, 15, 3.1, 0.2, 0.4, 15] };
const FOREST = { gate: [-30, 49, 0.25, 0.38, 9], riverside: [-10, 30, 1.9, 0.42, 13], bridge: [-27, 36, -1.3, 0.3, 10], tree: [22, -14, -0.3, 0.2, 16], waterfall: [10.5, -42, 2.4, 0.16, 12],
  cave: [47, 3, -1.75, 0.22, 9], mushrooms: [35, 22, -1.4, 0.3, 9], camp: [28, 42, -0.9, 0.34, 10], ruins: [-39, -33, 0.9, 0.3, 10], tower: [43, -36, -0.75, 0.2, 13], cottage: [-34, 12, 1.2, 0.3, 11], closeup: [-30, 49, 2.9, 0.12, 3.2] };
const { server, url } = await serve(); const { browser, page, logs } = await open(url, { width: 1280, height: 720 });
await page.click('#mnew'); await page.fill('#mname', 'An'); await page.click('[data-g="6"]'); await page.click('#mgo');
await page.waitForFunction(() => globalThis.__eq.started, null, { timeout: 90000 });
await page.evaluate((q) => __eq.setQuality(q), quality);
if (where === 'forest') { await page.evaluate(() => { __eq.profile.flags.forest_open = true; __eq.enterRegion('forest'); }); await page.waitForFunction(() => __eq.region === 'forest' && __eq.started, null, { timeout: 90000 }); await page.evaluate(() => __eq.quest.start()); }
await page.evaluate(() => { for (const id of ['hud', 'clue', 'mapbox', 'gear', 'prompt']) document.getElementById(id).style.display = 'none'; __eq.wild.root.visible = false; });
const report = {};
for (const [name, v] of Object.entries(where === 'forest' ? FOREST : VILLAGE)) {
  if (only && !only.split(',').includes(name)) continue;
  const [x, z, face, yaw, pitch, dist] = where === 'forest' ? [v[0], v[1], v[2] + Math.PI, ...v.slice(2)] : v;
  await page.evaluate(([x, z, face, yaw, pitch, dist]) => { const g = __eq; g.teleport(x, z); g.player.yaw = face; g.cam.yaw = g.cam.tYaw = yaw; g.cam.pitch = g.cam.tPitch = pitch; g.cam.dist = g.cam.tDist = g.cam.cur = dist; }, [x, z, face, yaw, pitch, dist]);
  await page.waitForTimeout(2200); await page.screenshot({ path: `${out}_${name}.png` });
  report[name] = await page.evaluate(() => __eq.stats);
}
console.log(JSON.stringify({ report, errors: await page.evaluate(() => __eq.errors), logs: logs.filter((l) => !l.includes('ReadPixels')).slice(0, 6) }));
await browser.close(); server.close();

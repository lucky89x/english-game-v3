// node tests/views.mjs <outdir> [quality] — screenshots of the six review spots (+ stats per view).
import fs from 'node:fs'; import { serve, open } from './shot.mjs';
const VIEWS = { gate: [-30, 49, 0.25, 0.38, 9], riverside: [-10, 30, 1.9, 0.42, 13], bridge: [-27, 36, -1.3, 0.3, 10], tree: [22, -14, -0.3, 0.2, 16], waterfall: [10.5, -42, 2.4, 0.16, 12],
  cave: [47, 3, -1.75, 0.22, 9], mushrooms: [35, 22, -1.4, 0.3, 9], camp: [28, 42, -0.9, 0.34, 10], ruins: [-39, -33, 0.9, 0.3, 10], tower: [43, -36, -0.75, 0.2, 13], cottage: [-34, 12, 1.2, 0.3, 11], closeup: [-30, 49, 2.9, 0.12, 3.2] };
const [outdir, quality = 'medium', only] = process.argv.slice(2);
fs.mkdirSync(outdir, { recursive: true });
const { server, url } = await serve(); const { browser, page, logs } = await open(url);
await page.click('#mnew'); await page.fill('#mname', 'An'); await page.click('[data-g="6"]'); await page.click('#mgo');
await page.waitForFunction(() => globalThis.__eq.started, null, { timeout: 60000 });
await page.evaluate((q) => { __eq.setQuality(q); __eq.quest.start(); }, quality);
const report = {};
for (const [name, v] of Object.entries(VIEWS)) {
  if (only && !only.split(',').includes(name)) continue;
  await page.evaluate(([x, z, yaw, pitch, dist]) => { const g = __eq; g.teleport(x, z); g.player.yaw = yaw + Math.PI; g.cam.yaw = g.cam.tYaw = yaw; g.cam.pitch = g.cam.tPitch = pitch; g.cam.dist = g.cam.tDist = g.cam.cur = dist; }, v);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${outdir}/${name}.png` });
  report[name] = await page.evaluate(() => __eq.stats);
}
console.log(JSON.stringify({ report, errors: await page.evaluate(() => __eq.errors), logs: logs.filter((l) => !l.includes('ReadPixels')).slice(0, 6) }));
await browser.close(); server.close();

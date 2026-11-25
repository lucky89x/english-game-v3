// Screens of the Tripo hero in the real game: node tests/hero_look.mjs <out-prefix>   (profile.avatar = 'hero')
import { serve, open } from './shot.mjs';
const out = process.argv[2] || 'hero';
const { server, url } = await serve(); const { browser, page, logs } = await open(url, { width: 1100, height: 700 });
await page.click('#mnew'); await page.fill('#mname', 'An'); await page.click('[data-g="6"]'); await page.click('#mgo');
await page.waitForFunction(() => globalThis.__eq.started, null, { timeout: 300000 });
await page.evaluate(() => { __eq.profile.avatar = 'hero'; __eq.applyLook(); });
await page.waitForFunction(() => __eq.player.root.children.some((c) => c.name === 'thick') === false && __eq.player.actions.Walk && __eq.player.root.getObjectByName('Outfit_dress'), null, { timeout: 300000 });
await page.evaluate(() => { for (const id of ['hud', 'clue', 'mapbox', 'gear', 'prompt']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } __eq.wild.root.visible = false; });
const V = { front: [0.6, 15.5, 0.5, 0.5, 0.12, 3.0], close: [0.6, 15.5, 0.5, 0.5, 0.05, 1.5], side: [0.6, 15.5, 0.5 + 1.9, 0.5, 0.1, 2.2], back: [0.6, 15.5, 0.5 + Math.PI, 0.5, 0.12, 3.0] };
for (const [name, [x, z, face, yaw, pitch, dist]] of Object.entries(V)) {
  await page.evaluate(([x, z, face, yaw, pitch, dist]) => { const g = __eq; g.teleport(x, z); g.player.yaw = face; g.cam.yaw = g.cam.tYaw = yaw; g.cam.pitch = g.cam.tPitch = pitch; g.cam.dist = g.cam.tDist = dist; }, [x, z, face, yaw, pitch, dist]);
  await page.waitForTimeout(2500); await page.screenshot({ path: `${out}_${name}.png` });
}
console.log(JSON.stringify({ errors: await page.evaluate(() => __eq.errors), logs: logs.filter((l) => !l.includes('ReadPixels')).slice(0, 8) }));
await browser.close(); server.close();

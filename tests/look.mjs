// node tests/look.mjs <out-prefix> — art review shots taken in the real game: Ngọc from the front, Tom, a house, the square.
import { serve, open } from './shot.mjs';
const out = process.argv[2] || 'look';
const { server, url } = await serve(); const { browser, page } = await open(url, { width: 1280, height: 720 });
await page.click('#mnew'); await page.fill('#mname', 'An'); await page.click('[data-g="6"]'); await page.click('#mgo');
await page.waitForFunction(() => globalThis.__eq.started);
await page.evaluate(() => { for (const id of ['hud', 'clue', 'mapbox', 'gear', 'prompt']) document.getElementById(id).style.display = 'none'; __eq.wild.root.visible = false; });
const cam = (x, z, face, yaw, pitch, dist) => page.evaluate(([x, z, face, yaw, pitch, dist]) => { const g = __eq; g.teleport(x, z); g.player.yaw = face; g.cam.yaw = g.cam.tYaw = yaw; g.cam.pitch = g.cam.tPitch = pitch; g.cam.dist = g.cam.tDist = g.cam.cur = dist; }, [x, z, face, yaw, pitch, dist]);
const shots = { ngoc_front: [0.6, 15.5, 0.5, 0.5, 0.12, 3.0], ngoc_back: [0.6, 15.5, 0.5 + Math.PI, 0.5, 0.2, 3.4], tom: [2.2, 9.6, 2.9, 2.9, 0.1, 3.2], house: [-7.5, -3.5, 2.0, 0.9, 0.22, 12], square: [1.5, 15, 3.1, 0.2, 0.4, 15] };
for (const [name, v] of Object.entries(shots)) { await cam(...v); await page.waitForTimeout(2200); await page.screenshot({ path: `${out}_${name}.png` }); }
await browser.close(); server.close();

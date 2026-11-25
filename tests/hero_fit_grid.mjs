// Tuning grid for the hero's accessories: node tests/hero_fit_grid.mjs <out-prefix>; one front shot per variant and set (+ side shots for the middle variant)
import { serve, open } from './shot.mjs';
const out = process.argv[2] || 'fit';
const { server, url } = await serve(); const { browser, page } = await open(url, { width: 900, height: 620 });
await page.click('#mnew'); await page.fill('#mname', 'An'); await page.click('[data-g="6"]'); await page.click('#mgo');
await page.waitForFunction(() => globalThis.__eq.started, null, { timeout: 300000 });
await page.evaluate(() => { __eq.profile.avatar = 'hero'; __eq.applyLook(); });
await page.waitForFunction(() => __eq.player.actions.Walk && __eq.player.root.getObjectByName('Outfit_dress'), null, { timeout: 300000 });
await page.evaluate(() => { for (const id of ['hud', 'clue', 'mapbox', 'gear', 'prompt']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } __eq.wild.root.visible = false; });
const SETS = { A: { face: 'glasses:black', chain: 'necklace:gold', neck: 'scarf:red' }, B: { head: 'hat:red' }, C: { head: 'tiara:gold', hair: 'bow:pink', ears: 'earrings:gold' } };
const VARS = [{ head: { dy: 0.2, s: 1.15, py: 1.35, pz: -0.1 }, neck: { dy: 0.23, s: 1, py: 0.95, pz: 0 } }, { head: { dy: 0.3, s: 1.15, py: 1.35, pz: -0.1 }, neck: { dy: 0.33, s: 1, py: 0.95, pz: 0 } }, { head: { dy: 0.4, s: 1.15, py: 1.35, pz: -0.1 }, neck: { dy: 0.43, s: 1, py: 0.95, pz: 0 } }];
const view = async (yaw, pitch, dist) => { await page.evaluate(([yaw, pitch, dist]) => { const g = __eq; g.teleport(0.6, 15.5); g.player.yaw = 0.5; g.cam.yaw = g.cam.tYaw = yaw; g.cam.pitch = g.cam.tPitch = pitch; g.cam.dist = g.cam.tDist = dist; }, [yaw, pitch, dist]); await page.waitForTimeout(2000); };
for (const [name, worn] of Object.entries(SETS)) {
  await page.evaluate((worn) => { const w = __eq.profile.wardrobe || (__eq.profile.wardrobe = { owned: [], worn: {} }); w.worn = worn; w.owned = Object.values(worn); globalThis.__heroFit = null; __eq.applyLook(); }, worn);
  await page.waitForTimeout(8000);
  for (let v = 0; v < VARS.length; v++) {
    await page.evaluate(([f]) => { globalThis.__heroFit = f; __eq.applyLook(); }, [VARS[v]]); await page.waitForTimeout(1500);
    await view(0.5, 0.08, 1.6); await page.screenshot({ path: `${out}_${name}${v}_f.png` });
    if (v === 1) { await view(0.5 + 1.57, 0.08, 1.6); await page.screenshot({ path: `${out}_${name}${v}_s.png` }); }
  }
}
console.log('done');
await browser.close(); server.close();

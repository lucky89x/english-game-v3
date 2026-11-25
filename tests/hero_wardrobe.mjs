// Does the wardrobe (clothes, hair, accessories) work on the Tripo hero? node tests/hero_wardrobe.mjs <out-prefix>
import { serve, open } from './shot.mjs';
const out = process.argv[2] || 'hw';
const { server, url } = await serve(); const { browser, page, logs } = await open(url, { width: 1100, height: 700 });
await page.click('#mnew'); await page.fill('#mname', 'An'); await page.click('[data-g="6"]'); await page.click('#mgo');
await page.waitForFunction(() => globalThis.__eq.started, null, { timeout: 300000 });
await page.evaluate(() => { __eq.profile.avatar = 'hero'; __eq.applyLook(); });
await page.waitForFunction(() => __eq.player.actions.Walk && __eq.player.root.getObjectByName('Outfit_dress'), null, { timeout: 300000 });
await page.evaluate(() => { for (const id of ['hud', 'clue', 'mapbox', 'gear', 'prompt']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } __eq.wild.root.visible = false; });
const SETS = {
  acc1: { head: 'hat:red', face: 'glasses:black', chain: 'necklace:gold', back: 'bag:blue' },
  acc2: { head: 'tiara:gold', hair: 'bow:pink', ears: 'earrings:gold', neck: 'scarf:red', wrist: 'bracelet:green' },
  cloth: { body: 'dress:red', style: 'hairstyle:long', haircolor: 'haircolor:black', feet: 'boots:brown' },
  cloth2: { top: 'hoodie:blue', bottom: 'shorts:black', feet: 'hightops:white' },
};
const info = {};
const only = process.argv[3];
for (const [name, worn] of Object.entries(SETS)) {
  if (only && !only.split(',').includes(name)) continue;
  await page.evaluate((worn) => { const w = __eq.profile.wardrobe || (__eq.profile.wardrobe = { owned: [], worn: {} }); w.worn = worn; w.owned = Object.values(worn); __eq.applyLook(); }, worn);
  await page.waitForTimeout(9000);
  for (const [v, [yaw, pitch, dist]] of Object.entries({ f: [0.5, 0.1, 2.3], s: [0.5 + 1.57, 0.1, 2.3] })) {
    await page.evaluate(([yaw, pitch, dist]) => { const g = __eq; g.teleport(0.6, 15.5); g.player.yaw = 0.5; g.cam.yaw = g.cam.tYaw = yaw; g.cam.pitch = g.cam.tPitch = pitch; g.cam.dist = g.cam.tDist = dist; }, [yaw, pitch, dist]);
    await page.waitForTimeout(2200); await page.screenshot({ path: `${out}_${name}_${v}.png` });
  }
  info[name] = await page.evaluate(() => { const l = []; __eq.player.root.traverse((o) => { if (o.isMesh && o.visible) l.push(o.name); }); return l.length; });
}
console.log(JSON.stringify({ info, errors: await page.evaluate(() => __eq.errors), logs: logs.filter((l) => !l.includes('ReadPixels')).slice(0, 8) }));
await browser.close(); server.close();

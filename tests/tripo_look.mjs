// Screens of the Tripo monsters, pets and girls in the real game: node tests/tripo_look.mjs <out-prefix> [girls,mobs,pets]
//  girls: Luna (girl1) and Mika (girl2) close up from front, side and back; mobs: the lava golem, mushroom and treant in their patches;
//  pets: the ember fox, puppy and kitten (seen from behind the hero, where they follow).
import { serve, open } from './shot.mjs';
const out = process.argv[2] || 'tripo', what = (process.argv[3] || 'girls,mobs').split(',');
const { server, url } = await serve(); const { browser, page, logs } = await open(url, { width: 1000, height: 640 });
await page.click('#mnew'); await page.fill('#mname', 'An'); await page.click('[data-g="6"]'); await page.click('#mgo');
await page.waitForFunction(() => globalThis.__eq.started, null, { timeout: 300000 });
await page.evaluate(() => { for (const id of ['hud', 'clue', 'mapbox', 'gear', 'prompt']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } });
const cam = (x, z, face, yaw, pitch, dist) => page.evaluate(([x, z, face, yaw, pitch, dist]) => { const g = __eq; g.teleport(x, z); g.player.yaw = face; g.cam.yaw = g.cam.tYaw = yaw; g.cam.pitch = g.cam.tPitch = pitch; g.cam.dist = g.cam.tDist = dist; }, [x, z, face, yaw, pitch, dist]);
if (what.includes('girls')) {
  const mark = { girl1: 'Part1_part_1', girl2: 'Hero' };      // a mesh only this body has (the hero's own name is Hero too, but only Ruby has Outfit_dress)
  for (const kind of ['girl1', 'girl2']) {
    await page.evaluate((kind) => { __eq.profile.avatar = kind; __eq.applyLook(); }, kind);
    await page.waitForFunction(([kind, m]) => { const r = __eq.player.root; return !!r.getObjectByName(m) && !r.getObjectByName('Outfit_dress') && (kind === 'girl1' ? !!r.getObjectByName('Part9_part_9') : true); }, [kind, mark[kind]], { timeout: 300000 });
    await page.waitForTimeout(3000);
    for (const [name, [face, yaw, pitch, dist]] of Object.entries({ front: [0.5, 0.5, 0.1, 2.3], side: [0.5 + 1.9, 0.5, 0.1, 2.3], back: [0.5 + Math.PI, 0.5, 0.1, 2.3] })) { await cam(0.6, 15.5, face, yaw, pitch, dist); await page.waitForTimeout(2500); await page.screenshot({ path: `${out}_${kind}_${name}.png` }); }
  }
}
if (what.includes('mobs')) {
  await page.evaluate(() => { __eq.profile.avatar = 'hero'; __eq.applyLook(); });
  for (const k of ['golem']) {
    const m = await page.evaluate((k) => { const m = __eq.wild.mobs.find((m) => m.kind === k && m.region !== 'harbor'); return m ? { x: m.x, z: m.z } : null; }, k);
    if (!m) { console.log('no mob', k); continue; }
    await cam(m.x + 4, m.z + 4, Math.PI + 0.8, 0.8, 0.2, 6); await page.waitForTimeout(8000);
    await page.screenshot({ path: `${out}_mob_${k}.png` });
  }
}
if (what.includes('pets')) {
  for (const kind of ['ember', 'puppy', 'kitten']) {
    await page.evaluate((kind) => { const p = __eq.profile; p.pet = { kind, name: 'Pet', hunger: 80, joy: 80, bond: 0, tricks: [], at: Date.now(), day: 0, cares: 0, gift: 0 }; __eq.syncPet(); }, kind);
    await page.waitForFunction(() => __eq.pet.mixer, null, { timeout: 120000 }); await page.waitForTimeout(6000);
    await page.evaluate(() => { const p = __eq.pet; __eq.teleport(p.pos.x + 2.2, p.pos.z + 2.2); __eq.cam.yaw = __eq.cam.tYaw = 0.78 + Math.PI; __eq.cam.pitch = __eq.cam.tPitch = 0.25; __eq.cam.dist = __eq.cam.tDist = 3; });
    await page.waitForTimeout(3000); await page.screenshot({ path: `${out}_pet_${kind}.png` });
  }
}
console.log(JSON.stringify({ errors: await page.evaluate(() => __eq.errors), logs: logs.filter((l) => !l.includes('ReadPixels')).slice(0, 8) }));
await browser.close(); server.close();

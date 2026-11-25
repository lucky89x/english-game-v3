// The five looks of every accessory on the hero, in the game. node tests/hero_styles.mjs <out-prefix> [k0,k1,...]  (k = style index 0..4)
import { serve, open } from './shot.mjs';
const out = process.argv[2] || 'hs';
const { server, url } = await serve(); const { browser, page, logs } = await open(url, { width: 900, height: 620 });
await page.click('#mnew'); await page.fill('#mname', 'An'); await page.click('[data-g="6"]'); await page.click('#mgo');
await page.waitForFunction(() => globalThis.__eq.started, null, { timeout: 400000 });
await page.evaluate(() => { __eq.profile.avatar = 'hero'; __eq.applyLook(); });
await page.waitForFunction(() => __eq.player.actions.Walk && __eq.player.root.getObjectByName('Outfit_dress'), null, { timeout: 400000 });
await page.evaluate(() => { for (const id of ['hud', 'clue', 'mapbox', 'gear', 'prompt']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; } __eq.wild.root.visible = false; });
const COL = ['red', 'blue', 'pink', 'green', 'purple'], JW = ['gold', 'silver', 'pink', 'blue', 'green'];
const STY = { hat: ['hat', 'hat_cap', 'hat_beanie', 'hat_bucket', 'hat_wizard'], glasses: ['glasses', 'glasses_round', 'glasses_sun', 'glasses_heart', 'glasses_star'], necklace: ['necklace', 'necklace_pearl', 'necklace_heart', 'necklace_choker', 'necklace_star'], bag: ['bag', 'bag_satchel', 'bag_pack', 'bag_round', 'bag_wings'], bracelet: ['bracelet', 'bracelet_beads', 'bracelet_watch', 'bracelet_charm', 'bracelet_cuff'],
  tiara: ['tiara', 'tiara_crown', 'tiara_flower', 'tiara_laurel', 'tiara_stars'], bow: ['bow', 'bow_side', 'bow_top', 'bow_pair', 'bow_ribbon'], earrings: ['earrings', 'earrings_hoop', 'earrings_stud', 'earrings_drop', 'earrings_star'], scarf: ['scarf', 'scarf_muffler', 'scarf_bandana', 'scarf_ribbon', 'scarf_fluffy'],
  headband: ['headband', 'headband_cat', 'headband_bunny', 'headband_sport', 'headband_pearl'], hairclip: ['hairclip', 'hairclip_star', 'hairclip_flower', 'hairclip_butterfly', 'hairclip_heart'] };
const SLOT = { hat: 'head', tiara: 'head', glasses: 'face', bow: 'hair', headband: 'hair', hairclip: 'hair', scarf: 'neck', necklace: 'chain', earrings: 'ears', bracelet: 'wrist', bag: 'back' };
const GROUPS = { A: ['hat', 'glasses', 'necklace', 'bag', 'bracelet'], B: ['tiara', 'bow', 'earrings', 'scarf'], C: ['headband'], D: ['hairclip'] };
const JEWEL = ['necklace', 'earrings', 'tiara', 'hairclip'];
const ks = (process.argv[3] || '0,1,2,3,4').split(',').map(Number), gs = (process.argv[4] || 'A,B,C,D').split(',');
for (const g of gs) for (const k of ks) {
  const worn = {}; for (const t of GROUPS[g]) worn[SLOT[t]] = `${STY[t][k]}:${(JEWEL.includes(t) ? JW : COL)[k]}`;
  await page.evaluate((worn) => { const w = __eq.profile.wardrobe || (__eq.profile.wardrobe = { owned: [], worn: {} }); w.worn = worn; w.owned = Object.values(worn); __eq.applyLook(); }, worn);
  await page.waitForTimeout(7000); await page.evaluate(() => __eq.applyLook()); await page.waitForTimeout(3000);
  for (const [v, [yaw, pitch, dist]] of Object.entries({ f: [0.5, 0.12, 2.0], s: [0.5 + 1.57, 0.12, 2.0], b: [0.5 + 3.14, 0.12, 2.0] })) {
    if (g !== 'A' && v === 'b') continue;
    await page.evaluate(([yaw, pitch, dist]) => { const x = __eq; x.teleport(0.6, 15.5); x.player.yaw = 0.5; x.cam.yaw = x.cam.tYaw = yaw; x.cam.pitch = x.cam.tPitch = pitch; x.cam.dist = x.cam.tDist = dist; }, [yaw, pitch, dist]);
    await page.waitForTimeout(1800); await page.screenshot({ path: `${out}_${g}${k}_${v}.png` });
  }
}
console.log(JSON.stringify({ errors: await page.evaluate(() => __eq.errors), logs: logs.filter((l) => !l.includes('ReadPixels')).slice(0, 8) }));
await browser.close(); server.close();

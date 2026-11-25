// Where are the head/neck/chest bones and the top of the head for Ngọc and for the hero? node tests/hero_probe.mjs
import { serve, open } from './shot.mjs';
const { server, url } = await serve(); const { browser, page } = await open(url, { width: 640, height: 400 });
await page.click('#mnew'); await page.fill('#mname', 'An'); await page.click('[data-g="6"]'); await page.click('#mgo');
await page.waitForFunction(() => globalThis.__eq.started, null, { timeout: 300000 });
const probe = () => page.evaluate(() => {
  const r = __eq.player.root; r.updateMatrixWorld(true); const out = {}, V = new r.position.constructor();
  let sk = null; r.traverse((o) => { if (!sk && o.isSkinnedMesh) sk = o; });
  for (const re of ['head', 'neck', 'chest', 'hand.?L']) { let b = null; r.traverse((o) => { if (!b && o.isBone && new RegExp('^' + re + '$').test(o.name)) b = o; });
    if (b) { b.getWorldPosition(V); const i = sk.skeleton.bones.indexOf(b); const e = sk.skeleton.boneInverses[i].elements; out[re] = { y: +(V.y - r.position.y).toFixed(3), x: +(V.x - r.position.x).toFixed(3), z: +(V.z - r.position.z).toFixed(3), invY: +e[13].toFixed(3), invZ: +e[14].toFixed(3), scale: +Math.hypot(e[0], e[1], e[2]).toFixed(3) }; } }
  const bb = new (r.position.constructor)(); let top = -1e9; r.traverse((o) => { if (o.isSkinnedMesh && !o.userData.outline) { o.geometry.computeBoundingBox(); const b2 = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); top = Math.max(top, b2.max.y - r.position.y); } });
  out.top = +top.toFixed(3); out.rootScale = r.scale.x; return out;
});
const headBox = () => page.evaluate(() => {
  const r = __eq.player.root; r.updateMatrixWorld(true); const res = {}; let sk = null; r.traverse((o) => { if (o.isSkinnedMesh && !o.userData.outline && o.skeleton.bones.some((b) => b.name === 'head')) { const sks = o.skeleton; const hi = sks.bones.findIndex((b) => b.name === 'head'); const g = o.geometry, P = g.attributes.position, SI = g.attributes.skinIndex, SW = g.attributes.skinWeight, inv = sks.boneInverses[hi], bm = o.bindMatrix; const V = new (r.position.constructor)(); const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; let n = 0;
      for (let i = 0; i < P.count; i++) { let w = 0; for (let k = 0; k < 4; k++) if (SI.getComponent(i, k) === hi) w += SW.getComponent(i, k); if (w < 0.9) continue; V.fromBufferAttribute(P, i).applyMatrix4(bm).applyMatrix4(inv); n++; for (let a = 0; a < 3; a++) { const v = [V.x, V.y, V.z][a]; mn[a] = Math.min(mn[a], v); mx[a] = Math.max(mx[a], v); } }
      res[o.name] = { n, min: mn.map((v) => +v.toFixed(3)), max: mx.map((v) => +v.toFixed(3)) }; } });
  return res; });
console.log('NGOC_HEAD', JSON.stringify(await headBox()));
console.log('NGOC', JSON.stringify(await probe()));
await page.evaluate(() => { __eq.profile.avatar = 'hero'; __eq.applyLook(); });
await page.waitForFunction(() => __eq.player.root.getObjectByName('Outfit_dress'), null, { timeout: 300000 });
await page.waitForTimeout(3000);
console.log('HERO_HEAD', JSON.stringify(await headBox()));
console.log('HERO', JSON.stringify(await probe()));
await browser.close(); server.close();

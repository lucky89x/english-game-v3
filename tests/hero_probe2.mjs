// Where do hung accessories end up for Ngọc and for the hero? node tests/hero_probe2.mjs
import { serve, open } from './shot.mjs';
const { server, url } = await serve(); const { browser, page } = await open(url, { width: 640, height: 400 });
await page.click('#mnew'); await page.fill('#mname', 'An'); await page.click('[data-g="6"]'); await page.click('#mgo');
await page.waitForFunction(() => globalThis.__eq.started, null, { timeout: 300000 });
const KINDS = { glasses: ['face', 'glasses:black'], hat: ['head', 'hat:red'], scarf: ['neck', 'scarf:red'], tiara: ['head', 'tiara:gold'], bag: ['back', 'bag:blue'], bow: ['hair', 'bow:pink'] };
const probe = () => page.evaluate(async (KINDS) => {
  const out = {}; const root0 = () => __eq.player.root;
  for (const [k, [slot, id]] of Object.entries(KINDS)) {
    const w = __eq.profile.wardrobe || (__eq.profile.wardrobe = { owned: [], worn: {} }); w.worn = { [slot]: id }; w.owned = [id]; __eq.applyLook();
    await new Promise((r) => setTimeout(r, 7000)); __eq.applyLook(); await new Promise((r) => setTimeout(r, 1500));
    const root = root0(); root.updateMatrixWorld(true); const found = [];
    root.traverse((o) => { if (o.isBone) for (const c of o.children) if (!c.isBone) found.push([o.name, c]); });
    const V3 = root.position.constructor, names = found.filter(([b, c]) => !/^(Hero|Ngoc|Outfit|Gear|Hair|thick)/.test(c.name || '')).map(([b, c]) => { const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; c.traverse((m) => { if (m.isMesh && m.geometry) { m.geometry.computeBoundingBox(); const bb = m.geometry.boundingBox; for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) { const p = new V3(x, y, z).applyMatrix4(m.matrixWorld); const q = [p.x - root.position.x, p.y - root.position.y, p.z - root.position.z]; for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], q[a]); mx[a] = Math.max(mx[a], q[a]); } } } }); return { bone: b, name: c.name, min: mn.map((v) => +v.toFixed(2)), max: mx.map((v) => +v.toFixed(2)) }; });
    out[k] = names.slice(0, 4);
  }
  return out; }, KINDS);
console.log('NGOC', JSON.stringify(await probe()));
await page.evaluate(() => { __eq.profile.avatar = 'hero'; __eq.applyLook(); });
await page.waitForFunction(() => __eq.player.root.getObjectByName('Outfit_dress'), null, { timeout: 300000 });
await page.waitForTimeout(3000);
console.log('HERO', JSON.stringify(await probe()));
await browser.close(); server.close();

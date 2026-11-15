// node tests/profile.mjs — lists what is drawn in the village: triangles and draw calls by object (needs main.js to expose the scene).
import { serve, open } from './shot.mjs';
const { server, url } = await serve(); const { browser, page } = await open(url);
await page.click('#mnew'); await page.fill('#mname', 'An'); await page.click('[data-g="6"]'); await page.click('#mgo');
await page.waitForFunction(() => globalThis.__eq.started); await page.waitForTimeout(1500);
const rows = await page.evaluate(() => { const out = []; __eq.scene.traverse((o) => { if (!(o.isMesh || o.isPoints) || !o.geometry) return; let v = true; for (let p = o; p; p = p.parent) if (!p.visible) v = false; if (!v) return;
  const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); let top = o; while (top.parent && top.parent.parent && top.parent.parent.parent) top = top.parent;
  out.push({ name: (top.name || top.type) + '/' + (o.name || o.type), tris: Math.round(n), shadow: o.castShadow, geo: g.type + (o.isInstancedMesh ? ' x' + o.count : ''), at: [Math.round(o.getWorldPosition(new o.position.constructor()).x), Math.round(o.getWorldPosition(new o.position.constructor()).z)] }); }); return out; });
const by = {}; for (const r of rows) { const k = r.name.replace(/[_.]?\d+$/, ''); by[k] = by[k] || { tris: 0, calls: 0 }; by[k].tris += r.tris; by[k].calls += 1; }
const list = Object.entries(by).sort((a, b) => b[1].tris - a[1].tris);
console.log('meshes', rows.length, 'triangles', rows.reduce((a, r) => a + r.tris, 0));
for (const [k, v] of list.slice(0, 22)) console.log(String(v.tris).padStart(8), String(v.calls).padStart(4), k);
console.log('--- biggest single meshes'); for (const r of rows.sort((a, b) => b.tris - a.tris).slice(0, 14)) console.log(String(r.tris).padStart(8), r.geo, r.at.join(','), r.name);
const geoBy = {}; for (const r of rows) { const k = r.geo.replace(/ x\d+/, ''); geoBy[k] = geoBy[k] || [0, 0]; geoBy[k][0] += r.tris; geoBy[k][1] += 1; }
console.log('--- by geometry type'); for (const [k, v] of Object.entries(geoBy).sort((a, b) => b[1][0] - a[1][0]).slice(0, 12)) console.log(String(v[0]).padStart(8), String(v[1]).padStart(4), k);
await browser.close(); server.close();

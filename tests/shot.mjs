// Quick look: node tests/shot.mjs <out.png> [x z yaw pitch dist] — serves web-rebuild/ and screenshots.
import { chromium } from 'playwright';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.glb': 'model/gltf-binary', '.png': 'image/png' };
export function serve(port = 0) {
  const sizes = {};
  const server = http.createServer((req, res) => {
    const f = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    const data = fs.readFileSync(f); sizes[path.relative(root, f)] = data.length;
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(data);
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok({ server, sizes, url: `http://127.0.0.1:${server.address().port}/` })));
}
export async function open(url, size = { width: 1280, height: 720 }) {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  const page = await browser.newPage({ viewport: size }); const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
  await page.goto(url);
  await page.waitForFunction(() => globalThis.__eq && !document.getElementById('menu').classList.contains('hidden') || (globalThis.__eq && globalThis.__eq.errors.length), null, { timeout: 120000 });
  return { browser, page, logs };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [out, x, z, yaw, pitch, dist] = process.argv.slice(2);
  const { server, url } = await serve(); const { browser, page, logs } = await open(url);
  await page.click('#mnew'); await page.fill('#mname', 'An'); await page.click('[data-g="6"]'); await page.click('#mgo');
  await page.waitForFunction(() => globalThis.__eq.started);
  if (x !== undefined) await page.evaluate(([x, z, yaw, pitch, dist]) => { const g = __eq; g.teleport(+x, +z); g.cam.yaw = g.cam.tYaw = +yaw; g.cam.pitch = g.cam.tPitch = +pitch; g.cam.dist = g.cam.tDist = g.cam.cur = +dist; }, [x, z, yaw, pitch, dist]);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: out });
  console.log(JSON.stringify(await page.evaluate(() => ({ stats: __eq.stats, errors: __eq.errors }))), logs.slice(0, 8));
  await browser.close(); server.close();
}

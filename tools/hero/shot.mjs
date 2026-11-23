// node tools/hero/shot.mjs <out.png> "hero=ngoc&outfit=1&clip=Run&view=side&n=8"   (contact sheet of a hero clip from tools/hero/viewer.html)
import { serve } from '../../tests/shot.mjs';
import { chromium } from 'playwright';
const [out, qs = ''] = process.argv.slice(2);
const { server, url } = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const params = new URLSearchParams(qs), W = +(params.get('w') || 1400), H = +(params.get('h') || 420);
const page = await browser.newPage({ viewport: { width: W, height: H } }); page.setDefaultTimeout(120000);
page.on('pageerror', (e) => console.log('ERR', e.message)); page.on('console', (m) => m.type() === 'error' && console.log('CON', m.text()));
await page.goto(url + 'tools/hero/viewer.html?' + qs); await page.waitForFunction(() => window.DONE, null, { timeout: 120000 });
await page.screenshot({ path: out }); console.log(JSON.stringify(await page.evaluate(() => window.INFO)));
await browser.close(); server.close();

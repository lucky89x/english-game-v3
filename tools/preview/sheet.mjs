// node tools/preview/sheet.mjs <out.png> "files=fishing/fish_carp,prop_boat_v01&cols=5&cell=240"  (prints each model's size, triangles, clips)
import { serve } from '../../tests/shot.mjs';
import { chromium } from 'playwright';
const [out, qs = ''] = process.argv.slice(2), params = new URLSearchParams(qs), n = (params.get('files') || '').split(',').filter(Boolean).length, cols = +(params.get('cols') || 5), cell = +(params.get('cell') || 240);
const { server, url } = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: cols * cell, height: Math.ceil(n / cols) * cell } }); page.setDefaultTimeout(120000);
page.on('pageerror', (e) => console.log('ERR', e.message));
await page.goto(url + 'tools/preview/modelsheet.html?' + qs); await page.waitForFunction(() => window.DONE, null, { timeout: 120000 });
await page.screenshot({ path: out, omitBackground: params.get('alpha') === '1' }); console.log(JSON.stringify(await page.evaluate(() => window.INFO), null, 0));
await browser.close(); server.close();

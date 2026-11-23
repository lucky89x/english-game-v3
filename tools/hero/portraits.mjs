// node tools/hero/portraits.mjs  → assets/ui/hero_<id>_<outfit>.png (transparent, 240x360) for the hero chooser, Mia's shop and the wardrobe
import { serve } from '../../tests/shot.mjs';
import { chromium } from 'playwright';
import path from 'node:path'; import { fileURLToPath } from 'node:url';
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../assets/ui');
const { server, url } = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 240, height: 360 } }); page.setDefaultTimeout(120000);
page.on('pageerror', (e) => console.log('ERR', e.message));
for (const hero of (process.env.HEROES || 'ngoc,honglien,haothien').split(',')) for (let o = 0; o <= 4; o++) {
  await page.goto(`${url}tools/hero/viewer.html?hero=${hero}&outfit=${o + 1}&clip=Idle&view=three&n=1&w=240&h=360&alpha=1&dist=4.0&cy=0.9`);
  await page.waitForFunction(() => window.DONE, null, { timeout: 120000 });
  await page.screenshot({ path: path.join(out, `hero_${hero}_${o}.png`), omitBackground: true }); console.log(hero, o);
}
await browser.close(); server.close();

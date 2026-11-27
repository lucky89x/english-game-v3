// A save made by the game of 25/11 (old e2e run) is loaded by today's game.
//   node tests/save_old.mjs [file]   (default: tests/fixtures/save_2026-11-25.json; ~25 minutes without a GPU)
import fs from 'node:fs';
import { chromium } from 'playwright';
import { serve } from './shot.mjs';
const file = JSON.parse(fs.readFileSync(process.argv[2] || new URL('./fixtures/save_2026-11-25.json', import.meta.url), 'utf8')), old = file.storage || file;
const oldStore = JSON.parse(old['english-quest-web']);
let failed = 0; const check = (ok, name) => { if (!ok) failed++; console.log((ok ? 'PASS: ' : 'FAIL: ') + name); };
const { server, url } = await serve();
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }); page.setDefaultTimeout(180000); const logs = [];
page.on('console', (m) => { if (m.type() === 'error') logs.push('error: ' + m.text()); });
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.addInitScript((data) => { if (!localStorage.getItem('__seeded')) { for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v); localStorage.setItem('__seeded', '1'); } }, old);
const ev = (f, a) => page.evaluate(f, a); const wait = (ms) => page.waitForTimeout(ms);
const menu = () => page.waitForFunction(() => globalThis.__eq && (!document.getElementById('menu').classList.contains('hidden') || __eq.errors.length), null, { timeout: 600000 });
const pick = async (name) => { await page.click(`[data-profile]:has-text("${name}")`); await page.waitForFunction(() => __eq.started, null, { timeout: 300000 }); await ev(() => { __eq.voiceDisable(true); __eq.friendsStay = true; }); };
const noErr = async (what) => { const e = await ev(() => __eq.errors.slice()); const bad = logs.filter((l) => !l.includes('ReadPixels') && !l.includes('GPU stall')); check(e.length === 0 && bad.length === 0, `${what}: no script errors` + (e.length || bad.length ? ' — ' + JSON.stringify([...e, ...bad]).slice(0, 400) : '')); };

await page.goto(url); await menu();
await noErr('boot with the old save');
const card = await page.textContent('#menucard');
for (const p of oldStore.profiles) check(card.includes(p.name), `the menu lists ${p.name} (grade ${p.grade})`);
const o = oldStore.profiles.find((p) => p.name === 'An');
await pick('An');
await noErr('entering the game as An');
const diff = (a, b) => { const out = []; for (const k of Object.keys(a)) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) out.push(k); return out; };
let n = await ev(() => JSON.parse(JSON.stringify(__eq.profile)));
console.log('old keys :', Object.keys(o).join(' '));
console.log('new keys :', Object.keys(n).filter((k) => !(k in o)).join(' ') || '(none added)');
const changed = diff(o, n);
for (const k of changed) console.log(`  changed ${k}: ${JSON.stringify(o[k]).slice(0, 300)}  ->  ${JSON.stringify(n[k]).slice(0, 300)}`);
check(n.stats.level === o.stats.level && n.stats.gold === o.stats.gold && n.stats.exp === o.stats.exp, `level ${o.stats.level}, gold ${o.stats.gold}, exp ${o.stats.exp} are the same (now ${n.stats.level}, ${n.stats.gold}, ${n.stats.exp})`);
check(Object.keys(o.words).every((w) => w in n.words), `all ${Object.keys(o.words).length} review words are kept`);
check(Object.keys(o.quests).every((q) => JSON.stringify(n.quests[q]) === JSON.stringify(o.quests[q])), `all ${Object.keys(o.quests).length} quest records are the same`);
check(Object.keys(o.flags).every((f) => JSON.stringify(n.flags[f]) === JSON.stringify(o.flags[f])), `all ${Object.keys(o.flags).length} flags are the same`);
check(Object.keys(o.skills).every((s) => JSON.stringify(n.skills[s]) === JSON.stringify(o.skills[s])), `all ${Object.keys(o.skills).length} skill counters are the same`);
const lost = Object.keys(o).filter((k) => !(k in n)); check(lost.length === 0, 'no field of the old profile is dropped' + (lost.length ? ': ' + lost.join(' ') : ''));
check(await ev((r) => __eq.region === r, o.region || 'village'), `the child is back in the land where the old game stopped (${o.region})`);
// the panels and places that read the save
for (const key of ['KeyI', 'KeyO', 'KeyB']) { await page.keyboard.press(key); await wait(2500); await page.keyboard.press('Escape'); await wait(1500); }
await noErr('bag, world map, word book');
for (const r of ['village', 'harbor', 'forest']) { await ev((r) => __eq.enterRegion(r), r); await page.waitForFunction((r) => __eq.region === r && __eq.started, r, { timeout: 300000 }); await wait(4000); await noErr('land ' + r); }
await ev(() => __eq.goHome()); await page.waitForFunction(() => __eq.room, null, { timeout: 300000 }); await wait(4000); await noErr('the home');
await page.keyboard.press('Escape'); await wait(1500); await page.keyboard.press('Escape'); await page.waitForFunction(() => !__eq.room, null, { timeout: 300000 }).catch(() => console.log('  (did not leave the home with Escape)'));
// what today's game wrote back, then a restart
const after = await ev(() => JSON.parse(localStorage.getItem('english-quest-web')));
check(after.version === 2 && after.profiles.length === oldStore.profiles.length, `today's game saved ${after.profiles.length} profiles, version ${after.version}`);
const a2 = after.profiles.find((p) => p.name === 'An'); check(a2 && a2.stats.level === o.stats.level && a2.stats.gold === o.stats.gold && Object.keys(a2.words).length >= Object.keys(o.words).length, 'the rewritten save still has An\'s level, gold and words');
check(!!(await ev(() => localStorage.getItem('english-quest-web.bak'))), 'the save before the last one is kept as a spare (.bak)');
await page.reload(); await menu(); await pick('An');
n = await ev(() => JSON.parse(JSON.stringify(__eq.profile)));
check(n.stats.level === o.stats.level && n.stats.gold === o.stats.gold && Object.keys(o.words).every((w) => w in n.words), 'after a restart An still has the same level, gold and words');
await noErr('after the restart');
// the second child
const m = oldStore.profiles.find((p) => p.name !== 'An');
if (m) { await page.reload(); await menu(); await pick(m.name); const q = await ev(() => JSON.parse(JSON.stringify(__eq.profile)));
  check(q.name === m.name && q.grade === m.grade && q.stats.gold === m.stats.gold && JSON.stringify(q.quests) === JSON.stringify(m.quests), `${m.name} (grade ${m.grade}) is untouched`); await noErr('the second child'); }
console.log(failed ? `\n${failed} FAILED` : '\nall passed');
await browser.close(); server.close(); process.exit(failed ? 1 : 0);

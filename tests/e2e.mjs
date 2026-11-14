// Real-browser end-to-end test (Playwright + Chromium). node tests/e2e.mjs [--shots dir]
// Covers: boot without console errors, profile creation, real key movement, camera 360°, camera
// collision, bridge crossing, minimap travel + refusal of water, quest from first clue to the ending,
// hints, wrong crystal, save + reload, second profile isolation, quality presets, three viewports.
import fs from 'node:fs'; import path from 'node:path'; import { serve, open } from './shot.mjs';
let failed = 0; const results = [];
const check = (ok, name) => { results.push((ok ? 'PASS: ' : 'FAIL: ') + name); if (!ok) failed++; console.log(results.at(-1)); };
const shots = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
if (shots) fs.mkdirSync(shots, { recursive: true });
const { server, url, sizes } = await serve(); const { browser, page, logs } = await open(url);
const ev = (f, a) => page.evaluate(f, a);
const wait = (ms) => page.waitForTimeout(ms);
const snap = async (name) => { if (shots) await page.screenshot({ path: path.join(shots, name + '.jpg'), type: 'jpeg', quality: 80 }); };
const view = (x, z, yaw, pitch, dist) => ev(([x, z, yaw, pitch, dist]) => { const g = __eq; g.teleport(x, z); g.player.yaw = yaw + Math.PI; g.cam.yaw = g.cam.tYaw = yaw; g.cam.pitch = g.cam.tPitch = pitch; g.cam.dist = g.cam.tDist = g.cam.cur = dist; }, [x, z, yaw, pitch, dist]);

check(await ev(() => __eq.errors.length === 0), 'Boot: no script errors');
check(await page.isVisible('#menu'), 'Profile menu shown on start');
await page.click('#mnew'); await page.fill('#mname', 'An'); await page.click('[data-g="6"]'); await page.click('#mgo');
await page.waitForFunction(() => __eq.started, null, { timeout: 60000 });
check(await ev(() => __eq.profile.name === 'An' && __eq.profile.grade === 6), 'Profile An (grade 6) created');
await wait(1500); await snap('01_gate');

// movement with real keys
const p0 = await ev(() => ({ x: __eq.player.pos.x, z: __eq.player.pos.z }));
await page.keyboard.down('KeyW'); await wait(1500); await page.keyboard.up('KeyW');
const p1 = await ev(() => ({ x: __eq.player.pos.x, z: __eq.player.pos.z, anim: __eq.player.current }));
check(Math.hypot(p1.x - p0.x, p1.z - p0.z) > 1.5, 'W moves Ngọc (real key)');
await page.keyboard.down('ShiftLeft'); await page.keyboard.down('KeyW'); await wait(800);
check(await ev(() => __eq.player.current === 'Run'), 'Shift+W plays Run');
await page.keyboard.up('KeyW'); await page.keyboard.up('ShiftLeft'); await wait(500);
check(await ev(() => __eq.player.current === 'Idle'), 'Stops into Idle');
await page.keyboard.down('Space'); await wait(350); await page.keyboard.up('Space');
check(await ev(() => !__eq.player.grounded), 'Space jumps');
await wait(1500);
check(await ev(() => __eq.player.grounded), 'Lands again');

// camera: drag 360°, wheel zoom, collision
const yaw0 = await ev(() => __eq.cam.tYaw);
await page.mouse.move(640, 400); await page.mouse.down();
for (let i = 0; i < 12; i++) await page.mouse.move(640 + (i + 1) * 90, 400);
await page.mouse.up();
check(Math.abs((await ev(() => __eq.cam.tYaw)) - yaw0) > Math.PI * 2, 'Left-drag rotates the camera more than 360°');
const d0 = await ev(() => __eq.cam.tDist); await page.mouse.move(640, 400); await page.mouse.wheel(0, 400);
check((await ev(() => __eq.cam.tDist)) > d0, 'Wheel zooms the camera');
await view(-37, 9.5, -1.57, 0.3, 14); await wait(1200);            // cottage is right behind the camera direction
check(await ev(() => __eq.cam.cur < 13 && __eq.cam.camera.position.y > __eq.L.groundHeight(__eq.cam.camera.position.x, __eq.cam.camera.position.z)), 'Camera is pulled in front of the cottage and stays above ground');

// Tom's intro with real E key, then the quest
await ev(() => __eq.teleport(__eq.L.ENTRANCE.x + 1.2, __eq.L.ENTRANCE.z - 11)); await wait(600);
await page.keyboard.press('KeyE'); await wait(300);
check(await page.isVisible('#dialog') && (await page.textContent('#dialog')).includes('Forest of Memories'), 'E on Tom opens the English intro');
check(!(await page.textContent('#dialog .en')).match(/[àáảãạăâđêôơư]/i), 'English line has no Vietnamese mixed in');
for (let i = 0; i < 4; i++) { await page.keyboard.press('KeyE'); await wait(200); }
check(await ev(() => __eq.quest.step === 'seek' && __eq.quest.q.order.length === 5), 'Quest starts with 5 targets');
const clue1 = await page.textContent('#clue .en');
check(clue1.length > 10 && !(await page.isVisible('#clue .vi')), 'Clue card shows English only (no translation yet)');
await page.keyboard.press('KeyH'); await wait(150);
check((await page.innerHTML('#clue')).includes('<mark>') && !(await page.isVisible('#clue .vi')), 'Hint 1 highlights the keyword only');
await page.keyboard.press('KeyH'); await wait(150);
check(await page.isVisible('#clue .vi'), 'Hint 2 shows the Vietnamese meaning');
await page.keyboard.press('KeyH'); await wait(150);
check(await ev(() => __eq.quest.q.hint === 3), 'Hint 3 puts a marker on the minimap');

// wrong crystal with the real E key
const { target, wrong } = await ev(() => { const q = __eq.quest; return { target: q.targetId, wrong: q.crystalIds().find((id) => id !== q.targetId) }; });
await ev((id) => { const s = __eq.L.LANDMARKS.find((l) => l.id === id).spot; __eq.teleport(s[0] + 0.9, s[1] + 0.6); }, wrong); await wait(500);
check((await page.textContent('#prompt')).includes('pha lê'), 'Prompt appears next to a crystal');
await page.keyboard.press('KeyE'); await wait(300);
check((await page.textContent('#dialog')).includes('Not here'), 'Wrong crystal: Pip explains what this place is');
await page.keyboard.press('KeyE'); await wait(200);
check(await ev(() => __eq.quest.q.found.length === 0 && __eq.profile.stats.gold === 0), 'Wrong crystal gives nothing');

// minimap: refuses water, travels on a route across the bridge
check(await ev(() => __eq.minimap.travelTo(__eq.L.riverX(0), 0) === false), 'Minimap refuses a destination in the river');
check(await ev(() => __eq.minimap.travelTo(17, -30) === false), 'Minimap refuses a destination inside the ancient tree');
await ev(() => __eq.teleport(-27, 37)); await wait(300);
const routeOk = await ev(() => __eq.minimap.travelTo(-2, 38));
check(routeOk && await ev(() => __eq.player.route && __eq.player.route.length > 8), 'Minimap click plans a route to the far bank');
let top = 0, arrived = false, wet = false;
for (let i = 0; i < 80 && !arrived; i++) { await wait(250); const s = await ev(() => ({ x: __eq.player.pos.x, y: __eq.player.pos.y, z: __eq.player.pos.z, r: !!__eq.player.route, w: __eq.L.inWater(__eq.player.pos.x, __eq.player.pos.z) })); top = Math.max(top, s.y); wet = wet || s.w; arrived = !s.r && Math.hypot(s.x + 2, s.z - 38) < 2.5; }
check(arrived && top > 0.7 && !wet, 'Auto-travel crosses the arched bridge and arrives dry (peak y ' + top.toFixed(2) + ')');
await ev(() => __eq.minimap.travelTo(20, 43)); await wait(400);
await page.keyboard.down('KeyS'); await wait(300); await page.keyboard.up('KeyS');
check(await ev(() => !__eq.player.route), 'Manual key cancels automatic travel');
const z0 = await ev(() => __eq.minimap.zoom); await page.mouse.move(1150, 130); await page.mouse.wheel(0, -300);
check(await ev((z) => __eq.minimap.zoom > z, z0) && Math.abs((await ev(() => __eq.cam.tDist)) - (await ev(() => __eq.cam.tDist))) < 1e-9, 'Wheel over the minimap zooms the map');

// finish the quest: right crystals with real E, then the ancient tree challenge with number keys
for (let n = 0; n < 5; n++) {
  const id = await ev(() => __eq.quest.targetId);
  await ev((id) => { const s = __eq.L.LANDMARKS.find((l) => l.id === id).spot; __eq.teleport(s[0] + 0.8, s[1] + 0.5); }, id); await wait(450);
  await page.keyboard.press('KeyE'); await wait(300);
  if (n === 1) await snap('06_crystal_found');
  for (let k = 0; k < 3 && await page.isVisible('#dialog'); k++) { await page.keyboard.press('KeyE'); await wait(200); }
}
check(await ev(() => __eq.quest.step === 'tree' && __eq.quest.q.found.length === 5), 'Five crystals found → go to the ancient tree');
check(await ev(() => __eq.profile.stats.gold > 0 && Object.keys(__eq.profile.words).length >= 5), 'Gold earned and words stored for review');
await ev(() => { const s = __eq.L.LANDMARKS.find((l) => l.id === 'tree').spot; __eq.teleport(s[0] + 0.5, s[1] + 0.8); }); await wait(500);
await page.keyboard.press('KeyE'); await wait(300);
for (let n = 0; n < 3; n++) {
  const idx = await ev((n) => { const want = __eq.L.LANDMARKS.find((l) => l.id === __eq.quest.q.order[n]).en; return __eq.ui.options.indexOf(want); }, n);
  if (n === 0) await snap('07_tree_challenge');
  await page.keyboard.press('Digit' + (idx + 1)); await wait(300);
}
check(await ev(() => __eq.quest.step === 'done' && __eq.profile.flags.compass_piece_forest === true), 'Tree challenge answered with number keys → chapter ending');
for (let k = 0; k < 4; k++) { await page.keyboard.press('KeyE'); await wait(200); }

// save / reload / second profile
const before = await ev(() => ({ gold: __eq.profile.stats.gold, words: Object.keys(__eq.profile.words).length }));
await page.reload(); await page.waitForFunction(() => globalThis.__eq && !document.getElementById('menu').classList.contains('hidden'), null, { timeout: 120000 });
check((await page.textContent('#menucard')).includes('An · Lớp 6'), 'After reload the profile is listed');
await page.click('[data-profile]'); await page.waitForFunction(() => __eq.started, null, { timeout: 60000 });
check(await ev((b) => __eq.quest.step === 'done' && __eq.profile.stats.gold === b.gold && Object.keys(__eq.profile.words).length === b.words, before), 'Progress, gold and review words survive a reload');
const saved = await ev(() => JSON.parse(localStorage.getItem('english-quest-web')));
check(saved.version === 2 && saved.profiles.length === 1, 'Save is versioned JSON in localStorage');
await page.click('#gp'); await page.click('#mnew'); await page.fill('#mname', 'Minh'); await page.click('[data-g="9"]'); await page.click('#mgo');
await page.waitForFunction(() => __eq.started && __eq.profile.name === 'Minh', null, { timeout: 60000 });
check(await ev(() => __eq.profile.stats.gold === 0 && __eq.quest.step === 'intro'), 'Second profile (grade 9) starts fresh');
await ev(() => __eq.quest.start());
const g9 = await ev(() => ({ text: __eq.quest.clue.text, en: __eq.L.LANDMARKS.find((l) => l.id === __eq.quest.targetId).en }));
check(!g9.text.toLowerCase().includes(g9.en), 'Grade 9 clue paraphrases the place instead of naming it');

// quality presets + viewports + screenshots
const perf = {};
for (const q of ['low', 'medium', 'high']) { await ev((q) => __eq.setQuality(q), q); await view(-10, 30, 1.9, 0.42, 13); await wait(2500); perf[q] = await ev(() => __eq.stats); }
check(perf.low.tris < perf.high.tris && perf.low.calls <= perf.high.calls, `Low quality draws less (${perf.low.tris} < ${perf.high.tris} triangles)`);
await ev(() => __eq.setQuality('medium'));
const SPOTS = { '02_riverside': [-10, 30, 1.9, 0.42, 13], '03_ancient_tree': [24, -12, -0.35, 0.16, 17], '04_cave': [47, 3, -1.75, 0.22, 9], '05_camp': [27, 41, -0.95, 0.32, 10], '08_mushrooms': [34.5, 23, -1.45, 0.26, 9], '09_ruins': [-38.5, -32, 0.85, 0.28, 10], '10_tower': [43.5, -35, -0.75, 0.16, 14], '11_cottage': [-33, 12, 1.25, 0.3, 11], '12_closeup': [-30, 49, 2.9, 0.1, 3.0], '13_bridge': [-27.5, 35.5, -1.2, 0.26, 9] };
for (const [name, v] of Object.entries(SPOTS)) { await view(...v); await wait(1500); await snap(name); }
for (const [w, h] of [[1920, 1080], [1024, 600]]) { await page.setViewportSize({ width: w, height: h }); await wait(1200);
  const ok = await ev(() => { const r = (id) => document.getElementById(id).getBoundingClientRect(); const a = r('hud'), c = r('clue'), m = r('mapbox'); return a.right <= c.left + 2 && c.right <= m.left + 2 && m.right <= innerWidth && c.width > 250; });
  check(ok, `HUD, clue card and minimap do not overlap at ${w}x${h}`); if (w === 1024) await snap('14_low_res_1024x600'); }
await page.setViewportSize({ width: 1280, height: 720 });
const noise = logs.filter((l) => !l.includes('ReadPixels') && !l.includes('GPU stall'));
check((await ev(() => __eq.errors.length)) === 0 && noise.filter((l) => l.startsWith('error') || l.startsWith('pageerror')).length === 0, 'No console errors during the whole run' + (noise.length ? ' — ' + noise[0].slice(0, 160) : ''));
const total = Object.values(sizes).reduce((a, b) => a + b, 0);
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'docs', 'measurements.json'), JSON.stringify({ date: new Date().toISOString().slice(0, 10), renderer: 'Chromium headless + SwiftShader (software GL, no GPU)', downloadBytes: total, files: Object.fromEntries(Object.entries(sizes).sort((a, b) => b[1] - a[1])), perf, checks: results.length, failed }, null, 1));
console.log(`\n${results.length - failed}/${results.length} passed · download ${(total / 1048576).toFixed(2)} MB · perf ${JSON.stringify(perf)}`);
await browser.close(); server.close(); process.exit(failed ? 1 : 0);

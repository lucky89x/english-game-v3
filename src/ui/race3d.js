// Kart Race 3D (23/11): the user's own race prototype (Village_Arcade/Race/Play.html, models in assets/models/race) made into the
// game's race. A closed track of three laps, six karts to choose from, three rivals, letters of the unit's words to collect and
// spell, coins, cones, and (new) item boxes: a boost, or a shot that spins the kart ahead. A speed pad now and then, a mini map,
// a countdown and a garage. It is drawn with its own WebGL renderer onto the arcade's 2D canvas (so the arcade's window, input,
// results and word rewards work as for every other board game).
import * as THREE from 'three';
import * as SP from '../core/spell.js';
import { speak } from './speech.js';
import { startEngine, engineSpeed, stopEngine, raceSfx } from '../audio.js';
import { rule } from '../core/tiers.js';

export const KART_NAMES = ['scarlet', 'azure', 'dune', 'violet', 'ranger', 'blossom'];
export const KART_LABEL = ['Đỏ san hô', 'Xanh biển', 'Buggy vàng', 'Tím', 'Buggy xanh lá', 'Hồng'];
export const RACE_FILES = [...KART_NAMES.map((n) => `race/kart_${n}`), ...['race_start_gate', 'race_grandstand', 'race_pit_tent', 'race_scoreboard', 'race_podium', 'race_chevron', 'race_flag', 'race_tire_stack', 'race_cone', 'race_hay_bales', 'race_lamp', 'race_banner', 'race_safety_barrier', 'bld_farm_barn', 'bld_anna_house', 'stall_fruit'].map((n) => `race/${n}`), 'prop_tree_pine_v01', 'prop_tree_round_v01'];
/** Loads every file with the game's cached loader (gltf(name) → { scene }); resolves to { shortName: scene }. */
export async function loadRaceAssets(gltf) {
  const out = {};
  await Promise.all(RACE_FILES.map(async (f) => { const g = await gltf(f); g.scene.traverse((o) => { if (o.isMesh) for (const m of [].concat(o.material)) m.side = THREE.DoubleSide; }); out[f.replace(/^race\//, '')] = g.scene; }));
  return out;
}

// (24/11) "the lane is too narrow, the speed too fast for the lap, and the circuit always a circle": a road half as wide again, a circuit of about 610 m
// with a long straight, a hairpin, an S-bend and a back straight (it was a 270 m oval), and a slower kart.
const HALF = 6.3, SC = HALF / 4.15, LANES = [-3.75, 0, 3.75], LAPS = 3, TAU = Math.PI * 2;
const CURVE_PTS = [[-90, -70], [-30, -74], [40, -74], [92, -66], [116, -36], [108, 0], [84, 22], [56, 16], [34, 34], [8, 58], [-30, 60], [-70, 46], [-104, 20], [-116, -18], [-110, -52]];
const SPEED = { cruise: 16, boost: 26, brake: 6, off: 8, hurt: 10 };
const damp = (a, b, lambda, dt) => THREE.MathUtils.damp(a, b, lambda, dt);

let shared = null;      // one WebGL renderer for every race (a second context per race would leak)
function renderer() {
  if (!shared) { const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }); r.setPixelRatio(1); r.outputColorSpace = THREE.SRGBColorSpace; shared = r; }
  return shared;
}
function token(text, fill = '#ffcf57', ink = '#533a22', rim = '#8e5425') {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = fill; g.beginPath(); g.arc(64, 64, 54, 0, 7); g.fill(); g.strokeStyle = rim; g.lineWidth = 6; g.stroke();
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 69px Segoe UI, sans-serif'; g.fillText(text, 64, 67);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/** opts: { assets (from loadRaceAssets), cards (the unit's words), tier, rnd } */
export function raceGame3d({ assets, cards = [], tier = 1, rnd = Math.random }) {
  const R = rule('race', tier), own = [];      // own: geometries and materials made here, disposed at the end
  const mk = (x) => { own.push(x); return x; };
  const words = cards.filter((c) => SP.spellable(c.word) && SP.letters(c.word).length >= 3 && SP.letters(c.word).length <= 8).sort(() => rnd() - 0.5).slice(0, 8);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(55, 1.5, 0.12, 700);
  const curve = new THREE.CatmullRomCurve3(CURVE_PTS.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal'); curve.arcLengthDivisions = 4000;
  const length = curve.getLength(), finish = LAPS * length;
  const at = (d, x = 0) => { const t = (((d % length) + length) % length) / length, p = curve.getPointAt(t), f = curve.getTangentAt(t); p.x -= f.z * x; p.z += f.x * x; return [p, Math.atan2(f.x, f.z)]; };
  const model = (n) => { const m = assets[n].clone(true); return m; };
  const put = (n, d, x, scale = 1, turn = 0) => { const o = model(n), [p, yaw] = at(d, x); o.position.copy(p); o.rotation.y = yaw + turn; o.scale.setScalar(scale); scene.add(o); return o; };

  // ---- the world (as in the prototype)
  scene.background = new THREE.Color(0x9fd9ee); scene.fog = new THREE.FogExp2(0xb9e0e7, 0.0042);
  scene.add(new THREE.HemisphereLight(0xfff2d7, 0xabbf9d, 2.0)); const sun = new THREE.DirectionalLight(0xfff1d7, 2.05); sun.position.set(-35, 55, -25); scene.add(sun);
  const ground = new THREE.Mesh(mk(new THREE.BoxGeometry(900, 0.3, 900)), mk(new THREE.MeshStandardMaterial({ color: 0x91ba68, roughness: 1 }))); ground.position.y = -0.22; scene.add(ground);
  const roadP = [], roadC = [];
  const quad = (p, c) => { const col = new THREE.Color(c); for (const i of [0, 1, 2, 0, 2, 3]) { roadP.push(...p[i].toArray()); roadC.push(col.r, col.g, col.b); } };
  const strip = (d0, d1, x0, x1, y, c) => quad([at(d0, x0)[0], at(d0, x1)[0], at(d1, x1)[0], at(d1, x0)[0]].map((p) => (p.y = y, p)), c);
  const SEGS = Math.round(length / 0.95);
  for (let j = 0; j < SEGS; j++) {
    const a = length * j / SEGS, b = length * (j + 1) / SEGS; strip(a, b, -HALF, HALF, 0, j % 28 < 14 ? 0x625f6c : 0x656270);
    for (const sg of [-1, 1]) strip(a, b, HALF * sg, (HALF + 0.5) * sg, 0.024, (j >> 1) % 2 ? 0xffeddd : 0xcb5147);
    if (j % 9 < 4) strip(a, b, -0.042, 0.042, 0.018, 0xffeac1);
  }
  for (let j = 0; j < Math.round(HALF * 4); j++) for (let k = 0; k < 2; k++) strip(k * 0.43, k * 0.43 + 0.43, -HALF + j * 0.5, -HALF + 0.5 + j * 0.5, 0.04, (j + k) % 2 ? 0xfff3e1 : 0x36353b);      // the start line
  const padSpots = [0.07, 0.17, 0.27, 0.38, 0.5, 0.62, 0.73, 0.85, 0.94].map((k, i) => [k * length, LANES[(i * 2 + 1) % 3]]);
  for (const [d, l] of padSpots) { strip(d, d + 4.2, l - 1.5, l + 1.5, 0.05, 0x2fd2ff); strip(d + 0.7, d + 1.5, l - 0.7, l + 0.7, 0.06, 0xdffbff); strip(d + 2.3, d + 3.1, l - 0.7, l + 0.7, 0.06, 0xdffbff); }      // speed pads
  const roadGeo = mk(new THREE.BufferGeometry()); roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadP, 3)); roadGeo.setAttribute('color', new THREE.Float32BufferAttribute(roadC, 3)); roadGeo.computeVertexNormals();
  scene.add(new THREE.Mesh(roadGeo, mk(new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, vertexColors: true }))));
  put('race_start_gate', 1, 0, 1.57 * SC, Math.PI); put('race_grandstand', 10, -8 * SC, 2.2, -Math.PI / 2); put('race_pit_tent', -9, 8 * SC, 1.9, Math.PI / 2); put('race_scoreboard', 13, 7 * SC, 1.65, Math.PI * 0.71); put('race_podium', 20, -7 * SC, 1.3, -Math.PI * 0.71);
  for (let j = 0; j < 110; j++) { const o = put(j % 4 ? 'prop_tree_pine_v01' : 'prop_tree_round_v01', j * length / 110, (j % 2 ? 1 : -1) * (9 + (j * 7) % 11) * SC, 1.0 + (j % 3) * 0.22, j); o.scale.multiplyScalar(0.7); }
  for (let j = 0; j < 46; j++) { const d = length * j / 46; if (j % 3 === 1) put('race_chevron', d, (HALF + 1.15), 1.25, Math.PI); if (j % 3 === 0) put('race_flag', d, -(HALF + 0.95), 1.4, Math.PI); if (j % 4 === 2) put('race_tire_stack', d, (HALF + 1.25), 1.3); if (j % 6 === 5) put('race_hay_bales', d, -(HALF + 1.45), 1.3); if (j % 6 === 0) put('race_lamp', d, (HALF + 1.45), 1.5); }
  for (const [b, d, x, sc] of [['bld_farm_barn', 34, 17, 1.65], ['bld_anna_house', 58, -16, 1.25], ['stall_fruit', -20, -10, 1.24], ['bld_farm_barn', length * 0.61, 20, 1.35], ['bld_anna_house', length * 0.44, -19, 1.55], ['bld_farm_barn', length * 0.12, 21, 1.5], ['bld_anna_house', length * 0.27, 19, 1.4], ['stall_fruit', length * 0.35, -13, 1.3], ['bld_farm_barn', length * 0.82, -21, 1.5], ['bld_anna_house', length * 0.93, 18, 1.35], ['stall_fruit', length * 0.7, 14, 1.3]]) put(b, d, x * SC * 0.8 + (x > 0 ? 3 : -3), sc, x > 0 ? 1.45 : -1.45);
  { const src = assets.race_safety_barrier; let bm = null; if (src) { src.updateMatrixWorld(true); src.traverse((o) => { if (o.isMesh && !bm) bm = o; }); }
    if (bm) {      // the user's safety barriers (24/11) on the outside of every corner, as instanced meshes
      const list = [], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(1.5, 1.5, 1.5);
      for (let d = 0; d < length; d += 2.6) { const y0 = at(d - 7)[1], y1 = at(d + 7)[1], dy = Math.atan2(Math.sin(y1 - y0), Math.cos(y1 - y0)); if (Math.abs(dy) < 0.2) continue; const [p, yaw] = at(d, Math.sign(dy) * (HALF + 1.15)); m4.compose(p, q.setFromEuler(e.set(0, yaw - Math.PI / 2, 0)), sc); list.push(m4.clone().multiply(bm.matrixWorld)); }
      if (list.length) { const im = new THREE.InstancedMesh(bm.geometry, bm.material, list.length); list.forEach((m, k) => im.setMatrixAt(k, m)); im.frustumCulled = false; scene.add(im); }
    } }
  const inst = (shape, list, lit = true) => {
    const mat = mk(lit ? new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }) : new THREE.MeshBasicMaterial()), batch = new THREE.InstancedMesh(mk(shape), mat, list.length), dummy = new THREE.Object3D();
    list.forEach(([pt, sc, color, rot], i) => { dummy.position.copy(pt); dummy.scale.fromArray(sc); dummy.quaternion.copy(rot || new THREE.Quaternion()); dummy.updateMatrix(); batch.setMatrixAt(i, dummy.matrix); batch.setColorAt(i, new THREE.Color(color)); });
    scene.add(batch);
  };
  const beams = [], blossoms = [], foliage = [], gravel = [], clouds = [], hills = [], snow = [], wild = [0xffc952, 0xff89a9, 0xb99af2, 0xffead2];
  const seg = (a, b, side, height, color) => { const delta = b.clone().sub(a), pos = a.clone().lerp(b, 0.5); beams.push([pos, [side, delta.length(), height], color, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize())]); };
  for (let i = 0; i < 230; i++) {      // a wooden fence both sides, flower pots and stones
    const d = length * i / 230;
    for (const s of [-1, 1]) {
      if (i % 46 < 3) continue;
      const [a] = at(d, (HALF + 1.45) * s), [b] = at(d + length / 230, (HALF + 1.45) * s); const post = a.clone(); post.y = 0.47; beams.push([post, [0.135, 0.94, 0.135], i % 3 ? 0x92552f : 0xa96636]);
      for (const h of [0.35, 0.69]) { const p = a.clone(), q = b.clone(); p.y = q.y = h; seg(p, q, 0.07, 0.097, 0xbf864d); }
      if (i % 3 === 0) { const [center] = at(d + 1.3, s * (HALF + 2.25 + (i % 5) * 0.35)); for (let j = 0; j < 6; j++) { const pot = center.clone().add(new THREE.Vector3(0.34 * Math.cos(j * 2.4), 0.12 + 0.06 * Math.sin(j), 0.32 * Math.sin(j * 2.4))); foliage.push([pot, [0.32, 0.22, 0.25], j % 2 ? 0x729b3c : 0x91b148]); for (let k = 0; k < 3; k++) blossoms.push([pot.clone().add(new THREE.Vector3(0.12 * Math.cos(k * 2.2), 0.18, 0.12 * Math.sin(k * 2.2))), [0.073, 0.052, 0.07], wild[(i + j) % 4]]); } }
      if (i % 4 === 0) { const [rock] = at(d + 1.8, s * (HALF + 2.45 + i % 5)); rock.y = 0.11; gravel.push([rock, [0.45, 0.22, 0.31], i % 2 ? 0xafada3 : 0xb7ab91]); }
    }
  }
  for (let j = 0; j < 30; j++) {      // far hills with snow caps and clouds
    const a = j * 2.399, rad = (170 + 50 * Math.sin(j) ** 2), h = 14 + 26 * (0.5 + 0.5 * Math.sin(j * 3.37)), p = new THREE.Vector3(Math.cos(a) * rad, -1, Math.sin(a) * rad);
    hills.push([p, [26 + j % 6 * 1.6, h, 28 + j % 9 * 1.6], j % 2 ? 0x6ca693 : 0x7fa6bc]); if (j % 3 === 0) snow.push([p.clone().add(new THREE.Vector3(0, h * 0.67, 0)), [6, h * 0.23, 6.5], 0xe4f5ef]);
    if (j % 3) continue; const sky = new THREE.Vector3(Math.cos(a) * 280, 39 + j % 12, Math.sin(a) * 280);
    for (let k = 0; k < 5; k++) clouds.push([sky.clone().add(new THREE.Vector3((k - 2) * 2.6, 2 * Math.sin(k * 0.8), 1.6 * Math.cos(k))), [9, 3.2 + 1.2 * Math.sin(k * 0.8), 5.5], 0xf8f7eb]);
  }
  inst(new THREE.BoxGeometry(1, 1, 1), beams); inst(new THREE.IcosahedronGeometry(1, 0), foliage); inst(new THREE.IcosahedronGeometry(1, 0), blossoms); inst(new THREE.DodecahedronGeometry(1, 0), gravel);
  inst(new THREE.IcosahedronGeometry(1, 1), hills); inst(new THREE.IcosahedronGeometry(1, 1), snow); inst(new THREE.SphereGeometry(1, 10, 6), clouds, false);

  // ---- karts
  let pick = 0, player = null; const rivals = [];
  const makeKart = (i) => {
    const o = model(`kart_${KART_NAMES[i]}`), shadow = new THREE.Mesh(mk(new THREE.CircleGeometry(1, 24)), mk(new THREE.MeshBasicMaterial({ color: 0x2d3037, transparent: true, opacity: 0.25, depthWrite: false })));
    shadow.rotation.x = -Math.PI / 2; shadow.scale.set(0.87, 1.22, 1); shadow.position.y = 0.035; o.add(shadow); scene.add(o); return o;
  };
  const choose = (i) => { pick = (i + 6) % 6; if (player) scene.remove(player); player = makeKart(pick); };
  choose(0);
  const others = () => [0, 1, 2, 3, 4, 5].filter((k) => k !== pick);
  const buildRivals = () => { for (const r of rivals) scene.remove(r.car); rivals.length = 0; others().slice(0, 3).forEach((k, j) => rivals.push({ car: makeKart(k), d: 0, lane: 0, rate: [14.0, 15.1, 16.0][j], stun: 0, spin: 0, num: j + 2 })); };
  buildRivals();

  // ---- things on the track: cones, coins, letters, item boxes, speed pads
  const items = [], tokens = new Map(), tok = (text, fill, ink, rim) => { const k = [text, fill, ink, rim].join('|'); if (!tokens.has(k)) tokens.set(k, token(text, fill, ink, rim)); return tokens.get(k); };
  const sprite = (map, size = 1.12) => { const s = new THREE.Sprite(mk(new THREE.SpriteMaterial({ map, depthWrite: false }))); s.scale.set(size, size, 1); scene.add(s); return s; };
  const wantWords = words.length > 0;
  for (let i = 0; i < 56; i++) {
    const d = (i + 0.85) * length / 56, l = LANES[i % 3];
    let kind = i % 5 === 2 ? 'cone' : i % 5 === 4 ? 'coin' : wantWords ? 'letter' : 'coin', o;
    if (kind === 'cone') o = put('race_cone', d, l, 1.65);
    else { o = sprite(tok(kind === 'coin' ? '★' : 'F')); o.position.copy(at(d, l)[0]); o.position.y = 0.96; }
    items.push({ d, l, kind, o, round: -1 });
  }
  for (let i = 0; i < 12; i++) { const d = (i + 0.42) * length / 12, l = LANES[(i * 2 + 2) % 3], o = sprite(tok('?', '#c78bff', '#ffffff', '#6a2ea8'), 1.25); o.position.copy(at(d, l)[0]); o.position.y = 1.05; items.push({ d, l, kind: 'box', o, round: -1 }); }
  for (const [d, l] of padSpots) items.push({ d: d + 1.5, l, kind: 'pad', o: null, round: -1 });

  // ---- state
  const g = { big: true, aspect: 1.5, title: '🏎 Kart Race', coins: 0 };
  g.help = 'Đua 3 vòng với 3 đối thủ. ← → (A D) lái, ↓ (S) phanh. Đi qua CHỮ CÁI tiếp theo của từ (nghĩa ở dưới) và xu ★. Ô ? cho tăng tốc hoặc đạn: bấm Space để dùng. Ván xanh = tăng tốc, tránh cọc.';
  let state = 'garage', elapsed = 0, countdown = 3, speed = 0, distance = 0, lane = 0, hurt = 0, boostT = 0, steer = 0, spinT = 0, letters = 0, wi = 0, flashText = '', pop = 0, endT = 0, item = null, t0 = 0, paused = false;
  const wordsDone = [], shots = [], dust = [];
  const place = () => 1 + rivals.filter((r) => r.d > distance).length;
  const flash = (text, s = 0.7) => { flashText = text; pop = s; };
  const cur = () => words[wi % Math.max(1, words.length)];
  const need = () => (wantWords ? SP.letters(cur().word)[letters] : '');
  const reset = () => { elapsed = distance = lane = speed = hurt = boostT = spinT = letters = wi = 0; item = null; g.coins = 0; wordsDone.length = 0; for (const s of shots) scene.remove(s.m); shots.length = 0; items.forEach((t) => { t.round = -1; if (t.o) t.o.visible = true; }); rivals.forEach((r, i) => { r.d = [2.7, 5.6, 8.5][i]; r.lane = (i - 1) * 2.1; r.stun = r.spin = 0; }); };
  const begin = () => { if (state !== 'garage') return; buildRivals(); reset(); state = 'count'; countdown = 3; flash('3', 1); };
  g.start = () => { buildRivals(); reset(); state = 'running'; };      // test hook: skip the garage and the countdown
  const finishRace = () => { if (state === 'finished') return; state = 'finished'; endT = 0; stopEngine(); flash(place() === 1 ? 'Hạng nhất!' : `Về đích · hạng ${place()}`, 1.6); };
  Object.defineProperty(g, 'time', { get: () => Math.max(0, 300 - elapsed), set: (v) => { if (v <= 0 && state !== 'finished') finishRace(); } });
  Object.defineProperty(g, 'x', { get: () => 280 + lane * 60 });
  g.info = () => `🏁 Vòng ${Math.min(LAPS, Math.floor(distance / length) + 1)}/${LAPS} · hạng ${place()}/4 · ★ ${g.coins} · 🔤 ${wordsDone.length}`;
  const score = () => Math.round(distance / 9) + g.coins * 6 + wordsDone.length * 40 + (5 - place()) * 30;
  g.done = () => (state === 'finished' && endT > 1.4 ? { id: 'race2', score: score(), gold: Math.min(44, wordsDone.length * 6 + g.coins * 2 + (4 - place()) * 5 + 4), exp: Math.min(60, 10 + Math.floor(score() / 8)), words: wordsDone.slice(),
    text: `Race over: place ${place()} of 4, ${g.coins} stars, ${wordsDone.length} word${wordsDone.length === 1 ? '' : 's'}!` } : null);
  const useItem = () => {
    if (state !== 'running' || !item) return;
    if (item === 'boost') { boostT = 2.4; raceSfx('boost'); flash('Tăng tốc!', 0.6); }
    else { const m = new THREE.Mesh(mk(new THREE.SphereGeometry(0.28, 12, 8)), mk(new THREE.MeshBasicMaterial({ color: 0xff8a2a }))); scene.add(m); shots.push({ m, d: distance + 2, lane, t: 0 }); raceSfx('boost'); }
    item = null;
  };
  g.key = (code) => {
    if (state === 'garage') { if (code === 'ArrowLeft' || code === 'KeyA') choose(pick - 1); else if (code === 'ArrowRight' || code === 'KeyD') choose(pick + 1); else if (code === 'Space' || code === 'Enter' || code === 'KeyE') begin(); }
    else if (code === 'Space' || code === 'KeyE' || code === 'ArrowUp' || code === 'KeyW') useItem();
    else if (code === 'KeyP') paused = !paused;
  };
  g.click = () => { if (state === 'garage') begin(); };
  g.update = (dt, held) => { g.held = held; };

  const logical = (dt, held) => {
    if (state === 'garage') { player.rotation.y += dt * 0.9; return; }
    if (state === 'count') { countdown -= dt; flash(String(Math.max(1, Math.ceil(countdown))), 0.1); if (countdown <= 0) { state = 'running'; flash('Xuất phát!', 0.8); } return; }
    if (state === 'finished') { endT += dt; speed = damp(speed, 0, 1.2, dt); distance += dt * speed * 0.3; return; }
    if (state !== 'running') return;
    elapsed += dt; hurt = Math.max(0, hurt - dt); boostT = Math.max(0, boostT - dt); spinT = Math.max(0, spinT - dt);
    steer = Number(held.has('ArrowRight') || held.has('KeyD')) - Number(held.has('ArrowLeft') || held.has('KeyA'));
    lane = THREE.MathUtils.clamp(lane + dt * steer * (5.6 + speed * 0.2), -(HALF + 0.9), HALF + 0.9);
    const braking = held.has('ArrowDown') || held.has('KeyS'), off = Math.abs(lane) > HALF - 0.15, target = braking ? SPEED.brake : off ? SPEED.off : hurt > 0 ? SPEED.hurt : boostT > 0 ? SPEED.boost : SPEED.cruise;
    speed = damp(speed, target, braking ? 4 : boostT > 0 ? 3 : 1.25, dt); const old = distance; distance += dt * speed;
    rivals.forEach((r, i) => {
      let k = 1; if (r.stun > 0) { r.stun -= dt; k = 0.3; r.spin = 10; } else r.spin = 0;
      const gap = r.d - distance; if (gap > 40) k *= 0.93; else if (gap < -25) k *= 1.07;      // the pack stays close
      r.d += dt * (r.rate * (1 + R.rival) + 1.1 * Math.sin(elapsed * 0.7 + i)) * k; r.lane = (i - 1) * 1.82 * SC + 0.48 * SC * Math.sin(r.d * 0.12 + i);
      if (Math.abs(r.d - distance) < 1.5 && Math.abs(r.lane - lane) < 1.3 && hurt <= 0) { speed *= 0.76; hurt = 0.6; lane = THREE.MathUtils.clamp(lane + (lane >= r.lane ? 0.7 : -0.7), -(HALF + 0.8), HALF + 0.8); raceSfx('bump'); }
    });
    for (let s = shots.length - 1; s >= 0; s--) {      // a shot flies down the track and bends towards the nearest kart ahead
      const sh = shots[s]; sh.t += dt; sh.d += dt * 42;
      const tgt = rivals.filter((r) => r.d > sh.d - 1 && r.d - sh.d < 140).sort((a, b) => a.d - b.d)[0];
      if (tgt) sh.lane += (tgt.lane - sh.lane) * Math.min(1, dt * 6);
      const hit = tgt && Math.abs(tgt.d - sh.d) < 1.8 && Math.abs(tgt.lane - sh.lane) < 1.3;
      if (hit) { tgt.stun = 1.8; flash('Trúng!', 0.5); raceSfx('bump'); }
      if (hit || sh.t > 3.2) { scene.remove(sh.m); shots.splice(s, 1); }
    }
    for (const it of items) {
      const round = Math.floor((distance - it.d) / length), passed = round * length + it.d;
      if (passed <= old || passed > distance || it.round === round || Math.abs(lane - it.l) > (it.kind === 'pad' ? 2.1 : 1.5)) continue;
      it.round = round; if (it.o) it.o.visible = false;
      if (it.kind === 'cone') { speed *= 0.56; hurt = 0.85; flash('Chạm cọc', 0.55); raceSfx('bump'); }
      else if (it.kind === 'coin') { g.coins++; flash('+1 ★', 0.42); raceSfx('coin'); }
      else if (it.kind === 'pad') { boostT = Math.max(boostT, 1.1); flash('Tăng tốc!', 0.45); raceSfx('boost'); }
      else if (it.kind === 'box') { if (!item) { item = rnd() < 0.5 ? 'boost' : 'shot'; flash(item === 'boost' ? 'Tăng tốc! (Space)' : 'Đạn! (Space)', 0.8); } else flash('Đã có đồ', 0.4); raceSfx('coin'); }
      else if (wantWords) {
        letters++; if (letters >= SP.letters(cur().word).length) { wordsDone.push(cur()); speak(cur().word, true, 0.85); flash(`${cur().word}  +40`, 0.9); wi++; letters = 0; raceSfx('boost'); } else flash('+ ' + need(), 0.4);
      }
    }
    if (distance >= finish) { distance = finish; finishRace(); }
  };

  // ---- drawing
  const poseOf = (o, d, l, turn = 0) => { const [p, r] = at(d, l); o.position.copy(p); o.position.y = 0.04; o.rotation.y = r + turn; };
  const track2d = (() => { const pts = Array.from({ length: 96 }, (_, i) => curve.getPointAt(i / 96)); const xs = pts.map((p) => p.x), zs = pts.map((p) => p.z), x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs); return { pts, x0, z0, sc: Math.min(1 / (x1 - x0), 1 / (z1 - z0)) }; })();
  const chip = (c, x, y, text, font = 700) => { c.font = `${font} 13px system-ui, sans-serif`; const w = c.measureText(text).width + 16; c.fillStyle = 'rgba(38,55,66,.9)'; c.beginPath(); c.roundRect(x, y, w, 24, 8); c.fill(); c.fillStyle = '#fff1cd'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(text, x + 8, y + 12.5); return w; };
  g.draw = (c, w, h, t) => {
    const dt = Math.min(0.05, Math.max(0, t - t0)); t0 = t;
    if (!paused) logical(dt, g.held || new Set());
    if (state === 'running' && !g.engineOn) { g.engineOn = true; startEngine(); }
    if (g.engineOn) engineSpeed(Math.min(1.2, speed / 28));
    poseOf(player, distance, lane, steer * 0.075 * (state === 'running') + (spinT > 0 ? spinT * 6 : 0));
    rivals.forEach((r) => { poseOf(r.car, r.d, r.lane, r.spin ? elapsed * 12 : 0); r.car.visible = state !== 'garage'; });      // the garage shows your kart alone
    for (const s of shots) { const [p] = at(s.d, s.lane); s.m.position.copy(p); s.m.position.y = 0.55; }
    for (const it of items) if (it.o && it.kind !== 'cone') { const lap = Math.floor(distance / length), delta = it.d - distance % length; it.o.visible = it.round !== lap || delta < -length * 0.55; it.o.position.y = (it.kind === 'box' ? 1.05 : 0.94) + 0.12 * Math.sin(elapsed * 3 + it.d); if (it.kind === 'letter') it.o.material.map = tok((need() || 'F').toUpperCase()); }
    const gar = state === 'garage';
    const eye = at(distance + (gar ? 4.8 : -6.8), lane + (gar ? -3 : 0))[0]; eye.y = gar ? 2.45 : 3.0; cam.position.copy(eye);
    const look = at(distance + (gar ? -0.45 : 6.4), lane)[0]; look.y = gar ? 0.43 : 0.75; cam.lookAt(look);
    cam.fov = 55 + (boostT > 0 ? 9 : 0) * Math.min(1, boostT * 3); cam.aspect = w / h; cam.updateProjectionMatrix();
    const r3 = renderer(), pw = Math.min(1100, c.canvas.width), ph = Math.round(pw * h / w); if (r3.domElement.width !== pw || r3.domElement.height !== ph) r3.setSize(pw, ph, false);
    r3.render(scene, cam); c.drawImage(r3.domElement, 0, 0, w, h);
    // ---- overlay
    c.textBaseline = 'middle';
    if (!gar) {
      let x = 10; x += chip(c, x, 8, `Vòng ${Math.min(LAPS, Math.floor(distance / length) + 1)}/${LAPS}`) + 6; x += chip(c, x, 8, `Hạng ${place()}/4`) + 6; x += chip(c, x, 8, `★ ${g.coins}`) + 6; chip(c, x, 8, fmtT(elapsed));
      c.fillStyle = 'rgba(38,55,66,.9)'; c.beginPath(); c.roundRect(10, 40, 62, 62, 12); c.fill(); c.strokeStyle = item ? '#ffd23c' : '#6a7a86'; c.lineWidth = 2; c.stroke(); c.textAlign = 'center'; c.font = '900 30px system-ui'; c.fillStyle = '#fff1cd'; c.fillText(item === 'boost' ? '⚡' : item === 'shot' ? '🚀' : '·', 41, 68); c.font = '700 10px system-ui'; c.fillText(item ? 'Space' : 'ô ?', 41, 94);
      c.fillStyle = 'rgba(38,55,66,.9)'; c.beginPath(); c.roundRect(w - 110, 8, 100, 24, 8); c.fill(); c.fillStyle = boostT > 0 ? '#2fd2ff' : '#ffd23c'; c.beginPath(); c.roundRect(w - 106, 14, 92 * Math.min(1, speed / SPEED.boost), 12, 5); c.fill();
      const mx = w - 118, my = h - 124, ms = 104; c.fillStyle = 'rgba(38,55,66,.78)'; c.beginPath(); c.roundRect(mx - 6, my - 6, ms + 12, ms + 12, 12); c.fill();
      const P = (p) => [mx + 6 + (p.x - track2d.x0) * track2d.sc * (ms - 12), my + 6 + (p.z - track2d.z0) * track2d.sc * (ms - 12)];
      c.strokeStyle = '#d9d2c4'; c.lineWidth = 5; c.lineJoin = 'round'; c.beginPath(); track2d.pts.forEach((p, i) => { const [a, b] = P(p); i ? c.lineTo(a, b) : c.moveTo(a, b); }); c.closePath(); c.stroke();
      const dot = (d, col, rr) => { const [a, b] = P(at(d)[0]); c.fillStyle = col; c.beginPath(); c.arc(a, b, rr, 0, TAU); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke(); };
      rivals.forEach((r, i) => dot(r.d, ['#4184c6', '#e6a331', '#9659ba'][i], 3.5)); dot(distance, '#ff4a3a', 4.8);
      if (wantWords) { const wd = cur(), ls = SP.letters(wd.word); c.fillStyle = 'rgba(39,56,65,.92)'; c.beginPath(); c.roundRect(w / 2 - 150, h - 56, 300, 46, 12); c.fill(); c.fillStyle = '#fff2cc'; c.textAlign = 'center'; c.font = '700 14px system-ui'; c.fillText(wd.vi, w / 2, h - 41); c.font = '900 20px system-ui'; c.fillText(ls.map((ch, i) => (i < letters ? ch.toUpperCase() : i === letters ? `[${ch.toUpperCase()}]` : '_')).join(' '), w / 2, h - 20); }
    }
    if (pop > 0 || gar || state === 'count') { const txt = gar ? '' : flashText; if (txt) { c.textAlign = 'center'; c.font = '900 54px system-ui'; c.lineWidth = 8; c.strokeStyle = '#353238'; c.strokeText(txt, w / 2, h * 0.3); c.fillStyle = '#fff'; c.fillText(txt, w / 2, h * 0.3); } }
    if (pop > 0 && !paused) pop = Math.max(0, pop - dt);
    if (gar) { c.fillStyle = 'rgba(255,248,233,.94)'; c.beginPath(); c.roundRect(w / 2 - 190, 14, 380, 76, 14); c.fill(); c.strokeStyle = '#453d43'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#42343d'; c.textAlign = 'center'; c.font = '800 22px system-ui'; c.fillText(`Chọn xe: ${KART_LABEL[pick]}`, w / 2, 40); c.font = '600 13px system-ui'; c.fillStyle = '#665c50'; c.fillText('← → chọn xe · Space hoặc bấm chuột để bắt đầu đua', w / 2, 68); }
    if (paused) { c.textAlign = 'center'; c.font = '900 40px system-ui'; c.fillStyle = '#fff'; c.strokeStyle = '#353238'; c.lineWidth = 7; c.strokeText('Tạm dừng (P)', w / 2, h / 2); c.fillText('Tạm dừng (P)', w / 2, h / 2); }
    c.textBaseline = 'alphabetic';
  };
  g.dispose = () => { stopEngine(); g.engineOn = false; for (const o of own) { try { o.dispose(); } catch { /* shared */ } } for (const t of tokens.values()) t.dispose(); scene.clear(); };
  return g;
}
const fmtT = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;

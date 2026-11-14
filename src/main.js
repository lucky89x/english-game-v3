// English Quest (web) — boot, render loop, quality presets, perf panel and the debug API for tests.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as L from './core/layout.js';
import * as Save from './core/save.js';
import * as Review from './core/review.js';
import { findWord } from './core/catalog.js';
import { buildForest, TIME } from './world/forest.js';
import { Player, OrbitCamera, Npc, Pip, Crystals } from './game/actors.js';
import { ForestQuest, landmark } from './game/quest.js';
import { SAM_LINES } from './game/content.js';
import { UI } from './ui/ui.js';
import { Minimap } from './ui/minimap.js';
import { sfx, setSound, soundOn, unlock } from './audio.js';

const $ = (id) => document.getElementById(id);
const QUALITY = {
  low: { label: 'Thấp', ratio: 0.6, shadow: 0, shadowDist: 0, density: 0.22, particles: false, far: false },
  medium: { label: 'Vừa', ratio: 1.0, shadow: 2048, shadowDist: 55, density: 0.6, particles: true, far: true },
  high: { label: 'Cao', ratio: 1.5, shadow: 4096, shadowDist: 85, density: 1.0, particles: true, far: true },
};
const errors = [];
addEventListener('error', (e) => errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => errors.push(String(e.reason)));

const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xbfe4ff, 70, 330);
const camera = new THREE.PerspectiveCamera(52, 1, 0.3, 700);

// sky dome: clean blue gradient, soft sun glow, drifting clouds
const sunDir = new THREE.Vector3(-0.45, 0.72, 0.52).normalize();
const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uTime: TIME, uSun: { value: sunDir } },
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform float uTime; uniform vec3 uSun; varying vec3 vD;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
    float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * n(p); p *= 2.03; a *= 0.5; } return s; }
    void main(){
      vec3 d = normalize(vD); float y = max(d.y, 0.0);
      vec3 col = mix(vec3(0.74, 0.90, 1.0), vec3(0.16, 0.50, 0.95), pow(y, 0.55));
      col += vec3(1.0, 0.93, 0.75) * pow(max(dot(d, uSun), 0.0), 220.0) * 1.2 + vec3(1.0, 0.95, 0.8) * pow(max(dot(d, uSun), 0.0), 9.0) * 0.14;
      vec2 uv = d.xz / (d.y + 0.22) * 1.15 + vec2(uTime * 0.006, 0.0);
      float c = smoothstep(0.52, 0.78, fbm(uv * 1.6)) * smoothstep(0.02, 0.22, d.y);
      col = mix(col, vec3(1.0), c * 0.92);
      gl_FragColor = vec4(col, 1.0);
    }` }));
sky.frustumCulled = false; scene.add(sky);
scene.add(new THREE.HemisphereLight(0xcfe9ff, 0x7fae5a, 1.15));
const sun = new THREE.DirectionalLight(0xfff1d6, 2.6); sun.castShadow = true; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; scene.add(sun, sun.target);

const manager = new THREE.LoadingManager();
manager.onProgress = (_u, done, total) => { $('loadbar').style.width = Math.round((done / total) * 100) + '%'; };
const loader = new GLTFLoader(manager), texLoader = new THREE.TextureLoader(manager), modelCache = new Map();
const gltf = (name) => { if (!modelCache.has(name)) modelCache.set(name, loader.loadAsync(`./assets/models/${name}.glb`)); return modelCache.get(name); };
const staticModel = async (name) => (await gltf(name)).scene.clone(true);
const faceTex = async (name) => { const t = await texLoader.loadAsync(`./assets/tex/ngoc_face_${name}.png`); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; return t; };

const ui = new UI(), store = Save.load();
let profile = null, quest = null, world = null, player = null, cam = null, tom = null, sam = null, pip = null, crystals = null, minimap = null;
let quality = localStorage.getItem('eq-quality') || 'medium', perfOn = false, started = false, wordIds = {};
const keys = new Set();
const game = { errors, get profile() { return profile; }, get quest() { return quest; }, get player() { return player; }, get cam() { return cam; }, get minimap() { return minimap; }, ui, L, stats: { fps: 0, ms: 0, calls: 0, tris: 0 },
  teleport(x, z) { player.place(x, z); cam.target.set(x, player.pos.y + 1.25, z); }, setQuality, key: (code) => onKey({ code, preventDefault() {} }), get started() { return started; }, chooseProfile };
globalThis.__eq = game;

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
function setQuality(name) {
  quality = QUALITY[name] ? name : 'medium'; const q = QUALITY[quality];
  localStorage.setItem('eq-quality', quality);
  const dpr = devicePixelRatio || 1;
  renderer.setPixelRatio(q.ratio < 1 ? dpr * q.ratio : Math.min(dpr, q.ratio));
  renderer.shadowMap.enabled = q.shadow > 0; sun.castShadow = q.shadow > 0;
  if (q.shadow) { sun.shadow.mapSize.set(q.shadow, q.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    const c = sun.shadow.camera, d = q.shadowDist / 2; c.left = -d; c.right = d; c.top = d; c.bottom = -d; c.near = 1; c.far = 220; c.updateProjectionMatrix(); }
  scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => (m.needsUpdate = true)); });
  if (world) world.setDetail(q.density, q.particles, q.far);
  resize(); renderGear();
}
function renderGear() {
  const g = $('gear'); if (!profile) return; g.classList.remove('hidden');
  g.innerHTML = `Đồ họa: <select id="gq">${Object.entries(QUALITY).map(([k, v]) => `<option value="${k}" ${k === quality ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
    <button id="gs">Âm thanh: ${soundOn() ? 'bật' : 'tắt'}</button><button id="ge">Xuất hồ sơ</button><button id="gp">Đổi người chơi</button><span style="color:#9a8060">F3: hiệu năng</span>`;
  $('gq').onchange = (e) => setQuality(e.target.value);
  $('gs').onclick = () => { setSound(!soundOn()); renderGear(); };
  $('ge').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([Save.exportProfile(profile)], { type: 'application/json' })); a.download = `english-quest-${profile.name}.json`; a.click(); };
  $('gp').onclick = () => { save(); ui.showMenu(store, chooseProfile); };
}
function save() { if (!profile) return; store.last = profile.id; try { Save.persist(store); } catch (e) { console.warn('save failed', e); } }
function refresh() {
  if (!profile) return;
  ui.hud(profile, quest, Review.learned(profile.words));
  const c = quest.clue, t = quest.targetId ? landmark(quest.targetId) : null;
  if (quest.step === 'seek') { if (c) ui.clue(c, quest.q.hint, `${t.en} = ${t.vi}`); else ui.clue(null, 0, '', `Lời gợi ý cho lớp ${profile.grade} chưa được soạn.`); }
  else if (quest.step === 'intro') ui.clue(null, 0, '', 'Nói chuyện với trưởng làng Tom ở cổng rừng (nhấn E).');
  else if (quest.step === 'tree') ui.clue(null, 0, '', 'Take the crystals to the ancient tree. ★');
  else ui.clue(null, 0, '', 'Rừng Ký Ức đã nhớ lại các từ. Con có thể dạo chơi tiếp!');
  if (crystals) crystals.show(quest.crystalIds());
}
async function chooseProfile(p) {
  unlock(); profile = p; store.last = p.id;
  wordIds = {};
  const hits = await Promise.all(L.LANDMARKS.map((l) => findWord(p.grade, l.en)));                     // own grade only
  L.LANDMARKS.forEach((l, i) => { wordIds[l.en] = hits[i] ? hits[i].id : 'forest:' + l.en; });
  quest = new ForestQuest({ profile, save, ui, sfx, wordId: (w) => wordIds[w] || 'forest:' + w, onChange: refresh });
  if (quest.step === 'seek') quest.clueStart = performance.now();
  game.teleport(L.ENTRANCE.x, L.ENTRANCE.z - 9); player.yaw = Math.PI; cam.tYaw = cam.yaw = 0.25;
  pip.place(L.ENTRANCE.x + 3.4, L.ENTRANCE.z - 12.5);
  $('mapbox').classList.remove('hidden'); started = true;
  save(); refresh(); renderGear();
}

function interactTarget() {
  const p = player.pos, near = (x, z, r) => Math.hypot(p.x - x, p.z - z) < r;
  const c = crystals.nearest(p);
  if (c) return { text: 'E · Chạm vào pha lê ký ức', run: () => { player.emote('Interact'); const ok = quest.touch(c); if (ok) player.emote('Celebrate'); } };
  if (near(tom.x, tom.z, 3)) return { text: 'E · Nói chuyện với Tom', run: () => quest.talkTom() };
  if (near(sam.x, sam.z, 3)) return { text: 'E · Nói chuyện với Sam', run: () => ui.dialogue(SAM_LINES) };
  const tree = landmark('tree');
  if (quest.step === 'tree' && near(tree.spot[0], tree.spot[1], 3.2)) return { text: 'E · Đặt pha lê vào cây cổ thụ', run: () => quest.treeChallenge() };
  return null;
}
function onKey(e) {
  if (!started) return;
  if (e.code === 'F3') { perfOn = !perfOn; $('perf').classList.toggle('hidden', !perfOn); e.preventDefault(); return; }
  if (ui.key(e)) { e.preventDefault(); return; }
  if (ui.modal) return;
  if (e.code === 'KeyE') { const t = interactTarget(); if (t) t.run(); }
  if (e.code === 'KeyH') quest.hint();
  if (e.code === 'Space') e.preventDefault();
}
addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; if (!e.repeat) onKey(e); keys.add(e.code); });
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
addEventListener('resize', resize);

async function boot() {
  resize();
  $('loadtext').textContent = 'Đang dựng khu rừng…';
  world = await buildForest(scene, staticModel);
  $('loadtext').textContent = 'Đang gọi Ngọc và các bạn…';
  const [ngoc, tomG, samG, pipG, blink, talk, joy] = await Promise.all([gltf('chr_ngoc_adventurer_v02'), gltf('npc_tom_elder_v02'), gltf('npc_sam_fisherman_v02'), gltf('npc_pip_spirit_v02'), faceTex('blink'), faceTex('talk'), faceTex('joy')]);
  player = new Player(ngoc, { blink, talk, joy }); scene.add(player.root);
  tom = new Npc(tomG, L.ENTRANCE.x + 2.4, L.ENTRANCE.z - 12, 0.2); scene.add(tom.root);
  sam = new Npc(samG, 30.2, 49.6, 2.2); scene.add(sam.root);
  pip = new Pip(pipG.scene); scene.add(pip.root);
  crystals = new Crystals(scene, L.LANDMARKS.filter((l) => l.id !== 'tree'));
  cam = new OrbitCamera(camera, canvas);
  minimap = new Minimap($('minimap'), (path) => { player.route = path.slice(1); });
  player.place(L.ENTRANCE.x, L.ENTRANCE.z - 9); pip.place(L.ENTRANCE.x + 3.4, L.ENTRANCE.z - 12.5);
  setQuality(quality);
  $('loading').classList.add('hidden');
  ui.showMenu(store, chooseProfile);
  renderer.setAnimationLoop(frame);
}

let last = performance.now(), acc = 0, frames = 0, autosave = 0;
function frame() {
  const now = performance.now(), raw = (now - last) / 1000, real = Math.min(0.25, raw); last = now;
  const dt = Math.min(0.05, real); TIME.value += real; const t = TIME.value;
  const frozen = ui.modal || !started;
  const input = { x: (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0), z: (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0), run: keys.has('ShiftLeft') || keys.has('ShiftRight'), jump: keys.has('Space') };
  if (frozen) { input.x = input.z = 0; input.jump = false; }
  const hadRoute = !!player.route;
  // slow machines: several fixed physics steps per frame so the game never runs in slow motion
  for (let left = real; left > 1e-4; left -= 0.05) player.update(Math.min(0.05, left), input, cam.yaw, frozen, sfx);
  if (hadRoute && !player.route) minimap.clearRoute();
  cam.update(dt, player.pos);
  const talkingTo = ui.busy && ui.pages ? ui.pages[0].who : '';
  tom.update(dt, player.pos, talkingTo === 'Tom'); sam.update(dt, player.pos, talkingTo === 'Sam');
  if (ui.busy && player.grounded && player.current === 'Idle' && talkingTo === 'Ngọc') player.play('Talk');
  pip.update(dt, t, player, started && quest && quest.step !== 'intro');
  crystals.update(t); world.update(t);
  sun.position.copy(player.pos).addScaledVector(sunDir, 90); sun.target.position.copy(player.pos);
  sky.position.copy(camera.position);
  if (started) {
    const it = ui.modal ? null : interactTarget(); ui.prompt(it ? it.text : '');
    const markers = [];
    if (quest.step === 'intro') markers.push({ x: tom.x, z: tom.z, text: '!' });
    if (quest.step === 'tree') { const s = landmark('tree').spot; markers.push({ x: s[0], z: s[1], text: '★' }); }
    if (quest.step === 'seek' && quest.q.hint >= 3) { const s = landmark(quest.targetId).spot; markers.push({ x: s[0], z: s[1], text: '★' }); }
    minimap.draw(player.pos, player.yaw, markers);
    autosave += dt; if (autosave > 20) { autosave = 0; save(); }
  }
  renderer.render(scene, camera);
  acc += raw; frames++;
  if (acc >= 0.5) { game.stats = { fps: +(frames / acc).toFixed(1), ms: +(acc / frames * 1000).toFixed(1), calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
    if (perfOn) $('perf').textContent = `FPS ${game.stats.fps}  (${game.stats.ms} ms)\ndraw calls ${game.stats.calls}\ntriangles ${game.stats.tris.toLocaleString()}\nquality ${quality} · ${renderer.domElement.width}x${renderer.domElement.height}`;
    acc = 0; frames = 0; }
}
boot().catch((e) => { errors.push(String(e && e.stack || e)); $('loadtext').textContent = 'Lỗi khi tải game: ' + e.message; console.error(e); });

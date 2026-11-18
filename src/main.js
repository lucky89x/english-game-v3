// English Quest (web) — boot, render loop, quality presets, perf panel and the debug API for tests.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as L from './core/layout.js';
import * as Save from './core/save.js';
import * as Review from './core/review.js';
import { loadGrade } from './core/catalog.js';
import { grammarFor, GRAMMAR_GATES } from './core/grammar.js';
import { buildWorld, bridgeItem, TIME, MARKET_JARS, PAINT } from './world/index.js';
import { Player, OrbitCamera, Npc, Pip, Crystals } from './game/actors.js';
import { ForestQuest, landmark } from './game/quest.js';
import { VillageStory } from './game/village.js';
import { MiniGames, STARS, STARTS } from './game/minigames.js';
import { AdminPanel } from './ui/admin.js';
import { MusicRoom } from './ui/music.js';
import { Journal } from './ui/journal.js';
import { campStall } from './world/stall.js';
import { buildRoom } from './world/interior.js';
import { label } from './world/common.js';
import * as Q from './core/quests.js';
import { Wild, BOARD, BOSS_AT, BOSS2_AT, FOREST_BOARD, BOSS3_AT } from './game/combat.js';
import { Arcade, candyGame, blocksGame, slingGame, spellGame, raceGame } from './ui/arcade.js';
import { Chests, CHEST_SPOTS, FOREST_CHESTS } from './game/chests.js';
import { armorMesh, charmMesh } from './game/gear.js';
import { Walkers } from './game/walkers.js';
import { ShopWindow } from './ui/shop.js';
import { ITEMS, bag, wear, buy, eat, shopList, pay, map2Ready, playerAtk } from './core/rules.js';
import { payNote } from './game/minigames.js';
import { SAM_LINES, BRIDGE, BRIDGE_SPOTS, FRIENDS, OPENING } from './game/content.js';
import { UI } from './ui/ui.js';
import { Post } from './render/post.js';
import { addOutline, showOutlines } from './render/outline.js';
import { Minimap } from './ui/minimap.js';
import { initTouch, touchWanted } from './ui/touch.js';
import { sfx, setSound, soundOn, unlock } from './audio.js';
import { voiceOn, setVoice, speak } from './ui/speech.js';
import { QuestMarks } from './game/marks.js';
import { keyCode } from './core/keys.js';
import { WordSpots } from './game/wordspots.js';

const $ = (id) => document.getElementById(id);
const QUALITY = {
  low: { label: 'Thấp', ratio: 0.6, shadow: 0, shadowDist: 0, density: 0.22, particles: false, far: false, post: false, samples: 0 },
  medium: { label: 'Vừa', ratio: 1.0, shadow: 2048, shadowDist: 55, density: 0.6, particles: true, far: true, post: true, samples: 2 },
  high: { label: 'Cao', ratio: 1.5, shadow: 4096, shadowDist: 85, density: 1.0, particles: true, far: true, post: true, samples: 4 },
};
const errors = [];
addEventListener('error', (e) => errors.push(String(e.message)));
addEventListener('unhandledrejection', (e) => errors.push(String(e.reason)));

const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.localClippingEnabled = true;   // broken bridge gap
renderer.info.autoReset = false;            // several passes per frame: counted together, reset once a frame
const post = new Post(renderer);
/** Which GPU the browser really draws with. "SwiftShader", "llvmpipe" or "Basic Render" means the CPU draws (hardware
 *  acceleration is off or blocked): the game then stutters even on a strong graphics card. */
const GPU = (() => { try { const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'); return String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch { return '?'; } })();
const SOFTWARE_GL = /swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(GPU);
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
// Soft, warm light as in the reference paintings: a strong sky/ground fill so nothing goes black, a gentler sun so
// skin and cream cloth do not burn out, and a cool back light that draws a rim round characters and roofs.
scene.add(new THREE.HemisphereLight(0xdcefff, 0xc8b88a, 1.05));
{ // the sky also lights the scene as an environment map: soft coloured fill and reflections on metal and glass
  const pm = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene(), dome = sky.clone(); dome.scale.setScalar(0.1); envScene.add(dome);
  scene.environment = pm.fromScene(envScene, 0, 0.1, 100).texture; scene.environmentIntensity = 0.22; pm.dispose(); }
const rim = new THREE.DirectionalLight(0xcfe2ff, 0.75); rim.position.set(0.5, 0.55, -0.7); scene.add(rim);
const sun = new THREE.DirectionalLight(0xffe6bc, 1.9); sun.castShadow = true; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; scene.add(sun, sun.target);

const manager = new THREE.LoadingManager();
manager.onProgress = (_u, done, total) => { $('loadbar').style.width = Math.round((done / total) * 100) + '%'; };
const loader = new GLTFLoader(manager), texLoader = new THREE.TextureLoader(manager), modelCache = new Map();
const gltf = (name) => { if (!modelCache.has(name)) modelCache.set(name, loader.loadAsync(`./assets/models/${name}.glb`)); return modelCache.get(name); };
const staticModel = async (name) => (await gltf(name)).scene.clone(true);
const faceTex = async (name) => { const t = await texLoader.loadAsync(`./assets/tex/ngoc_face_${name}.png`); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; return t; };

const ui = new UI(), store = Save.load();
let profile = null, quest = null, story = null, world = null, player = null, cam = null, tom = null, sam = null, ben = null, pip = null, crystals = null, minimap = null, letterProp = null, itemProps = {}, friends = [], mini = null, wild = null, arcade = null, chests = null, spots = null, unitCards = [], cardOfFn = () => null;
let shopWin = null, walkers = null, talkW = -1, touch = null, quality = localStorage.getItem('eq-quality') || 'medium', perfOn = false, started = false, switching = false, wordIds = {}, jarKey = '';
const keys = new Set();
const game = { errors, get profile() { return profile; }, get quest() { return quest; }, get story() { return story; }, get player() { return player; }, get cam() { return cam; }, get minimap() { return minimap; }, ui, L, stats: { fps: 0, ms: 0, calls: 0, tris: 0 },
  teleport(x, z) { player.place(x, z); cam.target.set(x, player.pos.y + 1.25, z); }, setQuality, key: (code) => onKey({ code, preventDefault() {} }), get started() { return started && !switching; }, get region() { return L.NAME; }, chooseProfile, enterRegion, MARKET_JARS, BRIDGE_SPOTS, get mini() { return mini; }, get wild() { return wild; }, get scene() { return scene; }, openShop, get sword() { return swordMesh; }, get armor() { return armorShown; }, setWear, openBag: () => openBag(), get arcade() { return arcade; }, get chests() { return chests; }, get spots() { return spots; }, get admin() { return admin; }, get friends() { return friends; }, get walkers() { return walkers; }, get shopWin() { return shopWin; }, get music() { return music; }, get journal() { return journal; }, get intro() { return intro; }, cardOf: (id) => cardOfFn(id), pause: (on) => renderer.setAnimationLoop(on ? null : frame),      // tests: stop drawing while another page is checked
  post, refresh: () => refresh() };
globalThis.__eq = game;

// Dynamic resolution (18/11: "high graphics without stutter"): all the effects stay on, only the number of pixels
// drawn follows the machine. A slow half-second lowers the render scale a step (at most every 2 s, down to 60%);
// steady fast frames raise it again (every 5 s). Changing it reallocates the effect buffers, so steps are rare.
let baseRatio = 1, renderScale = 1, drsT = 0;
function adaptResolution(stats, dt) {
  drsT += dt; if (quality === 'low' || !started || switching || document.hidden) return;
  const want = stats.ms > 19 ? -0.1 : stats.ms < 12.5 && stats.worst < 25 ? 0.05 : 0;
  if (!want || (want < 0 && drsT < 2) || (want > 0 && drsT < 5)) return;
  const next = Math.min(1, Math.max(0.6, renderScale + want)); if (Math.abs(next - renderScale) < 0.01) return;
  renderScale = next; drsT = 0; renderer.setPixelRatio(baseRatio * renderScale); resize();
}
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
function setQuality(name) {
  quality = QUALITY[name] ? name : 'medium'; const q = QUALITY[quality];
  localStorage.setItem('eq-quality', quality);
  const dpr = devicePixelRatio || 1;
  baseRatio = q.ratio < 1 ? dpr * q.ratio : Math.min(dpr, q.ratio); renderScale = 1; renderer.setPixelRatio(baseRatio);
  renderer.shadowMap.enabled = q.shadow > 0; sun.castShadow = q.shadow > 0;
  if (q.shadow) { sun.shadow.mapSize.set(q.shadow, q.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
    const c = sun.shadow.camera, d = q.shadowDist / 2; c.left = -d; c.right = d; c.top = d; c.bottom = -d; c.near = 1; c.far = 220; c.updateProjectionMatrix(); }
  scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => (m.needsUpdate = true)); });
  post.set(q.post, q.samples);
  showOutlines(q.post); post.shafts = quality === 'high';      // light shafts only on the high level
  PAINT.on = q.post;                 // painted surfaces follow the same switch (materials are recompiled just below)
  if (world) world.setDetail(q.density, q.particles, q.far);
  resize(); renderGear();
}
let gearOpen = false;
/** Settings: a small ⚙ button in the corner; the panel opens only when a grown-up clicks it (feedback 17/11). */
function renderGear() {
  const g = $('gear'); if (!profile) return; g.classList.remove('hidden');
  if (!gearOpen) { g.className = 'card closed'; g.innerHTML = '<button id="gopen" title="Cài đặt">⚙</button>'; $('gopen').onclick = () => { gearOpen = true; renderGear(); }; return; }
  g.className = 'card';
  g.innerHTML = `<b style="flex-basis:100%">Cài đặt <button id="gclose" style="float:right">✕</button></b>
    Đồ họa: <select id="gq">${Object.entries(QUALITY).map(([k, v]) => `<option value="${k}" ${k === quality ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
    <button id="gs">Âm thanh: ${soundOn() ? 'bật' : 'tắt'}</button><button id="gv" title="Đọc to lời thoại tiếng Anh">Đọc to: ${voiceOn() ? 'bật' : 'tắt'}</button><button id="gb" title="Xem lại các từ đã gặp (phím B)">📖 Sổ từ</button>
    <span style="flex-basis:100%;color:#9a8060" title="Để 'theo map' thì Unit đi theo map con đã mở">Phụ huynh · Unit con đang học trên lớp: <select id="gu"><option value="0">theo map (${Save.unitOf({ flags: profile.flags })})</option>${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${profile.unitPick === i + 1 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select></span>
    <button id="ge">Xuất hồ sơ</button><button id="gp">Đổi người chơi</button><span style="color:#9a8060">F3: hiệu năng</span>`;
  const done = (e) => { if (e && e.target) e.target.blur(); };          // a focused list would eat W/S and the arrows
  $('gclose').onclick = () => { gearOpen = false; renderGear(); };
  $('gq').onchange = (e) => { done(e); localStorage.setItem('eq-quality-manual', '1'); setQuality(e.target.value); };
  $('gu').onchange = (e) => { done(e); const v = Number(e.target.value); if (v) profile.unitPick = v; else delete profile.unitPick; reloadUnit().then(() => ui.toast(`Đang học Unit ${Save.unitOf(profile)}`)); };
  $('gs').onclick = () => { setSound(!soundOn()); renderGear(); };
  $('gv').onclick = () => { setVoice(!voiceOn()); renderGear(); };
  $('gb').onclick = () => { gearOpen = false; renderGear(); wordBook(); };
  $('ge').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([Save.exportProfile(profile)], { type: 'application/json' })); a.download = `english-quest-${profile.name}.json`; a.click(); };
  $('gp').onclick = () => { gearOpen = false; save(); ui.showMenu(store, chooseProfile); renderGear(); };
}
function save() { if (!profile) return; store.last = profile.id; profile.region = L.NAME; try { Save.persist(store); } catch (e) { console.warn('save failed', e); } }

const NOTES = {      // short English objectives for the village chain
  arrive: 'Talk to Tom in the village square. (E)', letter_find: "Find Tom's letter near the door of his hall. ✉", letter_return: 'Take the letter back to Tom.',
  jars: "Help Ben at the market.", jars_play: "Help Ben at the market.", tom_bridge: 'Tom wants to see you at the square.',
  bridge: 'Meet Sam at the broken south bridge.', plan: 'Listen to Pip and put the steps in order.', open: 'Tom wants to see you at the square.', done: 'Go to the forest gate in the north-west. ★',
};
let shownLevel = 0;
function refresh() {
  if (!profile) return;
  const gate = Save.gateWaiting(profile); if (gate && profile.toldGate !== gate) { profile.toldGate = gate; ui.toast('Gặp Cú Mèo để lên cấp!'); }
  if (shownLevel && profile.stats.level > shownLevel) { profile.stats.hp = Save.maxHp(profile); ui.toast(`LEVEL UP!  Lv ${profile.stats.level}`); sfx('fanfare'); }
  shownLevel = profile.stats.level;
  if (map2Ready(profile) && !profile.flags.map2) {      // T3: Ancient Golem beaten at level 20 -> Map 2 and Unit 2 words
    profile.flags.map2 = true; save(); sfx('fanfare');
    ui.dialogue([{ who: 'Tom', en: 'You have grown so strong! The road to the Memory Forest is yours now.', vi: `Đã mở Map 2 · Rừng Ký Ức. Từ giờ rương, boss, Cú Mèo hỏi từ Unit ${Save.unitOf(profile)}.` }], () => reloadUnit());
  }
  const learned = Review.learned(profile.words); if (journal) journal.sync();
  if (L.NAME === 'forest') {
    ui.hud(profile, 'Rừng Ký Ức', [`Pha lê ${quest.q.found.length}/5`, wild ? wild.huntNote() : '', Save.gateWaiting(profile) ? '🦉 ôn tập' : ''].filter(Boolean).join('  '), learned, bag(profile).food);
    const c = quest.clue, t = quest.targetId ? landmark(quest.targetId) : null;
    if (quest.step === 'seek') { if (c) ui.clue(c, quest.q.hint, `${t.en} = ${t.vi}`); else ui.clue(null, 0, '', `Lời gợi ý cho lớp ${profile.grade} chưa được soạn.`); }
    else if (quest.step === 'intro') ui.clue(null, 0, '', 'Talk to Tom at the forest gate. (E)');
    else if (quest.step === 'tree') ui.clue(null, 0, '', 'Take the crystals to the ancient tree. ★');
    else ui.clue(null, 0, '', 'The forest remembers its words again. You can explore!');
    crystals.show(quest.crystalIds());
  } else {
    ui.hud(profile, 'Làng Khởi Đầu', [mini ? `★ ${mini.data.stars.length}/${STARS.length}` : '', wild ? wild.huntNote() : '', Save.gateWaiting(profile) ? '🦉 ôn tập' : ''].filter(Boolean).join('  '), learned, bag(profile).food);
    const c = story.customer;
    if (c) ui.clue({ who: `Traveller ${c.index + 1}/${c.total}`, text: c.said || `A jar of "${c.target.word}", please!`, key: c.target.word, hints: false, tip: 'Đi tới hũ có nghĩa đúng rồi nhấn E' }, c.said ? 1 : 0, '');
    else if (mini && mini.note) ui.clue(null, 0, '', mini.note);
    else if (story.step === 'gather') { const have = story.items, need = ['rope', 'log', 'axe'];
      ui.clue(null, 0, '', need.every((k) => have.includes(k)) ? 'Take everything to Sam at the bridge.' : 'Find: ' + need.map((k) => (have.includes(k) ? '✓ ' : '☐ ') + k).join('   ')); }
    else ui.clue(null, 0, '', quest.step === 'done' && story.step === 'done' ? 'Chapter complete! The compass piece points to the desert.' : NOTES[story.step] || '');
    crystals.show([]);
    const key = c ? c.index + ':' + c.options.map((o) => o.id).join('|') : '';
    if (key !== jarKey) { jarKey = key; world.setJars(c ? c.options.map((o) => o.vi) : null); }
  }
  if (letterProp) letterProp.visible = L.NAME === 'village' && story.step === 'letter_find';
  const ground = L.NAME === 'village' ? story.groundItems() : [];
  for (const [id, m] of Object.entries(itemProps)) m.visible = ground.includes(id);
  if (L.NAME === 'village') placeVillageHelpers();
}
/** Big bobbing "!" / "?" above whoever has a job for the child (same markers as the minimap), so quest givers are
 *  easy to find in the 3D view (feedback 17/11). */
const markTex = {}, markPool = [], MARKS = { '!': '#ffd23c', '?': '#ffe9a0', '✉': '#fff4dc', '🦉': '#ffe28a' };
function markTexture(ch) {
  if (markTex[ch]) return markTex[ch];
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  c.beginPath(); c.arc(64, 64, 52, 0, 7); c.fillStyle = MARKS[ch]; c.fill(); c.lineWidth = 9; c.strokeStyle = '#7a4a1a'; c.stroke();
  c.fillStyle = '#5a2e0a'; c.font = `900 ${ch.length > 1 ? 58 : 78}px system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, 64, 70);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return (markTex[ch] = t);
}
let HALO = null;
function haloTexture() {
  if (HALO) return HALO;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'), g = c.createRadialGradient(64, 64, 6, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,240,170,1)'); g.addColorStop(0.45, 'rgba(255,210,60,0.55)'); g.addColorStop(1, 'rgba(255,200,40,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  return (HALO = new THREE.CanvasTexture(cv));
}
let marks3d = null; const shadowAt = new THREE.Vector3();
function questMarks(list) {
  // quest givers: the solid spinning "!" / "?" with a light beam (game/marks.js); the owl's review counts as a job
  marks3d = marks3d || new QuestMarks(scene);
  marks3d.set(list.filter((m) => m.text === '!' || m.text === '?' || m.text === '🦉').map((m) => { const g = L.walkHeight(m.x, m.z); return { x: m.x, z: m.z, text: m.text === '?' ? '?' : '!', ground: g, head: g + 2.05 }; }));
  const want = list.filter((m) => m.text === '✉');          // the lost letter keeps its small bobbing badge
  while (markPool.length < want.length) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true })); sp.scale.setScalar(0.8); sp.renderOrder = 5;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: 0xffd23c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.scale.setScalar(1.7); halo.renderOrder = 4;
    sp.userData.halo = halo; scene.add(sp, halo); markPool.push(sp);
  }
  markPool.forEach((sp, i) => {
    const m = want[i]; sp.visible = sp.userData.halo.visible = !!m; if (!m) return;
    if (sp.material.map !== markTexture(m.text)) { sp.material.map = markTexture(m.text); sp.material.needsUpdate = true; }
    sp.position.x = m.x; sp.position.z = m.z; sp.userData.y = L.walkHeight(m.x, m.z) + 1.3;
  });
}
/** Sam waits at the broken bridge during "Fix the Bridge"; Pip joins him to read the plan. */
function placeVillageHelpers() {
  const st = story.step, atBridge = st === 'bridge' || st === 'gather' || st === 'plan';
  const [sx, sz] = atBridge ? BRIDGE_SPOTS.sam : [L.riverX(18) - 5.6, 17.2];
  if (sam.x !== sx || sam.z !== sz) sam.move(sx, sz, atBridge ? 1.4 : 1.2);
  if (st === 'plan' || (st === 'gather' && ['rope', 'log', 'axe'].every((k) => story.items.includes(k)))) { pip.root.visible = true; pip.place(...BRIDGE_SPOTS.pip); }
  else if (!profile.flags.forest_open) pip.root.visible = false;
}
/** Applies this profile's bridge state to the map, the scenery and the minimap. */
function applyBridge() {
  const open = !!(profile && profile.flags.bridge_fixed);
  const changed = L.setBridgeOpen('village', 'south', open);
  if (L.NAME === 'village' && world) { world.setBridgeOpen('south', open); if (changed && minimap) minimap.rebuild(); }
}
function placeActors() {
  if (L.NAME === 'village') {
    tom.move(2.6, 7.6, -0.4); ben.move(-9.9, 19.5, Math.PI / 2); sam.move(L.riverX(18) - 5.6, 17.2, 1.2);
    const ex = L.EXITS[0]; if (profile && profile.flags.forest_open) { pip.root.visible = true; pip.place(ex.x + 2.2, ex.z + 3); } else pip.root.visible = false;
    if (story) placeVillageHelpers();
    for (const f of friends) f.npc.move(...f.at);
  } else {
    tom.move(L.ENTRANCE.x + 2.4, L.ENTRANCE.z - 12, 0.2); sam.move(30.2, 49.6, 2.2); ben.hide();
    for (const f of friends) f.npc.hide();
    pip.root.visible = true; pip.place(L.ENTRANCE.x + 3.4, L.ENTRANCE.z - 12.5);
  }
}
/** Loads another region: swaps map data, rebuilds the scenery, moves everyone. at = [x, z] or the region's spawn. */
async function enterRegion(name, at) {
  switching = true; ui.prompt('');
  if (story) story.leaveMarket();
  L.setRegion(name);
  if (world) world.dispose();
  jarKey = '';
  world = await buildWorld(scene, staticModel);
  const q = QUALITY[quality]; world.setDetail(q.density, q.particles, q.far);
  scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => (m.needsUpdate = true)); });
  try { await renderer.compileAsync(scene, camera); } catch { /* older browsers: shaders compile on first sight */ }      // no hitch when new things come into view
  minimap.rebuild(); placeActors(); if (walkers) walkers.setRegion(name); if (mini) mini.setRegion(name); if (wild) wild.setRegion(name); if (chests) chests.setRegion(name); if (spots) spots.setRegion(name); if (forestStall) forestStall.visible = name === 'forest';
  const [x, z] = at || [L.SPAWN.x, L.SPAWN.z];
  game.teleport(x, z); player.yaw = Math.PI; cam.tYaw = cam.yaw = 0.25;
  if (quest && quest.step === 'seek') quest.clueStart = performance.now();
  switching = false; save(); refresh();
}
/** Words, story and quest for the profile's grade and current unit (Save.unitOf). Called again when the unit changes. */
function learning(p, units) {
  const forestMarks = L.REGIONS.forest.LANDMARKS, find = (w) => { for (let n = 0; n < 12; n++) { const u = units[n]; if (u && (u.vocabulary || []).some((v) => v.word.toLowerCase() === w)) return `g${p.grade}_u${String(n + 1).padStart(2, '0')}:${w}`; } return null; };
  wordIds = {}; forestMarks.forEach((l) => { wordIds[l.en] = find(l.en) || 'forest:' + l.en; });
  const un = Save.unitOf(p), unit = units[un - 1], uid = `g${p.grade}_u${String(un).padStart(2, '0')}`;
  const cards = ((unit && unit.vocabulary) || []).filter((w) => w.word.length <= 22 && w.vi.length <= 34).map((w) => ({ id: `${uid}:${w.word.toLowerCase()}`, word: w.word, vi: w.vi }));
  const cardOf = (id) => { const [u, w] = id.split(':'), m = /^g(\d)_u(\d\d)$/.exec(u); if (!m || Number(m[1]) !== p.grade) return null; const src = units[Number(m[2]) - 1], hit = src && (src.vocabulary || []).find((v) => v.word.toLowerCase() === w); return hit ? { id, word: hit.word, vi: hit.vi } : null; };
  quest = new ForestQuest({ profile, save, ui, sfx, wordId: (w) => wordIds[w] || 'forest:' + w, onChange: refresh });
  story = new VillageStory({ profile, save, ui, sfx, teach: (list) => teach(list, null), onChange: refresh, letter: (unit && unit.activities && unit.activities.lost_letter) || null, cards, cardOf,
    bridge: BRIDGE[p.grade] || null, onBridgeFixed: applyBridge });
  if (story.step === 'jars_play') story.q.step = 'jars';
  if (mini) { mini.stop(); mini.syncStars(); }
  unitCards = cards; cardOfFn = cardOf; if (chests) chests.sync();
  ui.gloss = new Map();                       // tap-a-word meanings in dialogue: every unit of this grade, plus the bridge things
  for (const u of units) for (const v of (u && u.vocabulary) || []) if (v.word.split(/\s+/).length <= 3 && v.word.length > 2) ui.gloss.set(v.word.toLowerCase(), v.vi);
  for (const it of Object.values((BRIDGE[p.grade] || {}).items || {})) ui.gloss.set(it.en, it.vi);
}
/** Teach before testing (feedback 17/11): words the child has never met are shown first as big "new word" cards,
 *  read aloud with their meaning, then the question or game starts. Shown once per word. */
function teach(list, then, most = 5) {
  const seen = profile.seen || (profile.seen = {}), fresh = list.filter((c) => c && !seen[c.id] && !profile.words[c.id]).slice(0, most);
  if (!fresh.length) { if (then) then(); return; }
  for (const c of fresh) seen[c.id] = Review.today(); save();
  ui.dialogue(fresh.map((c, i) => ({ who: `Từ mới ${i + 1}/${fresh.length}`, card: c })), then);
}
// ---------------------------------------------------------------- click to walk (18/11)
// A short click (no drag) on the ground plans a route there, the same way the minimap does; a drag still turns the
// camera. The ray is marched against the height map (cheap, no mesh picking). A gold ring marks the spot.
let clickAt = null, walkMark = null;
canvas.addEventListener('pointerdown', (e) => { if (e.button === 0 && e.pointerType !== 'touch') clickAt = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointerup', (e) => {
  const c = clickAt; clickAt = null;
  if (!c || e.button !== 0 || !started || switching || ui.modal || (arcade && arcade.open) || (shopWin && shopWin.open)) return;
  if (Math.hypot(e.clientX - c.x, e.clientY - c.y) > 6) return;          // the mouse moved: that was a camera drag
  const r = canvas.getBoundingClientRect(), ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, camera);
  const o = ray.ray.origin, d = ray.ray.direction; let hit = null;
  for (let k = 0.5; k < 160; k += 0.25) { const x = o.x + d.x * k, y = o.y + d.y * k, z = o.z + d.z * k; if (y <= L.walkHeight(x, z)) { hit = [x, z]; break; } }
  if (!hit || !minimap.travelTo(hit[0], hit[1])) return;
  if (!walkMark) { walkMark = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.55, 24), new THREE.MeshBasicMaterial({ color: 0xffd23c, transparent: true, depthWrite: false, side: THREE.DoubleSide })); walkMark.rotation.x = -Math.PI / 2; scene.add(walkMark); }
  walkMark.position.set(hit[0], L.walkHeight(hit[0], hit[1]) + 0.06, hit[1]); walkMark.visible = true; walkMark.userData.t = 0;
});
// ---------------------------------------------------------------- admin (password 321, see ui/admin.js)
let admin = null, music = null, journal = null;
/** Counts a game event for today's quests; tells the child when one is finished. */
function track(ev, n = 1) {
  if (!profile) return;
  const done = Q.track(profile, Review.today(), ev, n);
  for (const q of done) { ui.toast('📜 Xong nhiệm vụ ngày: ' + q.en); sfx('fanfare'); }
  if (done.length) save(); if (journal) journal.sync();
}
function claimReward(r, what) {
  if (!r) return; profile.stats.gold += r.gold; if (r.exp) Save.addExp(profile, r.exp); sfx('fanfare'); save(); refresh();
  ui.toast(`🎁 ${what}: +${r.gold} vàng${r.exp ? `, +${r.exp} EXP` : ''}${r.bonusAll ? ' (thưởng xong cả 3!)' : ''}`);
}
// Anna's music house (moved west on 18/11, door on the east side); Willow's stall at the forest camp (Map 2 gear)
const ANNA_DOOR = { x: -17.4, z: 12.5 }, FOREST_SHOP = { x: -36.5, z: 39.5 };
let forestStall = null, room = null;
const HALL_DOOR = { x: 0, z: -16.4 }, LILY_DOOR = { x: -17.4, z: -4 };
/** Inside a house: the room is drawn instead of the world, the window docks on the right (body.inroom). */
function enterRoom(kind) { leaveRoom(); room = buildRoom(kind); document.body.classList.add('inroom'); sfx('tick'); }
function leaveRoom() { if (!room) return; room.dispose(); room = null; document.body.classList.remove('inroom'); }
function adminPlaces() {
  const out = [], add = (region, name, x, z) => out.push({ region, name, x, z });
  for (const r of ['village', 'forest']) for (const l of L.REGIONS[r].LANDMARKS) add(r, l.label, ...(l.spot || [l.x, l.z]));
  add('village', 'Tom', 2.6, 9.6); add('village', 'Cửa hàng', SHOP_DOOR.x - 1, SHOP_DOOR.z); add('village', 'Cú Mèo', OWL.x, OWL.z + 1.2); add('village', 'Bảng săn quái', BOARD.x + 1.2, BOARD.z + 1);
  for (const st of STARTS) add('village', 'Trò: ' + st.sign.replace(/^\S+\s/, ''), st.x + 0.8, st.z + 0.8);
  add('village', 'Vua Slime', BOSS_AT.x, BOSS_AT.z - 4); add('village', 'Golem Cổ', BOSS2_AT.x, BOSS2_AT.z - 4); add('village', 'Rương Đồng Hoang', CHEST_SPOTS[0][0], CHEST_SPOTS[0][1] - 1.5);
  add('forest', 'Cổng vào rừng', L.REGIONS.forest.SPAWN.x, L.REGIONS.forest.SPAWN.z); add('forest', 'Bảng săn quái rừng', FOREST_BOARD.x + 1.2, FOREST_BOARD.z + 0.6);
  add('forest', 'Nữ hoàng Nấm', BOSS3_AT.x + 6, BOSS3_AT.z); add('forest', 'Rương rừng', FOREST_CHESTS[0][0], FOREST_CHESTS[0][1] - 1.5);
  return out;
}
/** Nearest free spot to (x, z) in a region: admins land beside a house or NPC, never inside it. */
function freeSpot(region, x, z) {
  const R = L.REGIONS[region];
  for (let d = 0; d < 8; d += 0.5) for (let a = 0; a < 6.28; a += 0.5) { const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; if (R.walkable(px, pz, 0.5)) return [px, pz]; if (!d) break; }
  return [x, z];
}
async function adminGo(region, x, z) {
  const at = freeSpot(region, x, z);
  if (region !== L.NAME) { if (region === 'forest') profile.flags.forest_open = true; await enterRegion(region, at); } else game.teleport(...at);
  ui.toast('Đã tới nơi');
}
const STEP_ORDER = ['arrive', 'letter_find', 'letter_return', 'jars', 'jars_play', 'tom_bridge', 'bridge', 'gather', 'plan', 'open', 'done'];
function adminStep(step) {
  const k = STEP_ORDER.indexOf(step); profile.flags.arrived = true;
  profile.flags.bridge_fixed = k >= STEP_ORDER.indexOf('open'); profile.flags.forest_open = step === 'done';
  if (story.market) story.leaveMarket();
  story.set(step); applyBridge();
}
function adminUnlock() {
  Object.assign(profile.flags, { arrived: true, forest_open: true, bridge_fixed: true, map2: true, boss1: true, boss2: true });
  profile.gates = Object.fromEntries(Save.GATES.map((g) => [g, true]));
  if (STEP_ORDER.indexOf(story.step) < STEP_ORDER.indexOf('done')) story.set('done');
  applyBridge(); reloadUnit();
}
function adminLevel(n) {
  const st = profile.stats; st.level = n; st.exp = 0; profile.gates = profile.gates || {};
  for (const g of Save.GATES) if (g <= n) profile.gates[g] = true;
  st.hp = Save.maxHp(profile);
}
/** After a word game, its host asks up to three of the words the child met in it (English → meaning, 3 options). */
function hostQuiz(who, words) {
  const pool = unitCards.length >= 4 ? unitCards : words, list = [...words].sort(() => Math.random() - 0.5).slice(0, 3); let right = 0;
  const ask = (n) => {
    if (n >= list.length) { const gold = right * 4; profile.stats.gold += gold; Save.addExp(profile, right * 5); save(); refresh(); sfx(right ? 'fanfare' : 'tick');
      ui.dialogue([{ who, en: right === list.length ? 'Perfect! You remember every word!' : `You got ${right} of ${list.length}. Well done!`, vi: `+${gold} vàng, +${right * 5} EXP` }]); return; }
    const c = list[n], opts = [c, ...pool.filter((x) => x.id !== c.id && x.vi !== c.vi).sort(() => Math.random() - 0.5).slice(0, 2)].sort(() => Math.random() - 0.5), t0 = Date.now();
    ui.choose({ who: `${who} · ${n + 1}/${list.length}`, en: `What does "${c.word}" mean?`, vi: 'Từ con vừa gặp trong trò chơi.' }, opts.map((o) => o.vi), (i) => {
      const ok = opts[i].id === c.id; if (ok) right += 1; Review.record(profile.words, c.id, { correct: ok, hints: 0, ms: Date.now() - t0 }); sfx(ok ? 'correct' : 'wrong');
      if (ok) ask(n + 1); else ui.dialogue([{ who, en: `"${c.word}" means "${c.vi}".` }], () => ask(n + 1));
    });
  };
  ui.dialogue([{ who, en: 'Before you go: do you remember the words from the game?', vi: `${who} hỏi lại ${list.length} từ con vừa gặp. Đúng mỗi từ +4 vàng.` }], () => ask(0));
}
/** A word sparkle was touched: teach one word (a new one first, else one met before), with a small reward. */
function learnWord(card, isNew) {
  if (!card) { ui.dialogue([{ who: 'Pip', en: 'This bubble is empty…', vi: `Từ vựng Unit ${Save.unitOf(profile)} lớp ${profile.grade} chưa có.` }]); save(); return; }
  (profile.seen || (profile.seen = {}))[card.id] = Review.today(); track('bubble');
  const exp = isNew ? 6 : 3, gold = isNew ? 2 : 1; profile.stats.gold += gold; Save.addExp(profile, exp); sfx('correct'); save(); refresh();
  ui.dialogue([{ who: isNew ? '✨ Từ mới' : '🔁 Ôn lại', card, vi: `${isNew ? 'Nghe, đọc theo rồi nhớ nghĩa nhé.' : 'Con nhớ từ này chứ? Nghe và đọc lại nhé.'} (+${exp} EXP, +${gold} vàng)` }]);
}
/** Word book (B key, 📖 button): every word of the unit as a card, read aloud; Esc closes it. */
function wordBook() {
  if (ui.busy || !unitCards.length) { if (!unitCards.length) ui.toast(`Unit ${Save.unitOf(profile)} chưa có từ vựng`); return; }
  const seen = profile.seen || (profile.seen = {}); for (const c of unitCards) seen[c.id] = seen[c.id] || Review.today(); save();
  ui.dialogue(unitCards.map((c, i) => ({ who: `📖 Unit ${Save.unitOf(profile)} · ${i + 1}/${unitCards.length}`, card: c, book: true, vi: profile.words[c.id] ? '✔ Con đã trả lời đúng từ này. Bấm 🔊 để nghe lại.' : 'Nghe, đọc theo rồi nhớ nghĩa nhé. Esc: đóng sổ.' })));
}
async function reloadUnit() { learning(profile, await loadGrade(profile.grade)); save(); refresh(); }
async function chooseProfile(p) {
  unlock(); profile = p; store.last = p.id; started = false; shownLevel = 0;
  learning(p, await loadGrade(p.grade));                                   // this grade only
  wear(profile); setSword(); setWear();
  if ((story.step === 'open' || story.step === 'done') && !p.flags.bridge_fixed) p.flags.bridge_fixed = true;   // saves from before the bridge quest
  applyBridge();
  $('mapbox').classList.remove('hidden');
  await enterRegion(p.region === 'forest' && p.flags.forest_open ? 'forest' : 'village');
  started = true; renderGear(); if (admin) admin.sync();
  if (L.NAME === 'village' && story.step === 'arrive' && !p.flags.arrived) startIntro();
}

/** Shop: a choice list. Buying puts the item on at once; owned items can be put on again for free. */
function openShop(who, seller, hello) {
  const b = bag(profile), ids = shopList(seller);
  const line = (id) => { const it = ITEMS[id], own = it.slot !== 'food' && b.owned.includes(id), on = b[it.slot] === id;
    const stat = [it.atk && `ATK +${it.atk}`, it.def && `DEF +${it.def}`, it.hp && `HP +${it.hp}`, it.heal && `heals ${it.heal}`].filter(Boolean).join(', ');
    return `${it.en} (${stat}) · ${on ? 'wearing' : own ? 'put on' : it.cost + ' ●' + (profile.stats.level < it.level ? ' · Lv ' + it.level : '')}`; };
  ui.choose({ who, en: hello, vi: `Vàng: ${profile.stats.gold} ● · Bánh trong túi: ${b.food}` }, [...ids.map(line), 'Goodbye!'], (i) => {
    if (i >= ids.length) return;
    const id = ids[i], it = ITEMS[id], r = buy(profile, id);
    if (r.ok) { sfx('correct'); setSword(); setWear(); save(); refresh(); return openShop(who, seller, r.why === 'owned' ? `You are wearing the ${it.en} now.` : `Here is your ${it.en}! Anything else?`); }
    sfx('wrong'); openShop(who, seller, r.why === 'gold' ? `Sorry, the ${it.en} costs ${it.cost} gold.` : `The ${it.en} is for level ${it.level} heroes. Train a little more!`);
  });
}
/** Opening scene (feedback 17/11): a new child arrives by boat down the river and steps onto the village dock.
 *  E / Space skips it. Not shown to automated tests unless the address has ?intro=1. */
let intro = null;
function makeBoat() {
  const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x9a5a30, roughness: 0.8, side: THREE.DoubleSide }), light = new THREE.MeshStandardMaterial({ color: 0xc89058, roughness: 0.85 });
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), wood); hull.scale.set(0.85, 0.5, 1.9); g.add(hull);
  const deck = new THREE.Mesh(new THREE.CircleGeometry(1, 20), light); deck.rotation.x = -Math.PI / 2; deck.scale.set(0.8, 1.8, 1); deck.position.y = -0.3; g.add(deck);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 24), light); rim.rotation.x = Math.PI / 2; rim.scale.set(0.85, 1.9, 1); g.add(rim);
  for (const z of [-0.9, 0.7]) { const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.32), light); seat.position.set(0, -0.12, z); g.add(seat); }
  const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), light); oar.rotation.z = 1.1; oar.position.set(0.9, 0.1, 0.1); g.add(oar);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return g;
}
function startIntro() {
  if (navigator.webdriver && !/[?&]intro=1/.test(location.search)) { profile.flags.arrived = true; return; }
  ui.dialogue(OPENING(profile.name), () => {          // the story first, then the boat ride (18/11)
    if (!intro) { intro = { boat: makeBoat(), t: 0, len: 9 }; scene.add(intro.boat); }
    intro.t = 0; intro.boat.visible = true; intro.active = true;
    ui.toast('Ngọc đang tới làng bằng thuyền…');
  });
}
function introStep(dt) {
  const k = Math.min(1, (intro.t += dt) / intro.len), e = k * k * (3 - 2 * k), z = 38 - e * 17.5, x = L.riverX(z) + 0.6 * Math.sin(k * 6);
  const y = L.WATER_LEVEL + 0.42 + Math.sin(intro.t * 2.2) * 0.04, ahead = L.riverX(z - 0.5) - L.riverX(z);
  intro.boat.position.set(x, y, z); intro.boat.rotation.y = Math.atan2(ahead, -0.5) + Math.PI; intro.boat.rotation.z = Math.sin(intro.t * 1.7) * 0.04;
  player.pos.set(x, y - 0.22, z - 0.1); player.yaw = intro.boat.rotation.y + Math.PI; player.sync(); player.mixer.update(dt);
  if (k >= 1) endIntro();
}
function endIntro() {
  intro.active = false; intro.boat.visible = false; profile.flags.arrived = true;
  game.teleport(18.2, 18.6); player.yaw = -Math.PI / 2; save(); sfx('fanfare');
  ui.toast('Chào mừng tới Làng Khởi Đầu!');
}
/** Bag screen (I key or the 🎒 button): lists owned gear with its numbers; picking an item puts it on or takes it off. */
function openBag() {
  const b = bag(profile), ids = b.owned.filter((id) => ITEMS[id]), g = wear(profile);
  const line = (id) => { const it = ITEMS[id], on = b[it.slot] === id, stat = [it.atk && `ATK +${it.atk}`, it.def && `DEF +${it.def}`, it.hp && `HP +${it.hp}`].filter(Boolean).join(', ');
    return `${on ? '✔ ' : ''}${it.en} (${stat}) · ${on ? 'take off' : 'put on'}`; };
  ui.choose({ who: 'Bag', en: ids.length ? 'What do you want to wear?' : 'Your bag is empty. Visit Bram and Rose to buy gear!',
    vi: `Tấn công ${playerAtkOf()} · Phòng thủ ${g.def} · Máu tối đa ${Save.maxHp(profile)} · Vàng ${profile.stats.gold} ● · Bánh ${b.food} (phím Q)` },
  [...ids.map(line), 'Close'], (i) => {
    if (i >= ids.length) return;
    const id = ids[i], it = ITEMS[id]; b[it.slot] = b[it.slot] === id ? '' : id;
    wear(profile); setSword(); setWear(); sfx('tick'); save(); refresh(); openBag();
  });
}
const playerAtkOf = () => playerAtk(profile);
/** Shows the worn weapon in Ngọc's right hand. */
let swordMesh = null;
function setSword() {
  if (!player || !profile) return;
  let hand = null; player.root.traverse((o) => { if (!hand && o.isBone && /hand.?R$/i.test(o.name)) hand = o; });
  if (swordMesh) { swordMesh.removeFromParent(); swordMesh = null; }
  const it = ITEMS[bag(profile).weapon]; if (!hand || !it) return;
  const g = new THREE.Group(), mat = (c, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: m ? 0.3 : 0.7, metalness: m, emissive: it.color === 0x7fd6ff ? 0x2f8fd0 : 0, emissiveIntensity: 0.6 });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.6, 0.022), mat(it.color, it.atk > 5 ? 0.7 : 0)); blade.position.y = 0.4; g.add(blade);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 4), blade.material); tip.position.y = 0.76; tip.scale.z = 0.45; g.add(tip);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.05), mat(0xe2b04a, 0.8)); guard.position.y = 0.09; g.add(guard);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.16, 8), mat(0x5f3519)); g.add(grip);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.rotation.set(Math.PI / 2, 0, 0); g.position.set(0, 0.05, 0.03); hand.add(g); swordMesh = g;
}
/** Worn armour on the chest and the charm on the hip (A6). */
let armorShown = null, charmShown = null;
function setWear() {
  if (!player || !profile) return;
  const bone = (re) => { let b = null; player.root.traverse((o) => { if (!b && o.isBone && re.test(o.name)) b = o; }); return b; };
  for (const m of [armorShown, charmShown]) if (m) m.removeFromParent();
  armorShown = charmShown = null; const b = bag(profile);
  const chest = bone(/^chest$/), hips = bone(/^hips$/);
  const a = armorMesh(b.armor); if (a && chest) { chest.add(a); armorShown = a; }
  if (b.charm && hips) { const c = charmMesh(); c.position.set(0.13, 0.02, 0.08); hips.add(c); charmShown = c; }
}
/** The owl's review: five quick questions on learned and unit words, both directions. 4 of 5 opens the gate. */
const OWL = { x: 2.9, z: 14.5 }, SHOP_DOOR = { x: 7.6, z: -8 };      // the orange shop's door (west side)
function owlReview() {
  const L0 = Save.gateWaiting(profile);
  if (!L0) { const next = Save.GATES.find((g) => g > profile.stats.level); ui.dialogue([{ who: 'Owl', en: 'Hoo-hoo! Keep training, little hero.', vi: next ? `Đến cấp ${next}, cú sẽ ôn tập với con để mở cấp tiếp theo.` : 'Con đã qua hết các cổng ôn tập của làng.' }]); return; }
  const seen = Object.keys(profile.words).map((id) => cardOfFn(id)).filter(Boolean), pool = [...seen, ...unitCards.filter((c) => !seen.some((x) => x.id === c.id))].filter((c) => c.word.length <= 22);
  if (pool.length < 4) { Save.passGate(profile, L0); save(); refresh(); ui.dialogue([{ who: 'Owl', en: 'Hoo! No words to review yet. Go on!', vi: `Từ vựng Unit ${Save.unitOf(profile)} lớp ${profile.grade} chưa có, cổng tự mở.` }]); return; }
  const due = new Set(Review.dueIds(profile.words)), order = [...pool].sort((a, b) => (due.has(b.id) ? 1 : 0) - (due.has(a.id) ? 1 : 0) || Math.random() - 0.5).slice(0, 5);
  const gram = GRAMMAR_GATES.includes(L0) ? grammarFor(profile.grade, Save.unitOf(profile)) : [], total = order.length + gram.length;
  let right = 0;
  const ask = (n) => {
    if (n >= total) {
      const pass = right >= total - 1;
      if (pass) { Save.passGate(profile, L0); sfx('fanfare'); }
      save(); refresh();
      ui.dialogue([{ who: 'Owl', en: pass ? `Wonderful! ${right} of ${total}. You may grow stronger now!` : `${right} of ${total}. Let's try again soon!`, vi: pass ? 'Cổng ôn tập đã mở, con lên cấp rồi!' : `Cần đúng ${total - 1}/${total} câu. Ôn lại rồi gặp cú lần nữa nhé.` }]);
      return;
    }
    if (n >= order.length) {          // grammar: choose the right form (N5)
      const g = gram[n - order.length], idx = g.options.map((_, i) => i).sort(() => Math.random() - 0.5);
      ui.choose({ who: `Owl · ${n + 1}/${total}`, en: g.q, vi: 'Chọn dạng đúng điền vào chỗ trống.' }, idx.map((i) => g.options[i]), (k) => {
        const ok = idx[k] === g.a; if (ok) right += 1; Save.recordSkill(profile, 'grammar', ok, 0); sfx(ok ? 'correct' : 'wrong');
        if (ok) ask(n + 1); else ui.dialogue([{ who: 'Owl', en: g.q.replace('___', g.options[g.a]), vi: g.why }], () => ask(n + 1));
      });
      return;
    }
    const c = order[n], toEn = n % 2 === 0, others = pool.filter((x) => x.id !== c.id && x.vi !== c.vi && x.word !== c.word).sort(() => Math.random() - 0.5).slice(0, 3);
    const opts = [c, ...others].sort(() => Math.random() - 0.5), started = Date.now();
    ui.choose({ who: `Owl · ${n + 1}/${total}`, en: toEn ? 'Which English word is it?' : `What does "${c.word}" mean?`, vi: toEn ? c.vi : undefined }, opts.map((o) => (toEn ? o.word : o.vi)), (i) => {
      const ok = opts[i].id === c.id; if (ok) right += 1;
      Review.record(profile.words, c.id, { correct: ok, hints: 0, ms: Date.now() - started }); Save.recordSkill(profile, 'vocabulary', ok, 0); sfx(ok ? 'correct' : 'wrong');
      if (ok) ask(n + 1); else ui.dialogue([{ who: 'Owl', en: 'Hoo… not that one.', vi: `${c.word} = ${c.vi}` }], () => ask(n + 1));
    });
  };
  ui.dialogue([{ who: 'Owl', en: 'Hoo-hoo! Answer my questions and you can grow stronger.', vi: `Ôn ${total} câu${gram.length ? ` (có ${gram.length} câu ngữ pháp)` : ''}, đúng ${total - 1} câu thì lên được cấp ${L0 + 1}.` }], () => teach(order, () => ask(0)));
}
const near = (x, z, r) => Math.hypot(player.pos.x - x, player.pos.z - z) < r;
function interactTarget() {
  const p = player.pos;
  for (const ex of L.EXITS) if (near(ex.x, ex.z, ex.r)) {
    if (ex.flag && !profile.flags[ex.flag]) return { text: 'Cổng rừng còn khóa. Hãy giúp Tom và Ben trước.', run() {} };
    return { text: 'E · ' + ex.label, run: () => { const back = ex.to === 'village' ? [L.REGIONS.village.EXITS[0].x + 0.5, L.REGIONS.village.EXITS[0].z + 5] : null; enterRegion(ex.to, back); } };
  }
  if (L.NAME === 'forest') {
    const c = crystals.nearest(p);
    if (c) return { text: 'E · Chạm vào pha lê ký ức', run: () => { player.emote('Interact'); if (quest.touch(c)) player.emote('Celebrate'); } };
    if (near(tom.x, tom.z, 3)) return { text: 'E · Nói chuyện với Tom', run: () => quest.talkTom() };
    if (near(sam.x, sam.z, 3)) return { text: 'E · Nói chuyện với Sam', run: () => ui.dialogue(SAM_LINES) };
    const tree = landmark('tree');
    if (quest.step === 'tree' && near(tree.spot[0], tree.spot[1], 3.2)) return { text: 'E · Đặt pha lê vào cây cổ thụ', run: () => quest.treeChallenge() };
    if (near(FOREST_SHOP.x + 1.6, FOREST_SHOP.z + 0.6, 2.4)) return profile.flags.map2 ? { text: "E · Cửa hàng của Willow (đồ Map 2)", run: () => { enterRoom('forest'); shopWin.show("Willow's Camp Shop", ['forest']); } } : { text: 'Quầy của Willow mở khi tới Map 2', run() {} };
    for (const f of [wild, chests, spots]) { const c = f && f.interact(p); if (c) return c; }      // Map 2: board, boss shield, chests, word bubbles
    return null;
  }
  if (story.market) {
    const i = MARKET_JARS.findIndex(([x, z]) => near(x, z, 1.35));
    if (i >= 0) return { text: 'E · Đưa hũ này cho khách', run: () => { player.emote('Interact'); if (story.serve(i)) { player.emote('Celebrate'); } } };
    return null;
  }
  { const m = mini && mini.interact(player.pos); if (m) return m; }
  { const c = chests && chests.interact(player.pos); if (c) return c; }
  { const c = spots && spots.interact(player.pos); if (c) return c; }
  { const w = wild && wild.interact(player.pos); if (w) return w; }
  if (L.NAME === 'village' && near(OWL.x, OWL.z, 2.2)) return { text: Save.gateWaiting(profile) ? 'E · Cú Mèo: ôn tập để lên cấp' : 'E · Nói chuyện với Cú Mèo', run: owlReview };
  if (letterProp.visible && near(letterProp.position.x, letterProp.position.z, 2.2)) return { text: 'E · Nhặt bức thư', run: () => { player.emote('Interact'); story.readLetter(); } };
  for (const [id, m] of Object.entries(itemProps)) if (m.visible && near(m.position.x, m.position.z, 2.0)) return { text: 'E · Nhặt vật này', run: () => { player.emote('Interact'); if (story.pick(id)) player.emote('Celebrate'); } };
  if (near(tom.x, tom.z, 3)) return { text: 'E · Nói chuyện với Tom', run: () => story.talkTom() };
  if (near(ben.x, ben.z, 3.6)) return { text: 'E · Nói chuyện với Ben', run: () => story.talkBen() };
  if (near(sam.x, sam.z, 3)) return { text: 'E · Nói chuyện với Sam', run: () => story.talkSam() };
  if (near(SHOP_DOOR.x, SHOP_DOOR.z, 1.7)) return { text: 'E · Vào cửa hàng (xem và mua bán đồ)', run: () => { enterRoom('shop'); shopWin.show('Village Shop'); } };
  if (near(HALL_DOOR.x, HALL_DOOR.z, 1.8)) return { text: 'E · Vào nhà trưởng làng (sổ nhiệm vụ chính tuyến)', run: () => { enterRoom('hall'); journal.show('main'); speak('Welcome to my office! Here is your quest book.'); } };
  if (near(LILY_DOOR.x, LILY_DOOR.z, 1.8)) return { text: 'E · Vào nhà Lily (nhiệm vụ hằng ngày)', run: () => { enterRoom('herb'); journal.show('daily'); speak('Hello! Here are your tasks for today.'); } };
  if (near(ANNA_DOOR.x, ANNA_DOOR.z, 1.9)) return { text: 'E · Vào phòng nhạc của Anna (nghe hát, học lời)', run: () => { enterRoom('music'); music.show(); } };
  { const wi = walkers ? walkers.near(p) : -1; if (wi >= 0) return { text: 'E · Chào dân làng', run: () => { talkW = wi; ui.dialogue([{ who: 'Villager', en: walkers.greet(wi) }]); } }; }
  for (const f of friends) if (near(f.npc.x, f.npc.z, 2.6)) {
    if (f.shop) return { text: 'E · Cửa hàng của ' + f.who, run: () => openShop(f.who, f.shop, f.lines[0]) };
    return { text: 'E · Nói chuyện với ' + f.who, run: () => ui.dialogue(f.lines.map((en) => ({ who: f.who, en }))) };
  }
  return null;
}
function onKey(e) {
  if (!started) return;
  if (arcade && arcade.key(e.code)) { e.preventDefault(); return; }
  if (shopWin && shopWin.key(e.code)) { e.preventDefault(); return; }
  if (music && music.key(e.code)) { e.preventDefault(); return; }
  if (journal && !ui.busy && journal.key(e.code)) { e.preventDefault(); return; }
  if (intro && intro.active) { if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Escape') endIntro(); e.preventDefault(); return; }
  if (e.code === 'F3') { perfOn = !perfOn; $('perf').classList.toggle('hidden', !perfOn); e.preventDefault(); return; }
  if (admin && admin.key(e.code)) { e.preventDefault(); return; }
  if (ui.key(e)) { e.preventDefault(); return; }
  if (ui.modal) return;
  if (e.code === 'KeyE') { const t = interactTarget(); if (t) t.run(); }
  if (e.code === 'KeyH') quest.hint();
  if (e.code === 'KeyI' && profile) openBag();
  if (e.code === 'KeyB' && profile) wordBook();
  if (e.code === 'KeyQ' && profile) { const got = eat(profile, Save.maxHp(profile)); if (got) { sfx('correct'); ui.toast(`+${got} HP`); save(); refresh(); } }
  if (e.code === 'KeyK' && wild && !(mini && mini.active)) wild.dodge();
  if ((e.code === 'KeyJ' || e.code === 'KeyF') && wild && !(mini && mini.active)) wild.attack();
  if (e.code === 'Space') e.preventDefault();
}
// Keys typed through a Vietnamese input method arrive as letters with no key code and an instant key-up: they are
// held for a moment instead (renewed by the key repeat), so walking works with Unikey or Windows Telex switched on.
const softKeys = new Map(); let imeTold = false;
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  const code = keyCode(e); if (!code) return;
  if (code === e.code) { if (!e.repeat) onKey(e); keys.add(code); return; }
  if (!softKeys.has(code)) onKey({ code, repeat: false, target: e.target, preventDefault: () => e.preventDefault() });
  softKeys.set(code, performance.now() + 560); keys.add(code);
  if (!imeTold && started) { imeTold = true; ui.toast('Bộ gõ tiếng Việt đang bật: nên tắt khi chơi (Ctrl+Shift hoặc Alt+Z)'); }
});
addEventListener('keyup', (e) => { const code = keyCode(e); if (code === e.code) keys.delete(code); });
addEventListener('blur', () => { keys.clear(); softKeys.clear(); });
function releaseSoftKeys() { const now = performance.now(); for (const [k, until] of softKeys) if (now > until) { softKeys.delete(k); keys.delete(k); } }
addEventListener('resize', resize);

async function boot() {
  resize();
  $('loadtext').textContent = 'Đang gọi Ngọc và các bạn…';
  const [ngoc, tomG, samG, benG, pipG, blink, talk, joy] = await Promise.all([gltf('chr_ngoc_adventurer_v03'), gltf('npc_tom_elder_v02'), gltf('npc_sam_fisherman_v02'), gltf('npc_ben_merchant_v02'), gltf('npc_pip_spirit_v02'), faceTex('blink'), faceTex('talk'), faceTex('joy')]);
  $('loadtext').textContent = 'Đang dựng ngôi làng…';
  L.setRegion('village');
  world = await buildWorld(scene, staticModel);
  player = new Player(ngoc, { blink, talk, joy }); scene.add(player.root);
  tom = new Npc(tomG, 2.6, 7.6, -0.4); sam = new Npc(samG, 14, 17, 1.2); ben = new Npc(benG, -9.9, 19.5, Math.PI / 2); scene.add(tom.root, sam.root, ben.root);
  pip = new Pip(pipG.scene); scene.add(pip.root);
  for (const f of Object.values(FRIENDS)) { const npc = new Npc(await gltf(f.file), ...f.at, ngoc.animations); scene.add(npc.root); friends.push({ ...f, npc }); }
  shopWin = new ShopWindow({ profile: () => profile, sfx, track, onClose: leaveRoom, today: () => Review.today(), changed: () => { setSword(); setWear(); save(); refresh(); } });
  music = new MusicRoom({ profile: () => profile, sfx, track, onClose: leaveRoom, changed: () => { save(); refresh(); } });
  { const F = L.REGIONS.forest, y = F.groundHeight(FOREST_SHOP.x, FOREST_SHOP.z); forestStall = campStall(FOREST_SHOP.x, y, FOREST_SHOP.z, Math.PI / 2 + 0.3);
    const name = label("🌿 Willow's Camp Shop", { size: 28, scale: 0.8 }); name.position.set(0, 3.2, 0); forestStall.add(name); forestStall.visible = false; scene.add(forestStall); }
  journal = new Journal({ profile: () => profile, today: () => Review.today(), onClose: leaveRoom,
    claimMain: (id) => claimReward(Q.claimMain(profile, id), 'Nhiệm vụ chính'), claimDaily: (id) => claimReward(Q.claimDaily(profile, Review.today(), id), 'Nhiệm vụ ngày') });
  Save.hooks.skill = (p, ok) => { if (ok && p === profile) track('right'); };
  walkers = new Walkers(scene, (name) => loader.loadAsync(`./assets/models/${name}.glb`)); await walkers.init();      // villagers on the roads
  for (const a of [player, tom, sam, ben, ...friends.map((f) => f.npc)]) addOutline(a.root);     // cartoon outlines (medium/high)
  const F = L.REGIONS.forest;
  crystals = new Crystals(scene, F.LANDMARKS.filter((l) => l.id !== 'tree'), F.walkHeight);
  const hall = L.REGIONS.village.LANDMARKS.find((l) => l.id === 'hall').spot;
  letterProp = new THREE.Group();
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 10), new THREE.MeshStandardMaterial({ color: 0xfff1cf, emissive: 0xffd88a, emissiveIntensity: 0.6 })); roll.rotation.z = Math.PI / 2; letterProp.add(roll);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 10), new THREE.MeshStandardMaterial({ color: 0xd8342a })); band.rotation.z = Math.PI / 2; letterProp.add(band);
  letterProp.position.set(hall[0] + 1.2, L.REGIONS.village.groundHeight(hall[0] + 1.2, hall[1]) + 0.5, hall[1]); letterProp.visible = false; scene.add(letterProp);
  for (const id of ['rope', 'chain', 'log', 'boulder']) { const [x, z] = BRIDGE_SPOTS[id], m = bridgeItem(id); m.position.set(x, L.REGIONS.village.groundHeight(x, z), z); m.visible = false; scene.add(m); itemProps[id] = m; }
  cam = new OrbitCamera(camera, canvas);
  if (touchWanted()) touch = initTouch({ keys, press: (code) => onKey({ code, preventDefault() {} }), cam, canvas, state: () => ({ playing: started && !switching, arcade: !!(arcade && arcade.open) }) });
  arcade = new Arcade((g, res) => {       // a finished board game pays gold and EXP; quitting pays nothing
    if (!res) return;
    if (g.onResult) return g.onResult(res);
    const best = mini.data.best, record = best[res.id] === undefined || res.score > best[res.id]; if (record) best[res.id] = res.score;
    const r = pay(profile, res.id, Review.today(), res.gold, res.exp);
    profile.stats.gold += r.gold; Save.addExp(profile, r.exp); sfx('fanfare'); save(); refresh();
    track('mini'); for (const c of res.words || []) (profile.seen || (profile.seen = {}))[c.id] = Review.today();      // words met inside the game count as seen
    ui.dialogue([{ who: 'Ngọc', en: `${res.text} (+${r.gold} gold, +${r.exp} EXP)`, vi: [record ? 'Kỷ lục mới của con!' : '', payNote(r)].filter(Boolean).join(' ') || undefined }],
      () => { if (res.words && res.words.length >= 2) hostQuiz(res.id === 'blocks' ? 'Max' : 'Leo', res.words); });
  });
  spots = new WordSpots({ scene, profile: () => profile, cards: () => unitCards, learn: learnWord });
  chests = new Chests({ scene, profile: () => profile, cards: () => unitCards, dueIds: () => Review.dueIds(profile.words),
    open: (c, card) => {
      if (!card) { ui.dialogue([{ who: 'Ngọc', en: 'This lock has no letters…', vi: `Từ vựng Unit ${Save.unitOf(profile)} lớp ${profile.grade} chưa có, rương tự mở.` }], () => { chests.opened(c); save(); }); return; }
      const g = spellGame(card); const started = Date.now();
      g.onResult = (res) => {
        Review.record(profile.words, card.id, { correct: res.wrong === 0, hints: res.wrong ? 1 : 0, ms: Date.now() - started }); Save.recordSkill(profile, 'spelling', res.wrong === 0, res.wrong ? 1 : 0);
        chests.opened(c); track('chest'); profile.stats.gold += res.gold; Save.addExp(profile, res.exp); sfx('fanfare'); save(); refresh();
        ui.dialogue([{ who: 'Ngọc', en: `${res.text} (+${res.gold} gold, +${res.exp} EXP)`, vi: `${card.word} = ${card.vi}` }]);
      };
      teach([card], () => arcade.start(g));
    } });
  wild = new Wild({ scene, player, ui, sfx, profile: () => profile, save, onChange: refresh, onKill: () => track('kill'),
    quiz: (bossName, done) => {       // word shield: pick the English word for the Vietnamese meaning (unit vocabulary, due words first)
      const pool = unitCards.filter((c) => c.word.length <= 18); if (pool.length < 4) { done(true); return; }
      const due = Review.dueIds(profile.words).map((id) => pool.find((c) => c.id === id)).filter(Boolean), card = (due.length ? due : pool)[Math.floor(Math.random() * (due.length || pool.length))];
      const opts = [card, ...pool.filter((c) => c.id !== card.id && c.vi !== card.vi).sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5), started = Date.now();
      teach([card], () => ui.choose({ who: bossName, en: 'Say the magic word to break my shield!', vi: `"${card.vi}" trong tiếng Anh là gì?` }, opts.map((o) => o.word), (i) => {
        const ok = opts[i].id === card.id; Review.record(profile.words, card.id, { correct: ok, hints: 0, ms: Date.now() - started }); Save.recordSkill(profile, 'vocabulary', ok, 0); save();
        if (!ok) ui.dialogue([{ who: bossName, en: 'Ha ha! Wrong word!', vi: `${card.word} = ${card.vi}. Đánh tiếp rồi thử lại nhé.` }]);
        done(ok);
      }));
    },
    respawn: () => { game.teleport(L.SPAWN.x, L.SPAWN.z); ui.dialogue([{ who: 'Tom', en: 'You fainted, so I carried you home. Rest, then try again!', vi: 'Con hết máu nên được đưa về làng. Máu đã đầy lại. Mua trang bị tốt hơn rồi quay lại nhé.' }]); } });
  mini = new MiniGames({ scene, player, ui, sfx, track, profile: () => profile, save, onNote: refresh, board: (id) => arcade.start(({ candy: () => candyGame(), blocks: () => blocksGame(Math.random, unitCards), sling: () => slingGame(), race2: () => raceGame(Math.random, unitCards) })[id]()) });
  await mini.addHosts((name) => loader.loadAsync(`./assets/models/${name}.glb`));      // a host by each mini game
  admin = new AdminPanel({ profile: () => profile, places: adminPlaces, go: adminGo, unlockAll: adminUnlock, setStep: adminStep,
    resetForest: () => { delete profile.quests.forest; if (L.NAME === 'forest') enterRegion('forest'); }, setGrade: (g) => { profile.grade = g; save(); chooseProfile(profile); },
    setLevel: adminLevel, addGold: (n) => { profile.stats.gold += n; }, changed: () => { save(); refresh(); setSword(); setWear(); }, toast: (t) => ui.toast(t) });
  minimap = new Minimap($('minimap'), (path) => { player.route = path.slice(1); });
  placeActors(); player.place(L.SPAWN.x, L.SPAWN.z);
  if (SOFTWARE_GL && !navigator.webdriver && !localStorage.getItem('eq-quality-manual')) quality = 'low';      // no graphics card: start light, the parent can raise it in the gear panel
  setQuality(quality);
  $('loading').classList.add('hidden');
  ui.showMenu(store, chooseProfile);
  if (SOFTWARE_GL && !navigator.webdriver) setTimeout(() => ui.toast(globalThis.eqDesktop ? 'Máy không có card đồ họa: game đã chọn đồ họa Thấp cho mượt.' : 'Trình duyệt đang vẽ bằng CPU, game sẽ giật. Bật "Tăng tốc phần cứng" trong Cài đặt trình duyệt.'), 1500);
  renderer.setAnimationLoop(frame);
}

let worst = 0, worstNow = 0, mapT = 1, last = performance.now(), acc = 0, frames = 0, autosave = 0, slow = 0;
const AUTO = !navigator.webdriver && !localStorage.getItem('eq-quality-manual');     // step the graphics down by itself until the child picks a level
function frame() {
  const now = performance.now(), raw = (now - last) / 1000, real = Math.min(0.25, raw); last = now;
  const dt = Math.min(0.05, real); TIME.value += real; const t = TIME.value;
  const frozen = ui.modal || !started || (arcade && arcade.open) || (shopWin && shopWin.open) || (music && music.open) || (journal && journal.open);
  if (arcade) arcade.update(real, keys);
  if (touch) touch.update();
  releaseSoftKeys();
  const input = { x: (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0), z: (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0), run: keys.has('ShiftLeft') || keys.has('ShiftRight'), jump: keys.has('Space') };
  if (frozen) { input.x = input.z = 0; input.jump = false; }
  const hadRoute = !!player.route;
  // slow machines: several fixed physics steps per frame so the game never runs in slow motion
  if (intro && intro.active) introStep(real);
  else for (let left = real; left > 1e-4; left -= 0.05) player.update(Math.min(0.05, left), input, cam.yaw, frozen, sfx);
  if (hadRoute && !player.route) minimap.clearRoute();
  if (walkMark && walkMark.visible) { walkMark.userData.t += real; walkMark.scale.setScalar(1 + Math.sin(walkMark.userData.t * 6) * 0.15); if (!player.route) walkMark.visible = false; }
  cam.update(real, player.pos);
  const talkingTo = ui.busy && ui.pages ? ui.pages[0].who : '';
  tom.update(dt, player.pos, talkingTo === 'Tom'); sam.update(dt, player.pos, talkingTo === 'Sam'); ben.update(dt, player.pos, talkingTo === 'Ben');
  for (const f of friends) f.npc.update(dt, player.pos, talkingTo === f.who);
  if (walkers && started) walkers.update(real, player.pos, ui.busy ? talkW : -1);
  if (pip.root.visible) pip.update(dt, t, player, started && L.NAME === 'forest' && quest && quest.step !== 'intro');
  crystals.update(t); if (world) world.update(t);
  if (mini && started && !switching && !ui.modal && !arcade.open) mini.update(real, player.pos);      // real time, so timers stay honest on slow machines
  if (chests && started) chests.update(real);
  if (spots && started) spots.update(real);
  if (wild && started && !switching) wild.update(real, !!ui.modal || arcade.open);
  if (marks3d) marks3d.update(real);
  for (const sp of markPool) if (sp.visible) {      // bob, pulse and glow so the eye finds them (feedback 17/11)
    const k = 0.5 + 0.5 * Math.sin(t * 5 + sp.position.x), h = sp.userData.halo;
    sp.position.y = sp.userData.y + Math.sin(t * 3 + sp.position.x) * 0.1; sp.scale.setScalar(0.74 + 0.14 * k);
    h.position.copy(sp.position); h.material.opacity = 0.35 + 0.65 * k; h.scale.setScalar(1.4 + 0.6 * k);
  }
  if (letterProp.visible) { letterProp.rotation.y = t * 1.5; letterProp.position.y += Math.sin(t * 2.2) * 0.002; }
  { // shadows follow Ngọc in whole shadow-map texels, so their edges do not crawl and shimmer as she walks
    const c = sun.shadow.camera, step = (c.right - c.left) / sun.shadow.mapSize.x, snap = (v) => Math.round(v / step) * step;
    shadowAt.set(snap(player.pos.x), player.pos.y, snap(player.pos.z)); sun.position.copy(shadowAt).addScaledVector(sunDir, 90); sun.target.position.copy(shadowAt); }
  sky.position.copy(camera.position);
  if (started && !switching) {
    const it = ui.modal ? null : interactTarget(); ui.prompt(it ? it.text : '');
    mapT += real; const markers = [];
    if (mapT >= 0.08) { mapT = 0;            // minimap and markers 12 times a second, not every frame
    if (L.NAME === 'forest') {
      if (quest.step === 'intro') markers.push({ x: tom.x, z: tom.z, text: '!' });
      if (quest.step === 'tree') { const s = landmark('tree').spot; markers.push({ x: s[0], z: s[1], text: '★' }); }
      if (quest.step === 'seek' && quest.q.hint >= 3) { const s = landmark(quest.targetId).spot; markers.push({ x: s[0], z: s[1], text: '★' }); }
      markers.push(...wild.markers(), ...chests.markers(), ...spots.markers());
    } else {
      const st = story.step;
      if (st === 'arrive' || st === 'letter_return' || st === 'open') markers.push({ x: tom.x, z: tom.z, text: st === 'arrive' ? '!' : '?' });
      if (st === 'letter_find') markers.push({ x: letterProp.position.x, z: letterProp.position.z, text: '✉' });
      if (st === 'jars') markers.push({ x: ben.x, z: ben.z, text: '!' });
      if (st === 'tom_bridge') markers.push({ x: tom.x, z: tom.z, text: '!' });
      if (st === 'bridge' || st === 'plan') markers.push({ x: sam.x, z: sam.z, text: '!' });
      if (st === 'gather') { const have = story.items;
        if (!have.includes('axe')) markers.push({ x: ben.x, z: ben.z, text: '!' });
        if (['rope', 'log', 'axe'].every((k) => have.includes(k))) markers.push({ x: sam.x, z: sam.z, text: '?' }); }
      if (st === 'done' && quest.step !== 'done') markers.push({ x: L.EXITS[0].x, z: L.EXITS[0].z, text: '★' });
      if (story.market && Math.hypot(player.pos.x + 7, player.pos.z - 19.5) > 15) story.leaveMarket();
      if (!story.market) markers.push(...mini.markers());
      markers.push(...wild.markers(), ...chests.markers(), ...spots.markers());
      if (Save.gateWaiting(profile)) markers.push({ x: OWL.x, z: OWL.z, text: '🦉', color: '#ffe28a' });
    }
    minimap.draw(player.pos, player.yaw, markers); questMarks(markers); }
    autosave += dt; if (autosave > 20) { autosave = 0; save(); }
  }
  renderer.info.reset();
  if (room) { room.update(real, camera.aspect); post.setSun(room.camera, sunDir); post.render(room.scene, room.camera); }
  else { post.setSun(camera, sunDir); post.render(scene, camera); }
  acc += raw; frames++; worstNow = Math.max(worstNow, raw * 1000);
  if (acc >= 0.5) { game.stats = { gpu: GPU, software: SOFTWARE_GL, worst: Math.round(worstNow), fps: +(frames / acc).toFixed(1), ms: +(acc / frames * 1000).toFixed(1), calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
    if (perfOn) $('perf').textContent = `FPS ${game.stats.fps}  (${game.stats.ms} ms, chậm nhất ${worst.toFixed(0)} ms)\nGPU: ${GPU.slice(0, 60)}${SOFTWARE_GL ? '  ⚠ ĐANG VẼ BẰNG CPU' : ''}\nđộ phân giải ${Math.round(renderScale * 100)}%\ndraw calls ${game.stats.calls}\ntriangles ${game.stats.tris.toLocaleString()}\nquality ${quality} · ${renderer.domElement.width}x${renderer.domElement.height}`;
    adaptResolution(game.stats, acc);
    if (AUTO && started && !switching && !document.hidden && quality !== 'low' && !localStorage.getItem('eq-quality-manual')) {
      slow = game.stats.fps < 26 && renderScale <= 0.61 ? slow + 1 : 0;      // only after the resolution can go no lower
      if (slow >= 6) { slow = 0; setQuality(quality === 'high' ? 'medium' : 'low'); ui.toast('Đã hạ đồ họa cho mượt hơn'); }
    }
    acc = 0; frames = 0; worst = worstNow; worstNow = 0; }
}
boot().catch((e) => { errors.push(String(e && e.stack || e)); $('loadtext').textContent = 'Lỗi khi tải game: ' + e.message; console.error(e); });

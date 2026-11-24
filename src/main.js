// English Quest (web) — boot, render loop, quality presets, perf panel and the debug API for tests.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
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
import { Homes } from './game/homes.js';
import { buildOuter } from './world/outer_ring.js';
import { HomePanel } from './ui/home.js';
import { HOMES, FURNITURE, STALLS, BEN_MARKET } from './core/regions/village.js';
import { HARBOR } from './core/regions/harbor.js';
import { styleGame, COLORS as WCOL } from './ui/style.js';
import { cafeGame } from './ui/cafe.js';
import { salonGame } from './ui/salon.js';
import { fishGame } from './ui/fish.js';
import { WardrobePanel } from './ui/wardrobe.js';
import { PetPanel } from './ui/petpanel.js';
import { Pet } from './game/pet.js';
import * as PETS from './core/pet.js';
import { outfitParts } from './game/outfit.js';
import { tintBody, tintAccessory, setHairStyle, setClothes, setGoggles, CLOTH, setPattern, setBoots } from './game/tint.js';
import { faceMaps, tintSkin, lookOf } from './game/faces.js';
import * as Saga from './core/saga.js';
import { Creator } from './ui/creator.js';
import * as SK from './core/skills.js';
import { Spells } from './game/spells.js';
import { Floaters } from './game/floaters.js';
import { SkillUI } from './ui/skills.js';
import { Tailor } from './ui/tailor.js';
import * as WR from './core/wardrobe.js';
import { DexPanel } from './ui/dex.js';
import { Toolbar } from './ui/toolbar.js';
import * as WORLD from './core/world.js';
import { WorldUI } from './ui/worldmap.js';
import { makePortal } from './world/portal.js';
import * as Sea from './core/sea.js';
import * as Family from './core/family.js';
import { TreasurePanel } from './ui/treasure.js';
import * as TR from './core/treasure.js';
import { MARKS as ISLE_MARKS } from './core/regions/isle.js';
import { buildRoom } from './world/interior.js';
import { label } from './world/common.js';
import { GuideTrail } from './game/trail.js';
import * as Snap from './core/nav.js';
import * as Q from './core/quests.js';
import * as Exam from './core/exam.js';
import { Wild, BOARD, BOSS_AT, BOSS2_AT, FOREST_BOARD, BOSS3_AT, HARBOR_BOARD, BOSS4_AT } from './game/combat.js';
import { Arcade, candyGame, blocksGame, slingGame, spellGame, raceGame, withTier } from './ui/arcade.js';
import { raceGame3d, loadRaceAssets } from './ui/race3d.js';
import { DayNight } from './game/daynight.js';
import { tierOf, TIER_PAY } from './core/tiers.js';
import { Chests, CHEST_SPOTS, FOREST_CHESTS, HARBOR_CHESTS } from './game/chests.js';
import { armorMesh, charmMesh, GEAR_FILE } from './game/gear.js';
import { Walkers } from './game/walkers.js';
import { ShopWindow } from './ui/shop.js';
import { ITEMS, bag, wear, buy, eat, shopList, pay, map2Ready, map3Ready, playerAtk, useQuick } from './core/rules.js';
import { PackUI } from './ui/pack.js';
import { Fishing } from './game/fishing.js';
import { house as houseOf, setPlace } from './core/house.js';
import * as Farm from './core/farm.js';
import { payNote } from './game/minigames.js';
import { SAM_LINES, BRIDGE, BRIDGE_SPOTS, FRIENDS, OPENING } from './game/content.js';
import { UI } from './ui/ui.js';
import { Post } from './render/post.js';
import { addOutline, showOutlines, syncOutlines } from './render/outline.js';
import { Minimap } from './ui/minimap.js';
import { initTouch, touchWanted } from './ui/touch.js';
import { sfx, setSound, soundOn, unlock, setMusic, musicOn, playMusic } from './audio.js';
import { voiceOn, setVoice, speak, paceOf, nextPace } from './ui/speech.js';
import { ReadAloud, disable as voiceDisable } from './ui/voice.js';
import { relaxArms } from './game/relax.js';
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
const where = (x) => (x && x.stack ? ' @ ' + String(x.stack).split('\n').slice(1, 4).map((l) => l.trim().replace(/^at /, '').replace(/https?:\/\/[^/]+\//, '')).join(' < ') : '');      // (21/11) the first frames, so a test report says where
addEventListener('error', (e) => errors.push(String(e.message) + where(e.error)));
addEventListener('unhandledrejection', (e) => errors.push(String(e.reason) + where(e.reason)));

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
const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xbfe4ff, 90, 400);
const camera = new THREE.PerspectiveCamera(52, 1, 0.3, 700);

// sky dome: clean blue gradient, soft sun glow, drifting clouds
const sunDir = new THREE.Vector3(-0.45, 0.72, 0.52).normalize();
const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uTime: TIME, uSun: { value: sunDir.clone() }, uMoon: { value: new THREE.Vector3(0.2, 0.7, 0.3).normalize() }, uNight: { value: 0 }, uWarm: { value: 0 } },
  vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform float uTime; uniform vec3 uSun; uniform vec3 uMoon; uniform float uNight; uniform float uWarm; varying vec3 vD;
    float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
    float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * n(p); p *= 2.03; a *= 0.5; } return s; }
    void main(){
      vec3 d = normalize(vD); float y = max(d.y, 0.0);
      vec3 dayCol = mix(vec3(0.74, 0.90, 1.0), vec3(0.16, 0.50, 0.95), pow(y, 0.55));
      vec3 duskCol = mix(vec3(1.0, 0.72, 0.50), vec3(0.35, 0.36, 0.70), pow(y, 0.5));
      vec3 nightCol = mix(vec3(0.07, 0.10, 0.22), vec3(0.01, 0.02, 0.07), pow(y, 0.5));
      vec3 col = mix(dayCol, duskCol, uWarm * 0.8); col = mix(col, nightCol, uNight);
      col += (vec3(1.0, 0.93, 0.75) * pow(max(dot(d, uSun), 0.0), 220.0) * 1.2 + vec3(1.0, 0.95, 0.8) * pow(max(dot(d, uSun), 0.0), 9.0) * 0.14) * (1.0 - uNight);
      vec2 sp = d.xz / (d.y + 0.35) * 55.0; float sh = h(floor(sp)); float stars = step(0.992, sh) * smoothstep(0.08, 0.35, d.y) * (0.55 + 0.45 * sin(uTime * 2.5 + sh * 400.0));
      col += vec3(0.85, 0.9, 1.0) * stars * uNight;
      float md = dot(d, uMoon); col += (vec3(0.93, 0.95, 1.0) * smoothstep(0.9990, 0.9994, md) + vec3(0.45, 0.55, 0.9) * pow(max(md, 0.0), 60.0) * 0.35) * uNight;
      vec2 uv = d.xz / (d.y + 0.22) * 1.15 + vec2(uTime * 0.006, 0.0);
      float c = smoothstep(0.52, 0.78, fbm(uv * 1.6)) * smoothstep(0.02, 0.22, d.y);
      col = mix(col, mix(vec3(1.0), vec3(0.22, 0.26, 0.4), uNight), c * 0.92);
      gl_FragColor = vec4(col, 1.0);
    }` }));
sky.frustumCulled = false; scene.add(sky);
// Soft, warm light as in the reference paintings: a strong sky/ground fill so nothing goes black, a gentler sun so
// skin and cream cloth do not burn out, and a cool back light that draws a rim round characters and roofs.
const hemi = new THREE.HemisphereLight(0xdcefff, 0xc8b88a, 1.05); scene.add(hemi);
{ // the sky also lights the scene as an environment map: soft coloured fill and reflections on metal and glass
  const pm = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene(), dome = sky.clone(); dome.scale.setScalar(0.1); envScene.add(dome);
  scene.environment = pm.fromScene(envScene, 0, 0.1, 100).texture; scene.environmentIntensity = 0.22; pm.dispose(); }
const rim = new THREE.DirectionalLight(0xcfe2ff, 0.75); rim.position.set(0.5, 0.55, -0.7); scene.add(rim);
const sun = new THREE.DirectionalLight(0xffe6bc, 1.9); sun.castShadow = true; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; scene.add(sun, sun.target);
const dayNight = new DayNight({ scene, sky, sun, rim, hemi, sunDir });

const manager = new THREE.LoadingManager();
manager.onProgress = (_u, done, total) => { $('loadbar').style.width = Math.round((done / total) * 100) + '%'; };
const loader = new GLTFLoader(manager), texLoader = new THREE.TextureLoader(manager), modelCache = new Map();
{ const rawLoad = loader.loadAsync.bind(loader); loader.loadAsync = async (...a) => { const g = await rawLoad(...a); try { relaxArms(g); } catch (e) { /* the model keeps its pose */ } return g; }; }      // (24/11) relaxed arms for every person model (src/game/relax.js)
// Characters from tools/chibi05 (v04+): pieces marked eq_hidden (spare hair styles, clothes) start hidden, and *_tint
// materials sample a grey palette whose 0.8 base tone stands for the colour in material extras eq_base (0.6038 = 0.8 sRGB in linear).
const MAX_ANISO = Math.min(16, renderer.capabilities.getMaxAnisotropy());
function prepModel(g) {
  g.scene.traverse((o) => {
    if (o.userData && o.userData.eq_hidden) o.visible = false;
    for (const m of o.isMesh ? [].concat(o.material) : []) if (m.map && m.map.anisotropy < MAX_ANISO) m.map.anisotropy = MAX_ANISO;      // (24/11) "Ngọc looks soft": sharp textures at a slant and at a distance
    for (const m of o.isMesh ? [].concat(o.material) : []) if (m.userData.eq_base && !m.userData.eqTinted) { m.color.set(m.userData.eq_base).multiplyScalar(1 / 0.6038); m.userData.eqTinted = true; }
  });
  return g;
}
const gltf = (name) => { if (!modelCache.has(name)) modelCache.set(name, loader.loadAsync(`./assets/models/${name}.glb`).then(prepModel)); return modelCache.get(name); };
/** Map 2 monsters (crab, jellyfish, pirate, Captain Octopus): fetched when the hero first sails to the harbor. */
const SEA_FILES = { crab: 'harbor_mob_crab_v01', jelly: 'harbor_mob_jellyfish_v01', pirate: 'harbor_mob_pirate_v01', octopus: 'harbor_boss_octopus_v02', gull: 'mob_gull_storm_v01' };
const seaModel = (k) => gltf(SEA_FILES[k]).catch(() => null);
/** Map 1 monsters and bosses (batch 13): swapped in by the Wild after the game has started. */
// (24/11) the user's new monsters replace the old models kind by kind: wolf, magma crystal, boar, water slime, stone golem, dark bat, venom mushroom, carnivorous flower
const MAP1_FILES = { goblin: 'mob_shadow_wolf', imp: 'mob_magma_crystal', orc: 'mob_rage_boar', slime: 'mob_water_slime', red: 'mob_slime_red_v01', golem: 'mob_stone_golem', bat: 'mob_dark_bat', shroom: 'mob_venom_mushroom', king: 'boss_slime_king_v02', ancient: 'boss_golem_ancient_v02', queen: 'boss_mushroom_queen_v02', bunny: 'mob_carnivorous_flower', wisp: 'mob_wisp_thunder_v01', fox: 'mob_fox_ember_v01' };
const map1Model = (k) => gltf(MAP1_FILES[k]).catch(() => null);
const staticModel = async (name) => (await gltf(name)).scene.clone(true);
const animatedModel = async (name) => { const g = await gltf(name); return { scene: SkeletonUtils.clone(g.scene), animations: g.animations }; };
const faceTex = async (name) => { const t = await texLoader.loadAsync(`./assets/tex/ngoc_face_${name}.png`); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; return t; };

const ui = new UI(), store = Save.load();
let profile = null, quest = null, story = null, world = null, player = null, cam = null, tom = null, sam = null, ben = null, pip = null, crystals = null, minimap = null, letterProp = null, itemProps = {}, friends = [], mini = null, wild = null, arcade = null, chests = null, spots = null, unitCards = [], cardOfFn = () => null;
let shopWin = null, walkers = null, talkW = -1, touch = null, quality = localStorage.getItem('eq-quality') || 'medium', perfOn = false, started = false, switching = false, wordIds = {}, jarKey = '';
const keys = new Set();
let raceAssets = null;
const game = { errors, voiceDisable, get reader() { return reader; }, SK, games: { raceGame, raceGame3d, slingGame, candyGame }, goHome: (o, mine) => goHome(o || profile, mine !== false), get room() { return room; }, get homes() { return homes; }, Farm, get trail() { return guide && guide.trail; }, get tom() { return tom; }, get fishing() { return fishing; }, get profile() { return profile; }, get quest() { return quest; }, get story() { return story; }, get player() { return player; }, get cam() { return cam; }, get minimap() { return minimap; }, ui, L, stats: { fps: 0, ms: 0, calls: 0, tris: 0 },
  teleport(x, z) { player.place(x, z); cam.target.set(x, player.pos.y + 1.25, z); }, applyLook, syncPet, get dayNight() { return dayNight; }, get digs() { return digMeshes; }, catchFish, gainItems, cardsOfUnit: (n) => cardsOfUnit(n), get pet() { return petObj; }, get petPanel() { return petPanel; },  setQuality, key: (code) => onKey({ code, preventDefault() {} }), get started() { return started && !switching; }, get worldUI() { return worldUI; }, openPortal, travelTo, get portals() { return portalGroup; }, get region() { return L.NAME; }, chooseProfile, enterRegion, MARKET_JARS, BRIDGE_SPOTS, get mini() { return mini; }, get wild() { return wild; }, get scene() { return scene; }, openShop, get sword() { return swordMesh; }, get armor() { return armorShown; }, setWear, openBag: () => openBag(), get arcade() { return arcade; }, get chests() { return chests; }, get spots() { return spots; }, get admin() { return admin; }, get friends() { return friends; }, get walkers() { return walkers; }, get shopWin() { return shopWin; }, get music() { return music; }, get journal() { return journal; }, get spells() { return spells; }, get floaters() { return floaters; }, get skillUI() { return skillUI; }, get intro() { return intro; }, cardOf: (id) => cardOfFn(id), pause: (on) => renderer.setAnimationLoop(on ? null : frame), renderNow: () => { post.setSun(camera, sunDir); post.render(scene, camera); },      // tests: stop drawing while another page is checked
  post, refresh: () => refresh(), refreshGear: () => { setSword(); setWear(); } };
globalThis.__eq = game;

// Dynamic resolution (18/11: "high graphics without stutter"): all the effects stay on, only the number of pixels
// drawn follows the machine. A slow half-second lowers the render scale a step (at most every 2 s, down to 60%);
// steady fast frames raise it again (every 5 s). Changing it reallocates the effect buffers, so steps are rare.
let baseRatio = 1, renderScale = 1, drsT = 0;
function adaptResolution(stats, dt) {
  drsT += dt; if (quality === 'low' || !started || switching || document.hidden) return;
  const want = stats.ms > 22 ? -0.05 : stats.ms < 12.5 && stats.worst < 25 ? 0.05 : 0;
  if (!want || (want < 0 && drsT < 2) || (want > 0 && drsT < 5)) return;
  const next = Math.min(1, Math.max(0.8, renderScale + want));      // (24/11) never below 80%: lower looked blurry on the new, finely painted characters if (Math.abs(next - renderScale) < 0.01) return;
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
  scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { if (m && typeof m === "object") m.needsUpdate = true; }); });
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
  const un = profile && gradeUnits[Save.unitOf(profile) - 1];      // (21/11) each map teaches one Global Success unit
  g.innerHTML = `<b style="flex-basis:100%">Cài đặt <button id="gclose" style="float:right">✕</button></b>${un ? `<span style="flex-basis:100%;font-size:13px">📘 Đang học: Global Success ${profile.grade} · Unit ${Save.unitOf(profile)} — ${un.title} (Map ${Save.unitOf(profile)} ↔ Unit ${Save.unitOf(profile)})</span>` : ''}
    Đồ họa: <select id="gq">${Object.entries(QUALITY).map(([k, v]) => `<option value="${k}" ${k === quality ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
    <button id="gs">Âm thanh: ${soundOn() ? 'bật' : 'tắt'}</button><button id="gv" title="Đọc to lời thoại tiếng Anh">Đọc to: ${voiceOn() ? 'bật' : 'tắt'}</button><button id="gp" title="Tốc độ giọng đọc tiếng Anh">Giọng đọc: ${paceOf().vi}</button><button id="gm" title="Nhạc nền nhẹ">Nhạc nền: ${musicOn() ? 'bật' : 'tắt'}</button><button id="gb" title="Xem lại các từ đã gặp (phím B)">📖 Sổ từ</button>
    <button id="ge">Xuất hồ sơ</button><button id="gsw">Đổi người chơi</button><span style="color:#9a8060">F3: hiệu năng</span>`;
  const done = (e) => { if (e && e.target) e.target.blur(); };          // a focused list would eat W/S and the arrows
  $('gclose').onclick = () => { gearOpen = false; renderGear(); };
  $('gq').onchange = (e) => { done(e); localStorage.setItem('eq-quality-manual', '1'); setQuality(e.target.value); };
  $('gs').onclick = () => { setSound(!soundOn()); renderGear(); };
  $('gp').onclick = () => { const k = nextPace(); renderGear(); speak('Hello! This is how fast I read.', true); ui.toast('Tốc độ đọc: ' + k.vi); };
  $('gm').onclick = () => { setMusic(!musicOn()); renderGear(); };
  $('gv').onclick = () => { setVoice(!voiceOn()); renderGear(); };
  $('gb').onclick = () => { gearOpen = false; renderGear(); wordBook(); };
  $('ge').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([Save.exportProfile(profile)], { type: 'application/json' })); a.download = `english-quest-${profile.name}.json`; a.click(); };
  $('gsw').onclick = () => { gearOpen = false; save(); ui.showMenu(store, chooseProfile); renderGear(); };      // (24/11) was a second id="gp": the button did nothing and the pace button switched player
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
  if (shownLevel && profile.stats.level > shownLevel) { profile.stats.hp = Save.maxHp(profile); ui.toast(`LEVEL UP!  Lv ${profile.stats.level} · +1 điểm kỹ năng (phím T)`); sfx('fanfare'); }
  shownLevel = profile.stats.level;
  if (map2Ready(profile) && !profile.flags.map2) {      // T3: Ancient Golem beaten at level 20 -> Map 2 and Unit 2 words
    profile.flags.map2 = true; save(); sfx('fanfare');
    ui.dialogue([{ who: 'Tom', en: 'You have grown so strong! A boat is waiting at the dock to take you to Sunny Harbor.', vi: `Đã mở Map 2 · Cảng Mặt Trời: ra bến thuyền bên sông (chỗ chú Sam câu cá) để đi. Từ giờ rương, boss, Cú Mèo hỏi từ Unit ${Save.unitOf(profile)}.` }, { who: '🥈 Word Keeper badge', en: 'Rank up: Explorer Word Keeper!', vi: 'Lên hạng Thám hiểm: mạnh hơn (+4 công, +30 máu).' }], () => reloadUnit());
  }
  if (map3Ready(profile) && !profile.flags.map3) {      // Captain Octopus beaten at level 30: the sea map is finished (Map 3, the desert, is still being built)
    profile.flags.map3 = true; save(); sfx('fanfare');
    ui.dialogue([{ who: 'Tom', en: 'You beat Captain Octopus! The sea is calm again. A warm wind from the desert is calling you now.', vi: 'Con đã hoàn thành Map 2 · Cảng Mặt Trời! Map 3 · Sa mạc Gió Vàng đang được xây, sắp mở. Làm bài kiểm tra cấp 30 của Cú Mèo để lên cấp tiếp.' }]);
  }
  const learned = Review.learned(profile.words); if (journal) journal.sync(); if (toolbar) toolbar.sync(profile);
  if (L.NAME === 'isle') {
    ui.hud(profile, 'Đảo Kho Báu', [`🗺 ${Math.min(TR.state(profile).n, TR.MAX_DAILY)}/${TR.MAX_DAILY}`, Save.gateWaiting(profile) ? '🦉 ôn tập' : ''].filter(Boolean).join('  '), learned, bag(profile).food);
    ui.clue(null, 0, '', treasureMap() ? 'Read the treasure map (M), walk the steps and dig with E!' : 'You found today’s treasures. Come back tomorrow!');
    crystals.show([]);
  } else if (L.NAME === 'harbor') {
    ui.hud(profile, 'Cảng Mặt Trời', [wild ? wild.huntNote() : '', Save.gateWaiting(profile) ? '🦉 ôn tập' : ''].filter(Boolean).join('  '), learned, bag(profile).food);
    const mq = Q.mainCurrent(profile);
    ui.clue(null, 0, '', mq && ['harbor', 'shops', 'hunt3', 'owl25', 'boss4', 'exam2'].includes(mq.id) ? `Quest: ${mq.en}. Press N for the quest book.` : 'Welcome to Sunny Harbor! Take jobs from the board by the square.');
    crystals.show([]);
  } else if (L.NAME === 'forest') {
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
    else ui.clue(null, 0, '', quest.step === 'done' && story.step === 'done' ? 'Chapter complete! The Ancient Golem has the Compass piece.' : NOTES[story.step] || '');
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
// ---------------------------------------------------------------- guide arrow (18/11: "an arrow to where the quest is")
// A gold arrow floats in front of the hero and points at the current goal: the owl when a gate waits, else the story's
// next "!" / "?" / letter / star, else the monsters the hunt board asked for. A small sign under it gives the distance.
let guideGoal = null, guide = null;
function pickGoal(markers) {
  if (Save.gateWaiting(profile)) return L.NAME === 'village' ? { x: OWL.x, z: OWL.z, text: 'Cú Mèo' } : { x: L.EXITS[0].x, z: L.EXITS[0].z, text: 'Về làng gặp Cú Mèo' };      // the owl lives in the village
  const story = markers.find((m) => !m.host && !m.color && ['!', '?', '✉', '★'].includes(m.text));
  if (story) return { x: story.x, z: story.z, text: story.text === '✉' ? 'Bức thư' : 'Nhiệm vụ' };
  return wild ? wild.guide(player.pos) : null;
}
function guideArrow(dt) {
  if (!guide) {
    const sh = new THREE.Shape(); sh.moveTo(0, 0.55); sh.lineTo(0.38, 0.05); sh.lineTo(0.14, 0.05); sh.lineTo(0.14, -0.45); sh.lineTo(-0.14, -0.45); sh.lineTo(-0.14, 0.05); sh.lineTo(-0.38, 0.05); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 1 }); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, 0);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xffd23c, emissive: 0xffa800, emissiveIntensity: 0.9, roughness: 0.4, transparent: true, opacity: 0.92, depthTest: false }));
    m.scale.setScalar(0.85); m.renderOrder = 9; guide = { m, sign: null, txt: '', t: 0 }; scene.add(m);
  }
  const g = guideGoal, show = !!g && started && !room && !switching && !(creator && creator.open) && !(tailor && tailor.open);
  guide.trail = guide.trail || new GuideTrail(scene); guide.trail.update(dt, player.pos, g, show && !(mini && mini.active) && !(fishing && fishing.active));      // (21/11) dotted trail along the nearest way
  const d = show ? Math.hypot(g.x - player.pos.x, g.z - player.pos.z) : 0;
  guide.m.visible = show && d > 4; if (guide.sign) guide.sign.visible = guide.m.visible;
  if (!guide.m.visible) return;
  guide.t += dt; const a = Math.atan2(g.x - player.pos.x, g.z - player.pos.z), r = 1.2;
  guide.m.position.set(player.pos.x + Math.sin(a) * r, player.pos.y + 0.18 + Math.sin(guide.t * 4) * 0.05, player.pos.z + Math.cos(a) * r);
  guide.m.rotation.y = a + Math.PI;      // the shape points along -z after the rotation; turn it to face the goal
  const txt = `${g.text} · ${Math.round(d)} m`;
  if (txt !== guide.txt) { guide.txt = txt; if (guide.sign) { scene.remove(guide.sign); guide.sign.material.map.dispose(); guide.sign.material.dispose(); } guide.sign = label(txt, { size: 24, scale: 0.5 }); guide.sign.renderOrder = 9; guide.sign.material.depthTest = false; scene.add(guide.sign); }
  guide.sign.position.set(guide.m.position.x, guide.m.position.y + 0.45, guide.m.position.z);
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
/** (21/11) Sam's spot on the bank: the old one (river x − 5.6) stood in the shallow water once the river grew. Kept over 4 m from the fishing spot (E). */
const SAM_HOME = [L.REGIONS.village.riverX(18) - 7.2, 14.5];
/** Sam waits at the broken bridge during "Fix the Bridge"; Pip joins him to read the plan. */
function placeVillageHelpers() {
  const st = story.step, atBridge = st === 'bridge' || st === 'gather' || st === 'plan';
  const [sx, sz] = atBridge ? BRIDGE_SPOTS.sam : SAM_HOME;
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
    tom.move(2.6, 7.6, -0.4); ben.move(BEN_MARKET.npc[0], BEN_MARKET.npc[1], Math.PI / 2);      // (24/11) Ben stands at his own word-jar stall sam.move(...SAM_HOME, 1.2);
    const ex = L.EXITS[0]; if (profile && profile.flags.forest_open) { pip.root.visible = true; pip.place(ex.x + 2.2, ex.z + 3); } else pip.root.visible = false;
    if (story) placeVillageHelpers();
    for (const f of friends) { if ((f.region || 'village') === 'village') f.npc.move(...f.at); else f.npc.hide(); }
  } else if (L.NAME === 'isle') {
    tom.hide(); ben.hide(); sam.hide(); pip.root.visible = false; for (const f of friends) f.npc.hide();
  } else if (L.NAME === 'harbor') {
    tom.hide(); ben.hide(); pip.root.visible = false; for (const f of friends) f.npc.hide();
    sam.move(30, 29.4, Math.PI);      // fishing at the end of the small pier
  } else {
    tom.move(L.ENTRANCE.x + 2.4, L.ENTRANCE.z - 12, 0.2); sam.move(30.2, 49.6, 2.2); ben.hide();
    for (const f of friends) { if (f.region === 'forest') f.npc.move(...f.at); else f.npc.hide(); }
    pip.root.visible = true; pip.place(L.ENTRANCE.x + 3.4, L.ENTRANCE.z - 12.5);
  }
}
/** Swimming events from the Player (20/11): tells the child what to do, shows the breath bar. */
let swimBar = null, swimTold = 0;
function onSwim(ev) {
  if (ev === 'enter') { ui.toast('💦 Con rơi xuống nước! Bấm chuột liên tục để bơi (hoặc gõ W/A/S/D) vào bờ.'); sfx('tick'); swimTold = performance.now(); }
  else if (ev === 'stroke') { if (Math.random() < 0.5) sfx('step'); }
  else if (ev === 'low') ui.toast('Sắp hết hơi! Bơi nhanh vào bờ!');
  else if (ev === 'rescue') { ui.toast('Con kiệt sức nên được kéo lên bờ. Bơi nhanh hơn lần sau nhé!'); sfx('wrong'); }
  else if (ev === 'blocked') { if (performance.now() - swimTold > 2500) { swimTold = performance.now(); ui.toast('Bờ bên kia chưa an toàn. Hãy sửa cầu cùng Sam trước nhé!'); } }
  else if (ev === 'exit') sfx('step');
}
function swimHud() {
  if (!swimBar) { swimBar = document.createElement('div'); swimBar.id = 'swimbar'; swimBar.style.cssText = 'position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:26;width:260px;padding:4px 10px 6px;border-radius:12px;background:rgba(10,40,70,.78);color:#fff;font:800 13px system-ui,sans-serif;text-align:center;pointer-events:none;display:none'; swimBar.innerHTML = '<div id="swimtxt"></div><div style="height:9px;margin-top:3px;border-radius:5px;background:rgba(255,255,255,.25);overflow:hidden"><u id="swimfill" style="display:block;height:100%;background:linear-gradient(90deg,#3fd0ff,#9fffd8)"></u></div>'; document.body.appendChild(swimBar); }
  const s = player && player.swim, deep = !!(s && player.depthAt(player.pos.x, player.pos.z) > 0.55);
  swimBar.style.display = deep ? 'block' : 'none';
  if (deep) { $('swimtxt').textContent = '🏊 Bấm chuột liên tục để bơi!'; $('swimfill').style.width = Math.max(0, Math.round(s.breath * 100)) + '%'; }
}
/** A fish on the line (20/11, in-world fishing): the harbor sends it to the bucket and the Sea Dex, the village dock pays on the spot. Returns a short note. */
function onFishCaught(item) {
  if (L.NAME === 'harbor' || L.NAME === 'isle') { catchFish([item.id]); return item.junk ? 'vào túi (V)' : 'vào túi đồ (V) · bán ở chợ cá hoặc Village Shop'; }
  // (21/11) "a caught fish goes into the bag; the hero sells it at the shop": the river fish go to the same bucket
  Sea.keep(profile, item); if (!item.junk) { Save.addExp(profile, 3 + (item.r || 0) * 4); track('sea_fish'); } track('mini'); save(); refresh(); return 'vào túi đồ (V) · bán ở Village Shop';
}
/** Keys 5-8 and the potion slots: drinks or eats what is in the quick slot. */
function usePotion(i) {
  const r = useQuick(profile, i, Save.maxHp(profile));
  if (r.why === 'none') { ui.toast('Ô trống: mở túi (V) để đặt bình máu/mana vào.'); return; }
  if (!r.ok) { ui.toast(r.why === 'full' ? (ITEMS[r.id] && ITEMS[r.id].mana ? 'Mana đã đầy.' : 'Máu đã đầy.') : 'Hết rồi! Mua thêm ở quầy Lily.'); return; }
  sfx('correct'); ui.toast(r.heal ? `+${r.heal} máu` : `+${r.mana} mana`); save(); refresh();
}
/** The closest walkable point to (x, z), searched in rings, or null. */
function nearestWalkable(x, z) {
  for (let r = 0.5; r <= 12; r += 0.5) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (L.walkable(px, pz, 0.4)) return [px, pz]; }
  return null;
}
/** Loads another region: swaps map data, rebuilds the scenery, moves everyone. at = [x, z] or the region's spawn. */
async function enterRegion(name, at) {
  switching = true; ui.prompt('');
  if (fishing) fishing.stop();
  if (story) story.leaveMarket();
  const unit0 = profile ? Save.unitOf(profile) : 0; L.setRegion(name); if (profile) profile.region = name;
  for (const m of digMeshes.splice(0)) m.removeFromParent(); digMixers.length = 0; if (spells) spells.clear();
  if (name === 'harbor' && profile) profile.flags.harbor_seen = true;      // main quest: sail to Sunny Harbor
  if (world) world.dispose();
  jarKey = '';
  world = await buildWorld(scene, staticModel, animatedModel);
  const q = QUALITY[quality]; world.setDetail(q.density, q.particles, q.far);
  scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { if (m && typeof m === "object") m.needsUpdate = true; }); });
  try { await renderer.compileAsync(scene, camera); } catch { /* older browsers: shaders compile on first sight */ }      // no hitch when new things come into view
  minimap.rebuild(); placeActors(); if (walkers) walkers.setRegion(name); if (mini) mini.setRegion(name); if (wild) { if (name === 'harbor') await wild.addHarbor(seaModel); wild.setRegion(name); } if (chests) chests.setRegion(name); if (spots) spots.setRegion(name); if (homes) homes.setRegion(name); if (forestStall) forestStall.visible = name === 'forest'; showOuter(name);
  placeHomeDoor(name); buildPortals();
  let [x, z] = at || [L.SPAWN.x, L.SPAWN.z];
  if (!L.walkable(x, z, 0.4)) { const o = nearestWalkable(x, z); if (o) [x, z] = o; }      // never arrive in the water or inside a wall
  game.teleport(x, z); player.yaw = Math.PI; cam.tYaw = cam.yaw = 0.25; if (petObj) petObj.snap(x, z);
  if (quest && quest.step === 'seek') quest.clueStart = performance.now();
  if (profile && Save.unitOf(profile) !== unit0) await reloadUnit();      // (24/11) each map teaches its own unit
  switching = false; save(); refresh();
  if (name === 'isle' && trPanel && treasureMap()) trPanel.show();      // the map greets the hero on arrival
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
  unitCards = cards; cardOfFn = cardOf; gradeUnits = units; if (chests) chests.sync();
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
// (21/11) "left click attacks, right click walks": a short left click swings the weapon (at the monster under the mouse,
// which becomes the locked target, walking up to it when it is far); with no weapon worn a left click still walks.
// A short right click walks there. Pointing at a monster and pressing 1-4 casts at it and locks it too.
const toScreen = (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(camera); if (v.z > 1) return null; const r = canvas.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; };
let hoverAt = null, hoverTick = 0;
const hoverNdc = () => { if (!hoverAt) return null; const r = canvas.getBoundingClientRect(); return new THREE.Vector2(((hoverAt.x - r.left) / r.width) * 2 - 1, -((hoverAt.y - r.top) / r.height) * 2 + 1); };
canvas.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') hoverAt = { x: e.clientX, y: e.clientY }; });
function hoverPick() { if (!wild || !hoverAt || !wild.root.visible) { if (wild) wild.hover = null; return null; } wild.hover = wild.pick(hoverAt.x, hoverAt.y, toScreen); return wild.hover; }
function clickMonster(m) {
  wild.setTarget(m);
  if (Math.hypot(m.x - player.pos.x, m.z - player.pos.z) <= wild.reach(m)) { player.route = null; wild.autoHit(); }
  else { const s = Snap.snap(m.x, m.z, 3); if (s) minimap.travelTo(s.x, s.z); }
}
canvas.addEventListener('pointerdown', (e) => { if ((e.button === 0 || e.button === 2) && e.pointerType !== 'touch') clickAt = { x: e.clientX, y: e.clientY, t: performance.now(), b: e.button }; });
canvas.addEventListener('pointerup', (e) => {
  const c = clickAt; clickAt = null;
  if (!c || e.button !== c.b || !started || switching || ui.modal || (arcade && arcade.open) || (shopWin && shopWin.open)) return;
  if (fishing && fishing.active) { if (e.button === 0 && Math.hypot(e.clientX - c.x, e.clientY - c.y) <= 6) fishing.act(); return; }      // a click pulls the rod
  if (Math.hypot(e.clientX - c.x, e.clientY - c.y) > 6) return;          // the mouse moved: that was a camera drag
  if (room && room.walk) { if (!(homePanel && homePanel.open)) { const r1 = canvas.getBoundingClientRect(); room.click(new THREE.Vector2(((e.clientX - r1.left) / r1.width) * 2 - 1, -((e.clientY - r1.top) / r1.height) * 2 + 1)); } return; }      // (21/11) walking or arranging in the house
  if (e.button === 0 && !(player && player.swim) && wild && wild.root.visible && profile && !room && !(mini && mini.active)) {
    const m = wild.pick(e.clientX, e.clientY, toScreen);
    if (m) { clickMonster(m); return; }
    if (bag(profile).weapon) {      // a swing towards where the mouse points
      const r0 = canvas.getBoundingClientRect(), nd = new THREE.Vector2(((e.clientX - r0.left) / r0.width) * 2 - 1, -((e.clientY - r0.top) / r0.height) * 2 + 1), rc = new THREE.Raycaster(); rc.setFromCamera(nd, camera);
      const o = rc.ray.origin, d = rc.ray.direction; for (let k = 0.5; k < 80; k += 0.5) { const x = o.x + d.x * k, y = o.y + d.y * k, z = o.z + d.z * k; if (y <= L.walkHeight(x, z)) { player.yaw = Math.atan2(x - player.pos.x, z - player.pos.z); break; } }
      player.route = null; wild.attack(); return;
    }
  }
  const r = canvas.getBoundingClientRect(), ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, camera);
  const o = ray.ray.origin, d = ray.ray.direction; let hit = null; const swimming = !!(player && player.swim);
  for (let k = 0.5; k < 160; k += 0.25) { const x = o.x + d.x * k, y = o.y + d.y * k, z = o.z + d.z * k; if (y <= L.walkHeight(x, z) || (swimming && y <= L.waterSurface(x, z))) { hit = [x, z]; break; } }
  if (swimming) { const dx = hit ? hit[0] - player.pos.x : d.x, dz = hit ? hit[1] - player.pos.z : d.z; player.stroke(dx, dz); return; }      // (20/11) a click in the water is a stroke towards it
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
  const fp = Family.addPoints(store, profile, ev, Review.today());      // the family ship and the weekly board (19/11)
  if (fp.up) { const nm = Family.SHIP_NAMES[fp.up]; ui.toast(`⚓ Tàu gia đình lên cấp ${fp.up + 1}: ${nm.en} (${nm.vi})! Mở sổ nhiệm vụ để nhận thưởng.`); sfx('fanfare'); }
  if (done.length || fp.n) save(); if (journal) journal.sync();
}
function claimReward(r, what) {
  if (!r) return; profile.stats.gold += r.gold; if (r.exp) Save.addExp(profile, r.exp); sfx('fanfare'); save(); refresh();
  ui.toast(`🎁 ${what}: +${r.gold} vàng${r.exp ? `, +${r.exp} EXP` : ''}${r.bonusAll ? ' (thưởng xong cả 3!)' : ''}`);
}
// Anna's music house (moved west on 18/11, door on the east side); Willow's stall at the forest camp (Map 2 gear)
const ANNA_DOOR = { x: -17.4, z: 12.5 }, FOREST_SHOP = { x: -36.5, z: 39.5 };
let forestStall = null, room = null, homes = null, homePanel = null, outerRing = null;
function showOuter(name) { if (outerRing) for (const [k, g] of Object.entries(outerRing)) g.visible = k === name; }
const HALL_DOOR = { x: 0, z: -16.4 }, LILY_DOOR = { x: -17.4, z: -4 };
/** Inside a house: the room is drawn instead of the world, the window docks on the right (body.inroom). */
/** Where the boat lands in the village (the dock), and leaves for the harbour. */
const VILLAGE_DOCK = [L.REGIONS.village.riverX(18) - 6.8, 18.6];      // (20/11) was -5.2: that spot is in the river (not walkable), so arriving from the harbor left the hero sinking and stuck
const homesItems = (p) => (p.home && p.home.items) || [];
// ---------------------------------------------------------------- the sea extras (19/11): fishing, Sea Dex, fish market
let fishing = null, packUI = null, dexPanel = null, wardPanel = null, creator = null, tailor = null, spells = null, skillUI = null, floaters = null, petPanel = null, petObj = null, trPanel = null, toolbar = null;
let digMeshes = [], digMixers = [];
const seaOpen = () => !!(profile && (profile.flags.map2 || profile.admin));
/** The pet of this profile (if any) shows in the world; its hunger is brought up to date. */
function syncPet() { if (!petObj) return; if (profile && profile.pet) PETS.tick(profile.pet); petObj.set(profile && profile.pet ? profile.pet.kind : null); }
const petGoldMul = () => { if (profile && profile.pet) PETS.tick(profile.pet); return profile ? PETS.goldMul(profile) : 1; };
/** Treasure Isle: today's map for this child, and the dig. */
const treasureOk = (x, z) => L.REGIONS.isle.walkable(x, z, 0.8);
function treasureMap() { return profile ? TR.current(profile, Review.today(), tierOf(profile.stats.level), ISLE_MARKS, treasureOk) : null; }
function digHere() {
  const m = treasureMap(); if (!m) return; player.emote('Interact'); sfx('tick');
  const x = player.pos.x, z = player.pos.z;
  if (!TR.isGoal(m, x, z)) { const w = TR.warmth(TR.dist(m, x, z)); ui.dialogue([{ who: 'Ngọc', en: `Nothing here… ${w.en}`, vi: w.vi }]); return; }
  const t = tierOf(profile.stats.level), r = TR.reward(t); TR.solved(profile);
  const all = WR.allItems(), fresh = all.filter(([k, c]) => !WR.wardrobe(profile).owned.includes(WR.itemId(k, c))), [k, c] = (fresh.length ? fresh : all)[Math.floor(Math.random() * (fresh.length || all.length))];
  const isNew = WR.unlock(profile, k, c); profile.stats.gold += r.gold; Save.addExp(profile, r.exp); track('treasure'); sfx('fanfare'); save(); refresh();
  const gx = m.goal.x, gz = m.goal.z, gy = L.groundHeight(gx, gz);
  const mound = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 1 })); mound.position.set(gx, gy, gz); scene.add(mound); digMeshes.push(mound);
  animatedModel('isle_chest_v01').then((c) => {        // the Blender chest rises from the sand and its lid opens
    if (L.NAME !== 'isle') return; c.scene.position.set(gx, gy, gz); c.scene.rotation.y = Math.atan2(player.pos.x - gx, player.pos.z - gz); c.scene.scale.setScalar(1.6);
    c.scene.traverse((o) => { if (o.isMesh) o.castShadow = true; }); scene.add(c.scene); digMeshes.push(c.scene); mound.visible = false;
    const mx = new THREE.AnimationMixer(c.scene), act = mx.clipAction(c.animations.find((a) => a.name === 'Open') || c.animations[0]); act.setLoop(THREE.LoopOnce, 1); act.clampWhenFinished = true; act.play(); digMixers.push(mx);
  }, () => {});
  ui.dialogue([{ who: 'Ngọc', en: `I found the treasure! A chest full of gold, and a new piece for your wardrobe: ${WR.itemName(WR.itemId(k, c))}! (+${r.gold} gold, +${r.exp} EXP)`, vi: `Tìm được kho báu! ${isNew ? 'Có thêm món mới trong tủ đồ (phím V).' : ''} ${treasureMap() ? 'Còn một bản đồ nữa hôm nay: bấm M.' : 'Hôm nay con đã tìm đủ rồi, mai có bản đồ mới.'}` }]);
}
function openDex() { dexPanel.show(); sfx('tick'); }
/** A sea creature is found (caught or defeated): the first time pays by rarity, milestones pay a bonus. */
function seaFound(id) {
  const r = Sea.discover(profile, id, Review.today()); if (!r.isNew) return; const e = Sea.entry(id);
  profile.stats.gold += r.gold + r.bonus; Save.addExp(profile, r.exp); sfx('fanfare'); save(); refresh();
  ui.toast(`🐠 Album biển: ${e.en} = ${e.vi}  (+${r.gold + r.bonus} ●, +${r.exp} EXP)${r.bonus ? '  🎉 mốc thưởng!' : ''}`);
}
function catchFish(ids) {
  for (const id of ids) { const e = Sea.entry(id); if (!e) continue; Sea.keep(profile, e); if (!e.junk) { track('sea_fish'); seaFound(id); } }
  save(); refresh();
}
function sellFish() {
  const n = Sea.bucketCount(profile);
  if (!n) { ui.dialogue([{ who: 'Fishmonger', en: 'Your bucket is empty. Go fishing at the pier, then come back!', vi: 'Xô cá trống. Ra cuối cầu tàu nhỏ câu cá (E) rồi quay lại bán nhé.' }]); return; }
  const r = Sea.sellAll(profile); sfx('fanfare'); save(); refresh();
  ui.dialogue([{ who: 'Fishmonger', en: `Fresh fish! ${r.n} things for ${r.gold} gold. Thank you!`, vi: `Bán ${r.n} món được ${r.gold} vàng.` }]);
}
/** Blender furniture for the rooms (home_*_v01.glb) is fetched the first time it is needed; a missing file falls back to the shapes. */
const HOME_FILE = { bed: 'home_bed', wardrobe: 'home_wardrobe', mirror: 'home_mirror', table: 'home_table_chairs', sofa: 'home_sofa', lamp: 'home_lamp', bookcase: 'home_bookcase', desk: 'home_desk', clock: 'home_clock', picture: 'home_picture', rug: 'home_rug', plant: 'home_plant', guitar: 'home_guitar', piano: 'home_piano', drum: 'home_drum', violin: 'home_violin' };
const homeScenes = {};
const homeModel = (file) => (homeScenes[file] ? homeScenes[file].clone(true) : null);
const loadHomeModels = (items) => Promise.all(items.map((id) => HOME_FILE[id]).filter((f) => f && homeScenes[f] === undefined).map((f) => { homeScenes[f] = null; return staticModel(`${f}_v01`).then((m) => { homeScenes[f] = m; }, () => {}); }));
/** (21/11) Planting: pick a seed (English name, price, minutes to grow). */
function plantMenu(i) {
  const ids = Object.keys(Farm.CROPS);
  ui.choose({ who: 'Garden', en: 'What would you like to plant?', vi: `Vàng: ${profile.stats.gold} ● · rau lớn theo thời gian thật, quay lại thu hoạch rồi mang ra Village Shop bán.` }, [...ids.map((k) => { const c = Farm.CROPS[k]; return `${c.icon} ${c.en} (${c.vi}) · hạt ${c.seed} ● · ${c.grow} phút · được ${c.yield}`; }), 'Not now'], (k) => {
    if (k >= ids.length) return; const r = Farm.plant(profile, i, ids[k]);
    if (r.ok) { sfx('tick'); speak(`I planted ${ids[k]} seeds.`, true); save(); refresh(); homes.syncFarm(true); } else ui.toast(r.why === 'gold' ? 'Chưa đủ vàng mua hạt.' : 'Luống này đã có cây.');
  });
}
/** (21/11) Into a child's house: the hero walks inside (world/homewalk.js); the list (L) and the arrange mode (B) are on top.
 *  keepList: the list stays open (after an upgrade or a new colour, the house is rebuilt around the hero). */
async function goHome(o, mine, keepList = false, admin = false) {
  const items = [...homesItems(o)]; await loadHomeModels(items); const was = room && room.walk ? { ...room.me } : null;
  enterRoom('home', { items, model: homeModel, pieces: Saga.pieces(o), house: houseOf(o), editable: mine, avatar: { root: player.root, clips: Object.values(player.actions).map((a) => a.getClip()) },
    onPlace: (id, at) => { setPlace(houseOf(o), id, at); save(); }, hint: (t) => homePanel.setHint(t) });
  if (room && room.walk) { room.yaw0 = cam.yaw; if (was && was.f < houseOf(o).floors) Object.assign(room.me, { f: was.f, x: was.x, z: was.z, y: was.y, stair: was.stair }); }
  homePanel.show(o, mine, keepList, admin); if (!keepList && !mine) homePanel.hide();      // (24/11) the child sees the shop list as soon as they walk in (✕ closes it); a visitor only looks around
}
function enterRoom(kind, opts) { leaveRoom(); room = buildRoom(kind, opts); room.kind = kind; document.body.classList.add('inroom'); if (room.walk) { cam.minPitch = -0.6; cam.maxPitch = 1.45; } sfx('tick'); }
function leaveRoom() { if (!room) return; room.dispose(); room = null; document.body.classList.remove('inroom'); cam.minPitch = 0.05; cam.maxPitch = 1.25; cam.tPitch = Math.min(1.25, Math.max(0.05, cam.tPitch)); }
/** (24/11) The admin removes a child: the profile goes, and with it the home, the things in it and the progress (all of it lives in the profile). */
function adminDelete(id) { const i = store.profiles.findIndex((p) => p.id === id && !p.admin); if (i < 0) return; store.profiles.splice(i, 1); if (store.last === id) store.last = profile.id; try { Save.persist(store); } catch (e) { console.warn('save failed', e); } if (homes) homes.refresh(true); }
function adminPlaces() {
  const out = [], add = (region, name, x, z) => out.push({ region, name, x, z });
  for (const r of ['village', 'forest', 'harbor', 'isle']) for (const l of L.REGIONS[r].LANDMARKS) add(r, l.label, ...(l.spot || [l.x, l.z]));
  add('village', 'Tom', 2.6, 9.6); add('village', 'Cửa hàng', SHOP_DOOR.x - 1, SHOP_DOOR.z); add('village', 'Cú Mèo', OWL.x, OWL.z + 1.2); add('village', 'Bảng săn quái', BOARD.x + 1.2, BOARD.z + 1);
  for (const st of STARTS) add(st.region || 'village', 'Trò: ' + st.sign.replace(/^\S+\s/, ''), st.x + 0.8, st.z + 0.8);
  add('village', 'Nhà của các con', HOMES[0].door[0] + 2, HOMES[0].door[1] + 1.5); add('village', 'Cửa hàng nội thất', FURNITURE.door[0] + 1.5, FURNITURE.door[1]);
  add('village', 'Quầy rau quả', STALLS.produce.at[0] + 0.5, STALLS.produce.at[1]); add('village', 'Quầy nhạc cụ', STALLS.music.at[0] + 0.5, STALLS.music.at[1]); add('village', 'Tiệm may cô Mia', STALLS.tailor.at[0], STALLS.tailor.at[1] - 0.6);
  add('village', 'Vua Slime', BOSS_AT.x, BOSS_AT.z - 4); add('village', 'Golem Cổ', BOSS2_AT.x, BOSS2_AT.z - 4); add('village', 'Rương Đồng Hoang', CHEST_SPOTS[0][0], CHEST_SPOTS[0][1] - 1.5);
  add('forest', 'Cổng vào rừng', L.REGIONS.forest.SPAWN.x, L.REGIONS.forest.SPAWN.z); add('forest', 'Bảng săn quái rừng', FOREST_BOARD.x + 1.2, FOREST_BOARD.z + 0.6);
  add('forest', 'Nữ hoàng Nấm', BOSS3_AT.x + 6, BOSS3_AT.z); add('forest', 'Rương rừng', FOREST_CHESTS[0][0], FOREST_CHESTS[0][1] - 1.5);
  add('harbor', 'Bảng săn quái cảng', HARBOR_BOARD.x + 1.2, HARBOR_BOARD.z + 1.4); add('harbor', 'Bãi cua (bờ Nam)', 12, 42); add('harbor', 'Bờ sứa (phía Bắc)', 14, -24); add('harbor', 'Mũi cướp biển', 30, -34);
  add('harbor', 'Quầy Willow (đồ Map 2)', HARBOR.shop.x + 1.6, HARBOR.shop.z + 1.2); add('harbor', 'Thuyền trưởng Bạch Tuộc', BOSS4_AT.x, BOSS4_AT.z + 5); add('harbor', 'Rương cảng', HARBOR_CHESTS[0][0], HARBOR_CHESTS[0][1] - 1.5);
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
  if (region !== L.NAME) { if (region === 'forest') profile.flags.forest_open = true; if (region === 'harbor' || region === 'isle') profile.flags.map2 = true; await enterRegion(region, at); } else game.teleport(...at);
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
  if (quest) quest.q.step = 'done';      // the forest chapter (monsters, board, Queen) wakes after the crystal quest
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
/** Before Candy Match and the Kart Race (18/11: "to play you must answer some new words"): three words, new ones first,
 *  each shown as a card before it is asked; a wrong answer is shown and asked again, so the game opens only when all are right. */
/** (24/11) A word counts only when the child also reads it aloud well (speech recognition). Where the machine cannot check a
 *  reading (the .exe, no microphone) the card resolves with skipped:true and the old flow goes on. */
let reader = null;
function readOut(card, good, bad, title) { reader = reader || new ReadAloud({ speak: (w) => speak(w, true, 0.8) }); reader.read(card, { title }).then((r) => { if (r.ok) good(r); else bad(r); }); }
function wordGate(who, then, N = 4) {      // (20/11) four words, different from the last visit, before Candy, Race and Blocks
  const pool = unitCards.filter((c) => c.word.length <= 22);
  if (pool.length < 4) { then(); return; }
  const known = (c) => profile.words[c.id] && profile.words[c.id].right > 0, mix = (a) => [...a].sort(() => Math.random() - 0.5);
  const last = (profile.gateLast || {})[who] || [], fresh = pool.filter((c) => !last.includes(c.id)), src = fresh.length >= N ? fresh : pool;
  const list = [...mix(src.filter((c) => !known(c))), ...mix(src.filter(known))].slice(0, N); (profile.gateLast || (profile.gateLast = {}))[who] = list.map((c) => c.id);
  const ask = (n) => {
    if (n >= list.length) { sfx('fanfare'); ui.dialogue([{ who, en: "Great! Now let's play!", vi: `Con trả lời đúng cả ${N} từ rồi. Vào chơi thôi!` }], then); return; }
    const c = list[n], opts = mix([c, ...mix(pool.filter((x) => x.id !== c.id && x.vi !== c.vi)).slice(0, 2)]), t0 = Date.now();
    ui.choose({ who: `${who} · ${n + 1}/${list.length}`, en: `What does "${c.word}" mean?`, vi: `Trả lời đúng ${N} từ để vào chơi.` }, opts.map((o) => o.vi), (i) => {
      const ok = opts[i].id === c.id; Review.record(profile.words, c.id, { correct: ok, hints: 0, ms: Date.now() - t0 }); Save.recordSkill(profile, 'vocabulary', ok, 0); sfx(ok ? 'correct' : 'wrong');
      if (ok) readOut(c, () => ask(n + 1), () => ask(n)); else ui.dialogue([{ who, en: `"${c.word}" means "${c.vi}". Try again!`, vi: `${c.word} = ${c.vi}` }], () => ask(n));
    });
  };
  ui.dialogue([{ who, en: 'Answer four words, then you can play!', vi: `${who}: trả lời đúng ${N} từ tiếng Anh thì được vào chơi (mỗi lần là bộ từ khác).` }], () => teach(list, () => ask(0)));
}
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
function learnWord(card, isNew, use) {
  if (!card) { ui.dialogue([{ who: 'Pip', en: 'This bubble is empty…', vi: `Từ vựng Unit ${Save.unitOf(profile)} lớp ${profile.grade} chưa có.` }]); save(); return; }
  (profile.seen || (profile.seen = {}))[card.id] = Review.today();
  const exp = isNew ? 6 : 3, gold = isNew ? 2 : 1, who = isNew ? '✨ Từ mới' : '🔁 Ôn lại';
  const reward = (note) => { track('bubble'); if (L.NAME === 'harbor') track('sea_bubble'); profile.stats.gold += gold; Save.addExp(profile, exp); sfx('correct'); save(); refresh(); if (use) use(); return `${note} (+${exp} EXP, +${gold} vàng)`; };
  // (24/11) the reward comes only after the child reads the word aloud well; the bubble stays until then
  ui.dialogue([{ who, card, vi: isNew ? 'Nghe kỹ rồi sắp phải đọc to từ này nhé.' : 'Con nhớ từ này chứ? Nghe rồi đọc to lên nhé.' }], () => readOut(card,
    (r) => ui.dialogue([{ who, card, vi: reward(r.skipped ? 'Nghe và đọc lại nhé.' : 'Đọc chuẩn rồi, giỏi quá!') }]),
    () => ui.dialogue([{ who: 'Pip', en: 'Almost! Try again.', vi: 'Chưa chuẩn nên chưa có thưởng. Bong bóng vẫn còn, con quay lại đọc lại nhé!' }]), isNew ? 'Từ mới: đọc to nhé!' : 'Ôn lại: đọc to nhé!'));
  return 'wait';
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
  if (p.flags.forest_open && !p.flags.badge1) p.flags.badge1 = true;      // saves from before the badge: Tom already opened the forest
  ui.hero = p.name;      // lines written for 'Ngọc' are spoken by the child's own hero (19/11)
  if (p.admin) Object.assign(p.flags, { arrived: true, forest_open: true, map2: true });      // the admin may enter every map (18/11)
  learning(p, await loadGrade(p.grade));                                   // this grade only
  wear(profile); setSword(); setWear(); syncPet();
  if ((story.step === 'open' || story.step === 'done') && !p.flags.bridge_fixed) p.flags.bridge_fixed = true;   // saves from before the bridge quest
  applyBridge();
  $('mapbox').classList.remove('hidden');
  await enterRegion(p.region === 'forest' && p.flags.forest_open ? 'forest' : (p.region === 'harbor' || p.region === 'isle') && p.flags.map2 ? p.region : 'village');
  started = true; renderGear(); if (admin) admin.sync();
  // (19/11) a new hero, or a save from before the creator: pick a face, hair and clothes first (tests skip it unless ?creator=1)
  if (!p.admin && (!p.look || p.lookPending) && (!navigator.webdriver || /[?&]creator=1/.test(location.search))) { await creator.show('new'); save(); refresh(); }
  if (L.NAME === 'village' && story.step === 'arrive' && !p.flags.arrived) startIntro();
}

/** (21/11) "merge the weapon house near Tom with the potion shop, and show the goods like Lily's": every village counter
 *  opens the same shop window with all the counters (the one you came to first) and the market counter to sell goods. */
function villageShop(first = 'forge') { const all = ['forge', 'healer', 'rose']; shopWin.show('Village Shop', [first, ...all.filter((k) => k !== first), 'market']); }
/** Shop: a choice list. Buying puts the item on at once; owned items can be put on again for free. */
function openShop(who, seller, hello) {
  const b = bag(profile), ids = shopList(seller).filter((id) => !ITEMS[id].el);      // (20/11) element gear is on the shelves inside the Village Shop (the talk list keys only 1-9)
  const line = (id) => { const it = ITEMS[id], own = it.slot !== 'food' && b.owned.includes(id), on = b[it.slot] === id;
    const stat = [it.atk && `ATK +${it.atk}`, it.def && `DEF +${it.def}`, it.hp && `HP +${it.hp}`, it.heal && `heals ${it.heal}`].filter(Boolean).join(', ');
    return `${it.en} (${stat}) · ${on ? 'wearing' : own ? 'put on' : it.cost + ' ●' + (profile.stats.level < it.level ? ' · Lv ' + it.level : '')}`; };
  ui.choose({ who, en: hello, vi: `Vàng: ${profile.stats.gold} ● · Bánh trong túi: ${b.food}${seller === 'forge' || seller === 'rose' ? ' · Đồ theo hệ (kiếm, gậy phép, bùa) bày trong Village Shop' : ''}` }, [...ids.map(line), 'Goodbye!'], (i) => {
    if (i >= ids.length) return;
    const id = ids[i], it = ITEMS[id], r = buy(profile, id);
    if (r.ok) { sfx('correct'); setSword(); setWear(); save(); refresh(); return openShop(who, seller, r.why === 'owned' ? `You are wearing the ${it.en} now.` : `Here is your ${it.en}! Anything else?`); }
    sfx('wrong'); openShop(who, seller, r.why === 'gold' ? `Sorry, the ${it.en} costs ${it.cost} gold.` : `The ${it.en} is for level ${it.level} heroes. Train a little more!`);
  });
}
/** Opening scene (feedback 17/11): a new child arrives by boat down the river and steps onto the village dock.
 *  E / Space skips it. Not shown to automated tests unless the address has ?intro=1. */
let intro = null;
function makeBoat(model = null) {
  if (model) {      // the boat made in Blender (prop_boat_v01): deck 0.37 above its bottom, so lower it to sit like the old hull
    const g = new THREE.Group(); model.scale.setScalar(1.1); model.position.y = -0.67; model.traverse((o) => { if (o.isMesh) o.castShadow = true; }); g.add(model); return g;
  }
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
  ui.dialogue(OPENING(profile.name), async () => {          // the story first, then the boat ride (18/11); (20/11) a hero with a home stands in front of its door
    const lot = homes && homes.lotOf(profile);
    if (lot) {
      profile.flags.arrived = true; game.teleport(lot.h.door[0] + 1.8, lot.h.door[1]); player.yaw = -Math.PI / 2; cam.tYaw = cam.yaw = Math.PI / 2; save(); sfx('fanfare');
      ui.toast(`🏠 Đây là nhà của ${profile.name}! Tom đang chờ ở quảng trường (theo mũi tên vàng).`); return;
    }
    if (!intro) { let m = null; try { m = (await gltf('prop_boat_v01')).scene.clone(true); } catch (e) { console.warn('boat model', e); } intro = { boat: makeBoat(m), t: 0, len: 9 }; scene.add(intro.boat); }
    intro.t = 0; intro.boat.visible = true; intro.active = true;
    ui.toast(`${profile.name} đang tới làng bằng thuyền…`);
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
  const gl = GEAR_FILE[bag(profile).weapon] && gearScene(GEAR_FILE[bag(profile).weapon], setSword);       // (20/11) the Blender sword or staff (grip at the origin, blade along +Y)
  if (gl) { const w = new THREE.Group(), m = gl.scene.clone(true); m.traverse((o) => { if (o.isMesh) o.castShadow = true; }); w.add(m); w.rotation.set(Math.PI / 2, 0, 0); w.position.set(0, 0.05, 0.03); hand.add(w); swordMesh = w; return; }
  const g = new THREE.Group(), mat = (c, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: m ? 0.3 : 0.7, metalness: m, emissive: it.el ? it.color : it.color === 0x7fd6ff ? 0x2f8fd0 : 0, emissiveIntensity: it.el ? 0.35 : 0.6 });
  if (it.kind === 'staff') {      // (20/11) element staffs: a wooden staff with a glowing orb of the element, until the Blender ones (batch 20)
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.15, 8), mat(0x6a4020)); pole.position.y = 0.3; g.add(pole);
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 1), new THREE.MeshStandardMaterial({ color: it.color, emissive: it.color, emissiveIntensity: 1.3, roughness: 0.2 })); orb.position.y = 0.92; g.add(orb);
    for (let k = 0; k < 3; k++) { const prong = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.16, 4), mat(0xe2b04a, 0.8)); const a = k / 3 * Math.PI * 2; prong.position.set(Math.cos(a) * 0.07, 0.86, Math.sin(a) * 0.07); prong.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); g.add(prong); }
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); g.rotation.set(Math.PI / 2, 0, 0); g.position.set(0, 0.05, 0.03); hand.add(g); swordMesh = g; return;
  }
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.6, 0.022), mat(it.color, it.atk > 5 ? 0.7 : 0)); blade.position.y = 0.4; g.add(blade);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 4), blade.material); tip.position.y = 0.76; tip.scale.z = 0.45; g.add(tip);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.05), mat(0xe2b04a, 0.8)); guard.position.y = 0.09; g.add(guard);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.16, 8), mat(0x5f3519)); g.add(grip);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.rotation.set(Math.PI / 2, 0, 0); g.position.set(0, 0.05, 0.03); hand.add(g); swordMesh = g;
}
/** Worn armour on the chest and the charm on the hip (A6). */
let armorShown = null, charmShown = null;
const gearCache = new Map();         // file -> loaded glTF, null while loading, false when missing
function gearScene(file, then) {
  const v = gearCache.get(file); if (v !== undefined) return v || null;
  gearCache.set(file, null); gltf(file).then((g) => { gearCache.set(file, g); if (then) then(); }, () => gearCache.set(file, false));
  return null;
}
/** Takes a worn Blender piece off (its outline twins and any extra bones go with it). */
function dropGear(g) { if (!g) return; for (const b of g.userData.extraBones || []) b.removeFromParent(); g.removeFromParent(); }
/** Puts a Blender piece on Ngọc. Skinned pieces (the element armours) are re-bound to her own skeleton by bone name; the others
 *  (vests, cloaks, charms, amulets) are static in her bind pose and hang on one bone. Returns the group or null while the file loads. */
function gearOnBody(id, boneRe) {
  const file = GEAR_FILE[id], gl = file && gearScene(file, setWear); if (!gl || !player) return null;
  const root = player.root, bones = {}; let ref = null;
  root.traverse((o) => { if (o.isBone) bones[o.name] = o; if (!ref && o.isSkinnedMesh && !o.userData.outline) ref = o; });
  const grp = new THREE.Group(), src = gl.scene.clone(true); grp.userData.extraBones = [];
  let skinnedAny = false;
  src.traverse((o) => { if (o.isSkinnedMesh) skinnedAny = true; });
  if (skinnedAny) {
    const list = []; src.traverse((o) => { if (o.isSkinnedMesh) list.push(o); });
    for (const m of list) {
      const names = m.skeleton.bones;
      const mine = names.map((b) => { let pb = bones[b.name]; if (!pb) { const par = b.parent && bones[b.parent.name]; if (par) { b.removeFromParent(); par.add(b); grp.userData.extraBones.push(b); pb = b; } } return pb || b; });
      m.removeFromParent(); m.bind(new THREE.Skeleton(mine, m.skeleton.boneInverses), m.bindMatrix); m.frustumCulled = false; m.castShadow = true; grp.add(m);
    }
    root.add(grp);
  } else {
    const b = bones[boneRe] || null; if (!b) return null;
    const i = ref ? ref.skeleton.bones.indexOf(b) : -1;
    if (i >= 0) { grp.matrix.copy(ref.skeleton.boneInverses[i]); grp.matrix.decompose(grp.position, grp.quaternion, grp.scale); }
    src.traverse((o) => { if (o.isMesh) o.castShadow = true; }); grp.add(src); b.add(grp);
  }
  addOutline(grp);
  return grp;
}
function setWear() {
  if (!player || !profile) return;
  const bone = (re) => { let b = null; player.root.traverse((o) => { if (!b && o.isBone && re.test(o.name)) b = o; }); return b; };
  dropGear(armorShown); dropGear(charmShown); for (const m of [armorShown, charmShown]) if (m && !m.userData.extraBones) m.removeFromParent();
  armorShown = charmShown = null; const b = bag(profile);
  const chest = bone(/^chest$/), hips = bone(/^hips$/);
  const a = gearOnBody(b.armor, 'chest') || armorMesh(b.armor); if (a && chest) { if (!a.parent) chest.add(a); armorShown = a; }
  if (b.charm) {
    const amulet = /_amulet$/.test(b.charm), c = gearOnBody(b.charm, amulet ? 'neck' : 'hips');
    if (c) charmShown = c; else if (hips) { const f = charmMesh(); f.position.set(0.13, 0.02, 0.08); hips.add(f); charmShown = f; }
  }
  applyLook();
}
/** (19/11) "nhà của bé sẽ theo bé đến các Map": outside the village a magic door near the arrival spot opens the hero's own home. */
let homeDoor = null;
function placeHomeDoor(region) {
  if (!homeDoor) {
    homeDoor = new THREE.Group(); const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a2a, roughness: 0.8 }), door = new THREE.MeshStandardMaterial({ color: 0x3f7ad0, roughness: 0.6 });
    const glow = new THREE.MeshStandardMaterial({ color: 0xffe28a, emissive: 0xffb030, emissiveIntensity: 1.2 });
    for (const x of [-0.62, 0.62]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.3, 0.16), wood); post.position.set(x, 1.15, 0); homeDoor.add(post); }
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 0.2), wood); top.position.y = 2.35; homeDoor.add(top);
    const d = new THREE.Mesh(new THREE.BoxGeometry(1.08, 2.1, 0.08), door); d.position.y = 1.08; homeDoor.add(d);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), glow); knob.position.set(0.38, 1.05, 0.07); homeDoor.add(knob);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), glow); star.position.set(0, 2.62, 0); homeDoor.add(star); homeDoor.userData.star = star;
    homeDoor.traverse((o) => { if (o.isMesh) o.castShadow = true; }); scene.add(homeDoor);
  }
  if (homeDoor.userData.sign) { homeDoor.remove(homeDoor.userData.sign); homeDoor.userData.sign.material.map.dispose(); homeDoor.userData.sign.material.dispose(); }
  const sign = label(`🏠 Nhà của ${profile ? profile.name : ''}`, { size: 26, scale: 0.7 }); sign.position.y = 3.1; homeDoor.add(sign); homeDoor.userData.sign = sign;
  homeDoor.visible = region !== 'village' && !!profile && !profile.admin;
  if (!homeDoor.visible) return;
  // a walkable spot a few metres from the arrival point, facing it
  const sx = L.SPAWN.x, sz = L.SPAWN.z;
  for (let d = 4; d <= 16; d += 2) for (let k = 0; k < 12; k++) {      // open ground (not a narrow pier), as near the arrival as possible
    const a = k / 12 * Math.PI * 2, x = sx + Math.sin(a) * d, z = sz + Math.cos(a) * d;
    if (!L.walkable(x, z, 2.4) || L.inWater(x, z) || L.EXITS.some((ex) => Math.hypot(x - ex.x, z - ex.z) < ex.r + 3)) continue;
    homeDoor.position.set(x, L.walkHeight(x, z), z); homeDoor.rotation.y = Math.atan2(sx - x, sz - z); return;
  }
  homeDoor.position.set(sx + 2, L.walkHeight(sx + 2, sz), sz);
}
/** The creator's view: the hero's front, close, and shifted right of the card on the left. */
let camBefore = null;
function creatorCamera(on) {
  if (on) {
    if (!camBefore) camBefore = { yaw: cam.tYaw, pitch: cam.tPitch, dist: cam.tDist };
    cam.tYaw = player.yaw; cam.tPitch = 0.14; cam.tDist = 3.2; player.route = null; document.body.classList.add('creating');
    const w = innerWidth, h = innerHeight; if (w > 700) camera.setViewOffset(w, h, -Math.min(410, w * 0.46) * 0.5, 0, w, h);
  } else {
    if (camBefore) { cam.tYaw = camBefore.yaw; cam.tPitch = camBefore.pitch; cam.tDist = camBefore.dist; camBefore = null; }
    camera.clearViewOffset(); document.body.classList.remove('creating');
  }
}
/** The wardrobe pieces worn on Ngọc (19/11): rebuilt from profile.wardrobe.worn. Clothes and hair tint her body materials,
 *  the hair style swaps the Hair_* object, and the accessories (acc_*_v01.glb, built in her bind pose) hang on her bones. */
const NGOC_COLORS = { hair: '#8c4a22', top: '#f4e9d2', bottom: '#cfb487' };
const ACC_BONE = { hat: /^head$/, bow: /^head$/, headband: /^head$/, glasses: /^head$/, scarf: /^neck$/, bag: /^chest$/, bracelet: /^hand.?L$/, necklace: /^neck$/, earrings: /^head$/, tiara: /^head$/, hairclip: /^head$/ };
const PROC_ONLY = new Set();      // kinds drawn only from outfit.js shapes (the jewellery now has Blender files; the shapes are the fallback when a file is missing)
const JEWEL = new Set(['necklace', 'earrings', 'tiara', 'hairclip']);
const accScene = {};                       // kind -> loaded glTF scene, or null when the file is missing (the shapes from outfit.js take over)
let lookShown = [], faceShown = '';
function applyLook() {
  if (!player || !profile) return;
  for (const o of lookShown) o.removeFromParent(); lookShown = [];
  const root = player.root, bone = (re) => { let b = null; root.traverse((o) => { if (!b && o.isBone && re.test(o.name)) b = o; }); return b; };
  const worn = WR.wardrobe(profile).worn, val = (slot) => { const it = worn[slot] && WR.parse(worn[slot]); return it ? it.color : null; }, paint = (n, d) => (n && (WCOL[n] || WR.JEWEL_HEX[n])) || d;
  const look = lookOf(profile); tintSkin(root, look.skin);
  if (profile.look) { const want = look.face + '|' + look.skin; if (faceShown !== want) { faceShown = want; faceMaps(look.face, look.skin).then((m) => { if (faceShown === want) player.setFaces(m); }, (e) => console.warn(e.message)); } }
  else if (faceShown) { faceShown = ''; player.setFaces(player.firstFaces); }
  const dress = val('body');
  tintBody(root, { hair: paint(val('haircolor'), NGOC_COLORS.hair), top: paint(dress || val('top'), NGOC_COLORS.top), bottom: paint(dress || val('bottom'), NGOC_COLORS.bottom) });
  setHairStyle(root, val('style') || 'short');
  const kindOf = (slot) => { const it = worn[slot] && WR.parse(worn[slot]); return it ? it.kind : null; };
  const baseK = (slot) => WR.baseOf(kindOf(slot));
  setClothes(root, { top: CLOTH.top[baseK('top')], bottom: CLOTH.bottom[baseK('bottom')], body: CLOTH.body[baseK('body')] });
  { // (21/11) prints: the second colour is white on a dark piece, a deep navy on a white or pale one
    const second = (slot) => { const c = val(slot); return c === 'white' || c === 'yellow' ? '#2a3a6a' : '#ffffff'; };
    const upper = kindOf('body') ? 'body' : 'top';
    setPattern(root, 'top', WR.patOf(kindOf(upper)), second(upper)); setPattern(root, 'bottom', kindOf('body') ? '' : WR.patOf(kindOf('bottom')), second('bottom'));
    const feet = kindOf('feet'), skinCol = (() => { let c = null; root.traverse((o) => { if (!c && o.isMesh && o.material && o.material.name === 'ngoc_skin') c = o.material.color; }); return c; })();
    setBoots(root, feet === 'boots' || feet === 'hightops' ? 'colour' : feet === 'sandals' || feet === 'flats' ? 'skin' : '', paint(val('feet'), '#8a5a30'), skinCol);
  }
  setGoggles(root, !['hat', 'tiara'].includes(kindOf('head')));
  syncOutlines(root);
  let skinned = null; root.traverse((o) => { if (!skinned && o.isSkinnedMesh) skinned = o; });
  const hang = (obj, b) => { const i = skinned ? skinned.skeleton.bones.indexOf(b) : -1; if (i >= 0) { obj.matrix.copy(skinned.skeleton.boneInverses[i]); obj.matrix.decompose(obj.position, obj.quaternion, obj.scale); } b.add(obj); lookShown.push(obj); };
  for (const id of Object.values(worn)) {
    const it = id && WR.parse(id); if (!it) continue;
    if (PROC_ONLY.has(it.kind)) { for (const part of outfitParts(it.kind, it.color)) { const b = bone(part.bone); if (b) { b.add(part.obj); lookShown.push(part.obj); } } continue; }
    if (it.kind === 'boots') continue;      // (21/11) the body's own boots, recoloured above
    const shoeLike = { hightops: [1.12, 1.05, 1.08], flats: [1.0, 0.55, 1.0], sandals: [1.04, 0.3, 1.04] }[it.kind];      // the sneaker file, reshaped
    if (!ACC_BONE[it.kind] && !['shoes'].includes(it.kind) && !shoeLike) continue;
    const src = accScene[shoeLike ? 'shoes' : it.kind];
    if (shoeLike && !src) continue;
    if (src) {
      const clone = src.clone(true);
      if (JEWEL.has(it.kind)) { const metal = WR.JEWEL_HEX[it.color]; tintAccessory(clone, metal || WR.JEWEL_HEX.gold, metal ? new THREE.Color(metal).multiplyScalar(0.8).getStyle() : (WCOL[it.color] || '#ffffff')); } else tintAccessory(clone, WCOL[it.color] || '#ffffff');
      for (const c of [...clone.children]) { const side = /_([LR])$/.exec(c.name); const b = bone(it.kind === 'shoes' || shoeLike ? new RegExp(`^foot.?${side ? side[1] : 'L'}$`) : ACC_BONE[it.kind]); if (b) { c.removeFromParent(); hang(c, b); if (shoeLike) { const sc = new THREE.Group(); c.parent.add(sc); sc.position.copy(c.position); sc.quaternion.copy(c.quaternion); c.position.set(0, 0, 0); c.quaternion.identity(); sc.add(c); sc.scale.set(...shoeLike); lookShown.push(sc); } } }
    } else if (src === undefined) {
      accScene[it.kind] = null;
      staticModel(`acc_${it.kind}_v01`).then((m) => { accScene[it.kind] = m; applyLook(); }, () => {});
      for (const part of outfitParts(it.kind, it.color)) { const b = bone(part.bone); if (b) { b.add(part.obj); lookShown.push(part.obj); } }      // shapes until the file arrives
    } else for (const part of outfitParts(it.kind, it.color)) { const b = bone(part.bone); if (b) { b.add(part.obj); lookShown.push(part.obj); } }
  }
}
/** Pieces won at the Boutique or the Salon go to the wardrobe. */
function gainItems(list) {
  const fresh = list.filter((x) => WR.unlock(profile, x.kind, x.color)); if (!fresh.length) return;
  save(); refresh(); ui.toast(`🎁 Tủ đồ mới: ${fresh.map((x) => WR.itemName(WR.itemId(x.kind, x.color))).join(', ')} (phím U để mặc)`);
}
/** The map exam (18/11): ten questions (words, grammar, sentences), 8 right to pass; no hints while it runs, answers shown
 *  at the end. A failed paper sends the child through the missed questions again until each one is right; the next paper is new. */
/** The word cards of any unit of this grade (the map exams ask the finished map's unit even after the next map opened). */
let gradeUnits = [];
const cardsOfUnit = (n) => { const un = gradeUnits[n - 1], uid = `g${profile.grade}_u${String(n).padStart(2, '0')}`; return ((un && un.vocabulary) || []).filter((w) => w.word.length <= 22 && w.vi.length <= 34).map((w) => ({ id: `${uid}:${w.word.toLowerCase()}`, word: w.word, vi: w.vi })); };
function mapExam(L0, pool, unit = Save.unitOf(profile)) {
  const st = Exam.examState(profile), paper = Exam.buildExam({ cards: pool, grammar: grammarFor(profile.grade, unit, 10), avoid: st.last });
  if (!paper) { Save.passGate(profile, L0); save(); refresh(); return; }
  const qs = paper.questions, total = qs.length, answers = [], who = 'Cú Mèo';
  const redo = (list, k) => {          // study again: every missed question until it is right
    if (k >= list.length) { ui.dialogue([{ who: 'Owl', en: 'Good work! Come back for a new test when you are ready.', vi: 'Đề lần sau sẽ khác. Khi nào thuộc rồi thì gặp cú làm bài mới nhé.' }]); return; }
    const q = list[k];
    ui.choose({ who: `${who} · Học lại ${k + 1}/${list.length}`, en: q.en, vi: q.vi }, q.options, (i) => {
      sfx(i === q.a ? 'correct' : 'wrong');
      if (i === q.a) redo(list, k + 1); else ui.dialogue([{ who: 'Owl', en: q.explain.en, vi: q.explain.vi }], () => redo(list, k));
    });
  };
  const finish = () => {
    const g = Exam.grade(qs, answers); Exam.recordExam(profile, paper.ids, g.pass);
    if (g.pass) { Save.passGate(profile, L0); sfx('fanfare'); }
    save(); refresh();
    if (g.pass) { ui.dialogue([{ who: 'Owl', en: L0 === 30 ? `Wonderful! ${g.right} of ${g.total}. You have finished the whole sea map!` : `Wonderful! ${g.right} of ${g.total}. The next land is open to you!`, vi: L0 === 30 ? `Con đúng ${g.right}/${g.total}, qua bài kiểm tra cuối Map 2! Map 3 (Sa mạc Gió Vàng) đang được xây, sắp mở.` : `Con làm đúng ${g.right}/${g.total}, qua bài kiểm tra rồi. Map mới đã mở!` }]); return; }
    const lines = [{ who: 'Owl', en: `${g.right} of ${g.total}. You need ${Math.min(Exam.EXAM_PASS, g.total)} to pass.`, vi: `Con đúng ${g.right}/${g.total}, cần ${Math.min(Exam.EXAM_PASS, g.total)}. Mình học lại những câu sai nhé.` }];
    for (const q of g.wrong) lines.push(q.card ? { who: 'Học lại', card: q.card } : { who: 'Học lại', en: q.explain.en, vi: q.explain.vi });
    ui.dialogue(lines, () => redo(g.wrong, 0));
  };
  const ask = (n) => {
    if (n >= total) { finish(); return; }
    const q = qs[n], t0 = Date.now();
    ui.choose({ who: `${who} · Bài kiểm tra ${n + 1}/${total}`, en: q.en, vi: q.vi }, q.options, (i) => {
      answers[n] = i; const ok = i === q.a;
      if (q.card) Review.record(profile.words, q.card.id, { correct: ok, hints: 0, ms: Date.now() - t0 });
      Save.recordSkill(profile, q.kind === 'vocab' ? 'vocabulary' : 'grammar', ok, 0); sfx(ok ? 'correct' : 'wrong'); ask(n + 1);
    });
  };
  const tries = st.tries ? ` Lần thử thứ ${st.tries + 1}.` : '';
  ui.dialogue([{ who: 'Owl', en: 'Hoo-hoo! Before the next land, I must test you.', vi: `Bài kiểm tra mở map: ${total} câu về từ vựng, ngữ pháp và câu. Cần đúng ${Math.min(Exam.EXAM_PASS, total)}/${total}. Đề mỗi lần khác nhau.${tries}` }], () => ask(0));
}
/** The owl's review: five quick questions on learned and unit words, both directions. 4 of 5 opens the gate. */
const OWL = { x: 2.9, z: 14.5 }, SHOP_DOOR = { x: 7.6, z: -8 };      // the orange shop's door (west side)
function owlReview() {
  const L0 = Save.gateWaiting(profile);
  if (!L0) { const next = Save.GATES.find((g) => g > profile.stats.level); ui.dialogue([{ who: 'Owl', en: 'Hoo-hoo! Keep training, little hero.', vi: next ? `Đến cấp ${next}, cú sẽ ôn tập với con để mở cấp tiếp theo.` : 'Con đã qua hết các cổng ôn tập của làng.' }]); return; }
  const seen = Object.keys(profile.words).map((id) => cardOfFn(id)).filter(Boolean), pool = [...seen, ...unitCards.filter((c) => !seen.some((x) => x.id === c.id))].filter((c) => c.word.length <= 22);
  if (pool.length < 4) { Save.passGate(profile, L0); save(); refresh(); ui.dialogue([{ who: 'Owl', en: 'Hoo! No words to review yet. Go on!', vi: `Từ vựng Unit ${Save.unitOf(profile)} lớp ${profile.grade} chưa có, cổng tự mở.` }]); return; }
  if (Exam.EXAM_GATES.includes(L0)) { const eu = Exam.EXAM_UNIT[L0], ep = cardsOfUnit(eu); return mapExam(L0, ep.length >= 4 ? ep : pool, eu); }      // the levels that open a new map ask the 10-question exam on the map just finished
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
/** (24/11) Portals and the world map. Arriving: from the harbor to the village on the dock, from the forest at the village gate. */
let worldUI = null, portalGroup = null;
function openPortal(pt) { const routes = WORLD.routesOf(profile, L.NAME, pt); sfx('tick'); worldUI.chooser(routes, 'Cổng dịch chuyển · ' + (WORLD.mapById(L.NAME) || {}).vi); }
function openWorldMap() { if (!profile || switching) return; sfx('tick'); worldUI.map(WORLD.portalAt(L.NAME, player.pos.x, player.pos.z)); }
async function travelTo(to) {
  const from = L.NAME; let at = null;
  if (to === 'village') at = from === 'harbor' ? VILLAGE_DOCK : [L.REGIONS.village.EXITS[0].x + 0.5, L.REGIONS.village.EXITS[0].z + 5];
  if (to === 'forest') profile.flags.forest_open = true;      // only reachable when the road is open, or by the admin
  if (to === 'harbor') profile.flags.map2 = true;
  await enterRegion(to, at);
}
/** Stone arches with their swirl at the edges of this map. */
function buildPortals() {
  if (portalGroup) { portalGroup.removeFromParent(); portalGroup.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); portalGroup = null; }
  const list = WORLD.portalsOf(L.NAME); if (!list.length) return;
  portalGroup = new THREE.Group(); portalGroup.name = 'portals';
  for (const pt of list) { const names = pt.routes.map((to) => WORLD.mapById(to).vi.split(' · ')[0]).join(' · '); const m = makePortal(pt.x, L.groundHeight(pt.x, pt.z), pt.z, pt.yaw, names); portalGroup.add(m); }
  scene.add(portalGroup);
}
function interactTarget() {
  if (fishing) { const f = fishing.interact(player.pos); if (f && (fishing.active || !(arcade && arcade.open))) return f; }      // (20/11) fishing spots and the rod in hand
  const p = player.pos;
  { const pt = WORLD.portalAt(L.NAME, p.x, p.z); if (pt) return { text: 'E · Cổng dịch chuyển', run: () => openPortal(pt) }; }      // (24/11) every map edge is a portal; two roads: the child chooses
  for (const ex of L.EXITS) if (near(ex.x, ex.z, ex.r) && !WORLD.portalsOf(L.NAME).some((pt) => Math.hypot(pt.x - ex.x, pt.z - ex.z) < 1.5)) {
    if (ex.flag && !profile.flags[ex.flag]) return { text: 'Cổng rừng còn khóa. Hãy giúp Tom và Ben trước.', run() {} };
    return { text: 'E · ' + ex.label, run: () => { const back = ex.to === 'village' ? (L.NAME === 'harbor' ? VILLAGE_DOCK : [L.REGIONS.village.EXITS[0].x + 0.5, L.REGIONS.village.EXITS[0].z + 5]) : (L.NAME === 'isle' ? [HARBOR.isle.x + 2.2, HARBOR.isle.z - 0.5] : null); enterRegion(ex.to, back); } };
  }
  if (homeDoor && homeDoor.visible && near(homeDoor.position.x, homeDoor.position.z, 1.9)) return { text: `E · Cửa nhà thần kỳ: về nhà của ${profile.name}`, run: () => goHome(profile, true) };
  if (L.NAME === 'isle') {          // Treasure Isle (19/11): read the map, walk the steps, dig
    if (!treasureMap()) return { text: 'Hôm nay con đã tìm đủ kho báu. Mai có bản đồ mới!', run() {} };
    return { text: 'E · Đào ở đây (bản đồ kho báu: phím M)', run: digHere };
  }
  if (L.NAME === 'harbor') {          // Map 2: Sunny Harbor (18/11)
    const H = HARBOR;
    if (near(H.boutique.door[0] + 1, H.boutique.door[1], 2.0)) return { text: 'E · Style Boutique: trò thời trang với cô Mia', run: () => { const t = tierOf(profile.stats.level); arcade.start(withTier(styleGame(Math.random, t), t)); } };
    if (near(H.cafe.door[0] + 1, H.cafe.door[1], 2.0)) return { text: 'E · Seaside Café: trò nấu ăn với đầu bếp Leo', run: () => { const t = tierOf(profile.stats.level); arcade.start(withTier(cafeGame(Math.random, t), t)); } };
    if (near(H.salon.door[0], H.salon.door[1] + 1, 2.0)) return { text: 'E · Beauty Salon: trò làm đẹp với chị Ruby', run: () => { const t = tierOf(profile.stats.level); arcade.start(withTier(salonGame(Math.random, t), t)); } };
    if (near(H.isle.x, H.isle.z, 2.3)) return { text: 'E · Đi thuyền tới Đảo Kho Báu', run: () => enterRegion('isle') };
    if (near(H.market.x, H.market.z - 1.2, 3.4)) { const n = Sea.bucketCount(profile); return { text: n ? `E · Bán ${n} món trong xô cá ở chợ cá` : 'E · Chợ cá (xô cá đang trống)', run: sellFish }; }
    if (near(H.shop.x + 1.6, H.shop.z + 0.6, 2.4)) return { text: "E · Quầy của Willow (đồ Map 2)", run: () => { enterRoom('forest'); shopWin.show("Willow's Harbor Stall", ['forest']); } };
    if (near(sam.x, sam.z, 3)) return { text: 'E · Nói chuyện với Sam', run: () => ui.dialogue([{ who: 'Sam', en: 'Welcome to Sunny Harbor! The sea is big and blue.', vi: 'Chào mừng tới Cảng Mặt Trời (Map 2)! Ghé Style Boutique bên trái quảng trường nhé.' }]) };
    for (const f of [mini, wild, chests, spots]) { const c = f && f.interact(p); if (c) return c; }
    return null;
  }
  if (L.NAME === 'forest') {
    const c = crystals.nearest(p);
    if (c) return { text: 'E · Chạm vào pha lê ký ức', run: () => { player.emote('Interact'); if (quest.touch(c)) player.emote('Celebrate'); } };
    if (near(tom.x, tom.z, 3)) return { text: 'E · Nói chuyện với Tom', run: () => quest.talkTom() };
    if (near(sam.x, sam.z, 3)) return { text: 'E · Nói chuyện với Sam', run: () => ui.dialogue(SAM_LINES) };
    const tree = landmark('tree');
    if (quest.step === 'tree' && near(tree.spot[0], tree.spot[1], 3.2)) return { text: 'E · Đặt pha lê vào cây cổ thụ', run: () => quest.treeChallenge() };
    for (const f of friends) if (f.region === 'forest' && near(f.npc.x, f.npc.z, 2.6)) return { text: 'E · Cửa hàng thuốc của ' + f.who + ' (bình máu, bình mana)', run: () => ui.dialogue([{ who: f.who, en: f.lines[0] }, { who: f.who, en: 'Herbs make the best potions. Take a look!' }], () => villageShop(f.shop)) };
    if (near(FOREST_SHOP.x + 1.6, FOREST_SHOP.z + 0.6, 2.4)) return profile.flags.map2 ? { text: "E · Cửa hàng của Willow (đồ Map 2)", run: () => { enterRoom('forest'); shopWin.show("Willow's Camp Shop", ['forest']); } } : { text: 'Willow đang soạn hàng: đồ Map 2 sẽ bán ở Cảng Mặt Trời', run() {} };
    for (const f of [mini, wild, chests, spots]) { const c = f && f.interact(p); if (c) return c; }      // Map 2: board, boss shield, chests, word bubbles
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
  if (L.NAME === 'village' && near(VILLAGE_DOCK[0], VILLAGE_DOCK[1], 2.4)) return profile.flags.map2 ? { text: 'E · Đi thuyền tới Cảng Mặt Trời (Map 2)', run: () => enterRegion('harbor') } : { text: 'Bến thuyền: mở Map 2 để đi Cảng Mặt Trời', run: () => ui.toast('Lên cấp 20 và qua bài kiểm tra của Cú Mèo để mở Map 2.') };
  if (homes) {       // the children's homes, Bram's furniture shop and the two stalls (18/11)
    const fa = homes.farmAt(player.pos);      // (21/11) the home farm: beds, the coop, the pig pen
    if (fa) { const o = fa.lot.owner, mine = o && o.id === profile.id;
      if (!mine) return { text: `Vườn của ${o ? o.name : 'nhà trống'}`, run() {} };
      if (fa.kind === 'bed') { const b = Farm.farm(profile).beds[fa.i], st = Farm.stageOf(b);
        if (!b) return { text: 'E · Gieo hạt (cà rốt, cà chua, bắp cải, ngô, bí ngô)', run: () => plantMenu(fa.i) };
        if (st < 4) return { text: `${Farm.CROPS[b.crop].icon} ${Farm.CROPS[b.crop].en} đang lớn · còn ${Farm.minutesLeft(b)} phút`, run() {} };
        return { text: `E · Thu hoạch ${Farm.CROPS[b.crop].en} ${Farm.CROPS[b.crop].icon}`, run: () => { const r = Farm.harvest(profile, fa.i); if (r.ok) { sfx('pickup'); ui.toast(`${Farm.CROPS[r.crop].icon} +${r.n} ${r.crop} vào túi (V) · bán ở Village Shop`); speak(r.crop + 's', true); track('farm'); save(); refresh(); homes.syncFarm(true); } } }; }
      if (fa.kind === 'coop') { const n = Farm.eggsReady(profile); return { text: n ? `E · Nhặt ${n} quả trứng 🥚` : `Gà đang đẻ trứng · ${Farm.EGG_EVERY} phút một quả`, run: () => { const k = Farm.collectEggs(profile); if (k) { sfx('pickup'); ui.toast(`🥚 +${k} trứng vào túi (V)`); speak('eggs', true); track('farm'); save(); refresh(); homes.syncFarm(true); } } }; }
      if (fa.kind === 'pen') { const pig = Farm.farm(profile).pig;
        if (!pig) return { text: `E · Mua lợn con (${Farm.PIGLET} vàng)`, run: () => { const r = Farm.buyPiglet(profile); if (r.ok) { sfx('fanfare'); ui.toast('🐷 Lợn con về chuồng! Cho ăn 4 lần (rau trong túi hoặc 2 vàng) để lợn lớn.'); save(); refresh(); homes.syncFarm(true); } else ui.toast(r.why === 'gold' ? `Cần ${Farm.PIGLET} vàng.` : 'Chưa có chuồng.'); } };
        if (Farm.pigGrown(pig)) return { text: 'E · Lợn đã lớn: đưa ra chợ bán 🐖', run: () => { if (Farm.takePig(profile)) { sfx('fanfare'); ui.toast('🐖 Con lợn vào túi (V): mang ra Village Shop bán được 60 vàng.'); track('farm'); save(); refresh(); homes.syncFarm(true); } } };
        return { text: `E · Cho lợn ăn (${pig.feeds}/${Farm.PIG_FEEDS} bữa)`, run: () => { const r = Farm.feedPig(profile); if (r.ok) { sfx('correct'); ui.toast(r.food === 'gold' ? '🐷 Cho ăn cám (−2 vàng). Ụt ịt!' : `🐷 Cho ăn ${r.food}. Ụt ịt!`); save(); refresh(); homes.syncFarm(true); } else ui.toast(r.why === 'full' ? `Lợn còn no, ${r.left} phút nữa cho ăn tiếp.` : r.why === 'gold' ? 'Cần rau trong túi hoặc 2 vàng.' : 'Lợn đã lớn.'); } }; }
    }
    const lot = homes.doorAt(player.pos);
    if (lot) { const o = lot.owner; if (!o) return { text: 'Nhà trống: tạo thêm người chơi để nhận nhà này', run: () => ui.toast('Mỗi bé (tối đa 2) có một ngôi nhà ở đây.') };
      const mine = o.id === profile.id; return { text: mine ? 'E · Vào nhà của con' : `E · Thăm nhà của ${o.name}`, run: () => goHome(o, mine) }; }
    if (near(FURNITURE.door[0] + 0.9, FURNITURE.door[1], 1.9)) return { text: 'E · Cửa hàng nội thất (giường, bàn ghế, vườn)', run: () => { enterRoom('shop'); shopWin.show('Furniture & Garden Shop', ['home', 'garden']); } };
    if (near(STALLS.pets.at[0], STALLS.pets.at[1], 1.9)) return { text: "E · Penny's Pet Shop (mua chó con, mèo con, thỏ, vịt con)", run: () => { petPanel.show(true); sfx('tick'); speak('Welcome to my pet shop! Who would you like to take home?'); } };
    if (near(STALLS.produce.at[0], STALLS.produce.at[1], 1.8)) return { text: 'E · Quầy rau quả của Poppy', run: () => shopWin.show("Poppy's Fruit & Veg", ['produce']) };
    if (near(STALLS.music.at[0], STALLS.music.at[1], 1.8)) return { text: 'E · Quầy nhạc cụ của Anna', run: () => shopWin.show("Anna's Instruments", ['music']) };
    if (near(STALLS.tailor.at[0], STALLS.tailor.at[1], 2.0)) return { text: 'E · Tiệm may của cô Mia (quần áo, trang sức)', run: () => tailor.show() };
  }
  if (near(SHOP_DOOR.x, SHOP_DOOR.z, 1.7)) return { text: 'E · Vào Village Shop (vũ khí, bình máu/mana, bánh, bán hàng)', run: () => { enterRoom('shop'); villageShop('forge'); } };
  if (near(HALL_DOOR.x, HALL_DOOR.z, 1.8)) return { text: 'E · Vào nhà trưởng làng (sổ nhiệm vụ chính tuyến)', run: () => { enterRoom('hall'); journal.show('main'); speak('Welcome to my office! Here is your quest book.'); } };
  if (near(LILY_DOOR.x, LILY_DOOR.z, 1.8)) return { text: 'E · Vào nhà Lily (nhiệm vụ hằng ngày)', run: () => { enterRoom('herb'); journal.show('daily'); speak('Hello! Here are your tasks for today.'); } };
  if (near(ANNA_DOOR.x, ANNA_DOOR.z, 1.9)) return { text: 'E · Vào phòng nhạc của Anna (nghe hát, học lời)', run: () => { enterRoom('music'); music.show(); } };
  { const wi = walkers ? walkers.near(p) : -1; if (wi >= 0) return { text: 'E · Chào dân làng', run: () => { talkW = wi; ui.dialogue([{ who: 'Villager', en: walkers.greet(wi) }]); } }; }
  for (const f of friends) if ((f.region || 'village') === 'village' && near(f.npc.x, f.npc.z, 2.6)) {
    if (f.role === 'produce') return { text: `E · Quầy rau quả của ${f.who}`, run: () => ui.dialogue(f.lines.map((en) => ({ who: f.who, en })), () => shopWin.show(`${f.who}'s Fruit & Veg`, ['produce'])) };
    if (f.role === 'book') return { text: 'E · Hỏi giáo sư Finn (sổ từ vựng)', run: () => ui.dialogue(f.lines.map((en) => ({ who: f.who, en })), wordBook) };
    if (f.shop) return { text: 'E · Cửa hàng của ' + f.who + ' (Village Shop: vũ khí, máu, mana, bán hàng)', run: () => villageShop(f.shop) };      // (21/11) one shop for all
    return { text: 'E · Nói chuyện với ' + f.who, run: () => ui.dialogue(f.lines.map((en) => ({ who: f.who, en }))) };
  }
  return null;
}
function onKey(e) {
  if (!started) return;
  if (player && player.swim && !e.repeat && !ui.modal) {      // (20/11) in deep water a tap on a move key is a stroke too
    const ix = e.code === 'KeyA' || e.code === 'ArrowLeft' ? -1 : e.code === 'KeyD' || e.code === 'ArrowRight' ? 1 : 0, iz = e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space' ? 1 : e.code === 'KeyS' || e.code === 'ArrowDown' ? -1 : 0;
    if (ix || iz) { player.keyStroke(ix, iz, cam.yaw); e.preventDefault(); return; }
  }
  if (arcade && arcade.key(e.code)) { e.preventDefault(); return; }
  if (shopWin && shopWin.key(e.code)) { e.preventDefault(); return; }
  if (music && music.key(e.code)) { e.preventDefault(); return; }
  if (journal && !ui.busy && journal.key(e.code)) { e.preventDefault(); return; }
  if (room && room.walk && !(homePanel && homePanel.open) && room.key(e.code)) { e.preventDefault(); return; }      // B arrange, R turn, Esc
  if (homePanel && homePanel.key(e.code)) { e.preventDefault(); return; }
  if (dexPanel && dexPanel.key(e.code)) { e.preventDefault(); return; }
  if (creator && creator.key(e.code)) { e.preventDefault(); return; }
  if (tailor && tailor.key(e.code)) { e.preventDefault(); return; }
  if (skillUI && skillUI.open && skillUI.key(e.code)) { e.preventDefault(); return; }
  if (packUI && packUI.open && packUI.key(e.code)) { e.preventDefault(); return; }
  if (wardPanel && wardPanel.key(e.code)) { e.preventDefault(); return; }
  if (petPanel && petPanel.key(e.code)) { e.preventDefault(); return; }
  if (trPanel && trPanel.key(e.code)) { e.preventDefault(); return; }
  if (e.code === 'KeyM' && profile && trPanel && L.NAME === 'isle') { trPanel.show(); sfx('tick'); e.preventDefault(); return; }
  if (e.code === 'KeyO' && profile && worldUI) { if (worldUI.open) worldUI.hide(); else openWorldMap(); e.preventDefault(); return; }      // (24/11) world map
  if (e.code === 'KeyP' && profile && petPanel) { petPanel.show(); sfx('tick'); e.preventDefault(); return; }      // (21/11) pets from Map 1 too
  if (e.code === 'KeyU' && profile && wardPanel && seaOpen()) { wardPanel.show(); sfx('tick'); e.preventDefault(); return; }      // (20/11) the wardrobe moved from V to U: V is the bag now
  if (e.code === 'KeyV' && profile && packUI && !(mini && mini.active)) { packUI.show(); e.preventDefault(); return; }
  if (e.code === 'KeyG' && profile && dexPanel && seaOpen()) { openDex(); e.preventDefault(); return; }
  if (intro && intro.active) { if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Escape') endIntro(); e.preventDefault(); return; }
  if (e.code === 'F3') { perfOn = !perfOn; $('perf').classList.toggle('hidden', !perfOn); e.preventDefault(); return; }
  if (admin && admin.key(e.code)) { e.preventDefault(); return; }
  if (fishing && fishing.active && !ui.modal && fishing.key(e.code)) { e.preventDefault(); return; }      // (20/11) E / Space / Esc with the rod in hand
  if (ui.key(e)) { e.preventDefault(); return; }
  if (ui.modal) return;
  if (e.code === 'KeyE') { const t = interactTarget(); if (t) t.run(); }
  if (e.code === 'KeyH') quest.hint();
  if (e.code === 'KeyI' && profile) openBag();
  if (e.code === 'KeyB' && profile) wordBook();
  if (e.code === 'KeyQ' && profile) { const got = eat(profile, Save.maxHp(profile)); if (got) { sfx('correct'); ui.toast(`+${got} HP`); save(); refresh(); } }
  if (e.code === 'KeyT' && skillUI && profile) { skillUI.show(); e.preventDefault(); return; }
  { const d5 = /^Digit([5-8])$/.exec(e.code); if (d5 && profile && !(mini && mini.active)) { usePotion(Number(d5[1]) - 5); e.preventDefault(); return; } }      // (20/11) quick slots: potions and food
  { const d = /^Digit([1-4])$/.exec(e.code); if (d && spells && wild && !room && !(mini && mini.active)) { const hv = hoverPick(); if (hv) wild.setTarget(hv); spells.castSlot(Number(d[1]) - 1); e.preventDefault(); return; } }      // (21/11) pointing at a monster locks it first
  if (e.code === 'Tab' && wild && wild.root.visible && !room && !(mini && mini.active)) { const list = wild.targets().filter((m) => Math.hypot(m.x - player.pos.x, m.z - player.pos.z) < 14).sort((a, b) => Math.hypot(a.x - player.pos.x, a.z - player.pos.z) - Math.hypot(b.x - player.pos.x, b.z - player.pos.z)); if (list.length) { const i = list.indexOf(wild.target); wild.setTarget(list[(i + 1) % list.length]); } e.preventDefault(); return; }      // (21/11) Tab: next monster nearby      // (20/11) spells in the hotbar
  if (e.code === 'KeyK' && wild && !room && !(mini && mini.active)) wild.dodge();
  if ((e.code === 'KeyJ' || e.code === 'KeyF') && wild && !room && !(mini && mini.active)) wild.attack();
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
  $('loadtext').textContent = 'Đang gọi dân làng…';
  const [ngoc, tomG, samG, benG, pipG, blink, talk, joy] = await Promise.all([gltf('chr_ngoc_adventurer_v05'), gltf('npc_tom_elder_v03'), gltf('npc_sam_fisherman_v02'), gltf('npc_ben_merchant_v02'), gltf('npc_pip_spirit_v02'), faceTex('blink'), faceTex('talk'), faceTex('joy')]);
  $('loadtext').textContent = 'Đang dựng ngôi làng…';
  L.setRegion('village');
  world = await buildWorld(scene, staticModel, animatedModel);
  player = new Player(ngoc, { blink, talk, joy }); player.firstFaces = { ...player.faceMaps }; scene.add(player.root);
  player.swimBlock = (x, z, from) => L.NAME === 'village' && profile && !profile.flags.bridge_fixed && (x < L.riverX(z)) !== (from.x < L.riverX(z));      // the far bank stays closed until the bridge is mended
  player.onSwim = onSwim;
  fishing = new Fishing({ scene, player, ui, sfx, profile: () => profile, tier: () => tierOf(profile.stats.level), speak: (en) => speak(en, true, 0.85), onCatch: onFishCaught, gate: (go) => wordGate('Sam', go, 4), loadStatic: staticModel, loadAnimated: animatedModel });      // (23/11) four new words before fishing, the user's boat, rod, float and fish
  tom = new Npc(tomG, 2.6, 7.6, -0.4); sam = new Npc(samG, 14, 17, 1.2); ben = new Npc(benG, BEN_MARKET.npc[0], BEN_MARKET.npc[1], Math.PI / 2); scene.add(tom.root, sam.root, ben.root);
  pip = new Pip(pipG.scene); scene.add(pip.root);
  const usedFiles = new Set();      // two friends may share a model file (Mia uses Rose's): the second gets its own copy
  for (const f of Object.values(FRIENDS)) { let g = await gltf(f.file); if (usedFiles.has(f.file)) { const sc = SkeletonUtils.clone(g.scene); sc.traverse((o) => { if (o.isMesh) o.material = o.material.clone(); }); g = { ...g, scene: sc }; } usedFiles.add(f.file); const npc = new Npc(g, ...f.at, ngoc.animations); if (f.tint) tintBody(npc.root, f.tint); scene.add(npc.root); friends.push({ ...f, npc }); }
  tintBody(player.root, NGOC_COLORS); setHairStyle(player.root, 'short');
  shopWin = new ShopWindow({ profile: () => profile, sfx, track, onClose: leaveRoom, today: () => Review.today(), changed: () => { setSword(); setWear(); save(); refresh(); if (homes) homes.refresh(); } });
  music = new MusicRoom({ profile: () => profile, sfx, track, onClose: leaveRoom, changed: () => { save(); refresh(); } });
  { const F = L.REGIONS.forest, y = F.groundHeight(FOREST_SHOP.x, FOREST_SHOP.z); forestStall = campStall(FOREST_SHOP.x, y, FOREST_SHOP.z, Math.PI / 2 + 0.3);
    const name = label("🌿 Willow's Camp Shop", { size: 28, scale: 0.8 }); name.position.set(0, 3.2, 0); forestStall.add(name); forestStall.visible = false; scene.add(forestStall); }
  { const opt = (n) => staticModel(n).catch(() => null);
    homes = new Homes({ scene, load: staticModel, profiles: () => store.profiles, models: { garden: await opt('prop_vegetable_garden_v01'), tree: await opt('prop_tree_round_v01'), flowers: await opt('yard_flowerbed_v01'), bench: await opt('yard_bench_v01'), mailbox: await opt('yard_mailbox_v01'), garden_lamp: await opt('yard_garden_lamp_v01') } });
    await homes.build(); homes.setRegion(L.NAME);
    try { outerRing = await buildOuter(staticModel); for (const g of Object.values(outerRing)) scene.add(g); showOuter(L.NAME); } catch (e) { console.warn('outer ring', e); }      // (24/11) cottages and plants round the edge of the harbour and forest
    homePanel = new HomePanel({ onClose: leaveRoom, rebuild: (o) => { goHome(o, homePanel.mine, true, homePanel.admin); if (homes) homes.refresh(true); }, setEditing: (on) => room && room.walk && room.setEditing(on), profile: () => profile, today: () => Review.today(), changed: () => { save(); refresh(); }, sfx, track }); }
  journal = new Journal({ profile: () => profile, today: () => Review.today(), onClose: leaveRoom,
    store: () => store, claimShip: () => { const r = Family.claim(store, profile); if (r) { sfx('fanfare'); save(); refresh(); ui.toast(`⚓ Thưởng tàu gia đình: +${r.gold} vàng`); } },
    claimMain: (id) => claimReward(Q.claimMain(profile, id), 'Nhiệm vụ chính'), claimDaily: (id) => claimReward(Q.claimDaily(profile, Review.today(), id), 'Nhiệm vụ ngày') });
  Save.hooks.skill = (p, ok) => { if (ok && p === profile) track('right'); };
  dexPanel = new DexPanel({ profile: () => profile, onClose: () => {} });
  wardPanel = new WardrobePanel({ profile: () => profile, changed: () => { applyLook(); save(); refresh(); }, mirror: () => creator.show('mirror').then(() => { save(); refresh(); }) });
  creator = new Creator({ profile: () => profile, apply: () => applyLook(), focus: creatorCamera, sfx });
  tailor = new Tailor({ profile: () => profile, apply: () => applyLook(), focus: creatorCamera, sfx, changed: () => { save(); refresh(); } });
  trPanel = new TreasurePanel({ profile: () => profile, map: () => treasureMap(), speak: (t) => speak(t, true, 0.85) });
  petObj = new Pet(scene, animatedModel);
  petPanel = new PetPanel({ profile: () => profile, today: () => Review.today(), speak: (t) => speak(t, true, 0.85), sfx, playTrick: (id) => petObj.play(id), adopted: () => { syncPet(); petObj.snap(player.pos.x, player.pos.z); },
    cared: () => track('pet'), changed: () => { save(); refresh(); } });
  worldUI = new WorldUI({ profile: () => profile, here: () => L.NAME, go: travelTo, sfx });
  toolbar = new Toolbar([
    { id: 'world', icon: '🌍', tip: 'Bản đồ thế giới (O)', show: () => !!profile, click: () => openWorldMap() },
    { id: 'dex', icon: '🐠', tip: 'Album biển (G)', show: seaOpen, click: () => { if (profile) openDex(); } },
    { id: 'map', icon: '🗺️', tip: 'Bản đồ kho báu (M)', show: () => L.NAME === 'isle', click: () => { if (profile) { trPanel.show(); sfx('tick'); } } },
    { id: 'pet', icon: '🐾', tip: 'Thú cưng (P)', show: () => !!profile, click: () => { if (profile) { petPanel.show(); sfx('tick'); } } },
    { id: 'ward', icon: '👗', tip: 'Tủ đồ (V)', show: seaOpen, badge: (p) => 0, click: () => { if (profile) { wardPanel.show(); sfx('tick'); } } },
  ]);
  walkers = new Walkers(scene, (name) => loader.loadAsync(`./assets/models/${name}.glb`)); await walkers.init();      // villagers on the roads
  for (const a of [player, tom, sam, ben, ...friends.map((f) => f.npc)]) addOutline(a.root);     // cartoon outlines (medium/high)
  applyLook();
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
    const mul = TIER_PAY[res.tier || 1];      // higher tiers pay more
    const r = pay(profile, res.id, Review.today(), Math.round(res.gold * mul), Math.round(res.exp * mul));
    profile.stats.gold += r.gold; Save.addExp(profile, r.exp); sfx('fanfare'); save(); refresh();
    track('mini'); if (['style', 'cafe', 'salon'].includes(res.id)) track('sea_game'); if (res.fish) catchFish(res.fish); if (res.unlock && res.unlock.length) gainItems(res.unlock); for (const c of res.words || []) (profile.seen || (profile.seen = {}))[c.id] = Review.today();      // words met inside the game count as seen
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
        chests.opened(c); track('chest'); if (L.NAME === 'harbor') track('sea_chest'); profile.stats.gold += res.gold; Save.addExp(profile, res.exp); sfx('fanfare'); save(); refresh();
        ui.dialogue([{ who: 'Ngọc', en: `${res.text} (+${res.gold} gold, +${res.exp} EXP)`, vi: `${card.word} = ${card.vi}` }]);
      };
      teach([card], () => arcade.start(g));
    } });
  floaters = new Floaters(scene);
  wild = new Wild({ scene, player, ui, sfx, profile: () => profile, save, gainItems, owns: (c) => WR.wardrobe(profile).owned.includes(WR.itemId(c.kind, c.color)), onChange: refresh, floater: (x, z, t, c, k) => floaters.add(x, z, t, c, k), goldMul: petGoldMul, onKill: (m) => { track('kill'); if (m && m.region === 'harbor') track('sea_kill'); if (m && m.region === 'harbor') seaFound(m.kind); }, onJob: (region) => { if (region === 'harbor') track('sea_job'); },
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
  wild.addMap1(map1Model).catch((e) => console.warn('map 1 monsters', e));
  spells = new Spells({ scene, wild, player, camera, canvas, profile: () => profile, sfx, ui, onChange: () => {} });      // (20/11) magic skills: keys 1-4, the skill book T
  packUI = new PackUI({ profile: () => profile, sfx, toast: (t) => ui.toast(t), changed: () => { save(); refresh(); }, hpMax: () => Save.maxHp(profile), focus: creatorCamera, look: () => { setSword(); setWear(); }, swing: () => player.swing() });      // (21/11) the hero stands beside the bag and shows each piece
  skillUI = new SkillUI({ profile: () => profile, spells, sfx, usePotion, toast: (t) => ui.toast(t), atk: () => playerAtk(profile), changed: () => { save(); refresh(); } });      // the Blender monsters replace the shapes a moment after the game starts (not awaited: a slow download must not hold the boot)
  mini = new MiniGames({ scene, player, ui, sfx, track, profile: () => profile, save, onNote: refresh, board: (id) => { const t = tierOf(profile.stats.level), go = async () => { let g; if (id.startsWith('race2')) { try { raceAssets = raceAssets || await loadRaceAssets(gltf); g = raceGame3d({ assets: raceAssets, cards: unitCards, tier: t, variant: id === 'race2h' ? 'harbor' : id === 'race2f' ? 'forest' : 'village' }); } catch (e) { console.warn('race3d: ' + e.message); g = raceGame(Math.random, [], t); } } else g = ({ candy: () => candyGame(Math.random, t), blocks: () => blocksGame(Math.random, unitCards, t), sling: () => slingGame(Math.random, t) })[id](); arcade.start(withTier(g, t)); }; if (id === 'candy' || id.startsWith('race2') || id === 'blocks') wordGate(id === 'candy' ? 'Mimi' : id === 'blocks' ? 'Max' : id === 'race2h' ? 'Marina' : id === 'race2f' ? 'Rowan' : 'Leo', go); else go(); } });
  await mini.addHosts((name) => loader.loadAsync(`./assets/models/${name}.glb`));      // a host by each mini game
  admin = new AdminPanel({ profile: () => profile, profiles: () => store.profiles, visitHome: (o) => goHome(o, true, false, true), deleteProfile: adminDelete, places: adminPlaces, go: adminGo, unlockAll: adminUnlock, setStep: adminStep,
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
  const frozen = ui.modal || !started || (arcade && arcade.open) || (shopWin && shopWin.open) || (packUI && packUI.open) || (fishing && fishing.active) || (music && music.open) || (journal && journal.open) || (homePanel && homePanel.open) || room || (dexPanel && dexPanel.open) || (wardPanel && wardPanel.open) || (creator && creator.open) || (tailor && tailor.open) || (skillUI && skillUI.open) || (petPanel && petPanel.open) || (trPanel && trPanel.open);
  if (arcade) arcade.update(real, keys);
  if (touch) touch.update();
  releaseSoftKeys();
  const input = { x: (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0), z: (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0), run: keys.has('ShiftLeft') || keys.has('ShiftRight'), jump: keys.has('Space') };
  const rawInput = { x: input.x, z: input.z, run: input.run };      // (21/11) the house walker reads the keys while the village hero is frozen
  if (frozen) { input.x = input.z = 0; input.jump = false; }
  const hadRoute = !!player.route;
  // slow machines: several fixed physics steps per frame so the game never runs in slow motion
  if (intro && intro.active) introStep(real);
  else for (let left = real; left > 1e-4; left -= 0.05) player.update(Math.min(0.05, left), input, cam.yaw, frozen, sfx);
  if (hadRoute && !player.route) minimap.clearRoute();
  if (walkMark && walkMark.visible) { walkMark.userData.t += real; walkMark.scale.setScalar(1 + Math.sin(walkMark.userData.t * 6) * 0.15); if (!player.route) walkMark.visible = false; }
  cam.update(real, player.pos); guideArrow(real); swimHud(); if (fishing) fishing.update(real, performance.now() / 1000);
  const talkingTo = ui.busy && ui.pages ? ui.pages[0].who : '';
  tom.update(dt, player.pos, talkingTo === 'Tom'); sam.update(dt, player.pos, talkingTo === 'Sam'); ben.update(dt, player.pos, talkingTo === 'Ben');
  for (const f of friends) f.npc.update(dt, player.pos, talkingTo === f.who);
  if (walkers && started) walkers.update(real, player.pos, ui.busy ? talkW : -1);
  if (pip.root.visible) pip.update(dt, t, player, started && L.NAME === 'forest' && quest && quest.step !== 'intro');
  if (floaters) floaters.update(real); if (spells) spells.update(real);
  if (profile && !profile.admin) SK.regen(profile, real, !(wild && wild.fighting));      // (21/11) faster out of a fight
  if (skillUI) skillUI.sync(started && !switching && !room && !frozen && !(mini && mini.active) && !(intro && intro.active));
  if (portalGroup) for (const m of portalGroup.children) m.userData.update(t);
  crystals.update(t); if (world) world.update(t); if (homeDoor && homeDoor.visible) homeDoor.userData.star.rotation.y = t * 1.6;
  if (mini && started && !switching && !ui.modal && !arcade.open) mini.update(real, player.pos);      // real time, so timers stay honest on slow machines
  if (chests && started) chests.update(real);
  if (petObj && started && !switching) petObj.update(real, player.pos, player.yaw);
  if (homes && started && !switching) homes.update(real);      // (21/11) hens, the pig, ripe crops
  for (const mx of digMixers) mx.update(real);
  if (spots && started) spots.update(real);
  if (started && !switching) {      // (21/11) background music: the region's tune, the home tune indoors, the boss tune near an awake boss
    const boss = wild && wild.root.visible && wild.bosses.some((b) => b.g.visible && !b.dead && b.region === L.NAME && Math.hypot(b.x - player.pos.x, b.z - player.pos.z) < 16);
    playMusic(room ? (room.kind === 'home' ? 'home' : room.kind === 'music' ? null : L.NAME === 'forest' ? 'forest' : 'village') : boss ? 'boss' : ({ village: 'village', forest: 'forest', harbor: 'harbor', isle: 'isle' })[L.NAME] || 'village');
  }
  if (wild && started && !switching && wild.root.visible) { hoverTick = (hoverTick || 0) + real; if (hoverTick > 0.1) { hoverTick = 0; hoverPick(); } if (!frozen && !(player && player.swim) && !(input.x || input.z)) wild.autoHit(); }      // (21/11) hover ring; auto attack the locked target in reach
  if (wild && started && !switching) wild.update(real, !!ui.modal || arcade.open || !!(mini && mini.active) || !!(fishing && fishing.active));      // (21/11) no monster bites during a mini game
  if (marks3d) marks3d.update(real);
  for (const sp of markPool) if (sp.visible) {      // bob, pulse and glow so the eye finds them (feedback 17/11)
    const k = 0.5 + 0.5 * Math.sin(t * 5 + sp.position.x), h = sp.userData.halo;
    sp.position.y = sp.userData.y + Math.sin(t * 3 + sp.position.x) * 0.06; sp.scale.setScalar(0.3 + 0.05 * k);      // (21/11) a third of the old size
    h.position.copy(sp.position); h.material.opacity = 0.35 + 0.65 * k; h.scale.setScalar(0.5 + 0.2 * k);
  }
  if (letterProp.visible) { letterProp.rotation.y = t * 1.5; letterProp.position.y += Math.sin(t * 2.2) * 0.002; }
  { // shadows follow Ngọc in whole shadow-map texels, so their edges do not crawl and shimmer as she walks
    const c = sun.shadow.camera, step = (c.right - c.left) / sun.shadow.mapSize.x, snap = (v) => Math.round(v / step) * step;
    shadowAt.set(snap(player.pos.x), player.pos.y, snap(player.pos.z)); sun.position.copy(shadowAt).addScaledVector(sunDir, 90); sun.target.position.copy(shadowAt); }
  sky.position.copy(camera.position); dayNight.update(real);
  if (started && !switching) {
    const it = ui.modal || room ? null : interactTarget(); ui.prompt(it ? it.text : '');
    mapT += real; const markers = [];
    if (mapT >= 0.08) { mapT = 0;            // minimap and markers 12 times a second, not every frame
    if (L.NAME === 'harbor') {
      const left = (id) => ((profile.plays && profile.plays.day === Review.today() && profile.plays.n[id]) || 0) < 3;      // a glowing "!" while today's full-pay plays remain
      if (left('style')) markers.push({ x: HARBOR.boutique.door[0] + 1, z: HARBOR.boutique.door[1], text: '!', host: true });
      if (left('cafe')) markers.push({ x: HARBOR.cafe.door[0] + 1, z: HARBOR.cafe.door[1], text: '!', host: true });
      if (left('salon')) markers.push({ x: HARBOR.salon.door[0], z: HARBOR.salon.door[1] + 1, text: '!', host: true });
      markers.push({ x: sam.x, z: sam.z, text: '!', host: true });
      markers.push(...mini.markers(), ...wild.markers(), ...chests.markers(), ...spots.markers());
      for (const st of STARTS) if (st.host && st.region === 'harbor') { const n = (profile.plays && profile.plays.day === Review.today() && profile.plays.n[st.id]) || 0; if (n < 3) markers.push({ x: st.x - 0.6, z: st.z + 0.4, text: '!', host: true }); }
    } else if (L.NAME === 'isle') {
      // Treasure Isle has no markers: the map is read on its card (M) and the place names stand on small signs
    } else if (L.NAME === 'forest') {
      if (quest.step === 'intro') markers.push({ x: tom.x, z: tom.z, text: '!' });
      if (quest.step === 'tree') { const s = landmark('tree').spot; markers.push({ x: s[0], z: s[1], text: '★' }); }
      if (quest.step === 'seek' && quest.q.hint >= 3) { const s = landmark(quest.targetId).spot; markers.push({ x: s[0], z: s[1], text: '★' }); }
      markers.push(...mini.markers(), ...wild.markers(), ...chests.markers(), ...spots.markers());
      for (const st of STARTS) if (st.host && st.region === 'forest') { const n = (profile.plays && profile.plays.day === Review.today() && profile.plays.n[st.id]) || 0; if (n < 3) markers.push({ x: st.x - 0.6, z: st.z + 0.4, text: '!', host: true }); }
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
      if (story.market && Math.hypot(player.pos.x - BEN_MARKET.centre[0], player.pos.z - BEN_MARKET.centre[1]) > 15) story.leaveMarket();
      if (!story.market) markers.push(...mini.markers());
      for (const st of STARTS) if (st.host && (st.region || 'village') === L.NAME) {      // a glowing "!" over each mini game host while today's full-pay plays remain (18/11)
        const n = (profile.plays && profile.plays.day === Review.today() && profile.plays.n[st.id]) || 0;
        if (n < 3) markers.push({ x: st.x - 0.6, z: st.z + 0.4, text: '!', host: true });
      }
      markers.push(...wild.markers(), ...chests.markers(), ...spots.markers());
      if (Save.gateWaiting(profile)) markers.push({ x: OWL.x, z: OWL.z, text: '🦉', color: '#ffe28a' });
    }
    minimap.draw(player.pos, player.yaw, markers); questMarks(markers); guideGoal = pickGoal(markers); if (homes) homes.refresh(); }
    autosave += dt; if (autosave > 20) { autosave = 0; save(); }
  }
  renderer.info.reset();
  if (room) { room.update(real, camera.aspect, room.walk ? { input: homePanel && homePanel.open || ui.modal ? {} : rawInput, yaw: cam.yaw - (room.yaw0 || 0), pitch: cam.pitch, dist: cam.dist, mouse: hoverNdc() } : undefined); post.setSun(room.camera, sunDir); post.render(room.scene, room.camera); }
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

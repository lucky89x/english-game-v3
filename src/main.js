// English Quest (web) — boot, render loop, quality presets, perf panel and the debug API for tests.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import * as L from './core/layout.js';
import * as Save from './core/save.js';
import * as Review from './core/review.js';
import { loadGrade } from './core/catalog.js';
import { grammarFor, GRAMMAR_GATES, noteFor } from './core/grammar.js';
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
import { plantDetail, plantCull } from './world/plants.js';
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
import { tintHero } from './game/herotint.js';
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
import { tierOf } from './core/tiers.js';
import { gameFee, levelCap, LEARN, learnExp, WORD_EVERY } from './core/progress.js';
import { fireflies } from './ui/lantern/fireflies.js';
import { vault } from './ui/lantern/vault.js';
import { courier } from './ui/lantern/courier.js';
import { workshop } from './ui/lantern/workshop.js';
import { Chests, CHEST_SPOTS, FOREST_CHESTS, HARBOR_CHESTS } from './game/chests.js';
import { armorMesh, charmMesh, GEAR_FILE } from './game/gear.js';
import { Walkers } from './game/walkers.js';
import { ShopWindow } from './ui/shop.js';
import { ITEMS, bag, wear, buy, eat, shopList, map2Ready, map3Ready, playerAtk, useQuick, MONSTERS } from './core/rules.js';
import * as HomePlay from './core/homeplay.js';
import * as Guests from './core/guests.js';
import * as Buddies from './core/buddies.js';
import * as LandGames from './core/landgames.js';
import { bazaarGame, slideGame, mineGame, runeGame, balloonGame, robotGame } from './ui/landgames.js';
import { Crowd, stepTo, faceTo, spotNear } from './game/crowd.js';
import * as CrowdRules from './core/crowd.js';
import { Peers } from './game/peers.js';
import { Online } from './net/online.js';
import { OnlinePanel } from './ui/online.js';
import { animCode } from './core/net.js';
import { NotesPanel } from './ui/notes.js';
import { SHOW_FILE } from './core/house.js';
import { ZONES } from './core/zones.js';
import { PackUI } from './ui/pack.js';
import { Fishing } from './game/fishing.js';
import { house as houseOf, setPlace } from './core/house.js';
import * as Farm from './core/farm.js';
import { payNote } from './game/minigames.js';
import { SAM_LINES, BRIDGE, BRIDGE_SPOTS, FRIENDS, OPENING, LAND_TALK } from './game/content.js';
import { LAND, LAND_IDS, isLand } from './core/regions/lands.js';
import { UI } from './ui/ui.js';
import { Post } from './render/post.js';
import { addOutline, showOutlines, syncOutlines } from './render/outline.js';
import { Minimap } from './ui/minimap.js';
import { initTouch, touchWanted } from './ui/touch.js';
import { sfx, setSound, soundOn, unlock, setMusic, musicOn, playMusic } from './audio.js';
import { voiceOn, setVoice, speak, paceOf, nextPace } from './ui/speech.js';
import { ReadAloud, disable as voiceDisable } from './ui/voice.js';
import { relaxArms, thicken, isPerson } from './game/relax.js';
import { QuestMarks } from './game/marks.js';
import { keyCode } from './core/keys.js';
import { WordSpots } from './game/wordspots.js';

const $ = (id) => document.getElementById(id);
const QUALITY = {
  low: { label: 'Thấp', ratio: 0.6, plants: 0.2, plantFar: 40, shadow: 0, shadowDist: 0, density: 0.22, particles: false, far: false, post: false, samples: 0 },
  medium: { label: 'Vừa', ratio: 1.0, plants: 0.55, plantFar: 65, shadow: 2048, shadowDist: 55, density: 0.6, particles: true, far: true, post: true, samples: 2 },
  high: { label: 'Cao', ratio: 1.5, plants: 1, plantFar: 100, shadow: 4096, shadowDist: 85, density: 1.0, particles: true, far: true, post: true, samples: 4 },
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
{ const rawLoad = loader.loadAsync.bind(loader); loader.loadAsync = async (...a) => { const g = await rawLoad(...a); try { relaxArms(g); if (isPerson(g) && !/chr_(hero|girl)/.test(String(a[0]))) thicken(g); } catch (e) { /* the model keeps its pose */ } return g; }; }      // (24/11) relaxed arms for every person model (src/game/relax.js)
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
const gltf = (name) => { if (!modelCache.has(name)) modelCache.set(name, loader.loadAsync(`./assets/models/${name}.glb`).then(prepModel).catch((e) => { modelCache.delete(name); throw e; })); return modelCache.get(name); };      // (26/11) a failed load is not remembered: the next try loads again
/** Map 2 monsters (crab, jellyfish, pirate, Captain Octopus): fetched when the hero first sails to the harbor. */
const SEA_FILES = { crab: 'harbor_mob_crab_v01', jelly: 'harbor_mob_jellyfish_v01', pirate: 'harbor_mob_pirate_v01', octopus: 'harbor_boss_octopus_v02', gull: 'mob_gull_storm_v01' };
const seaModel = (k) => gltf(SEA_FILES[k]).catch(() => null);
// (26/11) maps 4-7: the monsters and bosses of each land, fetched the first time the hero walks in (combat.addLand)
const LAND_FILES = { spark: 'mob_cactus_spark_v01', scorpion: 'mob_scorpion_sand_v01', tcactus: 'mob_cactus_thunder_v01', djinn: 'mob_djinn_dust_v01', dino: 'mob_dino_fire_v01', sanddragon: 'boss_sand_dragon_v01',
  icebunny: 'mob_bunny_ice_v01', seal: 'mob_seal_frost_v01', frog: 'mob_frog_wind_v01', yeti: 'mob_yeti_ice_v01', icegolem: 'mob_golem_ice', icedragon: 'mob_dragon_ice',
  ghost: 'mob_ghost_thunder_v01', moonfox: 'mob_fox_moon_v01', wraith: 'mob_hush_wraith_v01', whirl: 'mob_whirl_wind_v01', turtle: 'mob_ancient_sea_turtle', giant: 'ev_boss_giant_v01',
  skybird: 'mob_bird_wind_v01', squid: 'mob_squid_ice_v01', sundragon: 'boss_dragon_fire_v01',
  // (26/11, turn 63) maps 8-12: models the game already has (in another colour, see `tint` in rules.js) and the robots of the Future City
  wisp: 'mob_wisp_thunder_v01', flower: 'mob_carnivorous_flower', shroomg: 'mob_mushroom_giant', treant: 'mob_treant_elder', magma: 'mob_magma_crystal', emberfox: 'mob_fox_ember_v01', bat: 'mob_dark_bat', lavagolem: 'mob_golem_lava', wslime: 'mob_water_slime',
  queen: 'boss_mushroom_queen_v02', ancient: 'boss_golem_ancient_v02', hush: 'npc_hush_lord_v01', drone: 'mob_robot_drone_v01', wheelbot: 'mob_robot_wheel_v01', boxbot: 'mob_robot_box_v01', guardbot: 'mob_robot_guard_v01', warden: 'boss_iron_warden_v01' };
const landModel = (k) => gltf(LAND_FILES[k]).catch(() => null);
/** Map 1 monsters and bosses (batch 13): swapped in by the Wild after the game has started. */
// (24/11) the user's new monsters replace the old models kind by kind: wolf, magma crystal, boar, water slime, stone golem, dark bat, venom mushroom, carnivorous flower
const MAP1_FILES = { goblin: 'mob_shadow_wolf', imp: 'mob_magma_crystal', orc: 'mob_treant_elder', slime: 'mob_water_slime', red: 'mob_slime_red_v01', golem: 'mob_golem_lava', bat: 'mob_dark_bat', shroom: 'mob_mushroom_giant', king: 'boss_slime_king_v02', ancient: 'boss_golem_ancient_v02', queen: 'boss_mushroom_queen_v02', bunny: 'mob_carnivorous_flower', wisp: 'mob_wisp_thunder_v01', fox: 'mob_fox_ember_v01' };
const map1Model = (k) => gltf(MAP1_FILES[k]).catch(() => null);
const staticModel = async (name) => (await gltf(name)).scene.clone(true);
const animatedModel = async (name) => { const g = await gltf(name); return { scene: SkeletonUtils.clone(g.scene), animations: g.animations }; };
/** (26/11) A copy of a model with its own materials (so it can be tinted) that SHARES the mesh data and the pictures with every other copy.
 *  The villagers and the game hosts used to download and decode their 2048-pixel pictures twelve times over. */
const ownLook = async (name) => { const g = await animatedModel(name); g.scene.traverse((o) => { if (o.isMesh && o.material) o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone(); }); return g; };
const faceTex = async (name) => { const t = await texLoader.loadAsync(`./assets/tex/ngoc_face_${name}.png`); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; return t; };

const ui = new UI(), store = Save.load();
if (Save.loadInfo.recovered || Save.loadInfo.lost) setTimeout(() => ui.toast(Save.loadInfo.lost ? '⚠ Không đọc được bản lưu cũ (đã cất riêng, chưa xoá). Báo bố mẹ trước khi tạo người chơi mới!' : '⚠ Bản lưu bị lỗi: đã khôi phục từ bản sao gần nhất.'), 1500);
let profile = null, quest = null, story = null, world = null, player = null, cam = null, tom = null, sam = null, ben = null, pip = null, crystals = null, minimap = null, letterProp = null, itemProps = {}, friends = [], mini = null, wild = null, arcade = null, chests = null, spots = null, unitCards = [], cardOfFn = () => null;
let shopWin = null, walkers = null, talkW = -1, touch = null, quality = localStorage.getItem('eq-quality') || 'medium', perfOn = false, started = false, switching = false, wordIds = {}, jarKey = '';
const keys = new Set();
let raceAssets = null;
const game = { friendsStay: false, errors, voiceDisable, get reader() { return reader; }, SK, games: { raceGame, raceGame3d, slingGame, candyGame }, goHome: (o, mine) => goHome(o || profile, mine !== false), get room() { return room; }, get homes() { return homes; }, get buddies() { return buddies; }, get crowd() { return crowd; }, get notes() { return notesUI; }, get online() { return online; }, get peers() { return peers; }, get onlineUI() { return onlineUI; }, Farm, get trail() { return guide && guide.trail; }, get tom() { return tom; }, get fishing() { return fishing; }, get profile() { return profile; }, get quest() { return quest; }, get story() { return story; }, get player() { return player; }, get cam() { return cam; }, get minimap() { return minimap; }, ui, L, stats: { fps: 0, ms: 0, calls: 0, tris: 0 },
  teleport(x, z) { player.place(x, z); cam.target.set(x, player.pos.y + 1.25, z); }, applyLook, syncPet, get dayNight() { return dayNight; }, get digs() { return digMeshes; }, catchFish, gainItems, cardsOfUnit: (n) => cardsOfUnit(n), get pet() { return petObj; }, get petPanel() { return petPanel; },  setQuality, key: (code) => onKey({ code, preventDefault() {} }), get started() { return started && !switching; }, get worldUI() { return worldUI; }, openPortal, travelTo, get portals() { return portalGroup; }, get region() { return L.NAME; }, chooseProfile, enterRegion, MARKET_JARS, BRIDGE_SPOTS, get mini() { return mini; }, get wild() { return wild; }, get scene() { return scene; }, openShop, get sword() { return swordMesh; }, get armor() { return armorShown; }, setWear, openBag: () => openBag(), get arcade() { return arcade; }, get chests() { return chests; }, get spots() { return spots; }, get admin() { return admin; }, get friends() { return friends; }, get walkers() { return walkers; }, get shopWin() { return shopWin; }, get music() { return music; }, get journal() { return journal; }, get spells() { return spells; }, get floaters() { return floaters; }, get skillUI() { return skillUI; }, get intro() { return intro; }, cardOf: (id) => cardOfFn(id), pause: (on) => renderer.setAnimationLoop(on ? null : frame), renderNow: () => { post.setSun(camera, sunDir); post.render(scene, camera); },      // tests: stop drawing while another page is checked
  post, refresh: () => refresh(), refreshGear: () => { setSword(); setWear(); } };
if (navigator.webdriver || /[?&]debug=1/.test(location.search)) globalThis.__eq = game;      // (26/11) the test hook is not in the children's game (a console line gave gold)

// Dynamic resolution (18/11: "high graphics without stutter"): all the effects stay on, only the number of pixels
// drawn follows the machine. A slow half-second lowers the render scale a step (at most every 2 s, down to 60%);
// steady fast frames raise it again (every 5 s). Changing it reallocates the effect buffers, so steps are rare.
const MIN_SCALE = 0.8;      // (24/11) never below 80%: lower looked blurry on the finely painted characters
let baseRatio = 1, renderScale = 1, drsT = 0;
function adaptResolution(stats, dt) {
  drsT += dt; if (quality === 'low' || !started || switching || document.hidden) return;
  const want = stats.ms > 22 ? -0.05 : stats.ms < 12.5 && stats.worst < 25 ? 0.05 : 0;
  if (!want || (want < 0 && drsT < 2) || (want > 0 && drsT < 5)) return;
  const next = Math.min(1, Math.max(MIN_SCALE, renderScale + want));
  if (Math.abs(next - renderScale) < 0.01) return;      // (26/11) this line had been swallowed by a comment: the canvas was resized every 2 s for nothing
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
  plantDetail(q.plants);
  resize(); renderGear();
}
let gearOpen = false;
/** Settings: a small ⚙ button in the corner; the panel opens only when a grown-up clicks it (feedback 17/11). */
/** (26/11) The keys, in the game itself (they were only in the README): shown once to a new player and from the gear panel. */
function showKeys(first) {
  ui.dialogue([
    ...(first ? [{ who: 'Pip', en: 'Hi! Let me show you how to move and fight.', vi: 'Xin chào! Mình chỉ cho bạn cách đi và đánh nhé. (Xem lại lúc nào cũng được: ⚙ → ⌨ Phím)' }] : []),
    { who: '⌨ Move · Đi lại', en: 'W A S D to walk. Hold Shift to run. Space to jump.', vi: 'W A S D: đi · giữ Shift: chạy · Space: nhảy. Giữ chuột kéo để xoay góc nhìn, lăn chuột để phóng to. Bấm vào bản đồ nhỏ để tự đi tới đó.' },
    { who: '⌨ Talk · Nói chuyện', en: 'Press E to talk, open and pick up. Follow the gold arrow!', vi: 'E: nói chuyện, mở, nhặt, lật trang. Mũi tên vàng chỉ việc cần làm tiếp. N: sổ nhiệm vụ · O: bản đồ thế giới.' },
    { who: '⌨ Fight · Đánh quái', en: 'Click a monster or press J to hit. K to roll away. 1 2 3 4 for magic.', vi: 'Bấm chuột vào quái hoặc phím J: đánh · K: lăn né · Tab: đổi mục tiêu · 1-4: phép (T: sách phép) · Q: ăn bánh hồi máu · 5-8: bình thuốc.' },
    { who: '⌨ Bag · Túi đồ', en: 'V opens your bag. B opens your word book.', vi: 'V: túi đồ (mặc giáp, cầm kiếm) · U: tủ quần áo · B: sổ từ · P: thú cưng · Esc: đóng bảng · F11: toàn màn hình.' },
  ]);
}
function renderGear() {
  const g = $('gear'); if (!profile) return; g.classList.remove('hidden');
  if (!gearOpen) { g.className = 'card closed'; g.innerHTML = '<button id="gopen" title="Cài đặt">⚙</button>'; $('gopen').onclick = () => { gearOpen = true; renderGear(); }; return; }
  g.className = 'card';
  const un = profile && gradeUnits[Save.unitOf(profile) - 1];      // (21/11) each map teaches one Global Success unit
  g.innerHTML = `<b style="flex-basis:100%">Cài đặt <button id="gclose" style="float:right">✕</button></b>${un ? `<span style="flex-basis:100%;font-size:13px">📘 Đang học: Global Success ${profile.grade} · Unit ${Save.unitOf(profile)} — ${un.title} (Map ${Save.unitOf(profile)} ↔ Unit ${Save.unitOf(profile)})</span>` : ''}
    Đồ họa: <select id="gq">${Object.entries(QUALITY).map(([k, v]) => `<option value="${k}" ${k === quality ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
    <button id="gs">Âm thanh: ${soundOn() ? 'bật' : 'tắt'}</button><button id="gv" title="Đọc to lời thoại tiếng Anh">Đọc to: ${voiceOn() ? 'bật' : 'tắt'}</button><button id="gp" title="Tốc độ giọng đọc tiếng Anh">Giọng đọc: ${paceOf().vi}</button><button id="gm" title="Nhạc nền nhẹ">Nhạc nền: ${musicOn() ? 'bật' : 'tắt'}</button><button id="gb" title="Xem lại các từ đã gặp (phím B)">📖 Sổ từ</button>
    <button id="gk" title="Các phím điều khiển">⌨ Phím</button><button id="ge">Xuất hồ sơ</button><button id="gsw">Đổi người chơi</button><span style="color:#9a8060">F3: hiệu năng</span>`;
  const done = (e) => { if (e && e.target) e.target.blur(); };          // a focused list would eat W/S and the arrows
  $('gclose').onclick = () => { gearOpen = false; renderGear(); };
  $('gk').onclick = () => { gearOpen = false; renderGear(); showKeys(); };
  $('gq').onchange = (e) => { done(e); localStorage.setItem('eq-quality-manual', '1'); setQuality(e.target.value); };
  $('gs').onclick = () => { setSound(!soundOn()); renderGear(); };
  $('gp').onclick = () => { const k = nextPace(); renderGear(); speak('Hello! This is how fast I read.', true); ui.toast('Tốc độ đọc: ' + k.vi); };
  $('gm').onclick = () => { setMusic(!musicOn()); renderGear(); };
  $('gv').onclick = () => { setVoice(!voiceOn()); renderGear(); };
  $('gb').onclick = () => { gearOpen = false; renderGear(); wordBook(); };
  $('ge').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([Save.exportProfile(profile)], { type: 'application/json' })); a.download = `english-quest-${profile.name}.json`; a.click(); };
  $('gsw').onclick = () => { gearOpen = false; save(); ui.showMenu(store, chooseProfile); renderGear(); };      // (24/11) was a second id="gp": the button did nothing and the pace button switched player
}
let saveWarned = false;
function save() { if (!profile) return; store.last = profile.id; profile.region = L.NAME; try { Save.persist(store); saveWarned = false; } catch (e) { console.warn('save failed', e); if (!saveWarned) { saveWarned = true; ui.toast('⚠ Chưa lưu được tiến độ (bộ nhớ trình duyệt đầy hoặc bị chặn). Báo bố mẹ nhé!'); } } }
addEventListener('beforeunload', () => { if (started && !(tailor && tailor.open)) save(); });

const NOTES = {      // short English objectives for the village chain
  arrive: 'Talk to Tom in the village square. (E)', letter_find: "Find Tom's letter near the door of his hall. ✉", letter_return: 'Take the letter back to Tom.',
  jars: "Help Ben at the market.", jars_play: "Help Ben at the market.", tom_bridge: 'Tom wants to see you at the square.',
  bridge: 'Meet Sam at the broken south bridge.', plan: 'Listen to Pip and put the steps in order.', open: 'Tom wants to see you at the square.', done: '',
};
/** (26/11) The next land (after the desert) the hero has just earned and has not been told about yet. */
function pendingLand() { if (!profile || profile.admin) return null; for (const l of LAND_IDS) if (l !== 'desert' && !profile.flags['open_' + l] && WORLD.canGo(profile, LAND[l].from, l).ok) return l; return null; }
/** (26/11) The goal card after the opening story: the current main quest in English with the Vietnamese "where / what" under it. */
function questNote() { const mq = Q.mainCurrent(profile); return mq ? { en: `Quest: ${mq.en}  (N)`, vi: mq.vi } : null; }
let shownLevel = 0, holdAnnounce = false;
function refresh() {
  if (!profile) return;
  const gate = Save.gateWaiting(profile); if (gate && profile.toldGate !== gate) { profile.toldGate = gate; ui.toast('Gặp Cú Mèo để lên cấp!'); }
  if (shownLevel && profile.stats.level > shownLevel) { profile.stats.hp = Save.maxHp(profile); ui.toast(`LEVEL UP!  Lv ${profile.stats.level} · +1 điểm kỹ năng (phím T)`); sfx('fanfare'); }
  shownLevel = profile.stats.level;
  if (map2Ready(profile) && !profile.flags.map2 && !ui.busy && !holdAnnounce) {      // (24/11) never over another talk (the king's farewell and the Compass piece come first); frame() asks again when it is closed.  Slime King beaten, level 5 reached and the owl's review passed -> the sea (Map 2, Unit 2 words)
    profile.flags.map2 = true; save(); sfx('fanfare');
    ui.dialogue([{ who: 'Tom', en: 'You have grown so strong! A boat is waiting at the dock to take you to Sunny Harbor.', vi: 'Đã mở Biển cả · Cảng Mặt Trời (cấp 5–10): đi qua cổng dịch chuyển ở phía Tây Bắc làng, hoặc ra bến thuyền bên sông. Ở cảng con học từ mới của bài tiếp theo.' }, { who: '🥈 Word Keeper badge', en: 'Rank up: Explorer Word Keeper!', vi: 'Lên hạng Thám hiểm: mạnh hơn (+4 công, +30 máu).' }], () => reloadUnit());
  }
  if (map3Ready(profile) && !profile.flags.map3 && !ui.busy && !holdAnnounce) {      // (24/11) same: wait for the Golem's farewell.  the Ancient Golem is beaten and the level-20 exam passed: the forest is finished (the next map, the desert, is still being built)
    profile.flags.map3 = true; save(); sfx('fanfare');
    ui.dialogue([{ who: 'Tom', en: 'You beat the Ancient Golem! The forest is quiet again. A warm wind from the desert is calling you now.', vi: 'Con đã hoàn thành Rừng Ký Ức! Sa mạc cát vàng (cấp 20–25, Unit 4) đã mở: đi qua cổng dịch chuyển ở lối vào Rừng.' }, { who: '🧭 Word Keeper badge', en: 'Rank up: Pathfinder Word Keeper!', vi: 'Lên hạng Dẫn đường: mạnh hơn (+4 công, +30 máu).' }]);
  }
  { const nl = pendingLand(); if (nl && !ui.busy && !holdAnnounce) {      // (26/11) maps 5-7 open the same way: the guard beaten and the owl's exam passed
    profile.flags['open_' + nl] = true; save(); sfx('fanfare'); const m = WORLD.mapById(nl);
    ui.dialogue([{ who: 'Pip', en: `A new land is open: the ${m.en}!`, vi: `Đã mở ${m.vi} (cấp ${Math.max(m.lv[0], WORLD.mapById(LAND[nl].from).lv[1])}–${m.lv[1]}, Unit ${m.no}): đi qua cổng dịch chuyển ở lối vào vùng này.` }, { who: '🧭 Word Keeper badge', en: 'Rank up!', vi: 'Lên một hạng Người Giữ Chữ: mạnh hơn (+4 công, +30 máu).' }]);
  } }
  trophyNews();      // (27/11) a beaten guard's trophy goes to the home
  buddyNews();      // (27/11, turn 66) a friend's job is done
  const learned = Review.learned(profile.words); if (journal) journal.sync(); if (toolbar) toolbar.sync(profile);
  if (L.NAME === 'isle') {
    ui.hud(profile, 'Đảo Kho Báu', [`🗺 ${Math.min(TR.state(profile).n, TR.MAX_DAILY)}/${TR.MAX_DAILY}`, Save.gateWaiting(profile) ? '🦉 ôn tập' : '', restNote()].filter(Boolean).join('  '), learned, bag(profile).food);
    ui.clue(null, 0, '', treasureMap() ? 'Read the treasure map (M), walk the steps and dig with E!' : 'You found today’s treasures. Come back tomorrow!');
    crystals.show([]);
  } else if (L.NAME === 'harbor') {
    ui.hud(profile, 'Cảng Mặt Trời', [wild ? wild.huntNote() : '', Save.gateWaiting(profile) ? '🦉 ôn tập' : '', restNote()].filter(Boolean).join('  '), learned, bag(profile).food);
    const mq = Q.mainCurrent(profile);
    ui.clue(null, 0, '', questNote() || 'Welcome to Sunny Harbor! Take jobs from the board by the square.');
    crystals.show([]);
  } else if (isLand(L.NAME)) {
    ui.hud(profile, LAND[L.NAME].vi, [wild ? wild.huntNote() : '', Save.gateWaiting(profile) ? '🦉 ôn tập' : '', restNote()].filter(Boolean).join('  '), learned, bag(profile).food);
    ui.clue(null, 0, '', questNote() || `Welcome to the ${L.TITLE}!`);
    crystals.show([]);
  } else if (L.NAME === 'forest') {
    ui.hud(profile, 'Rừng Ký Ức', [`Pha lê ${quest.q.found.length}/5`, wild ? wild.huntNote() : '', Save.gateWaiting(profile) ? '🦉 ôn tập' : '', restNote()].filter(Boolean).join('  '), learned, bag(profile).food);
    const c = quest.clue, t = quest.targetId ? landmark(quest.targetId) : null;
    if (quest.step === 'seek') { if (c) ui.clue(c, quest.q.hint, `${t.en} = ${t.vi}`); else ui.clue(null, 0, '', `Lời gợi ý cho lớp ${profile.grade} chưa được soạn.`); }
    else if (quest.step === 'intro') ui.clue(null, 0, '', 'Talk to Tom at the forest gate. (E)');
    else if (quest.step === 'tree') ui.clue(null, 0, '', 'Take the crystals to the ancient tree. ★');
    else ui.clue(null, 0, '', questNote() || 'The forest remembers its words again. You can explore!');
    crystals.show(quest.crystalIds());
  } else {
    ui.hud(profile, 'Làng Khởi Đầu', [mini ? `★ ${mini.data.stars.length}/${STARS.length}` : '', wild ? wild.huntNote() : '', Save.gateWaiting(profile) ? '🦉 ôn tập' : '', restNote()].filter(Boolean).join('  '), learned, bag(profile).food);
    const c = story.customer;
    if (c) ui.clue({ who: `Traveller ${c.index + 1}/${c.total}`, text: c.said || `A jar of "${c.target.word}", please!`, key: c.target.word, hints: false, tip: 'Đi tới hũ có nghĩa đúng rồi nhấn E' }, c.said ? 1 : 0, '');
    else if (mini && mini.note) ui.clue(null, 0, '', mini.note);
    else if (story.step === 'gather') { const have = story.items, need = ['rope', 'log', 'axe'];
      ui.clue(null, 0, '', need.every((k) => have.includes(k)) ? 'Take everything to Sam at the bridge.' : 'Find: ' + need.map((k) => (have.includes(k) ? '✓ ' : '☐ ') + k).join('   ')); }
    else ui.clue(null, 0, '', NOTES[story.step] || questNote() || '');      // (26/11) after the village story the card follows the main quest list (it used to point at the locked forest gate for ever)
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
/** (26/11) No story step and no board job: the arrow leads to the fight the hero is ready for. Below the map's top level that is the
 *  monster field of their level; at the top level it is the map's boss while it stands, then the portal to the next land. */
function huntGoal() {
  if (!wild || !profile || profile.admin || !wild.on(L.NAME, profile)) return null;
  const lv = profile.stats.level, zs = (ZONES[L.NAME] || []).map((z) => ({ z, lv: (MONSTERS[z.kind] || {}).level || 1 })).sort((a, b) => a.lv - b.lv);
  if (Save.atCap(profile) || (L.NAME === 'village' && lv >= 4 && !profile.flags.boss1)) {
    const b = wild.mobs.find((m) => m.boss && !m.dead && !profile.flags[m.def.flag] && m.region === L.NAME && lv >= m.def.level);
    if (b) return { x: b.home.x, z: b.home.z, text: 'Trùm: ' + b.def.name };
    if (Save.atCap(profile)) { const pt = WORLD.portalsOf(L.NAME)[0]; return pt && WORLD.routesOf(profile, L.NAME, pt).some((r) => r.ok && WORLD.mapById(r.to).lv[1] > levelCap(profile)) ? { x: pt.x, z: pt.z, text: 'Cổng sang vùng mới' } : null; }
  }
  if (!zs.length) return null;
  let best = zs[0]; for (const e of zs) if (e.lv <= lv) best = e;
  return { x: best.z.x, z: best.z.z, text: `${best.z.vi} · Lv ${best.lv}` };
}
function pickGoal(markers) {
  if (Save.gateWaiting(profile) && isLand(L.NAME)) { const ow = friends.find((f) => f.region === L.NAME && f.role === 'owl'); if (ow) return { x: ow.npc.x, z: ow.npc.z, text: 'Cú Mèo' }; }
  if (Save.gateWaiting(profile)) return L.NAME === 'village' ? { x: OWL.x, z: OWL.z, text: 'Cú Mèo' } : { x: L.EXITS[0].x, z: L.EXITS[0].z, text: 'Về làng gặp Cú Mèo' };      // the owl lives in the village
  const story = markers.find((m) => !m.host && !m.color && ['!', '?', '✉', '★'].includes(m.text));
  if (story) return { x: story.x, z: story.z, text: story.text === '✉' ? 'Bức thư' : 'Nhiệm vụ' };
  const job = wild ? wild.guide(player.pos) : null; if (job) return job;
  return huntGoal();
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
function placeActors() { placeActorsNow(); placeBuddies(); }
function placeActorsNow() {
  if (L.NAME === 'village') {
    tom.move(2.6, 7.6, -0.4); ben.move(BEN_MARKET.npc[0], BEN_MARKET.npc[1], Math.PI / 2);      // (24/11) Ben stands at his own word-jar stall
    sam.move(...SAM_HOME, 1.2);
    const ex = L.EXITS[0]; if (profile && profile.flags.forest_open) { pip.root.visible = true; pip.place(ex.x + 2.2, ex.z + 3); } else pip.root.visible = false;
    if (story) placeVillageHelpers();
    for (const f of friends) { if ((f.region || 'village') === 'village') f.npc.move(...f.at); else f.npc.hide(); }
  } else if (L.NAME === 'isle') {
    tom.hide(); ben.hide(); sam.hide(); pip.root.visible = false; for (const f of friends) f.npc.hide();
  } else if (L.NAME === 'harbor') {
    tom.hide(); ben.hide(); pip.root.visible = false; for (const f of friends) f.npc.hide();
    sam.move(30, 29.4, Math.PI);      // fishing at the end of the small pier
  } else if (isLand(L.NAME)) {      // (26/11) maps 4-7: the keeper, the merchant and the owl of the land; Pip flies along
    tom.hide(); ben.hide(); sam.hide(); for (const f of friends) { if (f.region === L.NAME) f.npc.move(...f.at); else f.npc.hide(); }
    pip.root.visible = true; pip.place(L.SPAWN.x + 2.4, L.SPAWN.z - 2);
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
  Sea.keep(profile, item); if (!item.junk) { track('sea_fish'); } track('mini'); save(); refresh(); return 'vào túi đồ (V) · bán ở Village Shop';
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
/** (26/11) A map that cannot be built (a missing or broken file) no longer leaves the game stuck in "switching" for ever:
 *  the hero goes back to the map they came from and is told; if that fails too, the page says to press F5. */
async function enterRegion(name, at, back) {
  if (switching) return;
  const from = L.NAME;
  try { await enterRegionNow(name, at); }
  catch (e) {
    console.error('enterRegion', name, e); errors.push('enterRegion ' + name + ': ' + String(e && e.message || e)); switching = false;
    if (!back && from && from !== name) { ui.toast('Không tải được vùng mới. Quay lại chỗ cũ…'); return enterRegion(from, null, true); }
    ui.toast('Lỗi khi tải vùng. Bấm F5 để tải lại game (tiến độ đã được lưu).');
  } finally { switching = false; }
}
async function enterRegionNow(name, at) {
  switching = true; ui.prompt('');
  if (fishing) fishing.stop();
  if (story) story.leaveMarket();
  const unit0 = profile ? Save.unitOf(profile) : 0; L.setRegion(name); if (profile) profile.region = name;
  dayNight.force = L.REGIONS[name].hour ?? null;      // (26/11, turn 63) some lands have their own hour: the cave is always night, the volcano always late afternoon, the dream kingdom always dusk
  for (const m of digMeshes.splice(0)) m.removeFromParent(); digMixers.length = 0; if (spells) spells.clear();
  if (name === 'harbor' && profile) profile.flags.harbor_seen = true;      // main quest: sail to Sunny Harbor
  if (world) world.dispose();
  jarKey = '';
  world = await buildWorld(scene, staticModel, animatedModel);
  const q = QUALITY[quality]; world.setDetail(q.density, q.particles, q.far);
  scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { if (m && typeof m === "object") m.needsUpdate = true; }); });
  try { await renderer.compileAsync(scene, camera); } catch { /* older browsers: shaders compile on first sight */ }      // no hitch when new things come into view
  minimap.rebuild(); placeActors(); if (walkers) walkers.setRegion(name); if (mini) mini.setRegion(name); if (wild) { if (name === 'harbor') await wild.addHarbor(seaModel); if (isLand(name)) await wild.addLand(name, landModel); wild.setRegion(name); } if (chests) chests.setRegion(name); if (spots) spots.setRegion(name); if (homes) homes.setRegion(name); if (forestStall) forestStall.visible = name === 'forest'; showOuter(name);
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
/** (26/11) English inside the fight: every WORD_EVERY-th monster leaves a word behind. One quick question (three choices, keys 1-3; the
 *  monsters wait while it is open): the meaning of a word, the word for a meaning, or a word heard. Right = the EXP of one more monster
 *  of that kind and a little health; wrong = the answer is shown, nothing is lost. Words due for review come first (all units learned). */
let wordKills = 0;
function wordDrop(m) {
  if (!profile || !m || !m.def || (navigator.webdriver && !/[?&]worddrop=1/.test(location.search))) return;      // the old tests kill monsters by the dozen: they ask for it with ?worddrop=1
  wordKills += 1; if (wordKills % WORD_EVERY) return;
  setTimeout(() => {
    if (!started || switching || ui.busy || room || (arcade && arcade.open) || (shopWin && shopWin.open)) return;
    const unit = Save.unitOf(profile), older = []; for (let n = 1; n < unit; n++) older.push(...cardsOfUnit(n));
    const all = [...unitCards, ...older].filter((c) => c.word.length <= 18), pool = unitCards.filter((c) => c.word.length <= 18); if (pool.length < 4) return;
    const due = Review.dueIds(profile.words).map((id) => all.find((c) => c.id === id)).filter(Boolean), fresh = pool.filter((c) => !profile.words[c.id]);
    const from = due.length && Math.random() < 0.6 ? due.slice(0, 8) : fresh.length ? fresh : pool, card = from[Math.floor(Math.random() * from.length)];
    const others = all.filter((c) => c.id !== card.id && c.vi !== card.vi && c.word !== card.word).sort(() => Math.random() - 0.5).slice(0, 2), opts = [card, ...others].sort(() => Math.random() - 0.5);
    const kind = ['mean', 'word', voiceOn() ? 'listen' : 'mean'][Math.floor(Math.random() * 3)], t0 = Date.now(), who = `✨ ${m.def.name} dropped a word`;
    const page = kind === 'mean' ? { who, en: `What does "${card.word}" mean?`, vi: 'Chọn nghĩa đúng (phím 1-2-3).' } : kind === 'word' ? { who, en: `Which word means "${card.vi}"?`, vi: 'Chọn từ tiếng Anh đúng (phím 1-2-3).' } : { who, en: '🔊 Listen! Which word did you hear?', vi: 'Nghe rồi chọn từ vừa đọc (phím 1-2-3).' };
    teach([card], () => {
      if (kind === 'listen') speak(card.word, true, 0.8);
      ui.choose(page, opts.map((o) => (kind === 'mean' ? o.vi : o.word)), (i) => {
        const ok = opts[i].id === card.id; Review.record(profile.words, card.id, { correct: ok, hints: 0, ms: Date.now() - t0 }); Save.recordSkill(profile, kind === 'listen' ? 'listening' : 'vocabulary', ok, 0); sfx(ok ? 'correct' : 'wrong');
        if (ok) { const exp = Save.killExp(profile, m.def.exp, m.def.level), hp = Math.round(Save.maxHp(profile) * 0.12); Save.addExp(profile, exp); profile.stats.hp = Math.min(Save.maxHp(profile), (profile.stats.hp || 0) + hp); ui.toast(`✔ ${card.word} = ${card.vi}${exp ? `   +${exp} EXP` : ''}   +${hp} máu`); }
        else ui.dialogue([{ who: '✨', en: `"${card.word}" means "${card.vi}".`, vi: `${card.word} = ${card.vi}. Lần sau con sẽ nhớ!` }]);
        save(); refresh();
      });
    });
  }, 600);
}
/** (26/11) Maps 4-7. The keeper of a land tells what the Dark Wind took (grades 6-7 get the short lines, 8-9 the long ones), and
 *  once a day gives a WORD LESSON: five words of the land's unit shown and read, then asked back (meaning, word, listening).
 *  Every right answer pays a little EXP; three lessons finish the land's lesson quest. */
let quizN = 0;      // counts the boss shields asked in this session (see `quiz` in the combat api)
const lessonReady = (land) => !(profile.lessonDay && profile.lessonDay[land] === Review.today());
function keeperTalk(land) {
  const t = LAND_TALK[land], who = t.who, lines = profile.grade >= 8 ? t.hard : t.easy, won = !!profile.flags[t.boss];
  const first = !profile.flags['met_' + land]; profile.flags['met_' + land] = true; if (first) save();
  const pages = won ? [{ who, en: t.after[0], vi: t.after[1] }] : lines.map((en, i) => ({ who, en, vi: t.vi[i] }));
  const offer = () => { if (!lessonReady(land)) { ui.dialogue([{ who, en: 'We had our lesson today. Come back tomorrow!', vi: 'Hôm nay học rồi. Mai quay lại học 5 từ mới và ôn trang ngữ pháp nhé.' }]); return; }
    ui.choose({ who, en: 'Shall we learn five words of this land, and one page of grammar?', vi: 'Bài học hôm nay: 5 từ + 1 trang ngữ pháp của Unit (2 câu), mỗi câu đúng được EXP.' }, ['Yes, please! · Học luôn', 'Not now · Để sau'], (i) => { if (i === 0) wordLesson(land, who); }); };
  ui.dialogue(first || !won ? pages : pages.slice(0, 1), offer); if (first) refresh();
}
function wordLesson(land, who) {
  const pool = unitCards.filter((c) => c.word.length <= 18); if (pool.length < 4) { ui.dialogue([{ who, en: 'I have no words to teach yet…', vi: `Từ vựng Unit ${Save.unitOf(profile)} lớp ${profile.grade} chưa được soạn.` }]); return; }
  const mix = (a) => [...a].sort(() => Math.random() - 0.5), fresh = mix(pool.filter((c) => !profile.words[c.id])), due = Review.dueIds(profile.words).map((id) => pool.find((c) => c.id === id)).filter(Boolean), rest = mix(pool);
  const five = [...new Set([...fresh, ...due, ...rest])].slice(0, 5); let right = 0, gained = 0;
  // (26/11, turn 63) the lesson ends with the GRAMMAR of the land's unit: the page the Dark Wind blew out of the keeper's book
  // (one card: the rule in Vietnamese and two examples), then two sentences to complete. Units without grammar skip this part.
  let gRight = 0, gAsked = 0;
  const finish = () => {
    (profile.lessonDay || (profile.lessonDay = {}))[land] = Review.today(); (profile.lessons || (profile.lessons = {}))[land] = ((profile.lessons[land]) || 0) + 1; save(); refresh(); sfx('fanfare');
    const all = right === five.length && gRight === gAsked;
    ui.dialogue([{ who, en: all ? 'Perfect! You are a real Word Keeper.' : `Well done! ${right + gRight} of ${five.length + gAsked}.`, vi: `Bài học hôm nay: từ vựng đúng ${right}/${five.length}${gAsked ? `, ngữ pháp đúng ${gRight}/${gAsked}` : ''}${gained ? `, +${gained} EXP` : ''}. Đã học ${profile.lessons[land]} buổi ở vùng này.` }]);
  };
  const grammarPart = () => {
    const unit = Save.unitOf(profile), note = noteFor(profile.grade, unit), items = grammarFor(profile.grade, unit, 2); gAsked = items.length;
    if (!items.length) { finish(); return; }
    const askG = (k) => {
      if (k >= items.length) { finish(); return; }
      const g = items[k], order = mix([0, 1, 2]), full = g.q.replace('___', g.options[g.a]);
      ui.choose({ who: `${who} · grammar ${k + 1}/${items.length}`, en: g.q, vi: 'Chọn dạng đúng điền vào chỗ trống.' }, order.map((i) => g.options[i]), (i) => {
        const ok = order[i] === g.a; Save.recordSkill(profile, 'grammar', ok, 0); sfx(ok ? 'correct' : 'wrong');
        if (ok) { gRight += 1; const e = Save.atCap(profile) ? 0 : learnExp(profile.stats.level, LEARN.bubbleNew); Save.addExp(profile, e); gained += e; speak(full, true); askG(k + 1); }
        else ui.dialogue([{ who, en: full, vi: g.why }], () => askG(k + 1));
      });
    };
    if (note) ui.dialogue([{ who, en: `The Dark Wind blew this page out of my book: ${note.name}. ${note.ex[0][0]}`, vi: `📖 ${note.name}: ${note.vi} Ví dụ: ${note.ex[0][1]}` }, { who, en: note.ex[1][0], vi: `${note.ex[1][1]} · Giờ con điền giúp 2 câu để trang sách hiện lại nhé.` }], () => askG(0)); else askG(0);
  };
  const ask = (n) => {
    if (n >= five.length) { grammarPart(); return; }
    const c = five[n], kind = ['mean', 'word', voiceOn() ? 'listen' : 'word'][n % 3], opts = mix([c, ...mix(pool.filter((x) => x.id !== c.id && x.vi !== c.vi && x.word !== c.word)).slice(0, 2)]), t0 = Date.now(), head = `${who} · ${n + 1}/${five.length}`;
    if (kind === 'listen') speak(c.word, true, 0.8);
    ui.choose(kind === 'mean' ? { who: head, en: `What does "${c.word}" mean?` } : kind === 'word' ? { who: head, en: `Which word means "${c.vi}"?` } : { who: head, en: '🔊 Listen! Which word did you hear?', vi: 'Nghe rồi chọn từ vừa đọc.' }, opts.map((o) => (kind === 'mean' ? o.vi : o.word)), (i) => {
      const ok = opts[i].id === c.id; Review.record(profile.words, c.id, { correct: ok, hints: 0, ms: Date.now() - t0 }); Save.recordSkill(profile, kind === 'listen' ? 'listening' : 'vocabulary', ok, 0); sfx(ok ? 'correct' : 'wrong');
      if (ok) { right += 1; const e = Save.atCap(profile) ? 0 : learnExp(profile.stats.level, LEARN.bubbleNew); Save.addExp(profile, e); gained += e; ask(n + 1); }
      else ui.dialogue([{ who, en: `"${c.word}" means "${c.vi}".`, vi: `${c.word} = ${c.vi}` }], () => ask(n + 1));
    });
  };
  teach(five, () => ask(0));
}
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
  CrowdRules.count(profile, ev, n);      // (27/11, turn 68) the explorers' favours count bubbles, chests, mini games and right answers
  for (const q of done) { ui.toast('📜 Xong nhiệm vụ ngày: ' + q.en); sfx('fanfare'); }
  const fp = Family.addPoints(store, profile, ev, Review.today());      // the family ship and the weekly board (19/11)
  if (fp.up) { const nm = Family.SHIP_NAMES[fp.up]; ui.toast(`⚓ Tàu gia đình lên cấp ${fp.up + 1}: ${nm.en} (${nm.vi})! Mở sổ nhiệm vụ để nhận thưởng.`); sfx('fanfare'); }
  if (done.length || fp.n) save(); if (journal) journal.sync();
}
/** The highest land the hero has opened (its level cap is the one that counts for a reward, and its unit for the owl in the village). */
function bestRegion() { for (const l of [...LAND_IDS].reverse()) if (WORLD.canGo(profile, LAND[l].from, l).ok) return l; return WORLD.canGo(profile, 'village', 'forest').ok ? 'forest' : profile.flags.map2 ? 'harbor' : 'village'; }
function claimReward(r, what, main) {
  if (!r) return;
  // (26/11) the reward counts against the cap of the best map the hero has OPENED, not of the map they stand in: a level-10 hero claiming in
  // the village (home, owl, shops) got no EXP and half the gold. A story quest is done once, so its gold is never cut.
  const here = profile.region, best = bestRegion(); profile.region = best;
  const capped = Save.atCap(profile), gold = main ? r.gold : Save.capGold(profile, r.gold); profile.stats.gold += gold; if (r.exp) Save.addExp(profile, r.exp); profile.region = here; sfx('fanfare'); save(); refresh();
  ui.toast(`🎁 ${what}: +${gold} vàng${r.exp && !capped ? `, +${r.exp} EXP` : ''}${capped ? ' (cấp tối đa của vùng: sang vùng mới để nhận đủ)' : ''}${r.bonusAll ? ' (thưởng xong cả 3!)' : ''}`);
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
  const all = WR.allItems().filter(([k]) => !WR.heroOnly(k) || profile.avatar === 'hero'), fresh = all.filter(([k, c]) => !WR.wardrobe(profile).owned.includes(WR.itemId(k, c))), [k, c] = (fresh.length ? fresh : all)[Math.floor(Math.random() * (fresh.length || all.length))];
  const isNew = WR.unlock(profile, k, c); profile.stats.gold += r.gold; track('treasure'); sfx('fanfare'); save(); refresh();
  const gx = m.goal.x, gz = m.goal.z, gy = L.groundHeight(gx, gz);
  const mound = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 1 })); mound.position.set(gx, gy, gz); scene.add(mound); digMeshes.push(mound);
  animatedModel('isle_chest_v01').then((c) => {        // the Blender chest rises from the sand and its lid opens
    if (L.NAME !== 'isle') return; c.scene.position.set(gx, gy, gz); c.scene.rotation.y = Math.atan2(player.pos.x - gx, player.pos.z - gz); c.scene.scale.setScalar(1.6);
    c.scene.traverse((o) => { if (o.isMesh) o.castShadow = true; }); scene.add(c.scene); digMeshes.push(c.scene); mound.visible = false;
    const mx = new THREE.AnimationMixer(c.scene), act = mx.clipAction(c.animations.find((a) => a.name === 'Open') || c.animations[0]); act.setLoop(THREE.LoopOnce, 1); act.clampWhenFinished = true; act.play(); digMixers.push(mx);
  }, () => {});
  ui.dialogue([{ who: 'Ngọc', en: `I found the treasure! A chest full of gold, and a new piece for my wardrobe: ${WR.itemName(WR.itemId(k, c))}! (+${r.gold} gold)`, vi: `Tìm được kho báu! ${isNew ? 'Có thêm món mới trong tủ đồ (phím V).' : ''} ${treasureMap() ? 'Còn một bản đồ nữa hôm nay: bấm M.' : 'Hôm nay con đã tìm đủ rồi, mai có bản đồ mới.'}` }]);
}
function openDex() { dexPanel.show(); sfx('tick'); }
/** A sea creature is found (caught or defeated): the first time pays by rarity, milestones pay a bonus. */
function seaFound(id) {
  const r = Sea.discover(profile, id, Review.today()); if (!r.isNew) return; const e = Sea.entry(id);
  profile.stats.gold += r.gold + r.bonus; sfx('fanfare'); save(); refresh();      // (24/11) EXP only from quests and monsters
  ui.toast(`🐠 Album biển: ${e.en} = ${e.vi}  (+${r.gold + r.bonus} ●)${r.bonus ? '  🎉 mốc thưởng!' : ''}`);
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
const HOME_FILE = { ...SHOW_FILE, bed: 'home_bed', wardrobe: 'home_wardrobe', mirror: 'home_mirror', table: 'home_table_chairs', sofa: 'home_sofa', lamp: 'home_lamp', bookcase: 'home_bookcase', desk: 'home_desk', clock: 'home_clock', picture: 'home_picture', rug: 'home_rug', plant: 'home_plant', guitar: 'home_guitar', piano: 'home_piano', drum: 'home_drum', violin: 'home_violin' };
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
// ---------------------------------------------------------------- (27/11, turn 64) life in the house (rules: core/homeplay.js)
// F by a piece of furniture: its English name; the first time the child "labels" it (hears the word, picks it) and the home gets
// more comfortable. F by one's own bed: a sleep once a day (full health, a little more EXP from monsters for a while).
// G: Find it! Pip names five things ("Find the lamp!", "Find the thing next to the bed!") and the child walks to each.
let homeOwner = null, homeMine = false, findGame = null, homeGuest = null, visit = null;
const buddies = [];      // (27/11, turn 66) Kit and Mai: { id, who, npc, follow, followT, sayT }
let crowd = null;
// (27/11, turn 72) The admin's review notes (F1, ui/notes.js): where a note is made, what was clicked, a picture, markers in the world.
let notesUI = null, noteGroup = null, noteGod = false;      // noteGod: what "no damage" was before the panel opened (monsters do not hurt the admin while a note is being written)
function noteContext() {
  const m = WORLD.mapById(L.NAME === 'isle' ? 'harbor' : L.NAME), w = { region: L.NAME, land: m ? m.vi : L.NAME, x: player.pos.x, z: player.pos.z, quality, grade: profile ? profile.grade : null, level: profile ? profile.stats.level : null };
  if (room) w.inside = room.kind === 'home' || room.walk ? 'nhà' : 'cửa hàng';
  try { if (!room && !ui.busy) { const t = interactTarget(); if (t && t.text) w.near = t.text; } } catch { /* nothing in reach */ }
  if (wild && wild.root.visible && !room) { let bd = 10; for (const x of [...wild.mobs, ...(wild.bosses || [])]) if (x.g.visible && !x.dead) { const d = Math.hypot(x.x - player.pos.x, x.z - player.pos.z); if (d < bd) { bd = d; w.mob = `${x.def.name || x.kind || 'quái'} (cấp ${x.def.level || '?'}, cách ${d.toFixed(0)} m)`; } } }
  const dlg = document.querySelector('#dialog'); if (dlg && !dlg.classList.contains('hidden')) w.dialog = dlg.innerText;
  const wins = [[shopWin, () => 'Cửa hàng: ' + shopWin.title], [arcade, () => 'Mini game: ' + ((arcade.game && arcade.game.title) || '')], [worldUI, () => 'Bản đồ thế giới'], [skillUI, () => 'Bảng kỹ năng'], [packUI, () => 'Túi đồ'], [journal, () => 'Sổ tay'], [homePanel, () => 'Bảng nhà'], [wardPanel, () => 'Tủ đồ'], [petPanel, () => 'Thú cưng'], [onlineUI, () => 'Chơi chung'], [music, () => 'Phòng nhạc'], [dexPanel, () => 'Album biển']];
  w.window = wins.filter(([o]) => o && o.open === true).map(([, f]) => { try { return f(); } catch { return ''; } }).filter(Boolean).join(', ');
  if (spells && spells.last && Date.now() - spells.last.at < 15000) w.spell = spells.last.id;      // only a spell cast a moment ago belongs to the place
  try { const q = Q.mainCurrent(profile); if (q) w.quest = q.en; } catch { /* no main quest */ }
  return w;
}
/** What lies under a click in the 3D scene: the spot on the ground and the nearest thing with a name. */
function notePick(cx, cy) {
  const r = canvas.getBoundingClientRect(), ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera);
  const hit = new THREE.Vector3(); if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -player.pos.y), hit)) return null;
  const y = L.groundHeight(hit.x, hit.z); ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -y), hit);      // a second look at the height of the ground there
  let name = '', bd = 3.2; const see = (x, z, n) => { const d = Math.hypot(x - hit.x, z - hit.z); if (n && d < bd) { bd = d; name = n; } };
  if (wild && wild.root.visible) for (const x of [...wild.mobs, ...(wild.bosses || [])]) if (x.g.visible && !x.dead) see(x.x, x.z, `quái ${x.def.name || x.kind}`);
  for (const a of [tom, sam, ben]) if (a && a.root.visible) see(a.x, a.z, a === tom ? 'Tom' : a === sam ? 'Sam' : 'Ben');
  for (const f of friends) if (f.region === L.NAME && f.npc.root.visible) see(f.npc.x, f.npc.z, f.who);
  for (const b of buddies) if (b.npc.root.visible) see(b.npc.x, b.npc.z, b.who);
  for (const st of STARTS) if ((st.region || 'village') === L.NAME) see(st.x, st.z, st.sign || st.text);
  for (const l of (L.REGIONS[L.NAME].LANDMARKS || [])) { const sp = l.spot || [l.x, l.z]; see(sp[0], sp[1], l.name || l.vi || l.id); }
  see(player.pos.x, player.pos.z, 'nhân vật của mình');
  return { picked: name || 'mặt đất', px: hit.x, pz: hit.z };
}
function noteCapture() {
  try { game.renderNow(); const cv = document.createElement('canvas'), w = 560, h = Math.round(w * canvas.height / canvas.width); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(canvas, 0, 0, w, h); return cv.toDataURL('image/jpeg', 0.55); } catch { return ''; }
}
function noteMarks(list) {
  if (noteGroup) { noteGroup.traverse((o) => { if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); noteGroup.removeFromParent(); noteGroup = null; }
  if (!list || room) return; noteGroup = new THREE.Group(); scene.add(noteGroup);
  for (const n of list) if (n.where.region === L.NAME && !n.done) { const x = n.where.px ?? n.where.x, z = n.where.pz ?? n.where.z; if (x == null || z == null) continue; const sp = label(`📝 #${n.id}`, { size: 30, scale: 0.6, color: '#3a2400', bg: 'rgba(255,214,110,0.95)' }); sp.position.set(x, L.groundHeight(x, z) + 2.7, z); noteGroup.add(sp); }
}
async function noteGo(n) { const w = n.where; if (!w.region || w.x == null) { ui.toast('Ghi chú này không có vị trí trong bản đồ'); return; } if (room) leaveRoom(); await adminGo(w.region, w.x, w.z); if (notesUI && notesUI.open) noteMarks(notesUI.list); }
// (27/11, turn 72) the redrawn spells: a heavy hit shakes the camera a little and lights the scene round it for a moment
let shakeAmp = 0, fxLightT = 0, fxLightPow = 0; const fxLight = new THREE.PointLight(0xffffff, 0, 16, 2); scene.add(fxLight);
const fxShake = (a) => { shakeAmp = Math.max(shakeAmp, Math.min(1, a)); };
const fxFlash = (at, hex, power) => { fxLight.color.set(hex); fxLight.position.set(at.x, at.y + 1.2, at.z); fxLightPow = 22 * power; fxLightT = 0.26; };      // (27/11, turn 67) the other explorers (game/crowd.js)
// (27/11, turn 69) Playing together: the room (net/online.js), the other children drawn here (game/peers.js), the panel (ui/online.js).
// The server's address comes from data/online.json, or from what a parent typed in the admin panel; a parent can also switch it off on this machine.
let online = null, peers = null, onlineUI = null, onlineFile = '';
const peerBodies = new Map();      // bodies never shown themselves: the hero's own model carries her sword and accessories, so the friends are cloned from a clean copy
const peerBody = (kind) => { const file = AVATAR_FILES[kind] || 'chr_ngoc_adventurer_v05'; if (!peerBodies.has(file)) peerBodies.set(file, loader.loadAsync(`./assets/models/${file}.glb`).then(prepModel)); return peerBodies.get(file); };
const onlineSet = () => { try { return { off: localStorage.getItem('eq-online-off') === '1', own: localStorage.getItem('eq-online-server') || '', file: onlineFile }; } catch { return { off: false, own: '', file: onlineFile }; } };
const onlineServer = () => { const o = onlineSet(); return o.off ? '' : o.own || o.file; };
const netRegion = () => (room ? 'home' : L.NAME);
/** What the other children see of this one: the body, the skin, the hair and the colours and kinds of the clothes (no accessories yet). */
function netLook() {
  const worn = WR.wardrobe(profile).worn, it = (slot) => (worn[slot] && WR.parse(worn[slot])) || null;
  const col = (slot) => { const i = it(slot); return i ? WCOL[i.color] || WR.JEWEL_HEX[i.color] || null : null; }, base = (slot) => { const i = it(slot); return i ? WR.baseOf(i.kind) : null; };
  const dress = col('body'), feet = it('feet'), style = it('style');
  return { a: AVATAR_FILES[profile.avatar] && !avatarFailed[profile.avatar] ? profile.avatar : 'ngoc', k: lookOf(profile).skin, s: style ? style.color : 'short', h: col('haircolor'), t: dress || col('top'), b: dress || col('bottom'),
    f: feet && feet.kind === 'boots' ? col('feet') : null, ct: CLOTH.top[base('top')] || null, cb: CLOTH.bottom[base('bottom')] || null, cd: CLOTH.body[base('body')] || null };
}
function dressPeer(root, look) {
  if (look.a === 'ngoc') {
    tintSkin(root, look.k); tintBody(root, { hair: look.h || NGOC_COLORS.hair, top: look.t || NGOC_COLORS.top, bottom: look.b || NGOC_COLORS.bottom });
    setHairStyle(root, look.s); setClothes(root, { top: look.ct, bottom: look.cb, body: look.cd });
    return;
  }
  root.traverse((o) => { if (o.isMesh && o.material && o.material.color) o.material.color.setScalar(1.15); });      // the Tripo textures read darker than the painted world (as for the hero)
  if (look.a === 'hero') tintHero(root, { top: look.t, bottom: look.b, sleeves: look.t, boots: look.f, hair: look.h });
}
const homeTag = (id) => { if (id === 'guest') return homeGuest ? label(`💬 ${homeGuest.who} · F`, { size: 34, scale: 0.9 }) : null; const it = ITEMS[id]; if (!it) return null; return label(findGame ? '❓' : HomePlay.isLabelled(homeOwner, id) ? `🏷 ${it.en}` : '❓ F', { size: 34, scale: 0.9 }); };
const restNote = () => { const m = profile ? HomePlay.restLeft(profile, Date.now()) : 0; return m ? `😴 +${profile.rest.pct}% EXP ${m}′` : ''; };
/** The home went up a comfort level since the child was last told: say so (once). */
/** The trophies of beaten guards arrive in the home by themselves (also for a save from before the trophies existed). */
function trophyNews() {
  if (!profile || profile.admin) return; const got = HomePlay.syncTrophies(profile); if (!got.length) return;
  save(); ui.toast(got.length === 1 ? `🏆 ${ITEMS[got[0]].en} (${ITEMS[got[0]].vi}) đã được đặt trong phòng học ở nhà con: +${HomePlay.TROPHY_POINTS} Ấm cúng.` : `🏆 ${got.length} chiếc cúp trùm đã được đặt trong phòng học ở nhà con.`); comfortNews();
}
function comfortNews() {
  if (!profile || profile.admin) return; const c = HomePlay.comfort(profile);
  if (c.level > (profile.comfortSeen || 0)) { profile.comfortSeen = c.level; save(); sfx('fanfare'); ui.toast(`🏡 Nhà của con lên hạng ${c.level}: ${c.en} · ${c.vi}! Ngủ ở nhà nay được +${c.rest}% EXP.`); }
}
function homeTouch() {
  if (!room || !room.walk || ui.busy || room.editing) return; const id = room.nearId;
  if (id === 'guest') { guestTalk(); return; }
  if (visit && id && ITEMS[id] && ['show', 'next'].includes(visit.tasks[visit.i].kind)) { visitShow(id); return; }
  if (!id || !ITEMS[id]) { ui.toast(findGame ? `${findGame.q.en} · lại gần món đồ rồi bấm F` : 'Lại gần một món đồ rồi bấm F để nghe tên tiếng Anh của nó.'); return; }
  if (findGame) { findAnswer(id); return; }
  if (id === 'bed' && homeMine && HomePlay.canRest(profile, Review.today()).ok) {
    ui.choose({ who: '🛏 Bed', en: 'Would you like to sleep for a while?', vi: `Ngủ một giấc: hồi đầy máu, ${HomePlay.REST_MINUTES} phút sau đó quái cho thêm +${HomePlay.comfort(profile).rest}% EXP (mỗi ngày một lần).` }, ['Sleep · Ngủ một giấc', 'Just the word · Chỉ nghe tên'], (i) => { if (i === 0) homeRest(); else homeWord(id); });
    return;
  }
  homeWord(id);
}
function homeWord(id) {
  const it = ITEMS[id];
  if (!homeMine || HomePlay.isLabelled(profile, id)) { speak(it.en, true); ui.toast(`🏷 ${it.en} · ${it.vi}`); return; }
  const others = Object.keys(ITEMS).filter((x) => ITEMS[x].slot === 'home' && x !== id && ITEMS[x].en !== it.en).sort(() => Math.random() - 0.5).slice(0, 2), opts = [id, ...others].sort(() => Math.random() - 0.5);
  speak(it.en, true, 0.8);
  ui.choose({ who: '🏷 Word label', en: '🔊 Listen! Which word is the name of this thing?', vi: `Dán nhãn tiếng Anh cho: ${it.vi}` }, opts.map((x) => ITEMS[x].en), (i) => {
    const ok = opts[i] === id; Save.recordSkill(profile, 'vocabulary', ok, 0); sfx(ok ? 'correct' : 'wrong');
    if (!ok) { speak(it.en, true); ui.dialogue([{ who: 'Pip', en: `This is the ${it.en.toLowerCase()}. Listen again and try once more!`, vi: `${it.en} = ${it.vi}. Bấm F để thử lại.` }]); return; }
    HomePlay.addLabel(profile, id); const e = Save.atCap(profile) ? 0 : learnExp(profile.stats.level, LEARN.bubbleNew); Save.addExp(profile, e); save(); refresh();
    if (room && room.walk) { room.retag(); room.flash(id); } speak(it.en, true);
    ui.toast(`🏷 ${it.en} = ${it.vi} · +${HomePlay.LABEL_POINTS} Ấm cúng (${HomePlay.comfort(profile).score} điểm)${e ? ` · +${e} EXP` : ''}`); comfortNews();
  });
}
function homeRest() {
  const r = HomePlay.startRest(profile, Date.now(), Review.today());
  if (!r.ok) { ui.toast(r.why === 'bed' ? 'Nhà chưa có giường (Bed): mua trong danh sách (phím L) rồi mới ngủ được.' : 'Hôm nay con ngủ rồi. Mai ngủ tiếp nhé!'); return; }
  profile.stats.hp = Save.maxHp(profile); save(); refresh(); sfx('fanfare'); if (homePanel && homePanel.open) homePanel.paint();
  ui.dialogue([{ who: 'Pip', en: 'Good night… Good morning! You slept well.', vi: `Hồi đầy máu. Trong ${r.minutes} phút tới, quái cho thêm +${r.pct}% EXP (nhà càng ấm cúng càng được nhiều).` }]);
}
const findHint = () => (findGame && findGame.q ? `🔎 ${findGame.n + 1}/${HomePlay.FIND_ROUNDS} · ${findGame.q.en} · F: chọn món đang đứng cạnh · G: thôi chơi` : '');
function homeFind() {
  if (!room || !room.walk || ui.busy || room.editing) return;
  if (visit) { ui.toast(`${visit.guest.who} đang chờ: ${visit.tasks[visit.i].en}`); return; }
  if (findGame) { findGame = null; homePanel.setHint(''); room.retag(); ui.toast('Đã dừng Find it!'); return; }
  if (!HomePlay.findRound(room.list())) { ui.toast('Nhà cần ít nhất 3 món đồ mới chơi Find it! được.'); return; }
  findGame = { n: 0, right: 0, asked: [], tries: 0, gained: 0, q: null, pays: homeMine && HomePlay.findPays(profile, Review.today()) }; homePanel.hide(); room.retag(); findNext();
}
function findNext() {
  const g = findGame; if (!g) return;
  if (g.n >= HomePlay.FIND_ROUNDS) {
    findGame = null; homePanel.setHint(''); if (room && room.walk) room.retag(); save(); refresh(); sfx('fanfare');
    ui.dialogue([{ who: 'Pip', en: g.right === HomePlay.FIND_ROUNDS ? 'You found everything at the first try! You know your home so well.' : `You found ${g.right} of ${HomePlay.FIND_ROUNDS} at the first try. Well done!`, vi: `Find it!: đúng ngay ${g.right}/${HomePlay.FIND_ROUNDS}${g.gained ? `, +${g.gained} EXP` : g.pays ? '' : ' (hôm nay đã hết lượt có EXP, chơi cho vui)'}.` }]);
    return;
  }
  g.q = HomePlay.findRound(room.list(), { not: g.asked, hard: profile.grade >= 8 }); g.asked.push(g.q.target); g.tries = 0; speak(g.q.en, true); homePanel.setHint(findHint());
}
function findAnswer(id) {
  const g = findGame, ok = id === g.q.target, it = ITEMS[id]; sfx(ok ? 'correct' : 'wrong'); room.flash(id);
  if (!ok) {
    g.tries += 1; Save.recordSkill(profile, 'listening', false, 0);
    if (g.tries >= 3) { const t = ITEMS[g.q.target]; ui.toast(`Đáp án: ${t.en} = ${t.vi}. Sang câu tiếp nhé!`); g.n += 1; findNext(); return; }
    speak(`That is the ${it.en.toLowerCase()}. ${g.q.en}`, true); ui.toast(`Đây là ${it.en} (${it.vi}). ${g.q.en}`); return;
  }
  if (g.tries === 0) { g.right += 1; Save.recordSkill(profile, 'listening', true, 0); if (g.pays && !Save.atCap(profile)) { const e = learnExp(profile.stats.level, LEARN.bubbleOld); Save.addExp(profile, e); g.gained += e; } }
  ui.toast(`✔ ${it.en} = ${it.vi}`); g.n += 1; findNext();
}
// ---------------------------------------------------------------- (27/11, turn 66) Kit and Mai, the hero's friends (rules: core/buddies.js)
// They wait near the gate of every land. E beside one: a greeting that follows the story, then a choice: their job (one per land,
// in order through the twelve maps), a little chat in English, or "come with me" (the friend walks along for a few minutes).
const BUDDY_WALK = 300;      // seconds a friend walks along before going back to wait
function placeBuddies() {
  const admin = !profile || profile.admin, sp = L.SPAWN || { x: 0, z: 0 };
  buddies.forEach((b, k) => {
    b.follow = false; if (admin || L.NAME === 'isle') { b.npc.hide(); return; }
    const side = k ? -1 : 1; let at = null;
    for (let r = 0; r < 14 && !at; r++) for (const [ox, oz] of [[4.5 * side, 3.5], [5.5 * side, 0.5], [4 * side, -3.5], [7 * side, 3], [7.5 * side, -2], [3 * side, 6]]) { const x = sp.x + ox + side * r * 0.9, z = sp.z + oz - r * 0.5; if (L.walkable(x, z, 0.7) && !(L.inWater && L.inWater(x, z)) && !WORLD.portalAt(L.NAME, x, z) && !friends.some((f) => f.npc.x < 1e5 && Math.hypot(f.npc.x - x, f.npc.z - z) < 3.2) && !STARTS.some((g) => (g.region || 'village') === L.NAME && Math.hypot(g.x - x, g.z - z) < 4)) { at = [x, z]; break; } }
    if (at) { b.npc.move(at[0], at[1], Math.atan2(sp.x - at[0], sp.z - at[1])); b.home = at; b.tx = at[0]; b.tz = at[1]; b.mode = 'roam'; b.idleT = 3 + k * 2; b.askT = 25 + k * 40; b.called = false; } else b.npc.hide();
  });
  if (crowd) { const m = WORLD.mapById(L.NAME === 'isle' ? 'harbor' : L.NAME); crowd.setRegion(!admin && L.NAME !== 'isle', m ? Math.max(1, m.lv[0]) : 1, m ? m.lv[1] : 5); }      // (27/11, turn 67) the other explorers
}
/** (27/11, turn 67) Why a friend would come over to the hero now: 'hello' (never met), 'ready' (a job to hand in), 'offer' (a new job), 'chat' (not talked today), or ''. */
function buddyReason(b) {
  if (!profile || profile.admin) return ''; const r = Buddies.record(profile), st = Buddies.state(profile, b.id).status;
  return !r.met[b.id] ? 'hello' : st === 'ready' ? 'ready' : st === 'offer' ? 'offer' : (r.chatDay || {})[b.id] !== Review.today() ? 'chat' : '';
}
const BUDDY_CALL = { hello: 'Hey, you! Wait a minute!', ready: 'You did it! I saw everything!', offer: 'Hey! I need your help with something.', chat: 'Hi! How are you today?' };
/** A friend's frame. They are not signposts: they stroll round their spot by the gate, and when they have something for the hero
 *  (a first hello, a job, a reward, a chat) they walk over, or turn up beside the hero out in the land, and call out; E answers. */
function updateBuddy(b, dt, talking, rt = dt) {      // dt: the step for walking (capped); rt: real seconds, for the waits
  const n = b.npc; if (n.x > 1e5) return;
  const px = player.pos.x, pz = player.pos.z, d = Math.hypot(px - n.x, pz - n.z), busy = ui.busy || !!room || !!(wild && wild.fighting) || !!(arcade && arcade.open);
  if (talking || room) { faceTo(n, px, pz, dt); n.play(talking && n.actions.Talk ? 'Talk' : 'Idle'); if (n.mixer) n.mixer.update(dt); return; }
  n.root.visible = d < 60;
  if (b.follow) {
    b.followT -= rt; if (b.followT <= 0) { b.follow = false; b.mode = 'roam'; b.idleT = 2; b.askT = 120; if (!ui.busy) ui.toast(`${b.who}: I will stay around here. See you soon!`); return; }
    const side = b.id === 'kit' ? 1.2 : -1.2, yaw = player.yaw || 0, tx = px - Math.sin(yaw) * 1.7 + Math.cos(yaw) * side, tz = pz - Math.cos(yaw) * 1.7 - Math.sin(yaw) * side, dd = Math.hypot(tx - n.x, tz - n.z);
    const jump = () => { const at = L.walkable(tx, tz, 0.4) ? [tx, tz] : [px, pz]; n.x = at[0]; n.z = at[1]; n.root.position.set(n.x, L.walkHeight(n.x, n.z), n.z); };
    if (dd > 28 || player.swim) { if (!player.swim) jump(); n.play('Idle'); }
    else { const r = stepTo(n, tx, tz, dd > 5 ? 7.6 : Math.min(4.4, dd * 3), dt, 0.7); if (r === 'blocked' && dd > 7) jump(); if (r === 'arrived') faceTo(n, px, pz, dt); }
    n.root.visible = true; if (n.mixer) n.mixer.update(dt);
    b.sayT -= rt; if (b.sayT <= 0 && !busy) { b.sayT = 70 + Math.random() * 50; ui.toast(`${b.who}: ${Buddies.REMARKS[Math.floor(Math.random() * Buddies.REMARKS.length)]}`); }
    return;
  }
  b.askT -= rt;
  if (b.mode === 'come') {
    if (busy) { n.play('Idle'); faceTo(n, px, pz, dt); }
    else if (d < 2.6) {      // beside the hero: call out once, wait a little, then leave them in peace
      faceTo(n, px, pz, dt); n.play(b.callT > 16 && n.actions.Wave ? 'Wave' : 'Idle');
      if (!b.called) { b.called = true; b.callT = 20; sfx('tick'); ui.toast(`${b.who}: ${BUDDY_CALL[b.why] || BUDDY_CALL.chat} · bấm E để nói chuyện`); speak(BUDDY_CALL[b.why] || BUDDY_CALL.chat, true); }
      b.callT -= rt; if (b.callT <= 0) { b.mode = 'roam'; b.askT = 240; b.called = false; b.idleT = 1; }
    } else if (b.called && d > 9) { b.mode = 'roam'; b.askT = 200; b.called = false; }      // the hero walked away: another time
    else if (d > 70) { b.mode = 'roam'; b.askT = 60; }
    else { const r = stepTo(n, px, pz, d > 8 ? 7.4 : 3.6, dt, 2.2); if (r === 'blocked') { b.stuck = (b.stuck || 0) + rt; if (b.stuck > 1.5) { const at = spotNear(px, pz, 4, 7); if (at) { n.x = at[0]; n.z = at[1]; n.root.position.set(n.x, L.walkHeight(n.x, n.z), n.z); } b.stuck = 0; } } else b.stuck = 0; }
    if (n.mixer) n.mixer.update(dt); return;
  }
  // strolling round their spot
  if (b.askT <= 0) {
    const why = busy || !started || game.friendsStay || buddies.some((o) => o !== b && (o.mode === 'come' || o.follow)) ? '' : buddyReason(b); b.askT = 15;      // one friend at a time: the other waits their turn
    if (why && (why !== 'chat' || d < 35)) {
      if (d > 40) { const at = spotNear(px, pz); if (!at) return; n.x = at[0]; n.z = at[1]; n.root.position.set(n.x, L.walkHeight(n.x, n.z), n.z); }      // out in the land: the friend turns up a little way off and runs over
      b.mode = 'come'; b.why = why; b.called = false; b.stuck = 0; return;
    }
  }
  if (Math.hypot(n.x - b.home[0], n.z - b.home[1]) > 22 && d > 55) { n.move(b.home[0], b.home[1], 0); b.idleT = 2; }      // back by the gate once the hero is far away
  if (b.idleT > 0) { b.idleT -= rt; n.play('Idle'); if (d < 6) faceTo(n, px, pz, dt); }
  else { const r = stepTo(n, b.tx, b.tz, 2.3, dt, 0.6); if (r !== 'moving') { b.idleT = r === 'blocked' ? 0.5 : 2.5 + Math.random() * 6; const a = Math.random() * 6.283, rr = 3 + Math.random() * 9, from = Math.hypot(n.x - b.home[0], n.z - b.home[1]) > 16 ? b.home : [n.x, n.z]; b.tx = from[0] + Math.sin(a) * rr; b.tz = from[1] + Math.cos(a) * rr; if (Math.hypot(b.tx - b.home[0], b.tz - b.home[1]) > 14) { b.tx = b.home[0] + Math.sin(a) * 6; b.tz = b.home[1] + Math.cos(a) * 6; } } }
  if (n.mixer) n.mixer.update(dt);
}
/** A job has just been finished and the child has not been told: one line, once. */
function buddyNews() {
  if (!profile || profile.admin) return; const r = Buddies.record(profile);
  for (const b of buddies) { const st = Buddies.state(profile, b.id), a = r.active[b.id]; if (st.status === 'ready' && a && !a.told) { a.told = true; sfx('correct'); ui.toast(`${b.who}: You did it! Come and see me. · Xong việc của ${b.who}: tới gặp bạn ấy nhận thưởng.`); } }
}
function buddyTalk(b) {
  b.mode = 'roam'; b.called = false; b.idleT = 4; b.askT = 150;      // they have had their word: back to strolling for a while
  const def = Buddies.BUDDIES[b.id], who = def.who, r = Buddies.record(profile);
  if (!r.met[b.id]) { r.met[b.id] = true; save(); ui.dialogue([{ who, en: def.hello[0], vi: def.vi }, { who, en: def.hello[1] }], () => buddyTalk(b)); return; }
  const st = Buddies.state(profile, b.id), q = st.quest;
  if (st.status === 'ready') {
    const out = Buddies.turnIn(profile, b.id), gold = Save.capGold(profile, out.gold), e = Save.atCap(profile) ? 0 : learnExp(profile.stats.level, LEARN.gate); profile.stats.gold += gold; Save.addExp(profile, e); if (b.id === 'mai') profile.stats.hp = Math.min(Save.maxHp(profile), (profile.stats.hp ?? 0) + Buddies.MAI_HP);
    save(); refresh(); sfx('fanfare'); track('shopquest');
    const pages = b.id === 'kit' ? [{ who, en: 'Ha! Not bad at all. Give me your weapon… there. It hits a little harder now.', vi: `Xong việc của Kit: +${gold} vàng${e ? `, +${e} EXP` : ''}, vũ khí mạnh hơn mãi mãi (+${Buddies.KIT_ATK} công). Đã giúp Kit ${r.kit}/12 việc.` }]
      : [{ who, en: 'Thank you! Take this lucky charm. And here is a page of my diary.', vi: `Xong việc của Mai: +${gold} vàng${e ? `, +${e} EXP` : ''}, bùa may (+${Buddies.MAI_HP} máu mãi mãi). Đã giúp Mai ${r.mai}/12 việc.` }, { who: `📖 Mai's diary ${r.mai}/12`, en: out.page, vi: 'Nhật ký của Mai kể về cậu bé Hugh, người sau này thành Chúa tể Im Lặng.' }];
    ui.dialogue(pages, () => { const nx = Buddies.state(profile, b.id); if (nx.status === 'later') ui.toast(`${who} sẽ có việc mới khi con tới vùng tiếp theo.`); });
    return;
  }
  const no = Save.MAP_NO[L.NAME] || 1, land = Saga.LANDS[no - 1], hi = Buddies.greeting(b.id, { bossDown: !!(land && land.piece && profile.flags[land.piece]), level: profile.stats.level, cap: levelCap(profile) });
  const job = st.status === 'offer' ? 'Can I help you? · Bạn cần giúp gì không?' : st.status === 'active' ? `About your job… · Việc đang làm (${st.got}/${st.need})` : null;
  const opts = [...(job ? [job] : []), "Let's chat! · Trò chuyện", b.follow ? 'Wait here, please. · Bạn chờ ở đây nhé' : 'Come with me! · Đi cùng mình nhé', 'See you! · Tạm biệt'], base = job ? 0 : -1;
  ui.choose({ who, en: hi, vi: st.status === 'later' ? `${who} sẽ có việc mới khi con tới vùng tiếp theo.` : st.status === 'done' ? `Con đã giúp ${who} đủ 12 việc. Cảm ơn con!` : '' }, opts, (i) => {
    const k = i - base - 1;      // 0 chat, 1 walk, 2 bye (after the job line when there is one)
    if (job && i === 0) {
      if (st.status === 'offer') ui.choose({ who, en: q.en, vi: `Việc ${q.map}/12 của ${who}: ${q.vi}` }, ['OK, I will do it! · Nhận việc', 'Not now. · Để sau'], (j) => { if (j === 1) b.askT = 300; if (j === 0) { Buddies.accept(profile, b.id); save(); sfx('tick'); ui.toast(`Đã nhận việc của ${who}: ${q.vi}`); } });
      else ui.dialogue([{ who, en: q.en, vi: `${q.vi} Đã được ${st.got}/${st.need}.` }]);
    } else if (k === 0) buddyChat(b);
    else if (k === 1) { b.follow = !b.follow; b.followT = BUDDY_WALK; b.sayT = 40; ui.toast(b.follow ? `${who}: Great, let's go! · ${who} đi cùng con vài phút.` : `${who}: OK, I will wait here.`); if (!b.follow) placeBuddies(); }
  });
}
/** (27/11, turn 67) Another explorer met on the road: something about where they are going or what happened to them, or a question for the hero. */
function botTalk(bot, n) {
  const who = bot.name, zones = ZONES[L.NAME] || [], top = zones.reduce((m, z) => Math.max(m, (MONSTERS[z.kind] || {}).level || 0), 0);
  const fs = CrowdRules.favourState(profile, bot.id), f = fs.favour;      // (27/11, turn 68) a small favour, one for each land in all
  if (fs.status === 'ready') {
    const out = CrowdRules.favourTurnIn(profile, bot.id), gold = Save.capGold(profile, out.gold), e = Save.atCap(profile) ? 0 : learnExp(profile.stats.level, LEARN.bubbleOld); profile.stats.gold += gold; Save.addExp(profile, e); save(); refresh(); sfx('fanfare');
    ui.dialogue([{ who, en: f.thanks, vi: `Xong việc giúp ${who}: +${gold} vàng${e ? `, +${e} EXP` : ''}. Đã giúp các bạn thám hiểm ${CrowdRules.favoursDone(profile)}/${CrowdRules.FAVOURS.length} việc.` }]); return;
  }
  if (fs.status === 'offer' && !bot.asked) {
    bot.asked = true;      // asked once each time the hero comes to a land; after a "no" they just chat
    ui.choose({ who, en: f.en, vi: `${who} nhờ một việc nhỏ: ${f.vi}` }, ['Sure! · Được thôi', 'Sorry, not now. · Để sau nhé'], (j) => { if (j === 0) { CrowdRules.favourAccept(profile, bot.id); save(); sfx('tick'); ui.toast(`Đã nhận việc của ${who}: ${f.vi}`); } else ui.dialogue([{ who, en: 'No problem. See you around!' }]); }); return;
  }
  if (fs.status === 'active' && n % 2 === 0) { ui.dialogue([{ who, en: f.en, vi: `${f.vi} Đã được ${fs.got}/${fs.need}.` }]); return; }
  if (n % 3 === 2) { const c = Buddies.CHATS[(n + bot.id.length) % Buddies.CHATS.length]; ui.choose({ who, en: c.ask, vi: c.vi }, c.answers.map((a) => a[0]), (i) => { speak(c.answers[i][0], true); ui.dialogue([{ who, en: c.answers[i][1] }]); }); return; }
  const t = CrowdRules.tale(bot, { places: L.REGIONS[L.NAME].LANDMARKS || [], top, n }); ui.dialogue([{ who, en: t.en, vi: t.vi }]);
}
function buddyChat(b) {
  const who = b.who, r = Buddies.record(profile), list = Buddies.CHATS, n = (r.chatN = ((r.chatN || 0) + 1 + Math.floor(Math.random() * 2)) % list.length), c = list[n];
  ui.choose({ who, en: c.ask, vi: c.vi }, c.answers.map((a) => a[0]), (i) => {
    const today = Review.today(), day = r.chatDay || (r.chatDay = {}), first = day[b.id] !== today; let e = 0;
    if (first) { day[b.id] = today; e = Save.atCap(profile) ? 0 : learnExp(profile.stats.level, LEARN.bubbleOld); Save.addExp(profile, e); Save.recordSkill(profile, 'speaking', true, 0); save(); refresh(); }
    speak(c.answers[i][0], true); ui.dialogue([{ who, en: c.answers[i][1], vi: e ? `Trò chuyện với ${who}: +${e} EXP (lần đầu mỗi ngày).` : '' }]);
  });
}
// ---------------------------------------------------------------- (27/11, turn 65) a guest at home (rules: core/guests.js)
// Once a day a friend waits inside the house. F beside them: they ask three things in English: show me a piece, help me with a
// sentence (the grammar of their land's unit), put one piece next to another (arrange mode, B). The visit pays gold and EXP,
// and every new friend who has visited makes the home a little more comfortable.
const visitHint = () => (visit ? `💬 ${visit.guest.who} ${visit.i + 1}/${visit.tasks.length} · ${visit.tasks[visit.i].en}${visit.tasks[visit.i].kind === 'put' ? ' · B: sắp xếp đồ' : ' · F: chọn món đang đứng cạnh'}` : '');
function guestTalk() {
  const g = homeGuest; if (!g) return;
  if (!visit && profile.guestDay === Review.today()) { ui.dialogue([{ who: g.who, en: 'It was lovely to see your home. See you another day!', vi: 'Hôm nay con đã tiếp khách xong. Mai có khách khác tới.' }]); return; }
  if (visit) { const t = visit.tasks[visit.i]; speak(t.en, true); if (t.kind === 'grammar') visitGrammar(); else ui.dialogue([{ who: g.who, en: t.en, vi: t.vi }]); return; }
  const unit = g.unit, tasks = Guests.planVisit(room.list(), { grammar: grammarFor(profile.grade, unit, 10) });
  if (!tasks.length) { ui.dialogue([{ who: g.who, en: `${g.hi} Oh… it is a little empty here.`, vi: 'Nhà cần ít nhất 3 món đồ thì khách mới có chuyện để hỏi. Mua thêm đồ (phím L) nhé!' }]); return; }
  visit = { guest: g, tasks, i: 0, right: 0, gained: 0 };
  ui.dialogue([{ who: g.who, en: g.hi, vi: `${g.who} tới thăm nhà con và sẽ nhờ ${tasks.length} việc bằng tiếng Anh. Làm xong có quà!` }], () => visitStep());
}
function visitStep() {
  const v = visit; if (!v || !room || !room.walk) return;
  if (v.i >= v.tasks.length) {
    const r = Guests.finishVisit(profile, v.guest.id, Review.today()), gold = Save.capGold(profile, r.gold), e = Save.atCap(profile) ? 0 : learnExp(profile.stats.level, LEARN.chest); profile.stats.gold += gold; Save.addExp(profile, e);
    visit = null; homePanel.setHint(''); save(); refresh(); sfx('fanfare'); track('shopquest');
    ui.dialogue([{ who: v.guest.who, en: 'Thank you for having me! Your home is wonderful. Here is a little gift.', vi: `Xong chuyến thăm: +${gold} vàng${e + v.gained ? `, +${e + v.gained} EXP` : ''}${r.first ? `, +${HomePlay.FRIEND_POINTS} Ấm cúng (bạn mới tới thăm lần đầu)` : ''}. Mai sẽ có khách khác.` }], () => comfortNews());
    return;
  }
  const t = v.tasks[v.i]; speak(t.en, true); homePanel.setHint(visitHint());
  if (t.kind === 'grammar') visitGrammar(); else if (t.kind === 'put' && Guests.putDone(room.list(), t.a, t.b)) visitRight(); else ui.dialogue([{ who: v.guest.who, en: t.en, vi: t.vi }]);
}
function visitRight() {
  const v = visit; if (!v) return; sfx('correct'); const e = Save.atCap(profile) ? 0 : learnExp(profile.stats.level, LEARN.bubbleOld); Save.addExp(profile, e); v.gained += e; v.right += 1; v.i += 1; visitStep();
}
function visitGrammar() {
  const v = visit, g = v.tasks[v.i].item, order = [0, 1, 2].sort(() => Math.random() - 0.5), full = g.q.replace('___', g.options[g.a]);
  ui.choose({ who: v.guest.who, en: `Help me say this the right way: ${g.q}`, vi: 'Chọn dạng đúng điền vào chỗ trống.' }, order.map((i) => g.options[i]), (i) => {
    const ok = order[i] === g.a; Save.recordSkill(profile, 'grammar', ok, 0);
    if (ok) { speak(full, true); visitRight(); } else { sfx('wrong'); ui.dialogue([{ who: v.guest.who, en: full, vi: `${g.why} Mình sang việc tiếp nhé.` }], () => { v.i += 1; visitStep(); }); }
  });
}
function visitShow(id) {
  const v = visit, t = v.tasks[v.i], it = ITEMS[id]; room.flash(id);
  if (id === t.target) { Save.recordSkill(profile, 'listening', true, 0); ui.toast(`✔ ${it.en} = ${it.vi}`); visitRight(); return; }
  sfx('wrong'); Save.recordSkill(profile, 'listening', false, 0); speak(`That is the ${it.en.toLowerCase()}. ${t.en}`, true); ui.toast(`Đây là ${it.en} (${it.vi}). ${t.en}`);
}
/** A piece was put down: was it what the guest asked? */
function visitPut() { const v = visit; if (!v || !room || !room.walk) return; const t = v.tasks[v.i]; if (t.kind === 'put' && Guests.putDone(room.list(), t.a, t.b)) { if (room.editing) room.setEditing(false); ui.toast(`✔ ${ITEMS[t.a].en} next to the ${ITEMS[t.b].en.toLowerCase()}`); visitRight(); } }
/** (21/11) Into a child's house: the hero walks inside (world/homewalk.js); the list (L) and the arrange mode (B) are on top.
 *  keepList: the list stays open (after an upgrade or a new colour, the house is rebuilt around the hero). */
async function goHome(o, mine, keepList = false, admin = false) {
  if (o === profile) trophyNews();      // the trophies of beaten guards stand in the study
  const items = [...homesItems(o)]; await loadHomeModels(items); const was = room && room.walk ? { ...room.me } : null;
  homeOwner = o; homeMine = !!mine && o === profile; const keepFind = keepList ? findGame : null, keepVisit = keepList ? visit : null;
  let guest = null; const gdef = homeMine && !admin && !profile.admin ? (keepVisit ? keepVisit.guest : Guests.todayGuest(profile, Review.today())) : null;      // (27/11, turn 65) today's guest waits inside
  if (gdef) { try { const gm = await gltf(gdef.file), root = SkeletonUtils.clone(gm.scene); root.traverse((n) => { if (n.isMesh) n.material = n.material.clone(); }); const tn = (FRIENDS[gdef.id] || {}).tint; if (tn) tintBody(root, tn);
    guest = { root, clips: gm.animations.length ? gm.animations : (await gltf('chr_ngoc_adventurer_v04')).animations, def: gdef }; } catch (e) { console.warn('guest: ' + e.message); } }
  homeGuest = guest ? gdef : null;
  enterRoom('home', { items, model: homeModel, pieces: Saga.pieces(o), house: houseOf(o), editable: mine, avatar: { root: player.root, clips: Object.values(player.actions).map((a) => a.getClip()) },
    hint: (t) => homePanel.setHint(t || (findGame ? findHint() : visit ? visitHint() : '')), tag: homeTag, guest,
    onPlace: (id, at) => { setPlace(houseOf(o), id, at); save(); visitPut(); } });
  findGame = keepFind; visit = keepVisit;
  if (room && room.walk) { room.yaw0 = cam.yaw; if (was && was.f < houseOf(o).floors) Object.assign(room.me, { f: was.f, x: was.x, z: was.z, y: was.y, stair: was.stair }); }
  homePanel.show(o, mine, keepList, admin); if (!keepList && !mine) homePanel.hide();      // (24/11) the child sees the shop list as soon as they walk in (✕ closes it); a visitor only looks around
}
function enterRoom(kind, opts) { leaveRoom(); room = buildRoom(kind, opts); room.kind = kind; document.body.classList.add('inroom'); if (room.walk) { cam.minPitch = -0.6; cam.maxPitch = 1.45; } sfx('tick'); }
function leaveRoom() { if (!room) return; findGame = null; visit = null; homeGuest = null; room.dispose(); room = null; document.body.classList.remove('inroom'); cam.minPitch = 0.05; cam.maxPitch = 1.25; cam.tPitch = Math.min(1.25, Math.max(0.05, cam.tPitch)); }
/** (24/11) The admin removes a child: the profile goes, and with it the home, the things in it and the progress (all of it lives in the profile). */
// (27/11, turn 73) The daily copies of the save that the desktop app keeps: listed, read and taken back from the admin panel.
const adminBackups = () => { const d = globalThis.eqDesktop; if (!d || !d.backups) return null; try { return d.backups() || []; } catch { return []; } };
const adminBackupRead = (name) => { try { return globalThis.eqDesktop.readBackup(name) || ''; } catch { return ''; } };
function adminRestore(name, id) {
  const d = globalThis.eqDesktop, text = adminBackupRead(name);
  Save.backupInfo(text).find((k) => k.id === id).id;          // throws before anything is touched when the copy or the child cannot be read
  try { Save.persist(store); } catch (e) { console.warn('save failed', e); }      // the file holds the game as it is now…
  try { if (d.keepCopy) d.keepCopy(); } catch (e) { console.warn('copy before restore failed', e); }      // …and that file is put aside
  const p = Save.restoreProfile(store, text, id); Save.persist(store); if (homes) homes.refresh(true); return p;
}
function adminDelete(id) { const i = store.profiles.findIndex((p) => p.id === id && !p.admin); if (i < 0) return; store.profiles.splice(i, 1); if (store.last === id) store.last = profile.id; try { Save.persist(store); } catch (e) { console.warn('save failed', e); } if (homes) homes.refresh(true); }
function adminPlaces() {
  const out = [], add = (region, name, x, z) => out.push({ region, name, x, z });
  for (const r of ['village', 'forest', 'harbor', 'isle', ...LAND_IDS]) for (const l of L.REGIONS[r].LANDMARKS) add(r, l.label, ...(l.spot || [l.x, l.z]));
  add('village', 'Tom', 2.6, 9.6); add('village', 'Cửa hàng', SHOP_DOOR.x - 1, SHOP_DOOR.z); add('village', 'Cú Mèo', OWL.x, OWL.z + 1.2); add('village', 'Bảng săn quái', BOARD.x + 1.2, BOARD.z + 1);
  for (const st of STARTS) add(st.region || 'village', 'Trò: ' + st.sign.replace(/^\S+\s/, ''), st.x + 0.8, st.z + 0.8);
  add('village', 'Nhà của các con', HOMES[0].door[0] + 2, HOMES[0].door[1] + 1.5); add('village', 'Cửa hàng nội thất', FURNITURE.door[0] + 1.5, FURNITURE.door[1]);
  add('village', 'Quầy rau quả', STALLS.produce.at[0] + 0.5, STALLS.produce.at[1]); add('village', 'Quầy nhạc cụ', STALLS.music.at[0] + 0.5, STALLS.music.at[1]); add('village', 'Tiệm may cô Mia', STALLS.tailor.at[0], STALLS.tailor.at[1] - 0.6);
  add('village', 'Vua Slime', BOSS_AT.x, BOSS_AT.z - 4);  add('village', 'Rương Đồng Hoang', CHEST_SPOTS[0][0], CHEST_SPOTS[0][1] - 1.5);
  add('forest', 'Cổng vào rừng', L.REGIONS.forest.SPAWN.x, L.REGIONS.forest.SPAWN.z); add('forest', 'Bảng săn quái rừng', FOREST_BOARD.x + 1.2, FOREST_BOARD.z + 0.6);
  add('forest', 'Nữ hoàng Nấm', BOSS3_AT.x + 6, BOSS3_AT.z); add('forest', 'Golem Cổ', BOSS2_AT.x, BOSS2_AT.z - 4); add('forest', 'Rương rừng', FOREST_CHESTS[0][0], FOREST_CHESTS[0][1] - 1.5);
  add('harbor', 'Bảng săn quái cảng', HARBOR_BOARD.x + 1.2, HARBOR_BOARD.z + 1.4); add('harbor', 'Bãi cua (bờ Nam)', 12, 42); add('harbor', 'Bờ sứa (phía Bắc)', 14, -24); add('harbor', 'Mũi cướp biển', 30, -34);
  add('harbor', 'Quầy Willow (đồ cấp 6–10)', HARBOR.shop.x + 1.6, HARBOR.shop.z + 1.2); add('harbor', 'Thuyền trưởng Bạch Tuộc', BOSS4_AT.x, BOSS4_AT.z + 5); add('harbor', 'Rương cảng', HARBOR_CHESTS[0][0], HARBOR_CHESTS[0][1] - 1.5);
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
/** (24/11) The toll of every mini game: gold to enter (`gameFee`) AND the right answers, words and verb forms mixed: N questions, a word's meaning
 *  (read aloud after a right answer) or a sentence with a gap to fill with the right verb form (grammar.js). A game pays nothing afterwards. */
function gameGate(who, game, then, N = 3) {
  const fee = gameFee(game, profile.stats.level);
  if (profile.stats.gold < fee) { sfx('wrong'); ui.dialogue([{ who, en: `It costs ${fee} gold to play. Come back with more gold!`, vi: `Vào chơi tốn ${fee} vàng, con mới có ${profile.stats.gold}. Đi đánh quái hoặc làm nhiệm vụ để kiếm thêm nhé!` }]); return; }
  const pool = unitCards.filter((c) => c.word.length <= 22), mix = (a) => [...a].sort(() => Math.random() - 0.5), gram = grammarFor(profile.grade, Save.unitOf(profile), 1);
  const nVocab = pool.length >= 4 ? N - gram.length : 0;
  const known = (c) => profile.words[c.id] && profile.words[c.id].right > 0;
  const last = (profile.gateLast || {})[who] || [], fresh = pool.filter((c) => !last.includes(c.id)), src = fresh.length >= nVocab ? fresh : pool;
  const words = [...mix(src.filter((c) => !known(c))), ...mix(src.filter(known))].slice(0, nVocab); (profile.gateLast || (profile.gateLast = {}))[who] = words.map((c) => c.id);
  const qs = [...words.map((c) => ({ c })), ...gram.map((g) => ({ g }))];
  let missed = 0;
  const go = (free) => { if (!free) profile.stats.gold -= fee; save(); refresh(); sfx('fanfare'); then(); };
  if (!qs.length) { go(); return; }
  const ask = (n) => {
    if (n >= qs.length) {      // (26/11) every answer right at the first try: the game is free, and the first time today for this game it pays EXP
      const day = Review.today(), gd = profile.gateDay && profile.gateDay.day === day ? profile.gateDay : (profile.gateDay = { day, done: {} });
      const bonus = !missed && !gd.done[game] && !Save.atCap(profile) ? learnExp(profile.stats.level, LEARN.gate) : 0; if (bonus) { gd.done[game] = true; Save.addExp(profile, bonus); }
      sfx('fanfare'); ui.dialogue([{ who, en: missed ? "Good! Now let's play!" : "Perfect! This game is free for you!", vi: missed ? `Con trả lời xong ${qs.length} câu rồi. Trả ${fee} vàng và vào chơi thôi!` : `Đúng cả ${qs.length} câu ngay lần đầu: MIỄN PHÍ lượt này${bonus ? `, +${bonus} EXP` : ''}!` }], () => go(!missed)); return; }
    const q = qs[n], head = `${who} · ${n + 1}/${qs.length}`, t0 = Date.now();
    if (q.g) {      // a verb form in a sentence
      const opts = mix(q.g.options.map((o, i) => ({ o, ok: i === q.g.a })));
      ui.choose({ who: head, en: q.g.q, vi: 'Chọn từ đúng điền vào chỗ trống.' }, opts.map((x) => x.o), (i) => {
        const ok = opts[i].ok; Save.recordSkill(profile, 'grammar', ok, 0); sfx(ok ? 'correct' : 'wrong');
        if (ok) ask(n + 1); else { missed += 1; ui.dialogue([{ who, en: q.g.q.replace('___', q.g.options[q.g.a]), vi: q.g.why }], () => ask(n)); }
      });
      return;
    }
    const c = q.c, opts = mix([c, ...mix(pool.filter((x) => x.id !== c.id && x.vi !== c.vi)).slice(0, 2)]);
    ui.choose({ who: head, en: `What does "${c.word}" mean?`, vi: 'Trả lời đúng để vào chơi.' }, opts.map((o) => o.vi), (i) => {
      const ok = opts[i].id === c.id; Review.record(profile.words, c.id, { correct: ok, hints: 0, ms: Date.now() - t0 }); Save.recordSkill(profile, 'vocabulary', ok, 0); sfx(ok ? 'correct' : 'wrong');
      if (ok) readOut(c, () => ask(n + 1), () => ask(n + 1)); else { missed += 1; } if (!ok) ui.dialogue([{ who, en: `"${c.word}" means "${c.vi}". Try again!`, vi: `${c.word} = ${c.vi}` }], () => ask(n));
    });
  };
  ui.dialogue([{ who, en: `Playing costs ${fee} gold. Answer ${qs.length} questions first!`, vi: `${who}: phí chơi ${fee} vàng. Trả lời ${qs.length} câu tiếng Anh trước: đúng cả ${qs.length} ngay lần đầu thì ĐƯỢC CHƠI MIỄN PHÍ và có EXP.` }], () => (words.length ? teach(words, () => ask(0)) : ask(0)));
}
function hostQuiz(who, words) {
  const pool = unitCards.length >= 4 ? unitCards : words, list = [...words].sort(() => Math.random() - 0.5).slice(0, 3); let right = 0;
  const ask = (n) => {
    if (n >= list.length) { save(); refresh(); sfx(right ? 'fanfare' : 'tick');      // (24/11) a review after a game pays nothing
      ui.dialogue([{ who, en: right === list.length ? 'Perfect! You remember every word!' : `You got ${right} of ${list.length}. Well done!`, vi: 'Ôn lại từ vừa gặp trong trò chơi. Giỏi lắm!' }]); return; }
    const c = list[n], opts = [c, ...pool.filter((x) => x.id !== c.id && x.vi !== c.vi).sort(() => Math.random() - 0.5).slice(0, 2)].sort(() => Math.random() - 0.5), t0 = Date.now();
    ui.choose({ who: `${who} · ${n + 1}/${list.length}`, en: `What does "${c.word}" mean?`, vi: 'Từ con vừa gặp trong trò chơi.' }, opts.map((o) => o.vi), (i) => {
      const ok = opts[i].id === c.id; if (ok) right += 1; Review.record(profile.words, c.id, { correct: ok, hints: 0, ms: Date.now() - t0 }); sfx(ok ? 'correct' : 'wrong');
      if (ok) ask(n + 1); else ui.dialogue([{ who, en: `"${c.word}" means "${c.vi}".` }], () => ask(n + 1));
    });
  };
  ui.dialogue([{ who, en: 'Before you go: do you remember the words from the game?', vi: `${who} hỏi lại ${list.length} từ con vừa gặp (chỉ để ôn, không có thưởng).` }], () => ask(0));
}
/** A word sparkle was touched: teach one word (a new one first, else one met before), with a small reward. */
function learnWord(card, isNew, use) {
  if (!card) { ui.dialogue([{ who: 'Pip', en: 'This bubble is empty…', vi: `Từ vựng Unit ${Save.unitOf(profile)} lớp ${profile.grade} chưa có.` }]); save(); return; }
  (profile.seen || (profile.seen = {}))[card.id] = Review.today();
  const exp = Save.atCap(profile) ? 0 : learnExp(profile.stats.level, isNew ? LEARN.bubbleNew : LEARN.bubbleOld), gold = isNew ? 2 : 1, who = isNew ? '✨ Từ mới' : '🔁 Ôn lại';
  const reward = (note) => { track('bubble'); if (L.NAME === 'harbor') track('sea_bubble'); profile.stats.gold += gold; Save.addExp(profile, exp); sfx('correct'); save(); refresh(); if (use) use(); return `${note} (+${gold} vàng${exp ? `, +${exp} EXP` : ''})`; };      // (26/11) learning a word fills the bar too
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
  if (online && online.code) online.leave();      // another child at this machine: the room is left
  if (notesUI && notesUI.open) notesUI.hide();
  leaveRoom(); if (intro) { intro.active = false; if (intro.boat) intro.boat.visible = false; } playT = 0; restN = 0;      // (26/11) nothing of the player before stays (their room, the opening boat)
  unlock(); profile = p; store.last = p.id; started = false; shownLevel = 0;
  if (p.flags.forest_open && !p.flags.badge1) p.flags.badge1 = true;      // saves from before the badge: Tom already opened the forest
  ui.hero = p.name;      // lines written for 'Ngọc' are spoken by the child's own hero (19/11)
  if (p.admin) Object.assign(p.flags, { arrived: true, forest_open: true, map2: true });      // the admin may enter every map (18/11)
  learning(p, await loadGrade(p.grade));                                   // this grade only
  wear(profile); setSword(); setWear(); syncPet();
  if ((story.step === 'open' || story.step === 'done') && !p.flags.bridge_fixed) p.flags.bridge_fixed = true;   // saves from before the bridge quest
  applyBridge();
  $('mapbox').classList.remove('hidden');
  await enterRegion(isLand(p.region) && (p.admin || WORLD.canGo(p, LAND[p.region].from, p.region).ok) ? p.region : p.region === 'forest' && p.flags.forest_open ? 'forest' : (p.region === 'harbor' || p.region === 'isle') && p.flags.map2 ? p.region : 'village');
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
const JEWEL = new Set(['necklace', 'earrings', 'tiara', 'hairclip']);      // by accessory type (WR.typeOf)
/** (25/11) The styles drawn for the hero (WR.STYLES) are in her own coordinates: no HERO_FIT. The first bracelet has its own hero file, and on her it hangs on the forearm (the hand turns more). */
const heroFile = (kind) => (avatarKind === 'hero' && kind === 'bracelet' ? 'bracelet_hero' : kind);
const accBone = (kind) => (avatarKind === 'hero' && WR.typeOf(kind) === 'bracelet' ? /^forearm.?L$/ : ACC_BONE[WR.typeOf(kind)]);
/** (25/11) The accessories (acc_*_v01.glb) are placed at fixed spots made for Ngọc; the Tripo hero's head is higher and bigger, so for her the piece is
 *  raised `dy` and scaled `s` about the point (py, pz). Tuned by eye (tests/hero_wardrobe.mjs); `globalThis.__heroFit` overrides it for tuning. */
const HERO_FIT = {
  glasses: { dy: 0.3, s: 0.85, sz: 1.2, dz: 0.04, py: 1.05, pz: -0.1 }, hat: { dy: 0.18, s: 0.9, py: 1.35, pz: -0.1 }, tiara: { dy: 0.17, s: 1.1, py: 1.35, pz: -0.1 }, headband: { dy: 0.22, s: 1.1, py: 1.35, pz: -0.1 },
  bow: { dy: 0.3, s: 0.85, py: 1.25, pz: -0.1 }, hairclip: { dy: 0.28, s: 1, py: 1.3, pz: -0.1 }, earrings: { dy: 0.3, s: 1, py: 1.2, pz: -0.1 },
  scarf: { dy: 0.33, s: 1, py: 0.95, pz: 0 }, necklace: { dy: 0.33, s: 1, py: 0.95, pz: 0 } };
const heroFit = (kind) => (globalThis.__heroFit && globalThis.__heroFit[kind]) || HERO_FIT[kind] || null;
const accScene = {};                       // kind -> loaded glTF scene, or null when the file is missing (the shapes from outfit.js take over)
let lookShown = [], faceShown = '';
/** (25/11) The body: Ngọc (older saves) or the Tripo hero (profile.avatar === 'hero', the default of new players). The model is swapped in place. */
const AVATAR_FILES = { hero: 'chr_hero_v01', girl1: 'chr_girl1_v01', girl2: 'chr_girl2_v01' };      // (26/11) Ruby and the two new Tripo girls (Luna, Mika): painted outfits, own rig on Ngọc's bones
let avatarKind = 'ngoc', ngocGltf = null, swappingAvatar = false; const outlined = new WeakSet();
const avatarFailed = {};
async function swapAvatar(kind) {
  if (swappingAvatar || !player) return; swappingAvatar = true;
  try {
    if (!ngocGltf) ngocGltf = { scene: player.root, animations: Object.values(player.actions).map((a) => a.getClip()) };
    const g = AVATAR_FILES[kind] ? await gltf(AVATAR_FILES[kind]) : ngocGltf;
    player.setModel(g); avatarKind = kind;
    if (!outlined.has(player.root)) { outlined.add(player.root); addOutline(player.root, kind !== 'ngoc' ? { thick: 0.005 } : undefined); }
    if (kind !== 'ngoc' && !player.root.userData.lit) { player.root.userData.lit = true; player.root.traverse((o) => { if (o.isMesh && !o.userData.outline && o.material && o.material.color) o.material.color.setScalar(1.15); }); }      // (25/11) the Tripo textures read darker than the painted world: +15 %
    if (kind === 'ngoc') { tintBody(player.root, NGOC_COLORS); }
    setSword(); setWear();
  } catch (e) { console.warn('avatar', e); avatarFailed[kind] = true; } finally { swappingAvatar = false; }      // (26/11) a model that cannot load is not tried again (it froze the page in an endless loop): the hero stays as she is
  applyLook();
}
function applyLook() {
  if (!player || !profile) return;
  const wantAvatar = AVATAR_FILES[profile.avatar] && !avatarFailed[profile.avatar] ? profile.avatar : 'ngoc'; if (wantAvatar !== avatarKind && !avatarFailed[wantAvatar]) { swapAvatar(wantAvatar); return; }
  for (const o of lookShown) o.removeFromParent(); lookShown = [];
  const root = player.root, bone = (re) => { let b = null; root.traverse((o) => { if (!b && o.isBone && re.test(o.name)) b = o; }); return b; };
  const worn = WR.wardrobe(profile).worn, val = (slot) => { const it = worn[slot] && WR.parse(worn[slot]); return it ? it.color : null; }, paint = (n, d) => (n && (WCOL[n] || WR.JEWEL_HEX[n])) || d;
  const kindOf0 = (slot) => { const it = worn[slot] && WR.parse(worn[slot]); return it ? it.kind : null; };
  const look = lookOf(profile); tintSkin(root, look.skin);
  if (profile.look) { const want = look.face + '|' + look.skin; if (faceShown !== want) { faceShown = want; faceMaps(look.face, look.skin).then((m) => { if (faceShown === want) player.setFaces(m); }, (e) => console.warn(e.message)); } }
  else if (faceShown) { faceShown = ''; player.setFaces(player.firstFaces); }
  const dress = val('body');
  tintBody(root, { hair: paint(val('haircolor'), NGOC_COLORS.hair), top: paint(dress || val('top'), NGOC_COLORS.top), bottom: paint(dress || val('bottom'), NGOC_COLORS.bottom) });
  setHairStyle(root, val('style') || 'short');
  if (avatarKind === 'hero') {      // (25/11) the hero's clothes and hair are painted textures: recoloured in the shader (game/herotint.js)
    const hc = (slot) => (val(slot) ? paint(val(slot)) : null), tp = hc('body') || hc('top');
    tintHero(root, { top: tp, bottom: hc('body') || hc('bottom'), sleeves: tp, boots: kindOf0('feet') === 'boots' ? hc('feet') : null, hair: hc('haircolor') });
  }
  if (avatarKind !== 'ngoc' && avatarKind !== 'hero') { syncOutlines(root); return; }      // (26/11) the two new girls wear their painted outfit; clothes and accessories for them come later
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
  setGoggles(root, !['hat', 'tiara'].includes(WR.typeOf(kindOf('head'))) && !(avatarKind === 'hero' && (kindOf('face') || kindOf('hair'))));
  syncOutlines(root);
  let skinned = null; root.traverse((o) => { if (!skinned && o.isSkinnedMesh) skinned = o; });
  const hang = (obj, b, kind) => { const i = skinned ? skinned.skeleton.bones.indexOf(b) : -1; if (i >= 0) { obj.matrix.copy(skinned.skeleton.boneInverses[i]); const f = avatarKind === 'hero' && !WR.heroOnly(kind) && kind !== 'bracelet' && heroFit(kind); if (f) { const sz = f.sz || f.s, S = new THREE.Matrix4().makeScale(f.s, f.s, sz), T = new THREE.Matrix4().makeTranslation(0, f.dy + (1 - f.s) * f.py, (f.dz || 0) + (1 - sz) * f.pz); obj.matrix.multiply(T).multiply(S); } obj.matrix.decompose(obj.position, obj.quaternion, obj.scale); } b.add(obj); lookShown.push(obj); };
  for (const id of Object.values(worn)) {
    const it = id && WR.parse(id); if (!it) continue;
    if (PROC_ONLY.has(it.kind)) { for (const part of outfitParts(it.kind, it.color)) { const b = bone(part.bone); if (b) { b.add(part.obj); lookShown.push(part.obj); } } continue; }
    if (it.kind === 'boots') continue;      // (21/11) the body's own boots, recoloured above
    const shoeLike = { hightops: [1.12, 1.05, 1.08], flats: [1.0, 0.55, 1.0], sandals: [1.04, 0.3, 1.04] }[it.kind];      // the sneaker file, reshaped
    if (WR.heroOnly(it.kind) && avatarKind !== 'hero') continue;      // the styles of the hero are not drawn for Ngọc
    if (!accBone(it.kind) && !['shoes'].includes(it.kind) && !shoeLike) continue;
    const fileKey = heroFile(it.kind), src = accScene[shoeLike ? 'shoes' : fileKey];
    if (shoeLike && !src) continue;
    if (src) {
      const clone = src.clone(true);
      if (JEWEL.has(WR.typeOf(it.kind))) { const metal = WR.JEWEL_HEX[it.color]; tintAccessory(clone, metal || WR.JEWEL_HEX.gold, metal ? new THREE.Color(metal).multiplyScalar(0.8).getStyle() : (WCOL[it.color] || '#ffffff')); } else tintAccessory(clone, WCOL[it.color] || '#ffffff');
      for (const c of [...clone.children]) { const side = /_([LR])$/.exec(c.name); const b = bone(it.kind === 'shoes' || shoeLike ? new RegExp(`^foot.?${side ? side[1] : 'L'}$`) : accBone(it.kind)); if (b) { c.removeFromParent(); hang(c, b, it.kind); if (shoeLike) { const sc = new THREE.Group(); c.parent.add(sc); sc.position.copy(c.position); sc.quaternion.copy(c.quaternion); c.position.set(0, 0, 0); c.quaternion.identity(); sc.add(c); sc.scale.set(...shoeLike); lookShown.push(sc); } } }
    } else if (src === undefined) {
      accScene[fileKey] = null;
      staticModel(`acc_${fileKey}_v01`).then((m) => { accScene[fileKey] = m; applyLook(); }, () => {});
      if (!WR.heroOnly(it.kind)) for (const part of outfitParts(it.kind, it.color)) { const b = bone(part.bone); if (b) { b.add(part.obj); lookShown.push(part.obj); } }      // shapes until the file arrives
    } else if (!WR.heroOnly(it.kind)) for (const part of outfitParts(it.kind, it.color)) { const b = bone(part.bone); if (b) { b.add(part.obj); lookShown.push(part.obj); } }
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
    save(); holdAnnounce = true; refresh(); holdAnnounce = false;      // (26/11) the owl speaks first; frame() opens the map announcement when her talk is closed
    if (g.pass) { ui.dialogue([{ who: 'Owl', en: L0 === 20 ? `Wonderful! ${g.right} of ${g.total}. You have finished the Forest of Memories!` : `Wonderful! ${g.right} of ${g.total}. The next land is open to you!`, vi: L0 === 20 ? `Con đúng ${g.right}/${g.total}, qua bài thi cuối Rừng Ký Ức! Vùng tiếp theo (Sa mạc cát vàng) sắp mở.` : `Con làm đúng ${g.right}/${g.total}, qua bài thi rồi. Vùng mới đã mở!` }]); return; }
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
      save(); holdAnnounce = true; refresh(); holdAnnounce = false;
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
  for (const b of buddies) if (!b.follow && b.mode === 'come' && b.npc.root.visible && near(b.npc.x, b.npc.z, 2.6)) return { text: `E · ${b.who} muốn nói chuyện với con`, run: () => buddyTalk(b) };      // (27/11) only a friend who has walked up to the hero comes first; one who just stands near no longer takes E from the owl, a shop or a chest
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
    if (near(H.boutique.door[0] + 1, H.boutique.door[1], 2.0)) return { text: 'E · Style Boutique: trò thời trang với cô Mia', run: () => gameGate('Mia', 'style', () => { const t = tierOf(profile.stats.level); arcade.start(withTier(styleGame(Math.random, t), t)); }) };
    if (near(H.cafe.door[0] + 1, H.cafe.door[1], 2.0)) return { text: 'E · Seaside Café: trò nấu ăn với đầu bếp Leo', run: () => gameGate('Leo', 'cafe', () => { const t = tierOf(profile.stats.level); arcade.start(withTier(cafeGame(Math.random, t), t)); }) };
    if (near(H.salon.door[0], H.salon.door[1] + 1, 2.0)) return { text: 'E · Beauty Salon: trò làm đẹp với chị Ruby', run: () => gameGate('Ruby', 'salon', () => { const t = tierOf(profile.stats.level); arcade.start(withTier(salonGame(Math.random, t), t)); }) };
    if (near(H.isle.x, H.isle.z, 2.3)) return { text: 'E · Đi thuyền tới Đảo Kho Báu', run: () => enterRegion('isle') };
    if (near(H.market.x, H.market.z - 1.2, 3.4)) { const n = Sea.bucketCount(profile); return { text: n ? `E · Bán ${n} món trong xô cá ở chợ cá` : 'E · Chợ cá (xô cá đang trống)', run: sellFish }; }
    if (near(H.shop.x + 1.6, H.shop.z + 0.6, 2.4)) return { text: "E · Quầy của Willow (đồ cấp 6–10)", run: () => { enterRoom('forest'); shopWin.show("Willow's Harbor Stall", ['harbor']); } };
    if (near(sam.x, sam.z, 3)) return { text: 'E · Nói chuyện với Sam', run: () => ui.dialogue([{ who: 'Sam', en: 'Welcome to Sunny Harbor! The sea is big and blue.', vi: 'Chào mừng tới Cảng Mặt Trời (Map 2)! Ghé Style Boutique bên trái quảng trường nhé.' }]) };
    for (const f of [mini, wild, chests, spots]) { const c = f && f.interact(p); if (c) return c; }
    return null;
  }
  if (isLand(L.NAME)) {
    const d = LAND[L.NAME];
    for (const f of friends) if (f.region === L.NAME && near(f.npc.x, f.npc.z, 2.8)) {
      if (f.role === 'keeper') return { text: `E · Nói chuyện với ${f.who}`, run: () => keeperTalk(L.NAME) };
      if (f.role === 'owl') return { text: 'E · Cú Mèo: ôn tập và bài thi', run: () => owlReview() };
    }
    if (near(d.shopAt[0], d.shopAt[1], 2.6)) { const m = friends.find((f) => f.region === L.NAME && f.role === 'merchant'); return { text: `E · Cửa hàng của ${m ? m.who : 'thương nhân'} (vũ khí, giáp, thuốc)`, run: () => ui.dialogue((m ? m.lines : []).map((en) => ({ who: m.who, en })), () => { enterRoom('forest'); shopWin.show(`${m ? m.who : 'Merchant'}'s Shop`, [L.NAME, 'healer', 'rose'], { [L.NAME]: { name: m ? m.who : 'Merchant', icon: '🧳', title: `🧳 ${m ? m.who : 'Merchant'}'s goods`, sub: `Gear and souvenirs of this land · vũ khí, giáp và quà lưu niệm của ${d.vi}`, talk: m ? m.lines : [] } }); }) }; }
    for (const f of [mini, wild, chests, spots]) { const c = f && f.interact(p); if (c) return c; }      // (27/11, turn 68) mini was missing: the game masters of maps 4-12 could not be spoken to
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
    if (near(FOREST_SHOP.x + 1.6, FOREST_SHOP.z + 0.6, 2.4)) return profile.flags.map2 ? { text: "E · Cửa hàng của Willow (đồ cấp 11–20)", run: () => { enterRoom('forest'); shopWin.show("Willow's Camp Shop", ['forest']); } } : { text: 'Willow đang soạn hàng: đồ Map 2 sẽ bán ở Cảng Mặt Trời', run() {} };
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
  if (L.NAME === 'village' && near(VILLAGE_DOCK[0], VILLAGE_DOCK[1], 2.4)) return profile.flags.map2 ? { text: 'E · Đi thuyền tới Cảng Mặt Trời (Map 2)', run: () => enterRegion('harbor') } : { text: 'Bến thuyền: mở Map 2 để đi Cảng Mặt Trời', run: () => ui.toast(WORLD.canGo(profile, 'village', 'harbor').missing.join(' ') || 'Biển cả đã mở.') };
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
  { const c = crowd && crowd.interact(player.pos); if (c) return c; }      // (27/11, turn 67) another explorer
  { const fp = peers && online && online.on && peers.near(player.pos); if (fp) return { text: `E · Chào ${fp.n} (Hello!)`, run: () => online.say(0) }; }      // (27/11, turn 69) a friend of the room
  for (const b of buddies) if (b.npc.root.visible && near(b.npc.x, b.npc.z, 2.6)) return { text: `E · Nói chuyện với ${b.who}`, run: () => buddyTalk(b) };      // a friend walking along: only when nothing else is in reach
  return null;
}
function onKey(e) {
  if (!started) return;
  if (e.code === 'F1') { if (notesUI && profile && profile.admin) notesUI.toggle(); else if (profile) ui.toast('Sổ góp ý (F1) chỉ mở trong tài khoản Quản trị'); e.preventDefault(); return; }      // (27/11, turn 72) the admin's review notes
  if (player && player.swim && !e.repeat && !ui.modal) {      // (20/11) in deep water a tap on a move key is a stroke too
    const ix = e.code === 'KeyA' || e.code === 'ArrowLeft' ? -1 : e.code === 'KeyD' || e.code === 'ArrowRight' ? 1 : 0, iz = e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space' ? 1 : e.code === 'KeyS' || e.code === 'ArrowDown' ? -1 : 0;
    if (ix || iz) { player.keyStroke(ix, iz, cam.yaw); e.preventDefault(); return; }
  }
  if (arcade && arcade.key(e.code)) { e.preventDefault(); return; }
  if (shopWin && shopWin.key(e.code)) { e.preventDefault(); return; }
  if (music && music.key(e.code)) { e.preventDefault(); return; }
  if (journal && !ui.busy && journal.key(e.code)) { e.preventDefault(); return; }
  if (room && ui.busy) { if (ui.key(e)) e.preventDefault(); return; }      // (27/11) a talk inside a house takes the keys: E used to shut the talk AND leave the house
  if (room && room.walk && !(homePanel && homePanel.open) && !ui.busy && !room.editing && (e.code === 'KeyF' || e.code === 'KeyG')) { if (e.code === 'KeyF') homeTouch(); else homeFind(); e.preventDefault(); return; }      // (27/11) F: the name of the thing, G: Find it!
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
  if (onlineUI && onlineUI.key(e.code)) { e.preventDefault(); return; }
  if (e.code === 'KeyY' && profile && online && online.ready && !ui.modal) { onlineUI.show(); sfx('tick'); e.preventDefault(); return; }      // (27/11, turn 69) the room panel
  if (e.code === 'KeyC' && profile && online && online.on && !ui.busy) { onlineUI.showSay(); e.preventDefault(); return; }      // the ready-made lines
  if (e.code === 'KeyM' && profile && trPanel && L.NAME === 'isle') { trPanel.show(); sfx('tick'); e.preventDefault(); return; }
  if (e.code === 'KeyO' && profile && worldUI) { if (worldUI.open) worldUI.hide(); else openWorldMap(); e.preventDefault(); return; }      // (24/11) world map
  if (e.code === 'KeyP' && profile && petPanel) { petPanel.show(); sfx('tick'); e.preventDefault(); return; }      // (21/11) pets from Map 1 too
  if (e.code === 'KeyU' && profile && wardPanel) { wardPanel.show(); sfx('tick'); e.preventDefault(); return; }      // (20/11) the wardrobe moved from V to U: V is the bag now
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
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;      // typing a room code or a review note is not playing
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
  fishing = new Fishing({ scene, player, ui, sfx, profile: () => profile, tier: () => tierOf(profile.stats.level), speak: (en) => speak(en, true, 0.85), onCatch: onFishCaught, gate: (go) => gameGate('Sam', 'fishing', go), loadStatic: staticModel, loadAnimated: animatedModel });      // (23/11) four new words before fishing, the user's boat, rod, float and fish
  tom = new Npc(tomG, 2.6, 7.6, -0.4); sam = new Npc(samG, 14, 17, 1.2); ben = new Npc(benG, BEN_MARKET.npc[0], BEN_MARKET.npc[1], Math.PI / 2); scene.add(tom.root, sam.root, ben.root);
  pip = new Pip(pipG.scene); scene.add(pip.root);
  const usedFiles = new Set();      // two friends may share a model file (Mia uses Rose's): the second gets its own copy
  let oldRigClips = null; for (const f of Object.values(FRIENDS)) { let g = await gltf(f.file); if (usedFiles.has(f.file)) { const sc = SkeletonUtils.clone(g.scene); sc.traverse((o) => { if (o.isMesh) o.material = o.material.clone(); }); g = { ...g, scene: sc }; } usedFiles.add(f.file); if (!g.animations.length && !oldRigClips) { try { oldRigClips = (await gltf('chr_ngoc_adventurer_v04')).animations; } catch (e) { oldRigClips = []; } } let bun = false; g.scene.traverse((o) => { if (o.isBone && o.name === 'bun') bun = true; }); const npc = new Npc(g, ...f.at, bun && oldRigClips && oldRigClips.length ? oldRigClips : ngoc.animations); if (f.tint) tintBody(npc.root, f.tint); scene.add(npc.root); friends.push({ ...f, npc }); }      // (25/11) Lily, Rose, Anna are on the OLD skeleton (v04, with a 'bun' bone): Ngọc v05's clips lifted their hips and folded their legs away
  // (27/11, turn 66) the hero's two friends, Kit and Mai (core/buddies.js): borrowed models at a child's size until their own arrive
  for (const [id, file, tint, mul] of [['kit', 'npc_sam_fisherman_v02', null, [0.75, 0.95, 1.25]], ['mai', 'npc_mia_tailor_v01', { hair: '#2a2030', top: '#ffd24a', bottom: '#3f6fc6' }, null]]) {
    try { const g = await gltf(file), sc = SkeletonUtils.clone(g.scene); sc.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); if (mul) o.material.color.multiply(new THREE.Color(...mul)); } });
      const npc = new Npc({ scene: sc, animations: g.animations }, 0, 0, 0, ngoc.animations); if (tint) tintBody(npc.root, tint); npc.root.scale.setScalar(0.84); npc.hide(); scene.add(npc.root);
      buddies.push({ id, who: Buddies.BUDDIES[id].who, npc, follow: false, followT: 0, sayT: 60, mode: 'roam', home: [0, 0], tx: 0, tz: 0, idleT: 0, askT: 30, called: false, callT: 0, why: '' }); } catch (e) { console.warn('buddy ' + id + ': ' + e.message); }
  }
  crowd = new Crowd({ scene, load: gltf, label, tint: tintBody, fallbackClips: ngoc.animations, onHello: (bot, line) => { if (!ui.busy) ui.toast(`${bot.name}: ${line}`); }, onTalk: (bot, n) => botTalk(bot, n) }); await crowd.init();      // (27/11, turn 67) three other young explorers on the roads
  peers = new Peers({ scene, body: peerBody, label, dress: dressPeer, clips: ngoc.animations });      // (27/11, turn 69) playing together
  online = new Online({ server: onlineServer, region: netRegion, peers, toast: (t) => ui.toast(t), speak: (en) => speak(en),
    me: () => ({ n: profile ? profile.name : 'Friend', lv: profile ? profile.stats.level : 1, look: profile ? netLook() : {}, r: netRegion() }),
    place: () => (started && profile && !room ? { x: player.pos.x, z: player.pos.z, h: player.pos.y, y: player.root.rotation.y, a: animCode(player.current) } : null),
    act: (anim) => { if (player.actions[anim] && !player.swim && !room) player.play(anim); },
    changed: () => { if (onlineUI) onlineUI.render(); if (toolbar) toolbar.sync(profile); } });
  onlineUI = new OnlinePanel({ online, sfx, landVi: (id) => (id === 'home' ? 'đang ở trong nhà' : (WORLD.mapById(id === 'isle' ? 'harbor' : id) || {}).vi || id) });
  fetch('./data/online.json').then((r) => (r.ok ? r.json() : null)).then((j) => { if (j && typeof j.server === 'string') onlineFile = j.server.trim(); if (toolbar) toolbar.sync(profile); }).catch(() => {});
  tintBody(player.root, NGOC_COLORS); setHairStyle(player.root, 'short');
  shopWin = new ShopWindow({ profile: () => profile, sfx, track, onClose: leaveRoom, today: () => Review.today(), changed: () => { setSword(); setWear(); save(); refresh(); if (homes) homes.refresh(); } });
  music = new MusicRoom({ profile: () => profile, sfx, track, onClose: leaveRoom, changed: () => { save(); refresh(); } });
  { const F = L.REGIONS.forest, y = F.groundHeight(FOREST_SHOP.x, FOREST_SHOP.z); forestStall = campStall(FOREST_SHOP.x, y, FOREST_SHOP.z, Math.PI / 2 + 0.3);
    const name = label("🌿 Willow's Camp Shop", { size: 28, scale: 0.8 }); name.position.set(0, 3.2, 0); forestStall.add(name); forestStall.visible = false; scene.add(forestStall); }
  { const opt = (n) => staticModel(n).catch(() => null);
    homes = new Homes({ scene, load: staticModel, profiles: () => store.profiles, models: { garden: await opt('prop_vegetable_garden_v01'), tree: await opt('prop_tree_round_v01'), flowers: await opt('yard_flowerbed_v01'), bench: await opt('yard_bench_v01'), mailbox: await opt('yard_mailbox_v01'), garden_lamp: await opt('yard_garden_lamp_v01') } });
    await homes.build(); homes.setRegion(L.NAME);
    try { outerRing = await buildOuter(staticModel); for (const g of Object.values(outerRing)) scene.add(g); showOuter(L.NAME); } catch (e) { console.warn('outer ring', e); }      // (24/11) cottages and plants round the edge of the harbour and forest
    homePanel = new HomePanel({ onClose: leaveRoom, rebuild: (o) => { const p = goHome(o, homePanel.mine, true, homePanel.admin); if (homes) homes.refresh(true); return p; }, setEditing: (on) => room && room.walk && room.setEditing(on), pickUp: (id) => room && room.walk && room.pickUp && room.pickUp(id), tool: (n) => (n === 'touch' ? homeTouch() : n === 'find' ? homeFind() : room && room.walk && room.tool && room.tool(n)), find: () => homeFind(), rest: () => homeRest(), finding: () => !!findGame, editing: () => !!(room && room.walk && room.editing), holding: () => !!(room && room.walk && room.holding), profile: () => profile, today: () => Review.today(), changed: () => { save(); refresh(); comfortNews(); }, sfx, track }); }
  journal = new Journal({ profile: () => profile, today: () => Review.today(), onClose: leaveRoom,
    store: () => store, claimShip: () => { const r = Family.claim(store, profile); if (r) { sfx('fanfare'); save(); refresh(); ui.toast(`⚓ Thưởng tàu gia đình: +${r.gold} vàng`); } },
    claimMain: (id) => claimReward(Q.claimMain(profile, id), 'Nhiệm vụ chính', true), claimDaily: (id) => claimReward(Q.claimDaily(profile, Review.today(), id), 'Nhiệm vụ ngày') });
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
    { id: 'room', icon: '👫', tip: 'Chơi chung với bạn (Y)', show: () => !!profile && !!online && online.ready, badge: () => (online && online.on ? online.friends.length + 1 : 0), click: () => { if (profile) { onlineUI.toggle(); sfx('tick'); } } },
    { id: 'ward', icon: '👗', tip: 'Tủ đồ (U)', show: () => !!profile, badge: (p) => 0, click: () => { if (profile) { wardPanel.show(); sfx('tick'); } } },
  ]);
  walkers = new Walkers(scene, ownLook); await walkers.init();      // villagers on the roads
  for (const a of [player, tom, sam, ben, ...friends.map((f) => f.npc)]) { addOutline(a.root); if (a === player) outlined.add(a.root); }     // cartoon outlines (medium/high)
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
  if (touchWanted()) touch = initTouch({ keys, press: (code) => onKey({ code, preventDefault() {} }), cam, canvas, state: () => ({ playing: started && !switching && !arcade?.game?.directTouch, arcade: !!(arcade && arcade.open) }) });
  arcade = new Arcade((g, res) => {       // (24/11) a finished board game keeps the record only; quitting does nothing
    if (!res) return;
    if (g.onResult) return g.onResult(res);
    const best = mini.data.best, record = best[res.id] === undefined || res.score > best[res.id]; if (record) best[res.id] = res.score;
    let prize = ''; if (LandGames.wonPrize(res.id, res.score)) { const id = LandGames.PRIZES[res.id].item, h = profile.home || (profile.home = { items: [] }); if (ITEMS[id] && !h.items.includes(id)) { h.items.push(id); prize = `🎁 Giải thưởng: ${ITEMS[id].en} (${ITEMS[id].vi}) đã được đặt trong nhà của con, +${HomePlay.PRIZE_POINTS} Ấm cúng!`; sfx('fanfare'); } }      // (27/11, turn 68) a land's own game pays with a thing for the home
    save(); refresh();      // (24/11) no gold and no EXP for a mini game: the child paid to enter
    track('mini'); if (['style', 'cafe', 'salon'].includes(res.id)) track('sea_game'); if (res.fish) catchFish(res.fish); if (res.unlock && res.unlock.length) gainItems(res.unlock); for (const c of res.words || []) (profile.seen || (profile.seen = {}))[c.id] = Review.today();      // words met inside the game count as seen
    ui.dialogue([{ who: 'Ngọc', en: res.text, vi: [prize, record ? 'Kỷ lục mới của con!' : '', prize ? '' : payNote()].filter(Boolean).join(' ') }],
      () => { if (prize) comfortNews(); if (res.words && res.words.length >= 2 && !LandGames.PRIZES[res.id]) hostQuiz(res.id === 'blocks' ? 'Max' : 'Leo', res.words); });
  });
  spots = new WordSpots({ scene, profile: () => profile, cards: () => unitCards, learn: learnWord });
  chests = new Chests({ scene, profile: () => profile, cards: () => unitCards, dueIds: () => Review.dueIds(profile.words),
    open: (c, card) => {
      if (!card) { ui.dialogue([{ who: 'Ngọc', en: 'This lock has no letters…', vi: `Từ vựng Unit ${Save.unitOf(profile)} lớp ${profile.grade} chưa có, rương tự mở.` }], () => { chests.opened(c); save(); }); return; }
      const g = spellGame(card); const started = Date.now();
      g.onResult = (res) => {
        Review.record(profile.words, card.id, { correct: res.wrong === 0, hints: res.wrong ? 1 : 0, ms: Date.now() - started }); Save.recordSkill(profile, 'spelling', res.wrong === 0, res.wrong ? 1 : 0);
        chests.opened(c); track('chest'); if (L.NAME === 'harbor') track('sea_chest'); profile.stats.gold += res.gold; const cx = Save.atCap(profile) ? 0 : learnExp(profile.stats.level, LEARN.chest * (res.wrong ? 0.5 : 1)); Save.addExp(profile, cx); sfx('fanfare'); save(); refresh();      // (26/11) spelling the word pays EXP (half with mistakes)
        ui.dialogue([{ who: 'Ngọc', en: `${res.text} (+${res.gold} gold${cx ? `, +${cx} EXP` : ''})`, vi: `${card.word} = ${card.vi}` }]);
      };
      teach([card], () => arcade.start(g));
    } });
  floaters = new Floaters(scene);
  wild = new Wild({ scene, player, ui, sfx, profile: () => profile, save, gainItems, owns: (c) => WR.wardrobe(profile).owned.includes(WR.itemId(c.kind, c.color)), onChange: refresh, floater: (x, z, t, c, k) => floaters.add(x, z, t, c, k), goldMul: petGoldMul, wordDrop, onKill: (m) => { track('kill'); if (m && m.region === 'harbor') track('sea_kill'); if (m && m.region === 'harbor') seaFound(m.kind); }, onJob: (region) => { if (region === 'harbor') track('sea_job'); },
    quiz: (bossName, done) => {       // word shield: pick the English word for the Vietnamese meaning (unit vocabulary, due words first)
      // (26/11, turn 63) maps 4-12: every second shield of a land's guard is a GRAMMAR shield, a sentence of the land's unit to complete
      // (the guard holds the kind of words the land lost); units without grammar keep word shields only
      quizN += 1; const gi = isLand(L.NAME) && quizN % 2 === 0 ? grammarFor(profile.grade, Save.unitOf(profile), 1)[0] : null;
      if (gi) {
        const order = [0, 1, 2].sort(() => Math.random() - 0.5), full = gi.q.replace('___', gi.options[gi.a]);
        ui.choose({ who: bossName, en: gi.q, vi: 'Khiên ngữ pháp: chọn dạng đúng để phá khiên!' }, order.map((i) => gi.options[i]), (i) => {
          const ok = order[i] === gi.a; Save.recordSkill(profile, 'grammar', ok, 0); save();
          if (ok) speak(full, true); else ui.dialogue([{ who: bossName, en: 'Ha ha! Not that one!', vi: `${full} · ${gi.why} Đánh tiếp rồi thử lại nhé.` }]);
          done(ok);
        });
        return;
      }
      const pool = unitCards.filter((c) => c.word.length <= 18); if (pool.length < 4) { done(true); return; }
      const due = Review.dueIds(profile.words).map((id) => pool.find((c) => c.id === id)).filter(Boolean), card = (due.length ? due : pool)[Math.floor(Math.random() * (due.length || pool.length))];
      const opts = [card, ...pool.filter((c) => c.id !== card.id && c.vi !== card.vi).sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5), started = Date.now();
      teach([card], () => ui.choose({ who: bossName, en: 'Say the magic word to break my shield!', vi: `"${card.vi}" trong tiếng Anh là gì?` }, opts.map((o) => o.word), (i) => {
        const ok = opts[i].id === card.id; Review.record(profile.words, card.id, { correct: ok, hints: 0, ms: Date.now() - started }); Save.recordSkill(profile, 'vocabulary', ok, 0); save();
        if (!ok) ui.dialogue([{ who: bossName, en: 'Ha ha! Wrong word!', vi: `${card.word} = ${card.vi}. Đánh tiếp rồi thử lại nhé.` }]);
        done(ok);
      }));
    },
    respawn: () => { game.teleport(L.SPAWN.x, L.SPAWN.z); profile.stats.hp = Save.maxHp(profile); save(); refresh(); ui.dialogue([{ who: L.NAME === 'village' ? 'Tom' : 'Pip', en: L.NAME === 'village' ? 'You fainted, so I carried you home. Rest, then try again!' : 'You fainted, so I carried you back to the gate. Rest, then try again!', vi: (L.NAME === 'village' ? 'Con hết máu nên được đưa về làng.' : 'Con hết máu nên được đưa về lối vào của vùng.') + ' Máu đã đầy lại. Mua trang bị tốt hơn, mang bánh (Q) rồi quay lại nhé.' }]); } });
  wild.addMap1(map1Model).catch((e) => console.warn('map 1 monsters', e));
  spells = new Spells({ scene, wild, player, camera, canvas, profile: () => profile, sfx, ui, onChange: () => {}, shake: fxShake, flash: fxFlash });      // (20/11) magic skills: keys 1-4, the skill book T
  packUI = new PackUI({ profile: () => profile, sfx, toast: (t) => ui.toast(t), changed: () => { save(); refresh(); }, hpMax: () => Save.maxHp(profile), focus: creatorCamera, look: () => { setSword(); setWear(); }, swing: () => player.swing() });      // (21/11) the hero stands beside the bag and shows each piece
  skillUI = new SkillUI({ profile: () => profile, spells, sfx, usePotion, toast: (t) => ui.toast(t), atk: () => playerAtk(profile), changed: () => { save(); refresh(); } });      // the Blender monsters replace the shapes a moment after the game starts (not awaited: a slow download must not hold the boot)
  mini = new MiniGames({ scene, player, ui, sfx, track, gate: (who, game, go) => gameGate(who, game, go), profile: () => profile, save, onNote: refresh, board: (id, st) => {
    if (st && st.game) {      // (26/11, turn 63) the game masters of maps 4-12: a game of the arcade under the land's own name
      const who = st.host.name, k = st.game, tr = tierOf(profile.stats.level), lantern = { fireflies, vault, courier, workshop }[k];
      const own = { bazaar: () => bazaarGame(), slide: () => slideGame(), mine: () => mineGame(unitCards), rune: () => runeGame(), balloon: () => balloonGame(unitCards), robot: () => robotGame() }[k];      // (27/11, turn 68) games made for a land
      if (own) { gameGate(who, k, () => arcade.start(own())); return; }
      if (lantern) { gameGate(who, 'lantern_fair', () => arcade.start(lantern(unitCards))); return; }
      gameGate(who, k === 'race2' ? 'race' : k, async () => { let g; if (k === 'race2') { try { raceAssets = raceAssets || await loadRaceAssets(gltf); g = raceGame3d({ assets: raceAssets, cards: unitCards, tier: tr, variant: st.variant }); } catch (e) { console.warn('race3d: ' + e.message); g = raceGame(Math.random, [], tr); } } else g = ({ candy: () => candyGame(Math.random, tr), blocks: () => blocksGame(Math.random, unitCards, tr), sling: () => slingGame(Math.random, tr) })[k](); arcade.start(withTier(g, tr)); });
      return;
    }
    if (id === 'lantern_fair') { const activities = [fireflies, vault, courier, workshop]; ui.choose({ who: 'Hội Đèn Làng', en: 'Where shall we go tonight?', vi: 'Chọn một trò để bắt đầu.' }, ['Lối đom đóm · Nối chữ', 'Hầm thẻ đồng · Mở khóa', 'Chuyến thư đêm · Lái xe', 'Hồ sơ xưởng đồng hồ · Điều tra', 'Trở về làng'], (i) => { if (activities[i]) gameGate('Leo', 'lantern_fair', () => arcade.start(activities[i](unitCards))); }); return; } const t = tierOf(profile.stats.level), go = async () => { let g; if (id.startsWith('race2')) { try { raceAssets = raceAssets || await loadRaceAssets(gltf); g = raceGame3d({ assets: raceAssets, cards: unitCards, tier: t, variant: id === 'race2h' ? 'harbor' : id === 'race2f' ? 'forest' : 'village' }); } catch (e) { console.warn('race3d: ' + e.message); g = raceGame(Math.random, [], t); } } else g = ({ candy: () => candyGame(Math.random, t), blocks: () => blocksGame(Math.random, unitCards, t), sling: () => slingGame(Math.random, t) })[id](); arcade.start(withTier(g, t)); }; gameGate(id === 'candy' ? 'Mimi' : id === 'blocks' ? 'Max' : id === 'sling' ? 'Rex' : id === 'race2h' ? 'Marina' : id === 'race2f' ? 'Rowan' : 'Leo', id.startsWith('race2') ? 'race' : id, go); } });
  await mini.addHosts(ownLook);      // a host by each mini game
  notesUI = new NotesPanel({ allowed: () => !!(profile && profile.admin), guard: (on) => { if (!profile) return; if (on) { noteGod = !!profile.god; profile.god = true; } else profile.god = noteGod; }, context: noteContext, capture: noteCapture, pickWorld: notePick, go: noteGo, marks: noteMarks, toast: (t) => ui.toast(t), sfx,
    spells: () => SK.SPELLS.map((n) => ({ id: n.id, en: n.en || n.id, vi: n.vi || '', el: n.el })), demo: (id) => (room ? 'place' : spells.demo(id)), slow: (k) => { spells.slow = k; },
    meta: () => ({ build: (document.querySelector('meta[name="eq-build"]') || {}).content || '', quality, screen: `${innerWidth}x${innerHeight}`, gpu: (() => { try { const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : ''; } catch { return ''; } })() }),
    saveFile: (name, text) => { try { if (globalThis.eqDesktop && globalThis.eqDesktop.saveNotes) return globalThis.eqDesktop.saveNotes(name, text) || ''; } catch { /* fall back to a download */ } const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); return ''; } });      // (27/11, turn 72) the admin's review notes on F1
  admin = new AdminPanel({ online: { get: onlineSet, set: (o) => { try { if (o.off != null) localStorage.setItem('eq-online-off', o.off ? '1' : '0'); if (o.own != null) localStorage.setItem('eq-online-server', o.own); } catch { /* no storage */ } if (online && online.code && !onlineServer()) online.leave(); if (toolbar) toolbar.sync(profile); } }, profile: () => profile, profiles: () => store.profiles, backups: adminBackups, backupRead: adminBackupRead, restore: adminRestore, visitHome: (o) => goHome(o, true, false, true), deleteProfile: adminDelete, places: adminPlaces, go: adminGo, unlockAll: adminUnlock, setStep: adminStep,
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
  if (globalThis.eqDesktop && globalThis.eqDesktop.onHidden) globalThis.eqDesktop.onHidden((h) => { hiddenWin = h; });
}

let worst = 0, worstNow = 0, mapT = 1, last = performance.now(), acc = 0, frames = 0, autosave = 0, slow = 0;
const AUTO = !navigator.webdriver && !localStorage.getItem('eq-quality-manual');     // step the graphics down by itself until the child picks a level
let hiddenWin = false, playT = 0, restN = 0, frozenNow = false;
const REST_MIN = 40;
function frame() {
  const now = performance.now(), raw = (now - last) / 1000, real = Math.min(0.25, raw); last = now;
  if (hiddenWin) return;      // (26/11) the desktop window is minimised: nothing to draw, nothing moves
  if (profile && started && !navigator.webdriver && !switching && !(intro && intro.active)) {
    if (!profile.flags.taught && profile.flags.arrived && !ui.busy && !(creator && creator.open)) { profile.flags.taught = true; showKeys(true); }      // the keys, once, for a new player
    playT += real;      // (26/11) a rest for the eyes every REST_MIN minutes of play, when nothing is going on
    if (playT > REST_MIN * 60 && !ui.busy && !frozenNow && !(wild && wild.fighting)) { playT = 0; restN += 1; sfx('tick'); ui.dialogue([{ who: 'Pip', en: `You have played for ${restN * REST_MIN} minutes. Time to rest your eyes!`, vi: `Con đã chơi ${restN * REST_MIN} phút rồi. Đứng dậy, uống nước, nhìn ra xa 5 phút cho mắt nghỉ nhé. Tiến độ đã được lưu.` }]); save(); }
  }
  const dt = Math.min(0.05, real); TIME.value += real; const t = TIME.value;
  if (profile && started && !ui.busy && ((map2Ready(profile) && !profile.flags.map2) || (map3Ready(profile) && !profile.flags.map3) || pendingLand())) refresh();      // (24/11) a map announcement that waited for a talk to end
  const frozen = ui.modal || !started || (arcade && arcade.open) || (shopWin && shopWin.open) || (packUI && packUI.open) || (fishing && fishing.active) || (music && music.open) || (journal && journal.open) || (homePanel && homePanel.open) || room || (dexPanel && dexPanel.open) || (wardPanel && wardPanel.open) || (creator && creator.open) || (tailor && tailor.open) || (skillUI && skillUI.open) || (petPanel && petPanel.open) || (trPanel && trPanel.open) || (worldUI && worldUI.open) || (reader && reader.open);
  frozenNow = !!frozen;
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
  cam.update(real, player.pos);
  if (shakeAmp > 0.004) { const a = shakeAmp * 0.2; camera.position.x += (Math.random() - 0.5) * a; camera.position.y += (Math.random() - 0.5) * a; camera.position.z += (Math.random() - 0.5) * a; shakeAmp *= Math.exp(-real * 9); } else shakeAmp = 0;
  if (fxLightT > 0) { fxLightT -= real; fxLight.intensity = fxLightPow * Math.max(0, fxLightT / 0.26); } else if (fxLight.intensity) fxLight.intensity = 0;
  guideArrow(real); swimHud(); if (fishing) fishing.update(real, performance.now() / 1000);
  const talkingTo = ui.busy && ui.pages ? ui.pages[0].who : '';
  tom.update(dt, player.pos, talkingTo === 'Tom'); sam.update(dt, player.pos, talkingTo === 'Sam'); ben.update(dt, player.pos, talkingTo === 'Ben');
  for (const f of friends) f.npc.update(dt, player.pos, talkingTo === f.who);
  for (const b of buddies) updateBuddy(b, dt, talkingTo === b.who, real);
  if (crowd && started && !room) crowd.update(dt, player.pos, talkingTo, ui.busy || !!(wild && wild.fighting) || !!(arcade && arcade.open), real);
  if (peers) peers.update(dt, real);
  if (online && started && profile) online.tick(performance.now());
  if (walkers && started) walkers.update(real, player.pos, ui.busy ? talkW : -1);
  if (pip.root.visible) pip.update(dt, t, player, started && ((L.NAME === 'forest' && quest && quest.step !== 'intro') || isLand(L.NAME)));      // (26/11) Pip flies along in maps 4-7
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
    playMusic(room ? (room.kind === 'home' ? 'home' : room.kind === 'music' ? null : L.NAME === 'forest' ? 'forest' : 'village') : boss ? 'boss' : ({ village: 'village', forest: 'forest', harbor: 'harbor', isle: 'isle', desert: 'desert', mountain: 'mountain', ruins: 'ruins', sky: 'sky', fairy: 'fairy', volcano: 'volcano', crystal: 'crystal', city: 'city', dream: 'dream' })[L.NAME] || 'village');
  }
  if (wild && started && !switching && wild.root.visible) { hoverTick = (hoverTick || 0) + real; if (hoverTick > 0.1) { hoverTick = 0; hoverPick(); } if (!frozen && !(player && player.swim) && !(input.x || input.z)) wild.autoHit(); }      // (21/11) hover ring; auto attack the locked target in reach
  if (wild && started && !switching) wild.update(real, !!frozen || !!(mini && mini.active));      // (26/11) no bites while ANY panel is open: the hero cannot move then (bag, skills, journal, home, world map…)      // (21/11) no monster bites during a mini game
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
    } else if (isLand(L.NAME)) {
      const kp = friends.find((f) => f.region === L.NAME && f.role === 'keeper'), ow = friends.find((f) => f.region === L.NAME && f.role === 'owl');
      if (kp && (!profile.flags['met_' + L.NAME] || lessonReady(L.NAME))) markers.push({ x: kp.npc.x, z: kp.npc.z, text: '!' });
      if (ow && Save.gateWaiting(profile)) markers.push({ x: ow.npc.x, z: ow.npc.z, text: '🦉' });
      markers.push(...wild.markers(), ...chests.markers(), ...spots.markers()); if (peers) markers.push(...peers.markers());
      for (const b of buddies) if (b.npc.x < 1e5) { const st = Buddies.state(profile, b.id).status; if (st === 'offer' || !Buddies.record(profile).met[b.id]) markers.push({ x: b.npc.x, z: b.npc.z, text: '!' }); else if (st === 'ready') markers.push({ x: b.npc.x, z: b.npc.z, text: '?' }); }      // (27/11, turn 66)
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
      if (story.market && Math.hypot(player.pos.x - BEN_MARKET.centre[0], player.pos.z - BEN_MARKET.centre[1]) > 15) story.leaveMarket();
      if (!story.market) markers.push(...mini.markers());
      for (const st of STARTS) if (st.host && (st.region || 'village') === L.NAME) {      // a glowing "!" over each mini game host while today's full-pay plays remain (18/11)
        const n = (profile.plays && profile.plays.day === Review.today() && profile.plays.n[st.id]) || 0;
        if (n < 3) markers.push({ x: st.x - 0.6, z: st.z + 0.4, text: '!', host: true });
      }
      markers.push(...wild.markers(), ...chests.markers(), ...spots.markers()); if (peers) markers.push(...peers.markers());
      if (Save.gateWaiting(profile)) markers.push({ x: OWL.x, z: OWL.z, text: '🦉', color: '#ffe28a' });
    }
    minimap.level = profile && !profile.admin ? profile.stats.level : 0; minimap.draw(player.pos, player.yaw, markers); questMarks(markers); guideGoal = pickGoal(markers); if (homes) homes.refresh(); plantCull(player.pos.x, player.pos.z, QUALITY[quality].plantFar); }
    autosave += dt; if (autosave > 20 && !(tailor && tailor.open)) { autosave = 0; save(); }      // (26/11) not while clothes are being tried on at the tailor's (they were saved as worn)
  }
  renderer.info.reset();
  if (homePanel && homePanel.hint) homePanel.hint.style.visibility = ui.busy ? 'hidden' : '';      // (27/11, turn 65) the line of keys at the bottom lay over the answers of a question asked inside the house
  if (room) { room.update(real, camera.aspect, room.walk ? { input: homePanel && homePanel.open || ui.modal ? {} : rawInput, yaw: cam.yaw - (room.yaw0 || 0), pitch: cam.pitch, dist: cam.dist, mouse: hoverNdc() } : undefined); post.setSun(room.camera, sunDir); post.render(room.scene, room.camera); }
  else { post.setSun(camera, sunDir); post.render(scene, camera); }
  acc += raw; frames++; worstNow = Math.max(worstNow, raw * 1000);
  if (acc >= 0.5) { game.stats = { gpu: GPU, software: SOFTWARE_GL, worst: Math.round(worstNow), fps: +(frames / acc).toFixed(1), ms: +(acc / frames * 1000).toFixed(1), calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
    if (perfOn) $('perf').textContent = `FPS ${game.stats.fps}  (${game.stats.ms} ms, chậm nhất ${worst.toFixed(0)} ms)\nGPU: ${GPU.slice(0, 60)}${SOFTWARE_GL ? '  ⚠ ĐANG VẼ BẰNG CPU' : ''}\nđộ phân giải ${Math.round(renderScale * 100)}%\ndraw calls ${game.stats.calls}\ntriangles ${game.stats.tris.toLocaleString()}\nquality ${quality} · ${renderer.domElement.width}x${renderer.domElement.height}`;
    adaptResolution(game.stats, acc);
    if (AUTO && started && !switching && !document.hidden && quality !== 'low' && !localStorage.getItem('eq-quality-manual')) {
      slow = game.stats.fps < 26 && renderScale <= MIN_SCALE + 0.01 ? slow + 1 : 0;      // only after the resolution can go no lower (26/11: it compared with 0.61 while the floor was 0.8, so the quality never dropped)
      if (slow >= 6) { slow = 0; setQuality(quality === 'high' ? 'medium' : 'low'); ui.toast('Đã hạ đồ họa cho mượt hơn'); }
    }
    acc = 0; frames = 0; worst = worstNow; worstNow = 0; }
}
boot().catch((e) => { errors.push(String(e && e.stack || e)); $('loadtext').textContent = 'Lỗi khi tải game: ' + e.message; console.error(e); });

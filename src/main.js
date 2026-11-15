// English Quest (web) — boot, render loop, quality presets, perf panel and the debug API for tests.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as L from './core/layout.js';
import * as Save from './core/save.js';
import * as Review from './core/review.js';
import { loadGrade } from './core/catalog.js';
import { buildWorld, bridgeItem, TIME, MARKET_JARS } from './world/forest.js';
import { Player, OrbitCamera, Npc, Pip, Crystals } from './game/actors.js';
import { ForestQuest, landmark } from './game/quest.js';
import { VillageStory } from './game/village.js';
import { MiniGames, STARS } from './game/minigames.js';
import { Wild } from './game/combat.js';
import { Arcade, candyGame, blocksGame, slingGame, spellGame, raceGame } from './ui/arcade.js';
import { Chests } from './game/chests.js';
import { ITEMS, bag, wear, buy, eat, shopList } from './core/rules.js';
import { SAM_LINES, BRIDGE, BRIDGE_SPOTS, FRIENDS } from './game/content.js';
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
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.localClippingEnabled = true;   // broken bridge gap
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
let profile = null, quest = null, story = null, world = null, player = null, cam = null, tom = null, sam = null, ben = null, pip = null, crystals = null, minimap = null, letterProp = null, itemProps = {}, friends = [], mini = null, wild = null, arcade = null, chests = null, unitCards = [], cardOfFn = () => null;
let quality = localStorage.getItem('eq-quality') || 'medium', perfOn = false, started = false, switching = false, wordIds = {}, jarKey = '';
const keys = new Set();
const game = { errors, get profile() { return profile; }, get quest() { return quest; }, get story() { return story; }, get player() { return player; }, get cam() { return cam; }, get minimap() { return minimap; }, ui, L, stats: { fps: 0, ms: 0, calls: 0, tris: 0 },
  teleport(x, z) { player.place(x, z); cam.target.set(x, player.pos.y + 1.25, z); }, setQuality, key: (code) => onKey({ code, preventDefault() {} }), get started() { return started && !switching; }, get region() { return L.NAME; }, chooseProfile, enterRegion, MARKET_JARS, BRIDGE_SPOTS, get mini() { return mini; }, get wild() { return wild; }, get scene() { return scene; }, openShop, get sword() { return swordMesh; }, get arcade() { return arcade; }, get chests() { return chests; }, refresh: () => refresh() };
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
  $('gq').onchange = (e) => { localStorage.setItem('eq-quality-manual', '1'); setQuality(e.target.value); };
  $('gs').onclick = () => { setSound(!soundOn()); renderGear(); };
  $('ge').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([Save.exportProfile(profile)], { type: 'application/json' })); a.download = `english-quest-${profile.name}.json`; a.click(); };
  $('gp').onclick = () => { save(); ui.showMenu(store, chooseProfile); };
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
  const learned = Review.learned(profile.words);
  if (L.NAME === 'forest') {
    ui.hud(profile, 'Rừng Ký Ức', `Pha lê ${quest.q.found.length}/5`, learned);
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
  minimap.rebuild(); placeActors(); if (mini) mini.setRegion(name); if (wild) wild.setRegion(name); if (chests) chests.setRegion(name);
  const [x, z] = at || [L.SPAWN.x, L.SPAWN.z];
  game.teleport(x, z); player.yaw = Math.PI; cam.tYaw = cam.yaw = 0.25;
  if (quest && quest.step === 'seek') quest.clueStart = performance.now();
  switching = false; save(); refresh();
}
async function chooseProfile(p) {
  unlock(); profile = p; store.last = p.id; started = false; shownLevel = 0;
  const units = await loadGrade(p.grade);                                   // this grade only
  const forestMarks = L.REGIONS.forest.LANDMARKS, find = (w) => { for (let n = 0; n < 12; n++) { const u = units[n]; if (u && (u.vocabulary || []).some((v) => v.word.toLowerCase() === w)) return `g${p.grade}_u${String(n + 1).padStart(2, '0')}:${w}`; } return null; };
  wordIds = {}; forestMarks.forEach((l) => { wordIds[l.en] = find(l.en) || 'forest:' + l.en; });
  const unit = units[(p.unit || 1) - 1], uid = `g${p.grade}_u${String(p.unit || 1).padStart(2, '0')}`;
  const cards = ((unit && unit.vocabulary) || []).filter((w) => w.word.length <= 22 && w.vi.length <= 34).map((w) => ({ id: `${uid}:${w.word.toLowerCase()}`, word: w.word, vi: w.vi }));
  const cardOf = (id) => { const [u, w] = id.split(':'), m = /^g(\d)_u(\d\d)$/.exec(u); if (!m || Number(m[1]) !== p.grade) return null; const src = units[Number(m[2]) - 1], hit = src && (src.vocabulary || []).find((v) => v.word.toLowerCase() === w); return hit ? { id, word: hit.word, vi: hit.vi } : null; };
  quest = new ForestQuest({ profile, save, ui, sfx, wordId: (w) => wordIds[w] || 'forest:' + w, onChange: refresh });
  story = new VillageStory({ profile, save, ui, sfx, onChange: refresh, letter: (unit && unit.activities && unit.activities.lost_letter) || null, cards, cardOf,
    bridge: BRIDGE[p.grade] || null, onBridgeFixed: applyBridge });
  if (story.step === 'jars_play') story.q.step = 'jars';
  if (mini) { mini.stop(); mini.syncStars(); }
  unitCards = cards; cardOfFn = cardOf; if (chests) chests.sync();
  wear(profile); setSword();
  if ((story.step === 'open' || story.step === 'done') && !p.flags.bridge_fixed) p.flags.bridge_fixed = true;   // saves from before the bridge quest
  applyBridge();
  $('mapbox').classList.remove('hidden');
  await enterRegion(p.region === 'forest' && p.flags.forest_open ? 'forest' : 'village');
  started = true; renderGear();
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
    if (r.ok) { sfx('correct'); setSword(); save(); refresh(); return openShop(who, seller, r.why === 'owned' ? `You are wearing the ${it.en} now.` : `Here is your ${it.en}! Anything else?`); }
    sfx('wrong'); openShop(who, seller, r.why === 'gold' ? `Sorry, the ${it.en} costs ${it.cost} gold.` : `The ${it.en} is for level ${it.level} heroes. Train a little more!`);
  });
}
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
/** The owl's review: five quick questions on learned and unit words, both directions. 4 of 5 opens the gate. */
const OWL = { x: 2.9, z: 14.5 };
function owlReview() {
  const L0 = Save.gateWaiting(profile);
  if (!L0) { const next = Save.GATES.find((g) => g > profile.stats.level); ui.dialogue([{ who: 'Owl', en: 'Hoo-hoo! Keep training, little hero.', vi: next ? `Đến cấp ${next}, cú sẽ ôn tập với con để mở cấp tiếp theo.` : 'Con đã qua hết các cổng ôn tập của làng.' }]); return; }
  const seen = Object.keys(profile.words).map((id) => cardOfFn(id)).filter(Boolean), pool = [...seen, ...unitCards.filter((c) => !seen.some((x) => x.id === c.id))].filter((c) => c.word.length <= 22);
  if (pool.length < 4) { Save.passGate(profile, L0); save(); refresh(); ui.dialogue([{ who: 'Owl', en: 'Hoo! No words to review yet. Go on!', vi: `Từ vựng Unit ${profile.unit} lớp ${profile.grade} chưa có, cổng tự mở.` }]); return; }
  const due = new Set(Review.dueIds(profile.words)), order = [...pool].sort((a, b) => (due.has(b.id) ? 1 : 0) - (due.has(a.id) ? 1 : 0) || Math.random() - 0.5).slice(0, 5);
  let right = 0;
  const ask = (n) => {
    if (n >= order.length) {
      const pass = right >= Math.min(4, order.length - 1);
      if (pass) { Save.passGate(profile, L0); sfx('fanfare'); }
      save(); refresh();
      ui.dialogue([{ who: 'Owl', en: pass ? `Wonderful! ${right} of ${order.length}. You may grow stronger now!` : `${right} of ${order.length}. Let's try again soon!`, vi: pass ? 'Cổng ôn tập đã mở, con lên cấp rồi!' : 'Cần đúng 4/5 câu. Ôn lại các từ rồi gặp cú lần nữa nhé.' }]);
      return;
    }
    const c = order[n], toEn = n % 2 === 0, others = pool.filter((x) => x.id !== c.id && x.vi !== c.vi && x.word !== c.word).sort(() => Math.random() - 0.5).slice(0, 3);
    const opts = [c, ...others].sort(() => Math.random() - 0.5), started = Date.now();
    ui.choose({ who: `Owl · ${n + 1}/${order.length}`, en: toEn ? 'Which English word is it?' : `What does "${c.word}" mean?`, vi: toEn ? c.vi : undefined }, opts.map((o) => (toEn ? o.word : o.vi)), (i) => {
      const ok = opts[i].id === c.id; if (ok) right += 1;
      Review.record(profile.words, c.id, { correct: ok, hints: 0, ms: Date.now() - started }); Save.recordSkill(profile, 'vocabulary', ok, 0); sfx(ok ? 'correct' : 'wrong');
      if (ok) ask(n + 1); else ui.dialogue([{ who: 'Owl', en: 'Hoo… not that one.', vi: `${c.word} = ${c.vi}` }], () => ask(n + 1));
    });
  };
  ui.dialogue([{ who: 'Owl', en: 'Hoo-hoo! Answer my questions and you can grow stronger.', vi: `Ôn 5 câu, đúng 4 câu thì lên được cấp ${L0 + 1}.` }], () => ask(0));
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
    return null;
  }
  if (story.market) {
    const i = MARKET_JARS.findIndex(([x, z]) => near(x, z, 1.35));
    if (i >= 0) return { text: 'E · Đưa hũ này cho khách', run: () => { player.emote('Interact'); if (story.serve(i)) { player.emote('Celebrate'); } } };
    return null;
  }
  { const m = mini && mini.interact(player.pos); if (m) return m; }
  { const c = chests && chests.interact(player.pos); if (c) return c; }
  { const w = wild && wild.interact(player.pos); if (w) return w; }
  if (L.NAME === 'village' && near(OWL.x, OWL.z, 2.2)) return { text: Save.gateWaiting(profile) ? 'E · Cú Mèo: ôn tập để lên cấp' : 'E · Nói chuyện với Cú Mèo', run: owlReview };
  if (letterProp.visible && near(letterProp.position.x, letterProp.position.z, 2.2)) return { text: 'E · Nhặt bức thư', run: () => { player.emote('Interact'); story.readLetter(); } };
  for (const [id, m] of Object.entries(itemProps)) if (m.visible && near(m.position.x, m.position.z, 2.0)) return { text: 'E · Nhặt vật này', run: () => { player.emote('Interact'); if (story.pick(id)) player.emote('Celebrate'); } };
  if (near(tom.x, tom.z, 3)) return { text: 'E · Nói chuyện với Tom', run: () => story.talkTom() };
  if (near(ben.x, ben.z, 3.6)) return { text: 'E · Nói chuyện với Ben', run: () => story.talkBen() };
  if (near(sam.x, sam.z, 3)) return { text: 'E · Nói chuyện với Sam', run: () => story.talkSam() };
  for (const f of friends) if (near(f.npc.x, f.npc.z, 2.6)) {
    if (f.shop) return { text: 'E · Cửa hàng của ' + f.who, run: () => openShop(f.who, f.shop, f.lines[0]) };
    return { text: 'E · Nói chuyện với ' + f.who, run: () => ui.dialogue(f.lines.map((en) => ({ who: f.who, en }))) };
  }
  return null;
}
function onKey(e) {
  if (!started) return;
  if (arcade && arcade.key(e.code)) { e.preventDefault(); return; }
  if (e.code === 'F3') { perfOn = !perfOn; $('perf').classList.toggle('hidden', !perfOn); e.preventDefault(); return; }
  if (ui.key(e)) { e.preventDefault(); return; }
  if (ui.modal) return;
  if (e.code === 'KeyE') { const t = interactTarget(); if (t) t.run(); }
  if (e.code === 'KeyH') quest.hint();
  if (e.code === 'KeyQ' && profile) { const got = eat(profile, Save.maxHp(profile)); if (got) { sfx('correct'); ui.toast(`+${got} HP`); save(); refresh(); } }
  if (e.code === 'KeyK' && wild && !(mini && mini.active)) wild.dodge();
  if ((e.code === 'KeyJ' || e.code === 'KeyF') && wild && !(mini && mini.active)) wild.attack();
  if (e.code === 'Space') e.preventDefault();
}
addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; if (!e.repeat) onKey(e); keys.add(e.code); });
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
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
  for (const f of Object.values(FRIENDS)) { const npc = new Npc(await gltf(f.file), ...f.at); scene.add(npc.root); friends.push({ ...f, npc }); }
  const F = L.REGIONS.forest;
  crystals = new Crystals(scene, F.LANDMARKS.filter((l) => l.id !== 'tree'), F.walkHeight);
  const hall = L.REGIONS.village.LANDMARKS.find((l) => l.id === 'hall').spot;
  letterProp = new THREE.Group();
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 10), new THREE.MeshStandardMaterial({ color: 0xfff1cf, emissive: 0xffd88a, emissiveIntensity: 0.6 })); roll.rotation.z = Math.PI / 2; letterProp.add(roll);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 10), new THREE.MeshStandardMaterial({ color: 0xd8342a })); band.rotation.z = Math.PI / 2; letterProp.add(band);
  letterProp.position.set(hall[0] + 1.2, L.REGIONS.village.groundHeight(hall[0] + 1.2, hall[1]) + 0.5, hall[1]); letterProp.visible = false; scene.add(letterProp);
  for (const id of ['rope', 'chain', 'log', 'boulder']) { const [x, z] = BRIDGE_SPOTS[id], m = bridgeItem(id); m.position.set(x, L.REGIONS.village.groundHeight(x, z), z); m.visible = false; scene.add(m); itemProps[id] = m; }
  cam = new OrbitCamera(camera, canvas);
  arcade = new Arcade((g, res) => {       // a finished board game pays gold and EXP; quitting pays nothing
    if (!res) return;
    if (g.onResult) return g.onResult(res);
    const best = mini.data.best, record = best[res.id] === undefined || res.score > best[res.id]; if (record) best[res.id] = res.score;
    profile.stats.gold += res.gold; Save.addExp(profile, res.exp); sfx('fanfare'); save(); refresh();
    ui.dialogue([{ who: 'Ngọc', en: `${res.text} (+${res.gold} gold, +${res.exp} EXP)`, vi: record ? 'Kỷ lục mới của con!' : undefined }]);
  });
  chests = new Chests({ scene, profile: () => profile, cards: () => unitCards, dueIds: () => Review.dueIds(profile.words),
    open: (c, card) => {
      if (!card) { ui.dialogue([{ who: 'Ngọc', en: 'This lock has no letters…', vi: `Từ vựng Unit ${profile.unit} lớp ${profile.grade} chưa có, rương tự mở.` }], () => { chests.opened(c); save(); }); return; }
      const g = spellGame(card); const started = Date.now();
      g.onResult = (res) => {
        Review.record(profile.words, card.id, { correct: res.wrong === 0, hints: res.wrong ? 1 : 0, ms: Date.now() - started }); Save.recordSkill(profile, 'spelling', res.wrong === 0, res.wrong ? 1 : 0);
        chests.opened(c); profile.stats.gold += res.gold; Save.addExp(profile, res.exp); sfx('fanfare'); save(); refresh();
        ui.dialogue([{ who: 'Ngọc', en: `${res.text} (+${res.gold} gold, +${res.exp} EXP)`, vi: `${card.word} = ${card.vi}` }]);
      };
      arcade.start(g);
    } });
  wild = new Wild({ scene, player, ui, sfx, profile: () => profile, save, onChange: refresh,
    quiz: (done) => {       // word shield: pick the English word for the Vietnamese meaning (unit vocabulary, due words first)
      const pool = unitCards.filter((c) => c.word.length <= 18); if (pool.length < 4) { done(true); return; }
      const due = Review.dueIds(profile.words).map((id) => pool.find((c) => c.id === id)).filter(Boolean), card = (due.length ? due : pool)[Math.floor(Math.random() * (due.length || pool.length))];
      const opts = [card, ...pool.filter((c) => c.id !== card.id && c.vi !== card.vi).sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5), started = Date.now();
      ui.choose({ who: 'Slime King', en: 'Say the magic word to break my shield!', vi: `"${card.vi}" trong tiếng Anh là gì?` }, opts.map((o) => o.word), (i) => {
        const ok = opts[i].id === card.id; Review.record(profile.words, card.id, { correct: ok, hints: 0, ms: Date.now() - started }); Save.recordSkill(profile, 'vocabulary', ok, 0); save();
        if (!ok) ui.dialogue([{ who: 'Slime King', en: 'Ha ha! Wrong word!', vi: `${card.word} = ${card.vi}. Đánh tiếp rồi thử lại nhé.` }]);
        done(ok);
      });
    },
    respawn: () => { game.teleport(L.SPAWN.x, L.SPAWN.z); ui.dialogue([{ who: 'Tom', en: 'You fainted, so I carried you home. Rest, then try again!', vi: 'Con hết máu nên được đưa về làng. Máu đã đầy lại. Mua trang bị tốt hơn rồi quay lại nhé.' }]); } });
  mini = new MiniGames({ scene, player, ui, sfx, profile: () => profile, save, onNote: refresh, board: (id) => arcade.start(({ candy: candyGame, blocks: blocksGame, sling: slingGame, race2: raceGame })[id]()) });
  minimap = new Minimap($('minimap'), (path) => { player.route = path.slice(1); });
  placeActors(); player.place(L.SPAWN.x, L.SPAWN.z);
  setQuality(quality);
  $('loading').classList.add('hidden');
  ui.showMenu(store, chooseProfile);
  renderer.setAnimationLoop(frame);
}

let last = performance.now(), acc = 0, frames = 0, autosave = 0, slow = 0;
const AUTO = !navigator.webdriver && !localStorage.getItem('eq-quality-manual');     // step the graphics down by itself until the child picks a level
function frame() {
  const now = performance.now(), raw = (now - last) / 1000, real = Math.min(0.25, raw); last = now;
  const dt = Math.min(0.05, real); TIME.value += real; const t = TIME.value;
  const frozen = ui.modal || !started || (arcade && arcade.open);
  if (arcade) arcade.update(real, keys);
  const input = { x: (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0), z: (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0), run: keys.has('ShiftLeft') || keys.has('ShiftRight'), jump: keys.has('Space') };
  if (frozen) { input.x = input.z = 0; input.jump = false; }
  const hadRoute = !!player.route;
  // slow machines: several fixed physics steps per frame so the game never runs in slow motion
  for (let left = real; left > 1e-4; left -= 0.05) player.update(Math.min(0.05, left), input, cam.yaw, frozen, sfx);
  if (hadRoute && !player.route) minimap.clearRoute();
  cam.update(dt, player.pos);
  const talkingTo = ui.busy && ui.pages ? ui.pages[0].who : '';
  tom.update(dt, player.pos, talkingTo === 'Tom'); sam.update(dt, player.pos, talkingTo === 'Sam'); ben.update(dt, player.pos, talkingTo === 'Ben');
  for (const f of friends) f.npc.update(dt, player.pos, talkingTo === f.who);
  if (pip.root.visible) pip.update(dt, t, player, started && L.NAME === 'forest' && quest && quest.step !== 'intro');
  crystals.update(t); if (world) world.update(t);
  if (mini && started && !switching && !ui.modal && !arcade.open) mini.update(real, player.pos);      // real time, so timers stay honest on slow machines
  if (chests && started) chests.update(real);
  if (wild && started && !switching) wild.update(real, !!ui.modal || arcade.open);
  if (letterProp.visible) { letterProp.rotation.y = t * 1.5; letterProp.position.y += Math.sin(t * 2.2) * 0.002; }
  sun.position.copy(player.pos).addScaledVector(sunDir, 90); sun.target.position.copy(player.pos);
  sky.position.copy(camera.position);
  if (started && !switching) {
    const it = ui.modal ? null : interactTarget(); ui.prompt(it ? it.text : '');
    const markers = [];
    if (L.NAME === 'forest') {
      if (quest.step === 'intro') markers.push({ x: tom.x, z: tom.z, text: '!' });
      if (quest.step === 'tree') { const s = landmark('tree').spot; markers.push({ x: s[0], z: s[1], text: '★' }); }
      if (quest.step === 'seek' && quest.q.hint >= 3) { const s = landmark(quest.targetId).spot; markers.push({ x: s[0], z: s[1], text: '★' }); }
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
      markers.push(...wild.markers(), ...chests.markers());
      if (Save.gateWaiting(profile)) markers.push({ x: OWL.x, z: OWL.z, text: '🦉', color: '#ffe28a' });
    }
    minimap.draw(player.pos, player.yaw, markers);
    autosave += dt; if (autosave > 20) { autosave = 0; save(); }
  }
  renderer.render(scene, camera);
  acc += raw; frames++;
  if (acc >= 0.5) { game.stats = { fps: +(frames / acc).toFixed(1), ms: +(acc / frames * 1000).toFixed(1), calls: renderer.info.render.calls, tris: renderer.info.render.triangles };
    if (perfOn) $('perf').textContent = `FPS ${game.stats.fps}  (${game.stats.ms} ms)\ndraw calls ${game.stats.calls}\ntriangles ${game.stats.tris.toLocaleString()}\nquality ${quality} · ${renderer.domElement.width}x${renderer.domElement.height}`;
    if (AUTO && started && !switching && !document.hidden && quality !== 'low' && !localStorage.getItem('eq-quality-manual')) {
      slow = game.stats.fps < 26 ? slow + 1 : 0;
      if (slow >= 6) { slow = 0; setQuality(quality === 'high' ? 'medium' : 'low'); ui.toast('Đã hạ đồ họa cho mượt hơn'); }
    }
    acc = 0; frames = 0; }
}
boot().catch((e) => { errors.push(String(e && e.stack || e)); $('loadtext').textContent = 'Lỗi khi tải game: ' + e.message; console.error(e); });

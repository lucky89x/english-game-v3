// Fishing in the world (20/11: "a rod, sit and wait, pull the fish up when one bites, and the sliding bar as before"):
// E at a fishing spot (the village dock, the end of the harbor's small pier) puts a rod in Ngọc's hands with a float on the
// water. Wait… the float dips and "❗ BITE!" shows: press E / Space / click when the sliding mark is inside the green zone.
// One fish per bite; keep fishing until you press Esc or E while waiting. The catch is read aloud (English name + meaning).
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { rollFish, rollRiver, FISH_MODEL, SWIMMERS, RARITY, RARITY_VI } from '../core/sea.js';
import { gameMusic, endMusic } from '../audio.js';

export const SPOTS = { village: [{ x: 18.4, z: 19.2, name: 'bến sông' }], harbor: [{ x: 34, z: 28, name: 'cầu tàu nhỏ' }] };
const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';

export class Fishing {
  /** api: { scene, player, ui, sfx, profile(), tier(), onCatch(item) -> text, speak(en), gate(go) (the four words), loadStatic(name), loadAnimated(name) } */
  constructor(api) {
    this.api = api; this.state = 'idle'; this.t = 0; this.spot = null; this.float = new THREE.Group(); this.float.visible = false;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 9), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })), top = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe8443a, roughness: 0.5 }));
    top.position.y = 0.0; this.float.add(ball, top);
    const rings = []; for (let i = 0; i < 2; i++) { const r = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.26, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.y = 0.02; this.float.add(r); rings.push(r); }
    this.rings = rings;
    this.rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.04, 2.1, 6), new THREE.MeshStandardMaterial({ color: 0x7a4a24, roughness: 0.8 })); this.rod.visible = false;
    this.lineGeo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 12 }, () => new THREE.Vector3())); this.line = new THREE.Line(this.lineGeo, new THREE.LineBasicMaterial({ color: 0xf4f4f4, transparent: true, opacity: 0.85 })); this.line.frustumCulled = false; this.line.visible = false;
    api.scene.add(this.float, this.rod, this.line);
    // (21/11) "the hero should appear in a boat and drop the line like real fishing": a small rowboat on the water
    const wood = new THREE.MeshStandardMaterial({ color: 0x9a5f32, roughness: 0.75 }), dark = new THREE.MeshStandardMaterial({ color: 0x6a3d1e, roughness: 0.8 }), paint = new THREE.MeshStandardMaterial({ color: 0x3f8fd0, roughness: 0.6 });
    const boat = new THREE.Group(), pts = []; for (let i = 0; i <= 8; i++) { const k = i / 8; pts.push(new THREE.Vector2(0.18 + Math.sin(k * Math.PI / 2) * 0.62, -0.32 + k * 0.42)); }
    const hull = new THREE.Mesh(new THREE.LatheGeometry(pts, 20, 0, Math.PI), paint); hull.rotation.z = Math.PI / 2; hull.rotation.y = Math.PI / 2; hull.scale.set(1, 2.1, 1);
    const hull2 = hull.clone(); hull2.material = wood; hull2.scale.set(0.96, 2.04, 0.96); hull2.position.y = 0.005;
    const inside = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 2.7), wood); inside.position.y = -0.2;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.06, 0.32), dark); seat.position.set(0, 0.0, -0.35);
    const seat2 = seat.clone(); seat2.position.z = 0.75;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 6, 30), dark); rim.rotation.x = Math.PI / 2; rim.scale.set(0.78, 1.66, 1); rim.position.y = 0.1;
    boat.add(hull, inside, seat, seat2, rim);
    for (const sx of [-1, 1]) { const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.8, 6), dark); oar.rotation.z = sx * 1.25; oar.position.set(sx * 0.95, 0.05, 0.1); const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.4), dark); blade.position.set(sx * 0.82, -0.32, 0); oar.add(blade); boat.add(oar); }
    boat.traverse((o) => { if (o.isMesh) o.castShadow = true; }); boat.visible = false; this.boat = boat; api.scene.add(boat);
    const css = document.createElement('style'); css.textContent = `#fishhud{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:27;width:min(420px,calc(100vw - 20px));padding:8px 12px 10px;border-radius:14px;background:rgba(10,40,70,.82);color:#fff;font:800 15px system-ui,sans-serif;text-align:center;pointer-events:none;display:none}
#fishhud .big{font:900 26px system-ui;color:#ffd23c;text-shadow:0 2px 3px #000;margin-bottom:4px} #fishhud .bar{position:relative;height:26px;border-radius:13px;background:rgba(255,255,255,.88);overflow:hidden;margin-top:4px}
#fishhud .zone{position:absolute;top:3px;bottom:3px;border-radius:10px;background:#4fd070} #fishhud .mark{position:absolute;top:0;bottom:0;width:6px;margin-left:-3px;background:#e8443a;border-radius:3px} #fishhud small{display:block;font-weight:600;opacity:.85;margin-top:3px}`;
    document.head.appendChild(css);
    this.hud = document.createElement('div'); this.hud.id = 'fishhud'; document.body.appendChild(this.hud);
    this.swimmers = []; this.swimRegion = ''; this.swimLoading = false; this.fpos = null; this.catchObj = null; this.pending = null; this.fishCache = new Map();
    this.loadGear();
  }
  /** (23/11) the user's models replace the shapes made by code: the rowboat (prop_boat_v01), the rod and the float of the fishing pack. */
  loadGear() {
    const a = this.api; if (!a.loadStatic) return;
    a.loadStatic('prop_boat_v01').then((m) => { this.boat.clear(); m.traverse((o) => { if (o.isMesh) o.castShadow = true; }); m.scale.setScalar(0.8); this.boat.add(m); this.boatModel = true; }, () => {});
    a.loadStatic('fishing/fishing_rod').then((m) => {      // handle at the origin, the tip along +Z (the rod model lies along +X)
      const box = new THREE.Box3().setFromObject(m); m.position.x = -box.min.x; const g = new THREE.Group(); const inner = new THREE.Group(); inner.add(m); inner.rotation.y = -Math.PI / 2; g.add(inner); g.scale.setScalar(1.55);
      g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); g.visible = this.rod.visible; this.api.scene.remove(this.rod); this.rod = g; this.rodModel = true; this.api.scene.add(g);
    }, () => {});
    a.loadStatic('fishing/fishing_float').then((m) => { for (const c of this.float.children) if (c.geometry && c.geometry.type.startsWith('Sphere')) c.visible = false; m.scale.setScalar(0.85); m.position.y = 0.06; this.float.add(m); }, () => {});
  }
  /** A 3D fish (clone with its own mixer, clip Swim) for a species id, or null when it has no model. size: its length in metres. */
  async makeFish(id, size) {
    const def = FISH_MODEL[id]; if (!def || !this.api.loadAnimated) return null;
    const g = await this.api.loadAnimated(`fishing/${def[0]}`), box = new THREE.Box3().setFromObject(g.scene), len = box.getSize(new THREE.Vector3()).x || 1;
    const holder = new THREE.Group(); g.scene.scale.setScalar((size || def[1]) / len); g.scene.position.y = 0; holder.add(g.scene); g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.frustumCulled = false; } });
    const mixer = new THREE.AnimationMixer(g.scene), clip = g.animations.find((c) => c.name === 'Swim') || g.animations[0]; if (clip) mixer.clipAction(clip).play();
    return { holder, mixer };
  }
  /** Fish that swim about under the water near the spots of this region (the model files load on first use). */
  updateSwimmers(dt, t) {
    const spots = SPOTS[L.NAME] || [], p = this.api.player;
    if (this.swimRegion !== L.NAME) { for (const f of this.swimmers) f.holder.removeFromParent(); this.swimmers = []; this.swimRegion = L.NAME; this.swimLoading = false; }
    const spot = spots.find((s) => Math.hypot(p.pos.x - s.x, p.pos.z - s.z) < 42);
    if (!spot) return;
    if (!this.swimmers.length && !this.swimLoading) {
      this.swimLoading = true; const names = SWIMMERS[L.NAME] || [];
      Promise.all(names.map(async (id, i) => {
        const f = await this.makeFish(id, (FISH_MODEL[id] ? FISH_MODEL[id][1] : 0.6) * 0.7); if (!f) return;
        for (let k = 0; k < 30; k++) { const a = Math.random() * Math.PI * 2, r = 3 + Math.random() * 9, x = spot.x + Math.sin(a) * r, z = spot.z + Math.cos(a) * r; if (L.inWater(x, z) && L.waterDepth(x, z) > 0.3) { Object.assign(f, { x, z, a: Math.random() * 6.28, speed: 0.5 + Math.random() * 0.5, dep: 0.02 + Math.random() * 0.1, turn: 0, ph: i }); break; } }
        if (f.x === undefined) return; this.api.scene.add(f.holder); this.swimmers.push(f);
      })).catch(() => {});
    }
    for (const f of this.swimmers) {
      f.mixer.update(dt * (0.6 + f.speed));
      let nx = f.x + Math.sin(f.a) * f.speed * dt, nz = f.z + Math.cos(f.a) * f.speed * dt;
      if (!L.inWater(nx, nz) || L.waterDepth(nx, nz) < 0.25 || Math.hypot(nx - spot.x, nz - spot.z) > 16) { f.a += (f.turn || (f.turn = Math.random() < 0.5 ? 1 : -1)) * dt * 2.4; nx = f.x; nz = f.z; } else { f.turn = 0; f.a += Math.sin(t * 0.6 + f.ph * 2) * dt * 0.5; }
      f.x = nx; f.z = nz; f.holder.position.set(f.x, L.waterSurface(f.x, f.z) - f.dep + Math.sin(t * 1.4 + f.ph) * 0.03, f.z); f.holder.rotation.y = f.a + Math.PI / 2;
    }
  }
  /** Starts loading the 3D fish while the bar runs, so it is ready when the line is pulled. */
  loadCatch(item) { this.catchReady = null; if (item.junk) return; const def = FISH_MODEL[item.id]; this.makeFish(item.id, def ? def[1] * (0.9 + 0.1 * (item.r || 0)) : 0.5).then((f) => { if (f && this.pending !== undefined) this.catchReady = f; }).catch(() => {}); }
  emojiCard(icon) {
    if (!this.fishCache.has(icon)) { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.font = `92px ${EMOJI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(icon, 64, 72); this.fishCache.set(icon, new THREE.CanvasTexture(c)); }
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.fishCache.get(icon), transparent: true, depthWrite: false })); sp.scale.set(0.9, 0.9, 1); return sp;
  }
  startJump() {
    const item = this.pending.item, fp = this.fpos || this.w; this.jumpFrom = { x: fp.x, y: L.waterSurface(fp.x, fp.z), z: fp.z };
    const f = this.catchReady; const holder = f ? f.holder : this.emojiCard(item.icon); this.api.scene.add(holder);
    this.catchObj = { holder, mixer: f ? f.mixer : null, sprite: !f }; holder.position.set(this.jumpFrom.x, this.jumpFrom.y, this.jumpFrom.z); holder.scale.setScalar(1); this.api.sfx('splash');
  }
  updateJump(dt) {
    const c = this.catchObj; if (!c) { this.finishCatch(); return; }
    const p = this.api.player, from = this.jumpFrom, s = Math.min(1, this.t / 1.3), hx = p.pos.x + Math.sin(p.yaw) * 0.2, hz = p.pos.z + Math.cos(p.yaw) * 0.2, hy = p.pos.y + 2.2;
    c.holder.position.set(from.x + (hx - from.x) * s, from.y + (hy - from.y) * s + Math.sin(Math.PI * s) * 1.3, from.z + (hz - from.z) * s);
    if (!c.sprite) { c.holder.rotation.y = Math.atan2(hx - from.x, hz - from.z) + Math.PI / 2; c.holder.rotation.z = Math.sin(s * Math.PI * 3) * 0.8 * (1 - s); }
    if (c.mixer) c.mixer.update(dt * 3);
    if (s >= 1) this.finishCatch();
  }
  /** The fish is held up over the hero's head while the result text shows (it shrinks away at the end). */
  holdCatch(dt, t) {
    const c = this.catchObj, p = this.api.player; c.holder.position.set(p.pos.x + Math.sin(p.yaw) * 0.2, p.pos.y + 2.2 + Math.sin(t * 3) * 0.05, p.pos.z + Math.cos(p.yaw) * 0.2);
    if (!c.sprite) { c.holder.rotation.y = p.yaw + Math.PI; c.holder.rotation.z = Math.sin(t * 6) * 0.12; } if (c.mixer) c.mixer.update(dt * 1.5);
    c.holder.scale.setScalar(this.t > 2.1 ? Math.max(0.01, 1 - (this.t - 2.1) / 0.3) : 1);
  }
  clearCatch() { if (this.catchObj) { this.catchObj.holder.removeFromParent(); this.catchObj = null; } this.catchReady = null; }
  finishCatch() {
    const { item, text } = this.pending; this.pending = null; this.state = 'result'; this.t = 0;
    this.resultText = `${item.junk ? 'Oh! Just ' : (item.r >= 2 ? 'Wow! I caught a ' : 'I caught a ')}${item.en}!`; this.resultVi = `${item.vi}${item.r !== undefined && !item.junk ? ' · ' + RARITY[item.r] + ' (' + RARITY_VI[item.r] + ')' : ''}${text ? ' · ' + text : ''}`;
    this.api.sfx(item.junk ? 'tick' : item.r >= 2 ? 'fanfare' : 'correct'); if (!item.junk) this.api.speak(item.en); this.caughtIcon = item.icon;
  }
  get active() { return this.state !== 'idle'; }
  /** The fishing spot close to pos in this region, or null. */
  near(pos) { return (SPOTS[L.NAME] || []).find((s) => Math.hypot(pos.x - s.x, pos.z - s.z) < 2.6) || null; }
  /** E near a spot, or the key that goes with the current state. */
  interact(pos) {
    if (this.active) return { text: this.state === 'bite' ? 'E · Kéo cần lên!' : 'E · Thu cần câu', run: () => this.act() };
    const s = this.near(pos); return s ? { text: `E · Câu cá ở ${s.name} (trả lời 4 từ, rồi ngồi thuyền chờ cá cắn)`, run: () => (this.api.gate ? this.api.gate(() => this.start(s)) : this.start(s)) } : null;
  }
  /** Looks round for water: the float goes 3.5–5 m away in the direction that is water, nearest to where the hero faces. */
  waterPoint(pos, yaw) {
    let best = null, bd = 9;
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, d = Math.abs(Math.atan2(Math.sin(a - yaw), Math.cos(a - yaw)));
      for (const r of [3.6, 4.6, 6]) { const x = pos.x + Math.sin(a) * r, z = pos.z + Math.cos(a) * r; if (L.inWater(x, z) && d < bd) { bd = d; best = { x, z, a }; break; } } }
    return best;
  }
  /** Where the boat floats: the first deep water from the bank towards a, plus a little. Null when there is none. */
  boatPoint(pos, a) {
    for (let r = 1.2; r < 6; r += 0.3) { const x = pos.x + Math.sin(a) * r, z = pos.z + Math.cos(a) * r; if (L.inWater(x, z) && L.waterDepth(x, z) > 0.35) { const bx = pos.x + Math.sin(a) * (r + 1.1), bz = pos.z + Math.cos(a) * (r + 1.1); return L.inWater(bx, bz) ? { x: bx, z: bz } : { x, z }; } }
    return null;
  }
  start(spot) {
    const p = this.api.player, w0 = this.waterPoint(p.pos, p.yaw);
    if (!w0) { this.api.ui.toast('Chỗ này không có nước để câu.'); return; }
    const b = this.boatPoint(p.pos, w0.a); let w = w0;
    if (b) {      // into the boat; the float goes 3.4 m further out
      const fx = b.x + Math.sin(w0.a) * 3.4, fz = b.z + Math.cos(w0.a) * 3.4; if (L.inWater(fx, fz)) w = { x: fx, z: fz, a: w0.a };
      this.back = { x: p.pos.x, z: p.pos.z }; const sy = L.waterSurface(b.x, b.z); this.boatAt = { x: b.x, z: b.z, y: sy, a: w0.a };
      this.boat.position.set(b.x, sy + 0.18, b.z); this.boat.rotation.y = w0.a; this.boat.visible = true; p.seat = { x: b.x, y: sy - 0.08, z: b.z, yaw: w0.a };
      this.api.sfx('splash');
    }
    this.spot = spot; this.w = w; p.yaw = w.a; this.state = 'wait'; this.t = 0; this.biteAt = 3 + Math.random() * 4.5; this.api.sfx('tick');
    this.float.position.set(w.x, L.WATER_LEVEL + 0.04, w.z); this.float.visible = this.rod.visible = this.line.visible = true;
    this.api.ui.toast('🎣 Con thả cần câu. Chờ cá cắn nhé!'); gameMusic('fish');
  }
  stop(msg) { if (!this.active) return; this.clearCatch(); this.fpos = null; this.pending = null; endMusic(); this.state = 'idle'; this.boat.visible = false; const p = this.api.player; if (p.seat) { p.seat = null; if (this.back) p.place(this.back.x, this.back.z); } this.back = null; this.float.visible = this.rod.visible = this.line.visible = false; this.hud.style.display = 'none'; if (msg) this.api.ui.toast(msg); }
  /** E, Space or a click. */
  act() {
    if (this.state === 'wait') { this.stop('Con thu cần câu về.'); return true; }
    if (this.state === 'bite' && this.t > 0.35) {
      const ok = this.marker >= this.zone[0] && this.marker <= this.zone[1];
      if (!ok) { this.state = 'result'; this.t = 0; this.resultText = 'It got away!'; this.resultVi = 'Cá thoát mất rồi. Thử lại nhé!'; this.api.sfx('wrong'); return true; }
      const item = this.item, text = this.api.onCatch(item); this.pending = { item, text }; this.state = 'reel'; this.t = 0; this.fpos = { x: this.w.x, z: this.w.z }; this.api.sfx('splash'); return true;      // (23/11) reel it in, then the fish jumps out of the water
    }
    return this.state !== 'idle';
  }
  key(code) { if (!this.active) return false; if (code === 'Escape') { this.stop('Con thu cần câu về.'); return true; } if (code === 'Space' || code === 'KeyE') { this.act(); return true; } return false; }
  update(dt, t) {
    const p = this.api.player;
    this.updateSwimmers(dt, t);
    if (!this.active) return;
    const at = this.back || p.pos; if (!this.spot || Math.hypot(at.x - this.spot.x, at.z - this.spot.z) > 4.5 || L.NAME === undefined) { this.stop(); return; }
    if (this.boat.visible && this.boatAt) { this.boat.position.y = this.boatAt.y + (this.boatModel ? 0.04 : 0.18) + Math.sin(t * 1.6) * 0.04; this.boat.rotation.z = Math.sin(t * 1.2) * 0.04; if (p.seat) p.seat.y = this.boatAt.y - 0.08 + Math.sin(t * 1.6) * 0.04; }
    this.t += dt;
    const w = this.w, fw = this.float, fp = this.fpos || w; fw.position.x = fp.x; fw.position.z = fp.z;
    let bob = Math.sin(t * 2.2) * 0.025, ring = 0.5;
    if (this.state === 'wait' && this.t > this.biteAt) {
      this.item = (L.NAME === 'harbor' || L.NAME === 'isle' ? rollFish : rollRiver)(Math.random, this.api.tier());
      const width = Math.max(64, 170 - 22 * (this.item.r || 0)), s = 90 + Math.random() * (360 - width); this.zone = [s, s + width]; this.state = 'bite'; this.t = 0; this.marker = 0; this.api.sfx('tick'); this.loadCatch(this.item);      // (21/11) wider green zone
    }
    if (this.state === 'bite') { bob = -0.12 + Math.sin(t * 26) * 0.045; ring = 1; const sp = 0.42 + 0.08 * this.api.tier(), k = (this.t * sp) % 2; this.marker = this.hold ? (this.zone[0] + this.zone[1]) / 2 : (k < 1 ? k : 2 - k) * 360; if (this.t > 8) { this.state = 'result'; this.t = 0; this.resultText = 'Too slow!'; this.resultVi = 'Chậm quá, cá thoát mất.'; this.api.sfx('wrong'); } }      // (21/11) "too fast to press in time": about 2.4 s for one pass
    if (this.state === 'reel') {      // (23/11) the float is pulled to the boat, the rod bends up, then the fish jumps out
      const k = Math.min(1, this.t / 1.1), e = k * k * (3 - 2 * k), at = this.boatAt || p.pos;
      this.fpos = { x: w.x + (at.x - w.x) * e * 0.78, z: w.z + (at.z - w.z) * e * 0.78 }; bob = -0.05 + Math.sin(t * 30) * 0.03; ring = 1;
      if (this.t >= 1.1) { this.state = 'jump'; this.t = 0; this.startJump(); }
    } else if (this.state === 'jump') this.updateJump(dt);
    else if (this.state === 'result' && this.catchObj) this.holdCatch(dt, t);
    if (this.state === 'result' && this.t > 2.4) { this.clearCatch(); this.fpos = null; this.state = 'wait'; this.t = 0; this.biteAt = 2.5 + Math.random() * 4.5; }
    fw.position.y = L.WATER_LEVEL + 0.04 + bob;
    this.rings.forEach((r, i) => { const k = ((t * (this.state === 'bite' ? 1.8 : 0.7) + i * 0.5) % 1); r.scale.setScalar(1 + k * (this.state === 'bite' ? 4 : 2.2)); r.material.opacity = ring * (1 - k) * 0.7; r.position.y = 0.02 - bob; });
    // rod in the hands, line to the float
    const yaw = p.yaw, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const base = new THREE.Vector3(p.pos.x + fx * 0.35 + rx * 0.22, p.pos.y + 0.85, p.pos.z + fz * 0.35 + rz * 0.22);
    const raise = this.state === 'bite' ? 0.12 : this.state === 'reel' ? 0.45 : this.state === 'jump' ? 0.3 : 0;
    const tip = this.rodModel ? new THREE.Vector3(base.x + fx * 1.9, base.y + 1.1 + raise, base.z + fz * 1.9) : new THREE.Vector3(base.x + fx * 1.2, base.y + 1.15 + raise, base.z + fz * 1.2);
    if (this.rodModel) { this.rod.position.copy(base); this.rod.lookAt(tip); } else { this.rod.position.copy(base).lerp(tip, 0.5); this.rod.lookAt(tip); this.rod.rotateX(Math.PI / 2); }
    const pts = this.lineGeo.attributes.position, end = fw.position;
    for (let i = 0; i < 12; i++) { const k = i / 11, sag = Math.sin(k * Math.PI) * 0.55; pts.setXYZ(i, tip.x + (end.x - tip.x) * k, tip.y + (end.y + 0.1 - tip.y) * k - sag, tip.z + (end.z - tip.z) * k); }
    pts.needsUpdate = true;
    // HUD
    const h = this.hud; h.style.display = 'block';
    if (this.state === 'wait') h.innerHTML = `<div>🎣 Đang chờ cá cắn…</div><small>E hoặc Esc: thu cần câu</small>`;
    else if (this.state === 'bite') h.innerHTML = `<div class="big">❗ BITE! ❗</div><div class="bar"><div class="zone" style="left:${this.zone[0] / 360 * 100}%;width:${(this.zone[1] - this.zone[0]) / 360 * 100}%"></div><div class="mark" style="left:${this.marker / 360 * 100}%"></div></div><small>Bấm chuột / E / Space khi vạch đỏ nằm trong vùng xanh!</small>`;
    else if (this.state === 'reel' || this.state === 'jump') h.innerHTML = `<div class="big">🎣 Got it! Kéo lên!</div>`;
    else if (this.state === 'result') h.innerHTML = `<div class="big" style="font-family:${EMOJI}">${this.resultText}</div><small>${this.resultVi || ''}</small>`;
  }
}

// Fishing in the world (20/11: "a rod, sit and wait, pull the fish up when one bites, and the sliding bar as before"):
// E at a fishing spot (the village dock, the end of the harbor's small pier) puts a rod in Ngọc's hands with a float on the
// water. Wait… the float dips and "❗ BITE!" shows: press E / Space / click when the sliding mark is inside the green zone.
// One fish per bite; keep fishing until you press Esc or E while waiting. The catch is read aloud (English name + meaning).
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { rollFish, rollRiver } from '../core/sea.js';

export const SPOTS = { village: [{ x: 18.4, z: 19.2, name: 'bến sông' }], harbor: [{ x: 34, z: 28, name: 'cầu tàu nhỏ' }] };
const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';

export class Fishing {
  /** api: { scene, player, ui, sfx, profile(), tier(), onCatch(item) -> text, speak(en) } */
  constructor(api) {
    this.api = api; this.state = 'idle'; this.t = 0; this.spot = null; this.float = new THREE.Group(); this.float.visible = false;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 9), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })), top = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe8443a, roughness: 0.5 }));
    top.position.y = 0.0; this.float.add(ball, top);
    const rings = []; for (let i = 0; i < 2; i++) { const r = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.26, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.y = 0.02; this.float.add(r); rings.push(r); }
    this.rings = rings;
    this.rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.04, 2.1, 6), new THREE.MeshStandardMaterial({ color: 0x7a4a24, roughness: 0.8 })); this.rod.visible = false;
    this.lineGeo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 12 }, () => new THREE.Vector3())); this.line = new THREE.Line(this.lineGeo, new THREE.LineBasicMaterial({ color: 0xf4f4f4, transparent: true, opacity: 0.85 })); this.line.frustumCulled = false; this.line.visible = false;
    api.scene.add(this.float, this.rod, this.line);
    const css = document.createElement('style'); css.textContent = `#fishhud{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:27;width:min(420px,calc(100vw - 20px));padding:8px 12px 10px;border-radius:14px;background:rgba(10,40,70,.82);color:#fff;font:800 15px system-ui,sans-serif;text-align:center;pointer-events:none;display:none}
#fishhud .big{font:900 26px system-ui;color:#ffd23c;text-shadow:0 2px 3px #000;margin-bottom:4px} #fishhud .bar{position:relative;height:26px;border-radius:13px;background:rgba(255,255,255,.88);overflow:hidden;margin-top:4px}
#fishhud .zone{position:absolute;top:3px;bottom:3px;border-radius:10px;background:#4fd070} #fishhud .mark{position:absolute;top:0;bottom:0;width:6px;margin-left:-3px;background:#e8443a;border-radius:3px} #fishhud small{display:block;font-weight:600;opacity:.85;margin-top:3px}`;
    document.head.appendChild(css);
    this.hud = document.createElement('div'); this.hud.id = 'fishhud'; document.body.appendChild(this.hud);
  }
  get active() { return this.state !== 'idle'; }
  /** The fishing spot close to pos in this region, or null. */
  near(pos) { return (SPOTS[L.NAME] || []).find((s) => Math.hypot(pos.x - s.x, pos.z - s.z) < 2.6) || null; }
  /** E near a spot, or the key that goes with the current state. */
  interact(pos) {
    if (this.active) return { text: this.state === 'bite' ? 'E · Kéo cần lên!' : 'E · Thu cần câu', run: () => this.act() };
    const s = this.near(pos); return s ? { text: `E · Câu cá ở ${s.name} (cần câu, ngồi chờ cá cắn)`, run: () => this.start(s) } : null;
  }
  /** Looks round for water: the float goes 3.5–5 m away in the direction that is water, nearest to where the hero faces. */
  waterPoint(pos, yaw) {
    let best = null, bd = 9;
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, d = Math.abs(Math.atan2(Math.sin(a - yaw), Math.cos(a - yaw)));
      for (const r of [3.6, 4.6, 6]) { const x = pos.x + Math.sin(a) * r, z = pos.z + Math.cos(a) * r; if (L.inWater(x, z) && d < bd) { bd = d; best = { x, z, a }; break; } } }
    return best;
  }
  start(spot) {
    const p = this.api.player, w = this.waterPoint(p.pos, p.yaw);
    if (!w) { this.api.ui.toast('Chỗ này không có nước để câu.'); return; }
    this.spot = spot; this.w = w; p.yaw = w.a; this.state = 'wait'; this.t = 0; this.biteAt = 2.5 + Math.random() * 4.5; this.api.sfx('tick');
    this.float.position.set(w.x, L.WATER_LEVEL + 0.04, w.z); this.float.visible = this.rod.visible = this.line.visible = true;
    this.api.ui.toast('🎣 Con thả cần câu. Chờ cá cắn nhé!');
  }
  stop(msg) { if (!this.active) return; this.state = 'idle'; this.float.visible = this.rod.visible = this.line.visible = false; this.hud.style.display = 'none'; if (msg) this.api.ui.toast(msg); }
  /** E, Space or a click. */
  act() {
    if (this.state === 'wait') { this.stop('Con thu cần câu về.'); return true; }
    if (this.state === 'bite' && this.t > 0.35) {
      const ok = this.marker >= this.zone[0] && this.marker <= this.zone[1];
      if (!ok) { this.state = 'result'; this.t = 0; this.resultText = 'It got away!'; this.resultVi = 'Cá thoát mất rồi. Thử lại nhé!'; this.api.sfx('wrong'); return true; }
      const item = this.item, text = this.api.onCatch(item); this.state = 'result'; this.t = 0; this.resultText = `${item.junk ? 'Oh! ' : 'I caught '}${item.junk ? 'Just ' : 'a '}${item.en}!`; this.resultVi = `${item.vi}${text ? ' · ' + text : ''}`; this.api.sfx(item.junk ? 'tick' : 'fanfare');
      if (!item.junk) this.api.speak(item.en); this.caughtIcon = item.icon; return true;
    }
    return this.state !== 'idle';
  }
  key(code) { if (!this.active) return false; if (code === 'Escape') { this.stop('Con thu cần câu về.'); return true; } if (code === 'Space' || code === 'KeyE') { this.act(); return true; } return false; }
  update(dt, t) {
    const p = this.api.player;
    if (!this.active) return;
    if (!this.spot || Math.hypot(p.pos.x - this.spot.x, p.pos.z - this.spot.z) > 4.5 || L.NAME === undefined) { this.stop(); return; }
    this.t += dt;
    const w = this.w, fw = this.float; fw.position.x = w.x; fw.position.z = w.z;
    let bob = Math.sin(t * 2.2) * 0.025, ring = 0.5;
    if (this.state === 'wait' && this.t > this.biteAt) {
      this.item = (L.NAME === 'harbor' || L.NAME === 'isle' ? rollFish : rollRiver)(Math.random, this.api.tier());
      const width = Math.max(44, 150 - 24 * (this.item.r || 0)), s = 90 + Math.random() * (360 - width); this.zone = [s, s + width]; this.state = 'bite'; this.t = 0; this.marker = 0; this.api.sfx('tick');
    }
    if (this.state === 'bite') { bob = -0.12 + Math.sin(t * 26) * 0.045; ring = 1; const sp = 1.0 + 0.2 * this.api.tier(), k = (this.t * sp) % 2; this.marker = this.hold ? (this.zone[0] + this.zone[1]) / 2 : (k < 1 ? k : 2 - k) * 360; if (this.t > 4.6) { this.state = 'result'; this.t = 0; this.resultText = 'Too slow!'; this.resultVi = 'Chậm quá, cá thoát mất.'; this.api.sfx('wrong'); } }
    if (this.state === 'result' && this.t > 2.4) { this.state = 'wait'; this.t = 0; this.biteAt = 2.5 + Math.random() * 4.5; }
    fw.position.y = L.WATER_LEVEL + 0.04 + bob;
    this.rings.forEach((r, i) => { const k = ((t * (this.state === 'bite' ? 1.8 : 0.7) + i * 0.5) % 1); r.scale.setScalar(1 + k * (this.state === 'bite' ? 4 : 2.2)); r.material.opacity = ring * (1 - k) * 0.7; r.position.y = 0.02 - bob; });
    // rod in the hands, line to the float
    const yaw = p.yaw, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const base = new THREE.Vector3(p.pos.x + fx * 0.35 + rx * 0.22, p.pos.y + 0.85, p.pos.z + fz * 0.35 + rz * 0.22);
    const tip = new THREE.Vector3(base.x + fx * 1.2, base.y + 1.15 + (this.state === 'bite' ? 0.12 : 0), base.z + fz * 1.2);
    this.rod.position.copy(base).lerp(tip, 0.5); this.rod.lookAt(tip); this.rod.rotateX(Math.PI / 2);
    const pts = this.lineGeo.attributes.position, end = fw.position;
    for (let i = 0; i < 12; i++) { const k = i / 11, sag = Math.sin(k * Math.PI) * 0.55; pts.setXYZ(i, tip.x + (end.x - tip.x) * k, tip.y + (end.y + 0.1 - tip.y) * k - sag, tip.z + (end.z - tip.z) * k); }
    pts.needsUpdate = true;
    // HUD
    const h = this.hud; h.style.display = 'block';
    if (this.state === 'wait') h.innerHTML = `<div>🎣 Đang chờ cá cắn…</div><small>E hoặc Esc: thu cần câu</small>`;
    else if (this.state === 'bite') h.innerHTML = `<div class="big">❗ BITE! ❗</div><div class="bar"><div class="zone" style="left:${this.zone[0] / 360 * 100}%;width:${(this.zone[1] - this.zone[0]) / 360 * 100}%"></div><div class="mark" style="left:${this.marker / 360 * 100}%"></div></div><small>Bấm chuột / E / Space khi vạch đỏ nằm trong vùng xanh!</small>`;
    else if (this.state === 'result') h.innerHTML = `<div class="big" style="font-family:${EMOJI}">${this.resultText}</div><small>${this.resultVi || ''}</small>`;
  }
}

// The sea pet in the world (19/11): a small low-poly seagull, otter or hermit crab that trots (or hovers) behind the hero and
// performs the tricks the child teaches it. Simple shapes in the game's palette; one mesh per kind, rebuilt when the kind changes.
import * as THREE from 'three';
import * as L from '../core/layout.js';

const M = (c, r = 0.7) => new THREE.MeshStandardMaterial({ color: c, roughness: r });
function build(kind) {
  const g = new THREE.Group(), eye = M(0x1a1a20, 0.3);
  const add = (geo, m, x, y, z, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; g.add(o); return o; };
  const eyes = (y, z, w, r = 0.025) => { for (const s of [-1, 1]) add(new THREE.SphereGeometry(r, 8, 6), eye, s * w, y, z); };
  if (kind === 'gull') {
    const white = M(0xf8f8f4), gray = M(0x9aa8b8), orange = M(0xf0a030);
    add(new THREE.SphereGeometry(0.2, 14, 10), white, 0, 0.3, 0, 1, 0.85, 1.35); add(new THREE.SphereGeometry(0.115, 12, 10), white, 0, 0.5, 0.26);
    const beak = add(new THREE.ConeGeometry(0.035, 0.12, 6), orange, 0, 0.49, 0.38); beak.rotation.x = Math.PI / 2; eyes(0.54, 0.34, 0.06);
    for (const s of [-1, 1]) { const w = add(new THREE.SphereGeometry(0.16, 10, 8), gray, s * 0.18, 0.33, -0.02, 0.35, 0.18, 1.05); w.rotation.z = -s * 0.25; g.userData.wing = (g.userData.wing || []).concat(w); }
    add(new THREE.ConeGeometry(0.1, 0.2, 4), gray, 0, 0.28, -0.34).rotation.x = -Math.PI / 2 + 0.3;
    g.userData.hover = 0.45;
  } else if (kind === 'otter') {
    const brown = M(0x8a5a38), tan = M(0xd8b890);
    add(new THREE.CapsuleGeometry(0.14, 0.34, 6, 12), brown, 0, 0.24, 0).rotation.x = Math.PI / 2; add(new THREE.SphereGeometry(0.14, 12, 10), brown, 0, 0.34, 0.3); add(new THREE.SphereGeometry(0.08, 10, 8), tan, 0, 0.3, 0.4, 1.1, 0.8, 1);
    add(new THREE.SphereGeometry(0.02, 8, 6), eye, 0, 0.32, 0.47); eyes(0.4, 0.4, 0.06); for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.035, 8, 6), brown, s * 0.1, 0.47, 0.27);
    const tail = add(new THREE.CapsuleGeometry(0.05, 0.3, 4, 8), brown, 0, 0.2, -0.42); tail.rotation.x = Math.PI / 2 - 0.2; for (const [x, z] of [[-0.1, 0.12], [0.1, 0.12], [-0.1, -0.14], [0.1, -0.14]]) add(new THREE.SphereGeometry(0.05, 8, 6), brown, x, 0.06, z, 1, 1.1, 1.3);
  } else if (kind === 'puppy' || kind === 'kitten') {      // (21/11) the village pets: a round chibi body, big head, ears, tail
    const dog = kind === 'puppy', fur = M(dog ? 0xd8a060 : 0xb8b0a8), light = M(dog ? 0xf6e2c0 : 0xf2eee8), pink = M(0xf09aa8), nose = M(0x2a2024, 0.4);
    add(new THREE.SphereGeometry(0.17, 14, 10), fur, 0, 0.24, 0, 1, 0.9, 1.3); add(new THREE.SphereGeometry(0.16, 14, 12), fur, 0, 0.44, 0.2); add(new THREE.SphereGeometry(0.08, 10, 8), light, 0, 0.4, 0.33, 1.1, 0.8, 0.9);
    add(new THREE.SphereGeometry(0.025, 8, 6), dog ? nose : pink, 0, 0.42, 0.4); eyes(0.47, 0.33, 0.065, 0.028);
    for (const sx of [-1, 1]) { if (dog) { const e = add(new THREE.SphereGeometry(0.07, 10, 8), M(0x8a5a30), sx * 0.13, 0.5, 0.17, 0.6, 1.3, 0.8); e.rotation.z = sx * 0.6; } else { const e = add(new THREE.ConeGeometry(0.055, 0.12, 4), fur, sx * 0.09, 0.6, 0.18); e.rotation.z = -sx * 0.25; } }
    for (const [x, z] of [[-0.09, 0.14], [0.09, 0.14], [-0.09, -0.14], [0.09, -0.14]]) add(new THREE.CylinderGeometry(0.04, 0.045, 0.14, 8), light, x, 0.07, z);
    const tail = add(new THREE.CapsuleGeometry(0.03, dog ? 0.12 : 0.22, 4, 8), fur, 0, 0.32, -0.24); tail.rotation.x = dog ? -0.6 : -1.0; g.userData.tail = tail;
  } else if (kind === 'bunny') {
    const fur = M(0xf6f2ee), pink = M(0xf4a0b4);
    add(new THREE.SphereGeometry(0.16, 14, 10), fur, 0, 0.2, 0, 1, 0.95, 1.15); add(new THREE.SphereGeometry(0.13, 14, 12), fur, 0, 0.38, 0.14); add(new THREE.SphereGeometry(0.06, 8, 6), fur, 0, 0.22, -0.18);
    add(new THREE.SphereGeometry(0.02, 8, 6), pink, 0, 0.37, 0.27); eyes(0.42, 0.24, 0.055, 0.024);
    for (const sx of [-1, 1]) { const e = add(new THREE.CapsuleGeometry(0.035, 0.18, 4, 8), fur, sx * 0.05, 0.6, 0.1); e.rotation.z = sx * 0.15; add(new THREE.CapsuleGeometry(0.015, 0.13, 4, 6), pink, sx * 0.05, 0.6, 0.13).rotation.z = sx * 0.15; }
  } else if (kind === 'duckling') {
    const y = M(0xffd84a), o = M(0xf08a1e);
    add(new THREE.SphereGeometry(0.14, 14, 10), y, 0, 0.17, 0, 1, 0.9, 1.2); add(new THREE.SphereGeometry(0.1, 12, 10), y, 0, 0.34, 0.1);
    const bk = add(new THREE.ConeGeometry(0.035, 0.08, 6), o, 0, 0.33, 0.21); bk.rotation.x = Math.PI / 2; bk.scale.set(1.4, 1, 0.6); eyes(0.37, 0.18, 0.05, 0.02);
    for (const s of [-1, 1]) { const w = add(new THREE.SphereGeometry(0.07, 8, 6), y, s * 0.13, 0.19, 0, 0.4, 0.6, 1); g.userData.wing = (g.userData.wing || []).concat(w); add(new THREE.BoxGeometry(0.06, 0.015, 0.08), o, s * 0.05, 0.01, 0.03); }
  } else {
    const shell = M(0xf08a3c, 0.5), claw = M(0xe2483e), cream = M(0xf6e2c0);
    add(new THREE.SphereGeometry(0.2, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), shell, 0, 0.12, 0, 1, 0.9, 1); add(new THREE.SphereGeometry(0.2, 12, 8), cream, 0, 0.1, 0, 1, 0.45, 1); add(new THREE.TorusGeometry(0.17, 0.02, 6, 20), M(0xffffff), 0, 0.2, 0).rotation.x = Math.PI / 2;
    for (const s of [-1, 1]) { add(new THREE.SphereGeometry(0.075, 10, 8), claw, s * 0.26, 0.14, 0.2, 1.2, 0.8, 1.2); add(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 5), cream, s * 0.07, 0.26, 0.16); add(new THREE.SphereGeometry(0.025, 8, 6), eye, s * 0.07, 0.32, 0.16); for (const z of [-0.08, 0, 0.08]) add(new THREE.BoxGeometry(0.12, 0.014, 0.014), claw, s * 0.2, 0.05, z - 0.02); }
  }
  return g;
}
const turn = (a, b, k) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * Math.min(1, k); };
export class Pet {
  /** load(name) -> Promise<{ scene, animations }> (a private clone); the Blender model replaces the shapes when it arrives. */
  constructor(scene, load) { this.load = load; this.root = new THREE.Group(); this.root.name = 'pet'; scene.add(this.root); this.kind = null; this.t = 0; this.trick = ''; this.trickT = 0; this.pos = new THREE.Vector3(); this.yaw = 0; this.moving = false; this.root.visible = false; this.body = null; }
  /** Shows the pet of this kind (null hides it). */
  set(kind) {
    if (kind === this.kind) return; this.kind = kind; this.root.clear(); this.body = null; this.mixer = null; this.actions = null; this.cur = '';
    if (!kind) { this.root.visible = false; return; }
    this.body = build(kind); this.root.add(this.body); this.root.visible = true;
    if (this.load) this.load(`pet_${kind}_v01`).then((m) => { if (this.kind !== kind || !m) return; this.useModel(m); }, () => {});
  }
  /** Swaps the shapes for the rigged model: idle and walk loop, the tricks are one-shot clips. */
  useModel(m) {
    this.root.clear(); const body = new THREE.Group(); body.add(m.scene); this.body = body; this.root.add(body);
    m.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    this.mixer = new THREE.AnimationMixer(m.scene); this.actions = {}; this.cur = '';
    for (const c of m.animations) { const a = this.mixer.clipAction(c); this.actions[c.name] = a; if (!['idle', 'walk'].includes(c.name)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } }
    this.fade('idle');
  }
  fade(name) {
    if (!this.actions || this.cur === name || !this.actions[name]) return; const next = this.actions[name], prev = this.actions[this.cur];
    next.reset().play(); if (prev) prev.crossFadeTo(next, 0.18, false); this.cur = name;
  }
  /** Puts the pet next to the hero (after travelling). */
  snap(x, z) { this.pos.set(x - 1.1, 0, z - 0.8); this.place(); }
  play(trick) { this.trick = trick; this.trickT = 0; this.trickLen = 0; }
  place() { const fly = this.body && this.body.userData.hover, y = Math.max(L.walkHeight(this.pos.x, this.pos.z), fly ? L.WATER_LEVEL : -9); this.root.position.set(this.pos.x, y + (fly ? this.body.userData.hover + Math.sin(this.t * 3) * 0.06 : 0), this.pos.z); }
  update(dt, player, yaw) {
    if (!this.kind || !this.body) return; this.t += dt;
    const tx = player.x - Math.sin(yaw) * 1.5 + Math.cos(yaw) * 0.9, tz = player.z - Math.cos(yaw) * 1.5 - Math.sin(yaw) * 0.9, dx = tx - this.pos.x, dz = tz - this.pos.z, d = Math.hypot(dx, dz), fly = !!this.body.userData.hover;
    if (d > 10 || Math.hypot(player.x - this.pos.x, player.z - this.pos.z) > 14) this.snap(player.x, player.z);
    else if (d > 0.4) {
      const step = Math.min(d, Math.min(4.6, 1.0 + d * 1.8) * dt), nx = this.pos.x + dx / d * step, nz = this.pos.z + dz / d * step;
      if (fly || L.walkable(nx, nz, 0.2)) { this.pos.x = nx; this.pos.z = nz; } else if (L.walkable(nx, this.pos.z, 0.2)) this.pos.x = nx; else if (L.walkable(this.pos.x, nz, 0.2)) this.pos.z = nz;
      this.yaw = turn(this.yaw, Math.atan2(dx, dz), 8 * dt); this.moving = true;
    } else { this.moving = false; this.yaw = turn(this.yaw, yaw, 3 * dt); }
    if (this.mixer) {      // rigged model: clips do the moving
      this.place(); this.body.rotation.set(0, this.yaw, 0); this.mixer.update(dt);
      if (this.trick) { const a = this.actions[this.trick]; if (a && this.trickT === 0) { a.reset().play(); if (this.actions[this.cur]) this.actions[this.cur].crossFadeTo(a, 0.12, false); this.cur = this.trick; this.trickLen = a.getClip().duration; }
        this.trickT += dt; if (!a || this.trickT >= (this.trickLen || 1.2)) { this.trick = ''; this.cur = ''; this.fade(this.moving ? 'walk' : 'idle'); } }
      else this.fade(this.moving ? 'walk' : 'idle');
      return;
    }
    this.place(); const b = this.body; b.rotation.set(0, this.yaw, 0); b.position.y = this.moving && !fly ? Math.abs(Math.sin(this.t * 10)) * 0.05 : 0; b.scale.set(1, 1 + Math.sin(this.t * 2.4) * 0.015, 1);
    if (b.userData.tail) b.userData.tail.rotation.z = Math.sin(this.t * (this.moving ? 14 : 6)) * 0.5;
    if (b.userData.wing) b.userData.wing.forEach((w, i) => { w.rotation.z = (i ? 1 : -1) * (-0.25 - (this.moving ? Math.sin(this.t * 16) * 0.5 : 0)); });
    if (this.trick) {          // a trick: about 1.2 seconds
      this.trickT += dt; const k = this.trickT / 1.2; if (k >= 1) this.trick = ''; else {
        if (this.trick === 'spin') b.rotation.y = this.yaw + k * Math.PI * 4; if (this.trick === 'jump') b.position.y += Math.sin(k * Math.PI) * 0.7;
        if (this.trick === 'roll') b.rotation.z = k * Math.PI * 2; if (this.trick === 'dance') { b.rotation.y = this.yaw + Math.sin(k * 30) * 0.5; b.position.y += Math.abs(Math.sin(k * 20)) * 0.15; }
        if (this.trick === 'wave') b.rotation.z = Math.sin(k * 24) * 0.35; if (this.trick === 'sit') b.scale.set(1.05, 0.7, 1.05);
      }
    }
  }
}

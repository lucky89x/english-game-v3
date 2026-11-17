// Player (Ngọc, skinned GLB with 10 clips), orbit camera with collision, NPCs and memory crystals.
import * as THREE from 'three';
import * as L from '../core/layout.js';

const WALK = 3.4, RUN = 6.3, JUMP = 6.6, GRAVITY = 19;

export class Player {
  constructor(gltf, faceTextures) {
    this.root = gltf.scene; this.mixer = new THREE.AnimationMixer(this.root); this.actions = {};
    for (const clip of gltf.animations) this.actions[clip.name] = this.mixer.clipAction(clip);
    for (const once of ['Jump', 'Land', 'Wave', 'Celebrate', 'Interact']) if (this.actions[once]) { this.actions[once].setLoop(THREE.LoopOnce); this.actions[once].clampWhenFinished = true; }
    this.root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; if (o.material.name === 'NgocFace') this.face = o.material; } });
    this.faceMaps = { happy: this.face ? this.face.map : null, ...faceTextures };
    this.blink = 2.5; this.faceHold = 0;
    this.pos = new THREE.Vector3(); this.vy = 0; this.grounded = true; this.yaw = Math.PI; this.current = ''; this.route = null; this.lock = 0; this.stepTimer = 0;
    this.play('Idle');
    this.mixer.addEventListener('finished', (e) => { if (['Land', 'Wave', 'Celebrate', 'Interact'].includes(e.action.getClip().name)) this.play('Idle'); });
  }
  place(x, z) { this.pos.set(x, L.walkHeight(x, z), z); this.vy = 0; this.grounded = true; this.route = null; this.sync(); }
  play(name, fade = 0.16) {
    if (this.current === name || !this.actions[name]) return;
    const next = this.actions[name], prev = this.actions[this.current];
    next.reset().setEffectiveWeight(1).play();
    if (prev) prev.crossFadeTo(next, fade, false);
    this.current = name;
  }
  emote(name) { this.play(name, 0.1); this.lock = name === 'Celebrate' ? 1.2 : 0.7; if (name === 'Celebrate') this.setFace('joy', 1.4); }
  setFace(name, hold) { if (this.face && this.faceMaps[name]) { this.face.map = this.faceMaps[name]; this.faceHold = hold; } }
  sync() { this.root.position.copy(this.pos); this.root.rotation.y = this.yaw; }

  /** input: {x, z} in camera space (z forward), run, jump. camYaw: camera orbit yaw. */
  update(dt, input, camYaw, frozen, sfx) {
    let mx = 0, mz = 0, speed = 0;
    this.lock = Math.max(0, this.lock - dt);
    const manual = input.x || input.z;
    if (manual || input.jump) this.route = null;                       // WASD cancels auto travel
    if (!frozen && this.lock <= 0) {
      if (manual) {
        const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw), rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
        mx = fx * input.z + rx * input.x; mz = fz * input.z + rz * input.x;
        const len = Math.hypot(mx, mz) || 1; mx /= len; mz /= len; speed = input.run ? RUN : WALK;
      } else if (this.route && this.route.length) {
        const t = this.route[0], dx = t.x - this.pos.x, dz = t.z - this.pos.z, d = Math.hypot(dx, dz);
        if (d < 0.45) { this.route.shift(); if (!this.route.length) this.route = null; }
        else { mx = dx / d; mz = dz / d; speed = RUN * 0.92; }
      }
      if (input.jump && this.grounded) { this.vy = JUMP; this.grounded = false; this.play('Jump', 0.08); }
    }
    if (speed > 0) {
      const sx = mx * speed * dt, sz = mz * speed * dt, { x, z } = this.pos;
      if (L.canStep(x, z, x + sx, z + sz)) { this.pos.x += sx; this.pos.z += sz; }
      else if (L.canStep(x, z, x + sx, z)) this.pos.x += sx;
      else if (L.canStep(x, z, x, z + sz)) this.pos.z += sz;
      else if (this.route) this.route = null;
      let diff = Math.atan2(mx, mz) - this.yaw; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.yaw += diff * Math.min(1, dt * 12);
    }
    const ground = L.walkHeight(this.pos.x, this.pos.z);
    if (this.grounded) {
      if (this.pos.y - ground > 0.45) { this.grounded = false; this.vy = 0; } else this.pos.y += (ground - this.pos.y) * Math.min(1, dt * 18);
    }
    if (!this.grounded) {
      this.vy -= GRAVITY * dt; this.pos.y += this.vy * dt;
      if (this.vy < -1.5 && this.current !== 'Fall') this.play('Fall', 0.12);
      if (this.pos.y <= ground) { this.pos.y = ground; this.grounded = true; this.vy = 0; this.play('Land', 0.06); this.lock = 0.12; if (sfx) sfx('step'); }
    } else if (speed > 0) {
      this.play(speed > WALK + 0.5 ? 'Run' : 'Walk');
      this.stepTimer -= dt * speed; if (this.stepTimer <= 0) { this.stepTimer = 2.1; if (sfx) sfx('step'); }
    } else if (this.lock <= 0 && !['Wave', 'Celebrate', 'Interact', 'Land', 'Talk'].includes(this.current)) this.play('Idle');
    else if (this.current === 'Talk' && !frozen) this.play('Idle');
    // blinking + temporary expressions
    if (this.face) {
      if (this.faceHold > 0) { this.faceHold -= dt; if (this.faceHold <= 0) this.face.map = this.faceMaps.happy; }
      else { this.blink -= dt; if (this.blink <= 0) { this.setFace('blink', 0.12); this.blink = 2.4 + Math.random() * 2.6; } }
    }
    this.mixer.update(dt); this.sync();
    return speed;
  }
}

// Third-person camera behind Ngọc (the fixed diagonal view was tried on 17/11 and dropped: "hard to see").
// Drag turns and tilts, the wheel or a pinch zooms. Slightly higher and further than before so more of the
// village is in view.
export const CAM = { fov: 50, pitch: 0.5, dist: 9.5, min: 3.5, max: 18 };
export class OrbitCamera {
  constructor(camera, dom) {
    this.camera = camera; this.yaw = 0; this.pitch = CAM.pitch; this.dist = CAM.dist; this.tYaw = 0; this.tPitch = CAM.pitch; this.tDist = CAM.dist; this.cur = CAM.dist;
    camera.fov = CAM.fov; camera.updateProjectionMatrix();
    this.target = new THREE.Vector3(); let drag = false, lx = 0, ly = 0;
    dom.addEventListener('mousedown', (e) => { if (e.button === 0 || e.button === 2) { drag = true; lx = e.clientX; ly = e.clientY; } });
    addEventListener('mouseup', () => (drag = false));
    addEventListener('mousemove', (e) => { if (!drag) return; this.tYaw -= (e.clientX - lx) * 0.006; this.tilt((e.clientY - ly) * 0.005); lx = e.clientX; ly = e.clientY; });
    dom.addEventListener('wheel', (e) => { e.preventDefault(); this.zoom(e.deltaY > 0 ? 1.12 : 1 / 1.12); }, { passive: false });
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  zoom(f) { this.tDist = Math.min(CAM.max, Math.max(CAM.min, this.tDist * f)); }
  tilt(d) { this.tPitch = Math.min(1.25, Math.max(0.05, this.tPitch + d)); }
  /** Shortest unobstructed distance from the target towards the wanted camera spot: only the ground and big solids
   *  (houses, cliffs) pull the camera in. Tree crowns no longer do: the constant zooming in and out among trees made
   *  children dizzy (feedback 17/11). */
  clearDistance(dir, want) {
    for (let d = 1.0; d <= want; d += 0.35) {
      const x = this.target.x + dir.x * d, y = this.target.y + dir.y * d, z = this.target.z + dir.z * d;
      if (y < L.groundHeight(x, z) + 0.35) return Math.max(3.0, d - 0.4);
      if (y < 4.5) for (const s of L.solidsNear(x, z)) if (s.r > 2.0 && Math.hypot(x - s.x, z - s.z) < s.r + 0.2) return Math.max(3.0, d - 0.4);
    }
    return want;
  }
  update(dt, focus) {
    // frame-rate independent smoothing: the same feel at 15 or 60 frames a second; a long stall does not jump
    dt = Math.min(dt, 0.12);
    const k = 1 - Math.exp(-dt * 10);
    this.yaw += (this.tYaw - this.yaw) * k; this.pitch += (this.tPitch - this.pitch) * k; this.dist += (this.tDist - this.dist) * k;
    this.goal = (this.goal || new THREE.Vector3()).set(focus.x, focus.y + 1.25, focus.z);
    if (this.target.distanceTo(this.goal) > 6) this.target.copy(this.goal);           // teleport: no long swoop
    else { const f = 1 - Math.exp(-dt * 11); this.target.x += (this.goal.x - this.target.x) * f; this.target.z += (this.goal.z - this.target.z) * f; this.target.y += (this.goal.y - this.target.y) * (1 - Math.exp(-dt * 4)); }   // gentle vertical follow: jumps and bumps do not shake the view
    // Behind a house or a hill the camera rises over it instead of zooming in and out (feedback 17/11: dizzy when
    // walking). Only when rising is not enough does it come closer, slowly.
    const at = (p) => new THREE.Vector3(Math.sin(this.yaw) * Math.cos(p), Math.sin(p), Math.cos(this.yaw) * Math.cos(p));
    let want = 0, free = this.dist;
    for (const up of [0, 0.15, 0.3, 0.45]) { const f = this.clearDistance(at(Math.min(1.3, this.pitch + up)), this.dist); want = up; free = f; if (f >= this.dist - 0.01) break; }
    this.lift = (this.lift || 0) + (want - (this.lift || 0)) * (1 - Math.exp(-dt * 2.2));
    const dir = at(Math.min(1.3, this.pitch + this.lift));
    if (free >= this.dist - 0.01) free = this.clearDistance(dir, this.dist);
    this.cur += (free - this.cur) * (1 - Math.exp(-dt * (free < this.cur ? 3.5 : 1.6)));
    this.camera.position.copy(this.target).addScaledVector(dir, this.cur);
    this.camera.lookAt(this.target);
  }
}

export class Npc {
  /** clips: animations to use when the file has none (Lily, Rose and Anna share Ngọc's skeleton and clips). */
  constructor(gltf, x, z, yaw, clips) {
    const anims = gltf.animations.length ? gltf.animations : clips || [];
    this.root = gltf.scene; this.mixer = anims.length ? new THREE.AnimationMixer(this.root) : null; this.actions = {}; this.cur = '';
    for (const c of anims) this.actions[c.name] = this.mixer.clipAction(c);
    this.root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    this.move(x, z, yaw); this.play('Idle');
  }
  move(x, z, yaw) { this.x = x; this.z = z; this.home = yaw; this.root.position.set(x, L.walkHeight(x, z), z); this.root.rotation.y = yaw; this.root.visible = true; }
  hide() { this.root.visible = false; this.x = 1e6; }
  play(n) { if (!this.actions[n] || this.cur === n) return; const a = this.actions[n]; a.reset().play(); if (this.actions[this.cur]) this.actions[this.cur].crossFadeTo(a, 0.2, false); this.cur = n; }
  update(dt, player, talking) {
    const d = Math.hypot(player.x - this.x, player.z - this.z);
    this.root.visible = d < 55; if (!this.root.visible) return d;        // far away: not drawn, not animated (weak machines)
    const want = d < 6 ? Math.atan2(player.x - this.x, player.z - this.z) : this.home;
    let diff = want - this.root.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); this.root.rotation.y += diff * Math.min(1, dt * 5);
    this.play(talking ? 'Talk' : 'Idle');
    if (this.mixer) this.mixer.update(dt);
    return d;
  }
}

/** Pip floats beside Ngọc, bobbing, always looking at her. */
export class Pip {
  constructor(scene3d) { this.root = scene3d; this.root.scale.setScalar(1.5); this.pos = new THREE.Vector3(); this.light = new THREE.PointLight(0x9fe8ff, 6, 6, 2); this.root.add(this.light); this.light.position.y = 0.3; }
  place(x, z) { this.pos.set(x, L.walkHeight(x, z) + 1.3, z); this.root.position.copy(this.pos); }
  update(dt, t, player, follow) {
    if (follow) {
      const tx = player.pos.x + Math.sin(player.yaw + 2.2) * 1.3, tz = player.pos.z + Math.cos(player.yaw + 2.2) * 1.3;
      this.pos.x += (tx - this.pos.x) * Math.min(1, dt * 3); this.pos.z += (tz - this.pos.z) * Math.min(1, dt * 3);
      this.pos.y += (player.pos.y + 1.35 - this.pos.y) * Math.min(1, dt * 4);
    }
    this.root.position.set(this.pos.x, this.pos.y + Math.sin(t * 2.4) * 0.12, this.pos.z);
    this.root.rotation.y = Math.atan2(player.pos.x - this.pos.x, player.pos.z - this.pos.z);
    this.root.rotation.z = Math.sin(t * 1.7) * 0.1;
  }
}

/** One glowing memory crystal per landmark (pooled: shown or hidden, never rebuilt). */
export class Crystals {
  constructor(scene, landmarks, heightAt = L.walkHeight) {
    this.items = new Map();
    const mat = new THREE.MeshStandardMaterial({ color: 0x8ff0ff, emissive: 0x4fd8ff, emissiveIntensity: 2.4, roughness: 0.25, transparent: true, opacity: 0.92 });
    const halo = new THREE.SpriteMaterial({ map: haloTexture(), color: 0x9ff3ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    for (const l of landmarks) {
      const g = new THREE.Group(), m = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), mat); m.scale.y = 1.6; g.add(m);
      const s = new THREE.Sprite(halo); s.scale.setScalar(2.4); g.add(s);
      const y = heightAt(l.spot[0], l.spot[1]); g.position.set(l.spot[0], y + 1.0, l.spot[1]); g.userData = { y: y + 1.0, mesh: m, phase: l.x };
      g.visible = false; scene.add(g); this.items.set(l.id, g);
    }
  }
  show(ids) { for (const [id, g] of this.items) g.visible = ids.includes(id); }
  update(t) { for (const g of this.items.values()) if (g.visible) { g.position.y = g.userData.y + Math.sin(t * 1.8 + g.userData.phase) * 0.14; g.userData.mesh.rotation.y = t * 1.2; } }
  nearest(pos, radius = 2.1) {
    for (const [id, g] of this.items) if (g.visible && Math.hypot(pos.x - g.position.x, pos.z - g.position.z) < radius) return id;
    return null;
  }
}
function haloTexture() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const ctx = cv.getContext('2d'), gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.28)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

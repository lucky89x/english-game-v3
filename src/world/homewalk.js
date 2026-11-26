// The child's house as a little map of its own (21/11: "after E at the house the hero walks inside; arrange the furniture,
// change the colours; one floor first, more floors open when bought"). The floors are the ones of world/interior.js;
// a copy of the hero (same clothes and gear) walks with WASD or a click on the floor, goes up and down the stairs, and
// the camera follows from the open front side. Floors above the hero are hidden so the view stays clear.
// Arrange mode (owner only): click a piece to pick it up, it follows the mouse on the floor, R turns it, a click puts it down.
// Rules (walls, stairs, colours, saved places) are in core/house.js.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { GROUPS, floorPlan, roomOf, FLOOR_H, stairOf, stairX, inStairColumn, stairY, freeAt, placeOf, dims, cellsOf } from '../core/house.js';
import { houseFloor, homeThings, compassPedestal } from './interior.js';

const WALL_ITEMS = new Set(['clock', 'picture', 'violin', 'mirror']);      // hung on a wall: they stay where they are

/** opts: { house, items, model, pieces, avatar: { root (to clone), clips }, editable, onPlace(id, at), hint(text) } */
export function buildHomeWalk(opts) {
  const h = { floors: 1, villa: false, garden: 0, ...(opts.house || {}) }, items = opts.items || [], plan = floorPlan(h), CELLS = cellsOf(h), { hw, hd } = dims(h), STAIR = stairOf(h);
  const scene = new THREE.Scene(), g = new THREE.Group(), lights = []; scene.add(g);
  scene.background = new THREE.Color(0x2a1a10);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6a5a48, 1.35));
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.0); sun.position.set(-3, 8, 12); scene.add(sun);
  const floors = [], pieces = [];
  for (let f = 0; f < h.floors; f++) floors.push(houseFloor(g, f, h, lights));
  // a doormat with the way out at the open front of the ground floor
  { const mat = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.0), new THREE.MeshStandardMaterial({ color: 0x8a3a2a, roughness: 1 })); mat.rotation.x = -Math.PI / 2; mat.position.set(-hw / 2, 0.05, hd - 0.7); floors[0].add(mat); }
  /** One piece of furniture as its own group, centred on its footprint, so it can be moved and turned. */
  const makePiece = (id, f, cx, cz) => {
    const tmp = new THREE.Group(); homeThings(tmp, [id], lights, opts.model); if (!tmp.children.length) return null;
    tmp.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(tmp); if (box.isEmpty()) return null;
    const c = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()), piece = new THREE.Group();
    for (const ch of [...tmp.children]) { ch.position.x -= c.x; ch.position.z -= c.z; piece.add(ch); }
    piece.position.set(cx + c.x, 0, cz + c.z); piece.userData = { id, f, hx: size.x / 2, hz: size.z / 2, top: box.max.y, flat: size.y < 0.15, wall: WALL_ITEMS.has(id) || box.min.y > 0.8 };
    const saved = placeOf(h, id); if (saved && saved.f < h.floors && !piece.userData.wall) { piece.userData.f = saved.f; piece.position.set(saved.x, 0, saved.z); piece.rotation.y = saved.ry || 0; }
    floors[piece.userData.f].add(piece); pieces.push(piece); return piece;
  };
  const where = roomOf(h);      // (25/11) every group of furniture has a room (the kitchen shares the living room in a one-floor house)
  for (const [grp, ids] of Object.entries(GROUPS)) { const [f, k] = where[grp]; for (const id of ids.filter((x) => items.includes(x))) makePiece(id, f, CELLS[k][0], CELLS[k][1]); }
  { const [f, k] = where.living; const cell = new THREE.Group(); cell.position.set(CELLS[k][0], 0, CELLS[k][1]); compassPedestal(cell, opts.pieces || [], lights); floors[f].add(cell); pieces.push(Object.assign(cell, { userData: { id: 'compass', f, hx: 0.4, hz: 0.4, fixed: true, x0: CELLS[k][0] + 2.45, z0: CELLS[k][1] - 1.25 } })); }
  // the hero: a copy wearing what the hero wears, with the walk and idle clips
  const av = opts.avatar && opts.avatar.root ? SkeletonUtils.clone(opts.avatar.root) : new THREE.Group();
  av.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  scene.add(av); const mixer = new THREE.AnimationMixer(av), acts = {};
  for (const c of (opts.avatar && opts.avatar.clips) || []) acts[c.name] = mixer.clipAction(c);
  let cur = ''; const play = (n) => { if (cur === n || !acts[n]) return; acts[n].reset().play(); if (acts[cur]) acts[cur].crossFadeTo(acts[n], 0.2, false); cur = n; }; play('Idle');
  const me = { f: 0, x: -hw / 2, z: hd - 1.6, y: 0, stair: -1, yaw: Math.PI, route: null };      // just inside, on the doormat of the front-left room
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 90), camAt = new THREE.Vector3(0, 3, 12), look = new THREE.Vector3();
  let t = 0, editing = false, held = null, heldWas = null, hover = null, onOff = '';
  // ---------------------------------------------------------------- walking
  const footprintHit = (f, x, z, r, skip) => pieces.some((p) => {
    if (p === skip || p.userData.f !== f || p.userData.flat || p.userData.wall) return false;
    const px = p.userData.fixed ? p.userData.x0 : p.position.x, pz = p.userData.fixed ? p.userData.z0 : p.position.z, a = -p.rotation.y, dx = x - px, dz = z - pz;
    const lx = dx * Math.cos(a) - dz * Math.sin(a), lz = dx * Math.sin(a) + dz * Math.cos(a);
    return Math.abs(lx) < p.userData.hx + r && Math.abs(lz) < p.userData.hz + r;
  });
  const canStand = (f, x, z) => freeAt(h, f, x, z, 0.28) && !footprintHit(f, x, z, 0.22);
  function step(dx, dz) {
    if (!dx && !dz) return false;
    if (me.stair >= 0) {      // on the stairs: along them only; off at the bottom (this floor) or the top (the floor above)
      const s = me.stair, nx = Math.max(stairX(s, h) - STAIR.half + 0.3, Math.min(stairX(s, h) + STAIR.half - 0.3, me.x + dx)), nz = me.z + dz;
      if (nz > STAIR.z0 + 0.02) { if (freeAt(h, s, nx, nz, 0.2)) { me.stair = -1; me.f = s; me.x = nx; me.z = nz; me.y = s * FLOOR_H; } return true; }
      if (nz < STAIR.z1) { me.stair = -1; me.f = s + 1; me.x = nx; me.z = nz; me.y = (s + 1) * FLOOR_H; return true; }
      me.x = nx; me.z = nz; me.y = stairY(s, nz, h); return true;
    }
    const nx = me.x + dx, nz = me.z + dz, f = me.f;
    if (f < h.floors - 1 && inStairColumn(f, nx, h) && me.z >= STAIR.z0 - 0.05 && nz < STAIR.z0) { me.stair = f; me.x = nx; me.z = nz; me.y = stairY(f, nz, h); return true; }      // onto the stairs from the bottom
    if (f > 0 && inStairColumn(f - 1, nx, h) && me.z <= STAIR.z1 + 0.05 && nz > STAIR.z1) { me.stair = f - 1; me.f = f - 1; me.x = nx; me.z = nz; me.y = stairY(f - 1, nz, h); return true; }      // down from the top
    if (canStand(f, nx, nz)) { me.x = nx; me.z = nz; return true; }
    if (canStand(f, nx, me.z)) { me.x = nx; return true; }
    if (canStand(f, me.x, nz)) { me.z = nz; return true; }
    return false;
  }
  // ---------------------------------------------------------------- arrange mode
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit = new THREE.Vector3();
  const floorPoint = (ndc, f) => { ray.setFromCamera(ndc, camera); plane.constant = -f * FLOOR_H; return ray.ray.intersectPlane(plane, hit) ? hit.clone() : null; };
  const pieceAt = (ndc) => { ray.setFromCamera(ndc, camera); const list = pieces.filter((p) => p.userData.f === me.f && floors[p.userData.f].visible); const hits = ray.intersectObjects(list, true); if (!hits.length) return null; let o = hits[0].object; while (o && !pieces.includes(o)) o = o.parent; return o; };
  const glow = (p, on) => p && p.traverse((o) => { if (o.isMesh && o.material && o.material.emissive) { if (on) { o.userData.e0 = o.userData.e0 || o.material.emissive.clone(); o.material = o.material.clone(); o.material.emissive.setRGB(0.35, 0.28, 0.05); } else if (o.userData.e0) o.material.emissive.copy(o.userData.e0); } });
  const placeOk = (p) => { const r = Math.min(p.userData.hx, p.userData.hz) * 0.6; return freeAt(h, p.userData.f, p.position.x, p.position.z, Math.min(0.5, r)); };
  const say = (s) => { if (opts.hint && s !== onOff) { onOff = s; opts.hint(s); } };
  // (27/11) the piece the hero stands by (word labels, Find it!): the nearest one within reach on the hero's floor, with its name floating over it
  let nearP = null, tag = null;
  const nearest = () => {
    if (me.stair >= 0) return null; let best = null, bd = 1.5;
    for (const p of pieces) { const u = p.userData; if (u.f !== me.f || u.fixed) continue; const d = Math.max(0, Math.hypot(p.position.x - me.x, p.position.z - me.z) - Math.max(u.hx, u.hz) * 0.8) + (u.flat ? 0.7 : 0); if (d < bd) { bd = d; best = p; } }
    return best;
  };
  const retag = () => {
    if (tag) { tag.removeFromParent(); if (tag.material) { if (tag.material.map) tag.material.map.dispose(); tag.material.dispose(); } tag = null; }
    if (!nearP || !opts.tag) return; tag = opts.tag(nearP.userData.id); if (!tag) return;
    tag.position.set(nearP.position.x, Math.min(FLOOR_H - 0.5, Math.max(1.1, (nearP.userData.top || 1) + 0.45)), nearP.position.z); tag.renderOrder = 5; floors[nearP.userData.f].add(tag);
  };
  return {
    scene, camera, walk: true, me,
    get editing() { return editing; },
    setEditing(on) { if (!opts.editable) return false; if (!on && held) { held.position.copy(heldWas.p); held.rotation.y = heldWas.r; glow(held, false); held = null; } editing = on; say(on ? '🛠 Sắp xếp: bấm vào một đồ để nhấc lên · R xoay · bấm sàn để đặt · B xong' : ''); return true; },
    /** A click (ndc = mouse in -1..1). Returns true when used. */
    click(ndc) {
      if (editing) {
        if (held) { if (!placeOk(held)) { say('Chỗ này vướng tường, chọn chỗ khác nhé'); return true; } glow(held, false); const p = held; held = null; p.position.y = 0; if (opts.onPlace) opts.onPlace(p.userData.id, { f: p.userData.f, x: p.position.x, z: p.position.z, ry: p.rotation.y }); say('✔ Đã đặt. Bấm đồ khác để sắp xếp tiếp · B xong'); return true; }
        const p = pieceAt(ndc); if (!p) return true;
        if (p.userData.wall || p.userData.fixed) { say('Đồ này gắn vào tường, không dời được'); return true; }
        held = p; heldWas = { p: p.position.clone(), r: p.rotation.y }; glow(p, true); say(`Đang cầm: ${p.userData.id} · di chuột để dời · R xoay · bấm để đặt · Esc thôi`); return true;
      }
      const at = floorPoint(ndc, me.stair >= 0 ? me.stair : me.f); if (at) me.route = { x: at.x, z: at.z }; return true;
    },
    /** (25/11) Picks up a piece (the one just bought): arrange mode starts with it in the hero's hands, in front of the hero. */
    pickUp(id) {
      if (!opts.editable) return false; const p = pieces.find((x) => x.userData.id === id); if (!p || p.userData.fixed) return false;
      if (!editing) this.setEditing(true); if (held && held !== p) { glow(held, false); }
      if (p.userData.f !== me.f) { floors[me.f].add(p); p.userData.f = me.f; }
      p.position.x = Math.round((me.x - Math.sin(me.yaw) * -2.2) * 4) / 4; p.position.z = Math.round((me.z + Math.cos(me.yaw) * 2.2) * 4) / 4;
      held = p; heldWas = { p: p.position.clone(), r: p.rotation.y }; glow(p, true); say(`Đang cầm: ${id} · di chuột (hoặc đi lại) để chọn chỗ · ⟲ xoay · bấm sàn hoặc ✔ để đặt`); return true;
    },
    get holding() { return !!held; },
    /** (27/11) The id of the piece the hero stands by (null on the stairs, while arranging, or away from everything). */
    get nearId() { return nearP ? nearP.userData.id : null; },
    /** Draws the floating name again (after the piece got its label). */
    retag,
    /** The pieces of the house for Find it!: [{ id, f, x, z }] (the compass stand is not one). */
    list() { return pieces.filter((p) => !p.userData.fixed).map((p) => ({ id: p.userData.id, f: p.userData.f, x: p.position.x, z: p.position.z })); },
    /** A piece lights up for a moment (the right or the wrong answer). */
    flash(id, ms = 900) { const p = pieces.find((x) => x.userData.id === id); if (!p) return; glow(p, true); setTimeout(() => glow(p, false), ms); },
    /** The on-screen buttons: 'arrange' (on/off), 'turn', 'drop' (put the piece down where it is), 'cancel'. */
    tool(name) {
      if (name === 'arrange') return this.setEditing(!editing);
      if (name === 'turn' && held) { held.rotation.y += Math.PI / 4; return true; }
      if (name === 'drop' && held) { if (!placeOk(held)) { say('Chỗ này vướng tường, chọn chỗ khác nhé'); return true; } glow(held, false); const p = held; held = null; p.position.y = 0; if (opts.onPlace) opts.onPlace(p.userData.id, { f: p.userData.f, x: p.position.x, z: p.position.z, ry: p.rotation.y }); say('✔ Đã đặt. Bấm đồ khác để dời tiếp · Xong để thoát'); return true; }
      if (name === 'cancel') { if (held) { held.position.copy(heldWas.p); held.rotation.y = heldWas.r; glow(held, false); held = null; say('Đã thôi, đồ về chỗ cũ'); return true; } return this.setEditing(false); }
      return false;
    },
    key(code) {
      if (code === 'KeyB' && opts.editable) { this.setEditing(!editing); return true; }
      if (editing && held && code === 'KeyR') { held.rotation.y += Math.PI / 4; return true; }
      if (editing && code === 'Escape') { this.setEditing(false); return true; }
      return false;
    },
    /** dt, aspect, ctl: { input {x, z, run}, yaw (camera turn from the mouse drag), mouse ndc or null } */
    update(dt, aspect, ctl = {}) {
      t += dt; if (Math.abs(camera.aspect - aspect) > 1e-3) { camera.aspect = aspect; camera.updateProjectionMatrix(); }
      const yaw = ctl.yaw || 0, inp = ctl.input || {};      // (24/11) the camera turns all the way round, looks up and down, zooms: drag with the mouse, wheel
      let mx = 0, mz = 0, speed = 0;
      if (!editing && (inp.x || inp.z)) { me.route = null; const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw); mx = fx * inp.z + rx * inp.x; mz = fz * inp.z + rz * inp.x; const l = Math.hypot(mx, mz) || 1; mx /= l; mz /= l; speed = inp.run ? 4.6 : 3.0; }
      else if (me.route) { const dx = me.route.x - me.x, dz = me.route.z - me.z, d = Math.hypot(dx, dz); if (d < 0.25) me.route = null; else { mx = dx / d; mz = dz / d; speed = 3.0; } }
      let moved = false;
      if (speed) { const n = Math.ceil(speed * dt / 0.12); for (let i = 0; i < n; i++) moved = step(mx * speed * dt / n, mz * speed * dt / n) || moved; if (!moved) me.route = null; let d = Math.atan2(mx, mz) - me.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); me.yaw += d * Math.min(1, dt * 12); }
      play(moved ? (speed > 3.5 ? 'Run' : 'Walk') : 'Idle'); mixer.update(dt);
      av.position.set(me.x, me.y, me.z); av.rotation.y = me.yaw;
      // what is shown: the hero's floor and those below (the floor above appears once the hero is high on the stairs)
      const top = me.stair >= 0 ? (me.y - me.stair * FLOOR_H > FLOOR_H * 0.65 ? me.stair + 1 : me.stair) : me.f;
      floors.forEach((fl, i) => { fl.visible = i <= top; });
      // the camera: from the open front, a little above, following the hero
      // (25/11) the camera keeps the direction the child chose and only comes CLOSER when a wall or the ceiling is in the way (it used to be
      // pushed sideways into the room, which swung the view round wildly in the corners)
      const pit = Math.max(-0.7, Math.min(1.45, ctl.pitch === undefined ? 0.5 : ctl.pitch)), dist = Math.max(2.4, Math.min(16, (ctl.dist || 9.5) * 0.8)), base = Math.floor((me.y + 0.01) / FLOOR_H) * FLOOR_H;
      look.set(me.x, me.y + 1.2, me.z);
      const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pit), Math.sin(pit), Math.cos(yaw) * Math.cos(pit)).normalize();
      const lim = [[-hw + 0.45, hw - 0.45], [base + 0.4, base + FLOOR_H - 0.7], [-hd + 0.45, hd + 14]];
      let tMax = dist; ['x', 'y', 'z'].forEach((k, i) => { const d = dir[k], o = look[k]; if (Math.abs(d) < 1e-4) return; const tb = ((d > 0 ? lim[i][1] : lim[i][0]) - o) / d; if (tb < tMax) tMax = Math.max(0.9, tb); });
      const want = look.clone().addScaledVector(dir, tMax);
      camAt.lerp(want, Math.min(1, dt * 8)); camera.position.copy(camAt); camera.lookAt(look);
      { const n = editing ? null : nearest(); if (n !== nearP) { nearP = n; retag(); } }      // (27/11) the name of the piece the hero stands by
      // arrange mode: the piece in hand follows the mouse on its floor
      if (editing && held && me.stair < 0 && held.userData.f !== me.f) { floors[me.f].add(held); held.userData.f = me.f; held.position.set(me.x, 0, me.z + 1.5); }      // (25/11) a piece in hand goes up and down the stairs with the hero
      if (editing && held && ctl.mouse) { const at = floorPoint(ctl.mouse, held.userData.f); if (at) { held.position.x = Math.round(at.x * 4) / 4; held.position.z = Math.round(at.z * 4) / 4; held.position.y = 0.04 + Math.sin(t * 6) * 0.03; } }
      if (editing && !held && ctl.mouse) { const p = pieceAt(ctl.mouse); if (p !== hover) { if (hover) glow(hover, false); hover = p && !p.userData.wall && !p.userData.fixed ? p : null; if (hover) glow(hover, true); } }
      else if (hover && !editing) { glow(hover, false); hover = null; }
      for (const l of lights) if (l.isPointLight) { if (l.userData.base === undefined) l.userData.base = l.intensity; l.intensity = l.userData.base * (1 + Math.sin(t * 7 + l.position.x) * 0.03); }
    },
    dispose() { mixer.stopAllAction(); av.removeFromParent(); scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); },      // the hero's copy shares the hero's geometry: left alone
  };
}

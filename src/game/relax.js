// Relaxed arms (24/11). The new character models are modelled with the arms held out straight, and their clips keep that pose, so the people
// look stiff. When a model is loaded this lowers both upper arms in every clip (the clips keep their own motion on top) and, if the walk and
// run clips barely move the arms, adds a gentle swing. Works on the rest pose: the arm direction is turned towards "down, a little outward".
import * as THREE from 'three';

const ARM = /^upper_?arm\.?([LR])$/i;
const _q = new THREE.Quaternion(), _p = new THREE.Quaternion(), _pi = new THREE.Quaternion(), _r = new THREE.Quaternion(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();

/** gltf: { scene, animations }. Returns the report { arms: n, clips: k } (arms 0 when the model has no such bones; clips = clips lowered).
 *  (25/11) Each clip is measured in its OWN first pose: a clip whose arms already hang down (the new models of 24/11) is left alone, because
 *  turning the T-pose rest direction to "down" on top of an arm that is already down pushed it inside the body ("the people lost their arms"). */
export function relaxArms(gltf, opts = {}) {
  const { out = 0.2, swing = 0.5, already = 0.9 } = opts;
  if (!gltf || !gltf.scene || !gltf.animations || !gltf.animations.length || gltf.scene.userData.relaxed) return { arms: 0, clips: 0 };
  gltf.scene.userData.relaxed = true; gltf.scene.updateMatrixWorld(true);
  const arms = [];
  gltf.scene.traverse((o) => { const m = ARM.exec(o.name || ''); if (m && o.isBone && o.children[0]) arms.push({ bone: o, side: m[1].toUpperCase() }); });
  if (arms.length < 2) return { arms: 0, clips: 0 };
  const cx = arms.reduce((s, a) => s + a.bone.getWorldPosition(_v).x, 0) / arms.length;
  const down = new THREE.Vector3(0, -1, 0), axisX = new THREE.Vector3(1, 0, 0), mixer = new THREE.AnimationMixer(gltf.scene);
  const rest = new Map(); gltf.scene.traverse((o) => { if (o.isBone) rest.set(o, [o.position.clone(), o.quaternion.clone(), o.scale.clone()]); });
  let lowered = 0;
  for (const clip of gltf.animations) {
    mixer.stopAllAction(); const act = mixer.clipAction(clip); act.play(); mixer.setTime(0); gltf.scene.updateMatrixWorld(true);      // the clip's own first pose
    const fix = new Map();
    for (const a of arms) {
      const b = a.bone, child = b.children.find((c) => c.isBone) || b.children[0];
      b.getWorldPosition(_a); child.getWorldPosition(_b); const dir = _b.sub(_a).normalize(); const sgn = _a.x >= cx ? 1 : -1;
      if (dir.angleTo(down) < already) { fix.set(b.name, { off: null, sgn }); continue; }      // already hanging: keep the pose
      const want = _w.set(sgn * Math.sin(out), -Math.cos(out), 0.0).normalize();
      _r.setFromUnitVectors(dir, want); b.parent.getWorldQuaternion(_p); _pi.copy(_p).invert();
      fix.set(b.name, { off: _pi.clone().multiply(_r).multiply(_p), sgn });
    }
    act.stop(); mixer.uncacheAction(clip);
    if ([...fix.values()].some((f) => f.off)) lowered++;
    const walky = /walk|run|move/i.test(clip.name);
    for (const t of clip.tracks) {
      const m = /^(.*)\.quaternion$/.exec(t.name); if (!m) continue;
      const f = fix.get(m[1]) || fix.get(m[1].replace(/^upper_arm/, 'upper_arm.')); if (!f || (!f.off && !walky)) continue;
      if (!f.off && walky) { const v = t.values; let moves = 0; for (let i = 4; i < v.length; i += 4) moves = Math.max(moves, 1 - Math.abs(v[i] * v[0] + v[i + 1] * v[1] + v[i + 2] * v[2] + v[i + 3] * v[3])); if (moves > 0.002) continue; }      // the clip swings its own arms
      const v = t.values, n = t.times.length, dur = clip.duration || 1;
      for (let i = 0; i < n; i++) {
        _q.fromArray(v, i * 4); if (f.off) _q.premultiply(f.off);
        if (walky && swing) { const ph = (t.times[i] / dur) * Math.PI * 2, ang = Math.sin(ph) * swing * -f.sgn; _r.setFromAxisAngle(axisX, ang); _q.premultiply(_r); }
        _q.toArray(v, i * 4);
      }
    }
  }
  mixer.uncacheRoot(gltf.scene);
  for (const [o, [p, q, sc]] of rest) { o.position.copy(p); o.quaternion.copy(q); o.scale.copy(sc); }      // back to the rest pose
  gltf.scene.updateMatrixWorld(true);
  return { arms: arms.length, clips: lowered };
}

/** (25/11) "Seen from the side the people are flat": the new person models are thin from front to back. Their children go into an inner
 *  group stretched along the model's own forward axis (+Z), so the whole posed figure (and what hangs on its bones) gets deeper while the
 *  height and width stay. Skinning stays right: the stretch sits above every bone. Called once per loaded model with arm bones. */
export const THICK = 1.3;
export function thicken(gltf, k = THICK) {
  const s = gltf && gltf.scene; if (!s || s.userData.thick) return false;
  const inner = new THREE.Group(); inner.name = 'thick'; inner.scale.set(1, 1, k);
  for (const c of [...s.children]) inner.add(c);
  s.add(inner); s.userData.thick = k; s.updateMatrixWorld(true); return true;
}
/** A person model: it has the two upper-arm bones (monsters, buildings and props do not). */
export function isPerson(gltf) { let n = 0; gltf && gltf.scene && gltf.scene.traverse((o) => { if (o.isBone && ARM.test(o.name || '')) n++; }); return n >= 2; }

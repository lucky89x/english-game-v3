// Relaxed arms (24/11). The new character models are modelled with the arms held out straight, and their clips keep that pose, so the people
// look stiff. When a model is loaded this lowers both upper arms in every clip (the clips keep their own motion on top) and, if the walk and
// run clips barely move the arms, adds a gentle swing. Works on the rest pose: the arm direction is turned towards "down, a little outward".
import * as THREE from 'three';

const ARM = /^upper_?arm\.?([LR])$/i;
const _q = new THREE.Quaternion(), _p = new THREE.Quaternion(), _pi = new THREE.Quaternion(), _r = new THREE.Quaternion(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3();

/** gltf: { scene, animations }. Returns the report { arms: n } (0 when the model has no such bones). */
export function relaxArms(gltf, opts = {}) {
  const { out = 0.2, swing = 0.5, bend = 0.12 } = opts;
  if (!gltf || !gltf.scene || !gltf.animations || !gltf.animations.length || gltf.scene.userData.relaxed) return { arms: 0 };
  gltf.scene.userData.relaxed = true; gltf.scene.updateMatrixWorld(true);
  const arms = [];
  gltf.scene.traverse((o) => { const m = ARM.exec(o.name || ''); if (m && o.isBone && o.children[0]) arms.push({ bone: o, side: m[1].toUpperCase() }); });
  if (arms.length < 2) return { arms: 0 };
  const cx = arms.reduce((s, a) => s + a.bone.getWorldPosition(_v).x, 0) / arms.length;
  const fix = new Map();
  for (const a of arms) {
    const b = a.bone, child = b.children.find((c) => c.isBone) || b.children[0];
    b.getWorldPosition(_a); child.getWorldPosition(_b); const rest = _b.sub(_a).normalize();
    const sgn = _a.x >= cx ? 1 : -1, want = _w.set(sgn * Math.sin(out), -Math.cos(out), 0.0).normalize();
    _r.setFromUnitVectors(rest, want);                                  // world rotation that lowers the arm
    b.parent.getWorldQuaternion(_p); _pi.copy(_p).invert();
    fix.set(b.name, { off: _pi.clone().multiply(_r).multiply(_p), sgn });  // the same turn in the parent's own space
  }
  const axisX = new THREE.Vector3(1, 0, 0);
  for (const clip of gltf.animations) {
    const walky = /walk|run|move/i.test(clip.name);
    for (const t of clip.tracks) {
      const m = /^(.*)\.quaternion$/.exec(t.name); if (!m) continue;
      const f = fix.get(m[1]) || fix.get(m[1].replace(/^upper_arm/, 'upper_arm.')); if (!f) continue;
      const v = t.values, n = t.times.length, dur = clip.duration || 1;
      for (let i = 0; i < n; i++) {
        _q.fromArray(v, i * 4); _q.premultiply(f.off);
        if (walky && swing) { const ph = (t.times[i] / dur) * Math.PI * 2, ang = Math.sin(ph) * swing * -f.sgn; _r.setFromAxisAngle(axisX, ang); _q.premultiply(_r); }
        _q.toArray(v, i * 4);
      }
    }
  }
  return { arms: arms.length };
}

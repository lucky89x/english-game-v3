// The modular heroes (22/11): body files + outfit pieces from the user's Blender set (see core/heroes.js), wearing an outfit =
// swapping the clothing meshes onto the body's skeleton (the same idea as the user's wardrobe.gd for Godot), plus
// hand-made animation clips for their human-proportioned skeleton (the files carry no animation).
// Axes: the model faces +Z, its left hand is on +X, up is +Y (checked on the files).
import * as THREE from 'three';

/** Meshes that change with an outfit (the same list as the user's wardrobe.gd). */
export const PARTS = new Set(['Tunic', 'Belt', 'Sleeves', 'ArmGuards', 'Boots', 'Trousers', 'Coat', 'Panels', 'Pleated_Underskirt', 'Shoulder_Left', 'Shoulder_Right', 'WaistClasp']);

const partsIn = (root) => { const a = []; root.traverse((o) => { if (o.isSkinnedMesh && PARTS.has(o.name)) a.push(o); }); return a; };
const boneMap = (root) => { const b = {}; root.traverse((o) => { if (o.isBone) b[o.name] = o; }); return b; };

/** What a loaded outfit file contributes: just its clothing meshes (detached from its own tree). */
export function donorParts(scene) {
  const list = partsIn(scene);
  for (const p of list) p.removeFromParent();
  return list;
}
/** Puts donor pieces on a body (replacing the clothing it wears now). The pieces are re-bound to the body's own bones by name. */
export function wearParts(body, donors) {
  const bones = boneMap(body); let rig = null;
  for (const o of partsIn(body)) { rig = o.parent; o.removeFromParent(); }
  if (!rig) body.traverse((o) => { if (!rig && o.isSkinnedMesh) rig = o.parent; });
  const added = [];
  for (const part of donors) {
    const m = part.clone();
    const mine = part.skeleton.bones.map((b) => {
      let nb = bones[b.name];
      if (!nb) {      // a bone only the outfit has (ties, ribbons): a copy hangs on the matching parent
        const par = b.parent && bones[b.parent.name]; if (!par) return b;
        nb = b.clone(false); par.add(nb); bones[b.name] = nb;
      }
      return nb;
    });
    m.bind(new THREE.Skeleton(mine, part.skeleton.boneInverses), part.bindMatrix);
    m.frustumCulled = false; m.castShadow = true;
    for (const mat of [].concat(m.material)) mat.side = THREE.DoubleSide;      // thin cloth is seen from both sides
    rig.add(m); added.push(m);
  }
  return added;
}

// ---------------------------------------------------------------- animation
const CORE = ['Hips', 'Spine', 'Chest', 'UpperChest', 'Neck', 'Head', 'LeftShoulder', 'LeftUpperArm', 'LeftLowerArm', 'LeftHand', 'RightShoulder', 'RightUpperArm', 'RightLowerArm', 'RightHand',
  'LeftUpperLeg', 'LeftLowerLeg', 'LeftFoot', 'LeftToes', 'RightUpperLeg', 'RightLowerLeg', 'RightFoot', 'RightToes', 'SkirtUpperFront', 'SkirtLowerFront', 'SkirtUpperBack', 'SkirtLowerBack'];
const TIP = { Hips: 'Spine', Spine: 'Chest', Chest: 'UpperChest', UpperChest: 'Neck', Neck: 'Head', Head: 'Socket_Head', LeftShoulder: 'LeftUpperArm', RightShoulder: 'RightUpperArm', LeftUpperArm: 'LeftLowerArm', LeftLowerArm: 'LeftHand', LeftHand: 'LeftMiddleProximal',
  RightUpperArm: 'RightLowerArm', RightLowerArm: 'RightHand', RightHand: 'RightMiddleProximal', LeftUpperLeg: 'LeftLowerLeg', LeftLowerLeg: 'LeftFoot', LeftFoot: 'LeftToes', RightUpperLeg: 'RightLowerLeg', RightLowerLeg: 'RightFoot', RightFoot: 'RightToes',
  SkirtUpperFront: 'SkirtLowerFront', SkirtUpperBack: 'SkirtLowerBack', LeftToes: null, RightToes: null, SkirtLowerFront: null, SkirtLowerBack: null };
const sgn = (v) => (v < 0 ? -1 : 1);
const E = new THREE.Euler(), R = new THREE.Quaternion();

/** The rest pose of the bones we animate, so a pose can be given in MODEL axes (forward swing, arm out…) whatever the bones' own axes are. */
export function rigOf(model) {
  model.updateMatrixWorld(true);
  const inv = model.getWorldQuaternion(new THREE.Quaternion()).invert(), bones = boneMap(model), info = {};
  const wq = (o) => o.getWorldQuaternion(new THREE.Quaternion()).premultiply(inv), wp = (o) => o.getWorldPosition(new THREE.Vector3());
  for (const name of CORE) {
    const b = bones[name]; if (!b) continue;
    const tip = TIP[name] && bones[TIP[name]], dir = tip ? wp(tip).sub(wp(b)).normalize() : new THREE.Vector3(0, -1, 0);
    info[name] = { bone: b, L: b.quaternion.clone(), P0: b.position.clone(), Wp: b.parent ? wq(b.parent) : new THREE.Quaternion(), dir };
  }
  return info;
}
/** Local rotation for a pose p = { f: swing forward (the limb's tip moves to +Z), a: swing towards the body's middle line (negative = out/up),
 *  rx, ry, rz: raw rotations about the model's X (pitch, nose down +), Y (turn left +) and Z (roll) axes }. */
function poseQuat(inf, p, out = new THREE.Quaternion()) {
  const fs = Math.abs(inf.dir.y) < 0.2 ? 1 : sgn(inf.dir.y);           // a limb hanging down swings forward by rotating the other way about X
  const as = sgn(inf.dir.x) * sgn(inf.dir.y);
  E.set((p.rx || 0) + (p.f || 0) * fs, p.ry || 0, (p.rz || 0) + (p.a || 0) * as, 'ZYX'); R.setFromEuler(E);
  return out.copy(inf.Wp).invert().multiply(R).multiply(inf.Wp).multiply(inf.L);
}
/** Adds a pose on top of whatever the clip left on the bones (the sword swing). */
export function addPose(inf, p) {
  if (!inf) return; const q = poseQuat(inf, p), cur = inf.bone.quaternion.clone();
  // q = D * L, so D = q * L^-1; the extra rotation goes on the clip's current rotation
  inf.bone.quaternion.copy(q.multiply(inf.L.clone().invert()).multiply(cur));
}

const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const TAU = Math.PI * 2;
const mix = (a, b, k) => a + (b - a) * k;
/** Poses are { BoneName: {f, a, rx, ry, rz} }; `lerpPose` blends two of them (a missing bone = rest). */
const lerpPose = (A, B, k) => { const out = {}; for (const n of new Set([...Object.keys(A), ...Object.keys(B)])) { const a = A[n] || {}, b = B[n] || {}; out[n] = {}; for (const f of new Set([...Object.keys(a), ...Object.keys(b)])) out[n][f] = mix(a[f] || 0, b[f] || 0, k); } return out; };

const ARM_REST = 0.32;      // the files stand in an A-pose: relaxed arms hang a little closer to the body
function arms(L, R) {
  return { LeftUpperArm: { a: ARM_REST, ...L.up }, LeftLowerArm: { ...L.low }, RightUpperArm: { a: ARM_REST, ...R.up }, RightLowerArm: { ...R.low } };
}
function gait(ph, w) {
  const s = Math.sin(ph), c = Math.cos(ph), A = 0.5 + 0.38 * w, K = 0.55 + 0.7 * w, AM = 0.42 + 0.45 * w, lean = 0.04 + 0.2 * w;
  const bendL = K * Math.max(0, c), bendR = K * Math.max(0, -c);
  return {
    Hips: { y: (c * c - 0.5) * 0.06 * (1 + w), ry: -s * (0.14 + 0.1 * w), rz: -s * 0.03, rx: lean * 0.4 },
    Spine: { ry: s * (0.1 + 0.08 * w), rx: lean * 0.6 }, Chest: { ry: s * (0.1 + 0.08 * w), rx: lean * 0.4 }, Neck: { rx: -lean * 0.4 }, Head: { ry: -s * 0.12, rx: -lean * 0.3 },
    LeftUpperLeg: { f: s * A }, RightUpperLeg: { f: -s * A },
    LeftLowerLeg: { f: -bendL }, RightLowerLeg: { f: -bendR },
    LeftFoot: { rx: -s * A * 0.3 + bendL * 0.45 }, RightFoot: { rx: s * A * 0.3 + bendR * 0.45 },
    ...arms({ up: { f: -s * AM }, low: { f: 0.3 + 0.25 * w + 0.25 * Math.max(0, -s) * (1 + w) } }, { up: { f: s * AM }, low: { f: 0.3 + 0.25 * w + 0.25 * Math.max(0, s) * (1 + w) } }),
  };
}
const idle = (u) => { const b = Math.sin(u * TAU), b2 = Math.sin(u * TAU * 2);
  return { Hips: { rz: b * 0.012, y: b2 * 0.002 }, Spine: { rx: 0.012 * b }, Chest: { rx: 0.018 * b, rz: -b * 0.01 }, Head: { ry: 0.07 * Math.sin(u * TAU), rx: 0.01 * b2 },
    ...arms({ up: { f: 0.03 * b, a: 0.02 * b }, low: { f: 0.12 } }, { up: { f: -0.03 * b, a: -0.02 * b }, low: { f: 0.12 } }) }; };
const crouch = (k) => ({ Hips: { y: -0.13 * k, rx: 0.12 * k }, Spine: { rx: 0.2 * k }, LeftUpperLeg: { f: 0.85 * k }, RightUpperLeg: { f: 0.85 * k }, LeftLowerLeg: { f: -1.5 * k }, RightLowerLeg: { f: -1.5 * k },
  LeftFoot: { rx: 0.55 * k }, RightFoot: { rx: 0.55 * k }, ...arms({ up: { f: 0.5 * k }, low: { f: 0.4 * k } }, { up: { f: 0.5 * k }, low: { f: 0.4 * k } }) });

/** The clips the game plays on the hero (Player.play): same names as the old chibi's. */
export function buildClips(model, rig = rigOf(model)) {
  const FPS = 24, clips = [];
  const make = (name, dur, fn) => {
    const n = Math.max(2, Math.round(dur * FPS)), times = [];
    for (let i = 0; i <= n; i++) times.push(i / n * dur);
    const quat = {}, pos = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, pose = fn(u, u * dur);
      for (const [bn, inf] of Object.entries(rig)) {
        const p = pose[bn] || {}, q = poseQuat(inf, p); (quat[bn] || (quat[bn] = [])).push(q.x, q.y, q.z, q.w);
        if (bn === 'Hips') pos.push(inf.P0.x + (p.x || 0), inf.P0.y + (p.y || 0), inf.P0.z + (p.z || 0));
      }
    }
    const tracks = Object.entries(quat).map(([bn, v]) => new THREE.QuaternionKeyframeTrack(`${rig[bn].bone.name}.quaternion`, times, v));
    if (rig.Hips) tracks.push(new THREE.VectorKeyframeTrack(`${rig.Hips.bone.name}.position`, times, pos));
    clips.push(new THREE.AnimationClip(name, dur, tracks));
  };
  const hold = (pose, k) => lerpPose({}, pose, k);
  make('Idle', 3.2, (u) => idle(u));
  make('Walk', 1.1, (u) => gait(u * TAU, 0));
  make('Run', 0.52, (u) => gait(u * TAU, 1));
  make('Talk', 2.4, (u) => {
    const b = Math.sin(u * TAU * 2), g = Math.sin(u * TAU * 3);
    return lerpPose(idle(u), { Head: { rx: 0.05 * b, ry: 0.1 * Math.sin(u * TAU) }, Chest: { ry: 0.05 * Math.sin(u * TAU) }, ...arms({ up: { f: 0.1 } }, { up: { f: 0.55 + 0.12 * g, a: 0.0 }, low: { f: 0.95 + 0.15 * b } }) }, 1);
  });
  make('Wave', 1.6, (u) => {
    const e = ease(u / 0.18) * (1 - ease((u - 0.82) / 0.18)), w = Math.sin(u * TAU * 3.2);
    return lerpPose(idle(0), { RightUpperArm: { a: -2.0, f: 0.15 }, RightLowerArm: { a: 0.55 * w, f: 0.35 }, Head: { rz: 0.05, ry: -0.12 }, Chest: { ry: -0.08 }, Spine: {} }, e);
  });
  make('Jump', 0.7, (u) => hold({ Hips: { y: 0.02 }, LeftUpperLeg: { f: 0.75 }, RightUpperLeg: { f: 0.25 }, LeftLowerLeg: { f: -1.2 }, RightLowerLeg: { f: -0.55 }, LeftFoot: { rx: 0.3 }, RightFoot: { rx: 0.5 },
    ...arms({ up: { f: 1.0, a: -0.9 }, low: { f: 0.3 } }, { up: { f: 1.0, a: -0.9 }, low: { f: 0.3 } }), Spine: { rx: -0.05 } }, ease(u / 0.35)));
  make('Fall', 1.0, (u) => { const s = Math.sin(u * TAU);
    return { LeftUpperLeg: { f: 0.35 + 0.12 * s }, RightUpperLeg: { f: 0.15 - 0.12 * s }, LeftLowerLeg: { f: -0.5 }, RightLowerLeg: { f: -0.7 }, LeftFoot: { rx: 0.4 }, RightFoot: { rx: 0.4 },
      ...arms({ up: { f: 0.4 + 0.1 * s, a: -1.2 }, low: { f: 0.4 } }, { up: { f: 0.4 - 0.1 * s, a: -1.2 }, low: { f: 0.4 } }), Spine: { rx: -0.05 }, Head: { rx: -0.1 } }; });
  make('Land', 0.4, (u) => crouch(Math.sin(Math.min(1, u * 1.15) * Math.PI)));
  make('Interact', 0.8, (u) => { const k = Math.sin(u * Math.PI);
    return lerpPose(idle(0), { RightUpperArm: { f: 1.25, a: -0.2 }, RightLowerArm: { f: 0.35 }, Chest: { rx: 0.12, ry: -0.2 }, Spine: { rx: 0.1 }, Head: { rx: 0.1 } }, k); });
  make('Celebrate', 1.3, (u) => { const k = ease(u / 0.2) * (1 - ease((u - 0.85) / 0.15)), hop = Math.abs(Math.sin(u * Math.PI * 3));
    return lerpPose(idle(0), { Hips: { y: 0.1 * hop }, LeftUpperLeg: { f: 0.25 * hop }, RightUpperLeg: { f: 0.25 * hop }, LeftLowerLeg: { f: -0.5 * hop }, RightLowerLeg: { f: -0.5 * hop },
      ...arms({ up: { f: 0.3, a: -2.3 }, low: { f: 0.2 } }, { up: { f: 0.3, a: -2.3 }, low: { f: 0.2 } }), Head: { rx: -0.15 } }, k); });
  return clips;
}
/** The sword swing as poses on the rig: up 0..1 (arm raised) → -0.35 (struck through), turn = chest twist, dir = ±1 (left/right cut). */
export function swingPose(rig, up, turn, dir) {
  addPose(rig.RightUpperArm, { f: up * 2.2, a: -up * 0.5 * dir });
  addPose(rig.RightLowerArm, { f: Math.max(0, up) * 0.6 });
  addPose(rig.Chest, { ry: turn * dir });
}
/** Rotation that makes a held item's +Y (the blade, the staff pole) point along `dir` (model axes) when the hero stands in the rest pose:
 *  the socket's own orientation is read from the rig, so any socket works. */
export function heldQuat(rig, socket, dir) {
  const hand = rig.RightHand, q = hand.Wp.clone().multiply(hand.L).multiply(socket.quaternion);
  const local = dir.clone().normalize().applyQuaternion(q.invert());
  return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), local);
}

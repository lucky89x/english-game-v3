// The fishing boat (24/11: "make the fishing boat proper, it is tiny"): a 4.6 m rowboat with a blue planked hull, cream trim, two benches,
// oars in oarlocks, a bow rope, a lantern at the stern and a little pennant. Origin at the waterline, the bow points to +z.
import * as THREE from 'three';

const mat = (hex, r = 0.75, o = {}) => new THREE.MeshStandardMaterial({ color: hex, roughness: r, ...o });
const L = 2.3, WMAX = 0.98;
function outline(k = 1) {
  const pts = [];
  for (let i = 0; i <= 32; i++) { const u = i / 32, z = -L + u * 2 * L, tip = u > 0.72 ? Math.pow(Math.cos((u - 0.72) / 0.28 * Math.PI / 2), 0.85) : 1, w = WMAX * (0.62 + 0.38 * Math.sin(Math.PI * Math.pow(u, 0.9))) * tip * k; pts.push([w, z * k]); }
  const shape = new THREE.Shape(); shape.moveTo(pts[0][0], -pts[0][1]);
  for (const [x, z] of pts) shape.lineTo(x, -z);
  for (let i = pts.length - 1; i >= 0; i--) shape.lineTo(-pts[i][0], -pts[i][1]);
  return shape;
}
export function makeRowboat() {
  const g = new THREE.Group(), blue = mat(0x3a86c8, 0.55), cream = mat(0xf2e6c8, 0.7), wood = mat(0xb07a44, 0.8), dark = mat(0x6a3d1e, 0.85), floorM = mat(0xc89658, 0.9);
  const shell = (shape, depth, y, m, bevel = 0.02) => { const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 6 }); geo.rotateX(-Math.PI / 2); const o = new THREE.Mesh(geo, m); o.position.y = y; o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  // the wall: the outline with a hole (the inside), from below the waterline up to the rim
  const wall = outline(1); const hole = new THREE.Path(); { const inner = outline(0.9).getPoints(); hole.moveTo(inner[0].x, inner[0].y); for (const p of inner) hole.lineTo(p.x, p.y); } wall.holes.push(hole);
  shell(wall, 0.78, -0.3, blue);
  shell(outline(0.9), 0.06, -0.22, floorM, 0);                                         // the floor boards
  // the cream rim round the top, a thin ring
  const rim = outline(1.01); const rh = new THREE.Path(); { const inner = outline(0.9).getPoints(); rh.moveTo(inner[0].x, inner[0].y); for (const p of inner) rh.lineTo(p.x, p.y); } rim.holes.push(rh);
  shell(rim, 0.05, 0.47, cream, 0);
  // planks: two thin cream stripes along the hull outside
  for (const y of [0.05, 0.27]) { const s = outline(1.008); const h2 = new THREE.Path(); const inn = outline(0.96).getPoints(); h2.moveTo(inn[0].x, inn[0].y); for (const p of inn) h2.lineTo(p.x, p.y); s.holes.push(h2); shell(s, 0.03, y, cream, 0); }
  const box = (w, h, d, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = true; g.add(o); return o; };
  box(1.6, 0.07, 0.34, wood, 0, 0.3, -0.75); box(1.5, 0.07, 0.32, wood, 0, 0.3, 0.95);            // benches
  box(1.5, 0.07, 0.3, wood, 0, 0.2, -1.95); box(0.5, 0.5, 0.06, dark, 0, 0.0, 1.5);               // stern seat, a bow brace
  for (const sx of [-1, 1]) {      // oarlocks and oars (the blades rest on the water)
    box(0.05, 0.18, 0.05, dark, sx * 0.88, 0.58, 0.1);
    const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.1, 6), dark); oar.rotation.z = sx * 1.22; oar.rotation.y = 0; oar.position.set(sx * 1.38, 0.5, 0.1); oar.castShadow = true; g.add(oar);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.55), cream); blade.position.set(sx * 2.25, 0.18, 0.1); blade.rotation.z = sx * 0.2; g.add(blade);
  }
  const rope = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 6, 14), mat(0xd8c08a, 1)); rope.rotation.x = Math.PI / 2; rope.position.set(0.3, 0.1, 1.2); g.add(rope);      // the bow rope
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6), dark); post.position.set(0, 1.0, -2.05); g.add(post);      // lantern post at the stern
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 9), mat(0xffd27a, 0.4, { emissive: 0xffa830, emissiveIntensity: 1.4 })); lamp.position.set(0, 1.6, -2.05); g.add(lamp);
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 6), dark); flagPole.position.set(0, 0.95, 1.85); g.add(flagPole);
  const flag = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.38, 0), new THREE.Vector3(0, 0.19, -0.6)]), new THREE.MeshBasicMaterial({ color: 0xe8443a, side: THREE.DoubleSide })); flag.geometry.setIndex([0, 1, 2]); flag.position.set(0, 1.35, 1.85); g.add(flag);
  g.userData.lamp = lamp;
  return g;
}

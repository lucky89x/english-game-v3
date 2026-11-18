// House interiors (18/11: "go inside the houses, with a nice room inside"). When Ngọc enters a house the game draws
// one of these rooms instead of the village, with the shop / music / quest window docked on the right. Rooms are
// built from simple shapes in the game's warm palette: plank floor, panelled walls, beams, glowing windows and
// lanterns, a rug, and furniture for each house. The camera drifts slowly so the room feels alive.
import * as THREE from 'three';

const M = (color, rough = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });
const box = (g, w, h, d, m, x, y, z, ry = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
const cyl = (g, r1, r2, h, m, x, y, z, seg = 12) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); o.position.set(x, y, z); g.add(o); return o; };
const ball = (g, r, m, x, y, z) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m); o.position.set(x, y, z); g.add(o); return o; };

/** The shell every room shares: 8 x 6 m, 3.4 m high, open towards the camera. */
function shell(g, wallCol, floorCol) {
  const plank = M(floorCol, 0.85), wall = M(wallCol, 0.9), beam = M(0x5a3416, 0.85), trim = M(0x7a4a24, 0.8);
  for (let i = 0; i < 16; i++) box(g, 0.5, 0.06, 6.2, i % 2 ? plank : M(new THREE.Color(floorCol).multiplyScalar(0.9).getHex(), 0.85), -3.75 + i * 0.5, 0, 0);
  box(g, 8, 3.4, 0.2, wall, 0, 1.7, -3.1); box(g, 0.2, 3.4, 6.2, wall, -4, 1.7, 0); box(g, 0.2, 3.4, 6.2, wall, 4, 1.7, 0);
  box(g, 8, 1.0, 0.24, trim, 0, 0.5, -3.0); box(g, 0.24, 1.0, 6.2, trim, -3.9, 0.5, 0); box(g, 0.24, 1.0, 6.2, trim, 3.9, 0.5, 0);    // wainscot
  for (const x of [-3, -1, 1, 3]) box(g, 0.25, 0.25, 6.2, beam, x, 3.3, 0);
  box(g, 8.2, 0.12, 6.4, M(0x6a4020, 0.9), 0, 3.46, 0);
  // two windows with daylight
  for (const x of [-2.2, 2.2]) { box(g, 1.3, 1.2, 0.08, M(0xfff2c0, 0.3, { emissive: 0xffe0a0, emissiveIntensity: 0.9 }), x, 2.15, -2.98); box(g, 1.45, 0.1, 0.16, trim, x, 1.52, -2.95); box(g, 0.08, 1.2, 0.12, trim, x, 2.15, -2.94); box(g, 1.3, 0.08, 0.12, trim, x, 2.15, -2.94); }
  // rug
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), M(0xb8463a, 0.95)); rug.rotation.x = -Math.PI / 2; rug.scale.set(1.4, 1, 1); rug.position.set(0, 0.04, 0.6); g.add(rug);
  const rug2 = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.4, 32), M(0xf2c84a, 0.95)); rug2.rotation.x = -Math.PI / 2; rug2.scale.set(1.4, 1, 1); rug2.position.set(0, 0.05, 0.6); g.add(rug2);
}
/** A hanging lantern with a warm light. */
function lantern(g, x, z, lights) {
  cyl(g, 0.01, 0.01, 0.6, M(0x333333), x, 3.0, z, 4);
  ball(g, 0.16, M(0xffd27a, 0.4, { emissive: 0xffb040, emissiveIntensity: 1.6 }), x, 2.6, z);
  const l = new THREE.PointLight(0xffc070, 6, 9, 1.6); l.position.set(x, 2.5, z); g.add(l); lights.push(l);
}
function bookshelf(g, x, z, ry) {
  const s = new THREE.Group(), wood = M(0x6a3e1c, 0.85), cols = [0xc0392b, 0x2f6fd0, 0x2e9a5a, 0xe8b030, 0x8a4ad0, 0xe07a30];
  box(s, 1.6, 2.4, 0.4, wood, 0, 1.2, 0); for (let k = 0; k < 4; k++) box(s, 1.5, 0.05, 0.38, M(0x8a5428), 0, 0.35 + k * 0.55, 0.02);
  for (let k = 0; k < 4; k++) for (let i = 0; i < 9; i++) box(s, 0.12, 0.38 + (i * 7 % 5) * 0.02, 0.28, M(cols[(i + k) % cols.length], 0.7), -0.62 + i * 0.155, 0.56 + k * 0.55, 0.06);
  s.position.set(x, 0, z); s.rotation.y = ry; g.add(s);
}
function shelfWall(g, x, z, ry, items) {
  const s = new THREE.Group(), wood = M(0x7a4a24, 0.85);
  box(s, 2.4, 2.2, 0.08, M(0x5a3416), 0, 1.3, -0.2);
  for (let k = 0; k < 3; k++) box(s, 2.4, 0.07, 0.42, wood, 0, 0.55 + k * 0.7, 0);
  items(s); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s);
}
const sword = (g, x, y, z, col) => { box(g, 0.06, 0.62, 0.02, M(col, 0.3, { metalness: 0.7 }), x, y + 0.36, z); box(g, 0.22, 0.04, 0.05, M(0x8a6a2a), x, y + 0.04, z); box(g, 0.04, 0.14, 0.04, M(0x5a3416), x, y - 0.05, z); };
const shield = (g, x, y, z, col) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 18), M(col, 0.5, { metalness: 0.4 })); o.rotation.x = Math.PI / 2; o.position.set(x, y + 0.26, z); g.add(o); ball(g, 0.06, M(0xe2b04a, 0.3, { metalness: 0.8 }), x, y + 0.26, z + 0.04); };
const bread = (g, x, y, z) => { const o = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.2, 4, 10), M(0xd08a3a, 0.7)); o.rotation.z = Math.PI / 2; o.position.set(x, y + 0.1, z); g.add(o); };
const bottle = (g, x, y, z, col) => { cyl(g, 0.08, 0.1, 0.22, M(col, 0.2, { transparent: true, opacity: 0.85, emissive: col, emissiveIntensity: 0.25 }), x, y + 0.12, z); cyl(g, 0.03, 0.03, 0.08, M(0x8a5a2a), x, y + 0.27, z, 6); };
const pot = (g, x, y, z, s = 1) => { cyl(g, 0.16 * s, 0.12 * s, 0.24 * s, M(0xb8643a), x, y + 0.12 * s, z); for (let i = 0; i < 5; i++) ball(g, 0.12 * s, M([0x4f9a3a, 0x6cc044, 0x3f8a34][i % 3], 0.8), x + Math.cos(i * 1.3) * 0.1 * s, y + (0.32 + (i % 2) * 0.08) * s, z + Math.sin(i * 1.3) * 0.1 * s); };

/** kind: 'shop' | 'music' | 'hall' | 'herb' | 'forest'. Returns { scene, camera, update(dt), dispose() }. */
export function buildRoom(kind) {
  const scene = new THREE.Scene(), g = new THREE.Group(), lights = []; scene.add(g);
  scene.background = new THREE.Color(0x2a1a10);
  scene.add(new THREE.HemisphereLight(0xfff0d0, 0x5a3a20, 1.1));
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.2); sun.position.set(-2, 5, 4); scene.add(sun);
  const look = { shop: [0xe8d2a8, 0xb07a44], music: [0xd8c8f0, 0x9a6a44], hall: [0xd8e0f0, 0xa0703c], herb: [0xd8ecc8, 0xa87a48], forest: [0xd0e8c0, 0x8a6a40] }[kind] || [0xe8d2a8, 0xb07a44];
  shell(g, ...look); lantern(g, -1.6, 0, lights); lantern(g, 1.6, 0, lights);
  if (kind === 'shop' || kind === 'forest') {
    box(g, 3.6, 1.0, 0.8, M(0x7a4a24), 0, 0.5, 1.6); box(g, 3.8, 0.08, 0.95, M(0x9a6030), 0, 1.02, 1.6);       // counter
    for (let i = 0; i < 4; i++) bread(g, -1.2 + i * 0.8, 1.06, 1.6);
    shelfWall(g, -2.2, -2.7, 0, (s) => { for (let i = 0; i < 4; i++) { sword(s, -0.9 + i * 0.6, 1.62, 0.05, [0xb98a4a, 0xc8ced6, 0x7fd6ff, 0xbfd8ff][i]); } for (let i = 0; i < 3; i++) shield(s, -0.7 + i * 0.7, 0.92, 0.05, [0xb8c0ca, 0x8a5228, 0x3f7a3a][i]); for (let i = 0; i < 5; i++) bottle(s, -0.9 + i * 0.45, 0.25, 0.05, [0xe8443a, 0x2f8fd0, 0x5fb84a, 0xe8b030, 0xb684e8][i]); });
    shelfWall(g, 2.2, -2.7, 0, (s) => { for (let i = 0; i < 5; i++) bread(s, -0.9 + i * 0.45, 1.62, 0.05); for (let i = 0; i < 4; i++) pot(s, -0.8 + i * 0.55, 0.92, 0.05, 0.7); for (let i = 0; i < 3; i++) box(s, 0.5, 0.35, 0.35, M(0x8a5a2a), -0.7 + i * 0.7, 0.42, 0.05); });
    box(g, 0.6, 0.6, 0.6, M(0x8a5a2a), -3.3, 0.3, 1.8); box(g, 0.5, 0.5, 0.5, M(0x7a4a24), -3.2, 0.85, 1.8, 0.4);
    cyl(g, 0.3, 0.32, 0.8, M(0x7a4a24), 3.3, 0.4, 1.6); // barrel
    if (kind === 'forest') for (const x of [-3.4, 3.4]) pot(g, x, 0, -2.4, 1.6);
  }
  if (kind === 'music') {
    box(g, 2.2, 0.9, 0.7, M(0x1c1c22, 0.4), -1.6, 0.45, -2.3); box(g, 2.0, 0.06, 0.25, M(0xf6f2ea, 0.5), -1.6, 0.93, -2.0);      // piano
    for (let i = 0; i < 14; i++) box(g, 0.07, 0.04, 0.14, M(0x111111), -2.45 + i * 0.13 + (i % 7 === 2 || i % 7 === 6 ? 99 : 0), 0.97, -2.04);
    box(g, 2.2, 1.0, 0.1, M(0x1c1c22, 0.4), -1.6, 1.4, -2.62);
    const gt = new THREE.Group(), gb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), M(0xd08a3a, 0.5)); gb.scale.set(1, 1.2, 0.35); gt.add(gb);      // guitar
    box(gt, 0.08, 0.8, 0.05, M(0x5a3416), 0, 0.65, 0); gt.position.set(2.6, 1.0, -2.4); gt.rotation.z = 0.15; g.add(gt);
    cyl(g, 0.35, 0.35, 0.5, M(0xc0392b, 0.5), 1.4, 0.25, -2.2, 20); cyl(g, 0.36, 0.36, 0.04, M(0xf2ead2, 0.6), 1.4, 0.52, -2.2, 20);      // drum
    for (let i = 0; i < 4; i++) { const n = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 16), M([0x8a4ad0, 0xe8443a, 0x2f6fd0, 0x2e9a5a][i], 0.5, { emissive: [0x8a4ad0, 0xe8443a, 0x2f6fd0, 0x2e9a5a][i], emissiveIntensity: 0.5 })); n.position.set(-3.0 + i * 2, 2.9, -2.9); n.userData.float = i; g.add(n); }
    for (const x of [-3.2, 3.2]) cyl(g, 0.25, 0.3, 0.9, M(0x3a2a6a, 0.6), x, 0.45, 1.6);      // speakers
    const stage = new THREE.Mesh(new THREE.CircleGeometry(1.2, 32), M(0x6a4aa0, 0.6)); stage.rotation.x = -Math.PI / 2; stage.position.set(0, 0.06, 0.6); g.add(stage);
  }
  if (kind === 'hall') {
    bookshelf(g, -2.6, -2.75, 0); bookshelf(g, 2.6, -2.75, 0);
    box(g, 2.2, 0.08, 1.1, M(0x7a4a24), 0, 0.9, -0.6); for (const [x, z] of [[-1, -1.05], [1, -1.05], [-1, -0.15], [1, -0.15]]) box(g, 0.1, 0.9, 0.1, M(0x5a3416), x, 0.45, z);    // desk
    ball(g, 0.22, M(0x2f8fd0, 0.5), 0.6, 1.25, -0.7); cyl(g, 0.02, 0.06, 0.2, M(0xc9a24a), 0.6, 1.0, -0.7, 8);        // globe
    box(g, 0.5, 0.06, 0.35, M(0xf6ead0), -0.5, 0.96, -0.6); bottle(g, -0.1, 0.94, -0.8, 0x2a2a2a);
    box(g, 2.0, 1.2, 0.05, M(0xe8d8a8), 0, 2.2, -2.95); box(g, 1.8, 1.0, 0.06, M(0x8fbf6a), 0, 2.2, -2.93);      // map on the wall
    box(g, 1.4, 1.1, 0.5, M(0x8a8a8a, 0.9), -3.6, 0.55, 1.2, Math.PI / 2); box(g, 0.9, 0.6, 0.3, M(0xff8a3a, 0.5, { emissive: 0xff6a20, emissiveIntensity: 1.2 }), -3.45, 0.45, 1.2, Math.PI / 2);   // fireplace
  }
  if (kind === 'herb') {
    for (let i = 0; i < 6; i++) pot(g, -3.3 + (i % 2) * 6.6, 0, -2.4 + Math.floor(i / 2) * 1.6, 1.4);
    shelfWall(g, 0, -2.7, 0, (s) => { for (let k = 0; k < 3; k++) for (let i = 0; i < 6; i++) bottle(s, -1.0 + i * 0.4, 0.25 + k * 0.7, 0.05, [0x5fb84a, 0x2f8fd0, 0xe8443a, 0xe8b030, 0xb684e8, 0x3fd0c0][(i + k) % 6]); });
    for (let i = 0; i < 5; i++) { cyl(g, 0.01, 0.01, 0.4, M(0x6a4a2a), -1.6 + i * 0.8, 3.0, 1.2, 4); ball(g, 0.14, M(0x6cc044, 0.9), -1.6 + i * 0.8, 2.75, 1.2); }   // drying herbs
    box(g, 1.6, 0.8, 0.8, M(0x7a4a24), 0, 0.4, 1.6); pot(g, -0.4, 0.8, 1.6, 0.8); bottle(g, 0.4, 0.8, 1.6, 0x5fb84a);
  }
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 60);
  let t = 0;
  return {
    scene, camera,
    update(dt, aspect) {
      t += dt; if (Math.abs(camera.aspect - aspect) > 1e-3) { camera.aspect = aspect; camera.updateProjectionMatrix(); }
      camera.position.set(-1.2 + Math.sin(t * 0.15) * 0.6, 2.1 + Math.sin(t * 0.2) * 0.1, 5.4); camera.lookAt(-0.6, 1.2, -0.8);     // the left part of the screen shows the room
      for (const l of lights) l.intensity = 6 + Math.sin(t * 7 + l.position.x) * 0.4;
      g.traverse((o) => { if (o.userData.float !== undefined) o.position.y = 2.9 + Math.sin(t * 2 + o.userData.float) * 0.12; });
    },
    dispose() { scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => m.dispose()); }); },
  };
}

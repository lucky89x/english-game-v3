// The children's homes (18/11: "a house for each of my two children, sharing one save: in one account you still see the
// other one's house. Empty at first, then buy furniture, garden, bed, mirror… in the shops. Put the two houses in an
// empty corner, each with a yard and a sign with the hero's name. Add more houses and shops: furniture, fruit and
// vegetables, instruments.") All profiles live in one save on this computer, so both houses read the same store.
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { HOMES, FURNITURE, STALLS } from '../core/regions/village.js';
import { home, owners } from '../core/rules.js';
import { label, bake } from '../world/common.js';
import { hangSign } from '../world/village.js';
import { campStall } from '../world/stall.js';

const M = (color, rough = 0.85) => new THREE.MeshStandardMaterial({ color, roughness: rough });
const HOUSE_FILE = ['bld_cottage_red_v02', 'bld_house_blue_v02'];
/** Garden things around the yard centre (dx, dz); the garden path runs along dz = 0. */
const YARD_AT = { flowers: [-1.0, -2.6], veg_patch: [0.9, -3.3], fruit_tree: [-1.2, 3.4], bench: [1.2, 2.5], mailbox: [2.4, -1.3], garden_lamp: [2.4, 1.3] };


function flowerBed() {
  const g = new THREE.Group(); const soil = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 1.0), M(0x6a4024, 1)); soil.position.y = 0.1; g.add(soil);
  const cols = [0xff5a8a, 0xffd23c, 0xffffff, 0xb070f0, 0xff8a3c];
  for (let i = 0; i < 14; i++) { const x = -0.75 + (i % 7) * 0.25, z = -0.25 + Math.floor(i / 7) * 0.5;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 4), M(0x3f8a34)); st.position.set(x, 0.35, z); g.add(st);
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), M(cols[i % cols.length], 0.6)); fl.position.set(x, 0.52, z); g.add(fl); }
  return g;
}
function bench() {
  const g = new THREE.Group(), wood = M(0xa8743f), iron = M(0x3a3a40, 0.5);
  for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.16), wood); p.position.set(0, 0.45, -0.18 + i * 0.18); g.add(p); }
  for (let i = 0; i < 2; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, 0.05), wood); p.position.set(0, 0.7 + i * 0.18, -0.28); g.add(p); }
  for (const x of [-0.65, 0.65]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.5), iron); l.position.set(x, 0.22, -0.05); g.add(l); const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.06), iron); b.position.set(x, 0.75, -0.3); g.add(b); }
  return g;
}
function mailbox() {
  const g = new THREE.Group(); const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.0, 0.1), M(0x7a4a24)); post.position.y = 0.5; g.add(post);
  const box = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.35, 4, 10), M(0xd8342a, 0.5)); box.rotation.x = Math.PI / 2; box.position.y = 1.12; g.add(box);
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.1), M(0xffd23c)); flag.position.set(0.19, 1.25, 0.05); g.add(flag);
  return g;
}

function gardenLamp() {          // own shapes: common.js lampPost draws from the seeded scenery random numbers
  const g = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.6, 7), M(0x2a2a30, 0.5)); pole.position.y = 0.8; g.add(pole);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffe2a0, emissive: 0xffb040, emissiveIntensity: 1.4 })); lamp.position.y = 1.72; g.add(lamp);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.16, 8), M(0x2a2a30, 0.5)); cap.position.y = 1.9; g.add(cap);
  return g;
}
export class Homes {
  /** api: { scene, load(name) -> model, profiles() -> all profiles in the save, current() -> playing profile } */
  constructor(api) { this.api = api; this.root = new THREE.Group(); this.root.name = 'homes'; api.scene.add(this.root); this.lots = []; this.key = ''; }
  async build() {
    const { load } = this.api, still = new THREE.Group();
    const place = async (name, x, z, rot, scale, tint) => {
      const m = await load(name); m.position.set(x, L.REGIONS.village.groundHeight(x, z) - 0.05, z); m.rotation.y = rot; m.scale.setScalar(scale);
      m.traverse((c) => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; if (tint) { c.material = c.material.clone(); c.material.color.multiply(new THREE.Color(...tint)); } } });
      this.root.add(m); return m;
    };
    const gh = (x, z) => L.REGIONS.village.groundHeight(x, z);
    for (const [i, h] of HOMES.entries()) {
      await place(HOUSE_FILE[i], h.x, h.z, Math.PI / 2, 1.3, i ? [0.95, 1.05, 1.15] : [1.1, 1.0, 0.92]);
      const yard = new THREE.Group(); this.root.add(yard);
      // a low picket fence around the front yard, open at the garden path
      for (let k = 0; k < 18; k++) { const side = k < 9 ? -1 : 1, x = h.yard[0] - 2.6 + (k % 9) * 0.7; const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.1), M(0xf2ead2, 0.8)); p.position.set(x, gh(x, h.z + side * 4.6) + 0.35, h.z + side * 4.6); still.add(p); }
      this.lots.push({ h, yard, sign: null, post: null, owner: null });
    }
    // Bram's furniture shop, with its board over the door, and the two market stalls
    await place('bld_shop_orange_v02', FURNITURE.x, FURNITURE.z, Math.PI / 2, 1.3, [0.92, 1.05, 1.12]);
    still.add(hangSign('FURNITURE', 'Beds · Tables · Garden', FURNITURE.door[0] - 0.3, gh(FURNITURE.door[0], FURNITURE.door[1]) + 4.9, FURNITURE.door[1], Math.PI / 2));
    for (const [k, t] of Object.entries(STALLS)) {
      const s = campStall(t.x, gh(t.x, t.z), t.z, t.yaw, k === 'music' ? 0x8a4ad0 : 0xe2483e); this.root.add(s);
      const n = label(k === 'music' ? "🎵 Anna's Instruments" : "🍎 Ben's Fruit & Veg", { size: 28, scale: 0.8 }); n.position.set(t.x, gh(t.x, t.z) + 3.3, t.z); this.root.add(n);
    }
    this.root.add(bake(still));
    this.refresh(true);
  }
  /** Rebuilds the signs and yards when an owner, a name or a bought garden thing changed. */
  refresh(force = false) {
    if (!this.lots.length) return;
    const kids = owners(this.api.profiles()), key = JSON.stringify(kids.map((p) => [p.id, p.name, home(p).items]));
    if (!force && key === this.key) return; this.key = key;
    const gh = (x, z) => L.REGIONS.village.groundHeight(x, z);
    for (const [i, lot] of this.lots.entries()) {
      const p = kids[i] || null, h = lot.h; lot.owner = p;
      for (const o of [lot.sign, lot.post]) if (o) { o.removeFromParent(); o.traverse((c) => { if (c.material) { if (c.material.map) c.material.map.dispose(); c.material.dispose(); } }); }
      const name = p ? p.name : '';
      lot.sign = hangSign(p ? `NHÀ CỦA ${name.toLocaleUpperCase('vi')}` : 'NHÀ TRỐNG', p ? `${name}'s home` : 'Chưa có chủ', h.door[0] - 0.3, gh(h.door[0], h.door[1]) + 4.7, h.door[1], Math.PI / 2, 1.25);      // the hero's own name (18/11)
      this.root.add(lot.sign);
      lot.post = label(p ? `🏠 Nhà của ${name}` : '🏠 Nhà trống', { size: 28, scale: 0.8 }); lot.post.position.set(h.yard[0] + 2.9, gh(h.yard[0] + 2.9, h.z - 1.6) + 2.2, h.z - 1.6); this.root.add(lot.post);
      lot.yard.clear();
      const have = p ? home(p).items : [];
      for (const id of have) {
        const at = YARD_AT[id]; if (!at) continue;
        const x = h.yard[0] + at[0], z = h.z + at[1], y = gh(x, z);
        let o = null;
        const glb = this.api.models[id];            // Blender yard pieces (yard_*_v01.glb) when loaded; the shapes otherwise
        if (glb && ['flowers', 'bench', 'mailbox', 'garden_lamp'].includes(id)) { o = glb.clone(true); o.rotation.y = id === 'bench' ? -Math.PI / 2 : id === 'mailbox' ? Math.PI / 2 : id === 'flowers' ? Math.PI / 2 : 0; o.scale.setScalar(id === 'flowers' ? 1.3 : 1.15); }
        else if (id === 'flowers') o = flowerBed();
        else if (id === 'bench') { o = bench(); o.rotation.y = Math.PI; }
        else if (id === 'mailbox') o = mailbox();
        else if (id === 'garden_lamp') o = gardenLamp();
        else if (id === 'veg_patch' && this.api.models.garden) { o = this.api.models.garden.clone(true); o.scale.setScalar(0.75); }
        else if (id === 'fruit_tree' && this.api.models.tree) { o = this.api.models.tree.clone(true); o.scale.setScalar(0.9); }
        if (!o) continue;
        o.position.set(x, y, z);
        o.traverse((c) => { if (c.isMesh) c.castShadow = true; }); lot.yard.add(o);
      }
    }
  }
  setRegion(name) { this.root.visible = name === 'village'; }
  /** Which lot's door the hero stands at (or null). */
  doorAt(pos, r = 2.2) { return this.lots.find((l) => Math.hypot(pos.x - (l.h.door[0] + 0.9), pos.z - l.h.door[1]) < r) || null; }
}

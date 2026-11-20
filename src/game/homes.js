// The children's homes (18/11: "a house for each of my two children, sharing one save: in one account you still see the
// other one's house. Empty at first, then buy furniture, garden, bed, mirror… in the shops. Put the two houses in an
// empty corner, each with a yard and a sign with the hero's name. Add more houses and shops: furniture, fruit and
// vegetables, instruments.") All profiles live in one save on this computer, so both houses read the same store.
import * as THREE from 'three';
import * as L from '../core/layout.js';
import { HOMES, FURNITURE, STALLS } from '../core/regions/village.js';
import { home, owners } from '../core/rules.js';
import { house, gardenOf } from '../core/house.js';
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

/** (20/11) The plot: a white picket fence all round the lot (x from the house's west side to 10.4 m east, z +-6.5 m) with a gate on the east side. */
export const PLOT = { x0: -6.5, x1: 10.4, z: 6.5, gate: 1.4 };
function plotFence(h, gh) {
  const g = new THREE.Group(), post = M(0xf6efe0, 0.8), rail = M(0xe9dcc0, 0.85), pg = new THREE.CylinderGeometry(0.06, 0.07, 0.95, 6), rg = new THREE.BoxGeometry(0.8, 0.06, 0.05), rgz = new THREE.BoxGeometry(0.05, 0.06, 0.8);
  const x0 = h.x + PLOT.x0, x1 = h.x + PLOT.x1, z0 = h.z - PLOT.z, z1 = h.z + PLOT.z;
  const put = (x, z, alongX) => { const y = gh(x, z), p = new THREE.Mesh(pg, post); p.position.set(x, y + 0.47, z); g.add(p);
    for (const hh of [0.35, 0.7]) { const r = new THREE.Mesh(alongX ? rg : rgz, rail); r.position.set(x + (alongX ? 0.4 : 0), y + hh, z + (alongX ? 0 : 0.4)); g.add(r); } };
  for (let x = x0; x < x1 - 0.1; x += 0.8) { put(x, z0, true); put(x, z1, true); }
  for (let z = z0; z < z1 - 0.1; z += 0.8) { put(x0, z, false); if (Math.abs(z + 0.4 - h.z) > PLOT.gate) put(x1, z, false); }      // the east side has a gap for the gate
  const tall = new THREE.CylinderGeometry(0.12, 0.14, 1.9, 8), wood = M(0x8a5a2a, 0.9);
  for (const dz of [-PLOT.gate, PLOT.gate]) { const gz = h.z + dz, t = new THREE.Mesh(tall, wood); t.position.set(x1, gh(x1, gz) + 0.95, gz); g.add(t); }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, PLOT.gate * 2 + 0.3), M(0xb5793a, 0.85)); bar.position.set(x1, gh(x1, h.z) + 1.85, h.z); g.add(bar);
  return g;
}
/** Vegetable bed with rows of cabbages and carrot tops; flower bed reuses flowerBed(). */
function vegBed() {
  const g = new THREE.Group(), soil = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.22, 1.1), M(0x6a4024, 1)); soil.position.y = 0.11; g.add(soil);
  for (let i = 0; i < 6; i++) { const x = -0.7 + (i % 3) * 0.7, z = i < 3 ? -0.25 : 0.25; const c = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), M(i % 2 ? 0x6cc044 : 0x8fd05a, 0.8)); c.scale.y = 0.7; c.position.set(x, 0.32, z); g.add(c);
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 5), M(0xff8a1a, 0.7)); t.position.set(x + 0.28, 0.3, z + (i < 3 ? 0.18 : -0.18)); t.rotation.z = Math.PI; g.add(t); }
  return g;
}
/** Everything the garden level adds: veg beds on the north strip, flower beds on the south strip, trees, pond, flower gate. */
function gardenDecor(h, tier, gh, models) {
  const g = new THREE.Group(), cfg = gardenOf({ garden: tier });
  const xs = [0.6, 3.1, 5.6, 8.1];
  for (let i = 0; i < cfg.veg; i++) { const o = vegBed(), x = h.x + xs[i], z = h.z - 5.2; o.position.set(x, gh(x, z), z); g.add(o); }
  for (let i = 0; i < cfg.flowers; i++) { const o = flowerBed(), x = h.x + xs[i], z = h.z + 5.2; o.position.set(x, gh(x, z), z); g.add(o); }
  for (let i = 0; i < cfg.trees; i++) { const x = h.x - 3.6 + i * 0.01, z = h.z + (i ? 4.8 : -4.8); const t = models.tree ? models.tree.clone(true) : null; if (t) { t.scale.setScalar(0.85); t.position.set(x, gh(x, z), z); t.traverse((c) => { if (c.isMesh) c.castShadow = true; }); g.add(t); } }
  if (cfg.pond) { const x = h.x - 3.5, z = h.z; const w = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), new THREE.MeshStandardMaterial({ color: 0x4fc6e8, roughness: 0.15, transparent: true, opacity: 0.9 })); w.rotation.x = -Math.PI / 2; w.scale.set(1.3, 1, 1); w.position.set(x + 5.4, gh(x + 5.4, z) + 0.08, z + 2.6); g.add(w); }
  if (cfg.arch) { const x = h.x + PLOT.x1 - 0.1; for (const dz of [-PLOT.gate - 0.2, PLOT.gate + 0.2]) { const fl = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), M(0xff5a8a, 0.6)); fl.position.set(x - 0.3, gh(x, h.z + dz) + 1.9, h.z + dz); g.add(fl); } }
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
      const hm = await place(HOUSE_FILE[i], h.x, h.z, Math.PI / 2, 1.3, i ? [0.95, 1.05, 1.15] : [1.1, 1.0, 0.92]);
      let hall = null; try { hall = await place('bld_hall_blue_v02', h.x - 0.4, h.z, Math.PI / 2, 1.0, i ? [1.0, 0.95, 1.1] : [1.1, 1.0, 0.95]); hall.visible = false; } catch { /* no villa model: the house stays */ }
      const yard = new THREE.Group(); this.root.add(yard); const garden = new THREE.Group(); this.root.add(garden);
      still.add(plotFence(h, gh));      // (20/11) fence round the whole plot
      this.lots.push({ h, yard, garden, models: { house: hm, hall }, sign: null, post: null, owner: null });
    }
    // Bram's furniture shop, with its board over the door, and the two market stalls
    await place('bld_shop_orange_v02', FURNITURE.x, FURNITURE.z, Math.PI / 2, 1.3, [0.92, 1.05, 1.12]);
    still.add(hangSign('FURNITURE', 'Beds · Tables · Garden', FURNITURE.door[0] - 0.3, gh(FURNITURE.door[0], FURNITURE.door[1]) + 4.9, FURNITURE.door[1], Math.PI / 2));
    for (const [k, t] of Object.entries(STALLS)) {
      const s = campStall(t.x, gh(t.x, t.z), t.z, t.yaw, k === 'music' ? 0x8a4ad0 : k === 'tailor' ? 0xe06aa8 : k === 'healer' ? 0x2f9ae0 : 0xe2483e, k === 'tailor' ? 'cloth' : 'fruit'); this.root.add(s);
      const n = label(k === 'music' ? "🎵 Anna's Instruments" : k === 'tailor' ? "🧵 Mia's Tailor Shop" : k === 'healer' ? "🧪 Lily's Potions & Gear" : "🍎 Ben's Fruit & Veg", { size: 28, scale: 0.8 }); n.position.set(t.x, gh(t.x, t.z) + 3.3, t.z); this.root.add(n);
      if (k === 'tailor') {      // two mannequins from the harbor boutique beside Mia's stall
        try { const src = await load('harbor_mannequin_v01');
          for (const [dx, keep] of [[-2.6, 'mannequin_dress'], [2.6, 'mannequin_coat']]) { const m = src.clone(true); m.children.forEach((c) => { if (c.name && c.name.startsWith('mannequin') && c.name !== keep) c.visible = false; });
            const x = t.x + dx, z = t.z - 0.6; m.position.set(x, gh(x, z), z); m.rotation.y = t.yaw; m.traverse((c) => { if (c.isMesh) c.castShadow = true; }); this.root.add(m); } } catch (e) { /* no mannequin file: the stall alone */ }
      }
    }
    this.root.add(bake(still));
    this.refresh(true);
  }
  /** Rebuilds the signs and yards when an owner, a name or a bought garden thing changed. */
  refresh(force = false) {
    if (!this.lots.length) return;
    const kids = owners(this.api.profiles()), key = JSON.stringify(kids.map((p) => [p.id, p.name, home(p).items, house(p)]));
    if (!force && key === this.key) return; this.key = key;
    const gh = (x, z) => L.REGIONS.village.groundHeight(x, z);
    for (const [i, lot] of this.lots.entries()) {
      const p = kids[i] || null, h = lot.h; lot.owner = p;
      for (const o of [lot.sign, lot.post]) if (o) { o.removeFromParent(); o.traverse((c) => { if (c.material) { if (c.material.map) c.material.map.dispose(); c.material.dispose(); } }); }
      const name = p ? p.name : '';
      lot.sign = hangSign(p ? `NHÀ CỦA ${name.toLocaleUpperCase('vi')}` : 'NHÀ TRỐNG', p ? `${name}'s home` : 'Chưa có chủ', h.door[0] - 0.3, gh(h.door[0], h.door[1]) + 4.7, h.door[1], Math.PI / 2, 1.25);      // the hero's own name (18/11)
      this.root.add(lot.sign);
      lot.post = label(p ? `🏠 Nhà của ${name}` : '🏠 Nhà trống', { size: 28, scale: 0.8 }); lot.post.position.set(h.yard[0] + 2.9, gh(h.yard[0] + 2.9, h.z - 1.6) + 2.2, h.z - 1.6); this.root.add(lot.post);
      lot.yard.clear(); lot.garden.clear();
      if (p) {      // (20/11) the house grows with the floors, the villa swaps in the big hall; the garden has three sizes
        const hh = house(p), up = 1 + 0.38 * (hh.floors - 1), m = hh.villa && lot.models.hall ? lot.models.hall : lot.models.house;
        lot.models.house.visible = m === lot.models.house; if (lot.models.hall) lot.models.hall.visible = m === lot.models.hall;
        m.scale.y = (m === lot.models.hall ? 1.0 : 1.3) * up; lot.garden.add(gardenDecor(h, hh.garden, gh, this.api.models));
      } else { lot.models.house.visible = true; lot.models.house.scale.y = 1.3; if (lot.models.hall) lot.models.hall.visible = false; }
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
  /** The lot that belongs to this profile (or null: a third child, or the admin). */
  lotOf(p) { return this.lots.find((l) => l.owner && p && l.owner.id === p.id) || null; }
  /** Which lot's door the hero stands at (or null). */
  doorAt(pos, r = 2.2) { return this.lots.find((l) => Math.hypot(pos.x - (l.h.door[0] + 0.9), pos.z - l.h.door[1]) < r) || null; }
}

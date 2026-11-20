// Colouring and variants for the Blender models (19/11, batch 6+): materials named *_tint (and tint_main / tint_trim on
// the accessories) are painted in a GREY palette (base tone 0.8) so the game colours them: material.color = colour / 0.8.
import * as THREE from 'three';

const GREY = new THREE.Color(0.8, 0.8, 0.8).convertSRGBToLinear().r;         // 0.604: the linear value of the grey the files carry
const own = new WeakSet();
/** A material private to this model clone (glTF clones share materials). */
function mine(m) {
  if (own.has(m)) return m;
  const c = m.clone(); own.add(c); return c;
}
/** Colour for a character: parts = { hair: '#8c4a22', top: …, bottom: … }; it sets every `<name>_<part>_tint` material. */
export function tintBody(root, parts) {
  root.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m, i) => {
      const hit = /_(hair|top|bottom)_tint$/.exec(m.name || ''); if (!hit || !parts[hit[1]]) return;
      const c = mine(m); c.color.set(parts[hit[1]]).multiplyScalar(1 / GREY);
      if (Array.isArray(o.material)) o.material[i] = c; else o.material = c;
    });
  });
}
/** Accessory colours: main = the named colour, trim = a deeper tone of it (or `trim` when given). */
export function tintAccessory(root, main, trim) {
  const mc = new THREE.Color(main), tc = trim ? new THREE.Color(trim) : mc.clone().multiplyScalar(0.62);
  root.traverse((o) => {
    if (!o.isMesh || !o.material || !/^tint_(main|trim)$/.test(o.material.name || '')) return;
    const c = mine(o.material); c.color.copy(o.material.name === 'tint_main' ? mc : tc); o.material = c; o.castShadow = true;
  });
}
export const HAIR_STYLES = ['short', 'long', 'curly', 'wavy', 'ponytail', 'braids'];
/** Shows the one Hair_<style> object and hides the others (call syncOutlines(root) afterwards for their outline twins).
 *  A style the model does not have (the boy has short, spiky, side, buzz) falls back to its first Hair_* object. */
export function setHairStyle(root, style) {
  const hairs = []; root.traverse((o) => { if (o.isMesh && !o.userData.outline && /^Hair_/.test(o.name)) hairs.push(o); });
  const hit = hairs.find((o) => o.name === `Hair_${style}`) || hairs.find((o) => o.name === 'Hair_short') || hairs[0];
  for (const o of hairs) o.visible = o === hit;
}
/** Clothes of Ngọc v05 / the boy (batch 19): exactly one top and one bottom, or one dress. Object names are Top_<x>, Bottom_<x>, Dress_<x>.
 *  want = { top: 'hoodie', bottom: 'skirt', body: 'sundress' } (missing = the T-shirt and the shorts). */
export const CLOTH = { top: { top: 'tshirt', hoodie: 'hoodie', jacket: 'jacket', aodai: 'aodai' }, bottom: { shorts: 'shorts', trousers: 'trousers', skirt: 'skirt' }, body: { dress: 'sundress', gown: 'party' } };
export function setClothes(root, want = {}) {
  const top = want.body ? null : (want.top || 'tshirt'), bottom = want.body ? null : (want.bottom || 'shorts'), dress = want.body || null;
  root.traverse((o) => {
    if (!o.isMesh || o.userData.outline) return;
    const m = /^(Top|Bottom|Dress)_(.+)$/.exec(o.name); if (!m || /^(aodai_tet|xmas_sweater|halloween_witch)$/.test(m[2])) return;     // event pieces are handled elsewhere
    o.visible = (m[1] === 'Top' && m[2] === top) || (m[1] === 'Bottom' && m[2] === bottom) || (m[1] === 'Dress' && m[2] === dress);
  });
}
/** The goggles and red scarf of the starting look (Gear_goggles) hide under a hat or a tiara. */
export function setGoggles(root, on) { root.traverse((o) => { if (o.name === 'Gear_goggles' && !o.userData.outline) o.visible = on; }); }

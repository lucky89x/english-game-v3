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
/** Shows the one Hair_<style> object and hides the others (call syncOutlines(root) afterwards for their outline twins). */
export function setHairStyle(root, style) {
  const want = `Hair_${HAIR_STYLES.includes(style) ? style : 'short'}`;
  root.traverse((o) => { if (o.isMesh && !o.userData.outline && /^Hair_/.test(o.name)) o.visible = o.name === want; });
}

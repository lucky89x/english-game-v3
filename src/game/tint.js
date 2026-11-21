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
    // (21/11 fix: "choosing the dress makes the body invisible") a piece with two materials (the sundress: cloth + skin) loads
    // as a group whose meshes are named Dress_sundress_1, _2: read the group's name and drop the number
    const nm = /^(Top|Bottom|Dress)_/.test(o.name) ? o.name : o.parent && /^(Top|Bottom|Dress)_/.test(o.parent.name) ? o.parent.name : '';
    const m = /^(Top|Bottom|Dress)_(.+?)(?:_\d+)?$/.exec(nm); if (!m || /^(aodai_tet|xmas_sweater|halloween_witch)$/.test(m[2])) return;     // event pieces are handled elsewhere
    o.visible = (m[1] === 'Top' && m[2] === top) || (m[1] === 'Bottom' && m[2] === bottom) || (m[1] === 'Dress' && m[2] === dress);
    if (o.parent && !o.parent.isMesh && /^(Top|Bottom|Dress)_/.test(o.parent.name)) o.parent.visible = o.visible;      // the group starts hidden (eq_hidden in the file): it must be shown too
  });
}
/** The goggles and red scarf of the starting look (Gear_goggles) hide under a hat or a tiara. */
export function setGoggles(root, on) { root.traverse((o) => { if (o.name === 'Gear_goggles' && !o.userData.outline) o.visible = on; }); }
/** (21/11) Prints on the clothes ("T-shirts in many designs"): stripes, polka dots, checks, raglan sleeves, two-tone, tie-dye
 *  and a sports stripe, drawn by the shader in the model's own space (no UVs needed) over the tinted colour.
 *  part: 'top' (also the dresses, which use the top material) or 'bottom'; pat: '' (plain) or a key of PATS; col2: the print colour. */
export const PATS = { stripes: 1, dots: 2, check: 3, raglan: 4, ombre: 5, twotone: 6, sidestripe: 7 };
const PAT_FS = `
if (uPat > 0) { vec3 q = vObjPos; float m = 0.0;
  if (uPat == 1) m = step(0.55, fract(q.y * 15.0));
  else if (uPat == 2) { vec2 a = fract(vec2((q.x + q.z) * 15.0, q.y * 15.0 + 0.5 * step(0.5, fract((q.x + q.z) * 7.5)))) - 0.5; m = 1.0 - smoothstep(0.2, 0.25, length(a)); }
  else if (uPat == 3) { float s = step(0.5, fract((q.x + q.z) * 9.0)), t = step(0.5, fract(q.y * 9.0)); m = (s + t) * 0.42 + step(0.9, fract((q.x + q.z) * 18.0)) * 0.3; }
  else if (uPat == 4) m = smoothstep(0.15, 0.16, abs(q.x));
  else if (uPat == 5) m = 0.85 * (0.5 + 0.5 * sin(q.y * 22.0 + sin(q.x * 30.0 + q.z * 25.0) * 1.6));
  else if (uPat == 6) m = 1.0 - step(uMid, q.y);
  else if (uPat == 7) m = step(0.135, abs(q.x)) * (1.0 - step(0.158, abs(q.x)));
  vec3 c2 = uCol2;
  #ifdef USE_COLOR
  c2 *= vColor.rgb;
  #endif
  diffuseColor.rgb = mix(diffuseColor.rgb, c2, clamp(m, 0.0, 1.0)); }
`;
function patterned(m) {
  if (m.userData.patU) return m.userData.patU;
  const U = m.userData.patU = { uPat: { value: 0 }, uCol2: { value: new THREE.Color(1, 1, 1) }, uMid: { value: 0.62 } };
  const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : () => '';
  m.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'varying vec3 vObjPos;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvObjPos = position;');
    sh.fragmentShader = 'uniform int uPat;\nuniform vec3 uCol2;\nuniform float uMid;\nvarying vec3 vObjPos;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + PAT_FS);
  };
  m.customProgramCacheKey = () => prevKey() + '|eqpat';
  m.needsUpdate = true; return U;
}
export function setPattern(root, part, pat, col2) {
  root.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    mats.forEach((m, i) => {
      if (!new RegExp(`_${part}_tint$`).test(m.name || '')) return;
      if (!pat && !m.userData.patU) return;
      const c = mine(m); if (Array.isArray(o.material)) o.material[i] = c; else o.material = c;
      const U = patterned(c); U.uPat.value = PATS[pat] || 0; U.uCol2.value.set(col2 || '#ffffff');
      U.uMid.value = /^Dress_/.test(o.name) || /^Dress_/.test((o.parent && o.parent.name) || '') ? 0.52 : 0.62;
    });
  });
}
/** (21/11) The boots that are part of the body mesh: recoloured for boots and high-tops, painted skin for sandals and flats,
 *  their own colour otherwise. how: '' | 'colour' | 'skin'. */
export function setBoots(root, how, colour, skinOf) {
  root.traverse((o) => {
    if (!o.isMesh || !o.material || !/boots/.test(o.material.name || '')) return;
    const c = mine(o.material); o.material = c; if (!c.userData.base) c.userData.base = c.color.clone();
    if (how === 'colour') c.color.set(colour).multiplyScalar(0.9); else if (how === 'skin' && skinOf) c.color.copy(skinOf); else c.color.copy(c.userData.base);
  });
}

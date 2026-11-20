// Faces and skin tones for the character creator (19/11: "khi tạo nhân vật cho chọn được khuôn mặt…").
// tools/faces/build_faces.py draws 8 faces x 4 expressions with a TRANSPARENT background; here each one is painted onto the
// chosen skin tone on a canvas, so one set of files serves every skin. The skin material of the body takes the same tone.
import * as THREE from 'three';

export const FACES = ['sweet', 'bright', 'cool', 'gentle', 'sporty', 'dreamy', 'cheeky', 'calm'];
export const FACE_NAMES = { sweet: 'Sweet', bright: 'Bright', cool: 'Cool', gentle: 'Gentle', sporty: 'Sporty', dreamy: 'Dreamy', cheeky: 'Cheeky', calm: 'Calm' };
export const SKINS = { light: '#fbc59d', fair: '#fcdcc4', tan: '#e0ad86', deep: '#bf8a64' };
export const SKIN_NAMES = { light: 'light', fair: 'fair', tan: 'tan', deep: 'deep' };
export const DEFAULT_LOOK = { face: 'sweet', skin: 'light' };
const EXPR = ['happy', 'blink', 'talk', 'joy'];
export const lookOf = (p) => ({ face: FACES.includes(p && p.look && p.look.face) ? p.look.face : 'sweet', skin: SKINS[p && p.look && p.look.skin] ? p.look.skin : 'light' });

const images = new Map(), sets = new Map();
const image = (src) => images.get(src) || images.set(src, new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('face ' + src)); i.src = src; })).get(src);
/** { happy, blink, talk, joy } textures of one face on one skin tone (cached). */
export function faceMaps(face, skin) {
  const key = face + '|' + skin; if (sets.has(key)) return sets.get(key);
  const job = Promise.all(EXPR.map((e) => image(`./assets/tex/face_${face}_${e}.png`))).then((imgs) => {
    const out = {};
    imgs.forEach((img, i) => {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.fillStyle = SKINS[skin] || SKINS.light; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0);
      const t = new THREE.CanvasTexture(c); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; out[EXPR[i]] = t;
    });
    return out;
  });
  job.catch(() => sets.delete(key)); sets.set(key, job); return job;
}
const BASE = new THREE.Color(SKINS.light);
const own = new WeakSet();
/** Body skin (material ngoc_skin, the palette cell #fbc59d) takes the tone: colour = tone / base. */
export function tintSkin(root, skin) {
  const want = new THREE.Color(SKINS[skin] || SKINS.light);
  root.traverse((o) => {
    if (!o.isMesh || !o.material || o.material.name !== 'ngoc_skin') return;
    let m = o.material; if (!own.has(m)) { m = m.clone(); own.add(m); o.material = m; }
    m.color.setRGB(want.r / BASE.r, want.g / BASE.g, want.b / BASE.b);
  });
}

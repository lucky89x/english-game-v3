// Cartoon outline for characters (inverted hull): every mesh gets a twin drawn from the back faces, pushed out along
// its normals and coloured dark warm brown, so Ngọc and the villagers read clearly against busy backgrounds, as in
// painted storybooks. Skinned meshes share the skeleton, so the outline follows every animation.
import * as THREE from 'three';

const all = [];
function hullMaterial(color, thick) {
  const m = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide, fog: true });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uThick = { value: thick };
    sh.vertexShader = 'uniform float uThick;\n' + sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = vec3(position) + normalize(normal) * uThick;');
  };
  m.customProgramCacheKey = () => 'outline';
  return m;
}
/** Adds outlines to every mesh under root except those whose material name matches skip (the face decal). */
export function addOutline(root, { color = 0x3a2010, thick = 0.012, skip = /Face|Eye|Brow|Mouth/i } = {}) {
  const mat = hullMaterial(color, thick), meshes = [];
  root.traverse((m) => { if (m.isMesh && !m.userData.outline && !skip.test(m.material.name || '') && !skip.test(m.name)) meshes.push(m); });
  for (const m of meshes) {
    const o = m.isSkinnedMesh ? new THREE.SkinnedMesh(m.geometry, mat) : new THREE.Mesh(m.geometry, mat);
    if (m.isSkinnedMesh) o.bind(m.skeleton, m.bindMatrix);
    o.position.copy(m.position); o.quaternion.copy(m.quaternion); o.scale.copy(m.scale);
    o.userData.outline = true; o.userData.outlineOf = m; o.frustumCulled = false; o.castShadow = false; o.receiveShadow = false;
    m.parent.add(o); all.push(o);
  }
}
/** Outlines follow the quality level (off on "low"). */
let outlinesOn = true;
export function showOutlines(on) { outlinesOn = on; for (const o of all) o.visible = on && o.userData.outlineOf.visible; }
/** Call after hiding or showing a mesh that has an outline twin. */
export function syncOutlines(root) { root.traverse((o) => { if (o.userData.outline) o.visible = outlinesOn && o.userData.outlineOf.visible; }); }

// (25/11) Colours for the Tripo hero (Ruby). Her clothes and hair are painted into baked textures (no tint materials like Ngoc's),
// so the colour is changed in the shader: the texels of one colour family (the red of the vest and skirt, the cream of the sleeves, the
// brown of the boots and of the hair) are replaced by the chosen colour with the texture's own light and dark kept (target * luma / mean luma).
// Which parts take which colour: the red scarf on her chest -> top; dress -> top above the waist, bottom below it; sleeves -> top; boots -> feet; hair -> hair colour
// (the face box is excluded, so eyes and brows keep their colour). Pass null for "the painted original".
import * as THREE from 'three';

const FS_HEAD = `uniform int uMode; uniform vec3 uTop; uniform vec3 uBot; uniform float uTopOn; uniform float uBotOn; varying vec3 vHP;
vec3 eqHsv(vec3 c) { vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0); vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g)); vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r)); float d = q.x - min(q.w, q.y); return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + 1e-10)), d / (q.x + 1e-10), q.x); }
`;
const FS_BODY = `
{
  vec3 lin = sampledDiffuseColor.rgb; vec3 hv = eqHsv(pow(max(lin, vec3(0.0)), vec3(0.4545)));
  float hd = hv.x * 360.0; if (hd > 180.0) hd -= 360.0;
  float lum = dot(lin, vec3(0.2126, 0.7152, 0.0722)), w = 0.0, ref = 0.1, on = 0.0; vec3 tgt = uTop;
  float brown = smoothstep(8.0, 14.0, hd) * (1.0 - smoothstep(32.0, 40.0, hd)) * smoothstep(0.42, 0.55, hv.y) * (1.0 - smoothstep(0.58, 0.68, hv.z));
  if (uMode == 1) {
    w = smoothstep(-40.0, -20.0, hd) * (1.0 - smoothstep(12.0, 20.0, hd)) * smoothstep(0.4, 0.55, hv.y) * smoothstep(0.3, 0.4, hv.z); ref = 0.099;
    if (vHP.y > 0.84) { tgt = uTop; on = uTopOn; } else { tgt = uBot; on = uBotOn; }
  } else if (uMode == 5) {
    w = smoothstep(-40.0, -20.0, hd) * (1.0 - smoothstep(12.0, 20.0, hd)) * smoothstep(0.4, 0.55, hv.y) * smoothstep(0.3, 0.4, hv.z); ref = 0.1; tgt = uTop; on = uTopOn;
  } else if (uMode == 2) { w = smoothstep(0.2, 0.3, hv.y) * smoothstep(0.55, 0.7, hv.z); ref = 0.5; tgt = uTop; on = uTopOn; }
  else if (uMode == 3) { w = brown; ref = 0.09; tgt = uTop; on = uTopOn; }
  else if (uMode == 4) {
    float face = step(abs(vHP.x + 0.007), 0.17) * step(1.22, vHP.y) * step(vHP.y, 1.385) * step(0.14, vHP.z);
    w = brown * (1.0 - face); ref = 0.093; tgt = uTop; on = uTopOn;
  }
  float k = clamp(lum / ref, 0.5, 1.6);
  diffuseColor.rgb = mix(diffuseColor.rgb, tgt * k * diffuse, w * on);
}
`;
const MODE = { Hero: 4, Outfit_dress: 1, Outfit_scarf: 5, Outfit_sleeve_l: 2, Outfit_sleeve_r: 2, Outfit_boot_a: 3, Outfit_boot_b: 3 };

function patch(m, mode) {
  if (m.userData.heroU) return m.userData.heroU;
  const U = m.userData.heroU = { uMode: { value: mode }, uTop: { value: new THREE.Color() }, uBot: { value: new THREE.Color() }, uTopOn: { value: 0 }, uBotOn: { value: 0 } };
  const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : () => '';
  m.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'varying vec3 vHP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvHP = position;');
    sh.fragmentShader = FS_HEAD + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n#ifdef USE_MAP\n' + FS_BODY + '#endif\n');
  };
  m.customProgramCacheKey = () => prevKey() + '|eqhero';
  m.needsUpdate = true; return U;
}

/** parts: { top, bottom, sleeves, boots, hair } as '#rrggbb' (or null for the painted original) */
export function tintHero(root, parts) {
  root.traverse((o) => {
    if (!o.isMesh || o.userData.outline || !o.material || !MODE[o.name]) return;
    const mode = MODE[o.name], mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      const U = patch(m, mode);
      const set = (key, hex, flag) => { U[key].value.set(hex || '#ffffff'); U[flag].value = hex ? 1 : 0; };
      if (mode === 1) { set('uTop', parts.top, 'uTopOn'); set('uBot', parts.bottom, 'uBotOn'); }
      else if (mode === 5) set('uTop', parts.top, 'uTopOn');
      else if (mode === 2) set('uTop', parts.sleeves || parts.top, 'uTopOn');
      else if (mode === 3) set('uTop', parts.boots, 'uTopOn');
      else if (mode === 4) set('uTop', parts.hair, 'uTopOn');
    }
  });
}

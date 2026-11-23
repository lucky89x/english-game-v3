// Day and night that follow the computer's clock (24/11: "at night the sky is dark and the lamps come on; the moon lights the
// world instead of the sun"). `phaseOf(hour)` is pure and tested in node; `DayNight` applies it to the scene's lights, fog and
// sky every few frames. Morning 6:00–7:30 and evening 17:30–19:00 are the warm dawn/dusk, the night is 19:30–5:30.
import * as THREE from 'three';

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, k) => a + (b - a) * k;

/** hour: 0–24 (e.g. 18.5 = 18:30). Returns the sun's height (−1..1), how much daylight (0 night … 1 noon), the warm tint at
 *  dawn and dusk, and directions for the sun and the moon (unit vectors, y up). */
export function phaseOf(hour) {
  const h = ((hour % 24) + 24) % 24;
  const sunAlt = Math.sin(Math.PI * (h - 6) / 12);                   // up from 6:00, highest at 12:00, down at 18:00
  const day = smooth(-0.05, 0.28, sunAlt);                            // a short twilight either side of the horizon
  const warm = (1 - smooth(0.0, 0.45, Math.abs(sunAlt))) * (sunAlt > -0.2 ? 1 : 0);      // strongest when the sun is low
  const az = (h - 12) / 12 * Math.PI;                                 // the sun walks from east (morning) to west (evening)
  const sun = new THREE.Vector3(Math.sin(az) * 0.8, Math.max(0.08, sunAlt), -Math.cos(az) * 0.5 + 0.35).normalize();
  const mh = (h + 12) % 24, mAlt = Math.sin(Math.PI * (mh - 6) / 12), maz = (mh - 12) / 12 * Math.PI;
  const moon = new THREE.Vector3(Math.sin(maz) * 0.8, Math.max(0.2, mAlt), -Math.cos(maz) * 0.5 + 0.35).normalize();
  return { hour: h, sunAlt, day, night: 1 - day, warm, sun, moon, lamps: 1 - smooth(0.0, 0.3, sunAlt) };
}
/** The hour now (local time), unless a test or the admin forces one. */
export const clockHour = (force) => (force !== undefined && force !== null ? force : (() => { const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; })());

const C = (hex) => new THREE.Color(hex);
const SKY = { day: C(0xbfe4ff), dusk: C(0xf0a070), night: C(0x0b1530) };

export class DayNight {
  /** parts: { scene, sky (Mesh with uniforms uSun uNight uMoon), sun, rim, hemi, sunDir (the Vector3 the game uses for shadows and rays) } */
  constructor(parts) { this.p = parts; this.force = null; this.t = 0; this.glow = []; this.last = -1; this.cur = null; }
  /** Finds the glowing materials (windows, lamps) once a region is built; their strength follows the dark. */
  scan(root) {
    const seen = new Set(); this.glow = [];
    root.traverse((o) => { if (!o.isMesh) return; for (const m of [].concat(o.material)) { if (!m || seen.has(m)) continue; seen.add(m); if (/^(window_glow|lamp_glow|light_|lantern)/.test(m.name || '') || (m.userData && m.userData.nightGlow)) this.glow.push({ m, base: m.userData.baseGlow ?? (m.userData.baseGlow = m.emissiveIntensity || 1) }); } });
  }
  update(dt) {
    this.t += dt; if (this.t < 0.25 && this.last >= 0) return; this.t = 0;      // four times a second is plenty
    const ph = phaseOf(clockHour(this.force)), { scene, sky, sun, rim, hemi, sunDir } = this.p; this.cur = ph;
    const d = ph.day, n = ph.night;
    // the light that casts shadows: the sun by day, the moon by night (cool and gentle)
    const dir = d > 0.35 ? ph.sun : ph.moon; sunDir.copy(dir);
    sun.color.copy(C(0xffe6bc)).lerp(C(0xffa060), ph.warm * 0.8).lerp(C(0xa9bcff), n); sun.intensity = mix(0.55, 1.9, d) * (n > 0.5 ? 0.45 + 0.55 * (1 - n) : 1) + (n > 0.5 ? 0.0 : 0);
    if (n > 0.5) sun.intensity = 0.5;      // moonlight
    hemi.color.copy(C(0xdcefff)).lerp(C(0x8aa0ff), n); hemi.groundColor.copy(C(0xc8b88a)).lerp(C(0x1c2440), n); hemi.intensity = mix(0.4, 1.05, d);
    rim.intensity = mix(0.18, 0.75, d); rim.color.copy(C(0xcfe2ff)).lerp(C(0x7f95e8), n);
    scene.fog.color.copy(SKY.day).lerp(SKY.dusk, ph.warm * 0.7).lerp(SKY.night, n);
    scene.environmentIntensity = mix(0.05, 0.22, d);
    if (sky.material.uniforms.uNight) { sky.material.uniforms.uNight.value = n; sky.material.uniforms.uWarm.value = ph.warm; sky.material.uniforms.uSun.value.copy(ph.sun); sky.material.uniforms.uMoon.value.copy(ph.moon); }
    // windows and lamps come on in the dark
    const k = mix(0.45, 2.4, ph.lamps); for (const g of this.glow) g.m.emissiveIntensity = g.base * k;
  }
}

// Day and night that follow the computer's clock (24/11: "at night the sky is dark and the lamps come on; the moon lights the
// world instead of the sun"). `phaseOf(hour)` is pure and tested in node; `DayNight` applies it to the scene's lights, fog and
// sky every few frames (the pure clock maths is in core/daynight.js, unit-tested).
import * as THREE from 'three';
import { phaseOf as phaseCore, clockHour } from '../core/daynight.js';
export { clockHour };
/** The phase with the directions as three.js vectors. */
export const phaseOf = (hour) => { const p = phaseCore(hour); return { ...p, sun: new THREE.Vector3(...p.sun), moon: new THREE.Vector3(...p.moon) }; };

const mix = (a, b, k) => a + (b - a) * k;

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
    this.t += dt; if (this.t < 0.25 && this.last >= 0) return; this.t = 0; this.last = 0;      // four times a second is plenty
    this.scanT = (this.scanT || 0) + 0.25; if (!this.glow.length || this.scanT > 8) { this.scanT = 0; this.scan(this.p.scene); }      // houses and lamps built later join the dark
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

// Day and night maths (24/11): from the hour of the day to how much daylight there is. Pure, tested in node; the lights,
// fog and sky that use it are in game/daynight.js. Sunrise 6:00, noon 12:00, sunset 18:00, with a long gentle twilight.
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const unit = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };

/** hour: 0–24 (18.5 = 18:30). Returns { hour, sunAlt (−1..1), day (0 night … 1 day), night, warm (dawn/dusk tint 0..1), lamps (0 day … 1 dark), sun, moon (unit vectors [x,y,z]) }. */
export function phaseOf(hour) {
  const h = ((hour % 24) + 24) % 24;
  const sunAlt = Math.sin(Math.PI * (h - 6) / 12);
  const day = smooth(-0.22, 0.3, sunAlt);
  const warm = (1 - smooth(0.0, 0.5, Math.abs(sunAlt))) * (sunAlt > -0.3 ? 1 : 0);
  const az = (h - 12) / 12 * Math.PI, mh = (h + 12) % 24, mAlt = Math.sin(Math.PI * (mh - 6) / 12), maz = (mh - 12) / 12 * Math.PI;
  return { hour: h, sunAlt, day, night: 1 - day, warm, lamps: 1 - smooth(-0.1, 0.25, sunAlt),
    sun: unit([Math.sin(az) * 0.8, Math.max(0.08, sunAlt), -Math.cos(az) * 0.5 + 0.35]), moon: unit([Math.sin(maz) * 0.8, Math.max(0.2, mAlt), -Math.cos(maz) * 0.5 + 0.35]) };
}
/** The hour now (local time), unless a test or the admin forces one. */
export const clockHour = (force) => (force !== undefined && force !== null ? force : (() => { const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; })());

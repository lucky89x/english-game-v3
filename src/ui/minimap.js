// North-up minimap drawn from core/layout.js. Click = travel there by A* (never through water or
// solids); wheel over the map zooms only the map; the planned route and quest markers are shown.
import * as L from '../core/layout.js';
import { findPath, snap } from '../core/nav.js';

const BASE = 2;                     // px per metre in the pre-rendered map image
export class Minimap {
  constructor(canvas, onTravel) {
    this.cv = canvas; this.ctx = canvas.getContext('2d'); this.zoom = 1.6; this.route = null; this.onTravel = onTravel; this.markers = [];
    this.bg = this.renderBase();
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); e.stopPropagation(); this.zoom = Math.min(4, Math.max(0.75, this.zoom * (e.deltaY < 0 ? 1.2 : 1 / 1.2))); }, { passive: false });
    canvas.addEventListener('mousedown', (e) => e.stopPropagation());
    canvas.addEventListener('click', (e) => { const r = canvas.getBoundingClientRect(); this.travelTo(...this.toWorld((e.clientX - r.left) * canvas.width / r.width, (e.clientY - r.top) * canvas.height / r.height)); });
  }
  rebuild() { this.bg = this.renderBase(); this.route = null; }
  renderBase() {
    const n = L.SIZE * BASE, cv = document.createElement('canvas'); cv.width = cv.height = n;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(n, n);
    for (let pz = 0; pz < n; pz++) for (let px = 0; px < n; px++) {
      const x = px / BASE - L.SIZE / 2, z = pz / BASE - L.SIZE / 2, h = L.groundHeight(x, z);
      let c = [110, 196, 86];
      if (Math.hypot(x, z) > L.PLAY_RADIUS) c = [70, 150, 78];
      else if (L.pathDistance(x, z) < 0) c = [236, 214, 160];
      else if (h < L.WATER_LEVEL + 0.12 && z > L.RIVER_START - 1) c = [72, 178, 226];
      else if (h > 6) c = [168, 164, 180];
      else if (h > 2.2) c = [134, 204, 100];
      img.data.set([...c, 255], (pz * n + px) * 4);
    }
    ctx.putImageData(img, 0, 0);
    ctx.fillStyle = '#2f8a3c'; for (const t of L.TREES) { ctx.beginPath(); ctx.arc((t.x + L.SIZE / 2) * BASE, (t.z + L.SIZE / 2) * BASE, 2.2 * t.s, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#8a5a30'; for (const b of L.BRIDGES) ctx.fillRect((b.x - L.BRIDGE_LEN / 2 + L.SIZE / 2) * BASE, (b.z - 1.4 + L.SIZE / 2) * BASE, L.BRIDGE_LEN * BASE, 2.8 * BASE);
    ctx.fillStyle = '#c9c4d2'; for (const s of L.STONES) { ctx.beginPath(); ctx.arc((s.x + L.SIZE / 2) * BASE, (s.z + L.SIZE / 2) * BASE, 1.6, 0, 7); ctx.fill(); }
    return cv;
  }
  toWorld(px, py) { const s = BASE * this.zoom / 2; return [this.cx + (px - this.cv.width / 2) / s, this.cz + (py - this.cv.height / 2) / s]; }
  toMap(x, z) { const s = BASE * this.zoom / 2; return [this.cv.width / 2 + (x - this.cx) * s, this.cv.height / 2 + (z - this.cz) * s]; }
  /** Plans a route; returns false (and keeps the old one) when the spot cannot be reached. */
  travelTo(x, z) {
    const goal = snap(x, z, 1);
    const path = goal ? findPath(this.px, this.pz, goal.x, goal.z) : null;
    if (!path) { this.flash = performance.now(); return false; }
    this.route = path; this.onTravel(path);
    return true;
  }
  clearRoute() { this.route = null; }
  draw(player, yaw, markers) {
    const { ctx, cv } = this; this.px = player.x; this.pz = player.z; this.cx = player.x; this.cz = player.z;
    const s = BASE * this.zoom / 2, w = cv.width, h = cv.height;
    ctx.fillStyle = '#46965a'; ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.bg, w / 2 - (player.x + L.SIZE / 2) * s, h / 2 - (player.z + L.SIZE / 2) * s, L.SIZE * s, L.SIZE * s);
    if (this.route) { ctx.strokeStyle = '#ff5a3c'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]); ctx.beginPath(); this.route.forEach((p, i) => { const [mx, my] = this.toMap(p.x, p.z); if (i) ctx.lineTo(mx, my); else ctx.moveTo(mx, my); }); ctx.stroke(); ctx.setLineDash([]); }
    ctx.font = '700 10px sans-serif'; ctx.textAlign = 'center';
    for (const l of L.LANDMARKS) { const [mx, my] = this.toMap(l.x, l.z); if (mx < -30 || my < -10 || mx > w + 30 || my > h + 10) continue; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.strokeText(l.label, mx, my + 3); ctx.fillStyle = '#3a2410'; ctx.fillText(l.label, mx, my + 3); }
    for (const m of markers) {
      let [mx, my] = this.toMap(m.x, m.z); mx = Math.min(w - 9, Math.max(9, mx)); my = Math.min(h - 9, Math.max(9, my));
      ctx.fillStyle = m.color || '#ffd23c'; ctx.strokeStyle = '#4a2a10'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(mx, my, 7.5, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4a2a10'; ctx.font = '800 11px sans-serif'; ctx.fillText(m.text, mx, my + 4);
    }
    const dx = Math.sin(yaw), dz = Math.cos(yaw);         // facing direction on the map (north up)
    ctx.fillStyle = '#e8302a'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(w / 2 + dx * 10, h / 2 + dz * 10); ctx.lineTo(w / 2 - dx * 6 - dz * 6, h / 2 - dz * 6 + dx * 6); ctx.lineTo(w / 2 - dx * 2.5, h / 2 - dz * 2.5); ctx.lineTo(w / 2 - dx * 6 + dz * 6, h / 2 - dz * 6 - dx * 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a2410'; ctx.font = '800 12px sans-serif'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeText('N', w / 2, 13); ctx.fillText('N', w / 2, 13);
    if (this.flash && performance.now() - this.flash < 500) { ctx.strokeStyle = '#e8302a'; ctx.lineWidth = 5; ctx.strokeRect(2, 2, w - 4, h - 4); }
  }
}

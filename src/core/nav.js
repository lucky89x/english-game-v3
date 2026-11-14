// Grid A* over the walkable map (1 m cells, 8 directions). Used by minimap click-to-travel.
import { walkable, canStep, onRegionChange } from './layout.js';

const N = 150, OFF = N / 2;          // covers the largest region (play radius up to 74 m)
let grid = null;
onRegionChange(() => { grid = null; });
function build() {
  grid = new Uint8Array(N * N);
  for (let gz = 0; gz < N; gz++) for (let gx = 0; gx < N; gx++) grid[gz * N + gx] = walkable(gx - OFF + 0.5, gz - OFF + 0.5, 0.55) ? 1 : 0;
}
const cx = (g) => g - OFF + 0.5;
export function cellOf(x, z) { return [Math.floor(x + OFF), Math.floor(z + OFF)]; }
export function isReachableCell(x, z) { if (!grid) build(); const [gx, gz] = cellOf(x, z); return gx >= 0 && gz >= 0 && gx < N && gz < N && grid[gz * N + gx] === 1; }

/** Nearest walkable cell centre within `radius` metres, or null. */
export function snap(x, z, radius = 3) {
  if (!grid) build();
  let best = null, bd = 1e9;
  for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
    const px = Math.floor(x) + dx + 0.5, pz = Math.floor(z) + dz + 0.5;
    if (isReachableCell(px, pz)) { const d = Math.hypot(px - x, pz - z); if (d < bd) { bd = d; best = { x: px, z: pz }; } }
  }
  return best;
}

/** A* path [{x, z}, ...] from a to b, or null when b is in water, in a solid or cut off. */
export function findPath(ax, az, bx, bz) {
  if (!grid) build();
  const s = snap(ax, az, 2), t = snap(bx, bz, 0);
  if (!s || !t) return null;
  const [sx, sz] = cellOf(s.x, s.z), [tx, tz] = cellOf(t.x, t.z);
  const start = sz * N + sx, goal = tz * N + tx;
  const g = new Float32Array(N * N).fill(Infinity), came = new Int32Array(N * N).fill(-1), closed = new Uint8Array(N * N);
  const heap = [];
  const push = (i, f) => { heap.push([f, i]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let p = 0; for (;;) { let m = p; const l = 2 * p + 1, r = l + 1; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === p) break; [heap[p], heap[m]] = [heap[m], heap[p]]; p = m; } } return top; };
  g[start] = 0; push(start, 0);
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  while (heap.length) {
    const [, cur] = pop();
    if (cur === goal) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    const x = cur % N, z = (cur / N) | 0;
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (nx < 0 || nz < 0 || nx >= N || nz >= N) continue;
      const ni = nz * N + nx;
      if (!grid[ni] || closed[ni]) continue;
      if (dx && dz && (!grid[z * N + nx] || !grid[nz * N + x])) continue;          // no corner cutting
      if (!canStep(cx(x), cx(z), cx(nx), cx(nz), 0.3) && !canStep(cx(nx), cx(nz), cx(x), cx(z), 0.3)) continue;
      const ng = g[cur] + (dx && dz ? 1.414 : 1);
      if (ng < g[ni]) { g[ni] = ng; came[ni] = cur; push(ni, ng + Math.hypot(nx - tx, nz - tz)); }
    }
  }
  if (came[goal] === -1 && goal !== start) return null;
  const out = [];
  for (let c = goal; c !== -1; c = came[c]) out.push({ x: cx(c % N), z: cx((c / N) | 0) });
  return out.reverse();
}

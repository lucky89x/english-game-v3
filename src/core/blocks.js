// Falling-blocks rules (pure, tested in node). Board W x H, row 0 at the top, 0 = empty, 1..7 = piece colour.
export const W = 10, H = 20;
export const SHAPES = [
  [[0, 1], [1, 1], [2, 1], [3, 1]],          // I
  [[0, 0], [1, 0], [0, 1], [1, 1]],          // O
  [[1, 0], [0, 1], [1, 1], [2, 1]],          // T
  [[1, 0], [2, 0], [0, 1], [1, 1]],          // S
  [[0, 0], [1, 0], [1, 1], [2, 1]],          // Z
  [[0, 0], [0, 1], [1, 1], [2, 1]],          // J
  [[2, 0], [0, 1], [1, 1], [2, 1]],          // L
];
export const empty = () => new Array(W * H).fill(0);
/** Cells of piece {k, r, x, y}: shape k turned r times clockwise inside its box. */
export function cells(p) {
  const size = p.k === 0 ? 4 : p.k === 1 ? 2 : 3;
  return SHAPES[p.k].map(([cx, cy]) => { let x = cx, y = cy; for (let i = 0; i < ((p.r % 4) + 4) % 4; i++) [x, y] = [size - 1 - y, x]; return [p.x + x, p.y + y]; });
}
export const fits = (b, p) => cells(p).every(([x, y]) => x >= 0 && x < W && y < H && (y < 0 || !b[y * W + x]));
export const spawn = (k) => ({ k, r: 0, x: k === 0 ? 3 : 4, y: k === 0 ? -1 : 0 });
/** Tries a move; returns the moved piece or the same one when blocked. Rotation tries small wall kicks. */
export function shift(b, p, dx, dy, dr = 0) {
  for (const kick of dr ? [0, -1, 1, -2, 2] : [0]) { const q = { ...p, x: p.x + dx + kick, y: p.y + dy, r: p.r + dr }; if (fits(b, q)) return q; }
  return p;
}
/** Locks the piece, clears full rows. Returns the number of rows cleared. */
export function lock(b, p) {
  for (const [x, y] of cells(p)) if (y >= 0) b[y * W + x] = p.k + 1;
  let n = 0;
  for (let y = H - 1; y >= 0; y--) if ([...Array(W).keys()].every((x) => b[y * W + x])) { b.splice(y * W, W); b.unshift(...new Array(W).fill(0)); n++; y++; }
  return n;
}
export const drop = (b, p) => { let q = p; for (;;) { const n = shift(b, q, 0, 1); if (n === q) return q; q = n; } };
export const LINE_SCORE = [0, 100, 300, 500, 800];
export const blocksReward = (score) => ({ gold: Math.min(30, Math.floor(score / 80)), exp: Math.min(40, Math.floor(score / 50)) });

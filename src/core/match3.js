// Match-3 rules (pure, tested in node). Board: N x N array of gem ids 0..KINDS-1, row 0 at the top.
export const N = 7, KINDS = 6;
export const idx = (r, c) => r * N + c;
/** Cells that are part of a horizontal or vertical run of 3+. */
export function matches(b) {
  const hit = new Set();
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const g = b[idx(r, c)]; if (g < 0) continue;
    if (c + 2 < N && b[idx(r, c + 1)] === g && b[idx(r, c + 2)] === g) { let k = c; while (k < N && b[idx(r, k)] === g) hit.add(idx(r, k++)); }
    if (r + 2 < N && b[idx(r + 1, c)] === g && b[idx(r + 2, c)] === g) { let k = r; while (k < N && b[idx(k, c)] === g) hit.add(idx(k++, c)); }
  }
  return hit;
}
/** A fresh board with no ready-made match. */
export function newBoard(rnd) {
  const b = new Array(N * N).fill(-1);
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    let g; do { g = Math.floor(rnd() * KINDS); } while ((c >= 2 && b[idx(r, c - 1)] === g && b[idx(r, c - 2)] === g) || (r >= 2 && b[idx(r - 1, c)] === g && b[idx(r - 2, c)] === g));
    b[idx(r, c)] = g;
  }
  return b;
}
export const adjacent = (a, b) => Math.abs(Math.floor(a / N) - Math.floor(b / N)) + Math.abs(a % N - b % N) === 1;
/** Removes matched cells, lets gems fall, refills from the top. Returns the cells cleared. */
export function collapse(b, hit, rnd) {
  for (const i of hit) b[i] = -1;
  for (let c = 0; c < N; c++) {
    let w = N - 1;
    for (let r = N - 1; r >= 0; r--) if (b[idx(r, c)] >= 0) { const g = b[idx(r, c)]; b[idx(r, c)] = -1; b[idx(w--, c)] = g; }
    for (; w >= 0; w--) b[idx(w, c)] = Math.floor(rnd() * KINDS);
  }
  return hit.size;
}
/** Tries to swap two neighbours. Returns { ok, cleared, combo, score }; the board is left unchanged when nothing matches. */
export function move(b, a, c, rnd) {
  if (!adjacent(a, c)) return { ok: false, cleared: 0, combo: 0, score: 0 };
  [b[a], b[c]] = [b[c], b[a]];
  let hit = matches(b);
  if (!hit.size) { [b[a], b[c]] = [b[c], b[a]]; return { ok: false, cleared: 0, combo: 0, score: 0 }; }
  let cleared = 0, combo = 0, score = 0;
  while (hit.size) { combo += 1; score += hit.size * 10 * combo; cleared += collapse(b, hit, rnd); hit = matches(b); }
  return { ok: true, cleared, combo, score };
}
/** True when some swap would make a match (otherwise the board is reshuffled). */
export function hasMove(b) {
  for (let i = 0; i < N * N; i++) for (const j of [i + 1, i + N]) {
    if (j >= N * N || !adjacent(i, j)) continue;
    [b[i], b[j]] = [b[j], b[i]]; const ok = matches(b).size > 0; [b[i], b[j]] = [b[j], b[i]]; if (ok) return true;
  }
  return false;
}
export const candyReward = (score) => ({ gold: Math.min(30, Math.floor(score / 60)), exp: Math.min(40, Math.floor(score / 40)) });

/** The matched groups on a board, each with its shape (18/11 effects): runs of 3–6 in a line, or 'L' when a row and a
 *  column of the same candy meet (L or T). Returns [{ cells: [i…], kind, shape: 3|4|5|6|'L' }]. */
export function groups(b) {
  const runs = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N;) { const g = b[idx(r, c)]; let k = c; while (k < N && b[idx(r, k)] === g) k++; if (g >= 0 && k - c >= 3) runs.push({ cells: Array.from({ length: k - c }, (_, j) => idx(r, c + j)), kind: g, dir: 'h' }); c = k; }
  for (let c = 0; c < N; c++) for (let r = 0; r < N;) { const g = b[idx(r, c)]; let k = r; while (k < N && b[idx(k, c)] === g) k++; if (g >= 0 && k - r >= 3) runs.push({ cells: Array.from({ length: k - r }, (_, j) => idx(r + j, c)), kind: g, dir: 'v' }); r = k; }
  const out = [];
  for (const run of runs) {
    const joined = out.find((o) => o.kind === run.kind && run.cells.some((i) => o.cells.includes(i)));
    if (joined) { for (const i of run.cells) if (!joined.cells.includes(i)) joined.cells.push(i); joined.dirs.add(run.dir); joined.long = Math.max(joined.long, run.cells.length); }
    else out.push({ cells: [...run.cells], kind: run.kind, dirs: new Set([run.dir]), long: run.cells.length });
  }
  return out.map((o) => ({ cells: o.cells, kind: o.kind, shape: o.dirs.size > 1 ? 'L' : Math.min(6, o.long) }));
}
/** Extra points for a shape: a plain 3 earns nothing more. */
export const shapeBonus = (shape) => ({ 3: 0, 4: 30, 5: 80, 6: 150, L: 60 })[shape] || 0;
/** Like collapse, and also says how many rows each cell's candy fell (new candies come from above the board). */
export function collapseWithFall(b, hit, rnd) {
  const fall = new Array(N * N).fill(0);
  for (const i of hit) b[i] = -1;
  for (let c = 0; c < N; c++) {
    let w = N - 1;
    for (let r = N - 1; r >= 0; r--) if (b[idx(r, c)] >= 0) { const g = b[idx(r, c)]; b[idx(r, c)] = -1; b[idx(w, c)] = g; fall[idx(w, c)] = w - r; w--; }
    const empty = w + 1;
    for (; w >= 0; w--) { b[idx(w, c)] = Math.floor(rnd() * KINDS); fall[idx(w, c)] = empty; }
  }
  return fall;
}

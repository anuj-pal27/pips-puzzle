// Jigsaw geometry: piece outlines (with tabs and blanks), board slot lines and tray layout.
// Pure functions with no React or React Native imports, so they can be unit-tested with plain Node.

import { randInt, shuffled } from './random.ts';

export type JigsawGrid = {
  cols: number;
  rows: number;
  /** piece width and height in pixels (the board is cols*pw by rows*ph) */
  pw: number;
  ph: number;
};

export type TraySpot = { id: number; cx: number; cy: number; rot: number; scale: number };

/** Stable pseudo-random +1/-1 so every puzzle always cuts the same way. */
function sign(a: number, b: number, salt: number): 1 | -1 {
  return (((a * 73856093) ^ (b * 19349663) ^ (salt * 83492791)) >>> 0) % 2 ? 1 : -1;
}

/** +1: the tab on the edge below row r, column c points down. */
export const hSign = (r: number, c: number) => sign(r, c, 1);
/** +1: the tab on the edge right of column c, row r points right. */
export const vSign = (r: number, c: number) => sign(r, c, 2);

const round = (n: number) => Math.round(n * 10) / 10;

/** One edge from (x0,y0) to (x1,y1); s = +1 tab bulges outward (left of travel), -1 inward, 0 straight. */
function edge(x0: number, y0: number, x1: number, y1: number, s: number): string {
  if (!s) return ` L ${round(x1)} ${round(y1)}`;
  const L = Math.hypot(x1 - x0, y1 - y0);
  const dx = (x1 - x0) / L;
  const dy = (y1 - y0) / L;
  const nx = dy;
  const ny = -dx;
  const P = (u: number, v: number) =>
    `${round(x0 + dx * u * L + nx * v * L * s)} ${round(y0 + dy * u * L + ny * v * L * s)}`;
  return (
    ` C ${P(0.2, 0)} ${P(0.5, -0.1)} ${P(0.4, 0.1)}` +
    ` C ${P(0.3, 0.3)} ${P(0.7, 0.3)} ${P(0.6, 0.1)}` +
    ` C ${P(0.5, -0.1)} ${P(0.8, 0)} ${P(1, 0)}`
  );
}

/** Space around a piece's cell so its tabs fit inside the piece's own drawing box. */
export function pieceMargin(g: JigsawGrid): number {
  return Math.ceil(0.3 * Math.max(g.pw, g.ph));
}

/** Outline of piece (r, c) with its cell's top-left corner at (ox, oy). */
export function piecePath(g: JigsawGrid, r: number, c: number, ox: number, oy: number): string {
  const top = r === 0 ? 0 : -hSign(r - 1, c);
  const bottom = r === g.rows - 1 ? 0 : hSign(r, c);
  const right = c === g.cols - 1 ? 0 : vSign(r, c);
  const left = c === 0 ? 0 : -vSign(r, c - 1);
  const x1 = ox + g.pw;
  const y1 = oy + g.ph;
  return (
    `M ${round(ox)} ${round(oy)}` +
    edge(ox, oy, x1, oy, top) +
    edge(x1, oy, x1, y1, right) +
    edge(x1, y1, ox, y1, bottom) +
    edge(ox, y1, ox, oy, left) +
    ' Z'
  );
}

/** Dashed guide lines on the empty board: the outer frame plus every inner cut, drawn once. */
export function slotPath(g: JigsawGrid): string {
  const W = g.cols * g.pw;
  const H = g.rows * g.ph;
  let d = `M 0 0 L ${round(W)} 0 L ${round(W)} ${round(H)} L 0 ${round(H)} Z`;
  for (let r = 0; r < g.rows - 1; r++) {
    for (let c = 0; c < g.cols; c++) {
      const y = (r + 1) * g.ph;
      d += ` M ${round(c * g.pw)} ${round(y)}` + edge(c * g.pw, y, (c + 1) * g.pw, y, -hSign(r, c));
    }
  }
  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols - 1; c++) {
      const x = (c + 1) * g.pw;
      d += ` M ${round(x)} ${round(r * g.ph)}` + edge(x, r * g.ph, x, (r + 1) * g.ph, vSign(r, c));
    }
  }
  return d;
}

/** Where piece `id` belongs, as a fraction of the board (0..1 across and down). */
const boardSpot = (g: JigsawGrid, id: number) => ({ x: ((id % g.cols) + 0.5) / g.cols, y: (Math.floor(id / g.cols) + 0.5) / g.rows });

/**
 * A piece starts "near home" if its tray spot is roughly where it goes on the board: too easy to guess.
 * Distance as a fraction of the tray; smaller for big puzzles, where the tray cells are smaller too.
 */
export const nearHome = (g: JigsawGrid) => Math.min(0.3, 0.9 / Math.max(g.cols, g.rows));

/**
 * Where the pieces wait in the tray at the start: positions are piece centres relative to the tray's
 * top-left corner. A new mix every play (pass a seeded `rand` to repeat one):
 * - "grid" (Easy): a loose grid in a random order, each piece a little turned.
 * - "pile" (Medium, Hard): a messy heap; pieces may overlap a little, and the list order is the stacking order.
 * Either way no piece starts in the part of the tray that matches its spot on the board.
 */
export function trayLayout(g: JigsawGrid, trayW: number, trayH: number, rand: () => number, style: 'grid' | 'pile' = 'grid'): TraySpot[] {
  const n = g.cols * g.rows;
  const tcols = n <= 6 ? 3 : n <= 12 ? 4 : 5;
  const trows = Math.ceil(n / tcols);
  const m = pieceMargin(g);
  const boxW = g.pw + 2 * m;
  const boxH = g.ph + 2 * m;
  const cellW = trayW / tcols;
  const cellH = trayH / trows;
  const gridScale = Math.min(0.9, (cellW * 0.98) / boxW, (cellH * 0.98) / boxH);
  const near = (id: number, x: number, y: number) => {
    const home = boardSpot(g, id);
    return Math.hypot(home.x - x / trayW, home.y - y / trayH) < nearHome(g);
  };

  if (style === 'pile') {
    const pile = pileLayout(n, trayW, trayH, boxW, boxH, Math.min(0.95, gridScale * 1.15), rand, near);
    if (pile) return pile;
  }

  // Grid: try random orders until no piece sits near its own spot (keep the best try if none is perfect).
  const cells = Array.from({ length: n }, (_, k) => ({ x: cellW * ((k % tcols) + 0.5), y: cellH * (Math.floor(k / tcols) + 0.5) }));
  let best: number[] = [];
  let bestBad = Infinity;
  for (let attempt = 0; attempt < 200 && bestBad > 0; attempt++) {
    const order = shuffled(Array.from({ length: n }, (_, i) => i), rand);
    const bad = order.filter((id, k) => near(id, cells[k].x, cells[k].y)).length;
    if (bad < bestBad) [best, bestBad] = [order, bad];
  }
  return best.map((id, k) => ({
    id,
    cx: cells[k].x + (rand() - 0.5) * cellW * 0.12,
    cy: cells[k].y + (rand() - 0.5) * cellH * 0.12,
    rot: randInt(rand, -15, 15),
    scale: gridScale,
  }));
}

/** Drop pieces one by one at random places, never right on top of another one (so each can still be grabbed). */
function pileLayout(
  n: number,
  trayW: number,
  trayH: number,
  boxW: number,
  boxH: number,
  scale: number,
  rand: () => number,
  near: (id: number, x: number, y: number) => boolean,
): TraySpot[] | null {
  const w = boxW * scale;
  const h = boxH * scale;
  if (w >= trayW || h >= trayH) return null;
  const minGap = 0.62 * Math.min(w, h); // centres at least this far apart: overlaps stay small
  for (let attempt = 0; attempt < 20; attempt++) {
    const spots: TraySpot[] = [];
    for (const id of shuffled(Array.from({ length: n }, (_, i) => i), rand)) {
      let placed = false;
      for (let tries = 0; tries < 250 && !placed; tries++) {
        const cx = w / 2 + rand() * (trayW - w);
        const cy = h / 2 + rand() * (trayH - h);
        if (near(id, cx, cy)) continue;
        if (spots.some((s) => Math.hypot(s.cx - cx, s.cy - cy) < minGap)) continue;
        spots.push({ id, cx, cy, rot: randInt(rand, -25, 25), scale });
        placed = true;
      }
      if (!placed) break;
    }
    if (spots.length === n) return spots;
  }
  return null; // tray too small for a heap: fall back to the grid
}

/**
 * "Spin" jigsaws: how many quarter-turns clockwise each piece starts with (0 = already upright).
 * Random every play; about two pieces in three start turned, and never none or all of them.
 */
export function startTurns(n: number, rand: () => number): number[] {
  for (;;) {
    const turns = Array.from({ length: n }, () => (rand() < 1 / 3 ? 0 : randInt(rand, 1, 3)));
    const turned = turns.filter(Boolean).length;
    if (turned >= Math.ceil(n / 2) && turned < n) return turns;
  }
}

/** Stars for a finished jigsaw: start at 3, lose one for using the picture hint, one for lots of misses. */
export function jigsawStars(usedHint: boolean, misses: number): 1 | 2 | 3 {
  const stars = 3 - (usedHint ? 1 : 0) - (misses > 5 ? 1 : 0);
  return Math.max(1, stars) as 1 | 2 | 3;
}

// Jigsaw geometry: piece outlines (with tabs and blanks), board slot lines and tray layout.
// Pure functions with no React or React Native imports, so they can be unit-tested with plain Node.

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

/**
 * Scatter all pieces over the tray in a loose grid, in a fixed shuffled order, each slightly turned.
 * Positions are piece centres relative to the tray's top-left corner.
 */
export function trayLayout(g: JigsawGrid, trayW: number, trayH: number): TraySpot[] {
  const n = g.cols * g.rows;
  const tcols = n <= 6 ? 3 : n <= 12 ? 4 : 5;
  const trows = Math.ceil(n / tcols);
  const m = pieceMargin(g);
  const cellW = trayW / tcols;
  const cellH = trayH / trows;
  const scale = Math.min(0.9, (cellW * 0.98) / (g.pw + 2 * m), (cellH * 0.98) / (g.ph + 2 * m));
  const ids = Array.from({ length: n }, (_, i) => i);
  const shuffled = ids.slice().sort((a, b) => ((a * 2654435761) >>> 0) % 997 - ((b * 2654435761) >>> 0) % 997);
  return shuffled.map((id, k) => {
    const i = k % tcols;
    const j = Math.floor(k / tcols);
    return {
      id,
      cx: cellW * (i + 0.5) + (((i * 7 + j * 3) % 5) - 2),
      cy: cellH * (j + 0.5) + (((i * 5 + j * 11) % 7) - 3),
      rot: (((i * 13 + j * 7) % 9) - 4) * 3,
      scale,
    };
  });
}

/** Stars for a finished jigsaw: start at 3, lose one for using the picture hint, one for lots of misses. */
export function jigsawStars(usedHint: boolean, misses: number): 1 | 2 | 3 {
  const stars = 3 - (usedHint ? 1 : 0) - (misses > 5 ? 1 : 0);
  return Math.max(1, stars) as 1 | 2 | 3;
}

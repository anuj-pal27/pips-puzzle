// Slide puzzle: a picture cut into n x n tiles with one gap. Tap a tile next to the gap to slide it in.
// A board lists which tile sits in each spot, row by row; BLANK marks the gap. Solved = 0, 1, 2, ... gap.
// Pure functions, no React: unit-tested in __tests__/run.ts.

export const BLANK = -1;

export function solvedBoard(n: number): number[] {
  return Array.from({ length: n * n }, (_, i) => (i === n * n - 1 ? BLANK : i));
}

export function isSolved(board: number[]): boolean {
  return board.every((t, i) => (i === board.length - 1 ? t === BLANK : t === i));
}

/** Spot indexes next to spot i (up, down, left, right). */
export function neighbours(n: number, i: number): number[] {
  const r = Math.floor(i / n);
  const c = i % n;
  const out: number[] = [];
  if (r > 0) out.push(i - n);
  if (r < n - 1) out.push(i + n);
  if (c > 0) out.push(i - 1);
  if (c < n - 1) out.push(i + 1);
  return out;
}

export const canSlide = (board: number[], n: number, spot: number) => neighbours(n, board.indexOf(BLANK)).includes(spot);

/** Slide the tile in `spot` into the gap. Returns the same board if it isn't next to the gap. */
export function slideTile(board: number[], n: number, spot: number): number[] {
  if (!canSlide(board, n, spot)) return board;
  const gap = board.indexOf(BLANK);
  const next = board.slice();
  next[gap] = board[spot];
  next[spot] = BLANK;
  return next;
}

/** Only half of all shuffles can be solved; this checks a board is one of them (odd n: even inversions). */
export function isSolvable(board: number[], n: number): boolean {
  const tiles = board.filter((t) => t !== BLANK);
  let inversions = 0;
  for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) if (tiles[i] > tiles[j]) inversions++;
  if (n % 2 === 1) return inversions % 2 === 0;
  const gapRowFromBottom = n - Math.floor(board.indexOf(BLANK) / n);
  return (inversions + gapRowFromBottom) % 2 === 1;
}

/** 3 stars within a few moves of the best possible, 2 within a generous margin, otherwise 1. */
export function slideStars(moves: number, par: number): 1 | 2 | 3 {
  const extra = moves - par;
  if (extra <= 10) return 3;
  if (extra <= 2 * par + 20) return 2;
  return 1;
}

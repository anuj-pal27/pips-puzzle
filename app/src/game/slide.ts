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

/** Distance of every tile from its home, in moves (a lower bound on the moves still needed). */
function manhattan(board: number[], n: number): number {
  let d = 0;
  board.forEach((t, i) => {
    if (t !== BLANK) d += Math.abs(Math.floor(t / n) - Math.floor(i / n)) + Math.abs((t % n) - (i % n));
  });
  return d;
}

/**
 * Fewest moves to solve `board` (A* search). Gives up and returns null after `limit` boards, so a
 * big puzzle can never freeze the phone; 3 x 3 boards finish in a few thousand.
 */
export function slidePar(board: number[], n: number, limit = 60_000): number | null {
  if (isSolved(board)) return 0;
  type Node = { b: number[]; g: number; f: number };
  // Binary min-heap on f, so even a big search stays quick.
  const heap: Node[] = [];
  const push = (x: Node) => {
    heap.push(x);
    for (let i = heap.length - 1; i > 0; ) {
      const p = (i - 1) >> 1;
      if (heap[p].f <= heap[i].f) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = (): Node => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ; ) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && heap[l].f < heap[m].f) m = l;
        if (r < heap.length && heap[r].f < heap[m].f) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  push({ b: board, g: 0, f: manhattan(board, n) });
  const best = new Map<string, number>([[board.join(','), 0]]);
  let seen = 0;
  while (heap.length) {
    const node = pop();
    if (node.g > (best.get(node.b.join(',')) ?? Infinity)) continue; // a shorter way here was found later
    if (++seen > limit) return null;
    const gap = node.b.indexOf(BLANK);
    for (const spot of neighbours(n, gap)) {
      const next = slideTile(node.b, n, spot);
      if (isSolved(next)) return node.g + 1;
      const key = next.join(',');
      const g = node.g + 1;
      if ((best.get(key) ?? Infinity) <= g) continue;
      best.set(key, g);
      push({ b: next, g, f: g + manhattan(next, n) });
    }
  }
  return null;
}

/**
 * A new starting board for one play: slide random tiles away from the solved picture, then measure
 * the best solution. Tries for a board about as hard as `par` (the puzzle's set difficulty).
 * Returns null if it can't measure one (very big boards); the game then uses the puzzle's own start.
 */
export function scrambleSlide(n: number, par: number, rand: () => number): { start: number[]; par: number } | null {
  const lo = Math.max(4, par - 2);
  const hi = par + 3;
  let fallback: { start: number[]; par: number } | null = null;
  // Bigger boards are slower to measure: fewer tries, and a smaller search each.
  const attempts = n <= 3 ? 30 : 4;
  const limit = n <= 3 ? 60_000 : 20_000;
  for (let attempt = 0; attempt < attempts; attempt++) {
    let board = solvedBoard(n);
    let previous = -1;
    const walk = lo + Math.floor(rand() * (hi + 8 - lo)); // random walks overshoot less than you'd think
    for (let step = 0; step < walk; step++) {
      const gap = board.indexOf(BLANK);
      const options = neighbours(n, gap).filter((s) => s !== previous); // never undo the last slide
      const spot = options[Math.floor(rand() * options.length)];
      board = slideTile(board, n, spot);
      previous = gap;
    }
    const best = slidePar(board, n, limit);
    if (best === null) return fallback;
    if (best >= lo && best <= hi) return { start: board, par: best };
    if (best > 0 && (!fallback || Math.abs(best - par) < Math.abs(fallback.par - par))) fallback = { start: board, par: best };
  }
  return fallback;
}

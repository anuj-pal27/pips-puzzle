// Snack Snap: a memory game. Flip two cards; matching snacks stay face up, others turn back over.
// Pure functions, no React: unit-tested in __tests__/run.ts.

export type MemoryState = {
  cards: string[]; // snack id on each card, in table order
  up: number[]; // cards turned face up right now that aren't matched yet (0, 1 or 2)
  matched: number[];
  mismatches: number;
};

// Re-exported for older imports; the helpers live in random.ts now. (The .ts extension lets the logic
// tests run these files in plain Node.)
export { seededRandom } from './random.ts';

/** Two cards of every snack, shuffled. A pair is never left lying side by side in the same row. */
export function deal(snacks: string[], rand: () => number, cols: number): string[] {
  for (let attempt = 0; attempt < 50; attempt++) {
    const cards = snacks.flatMap((s) => [s, s]);
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    const neighbours = cards.some((s, i) => i % cols < cols - 1 && cards[i + 1] === s);
    if (!neighbours) return cards;
  }
  // Practically never reached; any shuffle is still playable.
  return snacks.flatMap((s) => [s, s]);
}

export function newMemory(snacks: string[], rand: () => number, cols: number): MemoryState {
  return { cards: deal(snacks, rand, cols), up: [], matched: [], mismatches: 0 };
}

export const canFlip = (s: MemoryState, i: number) =>
  i >= 0 && i < s.cards.length && s.up.length < 2 && !s.up.includes(i) && !s.matched.includes(i);

/** Turn a card face up. When two are up, call `settle` (after a short look) to keep or hide them. */
export function flipCard(s: MemoryState, i: number): MemoryState {
  return canFlip(s, i) ? { ...s, up: [...s.up, i] } : s;
}

/** 'match' or 'miss' while two cards are face up; null otherwise. */
export function pairResult(s: MemoryState): 'match' | 'miss' | null {
  if (s.up.length < 2) return null;
  return s.cards[s.up[0]] === s.cards[s.up[1]] ? 'match' : 'miss';
}

export function settle(s: MemoryState): MemoryState {
  const result = pairResult(s);
  if (result === 'match') return { ...s, up: [], matched: [...s.matched, ...s.up] };
  if (result === 'miss') return { ...s, up: [], mismatches: s.mismatches + 1 };
  return s;
}

export const memoryDone = (s: MemoryState) => s.matched.length === s.cards.length;

/** 3 stars for at most one wrong guess per pair, 2 for at most two, otherwise 1. */
export function memoryStars(pairs: number, mismatches: number): 1 | 2 | 3 {
  if (mismatches <= pairs) return 3;
  if (mismatches <= 2 * pairs) return 2;
  return 1;
}

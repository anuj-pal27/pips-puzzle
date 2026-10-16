// Small random helpers shared by the games. Every function takes `rand` (like Math.random), so the
// tests can pass a seeded one and get the same "random" result every time.

/** Small seeded random generator, so tests (and replays, if wanted) can repeat a shuffle. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A new random seed for one play of a puzzle (kept in state, so the layout stays put while it's played). */
export const newSeed = () => Math.floor(Math.random() * 2 ** 32);

/** Whole number from min to max, both included. */
export const randInt = (rand: () => number, min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

/** A shuffled copy (Fisher-Yates). */
export function shuffled<T>(items: readonly T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

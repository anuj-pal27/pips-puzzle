import type { Puzzle } from './puzzles';

// A built-in puzzle in the shape the server stores and sends (backend/content: Puzzle, seed.json).
// `npm run seed` writes backend/content/seed.json with this, and the logic tests check it's up to date.

export function toSeed(p: Puzzle): Record<string, unknown> {
  const base = { slug: p.id, level: p.level, order: p.order, kind: p.kind, title: p.title, cheer: p.cheer, blurb: p.blurb, fact: p.fact };
  switch (p.kind) {
    case 'jigsaw':
      return { ...base, picture: p.picture, cols: p.cols, rows: p.rows, config: p.spin ? { spin: true } : {} };
    case 'slide':
      return { ...base, picture: p.picture, config: { size: p.size, start: p.start, par: p.par } };
    case 'shadow':
      return { ...base, config: { friends: p.friends, cols: p.cols } };
    case 'memory':
      return { ...base, config: { snacks: p.snacks, cols: p.cols } };
    case 'tracks': {
      const { map, taps, start, goal } = p.tracks;
      return { ...base, config: { map, taps, start, goal } };
    }
    case 'maze': {
      const { intro, goal, map, gates, monkeys } = p.maze;
      return { ...base, maze: { intro, ...(goal ? { goal } : {}), map, gates, monkeys } };
    }
    case 'rangoli': {
      const { style, rings, extra } = p.rangoli;
      return { ...base, config: { style, rings, ...(extra ? { extra } : {}) } };
    }
  }
}

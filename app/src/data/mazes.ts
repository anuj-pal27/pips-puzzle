import type { GateDef, MazeConfig } from '../game/maze';

// Gate styles: colour + a shape, so children who can't tell colours apart can still match lever and gate.
const YELLOW: Omit<GateDef, 'lever' | 'openWhen'> = {
  name: 'yellow',
  color: '#FFC93C',
  glyph: 'M1.5 6a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0z', // circle
};
const BLUE: Omit<GateDef, 'lever' | 'openWhen'> = { name: 'blue', color: '#4FA8F0', glyph: 'M2 2h8v8H2z' }; // square
const PURPLE: Omit<GateDef, 'lever' | 'openWhen'> = { name: 'purple', color: '#9B7BFF', glyph: 'M6 1.2L10.8 10.2H1.2z' }; // triangle
const GREEN: Omit<GateDef, 'lever' | 'openWhen'> = { name: 'green', color: '#3DBE7E', glyph: 'M6 0.8L11.2 6L6 11.2L0.8 6z' }; // diamond

export const MAZES: Record<'easy' | 'medium' | 'hard', MazeConfig> = {
  // 7 x 9: one lever and gate, one monkey, one cow
  easy: {
    id: 'easy',
    intro: 'Help Gappu find the jalebis!',
    map: [
      '##....J',
      '##.#.#.',
      'o..#o..',
      'RRARRRR',
      '......o',
      '.#####.',
      '.#a..C.',
      '.###.#.',
      'S......',
    ],
    gates: { A: { ...YELLOW, lever: 'a' } },
    monkeys: [{ axis: 'h', line: 4, min: 0, max: 5, start: 3, dir: 1 }],
  },

  // 8 x 10: two railways, two colour-matched levers, two monkeys
  medium: {
    id: 'medium',
    intro: "It's dark! Two gates this time. Find the yellow lever first.",
    map: [
      'o..#...J',
      '.#...#.#',
      'RRRBRRRR',
      'o.......',
      '.#.#.#..',
      '...#..#b',
      'RRARRRRR',
      '.....#Ca',
      '.#.#.#o.',
      'S..#....',
    ],
    gates: { A: { ...YELLOW, lever: 'a' }, B: { ...BLUE, lever: 'b' } },
    monkeys: [
      { axis: 'h', line: 3, min: 1, max: 7, start: 4, dir: 1 },
      { axis: 'v', line: 4, min: 7, max: 9, start: 8, dir: 1 },
    ],
  },

  // 9 x 11: a switch that opens purple and shuts green (and back), plus a yellow lever, two monkeys, two cows
  hard: {
    id: 'hard',
    intro: 'The switch opens one gate and shuts the other. Think first!',
    map: [
      'o..#..C.J',
      '.#.......',
      'RRRRRRARR',
      '...#.#.#.',
      '##.#.....',
      'a..#.#.#C',
      '..o#.....',
      'RYRRRRRXR',
      '...#.#...',
      '.#.#x#.#.',
      'S.......o',
    ],
    gates: {
      A: { ...YELLOW, lever: 'a' },
      X: { ...PURPLE, openWhen: true },
      Y: { ...GREEN, openWhen: false },
    },
    monkeys: [
      { axis: 'h', line: 4, min: 4, max: 8, start: 6, dir: 1 },
      { axis: 'v', line: 6, min: 8, max: 10, start: 9, dir: 1 },
    ],
  },
};

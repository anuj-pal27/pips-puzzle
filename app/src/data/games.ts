import type { TrackConfig } from '../game/tracks';

// Settings for the puzzle kinds that aren't jigsaws or mazes. Plain data (no images), so the logic tests
// and the backend seed file can read it too. Pictures for these ids live in src/data/art.ts.

export type FriendId = 'gappu' | 'mithu' | 'tillu' | 'chunnu' | 'gauri' | 'pip';
export type SnackId = 'jalebi' | 'laddoo' | 'samosa' | 'chai' | 'kulfi' | 'mango' | 'kajukatli' | 'gulabjamun' | 'barfi';

export const FRIEND_NAMES: Record<FriendId, string> = {
  gappu: 'Gappu',
  mithu: 'Mithu',
  tillu: 'Tillu',
  chunnu: 'Chunnu',
  gauri: 'Gauri',
  pip: 'Pip',
};

export const SNACK_NAMES: Record<SnackId, string> = {
  jalebi: 'Jalebi',
  laddoo: 'Laddoo',
  samosa: 'Samosa',
  chai: 'Chai',
  kulfi: 'Kulfi',
  mango: 'Mango',
  kajukatli: 'Kaju katli',
  gulabjamun: 'Gulab jamun',
  barfi: 'Barfi',
};

// Who's That Shadow?  Medium mixes in look-alikes: Gappu the goat and Gauri the cow.
export type ShadowGame = { id: string; friends: FriendId[]; cols: number };
export const SHADOW_GAMES: Record<'easy' | 'medium', ShadowGame> = {
  easy: { id: 'easy', friends: ['mithu', 'tillu', 'pip'], cols: 3 },
  medium: { id: 'medium', friends: ['gappu', 'chunnu', 'gauri', 'mithu', 'tillu'], cols: 3 },
};

// Snack Snap (memory). Medium is Mithai Snap: Diwali sweets.
export type SnapGame = { id: string; snacks: SnackId[]; cols: number };
export const SNAP_GAMES: Record<'easy' | 'medium' | 'hard', SnapGame> = {
  easy: { id: 'easy', snacks: ['jalebi', 'laddoo', 'samosa'], cols: 3 },
  medium: { id: 'medium', snacks: ['laddoo', 'jalebi', 'kajukatli', 'gulabjamun'], cols: 4 },
  hard: { id: 'hard', snacks: ['jalebi', 'laddoo', 'samosa', 'chai', 'kulfi', 'mango'], cols: 4 },
};

// Fix the Tracks. See src/game/tracks.ts for the map legend.
export const TRACK_GAMES: Record<'medium' | 'hard', TrackConfig> = {
  // 5 x 5, one winding line, no decoys
  medium: {
    id: 'medium',
    start: 1,
    goal: 3,
    map: [
      'T|HFT',
      'Ha-cP',
      'FTbdH',
      'PHacT',
      'TFT|F',
    ],
    taps: [
      '01000',
      '01120',
      '00310',
      '00210',
      '00010',
    ],
  },
  // 6 x 6, a longer line plus decoy pieces that lead nowhere
  hard: {
    id: 'hard',
    start: 0,
    goal: 5,
    map: [
      '|Tb-cH',
      'a-dP||',
      '|b-bdd',
      'T-c|-F',
      'aH|a-c',
      'F-dTH|',
    ],
    taps: [
      '102110',
      '112011',
      '121121',
      '002110',
      '301211',
      '012001',
    ],
  },
};

// Slide puzzle: 3 x 3, start position chosen so the best solution is `par` moves (checked by the tests).
export type SlideGame = { id: string; picture: string; size: number; start: number[]; par: number };
export const SLIDE_GAMES: Record<'hard', SlideGame> = {
  hard: { id: 'hard', picture: 'tillu', size: 3, start: [4, 3, 1, 0, 7, 2, -1, 6, 5], par: 10 },
};

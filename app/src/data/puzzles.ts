import type { ImageSourcePropType } from 'react-native';

import type { MazeConfig } from '@/game/maze';
import type { TrackConfig } from '@/game/tracks';
import { colors } from '@/theme';
import { SHADOW_GAMES, SLIDE_GAMES, SNAP_GAMES, TRACK_GAMES, type FriendId, type SnackId } from './games';
import { MAZES } from './mazes';

// The puzzles built into the app. The game plays the list from the Django server when it can
// (src/state/catalog.tsx); these are what it plays before that, or with no server at all.
// The server's seed file (backend/content/seed.json) mirrors them, checked by the logic tests.

export type TierId = 'easy' | 'medium' | 'hard';

export type Tier = { id: TierId; name: string; color: string; tagline: string };

export const TIERS: Tier[] = [
  { id: 'easy', name: 'Easy', color: colors.tierEasy, tagline: 'Start here' },
  { id: 'medium', name: 'Medium', color: colors.tierMedium, tagline: 'A bit trickier' },
  { id: 'hard', name: 'Hard', color: colors.tierHard, tagline: 'For puzzle pros' },
];

export type Picture = {
  id: string;
  title: string;
  image: ImageSourcePropType; // bundled, or { uri } for a picture uploaded on the server
  width: number; // the picture's shape (only the ratio matters)
  height: number;
};

export const PICTURES: Record<string, Picture> = {
  gappu: { id: 'gappu', title: 'Gappu the Goat', image: require('@/assets/images/game/gappu.png'), width: 330, height: 220 },
  mithu: { id: 'mithu', title: 'Mithu the Parrot', image: require('@/assets/images/game/mithu.png'), width: 330, height: 220 },
  tillu: { id: 'tillu', title: 'Tillu the Tortoise', image: require('@/assets/images/game/tillu.png'), width: 330, height: 220 },
  chunnu: { id: 'chunnu', title: 'Chunnu the Monkey', image: require('@/assets/images/game/chunnu.png'), width: 330, height: 220 },
  shop: { id: 'shop', title: "Gappu's Jalebi Shop", image: require('@/assets/images/game/shop.png'), width: 328, height: 246 },
  station: { id: 'station', title: 'All Aboard at Jalebi Junction', image: require('@/assets/images/game/station.png'), width: 330, height: 264 },
};

type Base = {
  id: string;
  tier: TierId;
  order: number;
  title: string; // name card after finishing, and the map's label
  cheer: string; // big headline on the finish screen
  blurb: string;
};

// Every puzzle carries its own settings, so one sent by the server needs nothing else from the app.
export type JigsawPuzzle = Base & { kind: 'jigsaw'; picture: string; cols: number; rows: number; spin?: boolean };
export type MazePuzzle = Base & { kind: 'maze'; maze: MazeConfig };
export type ShadowPuzzle = Base & { kind: 'shadow'; friends: FriendId[]; cols: number };
export type MemoryPuzzle = Base & { kind: 'memory'; snacks: SnackId[]; cols: number };
export type TracksPuzzle = Base & { kind: 'tracks'; tracks: TrackConfig };
export type SlidePuzzle = Base & { kind: 'slide'; picture: string; size: number; start: number[]; par: number };

export type Puzzle = JigsawPuzzle | MazePuzzle | ShadowPuzzle | MemoryPuzzle | TracksPuzzle | SlidePuzzle;
export type PuzzleKind = Puzzle['kind'];

/** Short name of each kind of puzzle, shown as a chip on the map. */
export const KIND_LABEL: Record<PuzzleKind, string> = {
  jigsaw: 'Jigsaw',
  maze: 'Maze',
  shadow: 'Shadows',
  memory: 'Snap',
  tracks: 'Tracks',
  slide: 'Slide',
};

const MAZE_TEXT = { title: 'Jalebi Hunt', cheer: 'Yum!', blurb: 'Gappu found the jalebis!' };
const shadow = (g: keyof typeof SHADOW_GAMES) => ({ kind: 'shadow', friends: SHADOW_GAMES[g].friends, cols: SHADOW_GAMES[g].cols }) as const;
const snap = (g: keyof typeof SNAP_GAMES) => ({ kind: 'memory', snacks: SNAP_GAMES[g].snacks, cols: SNAP_GAMES[g].cols }) as const;
const tracks = (g: keyof typeof TRACK_GAMES) => ({ kind: 'tracks', tracks: TRACK_GAMES[g] }) as const;
const maze = (g: keyof typeof MAZES) => ({ kind: 'maze', maze: MAZES[g], ...MAZE_TEXT }) as const;
const { picture: slidePicture, size, start, par } = SLIDE_GAMES.hard;

// No two puzzles in a row play the same way, and every tier gets harder in a new way.
export const PUZZLES: Puzzle[] = [
  { id: 'easy-1', tier: 'easy', order: 1, kind: 'jigsaw', picture: 'gappu', cols: 3, rows: 2, title: 'Gappu the Goat', cheer: 'You made Gappu!', blurb: 'Always hungry, always grinning.' },
  { id: 'easy-2', tier: 'easy', order: 2, ...shadow('easy'), title: "Who's That Shadow?", cheer: 'Found them all!', blurb: 'Mithu, Tillu and Pip came out of the shadows.' },
  { id: 'easy-3', tier: 'easy', order: 3, ...snap('easy'), title: 'Snack Snap', cheer: 'Snack Snap!', blurb: 'Three pairs of snacks. Gappu says yum!' },
  { id: 'easy-4', tier: 'easy', order: 4, kind: 'jigsaw', picture: 'chunnu', cols: 3, rows: 2, title: 'Chunnu the Monkey', cheer: 'You made Chunnu!', blurb: 'The cheekiest monkey in town.' },
  { id: 'easy-5', tier: 'easy', order: 5, ...maze('easy') },

  { id: 'medium-1', tier: 'medium', order: 1, kind: 'jigsaw', picture: 'shop', cols: 4, rows: 3, title: "Gappu's Jalebi Shop", cheer: 'You did it!', blurb: 'Watch out, Chunnu is sneaking a jalebi!' },
  { id: 'medium-2', tier: 'medium', order: 2, ...tracks('medium'), title: 'Fix the Tracks', cheer: 'Choo choo!', blurb: 'The jalebi train made it to the stall.' },
  { id: 'medium-3', tier: 'medium', order: 3, ...shadow('medium'), title: "Who's That Shadow?", cheer: 'Super spotting!', blurb: 'Gappu and Gauri look alike in the dark!' },
  { id: 'medium-4', tier: 'medium', order: 4, ...snap('medium'), title: 'Snack Snap', cheer: 'Snack Snap!', blurb: 'Four pairs found. Time for chai!' },
  { id: 'medium-5', tier: 'medium', order: 5, ...maze('medium') },

  { id: 'hard-1', tier: 'hard', order: 1, kind: 'jigsaw', picture: 'station', cols: 5, rows: 4, spin: true, title: 'All Aboard at Jalebi Junction', cheer: 'All aboard!', blurb: 'Twenty pieces, all the right way up!' },
  { id: 'hard-2', tier: 'hard', order: 2, kind: 'slide', picture: slidePicture, size, start, par, title: "Tillu's Slide Puzzle", cheer: 'You fixed Tillu!', blurb: 'Slow and steady, just like Tillu.' },
  { id: 'hard-3', tier: 'hard', order: 3, ...tracks('hard'), title: 'Fix the Tracks', cheer: 'Choo choo!', blurb: 'You found the one line that works!' },
  { id: 'hard-4', tier: 'hard', order: 4, ...snap('hard'), title: 'Snack Snap', cheer: 'Snack feast!', blurb: 'Six pairs! Nobody remembers snacks like you.' },
  { id: 'hard-5', tier: 'hard', order: 5, ...maze('hard') },
];

export const getTier = (id: TierId) => TIERS.find((t) => t.id === id)!;

import type { ImageSourcePropType } from 'react-native';

import { colors } from '@/theme';
import type { SHADOW_GAMES, SLIDE_GAMES, SNAP_GAMES, TRACK_GAMES } from './games';

// Every puzzle in the game. The Django backend's seed file mirrors these ids and settings
// (backend/content/seed.json), so progress can be synced puzzle by puzzle.

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
  image: ImageSourcePropType;
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

export type JigsawPuzzle = Base & { kind: 'jigsaw'; picture: string; cols: number; rows: number; spin?: boolean };
export type MazePuzzle = Base & { kind: 'maze'; maze: TierId };
export type ShadowPuzzle = Base & { kind: 'shadow'; game: keyof typeof SHADOW_GAMES };
export type MemoryPuzzle = Base & { kind: 'memory'; game: keyof typeof SNAP_GAMES };
export type TracksPuzzle = Base & { kind: 'tracks'; game: keyof typeof TRACK_GAMES };
export type SlidePuzzle = Base & { kind: 'slide'; game: keyof typeof SLIDE_GAMES; picture: string };

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

// No two puzzles in a row play the same way, and every tier gets harder in a new way.
export const PUZZLES: Puzzle[] = [
  { id: 'easy-1', tier: 'easy', order: 1, kind: 'jigsaw', picture: 'gappu', cols: 3, rows: 2, title: 'Gappu the Goat', cheer: 'You made Gappu!', blurb: 'Always hungry, always grinning.' },
  { id: 'easy-2', tier: 'easy', order: 2, kind: 'shadow', game: 'easy', title: "Who's That Shadow?", cheer: 'Found them all!', blurb: 'Mithu, Tillu and Pip came out of the shadows.' },
  { id: 'easy-3', tier: 'easy', order: 3, kind: 'memory', game: 'easy', title: 'Snack Snap', cheer: 'Snack Snap!', blurb: 'Three pairs of snacks. Gappu says yum!' },
  { id: 'easy-4', tier: 'easy', order: 4, kind: 'jigsaw', picture: 'chunnu', cols: 3, rows: 2, title: 'Chunnu the Monkey', cheer: 'You made Chunnu!', blurb: 'The cheekiest monkey in town.' },
  { id: 'easy-5', tier: 'easy', order: 5, kind: 'maze', maze: 'easy', ...MAZE_TEXT },

  { id: 'medium-1', tier: 'medium', order: 1, kind: 'jigsaw', picture: 'shop', cols: 4, rows: 3, title: "Gappu's Jalebi Shop", cheer: 'You did it!', blurb: 'Watch out, Chunnu is sneaking a jalebi!' },
  { id: 'medium-2', tier: 'medium', order: 2, kind: 'tracks', game: 'medium', title: 'Fix the Tracks', cheer: 'Choo choo!', blurb: 'The jalebi train made it to the stall.' },
  { id: 'medium-3', tier: 'medium', order: 3, kind: 'shadow', game: 'medium', title: "Who's That Shadow?", cheer: 'Super spotting!', blurb: 'Gappu and Gauri look alike in the dark!' },
  { id: 'medium-4', tier: 'medium', order: 4, kind: 'memory', game: 'medium', title: 'Snack Snap', cheer: 'Snack Snap!', blurb: 'Four pairs found. Time for chai!' },
  { id: 'medium-5', tier: 'medium', order: 5, kind: 'maze', maze: 'medium', ...MAZE_TEXT },

  { id: 'hard-1', tier: 'hard', order: 1, kind: 'jigsaw', picture: 'station', cols: 5, rows: 4, spin: true, title: 'All Aboard at Jalebi Junction', cheer: 'All aboard!', blurb: 'Twenty pieces, all the right way up!' },
  { id: 'hard-2', tier: 'hard', order: 2, kind: 'slide', game: 'hard', picture: 'tillu', title: "Tillu's Slide Puzzle", cheer: 'You fixed Tillu!', blurb: 'Slow and steady, just like Tillu.' },
  { id: 'hard-3', tier: 'hard', order: 3, kind: 'tracks', game: 'hard', title: 'Fix the Tracks', cheer: 'Choo choo!', blurb: 'You found the one line that works!' },
  { id: 'hard-4', tier: 'hard', order: 4, kind: 'memory', game: 'hard', title: 'Snack Snap', cheer: 'Snack feast!', blurb: 'Six pairs! Nobody remembers snacks like you.' },
  { id: 'hard-5', tier: 'hard', order: 5, kind: 'maze', maze: 'hard', ...MAZE_TEXT },
];

export const getPuzzle = (id: string) => PUZZLES.find((p) => p.id === id);
export const getTier = (id: TierId) => TIERS.find((t) => t.id === id)!;
export const puzzlesInTier = (tier: TierId) => PUZZLES.filter((p) => p.tier === tier).sort((a, b) => a.order - b.order);

/** A tier is open once every puzzle in the tier before it has at least one star. */
export function isTierUnlocked(tier: TierId, stars: Record<string, number>): boolean {
  const index = TIERS.findIndex((t) => t.id === tier);
  if (index <= 0) return true;
  return puzzlesInTier(TIERS[index - 1].id).every((p) => (stars[p.id] ?? 0) > 0);
}

/** The first unplayed puzzle in an open tier: highlighted on the map as "play this next". */
export function nextPuzzle(stars: Record<string, number>): Puzzle | undefined {
  return PUZZLES.find((p) => isTierUnlocked(p.tier, stars) && !stars[p.id]);
}

/** Where "Next" goes after finishing a puzzle: the next puzzle in order, if its tier is open. */
export function puzzleAfter(id: string, stars: Record<string, number>): Puzzle | undefined {
  const i = PUZZLES.findIndex((p) => p.id === id);
  const next = PUZZLES[i + 1];
  return next && isTierUnlocked(next.tier, stars) ? next : undefined;
}

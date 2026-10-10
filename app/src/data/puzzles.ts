import type { ImageSourcePropType } from 'react-native';

import { colors } from '@/theme';

// Every picture and puzzle in the game. The Django backend's seed command mirrors these ids
// (backend/content/seed.json), so progress can be synced puzzle by puzzle.

export type TierId = 'easy' | 'medium' | 'hard';

export type Tier = { id: TierId; name: string; color: string; pieces: number; cols: number; rows: number };

export const TIERS: Tier[] = [
  { id: 'easy', name: 'Easy', color: colors.tierEasy, pieces: 6, cols: 3, rows: 2 },
  { id: 'medium', name: 'Medium', color: colors.tierMedium, pieces: 12, cols: 4, rows: 3 },
  { id: 'hard', name: 'Hard', color: colors.tierHard, pieces: 20, cols: 5, rows: 4 },
];

export type Picture = {
  id: string;
  title: string; // shown on the name card after finishing
  cheer: string; // big headline on the finish screen
  blurb: string;
  image: ImageSourcePropType;
  width: number; // the picture's shape (only the ratio matters)
  height: number;
};

export const PICTURES: Record<string, Picture> = {
  gappu: { id: 'gappu', cheer: "You made Gappu!", title: 'Gappu the Goat', blurb: 'Always hungry, always grinning.', image: require('@/assets/images/game/gappu.png'), width: 330, height: 220 },
  mithu: { id: 'mithu', cheer: "You made Mithu!", title: 'Mithu the Parrot', blurb: 'Talks all day. Sings all night.', image: require('@/assets/images/game/mithu.png'), width: 330, height: 220 },
  tillu: { id: 'tillu', cheer: "You made Tillu!", title: 'Tillu the Tortoise', blurb: 'Slow, steady and super wise.', image: require('@/assets/images/game/tillu.png'), width: 330, height: 220 },
  chunnu: { id: 'chunnu', cheer: "You made Chunnu!", title: 'Chunnu the Monkey', blurb: 'The cheekiest monkey in town.', image: require('@/assets/images/game/chunnu.png'), width: 330, height: 220 },
  shop: { id: 'shop', cheer: "You did it!", title: "Gappu's Jalebi Shop", blurb: 'Watch out, Chunnu is sneaking a jalebi!', image: require('@/assets/images/game/shop.png'), width: 328, height: 246 },
  station: { id: 'station', cheer: "All aboard!", title: 'All Aboard at Jalebi Junction', blurb: 'The whole gang is off on a trip!', image: require('@/assets/images/game/station.png'), width: 330, height: 264 },
};

export type Puzzle =
  | { id: string; tier: TierId; order: number; kind: 'jigsaw'; picture: string }
  | { id: string; tier: TierId; order: number; kind: 'maze'; maze: TierId };

// Each tier: four character jigsaws, then a Jalebi Hunt maze.
// TODO(art): Medium 2-4 and Hard 2-4 reuse Easy pictures until new scenes are drawn.
export const PUZZLES: Puzzle[] = [
  { id: 'easy-1', tier: 'easy', order: 1, kind: 'jigsaw', picture: 'gappu' },
  { id: 'easy-2', tier: 'easy', order: 2, kind: 'jigsaw', picture: 'mithu' },
  { id: 'easy-3', tier: 'easy', order: 3, kind: 'jigsaw', picture: 'tillu' },
  { id: 'easy-4', tier: 'easy', order: 4, kind: 'jigsaw', picture: 'chunnu' },
  { id: 'easy-5', tier: 'easy', order: 5, kind: 'maze', maze: 'easy' },
  { id: 'medium-1', tier: 'medium', order: 1, kind: 'jigsaw', picture: 'shop' },
  { id: 'medium-2', tier: 'medium', order: 2, kind: 'jigsaw', picture: 'tillu' },
  { id: 'medium-3', tier: 'medium', order: 3, kind: 'jigsaw', picture: 'chunnu' },
  { id: 'medium-4', tier: 'medium', order: 4, kind: 'jigsaw', picture: 'mithu' },
  { id: 'medium-5', tier: 'medium', order: 5, kind: 'maze', maze: 'medium' },
  { id: 'hard-1', tier: 'hard', order: 1, kind: 'jigsaw', picture: 'station' },
  { id: 'hard-2', tier: 'hard', order: 2, kind: 'jigsaw', picture: 'shop' },
  { id: 'hard-3', tier: 'hard', order: 3, kind: 'jigsaw', picture: 'gappu' },
  { id: 'hard-4', tier: 'hard', order: 4, kind: 'jigsaw', picture: 'chunnu' },
  { id: 'hard-5', tier: 'hard', order: 5, kind: 'maze', maze: 'hard' },
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

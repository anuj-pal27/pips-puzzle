import { router } from 'expo-router';

import type { Puzzle } from '@/data/puzzles';
import { useProgress } from '@/state/progress';

/** The screen that plays each kind of puzzle. */
export function puzzleHref(p: Puzzle) {
  switch (p.kind) {
    case 'jigsaw':
      return { pathname: '/puzzle/[id]', params: { id: p.id } } as const;
    case 'maze':
      return { pathname: '/maze/[id]', params: { id: p.id } } as const;
    case 'shadow':
      return { pathname: '/shadow/[id]', params: { id: p.id } } as const;
    case 'memory':
      return { pathname: '/memory/[id]', params: { id: p.id } } as const;
    case 'tracks':
      return { pathname: '/tracks/[id]', params: { id: p.id } } as const;
    case 'slide':
      return { pathname: '/slide/[id]', params: { id: p.id } } as const;
    case 'rangoli':
      return { pathname: '/rangoli/[id]', params: { id: p.id } } as const;
  }
}

/** Remembered in progress.celebrated once a level's story card has been shown. */
export const storyKey = (level: number) => `story-${level}`;

/**
 * Open a puzzle from the map (push), or swap the current game for another (replace). With `story`, the
 * level's story card comes first, and its "Let's go!" button opens the puzzle.
 */
export function openPuzzle(p: Puzzle, how: 'push' | 'replace' = 'push', story = false) {
  const href = story ? ({ pathname: '/story/[level]', params: { level: String(p.level), then: p.id } } as const) : puzzleHref(p);
  if (how === 'push') router.push(href);
  else router.replace(href);
}

/** openPuzzle, showing the level's story card first the first time a child plays in that level. */
export function useOpenPuzzle() {
  const { celebrated } = useProgress();
  return (p: Puzzle, how: 'push' | 'replace' = 'push') => openPuzzle(p, how, !celebrated.includes(storyKey(p.level)));
}

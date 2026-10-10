import { router } from 'expo-router';

import type { Puzzle } from '@/data/puzzles';

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
  }
}

/** Open a puzzle from the map (push), or swap the current game for another (replace). */
export function openPuzzle(p: Puzzle, how: 'push' | 'replace' = 'push') {
  if (how === 'push') router.push(puzzleHref(p));
  else router.replace(puzzleHref(p));
}

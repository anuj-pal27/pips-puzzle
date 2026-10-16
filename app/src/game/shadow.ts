// Who's That Shadow?: drag each friend onto their shadow. Pure helpers, no React.

import { shuffled } from './random.ts';

/**
 * Friends wait in the tray in a new mixed-up order every play: nobody starts in the tray spot below
 * their own shadow. Extra friends (decoys with no shadow) go anywhere.
 */
export function trayOrder<T>(friends: T[], rand: () => number, decoys: T[] = []): T[] {
  const all = [...friends, ...decoys];
  if (friends.length < 2) return shuffled(all, rand);
  for (;;) {
    const order = shuffled(all, rand);
    if (friends.every((f, i) => order[i] !== f)) return order;
  }
}

/** From level 3: one extra friend who has no shadow on the wall, to make the child look carefully. */
export function pickDecoy<T>(friends: T[], everyone: T[], rand: () => number): T | undefined {
  const others = everyone.filter((f) => !friends.includes(f));
  return others.length ? others[Math.floor(rand() * others.length)] : undefined;
}

/** Index of the slot whose centre is closest to (x, y) within `radius`, or -1. */
export function nearestSlot(slots: { x: number; y: number }[], x: number, y: number, radius: number): number {
  let best = -1;
  let bestD = radius;
  slots.forEach((s, i) => {
    const d = Math.hypot(s.x - x, s.y - y);
    if (d <= bestD) {
      best = i;
      bestD = d;
    }
  });
  return best;
}

/** 3 stars for at most one wrong try, 2 for at most three, otherwise 1. */
export function shadowStars(misses: number): 1 | 2 | 3 {
  if (misses <= 1) return 3;
  if (misses <= 3) return 2;
  return 1;
}

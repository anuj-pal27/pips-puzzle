// Who's That Shadow?: drag each friend onto their shadow. Pure helpers, no React.

/** Friends wait in the tray in a mixed-up order: nobody starts right below their own shadow. */
export function trayOrder<T>(items: T[]): T[] {
  if (items.length < 2) return items.slice();
  const shift = items.length >= 4 ? 2 : 1;
  return [...items.slice(shift), ...items.slice(0, shift)];
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

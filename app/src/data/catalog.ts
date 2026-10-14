import type { RemotePuzzle } from '../api/client';
import type { GateDef, MazeConfig, MonkeyLane } from '../game/maze';
import type { TrackConfig } from '../game/tracks';
import type { FriendId, SnackId } from './games';
import type { Picture, Puzzle, PuzzleKind, TierId } from './puzzles';

// The puzzle list the game plays: the one sent by the Django server (backend/content), or the
// built-in one in src/data/puzzles.ts when there is no server. Pure functions with type-only
// imports, so the logic tests (src/game/__tests__/run.ts) can run them in plain Node.

export const TIER_ORDER: TierId[] = ['easy', 'medium', 'hard'];

/** A tier opens once this many puzzles in the tier before it have a star (or all of them, if it has fewer). */
export const UNLOCK_AFTER = 5;

export function inPlayOrder(list: Puzzle[]): Puzzle[] {
  return [...list].sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier) || a.order - b.order);
}

export const puzzlesInTier = (list: Puzzle[], tier: TierId) => inPlayOrder(list.filter((p) => p.tier === tier));

/** How many puzzles of the tier before need a star to open `tier`. */
export function unlockNeed(list: Puzzle[], tier: TierId): number {
  const index = TIER_ORDER.indexOf(tier);
  return index <= 0 ? 0 : Math.min(UNLOCK_AFTER, puzzlesInTier(list, TIER_ORDER[index - 1]).length);
}

export function isTierUnlocked(list: Puzzle[], tier: TierId, stars: Record<string, number>): boolean {
  const index = TIER_ORDER.indexOf(tier);
  if (index <= 0) return true;
  const done = puzzlesInTier(list, TIER_ORDER[index - 1]).filter((p) => (stars[p.id] ?? 0) > 0).length;
  return done >= unlockNeed(list, tier);
}

/** The first unplayed puzzle in an open tier: highlighted on the map as "play this next". */
export function nextPuzzle(list: Puzzle[], stars: Record<string, number>): Puzzle | undefined {
  return inPlayOrder(list).find((p) => isTierUnlocked(list, p.tier, stars) && !stars[p.id]);
}

/** Where "Next" goes after finishing a puzzle: the next puzzle in order, if its tier is open. */
export function puzzleAfter(list: Puzzle[], id: string, stars: Record<string, number>): Puzzle | undefined {
  const ordered = inPlayOrder(list);
  const next = ordered[ordered.findIndex((p) => p.id === id) + 1];
  return next && isTierUnlocked(list, next.tier, stars) ? next : undefined;
}

// ---------------------------------------------------------------- reading the server's list

/** Ids of the things bundled in the app, so a puzzle that names something the app doesn't have is skipped. */
export type KnownIds = { pictures: string[]; friends: string[]; snacks: string[] };

export type ServerCatalog = {
  puzzles: Puzzle[];
  /** Pictures uploaded on the server (jigsaws and slide puzzles), by picture id. */
  pictures: Record<string, Picture>;
  /** The server entries that made it in, as received: what gets saved on the phone. */
  kept: RemotePuzzle[];
  /** Slugs that were skipped, and why. */
  skipped: { slug: string; reason: string }[];
};

const CHEER: Record<PuzzleKind, string> = {
  jigsaw: 'You did it!',
  maze: 'Yum!',
  shadow: 'Found them all!',
  memory: 'Snack Snap!',
  tracks: 'Choo choo!',
  slide: 'You did it!',
};

class Skip extends Error {}
const need = (ok: unknown, reason: string): void => {
  if (!ok) throw new Skip(reason);
};

const isInt = (v: unknown, min: number, max: number): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isRect = (rows: unknown): rows is string[] =>
  Array.isArray(rows) && rows.length > 0 && rows.every((r) => typeof r === 'string' && r.length > 0 && r.length === rows[0].length);

function idList<T extends string>(value: unknown, known: string[], what: string): T[] {
  need(Array.isArray(value) && value.length >= 2, `needs at least two ${what}`);
  const items = value as unknown[];
  need(new Set(items).size === items.length, `${what} must all be different`);
  const unknown = items.filter((v) => typeof v !== 'string' || !known.includes(v));
  need(unknown.length === 0, `unknown ${what}: ${unknown.join(', ')}`);
  return items as T[];
}

/** An uploaded image if there is one (it wins), otherwise a picture bundled in the app. */
function pictureFor(item: RemotePuzzle, known: KnownIds, pictures: Record<string, Picture>): string {
  if (item.image && item.image_width && item.image_height) {
    const id = `upload:${item.slug}`;
    pictures[id] = { id, title: item.title, image: { uri: item.image }, width: item.image_width, height: item.image_height };
    return id;
  }
  need(known.pictures.includes(item.picture), `unknown picture "${item.picture}"`);
  return item.picture;
}

function readMaze(slug: string, value: unknown): MazeConfig {
  need(isObject(value), 'has no maze');
  const m = value as Record<string, unknown>;
  need(isRect(m.map), 'maze map must be equal-length rows');
  const joined = (m.map as string[]).join('');
  need(joined.split('S').length === 2 && joined.split('J').length === 2, 'maze needs one start S and one jalebi stall J');
  const gates = (m.gates ?? {}) as Record<string, GateDef>;
  need(
    isObject(gates) && Object.values(gates).every((g) => isObject(g) && typeof g.name === 'string' && typeof g.color === 'string' && typeof g.glyph === 'string'),
    'every gate needs a name, color and glyph',
  );
  const monkeys = (m.monkeys ?? []) as MonkeyLane[];
  need(
    Array.isArray(monkeys) && monkeys.every((k) => isObject(k) && (k.axis === 'h' || k.axis === 'v') && [k.line, k.min, k.max, k.start].every(Number.isInteger)),
    'every monkey needs axis, line, min, max and start',
  );
  return {
    id: slug,
    intro: typeof m.intro === 'string' && m.intro ? m.intro : 'Help Gappu find the jalebis!',
    map: m.map as string[],
    gates,
    monkeys: monkeys.map((k) => ({ ...k, dir: k.dir === -1 ? -1 : 1 })),
  };
}

function readTracks(slug: string, c: Record<string, unknown>): TrackConfig {
  need(isRect(c.map), 'tracks map must be equal-length rows');
  const map = c.map as string[];
  const taps = c.taps;
  need(
    Array.isArray(taps) && taps.length === map.length && taps.every((r, i) => typeof r === 'string' && r.length === map[i].length && /^[0-3]+$/.test(r)),
    "'taps' needs one digit 0-3 for every tile in 'map'",
  );
  need(/^[|\-abcd.THPF]+$/.test(map.join('')), 'tracks map uses | - a b c d and . T H P F');
  const width = map[0].length;
  need(isInt(c.start, 0, width - 1) && isInt(c.goal, 0, width - 1), "'start' and 'goal' must be columns on the map");
  return { id: slug, map, taps: taps as string[], start: c.start as number, goal: c.goal as number };
}

function readOne(item: RemotePuzzle, known: KnownIds, pictures: Record<string, Picture>): Puzzle {
  need(typeof item.slug === 'string' && item.slug.length > 0, 'has no slug');
  need(TIER_ORDER.includes(item.tier), `unknown tier "${item.tier}"`);
  need(isInt(item.order, 1, 999), 'order must be a whole number');
  need(item.kind in CHEER, `unknown kind "${item.kind}" (a newer app is needed)`);
  const c = isObject(item.config) ? item.config : {};
  const base = {
    id: item.slug,
    tier: item.tier,
    order: item.order,
    title: typeof item.title === 'string' ? item.title : '',
    cheer: item.cheer || CHEER[item.kind],
    blurb: item.blurb || '',
  };

  switch (item.kind) {
    case 'jigsaw': {
      need(isInt(item.cols, 2, 6) && isInt(item.rows, 2, 5), 'a jigsaw has 2-6 columns and 2-5 rows');
      return { ...base, kind: 'jigsaw', picture: pictureFor(item, known, pictures), cols: item.cols!, rows: item.rows!, spin: c.spin === true };
    }
    case 'slide': {
      const size = c.size;
      need(isInt(size, 2, 5), "'size' must be 2 to 5");
      const n = size as number;
      const start = c.start;
      need(
        Array.isArray(start) && start.length === n * n && [...start].sort((a, b) => a - b).every((v, i) => v === i - 1),
        "'start' must list every tile once, with -1 for the gap",
      );
      need(isInt(c.par, 1, 999), "'par' must be the fewest moves that solve it");
      return { ...base, kind: 'slide', picture: pictureFor(item, known, pictures), size: n, start: start as number[], par: c.par as number };
    }
    case 'shadow': {
      const friends = idList<FriendId>(c.friends, known.friends, 'friends');
      return { ...base, kind: 'shadow', friends, cols: isInt(c.cols, 1, 4) ? c.cols : 3 };
    }
    case 'memory': {
      const snacks = idList<SnackId>(c.snacks, known.snacks, 'snacks');
      return { ...base, kind: 'memory', snacks, cols: isInt(c.cols, 2, 4) ? c.cols : snacks.length <= 3 ? 3 : 4 };
    }
    case 'tracks':
      return { ...base, kind: 'tracks', tracks: readTracks(item.slug, c) };
    case 'maze':
      return { ...base, kind: 'maze', maze: readMaze(item.slug, item.maze) };
  }
}

/**
 * Turn the server's list into puzzles the game can play. Anything this app can't play safely (an
 * unknown kind, a picture it doesn't have, broken settings) is skipped rather than crashing the game.
 */
export function readServerPuzzles(items: unknown, known: KnownIds): ServerCatalog {
  const out: ServerCatalog = { puzzles: [], pictures: {}, kept: [], skipped: [] };
  if (!Array.isArray(items)) return out;
  const seen = new Set<string>();
  for (const raw of items as RemotePuzzle[]) {
    const slug = isObject(raw) && typeof raw.slug === 'string' ? raw.slug : '?';
    try {
      need(isObject(raw), 'is not a puzzle');
      need(!seen.has(slug), 'appears twice');
      const pictures: Record<string, Picture> = {};
      const puzzle = readOne(raw, known, pictures);
      seen.add(slug);
      out.puzzles.push(puzzle);
      Object.assign(out.pictures, pictures);
      out.kept.push(raw);
    } catch (e) {
      if (!(e instanceof Skip)) throw e;
      out.skipped.push({ slug, reason: e.message });
    }
  }
  out.puzzles = inPlayOrder(out.puzzles);
  return out;
}

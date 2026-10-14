import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Image } from 'react-native';

import { fetchPuzzles } from '@/api/client';
import * as list from '@/data/catalog';
import { FRIEND_NAMES, SNACK_NAMES } from '@/data/games';
import { PICTURES, PUZZLES, type Picture, type Puzzle, type TierId } from '@/data/puzzles';

// Which puzzles the game plays. It starts with the last list the server sent (saved on the phone),
// or the built-in one, then asks the server for a fresh list when the app opens or comes back to the
// front. Without a server nothing changes: the game just keeps what it has.

export type CatalogSource = 'built-in' | 'saved' | 'server';

type Catalog = { puzzles: Puzzle[]; pictures: Record<string, Picture>; source: CatalogSource };

type CatalogApi = {
  source: CatalogSource;
  puzzles: Puzzle[];
  getPuzzle: (id: string) => Puzzle | undefined;
  getPicture: (id: string) => Picture;
  puzzlesInTier: (tier: TierId) => Puzzle[];
  unlockNeed: (tier: TierId) => number;
  isTierUnlocked: (tier: TierId, stars: Record<string, number>) => boolean;
  nextPuzzle: (stars: Record<string, number>) => Puzzle | undefined;
  puzzleAfter: (id: string, stars: Record<string, number>) => Puzzle | undefined;
  /** Ask the server for its list now. Resolves to false if it couldn't be reached. */
  refresh: () => Promise<boolean>;
};

const STORAGE_KEY = 'pips-puzzles/catalog';
const PICTURE_TIMEOUT_MS = 20000;
type Saved = { version: 1; items: unknown[] };

const KNOWN: list.KnownIds = { pictures: Object.keys(PICTURES), friends: Object.keys(FRIEND_NAMES), snacks: Object.keys(SNACK_NAMES) };
const BUILT_IN: Catalog = { puzzles: PUZZLES, pictures: PICTURES, source: 'built-in' };

type Read = Catalog & { kept: unknown[]; uploads: Picture[] };

function fromItems(items: unknown, source: CatalogSource): Read | null {
  const read = list.readServerPuzzles(items, KNOWN);
  if (read.skipped.length) console.warn('Puzzles skipped from the server:', read.skipped);
  // An empty list is more likely a mistake on the server than "no puzzles at all": keep what we have.
  if (!read.puzzles.length) return null;
  return { puzzles: read.puzzles, pictures: { ...PICTURES, ...read.pictures }, source, kept: read.kept, uploads: Object.values(read.pictures) };
}

/**
 * Download uploaded pictures now, while online, so they show up later without a connection.
 * A puzzle whose picture won't download is left out rather than shown as blank pieces.
 */
async function withPictures(c: Read): Promise<Read | null> {
  const failed = new Set<string>();
  await Promise.all(
    c.uploads.map(async (p) => {
      const uri = (p.image as { uri: string }).uri;
      // Resolves true on phones and with nothing on web; an error, false or no answer in time means it failed.
      const download = Image.prefetch(uri).then((r) => r !== false, () => false);
      const ok = await Promise.race([download, new Promise<boolean>((done) => setTimeout(done, PICTURE_TIMEOUT_MS, false))]);
      if (!ok) failed.add(p.id);
    }),
  );
  if (!failed.size) return c;
  console.warn('Puzzles skipped because their picture would not download:', [...failed]);
  const ok = (p: Puzzle) => !((p.kind === 'jigsaw' || p.kind === 'slide') && failed.has(p.picture));
  const puzzles = c.puzzles.filter(ok);
  const keptIds = new Set(puzzles.map((p) => p.id));
  const kept = c.kept.filter((item) => keptIds.has((item as { slug: string }).slug));
  return puzzles.length ? { ...c, puzzles, kept } : null;
}

const CatalogContext = createContext<CatalogApi | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>(BUILT_IN);
  const [ready, setReady] = useState(false);
  const inFlight = useRef<Promise<boolean> | null>(null);

  const refresh = useCallback(() => {
    inFlight.current ??= (async () => {
      try {
        const read = fromItems(await fetchPuzzles(), 'server');
        const next = read && (await withPictures(read));
        if (next) {
          setCatalog(next);
          const saved: Saved = { version: 1, items: next.kept };
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved)).catch(() => {});
        }
        return true;
      } catch {
        return false; // offline, or no server set up: keep playing what we have
      } finally {
        inFlight.current = null;
      }
    })();
    return inFlight.current;
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<Saved>;
        const next = fromItems(saved.items, 'saved');
        if (next) setCatalog(next);
      })
      .catch(() => {
        // Unreadable save: the built-in puzzles still work.
      })
      .finally(() => {
        setReady(true);
        refresh();
      });

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const { puzzles, pictures, source } = catalog;
  const api: CatalogApi = {
    source,
    puzzles,
    getPuzzle: (id) => puzzles.find((p) => p.id === id),
    getPicture: (id) => pictures[id] ?? PICTURES.gappu,
    puzzlesInTier: (tier) => list.puzzlesInTier(puzzles, tier),
    unlockNeed: (tier) => list.unlockNeed(puzzles, tier),
    isTierUnlocked: (tier, stars) => list.isTierUnlocked(puzzles, tier, stars),
    nextPuzzle: (stars) => list.nextPuzzle(puzzles, stars),
    puzzleAfter: (id, stars) => list.puzzleAfter(puzzles, id, stars),
    refresh,
  };

  // Wait for the saved list (a few milliseconds), so the map doesn't flash the built-in puzzles first.
  if (!ready) return null;
  return <CatalogContext.Provider value={api}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogApi {
  const api = useContext(CatalogContext);
  if (!api) throw new Error('useCatalog must be used inside <CatalogProvider>');
  return api;
}

/**
 * The puzzle a game screen is playing. Kept as it was when the screen opened, so a new list arriving
 * from the server mid-game can't change the rules under the player's fingers.
 */
export function usePuzzle(id: string | undefined): Puzzle | undefined {
  const { getPuzzle } = useCatalog();
  const [held, setHeld] = useState(() => ({ id, puzzle: id ? getPuzzle(id) : undefined }));
  if (held.id !== id) {
    const next = { id, puzzle: id ? getPuzzle(id) : undefined };
    setHeld(next);
    return next.puzzle;
  }
  return held.puzzle;
}

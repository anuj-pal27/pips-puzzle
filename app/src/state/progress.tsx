import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// Everything the game remembers, saved on the phone (no account, works offline).

export type Settings = {
  sound: boolean;
  music: boolean;
  pictureHint: boolean; // show the light-bulb button in jigsaws
};

type Saved = { version: 1; stars: Record<string, number>; settings: Settings };

const STORAGE_KEY = 'pips-puzzles/progress';
const DEFAULTS: Saved = { version: 1, stars: {}, settings: { sound: true, music: true, pictureHint: true } };

type ProgressApi = {
  ready: boolean;
  stars: Record<string, number>;
  totalStars: number;
  settings: Settings;
  /** Keeps the best result: replaying a puzzle never lowers its stars. */
  recordStars: (puzzleId: string, stars: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetProgress: () => void;
};

const ProgressContext = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<Saved>;
        setSaved({ ...DEFAULTS, ...parsed, settings: { ...DEFAULTS.settings, ...parsed.settings } });
      })
      .catch(() => {
        // Corrupt or unreadable save: start fresh rather than crash.
      })
      .finally(() => setReady(true));
  }, []);

  const save = (next: Saved) => {
    setSaved(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  };

  const api: ProgressApi = {
    ready,
    stars: saved.stars,
    totalStars: Object.values(saved.stars).reduce((a, b) => a + b, 0),
    settings: saved.settings,
    recordStars: (puzzleId, stars) => {
      const best = Math.max(saved.stars[puzzleId] ?? 0, stars);
      save({ ...saved, stars: { ...saved.stars, [puzzleId]: best } });
    },
    updateSettings: (patch) => save({ ...saved, settings: { ...saved.settings, ...patch } }),
    resetProgress: () => save({ ...saved, stars: {} }),
  };

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressApi {
  const api = useContext(ProgressContext);
  if (!api) throw new Error('useProgress must be used inside <ProgressProvider>');
  return api;
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { setMusicOn, setSoundOn } from '@/audio/sound';

import { playFinished, setPlayStatsEnabled } from './playStats';

// Everything the game remembers, saved on the phone (no account, works offline).

export type Settings = {
  sound: boolean;
  music: boolean;
  pictureHint: boolean; // show the light-bulb button in jigsaws
  shareStats: boolean; // send anonymous play stats to the game server (src/state/playStats.ts)
};

/** `lab`: stars from Learn with Bit, kept apart from the puzzle stars (they don't count on the puzzle map). */
/** `celebrated`: chapters whose finale (e.g. Diwali fireworks) has played, so it only plays once. */
type Saved = { version: 1; stars: Record<string, number>; lab: Record<string, number>; celebrated: string[]; settings: Settings };

const STORAGE_KEY = 'pips-puzzles/progress';
const DEFAULTS: Saved = { version: 1, stars: {}, lab: {}, celebrated: [], settings: { sound: true, music: true, pictureHint: true, shareStats: true } };

type ProgressApi = {
  ready: boolean;
  stars: Record<string, number>;
  totalStars: number;
  settings: Settings;
  /** Keeps the best result: replaying a puzzle never lowers its stars. */
  recordStars: (puzzleId: string, stars: number) => void;
  labStars: Record<string, number>;
  /** Same for a Learn with Bit lesson. */
  recordLab: (lessonId: string, stars: number) => void;
  celebrated: string[];
  markCelebrated: (chapter: string) => void;
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
        setSaved({ ...DEFAULTS, ...parsed, lab: { ...parsed.lab }, celebrated: parsed.celebrated ?? [], settings: { ...DEFAULTS.settings, ...parsed.settings } });
      })
      .catch(() => {
        // Corrupt or unreadable save: start fresh rather than crash.
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    setPlayStatsEnabled(saved.settings.shareStats);
  }, [saved.settings.shareStats]);

  // Grown-ups' switches. Wait for the saved settings, so music never starts for a moment when it's off.
  useEffect(() => {
    setSoundOn(saved.settings.sound);
    setMusicOn(ready && saved.settings.music);
  }, [ready, saved.settings.sound, saved.settings.music]);

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
      playFinished(puzzleId, stars);
      const best = Math.max(saved.stars[puzzleId] ?? 0, stars);
      save({ ...saved, stars: { ...saved.stars, [puzzleId]: best } });
    },
    labStars: saved.lab,
    recordLab: (lessonId, stars) => {
      playFinished(lessonId, stars);
      const best = Math.max(saved.lab[lessonId] ?? 0, stars);
      save({ ...saved, lab: { ...saved.lab, [lessonId]: best } });
    },
    celebrated: saved.celebrated,
    markCelebrated: (chapter) => {
      if (!saved.celebrated.includes(chapter)) save({ ...saved, celebrated: [...saved.celebrated, chapter] });
    },
    updateSettings: (patch) => save({ ...saved, settings: { ...saved.settings, ...patch } }),
    resetProgress: () => save({ ...saved, stars: {}, lab: {}, celebrated: [] }),
  };

  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressApi {
  const api = useContext(ProgressContext);
  if (!api) throw new Error('useProgress must be used inside <ProgressProvider>');
  return api;
}

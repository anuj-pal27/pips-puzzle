import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { setMusicOn, setSoundOn, setVoiceOn } from '@/audio/sound';
import type { HelpLanguage } from '@/data/howTo';

import { playFinished, setPlayStatsEnabled } from './playStats';

// Everything the game remembers, saved on the phone (no account, works offline).

export type Settings = {
  muted: boolean; // the speaker button on the home screen: silences everything, leaving the switches below as they are
  sound: boolean;
  music: boolean;
  voice: boolean; // the narrator reads each stop's story in its own language, and says how to play each game
  helpLanguage: HelpLanguage; // the language each game's "how to play" line is spoken in
  pictureHint: boolean; // show the light-bulb button in jigsaws
  shareStats: boolean; // send anonymous play stats to the game server (src/state/playStats.ts)
};

/** `lab`: stars from Learn with Bit, kept apart from the puzzle stars (they don't count on the puzzle map). */
/**
 * `celebrated`: one-time moments that have been shown, so they only show once: a level's story card
 * ('story-3') and a level's finale ('level-3'; 'diwali' for the last level, as before the levels).
 */
type Saved = { version: 1; stars: Record<string, number>; lab: Record<string, number>; celebrated: string[]; settings: Settings };

const STORAGE_KEY = 'pips-puzzles/progress';
const DEFAULTS: Saved = { version: 1, stars: {}, lab: {}, celebrated: [], settings: { muted: false, sound: true, music: true, voice: true, helpLanguage: 'en', pictureHint: true, shareStats: true } };

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
  markCelebrated: (key: string) => void;
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
        const settings = { ...DEFAULTS.settings, ...parsed.settings };
        // Up to 1.5.0 the speaker button only switched the effects off: a phone saved that way meant "quiet".
        if (parsed.settings && parsed.settings.muted === undefined && parsed.settings.sound === false) Object.assign(settings, { muted: true, sound: true });
        setSaved({ ...DEFAULTS, ...parsed, lab: { ...parsed.lab }, celebrated: parsed.celebrated ?? [], settings });
      })
      .catch(() => {
        // Corrupt or unreadable save: start fresh rather than crash.
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    setPlayStatsEnabled(saved.settings.shareStats);
  }, [saved.settings.shareStats]);

  // The speaker button and the grown-ups' switches. Wait for the saved settings, so music never starts for a moment when it's off.
  useEffect(() => {
    const on = !saved.settings.muted;
    setSoundOn(on && saved.settings.sound);
    setMusicOn(ready && on && saved.settings.music);
    setVoiceOn(ready && on && saved.settings.voice);
  }, [ready, saved.settings.muted, saved.settings.sound, saved.settings.music, saved.settings.voice]);

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
    markCelebrated: (key) => {
      if (!saved.celebrated.includes(key)) save({ ...saved, celebrated: [...saved.celebrated, key] });
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { sendPlayEvents, type PlayEvent } from '@/api/client';

// Anonymous play stats for the grown-ups' dashboard on the server (backend/dashboard): which puzzles
// get started, finished (with stars and time) or left unfinished. No names and no account: the phone
// gets a random id the first time, and that's all that identifies it. Grown-ups can switch it off in
// Settings. Events wait on the phone while it's offline and are sent later.

const QUEUE_KEY = 'pips-puzzles/play-events';
const DEVICE_KEY = 'pips-puzzles/device';
const MAX_QUEUE = 500; // a phone offline for weeks keeps the newest ones
const BATCH = 100;

let enabled = true;
let queue: PlayEvent[] = [];
let loaded: Promise<void> | null = null;
let device: string | null = null;
let sending = false;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const openSince = new Map<string, number>(); // puzzle id -> when it was opened

function uuid(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function load() {
  loaded ??= (async () => {
    try {
      const [savedQueue, savedDevice] = await Promise.all([AsyncStorage.getItem(QUEUE_KEY), AsyncStorage.getItem(DEVICE_KEY)]);
      queue = savedQueue ? (JSON.parse(savedQueue) as PlayEvent[]) : [];
      device = savedDevice;
    } catch {
      // Unreadable: start a fresh queue.
    }
    if (!device) {
      device = uuid();
      AsyncStorage.setItem(DEVICE_KEY, device).catch(() => {});
    }
  })();
  return loaded;
}

function save() {
  AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)).catch(() => {});
}

function record(event: Omit<PlayEvent, 'id' | 'at'>) {
  if (!enabled) return;
  const stamped = { ...event, id: uuid(), at: new Date().toISOString() };
  // After the saved queue is loaded, so saving never overwrites events from last time.
  load().then(() => {
    queue = [...queue, stamped].slice(-MAX_QUEUE);
    save();
    // Send a little later, so a start and a quick finish go together.
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flushPlayStats, 3000);
  });
}

/** Send what's waiting. Quietly keeps it for next time if the server can't be reached. */
export async function flushPlayStats() {
  if (!enabled || sending) return;
  await load();
  if (!queue.length || !device) return;
  sending = true;
  try {
    while (queue.length) {
      const batch = queue.slice(0, BATCH);
      await sendPlayEvents({
        device,
        platform: Platform.OS,
        app_version: Constants.expoConfig?.version ?? '',
        events: batch,
      });
      const sent = new Set(batch.map((e) => e.id));
      queue = queue.filter((e) => !sent.has(e.id));
      save();
    }
  } catch {
    // Offline or no server: try again next time.
  } finally {
    sending = false;
  }
}

/** Grown-ups' switch. Turning it off also throws away anything not sent yet. */
export function setPlayStatsEnabled(on: boolean) {
  enabled = on;
  if (!on) {
    queue = [];
    openSince.clear();
    AsyncStorage.removeItem(QUEUE_KEY).catch(() => {});
  }
}

const seconds = (since: number | undefined) => (since ? Math.round((Date.now() - since) / 1000) : undefined);

/** A puzzle was finished (called with the stars it earned). */
export function playFinished(puzzleId: string, stars: number) {
  record({ type: 'finish', puzzle: puzzleId, stars, seconds: seconds(openSince.get(puzzleId)) });
  openSince.delete(puzzleId);
}

/**
 * Use in every game screen: records "started" when it opens, and "left unfinished" if the child
 * leaves before finishing.
 */
export function usePlayStats(puzzleId: string) {
  useEffect(() => {
    openSince.set(puzzleId, Date.now());
    record({ type: 'start', puzzle: puzzleId });
    return () => {
      if (openSince.has(puzzleId)) {
        record({ type: 'quit', puzzle: puzzleId, seconds: seconds(openSince.get(puzzleId)) });
        openSince.delete(puzzleId);
      }
    };
  }, [puzzleId]);
}

// Send whatever is waiting when the app opens and whenever it comes back to the front.
load().then(flushPlayStats);
AppState.addEventListener('change', (state) => {
  if (state === 'active') flushPlayStats();
});

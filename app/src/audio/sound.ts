import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

// Sound effects and background music. All of it is made in scripts/make-sounds.py (no samples).
// Grown-ups' Sound and Music switches turn each part off (src/state/progress.tsx calls setSoundOn / setMusicOn).
// Any audio problem is ignored: the game always works silently.

const SOUNDS = {
  tap: require('@/assets/sounds/tap.wav'),
  pick: require('@/assets/sounds/pick.wav'),
  snap: require('@/assets/sounds/snap.wav'),
  miss: require('@/assets/sounds/miss.wav'),
  flip: require('@/assets/sounds/flip.wav'),
  match: require('@/assets/sounds/match.wav'),
  click: require('@/assets/sounds/click.wav'),
  train: require('@/assets/sounds/train.wav'),
  step: require('@/assets/sounds/step.wav'),
  bump: require('@/assets/sounds/bump.wav'),
  collect: require('@/assets/sounds/collect.wav'),
  slide: require('@/assets/sounds/slide.wav'),
  star1: require('@/assets/sounds/star1.wav'),
  star2: require('@/assets/sounds/star2.wav'),
  star3: require('@/assets/sounds/star3.wav'),
  cheer: require('@/assets/sounds/cheer.wav'),
  drop: require('@/assets/sounds/drop.wav'),
  bitThink: require('@/assets/sounds/bit-think.wav'),
  bitYes: require('@/assets/sounds/bit-yes.wav'),
  bitOops: require('@/assets/sounds/bit-oops.wav'),
  light: require('@/assets/sounds/light.wav'),
  firework: require('@/assets/sounds/firework.wav'),
} as const;

const MUSIC = {
  town: require('@/assets/sounds/music-town.m4a'),
  lab: require('@/assets/sounds/music-lab.m4a'),
  diwali: require('@/assets/sounds/music-diwali.m4a'),
} as const;

/** The tunes aren't equally loud; this evens them out. */
const MUSIC_LEVEL: Record<keyof typeof MUSIC, number> = { town: 1, lab: 0.6, diwali: 1 };

export type SoundName = keyof typeof SOUNDS;
export type MusicName = keyof typeof MUSIC;

const MUSIC_VOLUME = 0.3;
const COPIES = 3; // so quick repeats (footsteps, clicks) can overlap instead of cutting each other off

let soundOn = true;
let musicOn = true;
let active = AppState.currentState === 'active';
let wanted: MusicName | null = null;
let music: AudioPlayer | null = null;
let musicLoaded: MusicName | null = null;
const players = new Map<SoundName, { list: AudioPlayer[]; next: number }>();
let modeSet = false;
let webUnlocked = Platform.OS !== 'web'; // browsers block music until the first tap

function setMode() {
  if (modeSet) return;
  modeSet = true;
  // Respect the phone's silent switch, and never keep playing in the background.
  setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
}

/** Play a short effect (does nothing when grown-ups turned sound off). */
export function playSound(name: SoundName, volume = 1) {
  if (!soundOn) return;
  try {
    setMode();
    let slot = players.get(name);
    if (!slot) {
      slot = { list: Array.from({ length: COPIES }, () => createAudioPlayer(SOUNDS[name])), next: 0 };
      players.set(name, slot);
    }
    const player = slot.list[slot.next];
    slot.next = (slot.next + 1) % COPIES;
    player.volume = volume;
    void player.seekTo(0);
    player.play();
    // Browsers only allow music after the first tap: this tap starts it.
    if (!webUnlocked && wanted && musicOn && active && music) {
      webUnlocked = true;
      music.play();
    }
  } catch {
    // No sound this time.
  }
}

/** The three stars on the finish screen pop with rising notes. */
export const starSound = (i: number) => playSound((['star1', 'star2', 'star3'] as const)[Math.min(2, Math.max(0, i))]);

function updateMusic() {
  try {
    const shouldPlay = musicOn && active && wanted !== null;
    if (!shouldPlay) {
      music?.pause();
      return;
    }
    setMode();
    if (!music) {
      music = createAudioPlayer(MUSIC[wanted!]);
      musicLoaded = wanted;
    } else if (musicLoaded !== wanted) {
      music.replace(MUSIC[wanted!]);
      musicLoaded = wanted;
    }
    music.loop = true;
    music.volume = MUSIC_VOLUME * MUSIC_LEVEL[wanted!];
    music.play();
  } catch {
    // Music is a nice extra; carry on without it.
  }
}

export function setSoundOn(on: boolean) {
  soundOn = on;
}

export function setMusicOn(on: boolean) {
  musicOn = on;
  updateMusic();
}

/** Play this background tune while the calling screen is shown (the newest caller wins). */
export function useMusic(name: MusicName) {
  useEffect(() => {
    const previous = wanted;
    wanted = name;
    updateMusic();
    return () => {
      wanted = previous;
      updateMusic();
    };
  }, [name]);
}

AppState.addEventListener('change', (state) => {
  active = state === 'active';
  updateMusic();
});

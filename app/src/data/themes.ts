import type { MusicName } from '@/audio/sound';
import { colors } from '@/theme';
import type { TierId } from './puzzles';

// Each tier can be its own chapter with its own look. Medium is "Diwali Night": the same friends
// getting the town ready for Diwali, at night. Easy and Hard keep the daytime town.

export type Theme = {
  id: 'town' | 'diwali';
  chapter: string | null; // shown on the map, e.g. "Diwali Night"
  dark: boolean; // light text on a dark background
  bg: string; // screen background
  text: string; // text straight on the background (titles)
  textSoft: string;
  tray: string; // jigsaw tray, shadow tray, picnic mat
  music: MusicName;
};

export const TOWN: Theme = {
  id: 'town',
  chapter: null,
  dark: false,
  bg: colors.sand,
  text: colors.ink,
  textSoft: colors.inkSoft,
  tray: colors.sandDark,
  music: 'town',
};

export const DIWALI: Theme = {
  id: 'diwali',
  chapter: 'Diwali Night',
  dark: true,
  bg: '#1B2155',
  text: '#FFF3D6',
  textSoft: '#C9CFF2',
  tray: '#2B3373',
  music: 'diwali',
};

export const themeFor = (tier: TierId): Theme => (tier === 'medium' ? DIWALI : TOWN);

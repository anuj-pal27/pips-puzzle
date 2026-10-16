// Design tokens for Pip's Puzzles — the same colours and type used in the design canvas.

export const colors = {
  ink: '#1E2A4F', // all text and outlines
  inkSoft: '#4A5A7F', // secondary text
  inkBrown: '#6B4E1F', // text on locked (sandy) cards
  white: '#FFFFFF',

  sky: '#6CCFF6', // home screen
  skyShadow: '#3BAAD8',
  sand: '#FFE7C2', // town screens (map, puzzles, maze)
  sandShadow: '#E3B26A',
  sandDark: '#F7CF8F', // jigsaw tray
  road: '#F6DDB0', // maze roads
  lockedCard: '#FBEBD0',
  lockedTile: '#F3DDB8',

  sun: '#FFC93C', // primary buttons, stars
  sunShadow: '#E09E00',
  coral: '#FF7A59',
  coralShadow: '#D9573A',
  grass: '#7ED957',
  grassShadow: '#4FAE30',
  green: '#2FA36B',
  danger: '#C93D24',
  navyScrim: 'rgba(30, 42, 79, 0.62)',

} as const;

// Font family names come from the @expo-google-fonts packages loaded in src/app/_layout.tsx.
export const fonts = {
  display: 'LilitaOne_400Regular', // big chunky titles and buttons
  regular: 'Baloo2_500Medium',
  semibold: 'Baloo2_600SemiBold',
  bold: 'Baloo2_700Bold',
  extrabold: 'Baloo2_800ExtraBold',
} as const;

/** Learn with Bit's robot lab: mint and teal, so it feels like its own place. */
export const LAB = {
  bg: '#E6F7F3',
  card: '#FFFFFF',
  line: '#BFE7DF',
  teal: '#3CCFB4',
  tealShadow: '#1F8F7C',
  tealDark: '#0B5446',
  locked: '#CFE9E3',
} as const;

/** The chunky "pressable toy" edge under buttons and cards. */
export function chunkyShadow(color: string, depth = 5) {
  return { boxShadow: `0px ${depth}px 0px ${color}` } as const;
}

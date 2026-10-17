// The opening story, before the trip starts: why Pip sets off (ROUTE.md). It plays once, the first time a child
// opens the puzzles, and any time from the home screen (src/app/opening.tsx). The narrator reads each page in
// Hindi (OPENING_VOICE in voice.ts). Pip is never "he" or "she".

/** What the page's picture shows. */
export type OpeningScene = 'station' | 'wonder' | 'map' | 'friends' | 'train';

export const OPENING: { scene: OpeningScene; text: string }[] = [
  { scene: 'station', text: "At the very top of India, in the snowy mountains, is a little station: Pip's home." },
  { scene: 'wonder', text: '"Every puzzle piece belongs to a big picture," said Pip. "But where is mine?"' },
  { scene: 'map', text: 'Gappu showed Pip an old map of the world. "Your big picture is out there!"' },
  { scene: 'friends', text: '"Let\'s meet a friend in every place!" said Pip. "We\'re coming too!" said everyone.' },
  { scene: 'train', text: 'Gappu packed a basket of jalebis, and the Jalebi Express went choo choo!' },
];

/** Remembered in progress.celebrated once the opening story has been shown. */
export const OPENING_KEY = 'opening';

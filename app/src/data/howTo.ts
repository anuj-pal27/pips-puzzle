import type { Puzzle } from './puzzles';
import { isGentle, themeFor } from './levels.ts';

// What each game says when it opens: one short line, spoken, so a child who can't read yet knows what to do.
// The English line is also the game's first tip on screen. Each line is spoken in English or Hindi, whichever
// grown-ups pick (Grown-ups > Spoken help); `npm run voice` makes the audio (src/data/voice.ts).
// Plain data, so the logic tests and the voice script can read it.

export type HowToId =
  | 'jigsaw'
  | 'jigsaw-spin'
  | 'shadow'
  | 'shadow-decoy'
  | 'snap-peek'
  | 'snap'
  | 'tracks'
  | 'slide'
  | 'maze'
  | 'maze-levers'
  | 'maze-switch'
  | 'maze-dark'
  | 'rangoli';

export type HelpLanguage = 'en' | 'hi';

export const HOW_TO: Record<HowToId, Record<HelpLanguage, string>> = {
  jigsaw: {
    en: 'Drag each piece to its place in the picture!',
    hi: 'हर टुकड़े को खींचकर तस्वीर में उसकी जगह पर रखो!',
  },
  'jigsaw-spin': {
    en: 'Some pieces are turned round. Tap a piece to spin it!',
    hi: 'कुछ टुकड़े उल्टे हैं। टुकड़े को छूकर घुमाओ, फिर उसे सही जगह पर रखो!',
  },
  shadow: {
    en: 'Drag each friend onto their shadow!',
    hi: 'हर दोस्त को खींचकर उसकी परछाईं पर रखो!',
  },
  'shadow-decoy': {
    en: 'Drag each friend onto their shadow. One friend has no shadow!',
    hi: 'हर दोस्त को उसकी परछाईं पर रखो। एक दोस्त की परछाईं नहीं है!',
  },
  'snap-peek': {
    en: 'Look! Remember where the snacks are…',
    hi: 'ध्यान से देखो, और याद रखो कि कौन-सा नाश्ता कहाँ है!',
  },
  snap: {
    en: 'Find two of the same snack!',
    hi: 'दो पत्ते पलटो, और एक जैसे दो नाश्ते ढूँढो!',
  },
  tracks: {
    en: 'Tap the tracks to turn them. Start next to the station!',
    hi: 'पटरियों को छूकर घुमाओ। स्टेशन के पास से शुरू करो!',
  },
  slide: {
    en: 'Tap a tile next to the gap to slide it in.',
    hi: 'खाली जगह के पास वाले टुकड़े को छुओ, वह खिसककर अंदर आ जाएगा।',
  },
  maze: {
    en: 'Help Gappu find the way! Step on the lever to open the gate.',
    hi: 'गप्पू को रास्ता ढूँढने में मदद करो! लीवर पर चलो, तो फाटक खुल जाएगा।',
  },
  'maze-levers': {
    en: 'Help Gappu find the way! Step on the levers to open the gates.',
    hi: 'गप्पू को रास्ता ढूँढने में मदद करो! लीवरों पर चलो, तो फाटक खुल जाएँगे।',
  },
  'maze-switch': {
    en: 'The switch opens one gate and shuts the other. Think first!',
    hi: 'स्विच से एक फाटक खुलता है और दूसरा बंद हो जाता है। पहले सोचो!',
  },
  'maze-dark': {
    en: "It's dark! Step by step, help Gappu find the way.",
    hi: 'अँधेरा है! एक-एक कदम चलकर गप्पू को रास्ता दिखाओ।',
  },
  rangoli: {
    en: 'Pick a colour, then tap the pattern to make it like the picture!',
    hi: 'एक रंग चुनो, फिर डिज़ाइन को छूकर उसे तस्वीर जैसा बनाओ!',
  },
};

/** Which line a puzzle's game opens with. */
export function howToFor(p: Puzzle): HowToId {
  switch (p.kind) {
    case 'jigsaw':
      return p.spin ? 'jigsaw-spin' : 'jigsaw';
    case 'shadow':
      return isGentle(p.level) ? 'shadow' : 'shadow-decoy';
    case 'memory':
      return isGentle(p.level) ? 'snap-peek' : 'snap';
    case 'tracks':
      return 'tracks';
    case 'slide':
      return 'slide';
    case 'rangoli':
      return 'rangoli';
    case 'maze': {
      if (themeFor(p.level).id === 'diwali') return 'maze-dark';
      const gates = Object.values(p.maze.gates);
      if (gates.some((g) => g.openWhen !== undefined)) return 'maze-switch';
      return gates.filter((g) => g.lever).length > 1 ? 'maze-levers' : 'maze';
    }
  }
}

/** The voice clip for a line, in the language grown-ups picked. */
export const howToClip = (id: HowToId, lang: HelpLanguage) => `help-${id}-${lang}` as const;

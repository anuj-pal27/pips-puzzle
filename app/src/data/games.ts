import type { RangoliConfig } from '../game/rangoli';
import type { TrackConfig } from '../game/tracks';

// The friends, snacks and gifts the game knows, and the boards some puzzles are built on. Plain data
// (no images), so the logic tests, the seed export and the backend's checks can read it too.
// Pictures for these ids live in src/data/art.ts.

/** The six friends from Jalebi Junction, then one new friend for each stop on the journey (STORY.md). */
export type FriendId =
  | 'gappu'
  | 'mithu'
  | 'tillu'
  | 'chunnu'
  | 'gauri'
  | 'pip'
  | 'bholu'
  | 'kesar'
  | 'raja'
  | 'chikki'
  | 'appu'
  | 'mayil'
  | 'bagha'
  | 'momo';

export type SnackId =
  | 'jalebi'
  | 'laddoo'
  | 'samosa'
  | 'chai'
  | 'kulfi'
  | 'mango'
  | 'kajukatli'
  | 'gulabjamun'
  | 'barfi'
  | 'lassi'
  | 'makkiroti'
  | 'ghevar'
  | 'dalbaati'
  | 'dhokla'
  | 'fafda'
  | 'vadapav'
  | 'modak'
  | 'appam'
  | 'coconut'
  | 'idli'
  | 'dosa'
  | 'rasgulla'
  | 'mishtidoi'
  | 'momos';

/** Gifts friends bring to the Mela. Mazes can hide one of these (or a snack) for Gappu to find. */
export type GiftId = 'dhol' | 'puppet' | 'kite' | 'modak' | 'flowers' | 'sugarcane' | 'rasgulla' | 'momos';

export const FRIEND_NAMES: Record<FriendId, string> = {
  gappu: 'Gappu',
  mithu: 'Mithu',
  tillu: 'Tillu',
  chunnu: 'Chunnu',
  gauri: 'Gauri',
  pip: 'Pip',
  bholu: 'Bholu',
  kesar: 'Kesar',
  raja: 'Raja',
  chikki: 'Chikki',
  appu: 'Appu',
  mayil: 'Mayil',
  bagha: 'Bagha',
  momo: 'Momo',
};

export const SNACK_NAMES: Record<SnackId, string> = {
  jalebi: 'Jalebi',
  laddoo: 'Laddoo',
  samosa: 'Samosa',
  chai: 'Chai',
  kulfi: 'Kulfi',
  mango: 'Mango',
  kajukatli: 'Kaju katli',
  gulabjamun: 'Gulab jamun',
  barfi: 'Barfi',
  lassi: 'Lassi',
  makkiroti: 'Makki di roti',
  ghevar: 'Ghevar',
  dalbaati: 'Dal baati',
  dhokla: 'Dhokla',
  fafda: 'Fafda',
  vadapav: 'Vada pav',
  modak: 'Modak',
  appam: 'Appam',
  coconut: 'Coconut',
  idli: 'Idli',
  dosa: 'Dosa',
  rasgulla: 'Rasgulla',
  mishtidoi: 'Mishti doi',
  momos: 'Momos',
};

/** "Two ___!" when a pair is found. */
export const SNACK_PAIRS: Partial<Record<SnackId, string>> = {
  chai: 'cups of chai',
  lassi: 'glasses of lassi',
  makkiroti: 'plates of makki di roti',
  dalbaati: 'plates of dal baati',
  mishtidoi: 'pots of mishti doi',
  momos: 'plates of momos',
  coconut: 'coconuts',
  dhokla: 'plates of dhokla',
  fafda: 'plates of fafda',
  vadapav: 'vada pavs',
  idli: 'plates of idli',
};

export const GIFT_NAMES: Record<GiftId, string> = {
  dhol: 'dhol',
  puppet: 'puppet',
  kite: 'kite',
  modak: 'modaks',
  flowers: 'flowers',
  sugarcane: 'sugarcane',
  rasgulla: 'rasgullas',
  momos: 'momos',
};

/** What a maze can hide at its goal: any snack or gift. */
export type GoalId = SnackId | GiftId;
const GOAL_WORDS: Partial<Record<GoalId, string>> = { jalebi: 'jalebis', laddoo: 'laddoos', samosa: 'samosas', modak: 'modaks', rasgulla: 'rasgullas' };
/** "Gappu found the ___!" */
export const goalName = (g: GoalId) => GOAL_WORDS[g] ?? (g in GIFT_NAMES ? GIFT_NAMES[g as GiftId] : SNACK_NAMES[g as SnackId].toLowerCase());

// Fix the Tracks maps, by name. See src/game/tracks.ts for the legend. `taps` is the starting turn of each
// piece for the built-in copy; the game makes a new scramble every play anyway.
export const TRACK_GAMES = {
  // 4 x 4, a short line through the mustard fields (Punjab)
  fields: { id: 'fields', start: 2, goal: 3, map: ['FFac', 'THH|', 'TFbd', 'HFac'], taps: ['0022', '0001', '0031', '0021'] },
  // 5 x 5, rooftops and a winding line, no decoys (Gujarat)
  kites: { id: 'kites', start: 0, goal: 0, map: ['acPFF', 'bdTHF', 'a-cHT', 'FbdTP', 'bdFPH'], taps: ['13000', '23000', '11100', '02100', '33000'] },
  // 5 x 5 with decoy pieces (Mumbai)
  monsoon: { id: 'monsoon', start: 1, goal: 2, map: ['bdH.H', 'ac.FT', 'FacFT', 'Hba-c', 'HHb-d'], taps: ['23000', '33000', '01100', '02212', '00213'] },
  // 6 x 6, past ponds and palms, a few decoys (Kerala)
  backwaters: { id: 'backwaters', start: 5, goal: 3, map: ['HFTFP|', 'TFFdbd', 'FTabdb', 'Fbc|T.', 'H|adHT', 'Fa-cPT'], taps: ['000001', '000123', '002312', '012100', '012300', '031300'] },
  // 5 x 5, one winding line (Diwali Express)
  medium: {
    id: 'medium',
    start: 1,
    goal: 3,
    map: ['T|HFT', 'Ha-cP', 'FTbdH', 'PHacT', 'TFT|F'],
    taps: ['01000', '01120', '00310', '00210', '00010'],
  },
  // 6 x 6 with decoys (Tamil Nadu)
  temple: { id: 'temple', start: 4, goal: 3, map: ['Tb--da', 'bddFHT', 'acH|bP', 'bdFHHH', 'a-cTdP', 'HHacTH'], taps: ['031110', '222000', '120110', '220000', '211030', '003200'] },
  // 6 x 6, a longer line plus decoy pieces that lead nowhere (Howrah Express)
  hard: {
    id: 'hard',
    start: 0,
    goal: 5,
    map: ['|Tb-cH', 'a-dP||', '|b-bdd', 'T-c|-F', 'aH|a-c', 'F-dTH|'],
    taps: ['102110', '112011', '121121', '002110', '301211', '012001'],
  },
  // 6 x 6, the toy train's loops in the hills, lots of decoys
  hills: { id: 'hills', start: 2, goal: 3, map: ['FbdbcF', '|a-dac', 'T-TTbd', 'PTbHac', 'HcHHbd', 'TFTbd|'], taps: ['011230', '221113', '020032', '003021', '030012', '000123'] },
} satisfies Record<string, TrackConfig>;

// Slide puzzles: 3 x 3, start position chosen so the best solution is `par` moves (checked by the tests).
export type SlideGame = { id: string; picture: string; size: number; start: number[]; par: number };
export const SLIDE_GAMES = {
  kites: { id: 'kites', picture: 'kites', size: 3, start: [3, 0, 1, 6, -1, 2, 7, 4, 5], par: 8 },
  'boat-race': { id: 'boat-race', picture: 'boat-race', size: 3, start: [4, 3, 1, 0, 7, 2, -1, 6, 5], par: 10 },
  'toy-train': { id: 'toy-train', picture: 'toy-train', size: 3, start: [6, 0, 1, 4, -1, 2, 7, 3, 5], par: 12 },
} satisfies Record<string, SlideGame>;

// Rangoli patterns (src/game/rangoli.ts). Ring 0 is the centre. A ring with two colours alternates them.
export const RANGOLI_GAMES = {
  // Rajasthan: white and yellow on red earth; three plain rings
  mandana: {
    id: 'mandana',
    style: 'mandana',
    rings: [
      { shape: 'disc', count: 1, colors: ['yellow'] },
      { shape: 'petal', count: 6, colors: ['white'] },
      { shape: 'dot', count: 12, colors: ['yellow'] },
      { shape: 'drop', count: 12, colors: ['white'] },
    ],
    extra: ['orange'],
  },
  // Mumbai, Ganesh Chaturthi: bright powder colours, one ring in two colours
  chaturthi: {
    id: 'chaturthi',
    style: 'rangoli',
    rings: [
      { shape: 'disc', count: 1, colors: ['yellow'] },
      { shape: 'petal', count: 8, colors: ['pink'] },
      { shape: 'diamond', count: 8, colors: ['orange', 'yellow'] },
      { shape: 'drop', count: 16, colors: ['green'] },
      { shape: 'dot', count: 16, colors: ['white'] },
    ],
    extra: ['blue'],
  },
  // Kerala, Onam: a flower carpet, with a ring of leaves
  onam: {
    id: 'onam',
    style: 'pookalam',
    rings: [
      { shape: 'disc', count: 1, colors: ['purple'] },
      { shape: 'petal', count: 8, colors: ['white'] },
      { shape: 'petal', count: 8, colors: ['yellow', 'orange'] },
      { shape: 'leaf', count: 16, colors: ['green'] },
      { shape: 'drop', count: 16, colors: ['orange', 'red'] },
    ],
    extra: ['pink'],
  },
  // Tamil Nadu, Pongal: a kolam on a dark doorstep, mostly white with a little colour
  pongal: {
    id: 'pongal',
    style: 'kolam',
    rings: [
      { shape: 'disc', count: 1, colors: ['yellow'] },
      { shape: 'dot', count: 8, colors: ['white'] },
      { shape: 'petal', count: 8, colors: ['red', 'white'] },
      { shape: 'diamond', count: 8, colors: ['white'] },
      { shape: 'dot', count: 16, colors: ['yellow', 'red'] },
      { shape: 'drop', count: 16, colors: ['white'] },
    ],
    extra: ['green'],
  },
  // Bengal: alpana, white rice paste with turmeric yellow, on a red floor
  alpana: {
    id: 'alpana',
    style: 'alpana',
    rings: [
      { shape: 'disc', count: 1, colors: ['yellow'] },
      { shape: 'petal', count: 8, colors: ['white'] },
      { shape: 'dot', count: 16, colors: ['white', 'yellow'] },
      { shape: 'leaf', count: 16, colors: ['white'] },
      { shape: 'drop', count: 16, colors: ['yellow', 'white'] },
      { shape: 'dot', count: 24, colors: ['white'] },
    ],
    extra: ['orange'],
  },
} satisfies Record<string, RangoliConfig>;

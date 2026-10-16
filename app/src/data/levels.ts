import type { MusicName } from '../audio/sound';
import type { FriendId, GiftId } from './games';

// The 10 levels: one stop each on the Jalebi Express's trip round India (STORY.md). Each level has its
// place, the friend who stars in it, a story card to read aloud when it opens, the line shown when it's
// done (the friend joins the train), and its own look and music. Plain data, so the logic tests can read it.

/** How a level looks: colours for the screens, the tray, and a decoration along the top. */
export type Theme = {
  /** 'diwali' turns on the night games: the dark Lantern Walk, tracks that light diyas, lamplit shadows. */
  id: 'town' | 'punjab' | 'rajasthan' | 'gujarat' | 'mumbai' | 'kerala' | 'tamil' | 'bengal' | 'hills' | 'diwali';
  dark: boolean; // light text on a dark background
  bg: string; // screen background
  text: string; // text straight on the background (titles)
  textSoft: string;
  tray: string; // jigsaw tray, shadow tray, picnic mat
  accent: string; // the level's badge and highlights
  deco: 'none' | 'lights' | 'bunting' | 'mirrors' | 'kites' | 'rain' | 'palms' | 'toran' | 'snow';
  houses: [string, string][]; // maze houses: wall and roof colours
  music: MusicName;
};

export type Level = {
  n: number;
  place: string; // "Punjab"
  title: string; // "Golden Fields"
  friend: FriendId; // the friend this level is about
  joins: boolean; // a new friend who hops on the train when the level is done
  picture: string; // the story card's picture (a picture id)
  story: string[]; // two or three short lines to read aloud when the level opens
  done: string; // headline when the level is done
  gift: string; // the line under it
  giftArt?: GiftId; // the gift's picture
  theme: Theme;
};

const INK = '#1E2A4F';
const INK_SOFT = '#4A5A7F';
const TOWN_HOUSES: [string, string][] = [
  ['#FF8FA3', '#E86F8C'],
  ['#3CC6B6', '#2FA39A'],
  ['#FFC93C', '#E6A817'],
  ['#B39DFF', '#8E73E8'],
  ['#FF9F43', '#E07A1F'],
];
const day = (t: Omit<Theme, 'dark' | 'text' | 'textSoft' | 'music'> & Partial<Theme>): Theme => ({ dark: false, text: INK, textSoft: INK_SOFT, music: 'town', ...t });

export const LEVELS: Level[] = [
  {
    n: 1,
    place: 'Jalebi Junction',
    title: 'Home Sweet Home',
    friend: 'gappu',
    joins: false,
    picture: 'station',
    story: [
      'Diwali is coming, and Jalebi Junction is having a Friendship Mela!',
      'Pip has a big idea: "Let\'s invite a friend from every corner of India!"',
      'Pack the jalebis, everyone. The Jalebi Express is waiting!',
    ],
    done: 'All aboard!',
    gift: 'Next stop: the golden fields of Punjab.',
    theme: day({ id: 'town', bg: '#FFE7C2', tray: '#F7CF8F', accent: '#7ED957', deco: 'none', houses: TOWN_HOUSES }),
  },
  {
    n: 2,
    place: 'Punjab',
    title: 'Golden Fields',
    friend: 'bholu',
    joins: true,
    picture: 'bholu',
    story: [
      'Choo choo! The train rolls into Punjab, where the mustard fields are bright yellow.',
      "Dhum, dhum, dhum! It's Baisakhi, the harvest festival.",
      "Bholu the buffalo is playing his dhol. Let's join in!",
    ],
    done: 'Bholu is coming to the Mela!',
    gift: "He's bringing his dhol, for dancing.",
    giftArt: 'dhol',
    theme: day({
      id: 'punjab',
      bg: '#FFF1B8',
      tray: '#F5DA74',
      accent: '#FFC107',
      deco: 'bunting',
      houses: [['#FF7A59', '#E05A3A'], ['#7ED957', '#5BB83A'], ['#FFC93C', '#E6A817'], ['#FF4F79', '#D93A60']],
    }),
  },
  {
    n: 3,
    place: 'Rajasthan',
    title: 'Desert Fair',
    friend: 'kesar',
    joins: true,
    picture: 'kesar',
    story: [
      'Across the sand dunes, the train reaches a busy fair in Rajasthan.',
      'There are puppets, music, and camels in their best clothes.',
      'Kesar the camel waves hello with her long, long lashes.',
    ],
    done: 'Kesar is coming to the Mela!',
    gift: "She's bringing puppets for a puppet show.",
    giftArt: 'puppet',
    theme: day({
      id: 'rajasthan',
      bg: '#FFE3C7',
      tray: '#F3C48E',
      accent: '#FF7A59',
      deco: 'mirrors',
      houses: [['#E8A15C', '#C9803C'], ['#F2B8A0', '#D9907A'], ['#E3C08A', '#C9A06A'], ['#F09A7A', '#D07A5A']],
    }),
  },
  {
    n: 4,
    place: 'Gujarat',
    title: 'Kite Festival',
    friend: 'raja',
    joins: true,
    picture: 'raja',
    story: [
      "It's Uttarayan in Gujarat, and the sky is full of kites!",
      'Everyone is up on the rooftops, eating fafda and jalebi.',
      'Raja the lion has come all the way from the Gir forest to fly his kite.',
    ],
    done: 'Raja is coming to the Mela!',
    gift: "He's bringing kites of every colour.",
    giftArt: 'kite',
    theme: day({
      id: 'gujarat',
      bg: '#DDF3FF',
      tray: '#AEDCF2',
      accent: '#2E9BE6',
      deco: 'kites',
      houses: [['#F7B2A8', '#E0918A'], ['#FFE08A', '#E6C060'], ['#C8B6F2', '#A893DA'], ['#A8E0C8', '#80C4A8']],
    }),
  },
  {
    n: 5,
    place: 'Mumbai',
    title: 'Monsoon City',
    friend: 'chikki',
    joins: true,
    picture: 'chikki',
    story: [
      "Pitter patter! It's raining in Mumbai, the busy city by the sea.",
      "It's Ganesh Chaturthi, and Chikki the mouse is making sweet modaks.",
      'Grab an umbrella and hop on the local train!',
    ],
    done: 'Chikki is coming to the Mela!',
    gift: "She's bringing a big box of modaks.",
    giftArt: 'modak',
    theme: day({
      id: 'mumbai',
      bg: '#DFEAF3',
      tray: '#BCD0E2',
      accent: '#4F86B8',
      deco: 'rain',
      houses: [['#8FB0D2', '#6C8FB5'], ['#F2D16B', '#D9B44A'], ['#B98E8E', '#8E2B2B'], ['#A8C4D8', '#7FA0BA']],
    }),
  },
  {
    n: 6,
    place: 'Kerala',
    title: 'Backwaters',
    friend: 'appu',
    joins: true,
    picture: 'appu',
    story: [
      'The train rolls south to Kerala, past coconut palms and quiet backwaters.',
      "It's Onam! Families make flower carpets called pookalam.",
      'Appu the elephant is cheering at the snake-boat race.',
    ],
    done: 'Appu is coming to the Mela!',
    gift: "He's bringing flowers for a pookalam.",
    giftArt: 'flowers',
    theme: day({
      id: 'kerala',
      bg: '#E0F5D8',
      tray: '#B8E2A8',
      accent: '#3FAE5A',
      deco: 'palms',
      houses: [['#6CC15A', '#4FA03E'], ['#D4A256', '#B9853A'], ['#3FA7B5', '#2E8A96'], ['#F2C94C', '#D9A82A']],
    }),
  },
  {
    n: 7,
    place: 'Tamil Nadu',
    title: 'Temple Town',
    friend: 'mayil',
    joins: true,
    picture: 'mayil',
    story: [
      'Good morning, Tamil Nadu! The temple towers glow in the sunrise.',
      "It's Pongal, and the rice pot is bubbling over. Pongalo Pongal!",
      'Mayil the peacock has drawn a kolam at the door.',
    ],
    done: 'Mayil is coming to the Mela!',
    gift: "He's bringing sweet sugarcane for everyone.",
    giftArt: 'sugarcane',
    theme: day({
      id: 'tamil',
      bg: '#FFE6D0',
      tray: '#F6C9A0',
      accent: '#E8574F',
      deco: 'toran',
      houses: [['#E9A866', '#C8662F'], ['#3FA7B5', '#2E8A96'], ['#E8574F', '#C23F38'], ['#F0B87A', '#D9944A']],
    }),
  },
  {
    n: 8,
    place: 'Kolkata',
    title: 'City of Joy',
    friend: 'bagha',
    joins: true,
    picture: 'bagha',
    story: [
      'The train rumbles over the big Howrah Bridge into Kolkata.',
      "It's Durga Puja, and the whole city is dressed up in lights.",
      "Bagha the tiger has come from the Sundarbans. He's a bit shy, so say hello!",
    ],
    done: 'Bagha is coming to the Mela!',
    gift: "He's bringing a pot of spongy rasgullas.",
    giftArt: 'rasgulla',
    theme: day({
      id: 'bengal',
      bg: '#FCE6E0',
      tray: '#F2C2B6',
      accent: '#D7263D',
      deco: 'lights',
      houses: [['#FFD43B', '#E6B41C'], ['#E8574F', '#C23F38'], ['#F3EDE2', '#D9CFBF'], ['#9D7BD8', '#7E5CC0']],
    }),
  },
  {
    n: 9,
    place: 'The Hills',
    title: 'Up in the Clouds',
    friend: 'momo',
    joins: true,
    picture: 'momo',
    story: [
      'Puff, puff! A little toy train climbs up into the hills.',
      'There are tea gardens, snowy mountains and fluffy clouds.',
      'Momo the red panda is waiting at the top, with a basket of momos.',
    ],
    done: 'Momo is coming to the Mela!',
    gift: "She's bringing momos, still warm!",
    giftArt: 'momos',
    theme: day({
      id: 'hills',
      bg: '#E4F0FF',
      tray: '#C4D9F0',
      accent: '#7C8DB5',
      deco: 'snow',
      houses: [['#4FB55E', '#3E9B4F'], ['#E8336B', '#C2204F'], ['#8C9CC4', '#6C7CA4'], ['#C99248', '#A87430']],
    }),
  },
  {
    n: 10,
    place: 'Jalebi Junction',
    title: 'Home for Diwali',
    friend: 'pip',
    joins: false,
    picture: 'diwali-shop',
    story: [
      'The Jalebi Express is home, just in time for Diwali!',
      'Every new friend is here, and every friend has brought a gift.',
      'Light the diyas. The Friendship Mela is about to begin!',
    ],
    done: 'Happy Diwali!',
    gift: 'Every friend is a piece of the big picture.',
    theme: {
      id: 'diwali',
      dark: true,
      bg: '#1B2155',
      text: '#FFF3D6',
      textSoft: '#C9CFF2',
      tray: '#2B3373',
      accent: '#FFC93C',
      deco: 'lights',
      houses: TOWN_HOUSES,
      music: 'diwali',
    },
  },
];

export const LEVEL_COUNT = LEVELS.length;

/** The level, or the nearest one there is (a server could send a level this app doesn't know yet). */
export const getLevel = (n: number): Level => LEVELS[Math.min(LEVELS.length, Math.max(1, Math.round(n))) - 1];
export const themeFor = (n: number): Theme => getLevel(n).theme;

/** Levels 1 and 2 are gentler: a peek at the memory cards, jigsaw pieces laid out in a grid, no decoy shadows. */
export const isGentle = (n: number) => n <= 2;

const HOME_FRIENDS: FriendId[] = ['gappu', 'mithu', 'tillu', 'chunnu', 'gauri', 'pip'];

/** Friends a child has met by `level`: the six from home, and the new friend of every level up to it. */
export const friendsMet = (level: number): FriendId[] => [...HOME_FRIENDS, ...LEVELS.filter((l) => l.joins && l.n <= level).map((l) => l.friend)];

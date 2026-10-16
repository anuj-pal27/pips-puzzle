import type { ImageSourcePropType } from 'react-native';

import type { MazeConfig } from '../game/maze';
import type { RangoliConfig } from '../game/rangoli';
import type { TrackConfig } from '../game/tracks';
import { RANGOLI_GAMES, SLIDE_GAMES, TRACK_GAMES, type FriendId, type SnackId } from './games.ts';
import { MAZES } from './mazes.ts';

// The puzzles built into the app, level by level (STORY.md). The game plays the list from the Django server
// when it can (src/state/catalog.tsx); these are what it plays before that, or with no server at all.
// The server's seed file (backend/content/seed.json) is made from this list: `npm run seed`.
//
// Puzzle ids never change once released: phones keep stars by id. The 15 puzzles from before the levels
// (easy-1, medium-3, ...) kept their ids when they moved into levels; new ones are "level-<n>-<k>".

export type Picture = {
  id: string;
  title: string;
  image: ImageSourcePropType; // bundled, or { uri } for a picture uploaded on the server
  width: number; // the picture's shape (only the ratio matters)
  height: number;
};

type Base = {
  id: string;
  level: number; // 1 to 10
  order: number; // play order inside the level
  title: string; // name card after finishing, and the map's label
  cheer: string; // big headline on the finish screen
  blurb: string;
  fact: string; // Pip's fact: one short, true fun fact on the finish screen ('' for none)
};

// Every puzzle carries its own settings, so one sent by the server needs nothing else from the app.
export type JigsawPuzzle = Base & { kind: 'jigsaw'; picture: string; cols: number; rows: number; spin?: boolean };
export type MazePuzzle = Base & { kind: 'maze'; maze: MazeConfig };
export type ShadowPuzzle = Base & { kind: 'shadow'; friends: FriendId[]; cols: number };
export type MemoryPuzzle = Base & { kind: 'memory'; snacks: SnackId[]; cols: number };
export type TracksPuzzle = Base & { kind: 'tracks'; tracks: TrackConfig };
export type SlidePuzzle = Base & { kind: 'slide'; picture: string; size: number; start: number[]; par: number };
export type RangoliPuzzle = Base & { kind: 'rangoli'; rangoli: RangoliConfig };

export type Puzzle = JigsawPuzzle | MazePuzzle | ShadowPuzzle | MemoryPuzzle | TracksPuzzle | SlidePuzzle | RangoliPuzzle;
export type PuzzleKind = Puzzle['kind'];

/** Short name of each kind of puzzle, shown as a chip on the map. */
export const KIND_LABEL: Record<PuzzleKind, string> = {
  jigsaw: 'Jigsaw',
  maze: 'Maze',
  shadow: 'Shadows',
  memory: 'Snap',
  tracks: 'Tracks',
  slide: 'Slide',
  rangoli: 'Rangoli',
};

const shadow = (friends: FriendId[], cols: number) => ({ kind: 'shadow', friends, cols }) as const;
const snap = (snacks: SnackId[], cols = snacks.length <= 3 ? 3 : 4) => ({ kind: 'memory', snacks, cols }) as const;
const tracks = (g: keyof typeof TRACK_GAMES) => ({ kind: 'tracks', tracks: TRACK_GAMES[g] }) as const;
const maze = (g: keyof typeof MAZES) => ({ kind: 'maze', maze: MAZES[g] }) as const;
const slide = (g: keyof typeof SLIDE_GAMES) => {
  const { picture, size, start, par } = SLIDE_GAMES[g];
  return { kind: 'slide', picture, size, start, par } as const;
};
const rangoli = (g: keyof typeof RANGOLI_GAMES) => ({ kind: 'rangoli', rangoli: RANGOLI_GAMES[g] }) as const;
const jigsaw = (picture: string, cols: number, rows: number, spin = false) => ({ kind: 'jigsaw', picture, cols, rows, ...(spin ? { spin } : {}) }) as const;

// Within a level no two puzzles in a row play the same way, and each level gets harder in a new way.
export const PUZZLES: Puzzle[] = [
  // 1 Jalebi Junction: getting ready for the trip
  { id: 'easy-1', level: 1, order: 1, ...jigsaw('gappu', 3, 2), title: 'Gappu the Goat', cheer: 'You made Gappu!', blurb: 'Always hungry, always grinning.', fact: 'Goats are great climbers. Some even climb trees!' },
  { id: 'easy-2', level: 1, order: 2, ...shadow(['mithu', 'tillu', 'pip'], 3), title: "Who's Coming Along?", cheer: 'Found them all!', blurb: 'Mithu, Tillu and Pip are coming on the trip!', fact: 'Your shadow is shortest at lunchtime, when the sun is high in the sky.' },
  { id: 'easy-3', level: 1, order: 3, ...snap(['jalebi', 'laddoo', 'samosa']), title: 'Pack the Snacks', cheer: 'Snack Snap!', blurb: 'Three pairs of snacks, packed for the train.', fact: 'A samosa has three corners, just like a triangle!' },
  { id: 'easy-4', level: 1, order: 4, ...jigsaw('chunnu', 3, 2), title: 'Chunnu the Monkey', cheer: 'You made Chunnu!', blurb: 'The cheekiest monkey in town wants to come too.', fact: 'Monkeys use their long tails to help them balance in the trees.' },
  { id: 'easy-5', level: 1, order: 5, ...maze('easy'), title: 'Jalebi Hunt', cheer: 'Yum!', blurb: 'Gappu found the jalebis for the trip!', fact: 'Cows sleep for only about four hours a day.' },
  { id: 'hard-1', level: 1, order: 6, ...jigsaw('station', 3, 3), title: 'All Aboard!', cheer: 'All aboard!', blurb: 'The Jalebi Express is ready to go.', fact: 'Old steam trains ran on coal and water, and puffed out big clouds of steam.' },

  // 2 Punjab: Baisakhi in the mustard fields
  { id: 'level-2-1', level: 2, order: 1, ...jigsaw('bholu', 3, 3), title: 'Meet Bholu', cheer: 'Hello, Bholu!', blurb: 'Dhum, dhum! Bholu plays the dhol at Baisakhi.', fact: 'Water buffaloes love to cool off by sitting in ponds and mud.' },
  { id: 'level-2-2', level: 2, order: 2, ...snap(['lassi', 'makkiroti', 'jalebi', 'laddoo']), title: 'Baisakhi Snap', cheer: 'Balle balle!', blurb: 'Four pairs from a Punjabi harvest feast.', fact: 'Lassi is a cool yoghurt drink from Punjab. It can be sweet or salty!' },
  { id: 'level-2-3', level: 2, order: 3, ...shadow(['bholu', 'gappu', 'gauri', 'chunnu'], 2), title: 'Shadows in the Mustard', cheer: 'Super spotting!', blurb: 'Everyone found their shadow in the golden fields.', fact: 'Mustard plants have bright yellow flowers, and their seeds make mustard oil.' },
  { id: 'level-2-4', level: 2, order: 4, ...tracks('fields'), title: 'Train Through the Fields', cheer: 'Choo choo!', blurb: 'The Jalebi Express rolls on through the fields.', fact: 'Baisakhi is a harvest festival. Farmers in Punjab celebrate bringing in the wheat.' },
  { id: 'level-2-5', level: 2, order: 5, ...maze('fields'), title: "Find Bholu's Dhol", cheer: 'Dhum dhum!', blurb: 'Gappu found the dhol. Time to dance the bhangra!', fact: 'A dhol has two sides. It is played with two sticks, one thick and one thin.' },

  // 3 Rajasthan: the desert fair
  { id: 'level-3-1', level: 3, order: 1, ...jigsaw('kesar', 3, 3), title: 'Meet Kesar', cheer: 'Hello, Kesar!', blurb: 'Kesar loves the fair, and puppet shows most of all.', fact: 'The camel is the state animal of Rajasthan. Camels can walk for days across the desert.' },
  { id: 'level-3-2', level: 3, order: 2, ...rangoli('mandana'), title: 'Mandana Pattern', cheer: 'Beautiful!', blurb: 'White and yellow on red earth, just like in Rajasthan.', fact: 'Mandana is a folk art from Rajasthan, painted with white chalk on red earth floors and walls.' },
  { id: 'level-3-3', level: 3, order: 3, ...shadow(['kesar', 'bholu', 'mithu', 'tillu'], 2), title: 'Desert Shadows', cheer: 'Super spotting!', blurb: 'Four friends, and one more who has no shadow!', fact: "A camel's hump stores fat, not water. It helps the camel go for days without food." },
  { id: 'level-3-4', level: 3, order: 4, ...snap(['ghevar', 'dalbaati', 'lassi', 'jalebi']), title: 'Desert Snack Snap', cheer: 'Snack Snap!', blurb: 'Four pairs of tasty treats from the fair.', fact: 'Ghevar is a round, honeycomb sweet from Rajasthan, made for the rainy-season festival of Teej.' },
  { id: 'level-3-5', level: 3, order: 5, ...maze('fair'), title: 'Puppet Hunt', cheer: 'Found it!', blurb: 'The puppet show can begin!', fact: 'Kathputli are wooden string puppets from Rajasthan that dance and tell stories.' },

  // 4 Gujarat: Uttarayan, the kite festival
  { id: 'level-4-1', level: 4, order: 1, ...jigsaw('raja', 4, 3), title: 'Meet Raja', cheer: 'Hello, Raja!', blurb: 'Raja came all the way from the Gir forest to fly his kite.', fact: 'The Gir forest in Gujarat is the only place in the world where Asiatic lions live in the wild.' },
  { id: 'level-4-2', level: 4, order: 2, ...tracks('kites'), title: 'Kite Day Express', cheer: 'Choo choo!', blurb: 'The train got to the rooftops in time for the kites.', fact: 'At Uttarayan, families in Gujarat go up on their rooftops and fly kites all day long.' },
  { id: 'level-4-3', level: 4, order: 3, ...snap(['dhokla', 'fafda', 'jalebi', 'samosa', 'chai', 'mango']), title: 'Farsan Snap', cheer: 'Snack feast!', blurb: 'Six pairs of Gujarati snacks. Fafda and jalebi go together!', fact: 'In Gujarat, people love eating crunchy fafda with sweet jalebi on festival mornings.' },
  { id: 'level-4-4', level: 4, order: 4, ...shadow(['raja', 'kesar', 'bholu', 'mithu', 'chunnu'], 3), title: 'Rooftop Shadows', cheer: 'Super spotting!', blurb: 'Five friends, and one more who has no shadow!', fact: 'Lions are the only big cats that live together in family groups, called prides.' },
  { id: 'level-4-5', level: 4, order: 5, ...slide('kites'), title: 'Kites in the Sky', cheer: 'Soaring!', blurb: 'You put the kite festival back together!', fact: 'On Uttarayan, in January, the sky over Gujarat fills with thousands of kites.' },

  // 5 Mumbai: monsoon and Ganesh Chaturthi
  { id: 'level-5-1', level: 5, order: 1, ...jigsaw('chikki', 4, 3), title: 'Meet Chikki', cheer: 'Hello, Chikki!', blurb: 'Chikki loves the rain, and modaks even more.', fact: 'The monsoon brings heavy rain to Mumbai every year, from about June to September.' },
  { id: 'level-5-2', level: 5, order: 2, ...maze('monsoon'), title: 'Modak Hunt', cheer: 'Modak time!', blurb: 'Gappu found the modaks. Chikki is so happy!', fact: 'Mumbai was once seven little islands. They were joined together long ago to make one city.' },
  { id: 'level-5-3', level: 5, order: 3, ...rangoli('chaturthi'), title: 'Chaturthi Rangoli', cheer: 'Beautiful!', blurb: 'A bright rangoli at the door, ready for the festival.', fact: 'At Ganesh Chaturthi, families make sweet dumplings called modaks, filled with coconut and jaggery.' },
  { id: 'hard-4', level: 5, order: 4, ...snap(['vadapav', 'modak', 'chai', 'kulfi', 'mango', 'samosa']), title: 'Chowpatty Snack Snap', cheer: 'Snack feast!', blurb: 'Six pairs of Mumbai street snacks!', fact: 'Vada pav is a spicy potato fritter in a soft bun. It is a favourite snack in Mumbai.' },
  { id: 'level-5-5', level: 5, order: 5, ...tracks('monsoon'), title: 'Monsoon Local', cheer: 'Choo choo!', blurb: 'Splish splash! The train made it through the rain.', fact: "Mumbai's local trains carry millions of people every single day." },

  // 6 Kerala: Onam on the backwaters
  { id: 'level-6-1', level: 6, order: 1, ...jigsaw('appu', 5, 3), title: 'Meet Appu', cheer: 'Hello, Appu!', blurb: 'Appu loves the backwaters, and boat races most of all.', fact: "The elephant is the state animal of Kerala. An elephant's trunk has thousands of muscles!" },
  { id: 'level-6-2', level: 6, order: 2, ...shadow(['appu', 'chikki', 'raja', 'kesar', 'bholu'], 3), title: 'Backwater Shadows', cheer: 'Super spotting!', blurb: 'Shadows on the riverbank, and one friend with none!', fact: "Kerala's backwaters are rivers, lakes and canals, all joined up for hundreds of kilometres." },
  { id: 'level-6-3', level: 6, order: 3, ...rangoli('onam'), title: 'Onam Pookalam', cheer: 'Beautiful!', blurb: 'A flower carpet for Onam, petal by petal.', fact: 'At Onam, families in Kerala make a pookalam, a carpet of flowers, in front of their homes.' },
  { id: 'hard-2', level: 6, order: 4, ...slide('boat-race'), title: 'Snake Boat Race', cheer: 'Row, row, row!', blurb: 'Slow and steady wins the race. Well done!', fact: "Kerala's snake boats are so long that around 100 rowers can sit in one!" },
  { id: 'level-6-5', level: 6, order: 5, ...tracks('backwaters'), title: 'Backwater Express', cheer: 'Choo choo!', blurb: 'Past the ponds and the palms, all the way through.', fact: 'Coconut palms grow all over Kerala. The name Kerala may come from "kera", a word for coconut.' },

  // 7 Tamil Nadu: Pongal in the temple town
  { id: 'level-7-1', level: 7, order: 1, ...jigsaw('mayil', 5, 4), title: 'Meet Mayil', cheer: 'Hello, Mayil!', blurb: 'Mayil draws a kolam at the door every morning.', fact: 'The peacock is the national bird of India. Only the boys have the big, bright tail feathers.' },
  { id: 'level-7-2', level: 7, order: 2, ...rangoli('pongal'), title: 'Pongal Kolam', cheer: 'Beautiful!', blurb: 'A kolam for Pongal, white as rice flour.', fact: 'A kolam is drawn with rice flour, so ants and little birds get a breakfast too!' },
  { id: 'level-7-3', level: 7, order: 3, ...tracks('temple'), title: 'Temple Town Tracks', cheer: 'Choo choo!', blurb: 'The train found its way to the temple town.', fact: 'The tall, colourful towers over the gates of temples in Tamil Nadu are called gopurams.' },
  { id: 'level-7-4', level: 7, order: 4, ...shadow(['mayil', 'appu', 'raja', 'chikki', 'bholu', 'kesar'], 3), title: 'Peacock Shadows', cheer: 'Super spotting!', blurb: "Six friends! Can you find Mayil's fancy tail?", fact: 'At Pongal, rice is cooked in a pot until it bubbles over. Everyone shouts "Pongalo Pongal!"' },
  { id: 'level-7-5', level: 7, order: 5, ...snap(['idli', 'dosa', 'appam', 'coconut', 'chai', 'laddoo']), title: 'Tiffin Snap', cheer: 'Snack feast!', blurb: 'Six pairs of southern breakfasts. Idli, dosa, yum!', fact: 'Idli is a soft, steamed cake made from rice and lentils. It is often eaten for breakfast.' },

  // 8 Kolkata: Durga Puja in the City of Joy
  { id: 'level-8-1', level: 8, order: 1, ...jigsaw('bagha', 5, 4), title: 'Meet Bagha', cheer: 'Hello, Bagha!', blurb: 'Bagha is shy, but he loves a festival.', fact: 'The Bengal tiger is the national animal of India. Every tiger has its own pattern of stripes.' },
  { id: 'level-8-2', level: 8, order: 2, ...snap(['rasgulla', 'mishtidoi', 'gulabjamun', 'kajukatli', 'laddoo', 'jalebi']), title: 'Mishti Snap', cheer: 'Mishti time!', blurb: 'Six pairs of sweets. Bengal loves mishti!', fact: 'Mishti doi is sweet yoghurt from Bengal, set in little clay pots.' },
  { id: 'level-8-3', level: 8, order: 3, ...shadow(['bagha', 'mayil', 'appu', 'chikki', 'raja', 'kesar'], 3), title: 'Shadows by the River', cheer: 'Super spotting!', blurb: 'Six friends by the river, and one with no shadow!', fact: 'The Sundarbans is a huge mangrove forest, where Bengal tigers swim between the islands.' },
  { id: 'level-8-4', level: 8, order: 4, ...rangoli('alpana'), title: 'Durga Puja Alpana', cheer: 'Beautiful!', blurb: 'White alpana on a red floor, ready for Durga Puja.', fact: 'Alpana is a floor art from Bengal, painted with a white paste made from rice.' },
  { id: 'hard-3', level: 8, order: 5, ...tracks('hard'), title: 'Howrah Express', cheer: 'Choo choo!', blurb: 'You found the one line that works!', fact: 'Howrah Bridge in Kolkata has no nuts and bolts. It is held together with rivets!' },

  // 9 The Hills: the toy train, tea gardens and momos
  { id: 'level-9-1', level: 9, order: 1, ...jigsaw('momo', 6, 4), title: 'Meet Momo', cheer: 'Hello, Momo!', blurb: 'Momo loves the mountains, and momos even more!', fact: 'Red pandas spend most of their lives up in trees, and they love to eat bamboo.' },
  { id: 'level-9-2', level: 9, order: 2, ...slide('toy-train'), title: 'Toy Train in the Hills', cheer: 'Puff puff!', blurb: 'The little train is climbing again!', fact: 'The Darjeeling toy train has been puffing up the hills for more than 140 years.' },
  { id: 'level-9-3', level: 9, order: 3, ...snap(['momos', 'chai', 'rasgulla', 'appam', 'dhokla', 'vadapav', 'lassi', 'ghevar']), title: 'Picnic Snap', cheer: 'Snack feast!', blurb: 'Eight pairs! Snacks from every stop on the trip.', fact: 'The hills around Darjeeling are covered in tea gardens. Tea from there goes all over the world.' },
  { id: 'hard-5', level: 9, order: 4, ...maze('hard'), title: 'Hill Hunt', cheer: 'Momo time!', blurb: 'Gappu found the momos, high up in the hills!', fact: 'Kanchenjunga, in Sikkim, is the third highest mountain in the world.' },
  { id: 'level-9-5', level: 9, order: 5, ...tracks('hills'), title: 'Loops in the Hills', cheer: 'Choo choo!', blurb: 'Round and round, up and up the hill!', fact: 'The toy train climbs so steeply that its track goes round in loops and zig-zags.' },

  // 10 Home for Diwali: the Friendship Mela
  { id: 'medium-1', level: 10, order: 1, ...jigsaw('diwali-shop', 5, 4), title: "Gappu's Diwali Shop", cheer: 'Happy Diwali!', blurb: 'Diyas, lights and a marigold garland!', fact: 'Diwali is the festival of lights. Families light little clay lamps called diyas.' },
  { id: 'medium-2', level: 10, order: 2, ...tracks('medium'), title: 'Diwali Express', cheer: 'Choo choo!', blurb: 'The lamps lit up all the way to the stall.', fact: 'At Diwali, homes and streets twinkle with lights.' },
  { id: 'medium-3', level: 10, order: 3, ...shadow(['bholu', 'kesar', 'raja', 'chikki', 'appu', 'mayil'], 3), title: 'Lamplight Shadows', cheer: 'Super spotting!', blurb: 'All the new friends found their shadows in the lamplight.', fact: 'A lamp makes shadows. The closer you stand to it, the bigger your shadow!' },
  { id: 'medium-4', level: 10, order: 4, ...snap(['kajukatli', 'gulabjamun', 'laddoo', 'jalebi', 'rasgulla', 'ghevar', 'modak', 'barfi']), title: 'Mithai Snap', cheer: 'Mithai time!', blurb: 'Eight pairs of sweets, from every stop on the trip!', fact: 'Kaju katli is a Diwali sweet made from cashew nuts.' },
  { id: 'medium-5', level: 10, order: 5, ...maze('medium'), title: 'Lantern Walk', cheer: 'Yum!', blurb: 'Gappu lit the way to the jalebis!', fact: 'A kandil is a paper lantern that many families hang outside their homes at Diwali.' },
  { id: 'level-10-6', level: 10, order: 6, ...jigsaw('big-picture', 6, 4, true), title: 'The Big Picture', cheer: 'Happy Diwali!', blurb: 'Every friend is a piece of the big picture.', fact: 'India has more than 120 languages. Namaste, vanakkam, sat sri akal: there are lots of ways to say hello!' },
];

/** Picture ids bundled in the app (images in src/data/art.ts), with their titles and shapes. */
export const PICTURE_INFO: Record<string, { title: string; width: number; height: number }> = {
  gappu: { title: 'Gappu the Goat', width: 330, height: 220 },
  mithu: { title: 'Mithu the Parrot', width: 330, height: 220 },
  tillu: { title: 'Tillu the Tortoise', width: 330, height: 220 },
  chunnu: { title: 'Chunnu the Monkey', width: 330, height: 220 },
  shop: { title: "Gappu's Jalebi Shop", width: 328, height: 246 },
  'diwali-shop': { title: "Gappu's Diwali Shop", width: 328, height: 246 },
  station: { title: 'All Aboard at Jalebi Junction', width: 330, height: 264 },
  bholu: { title: 'Bholu in the Mustard Fields', width: 330, height: 220 },
  kesar: { title: 'Kesar at the Desert Fair', width: 330, height: 220 },
  raja: { title: 'Raja and the Kites', width: 330, height: 220 },
  chikki: { title: 'Chikki in the Monsoon', width: 330, height: 220 },
  appu: { title: 'Appu on the Backwaters', width: 330, height: 220 },
  mayil: { title: "Mayil's Pongal Morning", width: 330, height: 220 },
  bagha: { title: 'Bagha by the Howrah Bridge', width: 330, height: 220 },
  momo: { title: 'Momo in the Hills', width: 330, height: 220 },
  kites: { title: 'Kites in the Sky', width: 330, height: 220 },
  'boat-race': { title: 'The Snake Boat Race', width: 330, height: 220 },
  'toy-train': { title: 'The Toy Train', width: 330, height: 220 },
  'big-picture': { title: 'The Big Picture', width: 330, height: 220 },
};

// Teach the Robot: the child sorts pictures into baskets, then Bit the robot sorts new pictures by
// itself, using only what the child showed it. Pure functions, no React: unit-tested in __tests__/run.ts.
//
// How Bit decides (a real, very simple kind of AI called "nearest neighbour"): every picture has a few
// things you can see in it (its colour, its shape, whether it has wings, a stem, wheels...). For a new
// picture, Bit finds the example it was taught that shares the most of them, and copies that example's
// basket. So if the child put something in the wrong basket, Bit learns that mistake too.

import { shuffled } from './random.ts';

/** What Bit can see. Colours count a little; shapes and parts (wings, wheels, a stem) count more. */
const COLOURS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'white', 'brown', 'cream'] as const;
type Colour = (typeof COLOURS)[number];
type Part =
  | 'round' | 'long' | 'stem' | 'bunch' | 'seeds' | 'lace' | 'wheels' | 'boxy' // fruit and things
  | 'wings' | 'legs' | 'horns' | 'shell' | 'stripes' // flying or not
  | 'glow' | 'flame' | 'steam' | 'frozen' | 'snow' | 'stick' // hot or cold
  | 'leaftop' | 'pod'; // vegetables
export type Trait = Colour | Part;

export type ThingId =
  | 'apple' | 'banana' | 'grapes' | 'strawberry' | 'cherry' | 'mango'
  | 'ball' | 'redball' | 'shoe' | 'redshoe' | 'car' | 'bluecar' | 'redcar' | 'book' | 'redbook'
  | 'parrot' | 'butterfly' | 'plane' | 'bee' | 'goat' | 'tortoise' | 'cow' | 'train'
  | 'chai' | 'sun' | 'soup' | 'fire' | 'kulfi' | 'snowman' | 'icecube' | 'icecream' | 'snowflake'
  | 'carrot' | 'peas' | 'radish';

export type Thing = { id: ThingId; name: string; traits: Trait[] };

export const THINGS: Record<ThingId, Thing> = {
  apple: { id: 'apple', name: 'Apple', traits: ['red', 'round', 'stem'] },
  banana: { id: 'banana', name: 'Banana', traits: ['yellow', 'long', 'stem'] },
  grapes: { id: 'grapes', name: 'Grapes', traits: ['green', 'round', 'bunch', 'stem'] },
  strawberry: { id: 'strawberry', name: 'Strawberry', traits: ['red', 'seeds', 'stem'] },
  cherry: { id: 'cherry', name: 'Cherries', traits: ['red', 'round', 'stem'] },
  mango: { id: 'mango', name: 'Mango', traits: ['orange', 'round', 'stem'] },
  ball: { id: 'ball', name: 'Blue ball', traits: ['blue', 'round'] },
  redball: { id: 'redball', name: 'Red ball', traits: ['red', 'round'] },
  shoe: { id: 'shoe', name: 'Shoe', traits: ['purple', 'lace'] },
  redshoe: { id: 'redshoe', name: 'Red shoe', traits: ['red', 'lace'] },
  car: { id: 'car', name: 'Toy car', traits: ['green', 'wheels'] },
  bluecar: { id: 'bluecar', name: 'Blue toy car', traits: ['blue', 'wheels'] },
  redcar: { id: 'redcar', name: 'Red toy car', traits: ['red', 'wheels'] },
  book: { id: 'book', name: 'Book', traits: ['blue', 'boxy'] },
  redbook: { id: 'redbook', name: 'Red book', traits: ['red', 'boxy'] },
  parrot: { id: 'parrot', name: 'Mithu the parrot', traits: ['green', 'wings'] },
  butterfly: { id: 'butterfly', name: 'Butterfly', traits: ['orange', 'wings'] },
  plane: { id: 'plane', name: 'Aeroplane', traits: ['white', 'wings'] },
  bee: { id: 'bee', name: 'Bee', traits: ['yellow', 'wings', 'stripes'] },
  goat: { id: 'goat', name: 'Gappu the goat', traits: ['white', 'legs', 'horns'] },
  tortoise: { id: 'tortoise', name: 'Tillu the tortoise', traits: ['green', 'legs', 'shell'] },
  cow: { id: 'cow', name: 'Gauri the cow', traits: ['white', 'legs', 'horns'] },
  train: { id: 'train', name: 'Train', traits: ['blue', 'wheels'] },
  chai: { id: 'chai', name: 'Hot chai', traits: ['brown', 'steam'] },
  sun: { id: 'sun', name: 'Sun', traits: ['yellow', 'glow'] },
  soup: { id: 'soup', name: 'Hot soup', traits: ['orange', 'steam'] },
  fire: { id: 'fire', name: 'Campfire', traits: ['orange', 'glow', 'flame'] },
  kulfi: { id: 'kulfi', name: 'Kulfi', traits: ['cream', 'frozen', 'stick'] },
  snowman: { id: 'snowman', name: 'Snowman', traits: ['white', 'snow'] },
  icecube: { id: 'icecube', name: 'Ice cubes', traits: ['blue', 'frozen'] },
  icecream: { id: 'icecream', name: 'Ice cream', traits: ['pink', 'frozen'] },
  snowflake: { id: 'snowflake', name: 'Snowflake', traits: ['white', 'snow', 'frozen'] },
  carrot: { id: 'carrot', name: 'Carrot', traits: ['orange', 'long', 'leaftop'] },
  peas: { id: 'peas', name: 'Peas', traits: ['green', 'pod'] },
  radish: { id: 'radish', name: 'Radish', traits: ['white', 'long', 'leaftop'] },
};

const weight = (t: Trait) => ((COLOURS as readonly string[]).includes(t) ? 1 : 2);

/** How alike two things look to Bit: shared colour counts 1, each shared shape or part counts 2. */
export function likeness(a: Thing, b: Thing): number {
  return a.traits.filter((t) => b.traits.includes(t)).reduce((sum, t) => sum + weight(t), 0);
}

export type Example = { thing: ThingId; basket: number };
export type Guess = { basket: number | null; because: ThingId | null };

/**
 * Bit's guess for `thing`: the basket of the most alike example. When examples in different baskets
 * are equally alike, the basket with more of them wins; if that's a draw too (or nothing is alike at
 * all), Bit isn't sure (basket null).
 */
export function guess(examples: Example[], thing: ThingId): Guess {
  const target = THINGS[thing];
  let best = 0;
  let closest: Example[] = [];
  for (const e of examples) {
    const score = likeness(target, THINGS[e.thing]);
    if (score > best) [best, closest] = [score, [e]];
    else if (score === best && score > 0) closest.push(e);
  }
  if (!closest.length) return { basket: null, because: null };
  const votes = new Map<number, number>();
  for (const e of closest) votes.set(e.basket, (votes.get(e.basket) ?? 0) + 1);
  const ranked = [...votes.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) return { basket: null, because: null };
  return { basket: ranked[0][0], because: closest.find((e) => e.basket === ranked[0][0])!.thing };
}

// ---------------------------------------------------------------- the five lessons

export type Basket = { label: string; icon: ThingId };

/** One round: the child sorts `teach` (or they arrive already sorted), then Bit sorts `test`. */
export type Round = {
  teach: { thing: ThingId; answer: number }[];
  test: { thing: ThingId; answer: number }[];
  /** Pictures that were sorted before this round started ("someone else taught Bit"). */
  presorted?: { thing: ThingId; answer: number }[];
};

export type Lesson = {
  id: string; // lab-1 ... lab-5 (also the id used for stars and play stats)
  title: string;
  icon: ThingId; // its picture on the lab's lesson path
  question: string; // Bit asks this while the child sorts
  baskets: Basket[];
  rounds: Round[];
  /** Lesson 4: the first round is meant to go wrong, to show what too few kinds of examples do. */
  muddle?: { says: string };
  card: { title: string; line: string; grownUps: string };
  badge: { name: string; gift: 'scarf' | 'star' | 'headphones' | 'glasses' | 'cape' };
};

const F = 0; // first basket
const N = 1; // second basket

export const LESSONS: Lesson[] = [
  {
    id: 'lab-1',
    icon: 'apple',
    title: 'Fruit or not?',
    question: 'Is it a fruit? Show me!',
    baskets: [{ label: 'Fruit', icon: 'apple' }, { label: 'Not fruit', icon: 'ball' }],
    rounds: [
      {
        teach: [{ thing: 'apple', answer: F }, { thing: 'banana', answer: F }, { thing: 'grapes', answer: F }, { thing: 'ball', answer: N }, { thing: 'shoe', answer: N }, { thing: 'car', answer: N }],
        test: [{ thing: 'mango', answer: F }, { thing: 'redshoe', answer: N }, { thing: 'strawberry', answer: F }],
      },
    ],
    card: {
      title: 'You taught Bit!',
      line: 'AI learns from examples, just like Bit learned from you.',
      grownUps: 'Bit compares each new picture with the examples your child sorted and copies the closest one. Simple AI really works like this: it learns from examples.',
    },
    badge: { name: 'AI Trainer', gift: 'scarf' },
  },
  {
    id: 'lab-2',
    icon: 'butterfly',
    title: 'Can it fly?',
    question: 'Can it fly? Show me!',
    baskets: [{ label: 'Can fly', icon: 'butterfly' }, { label: "Can't fly", icon: 'goat' }],
    rounds: [
      {
        teach: [{ thing: 'parrot', answer: F }, { thing: 'butterfly', answer: F }, { thing: 'plane', answer: F }, { thing: 'goat', answer: N }, { thing: 'tortoise', answer: N }, { thing: 'train', answer: N }],
        test: [{ thing: 'bee', answer: F }, { thing: 'cow', answer: N }, { thing: 'car', answer: N }],
      },
    ],
    card: {
      title: 'Bit spotted the wings!',
      line: 'Everything that flew had wings, so Bit learned to look for wings.',
      grownUps: 'AI finds the patterns hidden in its examples. Here every flyer had wings, so wings became the clue Bit used.',
    },
    badge: { name: 'Wing Spotter', gift: 'star' },
  },
  {
    id: 'lab-3',
    icon: 'fire',
    title: 'Hot or cold?',
    question: 'Hot or cold? Show me!',
    baskets: [{ label: 'Hot', icon: 'fire' }, { label: 'Cold', icon: 'snowflake' }],
    rounds: [
      {
        teach: [{ thing: 'chai', answer: F }, { thing: 'sun', answer: F }, { thing: 'soup', answer: F }, { thing: 'kulfi', answer: N }, { thing: 'snowman', answer: N }, { thing: 'icecube', answer: N }],
        test: [{ thing: 'fire', answer: F }, { thing: 'icecream', answer: N }, { thing: 'snowflake', answer: N }],
      },
    ],
    card: {
      title: 'Hot and cold!',
      line: 'Bit learned that steam and glowing things are hot, and ice and snow are cold.',
      grownUps: 'With a few good examples of each group, AI can sort things it has never seen before.',
    },
    badge: { name: 'Hot and Cold Pro', gift: 'headphones' },
  },
  {
    id: 'lab-4',
    icon: 'cherry',
    title: 'Bit gets muddled',
    question: 'Help Bit! Is it a fruit?',
    baskets: [{ label: 'Fruit', icon: 'apple' }, { label: 'Not fruit', icon: 'ball' }],
    rounds: [
      {
        // Someone taught Bit with only RED fruits...
        presorted: [{ thing: 'apple', answer: F }, { thing: 'cherry', answer: F }, { thing: 'strawberry', answer: F }, { thing: 'ball', answer: N }, { thing: 'book', answer: N }, { thing: 'car', answer: N }],
        teach: [],
        test: [{ thing: 'redball', answer: N }, { thing: 'mango', answer: F }],
      },
      {
        teach: [{ thing: 'redball', answer: N }, { thing: 'banana', answer: F }, { thing: 'redcar', answer: N }],
        test: [{ thing: 'redbook', answer: N }, { thing: 'grapes', answer: F }],
      },
    ],
    muddle: { says: 'Oops! I only ever saw RED fruits, so I thought red and round means fruit. Teach me more!' },
    card: {
      title: 'You fixed Bit!',
      line: 'AI needs lots of different examples. With only red fruits, Bit got muddled.',
      grownUps: 'If an AI only sees one kind of example, it learns the wrong clue (here: "red means fruit"). More varied examples fix it. Real AI has this problem too.',
    },
    badge: { name: 'Muddle Fixer', gift: 'glasses' },
  },
  {
    id: 'lab-5',
    icon: 'carrot',
    title: 'Three baskets',
    question: 'Fruit, vegetable or toy?',
    baskets: [{ label: 'Fruit', icon: 'apple' }, { label: 'Vegetable', icon: 'carrot' }, { label: 'Toy', icon: 'ball' }],
    rounds: [
      {
        teach: [{ thing: 'apple', answer: 0 }, { thing: 'banana', answer: 0 }, { thing: 'carrot', answer: 1 }, { thing: 'peas', answer: 1 }, { thing: 'ball', answer: 2 }, { thing: 'car', answer: 2 }],
        test: [{ thing: 'radish', answer: 1 }, { thing: 'grapes', answer: 0 }, { thing: 'bluecar', answer: 2 }],
      },
    ],
    card: {
      title: 'Super sorter!',
      line: 'AI can sort things into lots of groups, not just two.',
      grownUps: 'The same idea works with any number of groups: each new picture goes with its most alike example.',
    },
    badge: { name: 'Super Sorter', gift: 'cape' },
  },
];

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);

/** The child's pictures for a round, in a new order every play. */
export const teachOrder = (round: Round, rand: () => number) => shuffled(round.teach, rand);

/** 3 stars if Bit got everything right the first time it tried, 2 after one more go, 1 after that. */
export function teachStars(retries: number): 1 | 2 | 3 {
  return retries === 0 ? 3 : retries === 1 ? 2 : 1;
}

/** A lesson opens once the one before it has stars. */
export function lessonOpen(index: number, stars: Record<string, number>): boolean {
  return index === 0 || (stars[LESSONS[index - 1].id] ?? 0) > 0;
}

/** Bit's gifts so far: one for every lesson finished (he wears them on the lab screens). */
export function bitGifts(labStars: Record<string, number>): Lesson['badge']['gift'][] {
  return LESSONS.filter((l) => labStars[l.id]).map((l) => l.badge.gift);
}

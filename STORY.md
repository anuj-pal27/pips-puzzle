# Pip's Big Picture: the story behind the levels

> *"Every friend is a piece of the big picture."* (Pip)

**The opening story.** At the very top of India, in the snowy mountains of Jammu & Kashmir, is a little station,
Jalebi Junction: Pip's home. "Every puzzle piece belongs to a big picture," says Pip, the puzzle piece. "But
where is mine?" Gappu shows Pip an old map of the world: "Your big picture is out there!" So Pip sets off to meet
a friend in every place, everyone from home comes too, and Gappu packs a basket of jalebis for the
**Jalebi Express**. (Five pages, read aloud, before the first time a child opens the puzzles:
`app/src/data/opening.ts`.)

This is Chapter 1 of a trip round the world: India. The train runs down the country, from the top to the very
tip. At every stop the friends meet someone new, join in with their festival, try their food and solve their
puzzles. When a level is done, the new friend hops on the train with a gift for the **Friendship Mela**, which
is held at the end of India, at Kanyakumari, on Diwali night. The last jigsaw is **The Big Picture**: every
friend together, under the lights. Then: "Where next? The whole world!"

The train goes from neighbour to neighbour, so the line on the map never jumps across the country. Ten stops are
built; the full plan has 35, plus two islands by boat, and new stops slot in between these ones
([ROUTE.md](ROUTE.md)).

```
 1 Jammu & Kashmir ─► 2 Punjab ─► 3 The Hills (Darjeeling & Sikkim)
                                            │
 5 Rajasthan ◄───────────────────── 4 Kolkata
   │
 6 Gujarat ─► 7 Mumbai
                 │
              8 Tamil Nadu ─► 9 Kerala ─► 10 Kanyakumari: Diwali, the Friendship Mela
```

Each level keeps the id it was released with (the Hills are level 9 inside the code and the server, but the
third stop on the trip): stars, story cards and voice clips are saved by id, so nobody loses anything when stops
move or new ones are added. The app shows the stop's place on the trip.

## The friends

The six friends from Jalebi Junction ride the whole way: **Gappu** the goat (runs the jalebi shop),
**Mithu** the parrot, **Tillu** the tortoise, **Chunnu** the cheeky monkey (he's the monkey in every maze),
**Gauri** the cow, and **Pip**. Eight new friends join them, one per stop:

| Stop | Friend | From | What makes them *them* | Gift for the Mela |
|---|---|---|---|---|
| 2 | **Bholu** the water buffalo | Punjab | Gentle and strong; plays the dhol at Baisakhi; orange phulkari scarf | His dhol (drum) |
| 3 | **Momo** the red panda | Sikkim | Fluffy striped tail, white mask; rides the toy train; loves momos | Momos |
| 4 | **Bagha** the tiger | West Bengal (Sundarbans) | Shy and kind; red-and-white Durga Puja scarf; sweet tooth | Rasgullas |
| 5 | **Kesar** the camel | Rajasthan | Long lashes, pom-pom headband, mirror-work saddle cloth; loves puppet shows | Kathputli puppets |
| 6 | **Raja** the Asiatic lion | Gujarat (Gir forest) | Big friendly mane; never misses Uttarayan, the kite festival | Kites |
| 7 | **Chikki** the mouse | Mumbai | Tiny and quick, in a yellow monsoon raincoat; makes modaks at Ganesh Chaturthi | Modaks |
| 8 | **Mayil** the peacock | Tamil Nadu | Shining blue, a fan of eyes; draws a kolam every morning; Pongal | Sugarcane |
| 9 | **Appu** the elephant | Kerala | Golden nettipattam on his forehead; cheers at the snake-boat race | Flowers for the pookalam |

Each friend's state animal or best-known animal: the camel is Rajasthan's state animal, Gir is the only wild
home of Asiatic lions, the elephant is Kerala's state animal, the peacock is India's national bird, the
Bengal tiger is the national animal, and the red panda is Sikkim's state animal. The mouse is the friend of
Ganesha, whose festival Mumbai is famous for. *Mayil* is Tamil for peacock; *Bagha* comes from *bagh*, tiger.

## The levels

Each level opens with a story card (a picture of the new place and two or three lines to read aloud), has
five or six puzzles that each tell a small moment, and ends with "*Friend* is coming to the Mela!".
A level opens once four puzzles in the stop before have a star, so one tricky puzzle never blocks a child, and
a stop the child already has a star in stays open.

| Stop (id) | Place | Festival / culture | Puzzles |
|---|---|---|---|
| 1 (1) | **Jammu & Kashmir: Jalebi Junction** (home) | Snowy mountains, apple trees, the jalebi shop, getting ready to go | Gappu jigsaw · Who's Coming Along? (shadows) · Pack the Snacks (snap) · Chunnu jigsaw · Jalebi Hunt (maze) · All Aboard! (station jigsaw) |
| 2 (2) | **Punjab: Golden Fields** | Baisakhi harvest, mustard fields, dhol, lassi, makki di roti | Meet Bholu · Baisakhi Snap · Shadows in the Mustard · Train Through the Fields (tracks) · Find Bholu's Dhol (maze) |
| 3 (9) | **The Hills: Darjeeling & Sikkim** | The toy train, tea gardens, Kanchenjunga, momos | Meet Momo · Toy Train in the Hills (slide) · Picnic Snap · Hill Hunt (maze) · Loops in the Hills (tracks) |
| 4 (8) | **Kolkata: City of Joy** | Durga Puja, alpana, Howrah Bridge, yellow taxis, rasgulla, mishti doi | Meet Bagha · Mishti Snap · Shadows by the River · Durga Puja Alpana (rangoli) · Howrah Express (tracks) |
| 5 (3) | **Rajasthan: Desert Fair** | Pushkar fair, kathputli puppets, Mandana floor art, ghevar, dal baati | Meet Kesar · Mandana Pattern (rangoli) · Desert Shadows · Desert Snap · Puppet Hunt (maze) |
| 6 (4) | **Gujarat: Kite Festival** | Uttarayan kites, garba, dhokla, fafda with jalebi | Meet Raja · Kite Day Express (tracks) · Farsan Snap · Rooftop Shadows · Kites in the Sky (slide) |
| 7 (5) | **Mumbai: Monsoon City** | Rain, local trains, Ganesh Chaturthi, vada pav, modaks | Meet Chikki · Modak Hunt (maze) · Chaturthi Rangoli · Chowpatty Snack Snap · Monsoon Local (tracks) |
| 8 (7) | **Tamil Nadu: Temple Town** | Pongal, kolam, sugarcane, idli and dosa, temple towers | Meet Mayil · Pongal Kolam (rangoli) · Temple Town Tracks · Peacock Shadows · Tiffin Snap |
| 9 (6) | **Kerala: Backwaters** | Onam, pookalam flower carpets, snake-boat races, coconut palms | Meet Appu · Backwater Shadows · Onam Pookalam (rangoli) · Snake Boat Race (slide) · Backwater Express (tracks) |
| 10 (10) | **Kanyakumari: Diwali by the Sea** | The very tip of India, diyas, lanterns, mithai from everywhere, the Mela | Gappu's Diwali Shop · Diwali Express · Lamplight Shadows · Mithai Snap · Lantern Walk · **The Big Picture** |

Getting harder, stop by stop along the trip: jigsaws grow from 6 to 24 pieces (spinning pieces at the last
stop), shadows from 3 friends to 6 with a friend who has no shadow, Snack Snap from 3 pairs (with a peek) to 8,
tracks from 4 × 4 to 6 × 6 with decoy pieces, mazes add levers, monkeys and a switch, and rangoli patterns grow
from three plain rings to six rings in two colours. The difficulty goes with the place on the trip, not the place
in India: when stops move, their puzzles are made easier or harder to fit.

## Rangoli, the new game

Floor art made for festivals all over India, in many styles. The child sees a finished pattern, picks a
colour pot and taps a ring; every matching petal fills at once, the way a rangoli repeats round and round.
Make it look like the picture to win. The same game appears in five regional styles:

| Style | Where | Look |
|---|---|---|
| Alpana | Bengal | White rice paste on red |
| Mandana | Rajasthan | White and yellow on red earth |
| Rangoli | Maharashtra, all over India | Bright powder colours |
| Kolam | Tamil Nadu | White rice-flour lines with a little colour, on a dark doorstep |
| Pookalam | Kerala, at Onam | Flower petals: marigold, white, purple, green leaves |

Every level's puzzles have their own Pip's fact on the finish screen: a short, true fact about that place,
its food, festival or animal.

## Where it lives in the code

- `app/src/data/levels.ts`: the levels in trip order (place, friend, colours, decoration, story card text,
  finale text), and `stopNumber`, a level's place on the trip
- `app/src/data/puzzles.ts`: every built-in puzzle, in trip order (52 of them)
- `app/src/data/opening.ts`, `app/src/app/opening.tsx`: the opening story
- `app/src/data/route.ts`: the whole trip, built stops and stops to come, with where each is on the map;
  `app/src/components/IndiaMap.tsx`: the map of India on the journey screen and on each story card
- `app/src/app/story/[level].tsx`: the story card; `app/src/components/LevelParty.tsx`: a level's finale
- `app/src/data/howTo.ts`: the line each game says when it opens ("Drag each friend onto their shadow!"), in English
  and Hindi, for children who can't read yet
- `app/src/data/voice.ts`: the narrator's lines in each stop's language (Punjabi in Punjab, Gujarati in Gujarat,
  Tamil at Kanyakumari…) and the opening story in Hindi; `npm run voice` turns them into `app/assets/voice/`
  with one female voice (Sarvam AI)
- `app/src/game/rangoli.ts`, `app/src/app/rangoli/[id].tsx`: the Rangoli game
- `app/scripts/art/`: the art kit; `npm run art` draws every friend, place, snack and gift
- `backend/content/ids.py`: the same levels, friends, snacks and pictures, for the server's checks

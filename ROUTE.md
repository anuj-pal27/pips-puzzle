# Pip's World Tour, Chapter 1: India (the plan)

> *"Every friend is a piece of the big picture."* (Pip)

**Status: step 1 under way.** The 10 stops already made run in this order (J&K first, Kanyakumari last), with
the opening story and the map of India showing every stop below as "coming soon" until it's built
(`app/src/data/route.ts`), and every game saying how to play when it opens (`app/src/data/howTo.ts`). [STORY.md](STORY.md) describes the game as it is
today; this file is where it is going.

## The story

### The opening story (before the first stop, read aloud)

1. At the very top of India, in the snowy mountains, is a little station: Pip's home.
2. "Every puzzle piece belongs to a big picture," said Pip. "But where is mine?"
3. Gappu showed Pip an old map of the world. "Your big picture is out there!"
4. "Let's meet a friend in every place!" said Pip. "We're coming too!" said everyone.
5. Gappu packed a basket of jalebis, and the Jalebi Express went *choo choo!*

It plays once, the first time a child opens the puzzles, and again from the book button on the home screen
(`app/src/data/opening.ts`). Pip is never "he" or "she", in any language.

### How the trip works

- **Pip is the hero the whole way.** The Jalebi Junction friends ride from the start: Gappu (drives the train and
  runs the jalebi shop), Mithu, Tillu, Chunnu (the monkey in every maze) and Gauri.
- **One new friend gets on at every stop, and stays on.** The train grows a carriage longer each time.
- **Every stop**: a story card, then 5 puzzles (3 at a small stop). When it's done, the friend hops on with
  something from home to share.
- **Neighbour to neighbour, top to bottom.** The next stop always borders the last one, so the line on the map
  never jumps across the country. It runs in four parts, like rows on a snakes-and-ladders board.
- **India ends at Kanyakumari**, the very tip, where three seas meet. Diwali night on the beach, everyone's
  things shared out, and The Big Picture jigsaw of every friend so far. Then: "Where next? The whole world!"
  Each later chapter (a country or a region of the world) ends the same way, so a child always gets an ending
  while the trip goes on.
- **Stops not built yet** show as grey "coming soon" pins on the map and are skipped, so the game is always
  playable.

## The route

35 stops, plus two islands reached by boat. ✅ = puzzles already made (they move here from today's 10 levels).

| # | Stop | Friend | | # | Stop | Friend |
|---|---|---|---|---|---|---|
| | **Part 1: the north** | | | | **Part 3: across the middle** | |
| 1 | Jammu & Kashmir ✅ | Zooni the hangul (new) | | 19 | West Bengal ✅ | Bagha the tiger |
| 2 | Ladakh | Norbu the yak | | 20 | Jharkhand | Koku the koel |
| 3 | Himachal Pradesh | Himu the snow leopard | | 21 | Odisha | Kuni the sea turtle |
| 4 | Punjab ✅ | Bholu the buffalo | | 22 | Chhattisgarh | Gunja the hill myna |
| 5 | Chandigarh (small) | Tinku the squirrel | | 23 | Madhya Pradesh | Baru the barasingha |
| 6 | Haryana | Veeru the blackbuck | | 24 | Rajasthan ✅ | Kesar the camel |
| 7 | Delhi | Mini the sparrow | | 25 | Gujarat ✅ | Raja the lion |
| 8 | Uttarakhand | Monu the monal | | 26 | Daman & Diu, Dadra & Nagar Haveli (small) | Kekdu the crab |
| 9 | Uttar Pradesh | Sarita the sarus crane | | 27 | Maharashtra ✅ | Chikki the mouse |
| 10 | Bihar | Susu the river dolphin | | | **Part 4: the south** | |
| | **Part 2: the north-east** | | | 28 | Goa | Ruby the bulbul |
| 11 | Assam | Rongo the rhino | | 29 | Karnataka | Neeli the Indian roller |
| 12 | Arunachal Pradesh | Hoolu the hoolock gibbon | | 30 | Telangana | Chitti the spotted deer |
| 13 | Nagaland | Tuki the hornbill | | 31 | Andhra Pradesh | Pelu the pelican |
| 14 | Manipur | Sana the sangai deer | | ⛴ | Andaman & Nicobar (boat) | Dugu the dugong |
| 15 | Mizoram | Mawii the serow | | 32 | Puducherry (small) | Bijou the cat |
| 16 | Tripura | Chashma the leaf monkey | | 33 | Tamil Nadu ✅ | Mayil the peacock |
| 17 | Meghalaya | Badal the clouded leopard | | 34 | Kerala ✅ | Appu the elephant |
| 18 | Sikkim & Darjeeling ✅ | Momo the red panda | | ⛴ | Lakshadweep (boat) | Tara the butterflyfish |
| | | | | 35 | Kanyakumari ✅ | India's finale: Diwali |

Notes on the route:

- **Ladakh comes right after J&K**, because Ladakh only borders J&K and Himachal. Going J&K → Ladakh → Himachal
  → Punjab keeps every hop between neighbours.
- **Delhi → Uttarakhand** crosses a small corner of Uttar Pradesh, and **Uttarakhand → Uttar Pradesh** comes
  back down into it.
- **The north-east is a loop.** The only way in and out is the narrow strip of North Bengal near Siliguri. The
  train goes in to Assam, round the "Seven Sisters", and comes out through Sikkim, the sisters' "brother". The
  Darjeeling toy train then rolls down to Kolkata.
- **Andaman & Nicobar and Lakshadweep are boat trips**: short bonus stops that leave from Andhra Pradesh and
  Kerala. Boats are also how the train will leave India for the world.
- **Friend names are only suggestions**, easy to change. None of them clash with a snack name (so no "Barfi").

## What every new stop needs

- **Art** (drawn by the art kit, `npm run art`): the friend (their mystery shadow is made from the same
  drawing), the place picture (story card and jigsaw), 3 or 4 local foods for Snack Snap, and the thing the
  friend brings.
- **A look**: background and accent colours, a decoration along the top, and music.
- **Puzzles**: "Meet *friend*" (jigsaw) first, then 4 of shadows, snap, tracks, maze, slide and rangoli, with no
  two of the same kind in a row. A small stop has 3.
- **Words, in English and Hindi**: the story card (3 lines), the finale (2 lines), and each puzzle's title,
  cheer, blurb and Pip's fact.
- **Voice**: the story card and the finale, in the place's own language where the voice service has it
  (Sarvam covers Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Odia and
  English). Otherwise in Hindi with a local hello, as Rajasthan and the Hills do today. Plus the Hindi and English
  versions for the language choices.

## The stops

Stops marked ✅ keep their puzzles. They move to their new place in the route, and their difficulty is set by
their new position (see *Difficulty* below).

### Part 1: the north

**1 · Jammu & Kashmir ✅**: *Zooni the hangul, the Kashmir stag* (new) · voice: Hindi, with a Kashmiri hello
- Pip's home station, Jalebi Junction, moves here. Today's level 1 puzzles stay, redrawn with snow and Kashmir
  touches: Dal Lake shikaras, the tulip garden, chinar trees, apple orchards.
- Festival: the Tulip Festival in spring, in Srinagar
- Food cards: kahwa (saffron tea), apples, walnuts, plus today's jalebi and chai
- Brings: a basket of apples
- Pip's fact: The Chenab Bridge in Jammu & Kashmir is the highest railway bridge in the world.
- Puzzles: today's six, with the Chunnu jigsaw turned into *Meet Zooni*

**2 · Ladakh**: *Norbu the yak* · voice: Hindi, with "Julley!"
- Sights: monasteries on the hills, prayer flags, blue lakes, two-humped camels in Nubra
- Festival: Hemis, with masked dances at the monastery
- Food cards: thukpa, apricots, butter tea, khambir bread
- Brings: a string of prayer flags
- Pip's fact: Ladakh is a cold desert: very high up, very dry and very cold.
- Puzzles: Meet Norbu (jigsaw) · Sand Mandala (rangoli) · Two-Hump Shadows · Apricot Snap · Monastery Maze

**3 · Himachal Pradesh**: *Himu the snow leopard* · voice: Hindi
- Sights: snowy peaks, wooden temples, apple orchards, the Kalka–Shimla toy train
- Festival: Kullu Dussehra, when villages carry their gods to the fair
- Food cards: siddu (steamed bread), babru, madra
- Brings: a bright Himachali topi (cap)
- Pip's fact: The Kalka–Shimla toy train goes through more than 100 tunnels.
- Puzzles: Meet Himu (jigsaw) · Tunnel Tracks · Snowy Shadows · Siddu Snap · Orchard Maze

**4 · Punjab ✅**: *Bholu the buffalo*. No change apart from difficulty.

**5 · Chandigarh** (small stop): *Tinku the squirrel* · voice: Hindi
- Sights: Nek Chand's Rock Garden, with statues made of broken bangles, plates and tiles
- Brings: a little mosaic made of bangle bits
- Pip's fact: The Rock Garden is made from broken things that people threw away.
- Puzzles: Meet Tinku (jigsaw) · Mosaic Pattern (rangoli) · Rock Garden Maze

**6 · Haryana**: *Veeru the blackbuck* · voice: Hindi, with "Ram Ram!"
- Sights: green wheat fields, wrestlers in the akhada, the Surajkund crafts fair
- Festival: the Surajkund Mela
- Food cards: bajra roti with white butter, churma, kadhi
- Brings: a pot of fresh white butter
- Pip's fact: Blackbucks can run as fast as a car on a big road.
- Puzzles: Meet Veeru (jigsaw) · Mela Snap · Field Tracks · Wrestler Shadows · Butter Pot Maze (Chunnu took the butter!)

**7 · Delhi**: *Mini the sparrow* · voice: Hindi
- Sights: India Gate, the Red Fort, the Qutub Minar, the Metro
- Festival: the Republic Day parade on 26 January
- Food cards: chole bhature, aloo chaat, paranthe
- Brings: a little Indian flag
- Pip's fact: The Qutub Minar is the tallest brick minaret in the world.
- Puzzles: Meet Mini (jigsaw) · Metro Tracks · Chaat Snap · Monument Shadows · Parade Slide

**8 · Uttarakhand**: *Monu the monal* (a bird with rainbow feathers) · voice: Hindi
- Sights: the Valley of Flowers, the Ganga at Rishikesh, temples in the hills
- Festival: Phool Dei, when children put flowers on every doorstep in spring
- Food cards: bal mithai, aloo ke gutke, singori (a sweet in a leaf cone)
- Brings: a box of bal mithai
- Pip's fact: The river Ganga starts from an icy glacier in Uttarakhand.
- Puzzles: Meet Monu (jigsaw) · Phool Dei Flowers (rangoli) · River Raft Maze · Mountain Shadows · Mithai Snap

**9 · Uttar Pradesh**: *Sarita the sarus crane* · voice: Hindi
- Sights: the Taj Mahal, the ghats of Varanasi, Mathura
- Festival: Holi, which lasts for days in Mathura and Vrindavan
- Food cards: Agra petha, Mathura peda, lassi in a kulhad
- Brings: bags of gulal, Holi colours
- Pip's fact: The sarus crane is the tallest flying bird in the world, as tall as a grown-up!
- Puzzles: Meet Sarita (jigsaw) · Holi Colours (rangoli) · Taj Mahal Slide · Peda Snap · Riverside Tracks

**10 · Bihar**: *Susu the river dolphin* · voice: Hindi, with "Pranam!"
- Sights: the river Ganga, the old university at Nalanda, Madhubani paintings
- Festival: Chhath Puja, when families thank the sun by the river
- Food cards: litti chokha, thekua, makhana
- Brings: a basket of thekua
- Pip's fact: The Ganges river dolphin can hardly see. It finds its way by listening!
- Puzzles: Meet Susu (jigsaw) · Madhubani Pattern (rangoli, a new style) · River Shadows · Litti Snap · Chhath Tracks

### Part 2: the north-east

**11 · Assam**: *Rongo the rhino* · voice: Hindi, with an Assamese hello
- Sights: Kaziranga's tall grass, tea gardens, the wide Brahmaputra river
- Festival: Bihu, danced to the dhol and the pepa (a buffalo-horn pipe)
- Food cards: til pitha, laru, Assam tea
- Brings: a gamosa, the red-and-white Assamese cloth
- Pip's fact: Most of the world's one-horned rhinos live in Kaziranga.
- Puzzles: Meet Rongo (jigsaw) · Tea Garden Maze · Pitha Snap · Kaziranga Shadows · Ferry Slide

**12 · Arunachal Pradesh**: *Hoolu the hoolock gibbon* · voice: Hindi
- Sights: misty mountains, the Tawang monastery, bamboo houses
- Festival: Losar, the new year, in Tawang
- Food cards: khura (buckwheat pancakes), zan, thukpa
- Brings: a bamboo basket
- Pip's fact: Arunachal Pradesh sees the sun rise before anywhere else in India.
- Puzzles: Meet Hoolu (jigsaw) · Sunrise Tracks · Tawang Shadows · Jungle Swing Maze · Khura Snap

**13 · Nagaland**: *Tuki the hornbill* · voice: Hindi
- Sights: green hills, Kohima, the festival village of Kisama
- Festival: the Hornbill Festival in December, "the festival of festivals"
- Food cards: galho (rice porridge), sticky rice
- Brings: a bright Naga shawl
- Pip's fact: A hornbill's big beak is light, because it is hollow inside.
- Puzzles: Meet Tuki (jigsaw) · Festival Shadows · Shawl Pattern (rangoli) · Hill Tracks · Galho Snap

**14 · Manipur**: *Sana the sangai deer* · voice: Hindi
- Sights: Loktak Lake and its floating islands, Manipuri dance, polo
- Festival: the Sangai Festival
- Food cards: chak-hao kheer (black rice pudding), singju
- Brings: a pot of black rice kheer
- Pip's fact: Loktak Lake has the only floating national park in the world, and that's where the sangai lives.
- Puzzles: Meet Sana (jigsaw) · Floating Island Maze · Polo Shadows · Lake Slide · Kheer Snap

**15 · Mizoram**: *Mawii the serow* (a mountain goat-antelope) · voice: Hindi
- Sights: blue hills, bamboo forests, Aizawl's houses on the hillside
- Festival: Chapchar Kut in spring, with Cheraw, the bamboo dance
- Food cards: bai (vegetable stew), sticky rice
- Brings: bamboo poles for the bamboo dance
- Pip's fact: In the bamboo dance, dancers hop in and out of clapping bamboo poles.
- Puzzles: Meet Mawii (jigsaw) · Bamboo Tracks · Hillside Shadows · Bamboo Maze · Bai Snap

**16 · Tripura**: *Chashma the leaf monkey* (white rings round the eyes, like glasses) · voice: Bengali
- Sights: Neermahal, the palace in a lake; Ujjayanta Palace
- Festival: Kharchi Puja
- Food cards: queen pineapple, jackfruit
- Brings: a basket of pineapples
- Pip's fact: Neermahal is a palace in the middle of a lake.
- Puzzles: Meet Chashma (jigsaw) · Lake Palace Slide · Pineapple Snap · Palace Shadows · Boat Maze

**17 · Meghalaya**: *Badal the clouded leopard* · voice: Hindi, with "Khublei!" (Khasi for thank you)
- Sights: waterfalls, clouds in the valleys, living root bridges
- Festival: Wangala, the festival of a hundred drums
- Food cards: pukhlein (a jaggery sweet), Khasi oranges
- Brings: a knup, a bamboo rain shield
- Pip's fact: In Meghalaya, people grow bridges from the roots of living trees.
- Puzzles: Meet Badal (jigsaw) · Root Bridge Tracks · Cloudy Shadows · Waterfall Slide · Pukhlein Snap

**18 · Sikkim & Darjeeling ✅**: *Momo the red panda*. It now comes out of the north-east, and its toy train
rolls down to Kolkata.

### Part 3: across the middle

**19 · West Bengal ✅**: *Bagha the tiger*. No change apart from difficulty.

**20 · Jharkhand**: *Koku the koel* · voice: Hindi, with "Johar!"
- Sights: forests, Hundru Falls, mud houses painted with Sohrai art
- Festival: Sarhul, the spring festival of the sal tree's flowers
- Food cards: dhuska, chilka roti
- Brings: a painted clay pot
- Pip's fact: Jharkhand means "the land of forests".
- Puzzles: Meet Koku (jigsaw) · Sohrai Wall Pattern (rangoli) · Forest Shadows · Waterfall Maze · Dhuska Snap

**21 · Odisha**: *Kuni the sea turtle* (an Olive Ridley; Tillu finds a cousin!) · voice: Odia
- Sights: Puri beach, the giant Rath Yatra chariots, the stone wheels of the Konark sun temple
- Festival: Rath Yatra, when huge chariots are pulled through the streets
- Food cards: chhena poda, khaja, pakhala
- Brings: a box of chhena poda
- Pip's fact: Every year, thousands of Olive Ridley turtles come to Odisha's beaches together to lay their eggs.
- Puzzles: Meet Kuni (jigsaw) · Baby Turtles to the Sea (maze) · Konark Wheel (rangoli) · Chariot Tracks · Chhena Snap

**22 · Chhattisgarh**: *Gunja the hill myna* · voice: Hindi, with "Jai Johar!"
- Sights: Chitrakote waterfall, the forests of Bastar, dhokra metal toys
- Festival: Bastar Dussehra, which lasts 75 days
- Food cards: chila, fara (steamed rice dumplings)
- Brings: a little dhokra metal horse
- Pip's fact: The hill myna can copy people's voices!
- Puzzles: Meet Gunja (jigsaw) · Dhokra Shadows · Waterfall Slide · Forest Tracks · Fara Snap

**23 · Madhya Pradesh**: *Baru the barasingha* · voice: Hindi
- Sights: the jungles of Kanha (where the Jungle Book stories happen), the round stupa at Sanchi
- Festival: Bhagoria, a fair just before Holi
- Food cards: poha-jalebi (Gappu loves it), bhutte ka kees, dal bafla
- Brings: a big bag of poha
- Pip's fact: "Barasingha" means "twelve horns". Count the points on Baru's antlers!
- Puzzles: Meet Baru (jigsaw) · Jungle Book Maze · Kanha Shadows · Poha Snap · Sanchi Circles (rangoli)

**24 · Rajasthan ✅**: *Kesar the camel*, and **25 · Gujarat ✅**: *Raja the lion*. No change apart from difficulty.

**26 · Dadra & Nagar Haveli and Daman & Diu** (small stop): *Kekdu the crab* · voice: Gujarati
- Sights: Daman's beach and old fort, Warli paintings in the forest villages
- Brings: a Warli painting
- Pip's fact: Warli paintings are made with just circles, triangles and lines.
- Puzzles: Meet Kekdu (jigsaw) · Warli Pattern (rangoli) · Beach Fort Maze

**27 · Maharashtra ✅**: *Chikki the mouse*. No change apart from difficulty.

### Part 4: the south

**28 · Goa**: *Ruby the bulbul* (Goa's bird, with a flame-red throat) · voice: Hindi, with a Konkani hello
- Sights: beaches, white churches, the Konkan Railway running along the sea
- Festival: the Goa Carnival, with floats and music
- Food cards: bebinca, cashews, patoleo
- Brings: a box of bebinca
- Pip's fact: Bebinca is a cake made of many thin layers, one on top of another.
- Puzzles: Meet Ruby (jigsaw) · Konkan Railway Tracks · Carnival Shadows · Beach Slide · Bebinca Snap

**29 · Karnataka**: *Neeli the Indian roller* · voice: Kannada
- Sights: Mysuru Palace lit with thousands of bulbs, the stone chariot at Hampi, Channapatna toy town
- Festival: Mysuru Dasara, when the palace glows and elephants parade (Appu waves from the train)
- Food cards: Mysore pak, bisi bele bath, ragi mudde
- Brings: Channapatna wooden toys
- Pip's fact: Channapatna is called "toy town", and its wooden toys are coloured with colours from plants.
- Puzzles: Meet Neeli (jigsaw) · Palace Lights (rangoli) · Toy Town Shadows · Stone Chariot Slide · Mysore Pak Snap

**30 · Telangana**: *Chitti the spotted deer* · voice: Telugu
- Sights: the Charminar, Golconda fort, pearl shops in Hyderabad
- Festival: Bathukamma, when flowers are stacked into tall, bright towers
- Food cards: Osmania biscuits with Irani chai, sakinalu, double ka meetha
- Brings: a tin of Osmania biscuits
- Pip's fact: A Bathukamma is built in rings of flowers: big at the bottom, small at the top.
- Puzzles: Meet Chitti (jigsaw) · Bathukamma Rings (rangoli) · Charminar Shadows · Golconda Maze · Biscuit Snap

**31 · Andhra Pradesh**: *Pelu the pelican* · voice: Telugu
- Sights: Kolleru Lake and its pelicans, the Godavari river, Kondapalli's wooden toys
- Festival: Sankranti, with muggulu (rangoli) and dolls on display
- Food cards: pootharekulu (paper-thin sweets), Banganapalli mangoes, pesarattu
- Brings: a box of pootharekulu
- Pip's fact: Pootharekulu is a sweet so thin that it looks like paper.
- Puzzles: Meet Pelu (jigsaw) · Muggulu (rangoli) · Kuchipudi Shadows · Godavari Slide · Mango Snap

**⛴ Andaman & Nicobar** (boat trip): *Dugu the dugong* · voice: Hindi
- Sights: white beaches, coral reefs, sea turtles
- Brings: a drawing of the coral reef (taking real shells or coral from the islands isn't allowed)
- Pip's fact: The dugong is also called a "sea cow", because it munches sea grass. (Gauri can't believe it.)
- Puzzles: Meet Dugu (jigsaw) · Coral Reef Shadows · Snorkel Maze

**32 · Puducherry** (small stop): *Bijou the cat* · voice: Tamil, with "Bonjour!"
- Sights: yellow French-style houses, the seaside promenade, Auroville's golden globe
- Brings: fresh bread from a French bakery
- Pip's fact: Some street signs in Puducherry are written in French and Tamil.
- Puzzles: Meet Bijou (jigsaw) · Promenade Slide · Old Town Maze

**33 · Tamil Nadu ✅**: *Mayil the peacock*, and **34 · Kerala ✅**: *Appu the elephant*. No change apart from
difficulty.

**⛴ Lakshadweep** (boat trip): *Tara the butterflyfish* · voice: Malayalam
- Sights: tiny coral islands, blue lagoons
- Pip's fact: Lakshadweep means "a hundred thousand islands", but there are only 36!
- Puzzles: Meet Tara (jigsaw) · Lagoon Shadows · Coral Maze

**35 · Kanyakumari ✅**: India's finale (today's level 10, moved here) · voice: Tamil
- Sights: the very tip of India, the rock in the sea, sunrise and sunset over the water
- Diwali night on the beach: every friend shares what they brought, and The Big Picture jigsaw shows everyone
  (the picture is redrawn with all 35 friends)
- Pip's fact: At Kanyakumari three seas meet: the Arabian Sea, the Bay of Bengal and the Indian Ocean.
- Last line: "Where next? The whole world!"

## Difficulty

Today, puzzles get harder over 10 levels (jigsaws go from 6 to 24 pieces). Over 35 stops:

- **Part 1 is the ramp**, from the easiest puzzles at J&K up to medium by Bihar.
- **Parts 2 to 4 stay between medium and hard**, each with its own small ramp. Every stop keeps one easier
  "breather" puzzle. Jigsaws top out at 24 pieces; ages 3 to 7 don't need more.
- **Difficulty goes with the position, not the place.** The Hills' 24-piece jigsaw becomes easier now that it
  sits mid-trip, and so on. Puzzle ids don't change, so nobody loses stars.

## Build order

1. **Route, story and map** with the 10 stops already made in their new order. Also the opening story, Hindi /
   English / "English + Hindi voice", spoken game instructions, and the India map showing grey "coming soon"
   stops.
2. **Part 1**: Ladakh, Himachal, Chandigarh, Haryana, Delhi, Uttarakhand, Uttar Pradesh, Bihar, and Zooni at J&K.
3. **Part 2**: the seven north-east stops.
4. **Part 3**: Jharkhand, Odisha, Chhattisgarh, Madhya Pradesh, Daman & Diu.
5. **Part 4**: Goa, Karnataka, Telangana, Andhra Pradesh, Puducherry and the two islands.

Each new stop is about 1 friend, 1 or 2 place pictures, 3 or 4 foods, 1 gift, 5 puzzles, about 25 lines of words
(times two languages) and 2 voice clips per language.

## New games the places suggest (optional, later)

- **Holi Colours** (Uttar Pradesh): mix two colours to make a third (red and yellow make orange).
- **Bathukamma Rings** (Telangana): stack flower rings from biggest to smallest.
- **Count the Antlers** (Madhya Pradesh): early counting with Baru's twelve points.
- **Bamboo Dance** (Mizoram): hop when the poles open, a simple rhythm game.
- **Monument Shadows** (Delhi): the shadow game with buildings instead of friends.

## Before anything ships

Every Pip's fact, festival and food here should get a quick check, and the Hindi and local hellos should be read
by someone who speaks the language. Kids and parents will trust what the game says.

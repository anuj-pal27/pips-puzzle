// The new friends who join the train, one per level (STORY.md). Each is drawn in the same 618 x 660 box as
// the original cut-outs (gappu-cut.png etc.): head in the middle, a body cut off by the bottom edge.
// A friend is just SVG text, so the same drawing is the cut-out, the shadow, and the star of their scene.

import {
  BLUSH,
  blush,
  brows,
  bust,
  circle,
  ellipse,
  eyes,
  group,
  INK,
  line,
  path,
  polar,
  put,
  rect,
  scarf,
  shade,
  smile,
  WHITE,
} from './kit.ts';

export type FriendArt = () => string;

// Bholu the water buffalo, from the mustard fields of Punjab. Gentle and strong, sweeping horns, and an
// orange phulkari scarf ("flower work": bright embroidered flowers).
const phulkariFlower = (x: number, y: number, s = 1) =>
  put([path('M0,-14 L10,0 L0,14 L-10,0 Z', '#FFD43B'), path('M0,-7 L5,0 L0,7 L-5,0 Z', '#FF4F79')], { x, y, s });

function bholu() {
  const body = '#5B6476';
  return group([
    bust(body, { belly: '#6E7890' }),
    // horns sweep out and up
    path('M168,210 C70,200 34,120 84,56 C96,120 140,150 222,168 Z', '#EFE5CF'),
    path('M450,210 C548,200 584,120 534,56 C522,120 478,150 396,168 Z', '#EFE5CF'),
    path('M84,56 C70,80 66,100 74,120 C80,96 88,76 104,64 Z', '#CFC3A6'),
    path('M534,56 C548,80 552,100 544,120 C538,96 530,76 514,64 Z', '#CFC3A6'),
    ellipse(126, 254, 62, 30, shade(body, -0.15), { transform: 'rotate(-18 126 254)' }),
    ellipse(492, 254, 62, 30, shade(body, -0.15), { transform: 'rotate(18 492 254)' }),
    ellipse(128, 256, 36, 14, '#E7A0B0', { transform: 'rotate(-18 128 256)' }),
    ellipse(490, 256, 36, 14, '#E7A0B0', { transform: 'rotate(18 490 256)' }),
    ellipse(309, 274, 170, 176, body),
    path('M248,112 Q309,78 370,112 Q340,140 309,134 Q278,140 248,112 Z', shade(body, -0.2)),
    eyes({ y: 250, w: 40, h: 44 }),
    brows(182),
    ellipse(309, 382, 118, 78, '#9AA2B3'),
    ellipse(270, 360, 14, 9, INK),
    ellipse(348, 360, 14, 9, INK),
    smile(309, 394, 40),
    blush(336, 182, 436),
    scarf('#FF6F3C', {
      y: 460,
      w: 168,
      pattern: [phulkariFlower(190, 494), phulkariFlower(250, 514), phulkariFlower(309, 522), phulkariFlower(368, 514), phulkariFlower(428, 494), phulkariFlower(424, 572, 0.8)].join(''),
    }),
  ]);
}

// Kesar the camel, from the desert of Rajasthan: long lashes, a pom-pom headband and a mirror-work saddle cloth.
function kesar() {
  const coat = '#E3B576';
  const mirrors = Array.from({ length: 7 }, (_, i) => {
    const x = 182 + i * 42;
    const y = 616 - Math.abs(i - 3) * 9;
    return circle(x, y, 10, '#FFC93C') + circle(x, y, 6, '#E8F4FF') + circle(x - 2, y - 2, 2, WHITE);
  }).join('');
  return group([
    bust(coat, { rx: 190, cy: 690 }),
    path('M252,350 L366,350 L384,540 L234,540 Z', coat),
    path('M120,610 Q309,470 498,610 L506,660 L112,660 Z', '#D7263D'),
    line('M120,610 Q309,470 498,610', '#FFC93C', 12),
    line('M150,650 Q309,540 468,650', '#2E6FD9', 8),
    mirrors,
    ellipse(152, 186, 36, 22, '#D29E5C', { transform: 'rotate(-30 152 186)' }),
    ellipse(466, 186, 36, 22, '#D29E5C', { transform: 'rotate(30 466 186)' }),
    ellipse(309, 248, 162, 152, coat),
    // curly tuft
    circle(286, 112, 22, '#C98F4E'),
    circle(312, 102, 24, '#C98F4E'),
    circle(338, 114, 20, '#C98F4E'),
    line('M186,150 Q309,94 432,150', '#2E6FD9', 20),
    ...[[206, 152, '#FF4F79'], [252, 126, '#FFD43B'], [309, 116, '#7ED957'], [366, 126, '#FFD43B'], [412, 152, '#FF4F79']].map(([x, y, c]) => circle(x as number, y as number, 17, c as string)),
    eyes({ y: 238, lashes: true, w: 36, h: 40 }),
    ellipse(309, 368, 128, 90, '#F2D3A6'),
    line('M262,336 q10,-12 20,0', INK, 9),
    line('M336,336 q10,-12 20,0', INK, 9),
    smile(309, 386, 44),
    blush(318, 184, 434),
  ]);
}

// Raja the Asiatic lion, from the Gir forest in Gujarat: a big friendly mane, a red bandhani scarf (tie-dye
// dots), and a kite for Uttarayan.
function raja() {
  const mane = Array.from({ length: 16 }, (_, i) => {
    const [x, y] = polar(309, 266, 206, (i * 360) / 16);
    return circle(x, y, 64, i % 2 ? '#E07A2E' : '#C9601F');
  }).join('');
  const bandhani = Array.from({ length: 6 }, (_, i) => {
    const x = 194 + i * 46;
    const y = 506 + Math.abs(i - 2.5) * -6 + 6;
    return [circle(x, y, 4, WHITE), circle(x + 8, y, 4, WHITE), circle(x + 4, y - 7, 4, WHITE), circle(x + 4, y + 7, 4, WHITE)].join('');
  }).join('');
  return group([
    // kite flying from his paw
    path('M524,12 L598,64 L556,146 L482,94 Z', '#FF4F79'),
    path('M524,12 L598,64 L540,79 Z', '#FFD43B'),
    path('M482,94 L540,79 L556,146 Z', '#FFD43B'),
    line('M556,146 q14,22 -6,40 q-18,16 4,34', '#2E6FD9', 6),
    line('M556,146 Q566,330 470,520', INK, 3, { opacity: 0.5 }),
    bust('#F2B544', { rx: 190, belly: '#F7CD72' }),
    circle(309, 266, 212, '#C9601F'),
    mane,
    ellipse(206, 120, 38, 34, '#F2B544'),
    ellipse(412, 120, 38, 34, '#F2B544'),
    ellipse(206, 124, 18, 16, '#E39A35'),
    ellipse(412, 124, 18, 16, '#E39A35'),
    ellipse(309, 270, 162, 160, '#F2B544'),
    eyes({ y: 248 }),
    brows(180, 252, 366, 4),
    ellipse(309, 372, 100, 68, '#FBE7C2'),
    path('M284,334 Q309,322 334,334 Q326,356 309,360 Q292,356 284,334 Z', '#7A3E1E'),
    smile(309, 386, 36),
    ...[[248, 380], [236, 398], [370, 380], [382, 398]].map(([x, y]) => circle(x, y, 4.5, '#C98B3C')),
    blush(332, 188, 430),
    scarf('#D7263D', { y: 458, w: 164, pattern: bandhani }),
  ]);
}

// Chikki the mouse, from Mumbai: huge round ears, a yellow monsoon raincoat, and a modak for Ganesh Chaturthi.
function chikki() {
  const fur = '#A9B2C3';
  return group([
    // raincoat
    bust('#FFC93C', { rx: 176 }),
    path('M220,500 Q309,560 398,500 L380,470 Q309,520 238,470 Z', '#F2B21C'),
    circle(309, 600, 9, '#E09E00'),
    circle(309, 636, 9, '#E09E00'),
    circle(150, 150, 112, fur),
    circle(150, 150, 72, '#F6B8C8'),
    circle(468, 150, 112, fur),
    circle(468, 150, 72, '#F6B8C8'),
    ellipse(309, 290, 152, 146, fur),
    eyes({ y: 266, lx: 262, rx: 356, w: 34, h: 40 }),
    ellipse(309, 372, 84, 60, '#E2E6EE'),
    ellipse(309, 340, 22, 16, '#FF8FA3'),
    line('M288,378 Q309,400 330,378', INK, 8),
    rect(299, 382, 20, 22, WHITE, { rx: 4 }),
    line('M226,352 L148,334 M226,366 L144,374 M392,352 L470,334 M392,366 L474,374', INK, 5),
    blush(332, 210, 408, 18),
    // a modak held up in both paws
    put(
      [
        path('M-60,42 Q-68,-16 0,-70 Q68,-16 60,42 Z', '#FFF1DC'),
        line('M0,-70 Q-22,-16 -30,42 M0,-70 Q0,-6 0,42 M0,-70 Q22,-16 30,42', '#EBC79E', 5),
        circle(0, -70, 10, '#FF9F1C'),
      ],
      { x: 309, y: 566 },
    ),
    ellipse(234, 600, 36, 28, '#C2C9D6'),
    ellipse(384, 600, 36, 28, '#C2C9D6'),
  ]);
}

// Appu the elephant, from Kerala: big ears, trunk up for luck, a golden nettipattam (the forehead decoration
// elephants wear at temple festivals) and a cream-and-gold kasavu cloth.
/** A tapering elephant trunk along a curve: circles that shrink from the face to the tip. */
function trunk(skin: string, dark: string) {
  const P = [[309, 300], [304, 420], [312, 484], [356, 492], [400, 500], [428, 468], [424, 428]];
  const at = (t: number) => {
    const seg = t < 0.5 ? 0 : 1;
    const u = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    const [a, b, c, d] = P.slice(seg * 3, seg * 3 + 4);
    const k = [(1 - u) ** 3, 3 * (1 - u) ** 2 * u, 3 * (1 - u) * u ** 2, u ** 3];
    return [0, 1].map((i) => k[0] * a[i] + k[1] * b[i] + k[2] * c[i] + k[3] * d[i]);
  };
  const out: string[] = [];
  for (let i = 0; i <= 60; i++) {
    const [x, y] = at(i / 60);
    out.push(circle(x, y, 38 - (i / 60) * 16, skin));
  }
  for (const t of [0.3, 0.4, 0.5]) {
    const [x, y] = at(t);
    out.push(line(`M${x - 24},${y - 6} q24,12 48,0`, dark, 6));
  }
  const [tx, ty] = at(1);
  out.push(ellipse(tx, ty - 4, 14, 8, shade(dark, -0.2)));
  return out.join('');
}

function appu() {
  const skin = '#9AA3B8';
  const dark = shade(skin, -0.14);
  const gold = '#FFC93C';
  const discs = [[309, 104], [278, 124], [340, 124], [264, 160], [354, 160], [309, 150], [286, 190], [332, 190]];
  return group([
    ellipse(124, 268, 120, 154, shade(skin, -0.08)),
    ellipse(138, 270, 80, 110, '#F3B6C4'),
    ellipse(494, 268, 120, 154, shade(skin, -0.08)),
    ellipse(480, 270, 80, 110, '#F3B6C4'),
    ellipse(309, 254, 152, 162, skin),
    // kasavu cloth: cream with a gold border, high enough that the trunk shows against it
    path('M96,560 Q309,420 522,560 L560,660 L58,660 Z', '#FAEBC8'),
    line('M84,610 Q309,480 534,610', gold, 16),
    line('M72,646 Q309,520 546,646', gold, 8),
    // tusks, behind the trunk
    path('M262,372 Q236,416 246,458 Q262,428 280,388 Z', WHITE),
    path('M356,372 Q382,416 372,458 Q356,428 338,388 Z', WHITE),
    // mouth peeking out beside the trunk
    path('M252,398 Q270,428 290,404 Z', INK),
    // trunk: down, then curling up and out, getting thinner towards the tip
    trunk(skin, dark),
    // nettipattam
    path('M309,62 L382,104 L372,206 L309,236 L246,206 L236,104 Z', gold),
    ...discs.map(([x, y]) => circle(x, y, 10, '#E09E00')),
    circle(309, 206, 14, '#D7263D'),
    ...[[262, 214], [356, 214], [309, 240]].map(([x, y]) => circle(x, y + 10, 8, gold)),
    eyes({ y: 266, lx: 244, rx: 374, w: 34, h: 40 }),
    blush(336, 204, 414, 20),
  ]);
}

// Mayil the peacock, from Tamil Nadu: shining blue, a crest, a tail fan full of eyes, and a jasmine garland.
function mayil() {
  const blue = '#2E6FD9';
  const feathers = Array.from({ length: 13 }, (_, i) => {
    const deg = -180 + i * 15;
    const [x, y] = polar(309, 430, 280, deg);
    return [
      line(`M309,430 L${x},${y}`, '#2F9E6E', 10),
      ellipse(x, y, 38, 46, '#2FB57B', { transform: `rotate(${deg + 90} ${x} ${y})` }),
      ellipse(x, y, 26, 32, '#FFD43B', { transform: `rotate(${deg + 90} ${x} ${y})` }),
      ellipse(x, y, 20, 25, '#1F7FB8', { transform: `rotate(${deg + 90} ${x} ${y})` }),
      ellipse(x, y + 2, 10, 13, INK, { transform: `rotate(${deg + 90} ${x} ${y})` }),
    ].join('');
  }).join('');
  const scales = Array.from({ length: 4 }, (_, r) =>
    Array.from({ length: 3 + r }, (_, i) => path(`M${280 - r * 14 + i * 28},${392 + r * 26} q14,16 28,0`, 'none', { stroke: '#5C9BF0', 'stroke-width': 5 })).join(''),
  ).join('');
  return group([
    feathers,
    bust(blue, { rx: 172, belly: '#4B8BEA' }),
    ...[270, 309, 348].map((x, i) => line(`M${x},${i === 1 ? 70 : 84} L${309 + (x - 309) * 0.4},152`, blue, 6)),
    ...[270, 309, 348].map((x, i) => ellipse(x, i === 1 ? 62 : 76, 12, 16, '#1F7FB8') + circle(x, i === 1 ? 60 : 74, 6, '#FFD43B')),
    ellipse(309, 262, 130, 134, blue),
    path('M246,320 Q232,440 192,530 L426,530 Q386,440 372,320 Z', blue),
    scales,
    path('M226,236 Q260,210 296,236 Q260,250 226,236 Z', WHITE),
    path('M322,236 Q358,210 392,236 Q358,250 322,236 Z', WHITE),
    path('M234,292 Q262,304 290,292', 'none', { stroke: WHITE, 'stroke-width': 8, 'stroke-linecap': 'round' }),
    path('M328,292 Q356,304 384,292', 'none', { stroke: WHITE, 'stroke-width': 8, 'stroke-linecap': 'round' }),
    eyes({ y: 262, lx: 262, rx: 356, w: 30, h: 36 }),
    path('M288,316 L330,316 L309,358 Z', '#FFB020'),
    line('M300,338 L318,338', shade('#FFB020', -0.2), 4),
    blush(318, 222, 396, 16),
    // jasmine garland
    ...Array.from({ length: 9 }, (_, i) => {
      const t = i / 8;
      const x = 206 + t * 206;
      const y = 504 + Math.sin(t * Math.PI) * 30;
      return circle(x, y, 11, WHITE) + circle(x, y, 4, '#FFE9A8');
    }),
  ]);
}

// Bagha the tiger, from the Sundarbans in West Bengal: shy and kind, with a white Durga Puja scarf with a
// red border (the "laal paar" look).
function bagha() {
  const coat = '#F29A3A';
  const stripes = [
    'M309,108 L294,172 L324,172 Z',
    'M260,122 L270,180 L292,172 Z',
    'M358,122 L348,180 L326,172 Z',
    'M148,240 L216,252 L156,268 Z',
    'M144,292 L208,296 L152,314 Z',
    'M470,240 L402,252 L462,268 Z',
    'M474,292 L410,296 L466,314 Z',
  ];
  return group([
    bust(coat, { rx: 196, belly: '#F7B568' }),
    path('M120,596 L150,620 L120,640 Z M498,596 L468,620 L498,640 Z', INK),
    circle(188, 118, 46, coat),
    circle(188, 122, 24, '#FBE7C2'),
    circle(430, 118, 46, coat),
    circle(430, 122, 24, '#FBE7C2'),
    ellipse(309, 268, 170, 162, coat),
    ...stripes.map((d) => path(d, INK)),
    ellipse(240, 360, 76, 58, '#FBF4E6'),
    ellipse(378, 360, 76, 58, '#FBF4E6'),
    ellipse(309, 404, 52, 34, '#FBF4E6'),
    eyes({ y: 248 }),
    path('M288,328 Q309,318 330,328 Q322,348 309,352 Q296,348 288,328 Z', '#E85A6B'),
    line('M276,376 Q294,394 309,376 Q324,394 342,376', INK, 8),
    blush(332, 184, 434),
    path('M134,452 Q309,532 484,452 L498,504 Q309,594 120,504 Z', WHITE),
    line('M128,476 Q309,560 490,476', '#D7263D', 14),
    line('M124,500 Q309,586 494,500', '#D7263D', 8),
    path('M380,520 L424,626 L462,612 L432,510 Z', WHITE),
    line('M392,540 L436,620', '#D7263D', 8),
  ]);
}

// Momo the red panda, from the hills of Sikkim: a fluffy ringed tail, white face markings and a cosy
// knitted muffler for the cold mountains.
function momo() {
  const rust = '#C8562A';
  const tail = [
    path('M420,660 C560,640 600,520 560,430 C540,384 500,380 482,410 C520,450 520,560 400,600 Z', rust),
    ...[[548, 452], [570, 520], [552, 590]].map(([x, y]) => ellipse(x, y, 34, 14, '#8E3417', { transform: `rotate(${(y - 500) / 6 + 20} ${x} ${y})` })),
  ];
  return group([
    ...tail,
    bust('#3B2A2A', { rx: 186 }),
    path('M124,560 Q170,470 250,470 L250,660 L124,660 Z', rust),
    path('M494,560 Q448,470 368,470 L368,660 L494,660 Z', rust),
    // ears: big and rounded, white rims, dark inside
    path('M146,220 Q112,52 262,100 Z', rust),
    path('M168,196 Q148,90 238,116 Z', WHITE),
    path('M472,220 Q506,52 356,100 Z', rust),
    path('M450,196 Q470,90 380,116 Z', WHITE),
    ellipse(309, 272, 172, 158, rust),
    ellipse(196, 330, 58, 50, WHITE),
    ellipse(422, 330, 58, 50, WHITE),
    ellipse(309, 372, 82, 62, WHITE),
    // white brow drops above the eyes and the reddish "tear" stripes below them
    ellipse(240, 184, 30, 18, WHITE, { transform: 'rotate(-14 240 184)' }),
    ellipse(378, 184, 30, 18, WHITE, { transform: 'rotate(14 378 184)' }),
    eyes({ y: 252, lx: 248, rx: 370, w: 36, h: 42 }),
    ellipse(309, 346, 26, 18, INK),
    smile(309, 380, 34),
    circle(212, 342, 18, BLUSH, { opacity: 0.85 }),
    circle(406, 342, 18, BLUSH, { opacity: 0.85 }),
    // muffler
    scarf('#2FA36B', {
      y: 446,
      w: 168,
      pattern: [line('M156,470 Q309,548 462,470', '#FFD43B', 10), line('M162,500 Q309,582 456,500', '#FFD43B', 10)].join(''),
    }),
  ]);
}

export const CAST: Record<string, FriendArt> = { bholu, kesar, raja, chikki, appu, mayil, bagha, momo };

/** Friends drawn here, with the friends from the original art (PNG cut-outs) for scenes that need everyone. */
export const ORIGINAL_FRIENDS = ['gappu', 'mithu', 'tillu', 'chunnu', 'gauri', 'pip'] as const;


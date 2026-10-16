// Snacks from every stop on the journey, and the gifts friends bring to the Mela. Each is drawn in a
// 256 x 256 box like the original snacks (jalebi.png etc.): the thing in the middle, a soft shadow under
// it, sometimes a sparkle. Scenes reuse the same drawings (DRAW) at any size.

import { bananaLeaf, circle, doc, ellipse, groundShadow, group, INK, line, path, plate, put, rect, ringOf, seeded, shade, sparkle, WHITE } from './kit.ts';

const lassi = () =>
  group([
    groundShadow(128, 216, 70),
    path('M78,52 L178,52 L166,212 L90,212 Z', '#D6ECFA'),
    path('M84,78 L172,78 L162,204 L94,204 Z', '#FFF8EC'),
    path('M80,70 Q96,50 112,68 Q128,46 146,66 Q162,48 176,70 L174,90 Q128,104 82,90 Z', '#FFE7B0'),
    line('M112,74 l6,8 M138,70 l-4,9 M156,78 l5,6', '#FF9F1C', 3),
    path('M96,96 L102,196 L112,196 L108,96 Z', WHITE, { opacity: 0.7 }),
    put([rect(-6, -70, 12, 140, '#FF7AA2', { rx: 6 }), ...[-50, -20, 10, 40].map((y) => rect(-6, y, 12, 10, WHITE))], { x: 162, y: 60, r: 18 }),
    sparkle(206, 46, 14),
  ]);

const makkiroti = () => {
  const spots = (cx: number, cy: number, seed: number) => {
    const r = seeded(seed);
    return Array.from({ length: 9 }, () => ellipse(cx + (r() - 0.5) * 120, cy + (r() - 0.5) * 30, 6, 3, '#C98B2A', { opacity: 0.6 })).join('');
  };
  return group([
    groundShadow(122, 214, 100),
    ellipse(116, 190, 96, 30, '#E2A93A'),
    ellipse(116, 180, 96, 30, '#F2C14E'),
    spots(116, 180, 3),
    ellipse(116, 158, 96, 30, '#E2A93A'),
    ellipse(116, 150, 96, 30, '#F6CD5E'),
    spots(116, 150, 5),
    // a cube of white butter melting on top
    path('M96,128 L130,118 L150,132 L116,144 Z', '#FFFBE6'),
    path('M96,128 L116,144 L116,156 Q104,160 96,148 Z', '#F5E9B8'),
    path('M116,144 L150,132 L150,144 L116,156 Z', '#FBF0C6'),
    // sarson da saag
    ellipse(208, 196, 40, 16, '#A8562A'),
    ellipse(208, 186, 40, 14, '#C8662F'),
    ellipse(208, 184, 32, 10, '#3E8E41'),
    circle(212, 182, 4, '#FFF3C4'),
  ]);
};

const ghevar = () => {
  const holes = [];
  const r = seeded(11);
  for (let y = -30; y <= 30; y += 12)
    for (let x = -84; x <= 84; x += 14) {
      if ((x * x) / (88 * 88) + (y * y) / (36 * 36) > 0.86) continue;
      holes.push(ellipse(128 + x + (r() - 0.5) * 4, 136 + y + (y / 12) % 2 * 3, 5, 3.5, '#B9741C'));
    }
  return group([
    groundShadow(128, 212, 104),
    ellipse(128, 160, 96, 42, '#C9852B'),
    rect(32, 136, 192, 24, '#C9852B'),
    ellipse(128, 136, 96, 42, '#E9A53B'),
    ...holes,
    path('M70,124 Q128,92 186,124 Q160,144 128,140 Q96,144 70,124 Z', '#FFF1D0', { opacity: 0.9 }),
    ...[[104, 118, 20], [130, 112, -30], [150, 124, 60], [118, 130, 0], [160, 114, 90]].map(([x, y, a]) => rect(x - 6, y - 2, 12, 4, '#7CB342', { rx: 2, transform: `rotate(${a} ${x} ${y})` })),
    ...[[92, 128], [140, 126], [170, 130]].map(([x, y]) => circle(x, y, 3, '#E6E9F2')),
    sparkle(214, 58, 14),
  ]);
};

const dalbaati = () =>
  group([
    groundShadow(128, 216, 106),
    plate(128, 182, 106),
    ellipse(78, 150, 50, 22, '#C8662F'),
    ellipse(78, 146, 42, 16, '#F2C230'),
    circle(64, 144, 3, '#E07A1F'),
    circle(88, 148, 3, '#3E8E41'),
    ...[[122, 168], [170, 162], [148, 182]].map(([x, y]) =>
      [circle(x, y, 30, '#C98B3C'), path(`M${x - 18},${y - 12} Q${x},${y - 30} ${x + 18},${y - 12} Q${x},${y - 4} ${x - 18},${y - 12} Z`, '#EBC07A'), line(`M${x - 6},${y - 22} l6,10 l6,-10`, '#9C6524', 3), ellipse(x - 10, y + 6, 8, 5, '#FFE7A0', { opacity: 0.7 })].join(''),
    ),
  ]);

const dhokla = () => {
  const block = (x: number, y: number) =>
    [
      path(`M${x},${y} l44,-16 l44,16 l-44,16 Z`, '#FFDA5C'),
      path(`M${x},${y} l44,16 l0,30 l-44,-16 Z`, '#F2B81F'),
      path(`M${x + 44},${y + 16} l44,-16 l0,30 l-44,16 Z`, '#E0A512'),
      ...[[18, -2], [40, -8], [60, 2], [34, 6], [50, -14]].map(([dx, dy]) => circle(x + dx, y + dy, 2.6, INK)),
      path(`M${x + 26},${y - 4} q6,-8 12,0 q-6,6 -12,0 Z`, '#3FAE5A'),
    ].join('');
  return group([
    groundShadow(128, 210, 100),
    block(84, 110),
    block(40, 140),
    block(128, 140),
    block(84, 170),
    path('M176,78 q34,-6 40,30 q-10,-24 -40,-30 Z', '#3E9B4F'),
    sparkle(210, 48, 13),
  ]);
};

const fafda = () =>
  group([
    groundShadow(128, 214, 106),
    plate(128, 180, 106),
    ...[[-24, 150, -8], [-6, 164, -4], [12, 150, 4], [30, 168, 8]].map(([dx, y, a]) => {
      const x = 104 + dx;
      return put([rect(-70, -8, 140, 16, '#F3D27A', { rx: 8 }), ...[-50, -24, 4, 30, 54].map((px) => circle(px, 0, 2.2, '#C9A04A'))], { x, y, r: a });
    }),
    // a fried green chilli and a small jalebi: fafda-jalebi
    path('M60,196 q-14,-30 10,-44 q6,24 -10,44 Z', '#4CAF50'),
    put([line('M0,0 m-20,0 a20,20 0 1,1 40,0 a14,14 0 1,1 -28,0 a8,8 0 1,1 16,0', '#FF9F1C', 9)], { x: 196, y: 150 }),
  ]);

const vadapav = () =>
  group([
    groundShadow(128, 214, 96),
    path('M44,168 Q128,206 212,168 L206,190 Q128,226 50,190 Z', '#D9944A'),
    path('M44,168 Q128,186 212,168 L208,176 Q128,196 48,176 Z', '#F2C48A'),
    ellipse(128, 156, 80, 22, '#4CAF50'),
    ellipse(128, 146, 76, 26, '#E3A33A'),
    ...[[96, 144], [136, 136], [160, 152], [112, 154]].map(([x, y]) => circle(x, y, 4, '#C9862A')),
    circle(150, 158, 5, '#E53935'),
    circle(98, 160, 4, '#E53935'),
    path('M40,138 Q128,40 216,138 Q128,124 40,138 Z', '#D9944A'),
    path('M70,110 Q100,84 138,80', 'none', { stroke: '#F5D3A0', 'stroke-width': 10, 'stroke-linecap': 'round' }),
    path('M208,90 q30,10 18,48 q-4,-28 -18,-48 Z', '#4CAF50'),
  ]);

/** One modak: a pleated sweet dumpling with a saffron tip. */
export const modakShape = (color = '#FFF1DC') =>
  [
    path('M-46,32 Q-52,-12 0,-56 Q52,-12 46,32 Q0,44 -46,32 Z', color),
    line('M0,-56 Q-18,-10 -26,34 M0,-56 Q0,-6 0,38 M0,-56 Q18,-10 26,34', shade(color, -0.12), 4),
    circle(0, -56, 7, '#FF9F1C'),
  ].join('');
const modak = () =>
  group([
    groundShadow(128, 214, 100),
    plate(128, 190, 100, '#F4D25A'),
    put(modakShape(), { x: 84, y: 162, s: 0.85 }),
    put(modakShape(), { x: 172, y: 162, s: 0.85 }),
    put(modakShape(), { x: 128, y: 150 }),
    sparkle(206, 50, 14),
  ]);

const appam = () => {
  const r = seeded(4);
  return group([
    groundShadow(128, 214, 106),
    bananaLeaf(128, 178, 230, 90),
    ellipse(128, 156, 88, 46, '#E9C27A'),
    ellipse(128, 152, 82, 42, '#F6E7C4'),
    ...Array.from({ length: 26 }, () => {
      const a = r() * Math.PI * 2;
      const d = 0.62 + r() * 0.3;
      return ellipse(128 + Math.cos(a) * 82 * d, 152 + Math.sin(a) * 42 * d, 4, 2.5, '#E3C48C');
    }),
    ellipse(128, 150, 44, 22, '#FFFDF7'),
    ellipse(118, 144, 16, 6, WHITE),
  ]);
};

const coconut = () =>
  group([
    groundShadow(128, 216, 80),
    path('M58,150 Q52,72 128,64 Q204,72 198,150 Q192,214 128,214 Q64,214 58,150 Z', '#5FAE3E'),
    path('M80,120 Q86,86 116,78', 'none', { stroke: '#8FD06A', 'stroke-width': 12, 'stroke-linecap': 'round' }),
    ellipse(128, 72, 44, 14, '#E9F5D6'),
    ellipse(128, 72, 30, 8, '#FFFFFF'),
    put([rect(-6, -70, 12, 110, '#4FC3F7', { rx: 6 }), ...[-50, -20, 10].map((y) => rect(-6, y, 12, 10, WHITE))], { x: 140, y: 40, r: 16 }),
  ]);

const idli = () =>
  group([
    groundShadow(128, 214, 108),
    bananaLeaf(128, 180, 236, 90),
    ...[[84, 160], [140, 168], [112, 136]].map(([x, y]) =>
      [ellipse(x, y + 10, 40, 16, '#E8E2D2'), path(`M${x - 40},${y + 10} Q${x - 40},${y - 22} ${x},${y - 24} Q${x + 40},${y - 22} ${x + 40},${y + 10} Q${x},${y + 24} ${x - 40},${y + 10} Z`, '#FBF8F0'), ellipse(x - 12, y - 10, 12, 5, WHITE)].join(''),
    ),
    ellipse(196, 186, 30, 12, '#C8C2B4'),
    ellipse(196, 182, 30, 12, '#F3F0E4'),
    ellipse(196, 180, 22, 7, '#E8F2D8'),
    circle(190, 179, 3, '#3E8E41'),
    circle(202, 181, 2.5, '#E53935'),
  ]);

const dosa = () =>
  group([
    groundShadow(128, 214, 110),
    bananaLeaf(128, 176, 240, 96),
    put([rect(-96, -22, 192, 44, '#E8A93F', { rx: 22 }), rect(-90, -20, 180, 12, '#F5C568', { rx: 6 }), ellipse(92, 0, 14, 22, '#D18E2A'), ellipse(92, 0, 8, 14, '#F2C26A')], { x: 116, y: 148, r: -10 }),
    ellipse(70, 194, 24, 10, '#F3F0E4'),
    ellipse(196, 196, 26, 11, '#E8743B'),
    circle(192, 194, 3, '#FFD43B'),
  ]);

const rasgulla = () =>
  group([
    groundShadow(128, 216, 96),
    path('M40,128 Q48,206 128,208 Q208,206 216,128 Z', '#CFE6F5'),
    ellipse(128, 128, 88, 24, '#E4F2FB'),
    ellipse(128, 132, 80, 20, '#F7E9C6'),
    ...[[96, 122], [158, 122], [128, 136]].map(([x, y]) => [circle(x, y, 30, '#FFFBF2'), circle(x - 9, y - 10, 9, WHITE), ellipse(x + 6, y + 14, 18, 8, '#EFE6D2', { opacity: 0.7 })].join('')),
    path('M52,150 Q60,190 100,200', 'none', { stroke: WHITE, 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.8 }),
    sparkle(212, 54, 14),
  ]);

const mishtidoi = () =>
  group([
    groundShadow(128, 216, 84),
    path('M48,110 Q50,200 128,206 Q206,200 208,110 Z', '#B5532A'),
    path('M70,150 Q76,186 108,196', 'none', { stroke: '#CF7A4E', 'stroke-width': 10, 'stroke-linecap': 'round' }),
    ellipse(128, 110, 82, 24, '#9A4422'),
    ellipse(128, 112, 72, 18, '#E8C089'),
    ellipse(112, 108, 26, 6, '#F3D7AB'),
    put([rect(-5, -58, 10, 70, '#C9CDD8', { rx: 5 }), ellipse(0, 16, 14, 9, '#C9CDD8')], { x: 168, y: 92, r: 24 }),
    sparkle(212, 48, 13),
  ]);

/** One momo: a pleated half-moon steamed dumpling. */
const momoShape = () =>
  [
    path('M-40,16 Q-42,-26 0,-30 Q42,-26 40,16 Q0,26 -40,16 Z', '#FFF8EE'),
    ...[-24, -8, 8, 24].map((x) => line(`M${x * 0.7},-26 L${x},4`, '#E6DCCB', 3)),
    path('M-14,-30 Q0,-40 14,-30', 'none', { stroke: '#E6DCCB', 'stroke-width': 4, 'stroke-linecap': 'round' }),
  ].join('');
const momos = () =>
  group([
    groundShadow(128, 216, 104),
    ellipse(120, 190, 100, 26, '#B7843E'),
    rect(20, 150, 200, 40, '#D9A35A'),
    ellipse(120, 150, 100, 26, '#C99248'),
    ellipse(120, 150, 88, 20, '#7A5226'),
    ...[42, 70, 98, 126, 154, 182].map((x) => line(`M${x},158 l0,28`, '#B7843E', 4)),
    put(momoShape(), { x: 82, y: 142 }),
    put(momoShape(), { x: 156, y: 142 }),
    put(momoShape(), { x: 118, y: 126 }),
    ellipse(214, 200, 26, 10, '#8E2B1C'),
    ellipse(214, 196, 22, 8, '#E53935'),
  ]);

const dhol = () =>
  group([
    groundShadow(128, 214, 104),
    rect(46, 92, 164, 112, '#C0392B', { rx: 30 }),
    path('M52,124 L80,148 L108,124 L136,148 L164,124 L192,148 L206,136', 'none', { stroke: '#FFD43B', 'stroke-width': 7, 'stroke-linejoin': 'round' }),
    path('M52,172 L80,148 L108,172 L136,148 L164,172 L192,148 L206,160', 'none', { stroke: '#7ED957', 'stroke-width': 5, 'stroke-linejoin': 'round' }),
    ellipse(46, 148, 22, 58, '#8E2A20'),
    ellipse(42, 148, 18, 52, '#FFF1D6'),
    ellipse(210, 148, 22, 58, '#8E2A20'),
    ellipse(214, 148, 18, 52, '#FFF1D6'),
    line('M60,40 Q128,0 196,40 L210,92 M60,40 L46,92', '#FF8A3D', 8),
    // sticks: a straight one and the curved one for the bass side
    put([rect(-4, -56, 8, 112, '#8A5A2B', { rx: 4 })], { x: 214, y: 70, r: 30 }),
    put([path('M0,-56 Q-22,0 0,56', 'none', { stroke: '#8A5A2B', 'stroke-width': 8, 'stroke-linecap': 'round' })], { x: 42, y: 74, r: -30 }),
  ]);

/** A kathputli: a Rajasthani string puppet with a big turban and moustache, in a twirling skirt. */
export const puppetShape = () =>
  [
    line('M-60,-118 L60,-118', '#8A5A2B', 10),
    line('M-50,-118 L-4,-66 M50,-118 L4,-66 M-56,-118 L-56,-6 M56,-118 L56,-6', '#6B7A99', 2),
    path('M-44,96 L44,96 L60,148 L-60,148 Z', '#FFD43B'),
    path('M-30,10 L30,10 L56,104 L-56,104 Z', '#E53935'),
    ...[-36, -18, 0, 18, 36].map((x) => circle(x, 86, 5, '#E8F4FF')),
    path('M-30,10 L-56,-6 L-52,8 Z M30,10 L56,-6 L52,8 Z', '#E53935'),
    circle(-56, -6, 7, '#F2C18A'),
    circle(56, -6, 7, '#F2C18A'),
    rect(-20, -10, 40, 24, '#2E6FD9', { rx: 6 }),
    ellipse(0, -36, 28, 32, '#F2C18A'),
    path('M-34,-52 Q0,-92 34,-52 Q0,-60 -34,-52 Z', '#E53935'),
    path('M-30,-56 Q0,-80 30,-56', 'none', { stroke: '#FFD43B', 'stroke-width': 5 }),
    ellipse(-10, -38, 7, 8, WHITE),
    ellipse(10, -38, 7, 8, WHITE),
    circle(-9, -36, 4, INK),
    circle(11, -36, 4, INK),
    path('M-18,-22 Q-8,-28 0,-22 Q8,-28 18,-22 Q8,-18 0,-20 Q-8,-18 -18,-22 Z', INK),
  ].join('');
const puppet = () => group([groundShadow(128, 226, 70), put(puppetShape(), { x: 128, y: 122, s: 0.86 })]);

const sugarcane = () =>
  group([
    groundShadow(128, 220, 90),
    ...[[-16, '#7CB342'], [14, '#8BC34A'], [0, '#689F38']].map(([a, c]) =>
      put([rect(-9, -100, 18, 200, c as string, { rx: 8 }), ...[-60, -16, 28, 72].map((y) => rect(-10, y, 20, 5, shade(c as string, -0.2)))], { x: 128 + (a as number) * 1.6, y: 120, r: a as number }),
    ),
    path('M128,24 q-50,-10 -70,30 q30,-30 70,-30 Z M128,24 q50,-14 72,20 q-32,-24 -72,-20 Z', '#3E9B4F'),
  ]);

const kiteGift = () =>
  group([
    groundShadow(128, 228, 60),
    put([path('M0,-80 L60,0 L0,96 L-60,0 Z', '#FF4F79'), path('M0,-80 L60,0 L0,0 Z', '#FFD43B'), path('M0,0 L-60,0 L0,96 Z', '#FFD43B'), line('M0,-80 L0,96 M-60,0 L60,0', WHITE, 4, { opacity: 0.7 })], { x: 118, y: 110, r: -12 }),
    line('M136,200 q22,10 10,28 q-12,14 8,22', '#2E6FD9', 5),
    put([rect(-26, -20, 52, 40, '#C98B3C', { rx: 8 }), rect(-18, -12, 36, 24, '#FF4F79', { rx: 6 })], { x: 206, y: 196, r: 14 }),
    line('M136,200 Q180,190 196,190', INK, 2, { opacity: 0.5 }),
  ]);

/** A basket of flowers for the pookalam: marigolds, jasmine and a few leaves. */
const flowers = () => {
  const r = seeded(31);
  const blooms = Array.from({ length: 16 }, (_, i) => {
    const x = 70 + r() * 116;
    const y = 96 + r() * 46;
    const c = ['#FF9F1C', '#FFD23F', '#FFFFFF', '#9C6ADE', '#E53935'][i % 5];
    return circle(x, y, 13, c) + circle(x, y, 5, shade(c, -0.15));
  });
  return group([
    groundShadow(128, 216, 96),
    path('M44,126 L212,126 L192,206 L64,206 Z', '#C98B3C'),
    ...[150, 172, 194].map((y) => line(`M${56 + (y - 126) * 0.25},${y} L${200 - (y - 126) * 0.25},${y}`, '#A06A2A', 5)),
    path('M60,110 q-30,-20 -20,-50 q20,30 20,50 Z M196,110 q30,-20 20,-50 q-20,30 -20,50 Z', '#3E9B4F'),
    ...blooms,
    path('M70,126 Q128,40 186,126', 'none', { stroke: '#A06A2A', 'stroke-width': 8 }),
  ]);
};

/** Drawings that scenes can place at any size (same 256 box). */
export const DRAW = { lassi, makkiroti, ghevar, dalbaati, dhokla, fafda, vadapav, modak, appam, coconut, idli, dosa, rasgulla, mishtidoi, momos, dhol, puppet, sugarcane, kite: kiteGift, flowers };

export const THINGS: Record<string, () => string> = Object.fromEntries(Object.entries(DRAW).map(([name, draw]) => [name, () => doc(256, 256, draw())]));

/** A finished rangoli on a doorstep, for the dashboard's picture of the Rangoli kind (the app draws its own). */
THINGS['rangoli-thumb'] = () =>
  doc(360, 360, [
    rect(0, 0, 360, 360, '#FFE7C2'),
    circle(180, 180, 160, '#4B2E83'),
    ringOf(36, 180, 180, 150, (i) => circle(0, 0, 5, ['#FFD23F', '#FF5C8A', '#3FAE5A', '#2E6FD9'][i % 4])),
    ringOf(16, 180, 180, 124, () => path('M0,-18 C10,-4 12,8 0,18 C-12,8 -10,-4 0,-18 Z', '#FFFFFF')),
    ringOf(16, 180, 180, 96, () => path('M0,-16 C8,-4 10,6 0,16 C-10,6 -8,-4 0,-16 Z', '#3FAE5A'), -90 + 11.25),
    ringOf(8, 180, 180, 66, (i) => path('M0,-18 L13,0 L0,18 L-13,0 Z', i % 2 ? '#FFD23F' : '#FF9F1C')),
    ringOf(8, 180, 180, 36, () => path('M0,-20 Q16,0 0,20 Q-16,0 0,-20 Z', '#FF5C8A'), -90 + 22.5),
    circle(180, 180, 16, '#FFD23F'),
  ]);


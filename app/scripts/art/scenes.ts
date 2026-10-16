// Places on the journey (STORY.md), 990 x 660 like the original pictures (gappu.png): each new friend at
// home in their part of India (used for "Meet ..." jigsaws and the level story cards), wider scenes for
// the slide puzzles, and the finale, The Big Picture, with every friend at the Friendship Mela.

import { CAST, ORIGINAL_FRIENDS } from './cast.ts';
import {
  bunting,
  burst,
  circle,
  cloud,
  doc,
  ellipse,
  field,
  groundShadow,
  group,
  hills,
  INK,
  kite,
  line,
  linearGradient,
  marigold,
  mountain,
  palm,
  path,
  pot,
  put,
  radialGradient,
  rain,
  rect,
  ringOf,
  seeded,
  shade,
  stringLights,
  sun,
  toran,
  WHITE,
} from './kit.ts';
import { DRAW, puppetShape } from './things.ts';

const W = 990;
const H = 660;

const sky = (id: string, top: string, bottom: string, h = H) => linearGradient(id, [[0, top], [1, bottom]]) + rect(0, 0, W, h, `url(#${id})`);

type Who = keyof typeof CAST | (typeof ORIGINAL_FRIENDS)[number];
/** A friend's cut-out (head and shoulders), placed by the middle of their head. */
function friend(who: Who, cx: number, top: number, s: number, flip = false) {
  const art = who in CAST ? CAST[who as keyof typeof CAST]() : `<image href="${who}-cut.png" width="618" height="660"/>`;
  return put(art, { x: flip ? cx + 309 * s : cx - 309 * s, y: top, s, flip });
}
/** The friend's portrait: their cut-out in the middle, just like the original portraits. */
const star = (who: keyof typeof CAST) => friend(who, W / 2, 0, 1);

const thing = (name: keyof typeof DRAW, cx: number, cy: number, s: number) => put(DRAW[name](), { x: cx - 128 * s, y: cy - 128 * s, s });

// ---------------------------------------------------------------- bits of scenery

function tractor(x: number, y: number, s = 1) {
  return put(
    [
      groundShadow(0, 36, 110),
      rect(-96, -40, 112, 50, '#E53935', { rx: 10 }),
      rect(-96, -40, 112, 12, '#F26B5B', { rx: 6 }),
      rect(6, -110, 74, 86, '#E53935', { rx: 8 }),
      rect(16, -100, 54, 42, '#BDE6FF', { rx: 6 }),
      rect(-80, -86, 12, 48, '#4A4F5E', { rx: 4 }),
      circle(-74, -94, 9, '#9AA2B3', { opacity: 0.8 }),
      circle(48, 6, 46, '#2B2F3A'),
      circle(48, 6, 22, '#FFC93C'),
      circle(-70, 18, 26, '#2B2F3A'),
      circle(-70, 18, 11, '#FFC93C'),
    ],
    { x, y, s },
  );
}

const mustard = (x: number, y: number, s: number, i: number) =>
  put(
    [line('M0,0 L0,-40', '#5E9E2F', 4), ...[[-8, -42], [6, -46], [0, -54], [-4, -34], [9, -36]].map(([dx, dy], k) => circle(dx, dy, 7, (i + k) % 3 ? '#FFD23F' : '#FFC107'))],
    { x, y, s },
  );

function fort(x: number, base: number, s = 1, color = '#D9A066') {
  const dark = shade(color, -0.18);
  const merlons = Array.from({ length: 11 }, (_, i) => rect(-150 + i * 30, -104, 18, 18, color)).join('');
  return put(
    [
      path('M-260,40 Q-120,-40 0,-10 Q140,-50 280,40 Z', '#C98B4F'),
      rect(-150, -88, 300, 100, color),
      merlons,
      ...[-110, -50, 10, 70].map((wx) => path(`M${wx},-20 v-26 a12,12 0 0 1 24,0 v26 Z`, dark)),
      // bastions with little domed chhatris
      ...[-170, 170].map((bx) =>
        [rect(bx - 34, -140, 68, 152, color), rect(bx - 40, -150, 80, 16, dark), path(`M${bx - 26},-150 Q${bx},-196 ${bx + 26},-150 Z`, '#F2C48A'), circle(bx, -194, 6, '#F2C48A'), path(`M${bx - 10},-60 v-20 a10,10 0 0 1 20,0 v20 Z`, dark)].join(''),
      ),
    ],
    { x, y: base, s },
  );
}

function gopuram(x: number, base: number, s = 1) {
  const tiers = Array.from({ length: 6 }, (_, i) => {
    const w = 220 - i * 30;
    const y = -60 - i * 56;
    const c = i % 2 ? '#F0B87A' : '#E9A866';
    return [
      path(`M${-w / 2},${y + 56} L${-w / 2 + 12},${y} L${w / 2 - 12},${y} L${w / 2},${y + 56} Z`, c),
      rect(-w / 2 + 8, y - 6, w - 16, 10, '#C8662F'),
      ...Array.from({ length: Math.max(2, 5 - Math.floor(i / 2)) }, (_, k) => {
        const px = -w / 2 + 26 + (k * (w - 52)) / Math.max(1, Math.max(2, 5 - Math.floor(i / 2)) - 1);
        return path(`M${px - 7},${y + 50} v-22 a7,7 0 0 1 14,0 v22 Z`, i % 2 ? '#3FA7B5' : '#E8574F');
      }),
    ].join('');
  });
  return put(
    [
      rect(-130, -60, 260, 60, '#E39A55'),
      path('M-34,0 v-44 a34,34 0 0 1 68,0 v44 Z', '#7A3E1E'),
      ...tiers,
      path('M-52,-344 Q0,-420 52,-344 Z', '#E9A866'),
      ...[-30, 0, 30].map((kx) => rect(kx - 4, -404 + Math.abs(kx) * 0.9, 8, 22, '#FFC93C', { rx: 4 })),
    ],
    { x, y: base, s },
  );
}

function houseboat(x: number, y: number, s = 1) {
  return put(
    [
      path('M-200,0 Q-230,-40 -246,-56 Q-180,-10 0,-12 Q180,-10 246,-56 Q230,-40 200,0 Q0,40 -200,0 Z', '#6B3E1E'),
      path('M-160,-12 Q-160,-110 0,-112 Q160,-110 160,-12 Z', '#D4A256'),
      ...[-120, -80, -40, 0, 40, 80, 120].map((lx) => line(`M${lx},-14 Q${lx * 0.92},-80 ${lx * 0.7},-104`, '#B9853A', 4)),
      ...[-100, -30, 40, 110].map((wx) => rect(wx - 16, -56, 32, 30, '#5B3A1E', { rx: 6 })),
      line('M-200,0 Q0,30 200,0', '#9C6B3C', 6),
    ],
    { x, y, s },
  );
}

function pookalam(cx: number, cy: number, r: number, squash = 0.42) {
  const rings: [number, string, number][] = [[1, '#3E9B4F', 24], [0.86, '#FF9F1C', 20], [0.7, '#FFE066', 18], [0.54, WHITE, 14], [0.4, '#9C6ADE', 12], [0.24, '#E53935', 10]];
  return put(
    [
      circle(0, 0, r, '#3E9B4F'),
      ...rings.map(([k, c, n]) => [circle(0, 0, r * k, c), ringOf(n, 0, 0, r * k, () => path(`M0,0 L${(r * 0.09) / 2},${r * 0.08} L${-(r * 0.09) / 2},${r * 0.08} Z`, shade(c, -0.15)))].join('')),
      marigold(0, 0, r * 0.12, '#FFD23F'),
    ],
    { x: cx, y: cy, sy: squash },
  );
}

/** A kolam: white rice-flour loops drawn round a grid of dots. */
function kolam(cx: number, cy: number, s = 1, squash = 0.45) {
  const dots: string[] = [];
  const loops: string[] = [];
  for (let r = -2; r <= 2; r++)
    for (let c = -2; c <= 2; c++) {
      if (Math.abs(r) + Math.abs(c) > 3) continue;
      dots.push(circle(c * 40, r * 40, 5, WHITE));
      if ((r + c) % 2 === 0) loops.push(path(`M${c * 40},${r * 40 - 22} L${c * 40 + 22},${r * 40} L${c * 40},${r * 40 + 22} L${c * 40 - 22},${r * 40} Z`, 'none', { stroke: WHITE, 'stroke-width': 5, 'stroke-linejoin': 'round' }));
    }
  return put([circle(0, 0, 150, '#00000000'), ...loops, ...dots, circle(0, 0, 130, 'none', { stroke: WHITE, 'stroke-width': 5 }), ringOf(16, 0, 0, 130, (i) => circle(0, 0, 9, i % 2 ? '#FF4F79' : '#FFD43B'))], {
    x: cx,
    y: cy,
    s,
    sy: s * squash,
  });
}

function howrahBridge(color = '#5D6D8E') {
  const deck = 420;
  const tower = (x: number) =>
    [
      path(`M${x - 34},${deck} L${x - 20},120 L${x + 20},120 L${x + 34},${deck} Z`, color),
      ...[150, 210, 270, 330, 390].map((y) => line(`M${x - 26},${y} L${x + 26},${y + 30} M${x + 26},${y} L${x - 26},${y + 30}`, shade(color, -0.2), 5)),
    ].join('');
  const chord = 'M150,130 Q300,250 495,250 Q690,250 840,130';
  const members = Array.from({ length: 21 }, (_, i) => {
    const x = 150 + (i * 690) / 20;
    const t = (x - 150) / 690;
    const top = 130 + (1 - Math.abs(t - 0.5) * 2) ** 0.7 * 120;
    return line(`M${x},${top} L${x},${deck}` + (i % 2 ? ` M${x},${top} L${x + 34},${deck}` : ''), color, 4);
  });
  return group([...members, line(chord, color, 14), line('M0,180 Q60,180 150,130 M840,130 Q930,180 990,180', color, 12), tower(150), tower(840), rect(0, deck - 8, W, 22, shade(color, -0.25))]);
}

function taxi(x: number, y: number, s = 1) {
  return put(
    [
      groundShadow(0, 46, 140),
      path('M-140,20 Q-140,-24 -96,-30 L-60,-80 Q-30,-96 30,-96 Q74,-94 96,-40 L132,-30 Q150,-20 148,20 Z', '#FFD43B'),
      path('M-48,-74 Q-28,-86 0,-86 L0,-38 L-74,-36 Z', '#BDE6FF'),
      path('M14,-86 Q60,-86 80,-40 L14,-38 Z', '#BDE6FF'),
      rect(-150, 10, 300, 18, '#2B2F3A', { rx: 9 }),
      rect(-26, -118, 56, 22, '#2B2F3A', { rx: 4 }),
      `<text x="2" y="-101" font-size="17" fill="#FFD43B" text-anchor="middle" font-family="Lilita One">TAXI</text>`,
      circle(-80, 30, 28, '#2B2F3A'),
      circle(-80, 30, 12, '#C9CDD8'),
      circle(84, 30, 28, '#2B2F3A'),
      circle(84, 30, 12, '#C9CDD8'),
      circle(136, -8, 9, '#FFF3C4'),
    ],
    { x, y, s },
  );
}

function localTrain(x: number, y: number, s = 1) {
  return put(
    [
      rect(-150, -200, 300, 230, '#8E2B2B', { rx: 26 }),
      rect(-150, -140, 300, 40, '#F2D16B'),
      rect(-120, -186, 240, 40, '#BDE6FF', { rx: 10 }),
      rect(-120, -92, 70, 100, '#5A1E1E', { rx: 6 }),
      rect(50, -92, 70, 100, '#5A1E1E', { rx: 6 }),
      circle(-110, 8, 10, '#FFF3C4'),
      circle(110, 8, 10, '#FFF3C4'),
      rect(-170, 30, 340, 14, '#4A4F5E'),
    ],
    { x, y, s },
  );
}

function toyTrain(x: number, y: number, s = 1, faces: string[] = [], driver = '') {
  const blue = '#2E6FD9';
  const windows = [-232, -170, -108].map((wx) => `M${wx},-104 h50 v52 h-50 Z`).join(' ');
  return put(
    [
      groundShadow(-40, 40, 260),
      // a coach: faces sit behind its windows
      ...faces,
      path(`M-250,-120 h190 v130 h-190 Z ${windows}`, '#E8574F', { 'fill-rule': 'evenodd' }),
      rect(-258, -132, 206, 16, '#B23A33', { rx: 6 }),
      // the engine
      rect(-50, -70, 170, 80, blue, { rx: 12 }),
      rect(64, -118, 56, 48, '#BDE6FF', { rx: 6 }),
      driver,
      path('M54,-134 h92 v144 h-92 Z M64,-118 h56 v48 h-56 Z', blue, { 'fill-rule': 'evenodd' }),
      rect(-30, -120, 30, 52, '#2B2F3A', { rx: 4 }),
      rect(-36, -128, 42, 12, '#2B2F3A', { rx: 4 }),
      circle(-24, -150, 18, WHITE, { opacity: 0.8 }),
      circle(-2, -176, 24, WHITE, { opacity: 0.7 }),
      rect(-62, -10, 20, 26, '#E53935', { rx: 4 }),
      ...[-200, -130, -20, 40, 100].map((wx) => circle(wx, 18, 20, '#2B2F3A') + circle(wx, 18, 8, '#FFC93C')),
      line('M-300,40 L200,40', '#6B7A99', 6),
    ],
    { x, y, s },
  );
}

/** Tea bushes in rows across a hillside. */
const teaRows = (y0: number, rows: number, seed: number) =>
  field(0, W, y0, H + 20, rows, 14, (x, y, s, i) => ellipse(x, y, 52 * s, 24 * s, i % 2 ? '#3E9B4F' : '#4FB55E'), seed);

function rhododendron(x: number, y: number, s = 1) {
  const r = seeded(9);
  return put(
    [
      ellipse(0, 0, 90, 60, '#2F7D45'),
      ...Array.from({ length: 9 }, () => {
        const fx = (r() - 0.5) * 150;
        const fy = (r() - 0.5) * 80;
        return [circle(fx, fy, 16, '#E8336B'), circle(fx + 10, fy - 6, 12, '#FF5C8A'), circle(fx - 8, fy - 8, 10, '#FF7AA2')].join('');
      }),
    ],
    { x, y, s },
  );
}

function rooftops(y: number) {
  const roofs: [number, number, string][] = [[0, 230, '#F7B2A8'], [230, 270, '#A8D8F0'], [500, 220, '#FFE08A'], [720, 270, '#C8B6F2']];
  return group(
    roofs.map(([x, w, c], i) =>
      [
        rect(x, y + (i % 2) * 24, w, H, c),
        rect(x, y + (i % 2) * 24 - 30, w, 30, shade(c, -0.12)),
        ...Array.from({ length: Math.floor(w / 40) }, (_, k) => rect(x + 14 + k * 40, y + (i % 2) * 24 - 50, 8, 22, shade(c, -0.2))),
        line(`M${x},${y + (i % 2) * 24 - 50} H${x + w}`, shade(c, -0.2), 6),
      ].join(''),
    ),
  );
}

function waterTank(x: number, y: number) {
  return group([rect(x - 30, y - 70, 60, 70, '#2B2F3A', { rx: 10 }), ellipse(x, y - 70, 30, 9, '#4A4F5E'), line(`M${x - 30},${y - 40} H${x + 30}`, '#4A4F5E', 4)]);
}

// ---------------------------------------------------------------- portraits: one per new friend

const bholu = () =>
  doc(W, H, [
    sky('s', '#8FD3FF', '#DDF3FF', 420),
    sun(120, 96, 46),
    cloud(830, 120, 0.8),
    bunting(0, W, 14, 18, ['#FF6F3C', '#FFD43B', '#FF4F79', '#7ED957', '#9B7BFF'], 34),
    hills(400, W, 16, '#7FB24A', 4),
    rect(0, 420, W, 240, '#8BC34A'),
    field(0, W, 430, 660, 8, 30, mustard, 3),
    tractor(110, 560, 0.95),
    star('bholu'),
    thing('dhol', 880, 560, 0.85),
  ]);

const kesar = () =>
  doc(W, H, [
    sky('s', '#FFC98A', '#FFF0D6', 460),
    sun(820, 160, 70, '#FFB13B', false),
    bunting(0, W, 12, 16, ['#D7263D', '#FFC93C', '#2E6FD9', '#FF4F79'], 36, true),
    fort(170, 400, 0.9),
    hills(420, W, 26, '#F2C37E', 2, 0.5),
    hills(500, W, 30, '#E8B064', 2.5, 2),
    hills(590, W, 20, '#DFA352', 3, 1),
    line('M70,0 L70,218 M114,0 L114,218', '#6B7A99', 2),
    put(puppetShape(), { x: 92, y: 330, s: 0.95 }),
    star('kesar'),
    pot(890, 600, 0.6, '#C8662F'),
    pot(890, 520, 0.5, '#D9773E'),
    pot(890, 452, 0.4, '#C8662F'),
  ]);

const raja = () =>
  doc(W, H, [
    sky('s', '#6CCFF6', '#D9F3FF', 560),
    kite(90, 90, 0.7, '#FF4F79', '#FFD43B', -12),
    kite(200, 230, 0.5, '#7ED957', '#2E6FD9', 10),
    kite(860, 240, 0.65, '#9B7BFF', '#FF9F1C', 14),
    kite(70, 330, 0.45, '#FF9F1C', '#FFFFFF', -20),
    kite(930, 90, 0.5, '#E53935', '#FFFFFF', 18),
    cloud(320, 70, 0.6),
    rooftops(470),
    waterTank(110, 470),
    star('raja'),
    // a firki: the spool of kite string
    put(
      [groundShadow(0, 60, 70), rect(-46, -50, 92, 100, '#C98B3C', { rx: 10 }), rect(-36, -36, 72, 72, '#FF4F79', { rx: 8 }), ...[-20, -6, 8, 22].map((y) => line(`M-34,${y} H34`, '#FF8FB0', 3)), rect(-8, 50, 16, 46, '#8A5A2B', { rx: 6 })],
      { x: 880, y: 520, r: 12 },
    ),
  ]);

const chikki = () =>
  doc(W, H, [
    sky('s', '#7FA8C9', '#C9DCEA', 440),
    ...[[30, 250, 90], [130, 300, 70], [230, 210, 80], [700, 230, 90]].map(([x, top, w]) =>
      [rect(x, top, w, 440 - top, '#6C8FB5'), ...Array.from({ length: Math.floor((440 - top) / 34) }, (_, k) => rect(x + 12, top + 14 + k * 34, w - 24, 10, '#8FB0D2'))].join(''),
    ),
    // the Gateway of India, far off across the water
    put([rect(-90, -110, 180, 110, '#B9A88A'), path('M-34,0 v-60 a34,40 0 0 1 68,0 v60 Z', '#8C7D62'), ...[-80, -40, 40, 80].map((tx) => rect(tx - 9, -146, 18, 36, '#B9A88A') + circle(tx, -148, 10, '#B9A88A'))], { x: 880, y: 440, s: 0.9 }),
    rect(0, 430, W, 70, '#4F86B8'),
    line('M0,462 Q100,450 200,462 T400,462 T600,462 T800,462 T1000,462', '#7FAAD2', 5),
    rect(0, 500, W, 160, '#8FA0AE'),
    localTrain(105, 640, 0.9),
    star('chikki'),
    ellipse(870, 610, 110, 26, '#6E8CA6'),
    // paper boat in a puddle
    put([path('M-60,0 L60,0 L40,24 L-40,24 Z', WHITE), path('M-20,0 L0,-46 L20,0 Z', '#F3F6FA'), path('M-60,0 L-20,0 L0,-46 Z', '#E6ECF3')], { x: 870, y: 600, s: 0.9 }),
    rain(W, H, 140, 5),
  ]);

const appu = () =>
  doc(W, H, [
    sky('s', '#9FE0F0', '#E6F8F3', 380),
    sun(820, 90, 40),
    hills(350, W, 14, '#5BAE5C', 3),
    palm(240, 380, 200, -10, 0.7),
    palm(760, 380, 220, 12, 0.7),
    rect(0, 370, W, 160, '#3FA7B5'),
    line('M0,420 Q80,410 160,420 T320,420 T480,420 T640,420 T800,420 T1000,420', '#7FD0DA', 5),
    line('M0,480 Q80,470 160,480 T320,480 T480,480 T640,480 T800,480 T1000,480', '#7FD0DA', 5),
    houseboat(170, 470, 0.7),
    rect(0, 520, W, 140, '#6CC15A'),
    palm(60, 640, 360, 14),
    palm(950, 640, 330, -16),
    star('appu'),
    pookalam(870, 610, 110),
  ]);

const mayil = () =>
  doc(W, H, [
    sky('s', '#FFB88C', '#FFEBC2', 520),
    sun(800, 360, 60, '#FFD86B', false),
    gopuram(130, 540, 0.95),
    toran(0, W, 6, 14, 22),
    rect(0, 520, W, 140, '#B98E6E'),
    kolam(860, 600, 0.8),
    put([...[-18, 0, 18].map((a) => put([rect(-7, -160, 14, 320, a ? '#7CB342' : '#689F38', { rx: 6 }), ...[-110, -40, 30, 100].map((y) => rect(-8, y, 16, 5, '#4E7A26'))], { r: a })), path('M0,-160 q-50,-10 -70,30 q30,-30 70,-30 Z', '#3E9B4F')], { x: 50, y: 520, s: 0.8 }),
    star('mayil'),
    pot(900, 470, 0.8, '#C8662F', true),
  ]);

const bagha = () =>
  doc(W, H, [
    sky('s', '#9D7BD8', '#FFC6A0', 440),
    sun(495, 330, 70, '#FFB86B', false),
    howrahBridge(),
    rect(0, 430, W, 80, '#5B8DB8'),
    line('M0,470 Q100,460 200,470 T400,470 T600,470 T800,470 T1000,470', '#86B2D8', 5),
    rect(0, 510, W, 150, '#CDB997'),
    stringLights(0, W, 4, 20, 22),
    taxi(120, 580, 0.85),
    star('bagha'),
    thing('rasgulla', 880, 560, 0.8),
  ]);

const momo = () =>
  doc(W, H, [
    sky('s', '#8EC9FF', '#E6F4FF', 480),
    mountain(250, 400, 520, 300, '#8C9CC4'),
    mountain(560, 420, 640, 380, '#7C8DB5'),
    mountain(860, 410, 460, 260, '#8C9CC4'),
    cloud(140, 120, 0.7),
    cloud(870, 80, 0.6),
    hills(420, W, 26, '#6CBF6A', 2.4, 1),
    teaRows(450, 7, 4),
    toyTrain(150, 560, 0.55),
    star('momo'),
    rhododendron(960, 470, 0.7),
    thing('momos', 880, 570, 0.8),
  ]);

// ---------------------------------------------------------------- wider scenes, for slide puzzles

const kites = () =>
  doc(W, H, [
    sky('s', '#57C3F2', '#D9F3FF', 520),
    cloud(480, 80, 0.7),
    ...[
      [120, 80, '#FF4F79', '#FFD43B', -10, 0.7],
      [300, 150, '#7ED957', '#2E6FD9', 8, 0.6],
      [520, 210, '#9B7BFF', '#FF9F1C', -6, 0.75],
      [700, 70, '#E53935', '#FFFFFF', 14, 0.6],
      [880, 170, '#FF9F1C', '#2E6FD9', -16, 0.7],
      [410, 50, '#FFD43B', '#E53935', 4, 0.45],
      [800, 300, '#2FA36B', '#FFD43B', 10, 0.5],
      [60, 260, '#FF7AA2', '#FFFFFF', -18, 0.45],
    ].map(([x, y, a, b, t, s]) => kite(x as number, y as number, s as number, a as string, b as string, t as number)),
    // strings from the kites down to the friends
    ...[[120, 130, 230, 440], [520, 270, 470, 420], [880, 220, 830, 440], [300, 190, 650, 450]].map(([x1, y1, x2, y2]) => line(`M${x1},${y1} Q${(x1 + x2) / 2},${y2 - 60} ${x2},${y2}`, INK, 2, { opacity: 0.5 })),
    friend('kesar', 190, 250, 0.44),
    friend('raja', 430, 214, 0.5),
    friend('gappu', 620, 276, 0.38),
    friend('bholu', 790, 250, 0.44),
    rooftops(480),
    waterTank(950, 470),
    // windows with torans on the walls below, and a rooftop picnic of fafda, jalebi and dhokla
    ...[[60, 520], [330, 548], [600, 520], [820, 548]].map(([x, y], i) =>
      [rect(x, y, 90, 70, i % 2 ? '#2E6FD9' : '#3FA7B5', { rx: 8 }), line(`M${x + 45},${y} V${y + 70}`, WHITE, 5), toran(x - 10, x + 100, y - 8, 6, 12)].join(''),
    ),
    rect(140, 600, 700, 60, '#E53935', { rx: 10 }),
    ...[156, 196, 236, 276, 316, 356, 396, 436, 476, 516, 556, 596, 636, 676, 716, 756, 796].map((x, i) => rect(x, 600, 18, 60, i % 2 ? '#FFD43B' : '#FF9F1C')),
    thing('fafda', 300, 590, 0.5),
    thing('dhokla', 500, 586, 0.48),
    thing('lassi', 680, 580, 0.42),
  ]);

const boatRace = () => {
  const crew: [Who, number, number, number][] = [
    ['raja', 250, 300, 0.24],
    ['chikki', 350, 310, 0.22],
    ['bholu', 450, 300, 0.24],
    ['kesar', 550, 300, 0.23],
    ['gappu', 650, 312, 0.22],
    ['mithu', 735, 318, 0.2],
  ];
  return doc(W, H, [
    sky('s', '#8ED8F0', '#E6F8F3', 300),
    hills(270, W, 10, '#4FA65A', 4),
    palm(80, 300, 180, -8, 0.6),
    palm(300, 290, 200, 10, 0.55),
    palm(640, 296, 190, -6, 0.6),
    palm(900, 300, 210, 8, 0.6),
    rect(0, 290, W, 370, '#3FA7B5'),
    ...[340, 520, 600].map((y) => line(`M0,${y} Q80,${y - 10} 160,${y} T320,${y} T480,${y} T640,${y} T800,${y} T1000,${y}`, '#7FD0DA', 5)),
    // a second boat far behind
    put([path('M-260,0 Q0,24 260,0 L230,-14 Q0,6 -230,-14 Z', '#8E2B2B'), ...Array.from({ length: 10 }, (_, i) => circle(-200 + i * 44, -22, 10, '#5B3A1E'))], { x: 520, y: 330, s: 0.6 }),
    ...crew.map(([who, x, top, s]) => friend(who, x, top, s)),
    // Appu stands at the high stern, cheering the rowers on
    friend('appu', 850, 220, 0.3),
    // the long snake boat: low at the front, rising high at the back like a snake's hood
    path('M80,470 Q500,520 800,452 Q880,430 900,300 Q930,240 960,260 Q940,300 930,380 Q910,480 820,500 Q500,560 80,490 Z', '#2B2B3A'),
    line('M90,478 Q500,526 820,474', '#FFC93C', 7),
    circle(950, 252, 12, '#FFC93C'),
    ...crew.map(([, x], i) => line(`M${x - 10},${430 + i} L${x - 70},${560 + (i % 2) * 14}`, '#8A5A2B', 9)),
    ...crew.map(([, x], i) => path(`M${x - 92},${566 + (i % 2) * 14} q22,-30 44,0 q-22,14 -44,0 Z`, WHITE, { opacity: 0.85 })),
    line('M20,500 q30,-20 60,-6', WHITE, 6, { opacity: 0.8 }),
  ]);
};

const toyTrainScene = () => {
  const faces = [friend('bagha', -207, -112, 0.15), friend('mayil', -145, -116, 0.15), friend('pip', -83, -110, 0.14)];
  const driver = friend('momo', 92, -122, 0.13);
  return doc(W, H, [
    sky('s', '#8EC9FF', '#E6F4FF', 440),
    mountain(200, 380, 520, 260, '#8C9CC4'),
    mountain(520, 400, 640, 350, '#7C8DB5'),
    mountain(840, 390, 480, 250, '#8C9CC4'),
    cloud(700, 90, 0.7),
    cloud(160, 70, 0.5),
    hills(380, W, 24, '#6CBF6A', 2.4, 1),
    teaRows(400, 6, 7),
    // the track looping round the hill
    line('M-20,560 Q250,600 480,520 Q640,460 600,420 Q560,390 470,420', '#6B7A99', 8),
    toyTrain(560, 540, 1.35, faces, driver),
    friend('gappu', 890, 470, 0.3),
    thing('momos', 120, 600, 0.6),
    rhododendron(60, 480, 0.6),
  ]);
};

// ---------------------------------------------------------------- the finale

const bigPicture = () => {
  const r = seeded(21);
  const back: Who[] = ['mithu', 'kesar', 'appu', 'gauri', 'mayil', 'raja', 'tillu'];
  const front: Who[] = ['chunnu', 'bholu', 'gappu', 'pip', 'chikki', 'bagha', 'momo'];
  return doc(W, H, [
    sky('s', '#141A4A', '#3A2C7A'),
    radialGradient('glow', [[0, '#FFE48A', 0.9], [0.45, '#FFB13B', 0.35], [1, '#FF9F1C', 0]]),
    ...Array.from({ length: 40 }, () => circle(r() * W, r() * 300, r() > 0.8 ? 2.6 : 1.6, '#FFF3D6', { opacity: 0.8 })),
    burst(120, 120, 80, '#FF4F79'),
    burst(870, 110, 90, '#7CF3FF'),
    burst(700, 210, 50, '#FFD43B'),
    burst(260, 230, 46, '#7ED957'),
    stringLights(0, W, 0, 26, 24, 'glow'),
    // the banner
    path('M300,40 L690,40 L670,108 L320,108 Z', '#FF7A59'),
    path('M300,40 L270,74 L320,108 Z M690,40 L720,74 L670,108 Z', '#D9573A'),
    `<text x="495" y="92" font-size="46" fill="#FFF3D6" text-anchor="middle" font-family="Lilita One">Friendship Mela</text>`,
    kite(200, 330, 0.5, '#FF4F79', '#FFD43B', -14),
    kite(800, 330, 0.5, '#9B7BFF', '#FF9F1C', 14),
    ...back.map((who, i) => friend(who, 90 + i * 135, 170, 0.34)),
    ...front.map((who, i) => friend(who, 72 + i * 141, 290, 0.42)),
    // the stage, and every friend's gift for the Mela
    rect(0, 548, W, 112, '#6A3FA0'),
    line('M0,550 H990', '#FFC93C', 8),
    ...Array.from({ length: 16 }, (_, i) => marigold(30 + i * 62, 566, 13, i % 2 ? '#FFD23F' : '#FF9F1C')),
    thing('dhol', 90, 600, 0.5),
    thing('modak', 230, 610, 0.45),
    thing('rasgulla', 360, 612, 0.42),
    put(
      [ellipse(0, 0, 70, 22, '#FFF3D6'), ringOf(12, 0, 0, 52, (i) => ellipse(0, 0, 8, 14, ['#FF4F79', '#FFD43B', '#7ED957'][i % 3])), circle(0, 0, 16, '#FF9F1C')],
      { x: 495, y: 618, sy: 0.6 },
    ),
    thing('momos', 630, 612, 0.42),
    thing('sugarcane', 760, 600, 0.45),
    put(puppetShape(), { x: 900, y: 590, s: 0.4 }),
    ...[150, 300, 430, 560, 690, 830].map((x) => put([circle(0, -8, 40, 'url(#glow)'), path('M-22,4 Q0,26 22,4 Z', '#C8662F'), path('M0,2 C-8,-6 -4,-18 0,-26 C4,-18 8,-6 0,2 Z', '#FF8A1C')], { x, y: 652 })),
  ]);
};

export const SCENES: Record<string, () => string> = {
  bholu,
  kesar,
  raja,
  chikki,
  appu,
  mayil,
  bagha,
  momo,
  kites,
  'boat-race': boatRace,
  'toy-train': toyTrainScene,
  'big-picture': bigPicture,
};

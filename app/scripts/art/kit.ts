// The art kit: small functions that write SVG, so the game's pictures are made from reusable parts
// (faces, bodies, Indian festival motifs, skies and grounds) instead of hand-written files.
// Everything returns SVG text. scripts/art/build.ts renders it to PNG with resvg (no system tools needed).
//
// House style (matches the original art): flat colour, no outlines, big heads, white eyes with navy
// pupils and a glint, pink blush, soft navy ground shadows, and a few sparkles.

export const INK = '#1E2A4F';
export const BLUSH = '#F7A8B8';
export const WHITE = '#FFFFFF';

export type Attrs = Record<string, string | number | undefined>;

const num = (v: number) => String(Math.round(v * 100) / 100);
const attrs = (a: Attrs) =>
  Object.entries(a)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => ` ${k}="${typeof v === 'number' ? num(v) : v}"`)
    .join('');
const join = (children: string | string[]) => (Array.isArray(children) ? children.join('\n') : children);

export const el = (tag: string, a: Attrs, children?: string | string[]) =>
  children === undefined ? `<${tag}${attrs(a)}/>` : `<${tag}${attrs(a)}>${join(children)}</${tag}>`;

export const circle = (cx: number, cy: number, r: number, fill: string, a: Attrs = {}) => el('circle', { cx, cy, r, fill, ...a });
export const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, a: Attrs = {}) => el('ellipse', { cx, cy, rx, ry, fill, ...a });
export const rect = (x: number, y: number, width: number, height: number, fill: string, a: Attrs = {}) => el('rect', { x, y, width, height, fill, ...a });
export const path = (d: string, fill: string, a: Attrs = {}) => el('path', { d, fill, ...a });
/** A round-capped line along a path, no fill. */
export const line = (d: string, stroke: string, width: number, a: Attrs = {}) =>
  el('path', { d, stroke, 'stroke-width': width, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...a });
export const group = (children: string | string[], a: Attrs = {}) => el('g', a, children);

export type Place = { x?: number; y?: number; s?: number; sx?: number; sy?: number; r?: number; flip?: boolean; opacity?: number };
/** Move, scale, turn or mirror a drawing. Scale and turn happen around the drawing's own (0, 0). */
export function put(children: string | string[], { x = 0, y = 0, s = 1, sx, sy, r = 0, flip = false, opacity }: Place) {
  const kx = (sx ?? s) * (flip ? -1 : 1);
  const ky = sy ?? s;
  const t = [`translate(${num(x)} ${num(y)})`, r ? `rotate(${num(r)})` : '', kx !== 1 || ky !== 1 ? `scale(${num(kx)} ${num(ky)})` : ''].filter(Boolean).join(' ');
  return group(children, { transform: t, opacity });
}

/** A whole picture. */
export const doc = (w: number, h: number, children: string | string[]) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">\n${join(children)}\n</svg>\n`;

export function linearGradient(id: string, stops: [number, string, number?][], x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
  const s = stops.map(([o, c, op]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op })).join('');
  return el('defs', {}, el('linearGradient', { id, x1, y1, x2, y2 }, s));
}
export function radialGradient(id: string, stops: [number, string, number?][]) {
  const s = stops.map(([o, c, op]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': op })).join('');
  return el('defs', {}, el('radialGradient', { id }, s));
}

// ---------------------------------------------------------------- colour and randomness

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}
const hex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
/** Mix a colour towards white (amount > 0) or towards deep navy (amount < 0): the kit's only shading. */
export function shade(color: string, amount: number) {
  const [r, g, b] = rgb(color);
  const [tr, tg, tb] = amount >= 0 ? [255, 255, 255] : rgb('#1B1F3A');
  const k = Math.abs(amount);
  return hex(r + (tr - r) * k, g + (tg - g) * k, b + (tb - b) * k);
}

/** Seeded random numbers, so a field of flowers looks the same every time the art is built. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
export const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
/** `n` copies of a drawing around a centre, each turned to face outwards. */
export const ringOf = (n: number, cx: number, cy: number, r: number, draw: (i: number) => string, offset = -90) =>
  Array.from({ length: n }, (_, i) => {
    const deg = offset + (i * 360) / n;
    const [x, y] = polar(cx, cy, r, deg);
    return put(draw(i), { x, y, r: deg + 90 });
  }).join('');

// ---------------------------------------------------------------- faces

export type EyeOpts = { y?: number; lx?: number; rx?: number; w?: number; h?: number; look?: number; lashes?: boolean; sleepy?: boolean; pupil?: number };
export function eyes({ y = 258, lx = 252, rx = 366, w = 38, h = 44, look = 5, lashes = false, sleepy = false, pupil }: EyeOpts = {}) {
  const pr = pupil ?? Math.min(w, h) * 0.58;
  return [lx, rx]
    .map((x) => {
      const out = [ellipse(x, y, w, h, WHITE), circle(x + look, y + h * 0.16, pr, INK), circle(x + look + pr * 0.42, y + h * 0.16 - pr * 0.45, pr * 0.36, WHITE)];
      if (sleepy) out.push(path(`M${x - w - 2},${y - h - 2} H${x + w + 2} V${y - h * 0.15} Q${x},${y + h * 0.1} ${x - w - 2},${y - h * 0.15} Z`, 'currentColor'));
      if (lashes)
        for (const dx of [-0.62, -0.18, 0.26])
          out.push(line(`M${x + dx * w},${y - h * 0.9} l${dx < 0 ? -7 : dx > 0 ? 6 : 0},-18`, INK, 7));
      return out.join('');
    })
    .join('');
}

export const brows = (y = 192, lx = 252, rx = 366, lift = 0, w = 30) =>
  line(`M${lx - w - 2},${y + 8} Q${lx},${y - 14 - lift} ${lx + w},${y + 4}`, INK, 10) + line(`M${rx - w},${y + 4} Q${rx},${y - 14 - lift} ${rx + w + 2},${y + 8}`, INK, 10);

export const blush = (y = 340, lx = 190, rx = 428, r = 22) => circle(lx, y, r, BLUSH, { opacity: 0.85 }) + circle(rx, y, r, BLUSH, { opacity: 0.85 });

/** Open happy mouth (navy D with a pink tongue), or a closed smile. */
export function smile(cx = 309, y = 390, w = 44, open = true) {
  if (!open) return line(`M${cx - w},${y} Q${cx},${y + w * 0.9} ${cx + w},${y}`, INK, 9);
  return (
    path(`M${cx - w},${y} Q${cx},${y + w * 1.25} ${cx + w},${y} Z`, INK) +
    path(`M${cx - w * 0.52},${y + w * 0.5} Q${cx},${y + w * 0.12} ${cx + w * 0.52},${y + w * 0.5} Q${cx},${y + w * 1.02} ${cx - w * 0.52},${y + w * 0.5} Z`, '#FF8FA3')
  );
}

/** The body: a big rounded shape cut off by the picture's bottom edge, tucked under the head. */
export function bust(color: string, { rx = 196, cy = 660, belly }: { rx?: number; cy?: number; belly?: string } = {}) {
  return ellipse(309, cy, rx, rx * 0.95, color) + (belly ? ellipse(309, cy + 70, rx * 0.58, rx * 0.6, belly) : '');
}

/** A scarf wrapped round the neck, with an optional pattern drawn on top. */
export function scarf(color: string, { y = 456, w = 170, drop = true, pattern = '' }: { y?: number; w?: number; drop?: boolean; pattern?: string } = {}) {
  const band = path(`M${309 - w},${y} Q309,${y + 64} ${309 + w},${y} L${309 + w + 16},${y + 50} Q309,${y + 128} ${309 - w - 16},${y + 50} Z`, color);
  const tail = drop ? path(`M${309 + w * 0.42},${y + 60} L${309 + w * 0.62},${y + 150} L${309 + w * 0.86},${y + 140} L${309 + w * 0.68},${y + 52} Z`, shade(color, -0.12)) : '';
  return tail + band + pattern;
}

// ---------------------------------------------------------------- little things

export const groundShadow = (cx: number, cy: number, rx: number, ry = rx * 0.16) => ellipse(cx, cy, rx, ry, INK, { opacity: 0.12 });
export const sparkle = (cx: number, cy: number, r = 14, color = '#FFC93C') =>
  path(`M${cx},${cy - r} L${cx + r * 0.3},${cy - r * 0.3} L${cx + r},${cy} L${cx + r * 0.3},${cy + r * 0.3} L${cx},${cy + r} L${cx - r * 0.3},${cy + r * 0.3} L${cx - r},${cy} L${cx - r * 0.3},${cy - r * 0.3} Z`, color);

export function cloud(cx: number, cy: number, s = 1, color = WHITE) {
  return put([ellipse(0, 18, 86, 30, color), circle(-34, 4, 34, color), circle(10, -10, 44, color), circle(50, 8, 30, color)], { x: cx, y: cy, s });
}

export function sun(cx: number, cy: number, r: number, color = '#FFD43B', rays = true) {
  const out = [circle(cx, cy, r * 1.35, color, { opacity: 0.25 }), circle(cx, cy, r, color)];
  if (rays) out.unshift(ringOf(12, cx, cy, r * 1.6, () => path(`M-6,0 L0,-${r * 0.36} L6,0 Z`, color, { opacity: 0.7 })));
  return out.join('');
}

/** Bunting: little flags hung along a sagging string. */
export function bunting(x0: number, x1: number, y: number, sag: number, colors: string[], size = 34, mirror = false) {
  const n = Math.max(4, Math.round((x1 - x0) / (size * 1.5)));
  const at = (t: number) => ({ x: x0 + (x1 - x0) * t, y: y + 4 * sag * t * (1 - t) });
  const out = [line(`M${x0},${y} Q${(x0 + x1) / 2},${y + 2 * sag} ${x1},${y}`, '#8A7A9E', 4)];
  for (let i = 0; i < n; i++) {
    const p = at((i + 0.5) / n);
    const c = colors[i % colors.length];
    out.push(path(`M${p.x - size / 2},${p.y} L${p.x + size / 2},${p.y} L${p.x},${p.y + size * 1.1} Z`, c));
    if (mirror) out.push(circle(p.x, p.y + size * 0.36, size * 0.13, '#E8F4FF'), circle(p.x, p.y + size * 0.36, size * 0.07, WHITE));
  }
  return out.join('');
}

/** Marigold flower: a ball of orange or yellow petals. */
export function marigold(cx: number, cy: number, r: number, color = '#FF9F1C') {
  return [circle(cx, cy, r, color), ringOf(10, cx, cy, r * 0.62, () => circle(0, 0, r * 0.42, shade(color, -0.1))), circle(cx, cy, r * 0.45, shade(color, 0.25))].join('');
}

/** A toran: a string of mango leaves and marigolds hung over a doorway or along the top of a picture. */
export function toran(x0: number, x1: number, y: number, sag = 16, size = 22) {
  const n = Math.round((x1 - x0) / (size * 1.6));
  const out = [line(`M${x0},${y} Q${(x0 + x1) / 2},${y + 2 * sag} ${x1},${y}`, '#7A4E1E', 4)];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const yy = y + 4 * sag * t * (1 - t);
    if (i % 2) out.push(path(`M${x},${yy} q${size * 0.55},${size * 0.9} 0,${size * 2.1} q${-size * 0.55},${-size * 1.2} 0,${-size * 2.1} Z`, i % 4 === 1 ? '#3E9B4F' : '#58B85E'));
    else out.push(marigold(x, yy + size * 0.5, size * 0.55, i % 4 === 0 ? '#FF9F1C' : '#FFD23F'));
  }
  return out.join('');
}

/** Diwali lamp with a glowing flame. */
export function diya(cx: number, cy: number, s = 1, glowId?: string) {
  return put(
    [
      glowId ? circle(0, -8, 70, `url(#${glowId})`) : '',
      path('M-34,6 Q0,40 34,6 Z', '#C8662F'),
      path('M-34,6 Q0,18 34,6 Q0,26 -34,6 Z', '#8E3F18'),
      path('M0,4 C-12,-8 -6,-28 0,-40 C6,-28 12,-8 0,4 Z', '#FF8A1C'),
      path('M0,0 C-6,-8 -3,-20 0,-28 C3,-20 6,-8 0,0 Z', '#FFE48A'),
    ],
    { x: cx, y: cy, s },
  );
}

/** A diamond kite with a little tail. */
export function kite(cx: number, cy: number, s = 1, a = '#FF4F79', b = '#FFD43B', turn = 0) {
  return put(
    [
      path('M0,-60 L44,0 L0,70 L-44,0 Z', a),
      path('M0,-60 L44,0 L0,0 Z', b),
      path('M0,0 L-44,0 L0,70 Z', b),
      line('M0,-60 L0,70 M-44,0 L44,0', WHITE, 3, { opacity: 0.7 }),
      line('M0,70 q14,22 -6,40 q-18,18 4,36', '#FFFFFF', 5, { opacity: 0.9 }),
      path('M-4,96 l-14,-6 6,14 z M2,128 l14,-8 -4,14 z', a),
    ],
    { x: cx, y: cy, s, r: turn },
  );
}

/** Coconut palm, leaning a little. */
export function palm(x: number, y: number, h: number, lean = 8, s = 1) {
  const top: [number, number] = [lean * (h / 100), -h];
  const trunk = line(`M0,0 Q${top[0] * 0.2},${-h * 0.5} ${top[0]},${top[1]}`, '#9C6B3C', 22);
  const rings = Array.from({ length: 7 }, (_, i) => {
    const t = (i + 1) / 8;
    const px = top[0] * t * t;
    return line(`M${px - 10},${-h * t} l20,2`, '#7A5230', 4);
  }).join('');
  const leaf = (deg: number, len: number) =>
    put(path(`M0,0 Q${len * 0.5},${-len * 0.28} ${len},${len * 0.18} Q${len * 0.5},${-len * 0.06} 0,0 Z`, deg % 2 ? '#2F9E4F' : '#43B85F'), { x: top[0], y: top[1], r: deg });
  const leaves = [-170, -140, -100, -60, -25, 10, 160].map((d, i) => leaf(d + (i % 2), 120 + (i % 3) * 18)).join('');
  const nuts = [circle(top[0] - 8, top[1] + 12, 11, '#6B8E23'), circle(top[0] + 10, top[1] + 14, 11, '#7FA132')].join('');
  return put([trunk, rings, leaves, nuts], { x, y, s });
}

/** Rolling hills: a band of ground with a wavy top edge. */
export function hills(y: number, w: number, h: number, color: string, waves = 3, phase = 0, bottom = 2000) {
  const pts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const x = (i / 40) * w;
    pts.push(`${num(x)},${num(y - Math.sin((i / 40) * waves * TAU * 0.5 + phase) * h)}`);
  }
  return path(`M0,${bottom} L${pts.join(' L')} L${w},${bottom} Z`, color);
}

/** A field of little flowers (or anything) scattered in rows, nearer ones bigger. */
export function field(x0: number, x1: number, y0: number, y1: number, rows: number, perRow: number, draw: (x: number, y: number, s: number, i: number) => string, seed = 1) {
  const rnd = seeded(seed);
  const out: string[] = [];
  for (let r = 0; r < rows; r++) {
    const t = rows === 1 ? 1 : r / (rows - 1);
    const y = y0 + (y1 - y0) * t;
    const s = 0.55 + 0.6 * t;
    const n = Math.round(perRow * (1.2 - 0.4 * t));
    for (let i = 0; i < n; i++) out.push(draw(x0 + ((i + 0.5 + (rnd() - 0.5) * 0.7) / n) * (x1 - x0), y + (rnd() - 0.5) * 10, s, r * 100 + i));
  }
  return out.join('');
}

/** Rain: slanted streaks over the whole picture. */
export function rain(w: number, h: number, n: number, seed = 7, color = '#FFFFFF') {
  const rnd = seeded(seed);
  return Array.from({ length: n }, () => {
    const x = rnd() * (w + 80);
    const y = rnd() * h;
    const len = 26 + rnd() * 22;
    return line(`M${x},${y} l${-len * 0.3},${len}`, color, 4, { opacity: 0.55 });
  }).join('');
}

/** Snow-capped mountain. */
export function mountain(cx: number, base: number, w: number, h: number, color = '#7C8DB5', snow = '#FFFFFF') {
  const peak: [number, number] = [cx, base - h];
  const capY = base - h * 0.68;
  return [
    path(`M${cx - w / 2},${base} L${peak[0]},${peak[1]} L${cx + w / 2},${base} Z`, color),
    path(`M${cx},${base - h} L${cx + w / 2},${base} L${cx + w * 0.12},${base} Z`, shade(color, -0.12)),
    path(
      `M${cx - (w / 2) * 0.32},${capY} L${cx},${base - h} L${cx + (w / 2) * 0.32},${capY} L${cx + w * 0.08},${capY + 22} L${cx - w * 0.02},${capY + 6} L${cx - w * 0.1},${capY + 24} Z`,
      snow,
    ),
  ].join('');
}

/** A clay pot (matka): for Pongal it boils over with white foam. */
export function pot(cx: number, cy: number, s = 1, color = '#C8662F', boiling = false) {
  return put(
    [
      groundShadow(0, 78, 86),
      ellipse(0, 20, 80, 62, color),
      ellipse(-26, 4, 18, 30, shade(color, 0.25), { opacity: 0.6 }),
      rect(-46, -54, 92, 26, shade(color, -0.1), { rx: 12 }),
      path('M-74,30 Q0,58 74,30', 'none', { stroke: '#FFD43B', 'stroke-width': 8 }),
      boiling ? [circle(-30, -62, 22, WHITE), circle(0, -72, 28, WHITE), circle(30, -62, 22, WHITE), path('M-46,-56 q-8,30 6,46 q10,-18 6,-46 Z', WHITE)].join('') : '',
    ],
    { x: cx, y: cy, s },
  );
}

/** A plate (top-down-ish oval) to put snacks on. */
export const plate = (cx: number, cy: number, rx: number, color = '#FFFFFF') =>
  [ellipse(cx, cy + 6, rx, rx * 0.3, '#C9D3E6'), ellipse(cx, cy, rx, rx * 0.3, color), ellipse(cx, cy, rx * 0.72, rx * 0.2, shade(color, -0.04))].join('');

/** A banana leaf, as used for serving food in the south. */
export function bananaLeaf(cx: number, cy: number, w: number, h: number) {
  return [
    path(`M${cx - w / 2},${cy} Q${cx - w * 0.3},${cy - h / 2} ${cx + w / 2},${cy - h * 0.3} Q${cx + w * 0.36},${cy + h / 2} ${cx - w / 2},${cy} Z`, '#3FAE5A'),
    line(`M${cx - w / 2 + 6},${cy} Q${cx},${cy - h * 0.06} ${cx + w / 2 - 10},${cy - h * 0.27}`, '#2E8A45', 5),
  ].join('');
}

/** Points along a sagging string, for lights and bunting. */
export function sagPoints(x0: number, x1: number, y: number, sag: number, n: number) {
  return Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    return [x0 + (x1 - x0) * t, y + 4 * sag * t * (1 - t)] as [number, number];
  });
}

export const BULBS = ['#FFD43B', '#FF7A59', '#7CF3FF', '#FF4F79', '#7ED957'];
export function stringLights(x0: number, x1: number, y: number, sag: number, n: number, glowId?: string) {
  return [
    line(`M${x0},${y} Q${(x0 + x1) / 2},${y + 2 * sag} ${x1},${y}`, '#0B1030', 4),
    ...sagPoints(x0, x1, y, sag, n).map(([x, yy], i) =>
      [glowId ? circle(x, yy + 14, 26, `url(#${glowId})`) : '', ellipse(x, yy + 14, 7, 10, BULBS[i % BULBS.length])].join(''),
    ),
  ].join('');
}

/** Fireworks burst, the children's sparkly kind. */
export function burst(cx: number, cy: number, r: number, color: string) {
  return [
    ...Array.from({ length: 12 }, (_, i) => {
      const a = (i * TAU) / 12;
      return line(`M${cx + Math.cos(a) * r * 0.3},${cy + Math.sin(a) * r * 0.3} L${cx + Math.cos(a) * r * 0.85},${cy + Math.sin(a) * r * 0.85}`, color, r * 0.07);
    }),
    ...Array.from({ length: 12 }, (_, i) => {
      const a = (i * TAU) / 12;
      return circle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.07, i % 2 ? '#FFF3D6' : color);
    }),
    circle(cx, cy, r * 0.12, '#FFF3D6'),
  ].join('');
}

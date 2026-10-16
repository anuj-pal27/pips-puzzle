// Rangoli: colour a festival floor pattern to look like the picture. The pattern is rings of shapes round
// a centre; tapping one shape fills every shape that matches it (the whole ring, or every other one in a
// two-colour ring), the way a rangoli repeats round and round. Pure functions, no React: unit-tested in
// __tests__/run.ts. The drawing itself is src/components/RangoliArt.tsx.

export type RangoliStyle = 'rangoli' | 'kolam' | 'pookalam' | 'alpana' | 'mandana';
export type RangoliShape = 'disc' | 'petal' | 'drop' | 'dot' | 'diamond' | 'leaf';
/** One ring: `count` shapes; with two colours they alternate round the ring. Ring 0 is the centre. */
export type RangoliRing = { shape: RangoliShape; count: number; colors: string[] };
export type RangoliConfig = { id: string; style: RangoliStyle; rings: RangoliRing[]; extra?: string[] };

export const STYLES: RangoliStyle[] = ['rangoli', 'kolam', 'pookalam', 'alpana', 'mandana'];
export const SHAPES: RangoliShape[] = ['disc', 'petal', 'drop', 'dot', 'diamond', 'leaf'];

/** Colour pots, by name. Names (not hex) so the server's settings stay readable. */
export const PALETTE: Record<string, string> = {
  red: '#E53935',
  orange: '#FF9F1C',
  yellow: '#FFD23F',
  green: '#3FAE5A',
  blue: '#2E6FD9',
  purple: '#9C6ADE',
  pink: '#FF5C8A',
  white: '#FFFFFF',
};

/** The floor each style is drawn on. */
export const GROUND: Record<RangoliStyle, { floor: string; guide: string; title: string }> = {
  rangoli: { floor: '#4B2E83', guide: 'rgba(255,255,255,0.55)', title: 'Rangoli' },
  kolam: { floor: '#4A3A2E', guide: 'rgba(255,255,255,0.6)', title: 'Kolam' },
  pookalam: { floor: '#8A6248', guide: 'rgba(255,255,255,0.55)', title: 'Pookalam' },
  alpana: { floor: '#A93226', guide: 'rgba(255,255,255,0.6)', title: 'Alpana' },
  mandana: { floor: '#9C4A26', guide: 'rgba(255,255,255,0.6)', title: 'Mandana' },
};

/** A group of shapes that are always painted together: one ring, or one colour of a two-colour ring. */
export type PaintClass = { ring: number; phase: number };
export const classKey = (c: PaintClass) => `${c.ring}:${c.phase}`;

export function paintClasses(cfg: RangoliConfig): PaintClass[] {
  return cfg.rings.flatMap((ring, i) => ring.colors.map((_, phase) => ({ ring: i, phase })));
}

export const targetColor = (cfg: RangoliConfig, c: PaintClass) => cfg.rings[c.ring].colors[c.phase];

/** The pots to choose from: every colour in the pattern, in order of first use, then any extra ones. */
export function palette(cfg: RangoliConfig): string[] {
  const out: string[] = [];
  for (const ring of cfg.rings) for (const c of ring.colors) if (!out.includes(c)) out.push(c);
  for (const c of cfg.extra ?? []) if (!out.includes(c)) out.push(c);
  return out;
}

// ---------------------------------------------------------------- geometry (a 200 x 200 box, centre 0,0)

export const OUTER = 92;
export const band = (cfg: RangoliConfig) => OUTER / (cfg.rings.length - 0.5);
export const ringRadius = (cfg: RangoliConfig, i: number) => band(cfg) * i;
/** Rings take turns being half a step round, so neighbouring rings interlock. */
export const ringOffset = (cfg: RangoliConfig, i: number) => (i % 2 ? 180 / cfg.rings[i].count : 0);

/** Where each shape sits: its ring, its place round the ring, centre and angle (degrees, 0 = up, clockwise). */
export type Slot = { ring: number; index: number; x: number; y: number; angle: number };
export function slots(cfg: RangoliConfig): Slot[] {
  return cfg.rings.flatMap((ring, i) =>
    Array.from({ length: ring.count }, (_, index) => {
      const angle = ringOffset(cfg, i) + (index * 360) / ring.count;
      const r = ringRadius(cfg, i);
      const rad = (angle * Math.PI) / 180;
      return { ring: i, index, x: r * Math.sin(rad), y: -r * Math.cos(rad), angle };
    }),
  );
}

export const slotClass = (cfg: RangoliConfig, s: Pick<Slot, 'ring' | 'index'>): PaintClass => ({ ring: s.ring, phase: s.index % cfg.rings[s.ring].colors.length });

/** Size of the shapes in a ring: as big as the ring's band allows without touching their neighbours. */
export function shapeSize(cfg: RangoliConfig, i: number): { w: number; h: number } {
  const b = band(cfg);
  if (i === 0) return { w: b * 0.5, h: b * 0.5 };
  const gap = (2 * Math.PI * ringRadius(cfg, i)) / cfg.rings[i].count;
  return { w: Math.min(b * 0.44, gap * 0.46), h: b * 0.46 };
}

/** SVG path of one shape, pointing up (outwards), centred on 0,0. */
export function shapePath(shape: RangoliShape, w: number, h: number): string {
  const f = (n: number) => Math.round(n * 100) / 100;
  switch (shape) {
    case 'disc':
    case 'dot': {
      const r = Math.min(w, h);
      return `M${f(-r)},0 a${f(r)},${f(r)} 0 1,0 ${f(2 * r)},0 a${f(r)},${f(r)} 0 1,0 ${f(-2 * r)},0 Z`;
    }
    case 'petal':
      return `M0,${f(-h)} Q${f(w * 1.3)},0 0,${f(h)} Q${f(-w * 1.3)},0 0,${f(-h)} Z`;
    case 'leaf':
      return `M0,${f(-h)} Q${f(w * 0.9)},${f(-h * 0.1)} 0,${f(h)} Q${f(-w * 0.9)},${f(-h * 0.1)} 0,${f(-h)} Z`;
    case 'drop':
      return `M0,${f(-h)} C${f(w * 0.7)},${f(-h * 0.2)} ${f(w)},${f(h * 0.5)} 0,${f(h)} C${f(-w)},${f(h * 0.5)} ${f(-w * 0.7)},${f(-h * 0.2)} 0,${f(-h)} Z`;
    case 'diamond':
      return `M0,${f(-h)} L${f(w)},0 L0,${f(h)} L${f(-w)},0 Z`;
  }
}

/**
 * Which paint class a tap lands on (x, y in the 200 x 200 box, centre 0,0), or null outside the pattern.
 * Generous on purpose: anywhere in a ring's band counts, and the nearest shape round the ring wins.
 */
export function hitClass(cfg: RangoliConfig, x: number, y: number): PaintClass | null {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const d = Math.hypot(x, y);
  const b = band(cfg);
  const ring = Math.round(d / b);
  if (ring < 0 || ring >= cfg.rings.length || d > OUTER + b * 0.15) return null;
  if (ring === 0) return { ring: 0, phase: 0 };
  const angle = ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360;
  const step = 360 / cfg.rings[ring].count;
  const index = ((Math.round((angle - ringOffset(cfg, ring)) / step) % cfg.rings[ring].count) + cfg.rings[ring].count) % cfg.rings[ring].count;
  return slotClass(cfg, { ring, index });
}

// ---------------------------------------------------------------- playing

export type RangoliState = { fills: Record<string, string>; paints: number; misses: number };

export const newRangoli = (): RangoliState => ({ fills: {}, paints: 0, misses: 0 });

/** Paint a class. Painting it the colour it already has does nothing; a colour that isn't the picture's is a miss. */
export function paint(cfg: RangoliConfig, s: RangoliState, c: PaintClass, color: string): RangoliState {
  const k = classKey(c);
  if (s.fills[k] === color) return s;
  return { fills: { ...s.fills, [k]: color }, paints: s.paints + 1, misses: s.misses + (targetColor(cfg, c) === color ? 0 : 1) };
}

export const rangoliDone = (cfg: RangoliConfig, s: RangoliState) => paintClasses(cfg).every((c) => s.fills[classKey(c)] === targetColor(cfg, c));

/** How many classes are the right colour so far. */
export const rangoliProgress = (cfg: RangoliConfig, s: RangoliState) => paintClasses(cfg).filter((c) => s.fills[classKey(c)] === targetColor(cfg, c)).length;

/** 3 stars for at most one wrong colour, 2 for at most three, otherwise 1. */
export function rangoliStars(misses: number): 1 | 2 | 3 {
  if (misses <= 1) return 3;
  if (misses <= 3) return 2;
  return 1;
}

/** Problems with a pattern (empty if it's fine): used to check patterns sent by the server. */
export function checkRangoli(cfg: Partial<RangoliConfig>): string[] {
  const out: string[] = [];
  if (!cfg.style || !STYLES.includes(cfg.style)) out.push(`style must be one of ${STYLES.join(', ')}`);
  const rings = cfg.rings;
  if (!Array.isArray(rings) || rings.length < 2 || rings.length > 7) return [...out, 'needs a centre and 1 to 6 rings'];
  rings.forEach((ring, i) => {
    if (!ring || !SHAPES.includes(ring.shape)) out.push(`ring ${i}: unknown shape`);
    if (!Array.isArray(ring?.colors) || ring.colors.length < 1 || ring.colors.length > 2) out.push(`ring ${i}: one or two colours`);
    else if (ring.colors.some((c) => !(c in PALETTE))) out.push(`ring ${i}: colours are ${Object.keys(PALETTE).join(', ')}`);
    const n = ring?.count;
    if (i === 0 ? n !== 1 : !Number.isInteger(n) || n < 4 || n > 32) out.push(`ring ${i}: ${i === 0 ? 'the centre has count 1' : 'count must be 4 to 32'}`);
    else if (ring.colors?.length === 2 && n % 2) out.push(`ring ${i}: a two-colour ring needs an even count`);
  });
  if ((cfg.extra ?? []).some((c) => !(c in PALETTE))) out.push('extra colours must be palette colours');
  return out;
}

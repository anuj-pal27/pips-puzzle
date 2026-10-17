// Make the map of India the journey map draws (src/data/indiaOutline.ts): India's outline, simplified to a few
// hundred points, from Natural Earth's "India point of view" country boundaries. That version draws India the way
// India's official maps do (all of Jammu & Kashmir and Ladakh, Aksai Chin, Arunachal Pradesh), which is the only
// way a map of India can be shown in an Indian app. Natural Earth is public domain.
//
//   1. Download ne_10m_admin_0_countries_ind.geojson (about 13 MB, not committed) from
//      https://github.com/nvkelso/natural-earth-vector/tree/master/geojson
//   2. npm run india-map -- path/to/ne_10m_admin_0_countries_ind.geojson
//
// The script refuses to write the map unless the outline really is India's official one: it checks that places
// India's map includes (Gilgit, Muzaffarabad, Aksai Chin, Tawang) are inside it, and that every stop on the
// trip (src/data/route.ts) is on land.

import { readFileSync, writeFileSync } from 'node:fs';

type Pt = [number, number];
type Feature = { properties: { ADM0_A3: string }; geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: Pt[][] | Pt[][][] } };

const file = process.argv[2];
if (!file) {
  console.error('Usage: npm run india-map -- path/to/ne_10m_admin_0_countries_ind.geojson');
  process.exit(1);
}
const india = (JSON.parse(readFileSync(file, 'utf8')) as { features: Feature[] }).features.find((f) => f.properties.ADM0_A3 === 'IND');
if (!india) throw new Error('No India (ADM0_A3 = IND) in that file');
const polygons = (india.geometry.type === 'Polygon' ? [india.geometry.coordinates] : india.geometry.coordinates) as Pt[][][];

// ---------------------------------------------------------------- is it India's official outline?

function inRing([x, y]: Pt, ring: Pt[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[j];
    if (y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) inside = !inside;
  }
  return inside;
}
const inIndia = (lonLat: Pt) => polygons.some(([outer, ...holes]) => inRing(lonLat, outer) && !holes.some((h) => inRing(lonLat, h)));
const MUST_INCLUDE: Record<string, Pt> = { Gilgit: [74.31, 35.92], Muzaffarabad: [73.47, 34.37], 'Aksai Chin': [79.4, 35.2], Siachen: [77.1, 35.4], Tawang: [91.86, 27.59] };
for (const [place, lonLat] of Object.entries(MUST_INCLUDE)) {
  if (!inIndia(lonLat)) throw new Error(`${place} is not inside this outline: it is not India's official map. Use the "_ind" (India point of view) file.`);
}

// ---------------------------------------------------------------- flatten it onto the page

// A simple flat map: degrees of longitude shrunk to their length at 22°N (the middle of India), so the country
// keeps its shape. The page is 1000 units wide; the game scales it to fit.
const PAD = 0.4;
const lons = polygons.flatMap(([outer]) => outer.map((p) => p[0]));
const lats = polygons.flatMap(([outer]) => outer.map((p) => p[1]));
const lon0 = Math.min(...lons) - PAD;
const latTop = Math.max(...lats) + PAD;
const kx = Math.cos((22 * Math.PI) / 180);
const scale = 1000 / ((Math.max(...lons) + PAD - lon0) * kx);
const height = Math.round((latTop - (Math.min(...lats) - PAD)) * scale);
const project = ([lon, lat]: Pt): Pt => [(lon - lon0) * kx * scale, (latTop - lat) * scale];

/** Douglas-Peucker: drop points that are closer than `tol` to the line the others make. */
function simplify(points: Pt[], tol: number): Pt[] {
  if (points.length < 4) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let far = -1;
    let farDist = tol;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const d = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / len;
      if (d > farDist) {
        far = i;
        farDist = d;
      }
    }
    if (far >= 0) {
      keep[far] = 1;
      stack.push([a, far], [far, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** A closed ring starts and ends on the same point, which Douglas-Peucker can't measure from: split it in two. */
function simplifyRing(ring: Pt[], tol: number): Pt[] {
  const open = ring.slice(0, -1);
  const [x0, y0] = open[0];
  let far = 0;
  open.forEach(([x, y], i) => {
    if (Math.hypot(x - x0, y - y0) > Math.hypot(open[far][0] - x0, open[far][1] - y0)) far = i;
  });
  return [...simplify(open.slice(0, far + 1), tol), ...simplify([...open.slice(far), open[0]], tol).slice(1, -1)];
}

const TOLERANCE = 1.2; // map units: about a third of a pixel on a phone
const SMALLEST = 3; // islands smaller than this (map units across) are too small to see
const rings: Pt[][] = [];
for (const [outer] of polygons) {
  const flat = outer.map(project);
  const xs = flat.map((p) => p[0]);
  const ys = flat.map((p) => p[1]);
  if (Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) < SMALLEST) continue;
  const ring = simplifyRing(flat, TOLERANCE)
    .map(([x, y]) => [Math.round(x), Math.round(y)] as Pt)
    .filter((p, i, all) => i === 0 || p[0] !== all[i - 1][0] || p[1] !== all[i - 1][1]);
  if (ring.length >= 4) rings.push(ring);
}
rings.sort((a, b) => b.length - a.length); // the mainland first
const outline = rings.map((r) => `M${r.map(([x, y]) => `${x} ${y}`).join('L')}Z`).join('');

// ---------------------------------------------------------------- every stop on land

// On the simplified outline, the one that's drawn: a pin right on the coast can end up just out to sea.
const { INDIA_ROUTE } = await import('../src/data/route.ts');
for (const stop of INDIA_ROUTE) {
  const onLand = rings.some((ring) => inRing(project([stop.lon, stop.lat]), ring));
  if (!stop.boat && !onLand) throw new Error(`${stop.place} (${stop.lat}, ${stop.lon}) is not on land: move it a little inland`);
}

const out = new URL('../src/data/indiaOutline.ts', import.meta.url);
writeFileSync(
  out,
  [
    "// Made by `npm run india-map` (scripts/make-india-map.ts) from Natural Earth's India point-of-view country",
    "// boundaries (public domain): India as India's official maps show it. Don't edit by hand.",
    '',
    '/** How longitude and latitude become map units (`onMap` below). */',
    `export const INDIA_PROJECTION = { lon0: ${lon0.toFixed(4)}, latTop: ${latTop.toFixed(4)}, kx: ${kx.toFixed(6)}, scale: ${scale.toFixed(4)} };`,
    '',
    '/** The map is this many units across and down. */',
    `export const INDIA_SIZE = { width: 1000, height: ${height} };`,
    '',
    '/** Where a place goes on the map, in map units from the top left. */',
    'export function onMap(lat: number, lon: number): [number, number] {',
    '  const p = INDIA_PROJECTION;',
    '  return [(lon - p.lon0) * p.kx * p.scale, (p.latTop - lat) * p.scale];',
    '}',
    '',
    `/** India's outline as SVG path data: the mainland, then the larger islands (${rings.length} shapes, ${rings.reduce((n, r) => n + r.length, 0)} points). */`,
    `export const INDIA_OUTLINE =\n  '${outline}';`,
    '',
  ].join('\n'),
);
console.log(`src/data/indiaOutline.ts: ${rings.length} shapes, ${rings.reduce((n, r) => n + r.length, 0)} points, ${(outline.length / 1024).toFixed(1)} KB, 1000 x ${height}`);

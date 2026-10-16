// Draw the game's art and save it as PNGs in assets/images/game/.
//
//   npm run art                 everything
//   npm run art -- bholu kites  only pictures whose name contains "bholu" or "kites"
//   npm run art -- --preview    also write a contact sheet of everything drawn (art-preview.png, not committed)
//
// Pictures come from two places:
//   - the kit (cast.ts, scenes.ts, things.ts): friends, places, snacks and gifts, written as code
//   - hand-written SVG files in this folder (e.g. diwali-shop.svg)
// SVGs may use the game's existing PNGs by file name (<image href="shop.png">): they are inlined before drawing.
// Needs Node 22.6 or newer (it runs TypeScript directly), like `npm run test:logic`.

import { Resvg } from '@resvg/resvg-js';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CAST } from './cast.ts';
import { doc } from './kit.ts';
import { SCENES } from './scenes.ts';
import { THINGS } from './things.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, '..', '..');
const OUT = join(APP, 'assets', 'images', 'game');
const FONTS = [
  join(APP, 'node_modules/@expo-google-fonts/lilita-one/400Regular/LilitaOne_400Regular.ttf'),
  join(APP, 'node_modules/@expo-google-fonts/baloo-2/800ExtraBold/Baloo2_800ExtraBold.ttf'),
];

/** Every picture the kit draws, by output name (assets/images/game/<name>.png). */
function kitPictures(): Record<string, () => string> {
  const out: Record<string, () => string> = {};
  for (const [id, draw] of Object.entries(CAST)) out[`${id}-cut`] = () => doc(618, 660, draw());
  Object.assign(out, SCENES, THINGS);
  return out;
}

/** Inline <image href="name.png"> references to the game's existing pictures. */
function inlineImages(svg: string): string {
  return svg.replace(/href="([\w-]+\.png)"/g, (whole, file: string) => {
    const p = join(OUT, file);
    if (!existsSync(p)) throw new Error(`SVG uses ${file}, which isn't in assets/images/game`);
    return `href="data:image/png;base64,${readFileSync(p).toString('base64')}"`;
  });
}

export function render(svg: string, width?: number): Buffer {
  const r = new Resvg(inlineImages(svg), {
    font: { fontFiles: FONTS, loadSystemFonts: false, defaultFontFamily: 'Lilita One' },
    fitTo: width ? { mode: 'width', value: width } : { mode: 'original' },
  });
  return r.render().asPng();
}

function main() {
  const args = process.argv.slice(2);
  const preview = args.includes('--preview');
  const filters = args.filter((a) => !a.startsWith('--'));
  const wanted = (name: string) => !filters.length || filters.some((f) => name.includes(f));

  const jobs: [string, () => string][] = Object.entries(kitPictures());
  // Hand-written SVGs, sweets before thumbnails (the thumbnails use the sweets).
  const files = readdirSync(HERE)
    .filter((f) => f.endsWith('.svg'))
    .sort((a, b) => Number(a.includes('thumb')) - Number(b.includes('thumb')) || a.localeCompare(b));
  for (const f of files) jobs.push([f.replace(/\.svg$/, ''), () => readFileSync(join(HERE, f), 'utf8')]);

  const made: string[] = [];
  for (const [name, draw] of jobs) {
    if (!wanted(name)) continue;
    const png = render(draw());
    writeFileSync(join(OUT, `${name}.png`), png);
    made.push(name);
    console.log(`assets/images/game/${name}.png  ${(png.length / 1024).toFixed(0)} KB`);
  }
  if (!made.length) console.log('Nothing matched:', filters.join(', '));
  if (preview && made.length) writeFileSync(join(APP, 'art-preview.png'), contactSheet(made));
}

/** All the pictures just drawn, side by side on one page, to look over at a glance. */
function contactSheet(names: string[]): Buffer {
  const cell = 240;
  const cols = Math.min(6, names.length);
  const rows = Math.ceil(names.length / cols);
  const tiles = names.map((n, i) => {
    const x = (i % cols) * cell;
    const y = Math.floor(i / cols) * (cell + 28);
    const data = readFileSync(join(OUT, `${n}.png`)).toString('base64');
    return `<rect x="${x + 4}" y="${y + 4}" width="${cell - 8}" height="${cell - 8}" rx="12" fill="#F3EEE6"/>
<image href="data:image/png;base64,${data}" x="${x + 10}" y="${y + 10}" width="${cell - 20}" height="${cell - 20}" preserveAspectRatio="xMidYMid meet"/>
<text x="${x + cell / 2}" y="${y + cell + 18}" font-size="17" text-anchor="middle" fill="#1E2A4F" font-family="Lilita One">${n}</text>`;
  });
  return render(doc(cols * cell, rows * (cell + 28), [`<rect width="100%" height="100%" fill="#FFFFFF"/>`, ...tiles]));
}

main();

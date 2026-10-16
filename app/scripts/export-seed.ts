// Write the server's starting puzzles (backend/content/seed.json) from the app's built-in list
// (src/data/puzzles.ts), so the two always match. Then, in backend/: python manage.py seed_puzzles
//
//   npm run seed

import { writeFileSync } from 'node:fs';

import { PUZZLES } from '../src/data/puzzles.ts';
import { toSeed } from '../src/data/seed.ts';

const out = new URL('../../backend/content/seed.json', import.meta.url);
writeFileSync(out, JSON.stringify(PUZZLES.map(toSeed), null, 2) + '\n');
console.log(`backend/content/seed.json: ${PUZZLES.length} puzzles`);

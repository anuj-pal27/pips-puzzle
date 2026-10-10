// Logic tests for every puzzle kind's rules. Run with:  npm run test:logic
// Plain Node (no test framework needed). Fails with a non-zero exit code if anything is wrong.
import assert from 'node:assert/strict';

import { SHADOW_GAMES, SLIDE_GAMES, SNAP_GAMES, TRACK_GAMES } from '../../data/games.ts';
import { MAZES } from '../../data/mazes.ts';
import { jigsawStars, pieceMargin, piecePath, slotPath, startTurns, trayLayout } from '../jigsaw.ts';
import { canFlip, flipCard, memoryDone, memoryStars, newMemory, pairResult, seededRandom, settle } from '../memory.ts';
import { nearestSlot, shadowStars, trayOrder } from '../shadow.ts';
import { BLANK, canSlide, isSolvable, isSolved, neighbours, slideStars, slideTile, solvedBoard } from '../slide.ts';
import { initTracks, isTrack, openings, SCENERY, solvedTracks, tapPiece, traceTracks, tracksPar, tracksStars } from '../tracks.ts';
import type { Cell, Dir, MazeConfig, MazeState } from '../maze.ts';
import { findTile, gateIsOpen, initMaze, leverGate, monkeyCell, stepMaze, tileAt } from '../maze.ts';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ok  ${name}`);
}

// ---------------------------------------------------------------- jigsaw
for (const g of [
  { cols: 3, rows: 2, pw: 110, ph: 110 },
  { cols: 4, rows: 3, pw: 82, ph: 73 },
  { cols: 5, rows: 4, pw: 66, ph: 66 },
]) {
  const n = g.cols * g.rows;
  test(`jigsaw ${n} pieces: outlines stay inside each piece's drawing box`, () => {
    const m = pieceMargin(g);
    for (let id = 0; id < n; id++) {
      const nums = piecePath(g, Math.floor(id / g.cols), id % g.cols, m, m).match(/-?\d+(\.\d+)?/g)!.map(Number);
      assert.ok(Math.min(...nums) >= 0, 'outline goes past the left/top');
      assert.ok(Math.max(...nums) <= Math.max(g.pw, g.ph) + 2 * m, 'outline goes past the right/bottom');
    }
  });
  test(`jigsaw ${n} pieces: tray holds every piece exactly once`, () => {
    const spots = trayLayout(g, 390, 380);
    assert.equal(spots.length, n);
    assert.deepEqual(new Set(spots.map((s) => s.id)).size, n);
    assert.ok(slotPath(g).startsWith('M 0 0'));
  });
}
test('jigsaw stars', () => {
  assert.equal(jigsawStars(false, 0), 3);
  assert.equal(jigsawStars(true, 0), 2);
  assert.equal(jigsawStars(true, 20), 1);
});
test('spin jigsaw: most pieces start turned, some upright, always the same', () => {
  for (const n of [6, 12, 20]) {
    const turns = startTurns(n);
    assert.deepEqual(turns, startTurns(n));
    assert.ok(turns.every((t) => Number.isInteger(t) && t >= 0 && t <= 3));
    const turned = turns.filter(Boolean).length;
    assert.ok(turned >= n * 0.5 && turned < n, `${turned} of ${n} turned`);
  }
});

// ---------------------------------------------------------------- mazes
const DIRS: [Dir, number, number][] = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];

/** Breadth-first search over (cell, levers, switch), ignoring monkeys. Returns the first move, or null. */
function plan(cfg: MazeConfig, from: Cell, levers: string[], flip: boolean, goal: string, opts: { noLevers?: boolean; noSwitch?: boolean } = {}): Dir | null | 'here' {
  const enc = (p: Cell, lv: string[], fl: boolean) => `${p}|${[...lv].sort().join('')}|${fl ? 1 : 0}`;
  const seen = new Map<string, { prev: string; dir: Dir } | null>([[enc(from, levers, flip), null]]);
  const q: [Cell, string[], boolean][] = [[from, levers, flip]];
  while (q.length) {
    const [p, lv, fl] = q.shift()!;
    if (p.join(',') === goal) {
      let k = enc(p, lv, fl);
      let first: Dir | null = null;
      while (seen.get(k)) {
        first = seen.get(k)!.dir;
        k = seen.get(k)!.prev;
      }
      return first ?? 'here';
    }
    for (const [dir, dc, dr] of DIRS) {
      const n: Cell = [p[0] + dc, p[1] + dr];
      const t = tileAt(cfg, n[0], n[1]);
      if (t === '#' || t === 'R' || t === 'C') continue;
      if (cfg.gates[t] && !gateIsOpen(cfg, t, { levers: Object.fromEntries(lv.map((l) => [l, true])), flip: fl })) continue;
      if (t === 'J' && n.join(',') !== goal) continue;
      let nlv = lv;
      let nfl = fl;
      if (leverGate(cfg, t) && !opts.noLevers && !lv.includes(t)) nlv = [...lv, t];
      if (t === 'x' && !opts.noSwitch) nfl = !fl;
      const k = enc(n, nlv, nfl);
      if (seen.has(k)) continue;
      seen.set(k, { prev: enc(p, lv, fl), dir });
      q.push([n, nlv, nfl]);
    }
  }
  return null;
}

for (const cfg of Object.values(MAZES)) {
  const S = findTile(cfg, 'S');
  const J = findTile(cfg, 'J').join(',');
  const hasSwitch = cfg.map.some((row) => row.includes('x'));

  test(`maze ${cfg.id}: rectangular map with one start and one goal`, () => {
    assert.ok(cfg.map.every((row) => row.length === cfg.map[0].length));
    assert.equal(cfg.map.join('').split('S').length - 1, 1);
    assert.equal(cfg.map.join('').split('J').length - 1, 1);
  });
  test(`maze ${cfg.id}: solvable, and only by using the levers${hasSwitch ? ' and the switch' : ''}`, () => {
    assert.ok(plan(cfg, S, [], false, J));
    assert.equal(plan(cfg, S, [], false, J, { noLevers: true }), null);
    if (hasSwitch) assert.equal(plan(cfg, S, [], false, J, { noSwitch: true }), null);
  });
  test(`maze ${cfg.id}: every laddoo can be reached without touching the jalebis`, () => {
    cfg.map.forEach((row, r) =>
      row.split('').forEach((ch, c) => {
        if (ch === 'o') assert.ok(plan(cfg, S, [], false, `${c},${r}`), `laddoo ${c},${r}`);
      }),
    );
  });
  test(`maze ${cfg.id}: monkey lanes are plain road`, () => {
    cfg.monkeys.forEach((L) => {
      for (let x = L.min; x <= L.max; x++) {
        const t = L.axis === 'h' ? tileAt(cfg, x, L.line) : tileAt(cfg, L.line, x);
        assert.ok(t === '.' || t === 'o', `lane tile '${t}'`);
      }
    });
  });

  // Random play through the real rules, then a planner bot must still be able to finish (no soft-locks).
  test(`maze ${cfg.id}: 300 random games never break the rules and can always be finished`, () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    for (let game = 0; game < 300; game++) {
      let s: MazeState = initMaze(cfg);
      const steps = Math.floor(rand() * 150);
      for (let n = 0; n < steps && !s.won; n++) {
        s = stepMaze(cfg, s, DIRS[Math.floor(rand() * 4)][0]);
        const t = tileAt(cfg, s.pos[0], s.pos[1]);
        assert.ok(t !== '#' && t !== 'R' && t !== 'C', 'Gappu is standing somewhere impossible');
        s.mons.forEach((m, i) => {
          const L = cfg.monkeys[i];
          const cell = monkeyCell(cfg, m, i);
          assert.ok(m.p >= L.min && m.p <= L.max, 'monkey left its lane');
          assert.ok(!(cell[0] === s.pos[0] && cell[1] === s.pos[1]), 'monkey on top of Gappu');
        });
      }
      for (let n = 0; n < 500 && !s.won; n++) {
        const lv = Object.keys(s.levers).filter((k) => s.levers[k]);
        const dir = plan(cfg, s.pos, lv, s.flip, J);
        assert.ok(dir && dir !== 'here', 'stuck: no way to the jalebis from here');
        s = stepMaze(cfg, s, dir);
      }
      assert.ok(s.won, 'bot could not finish');
    }
  });
}

// ---------------------------------------------------------------- fix the tracks
for (const cfg of Object.values(TRACK_GAMES)) {
  const route = traceTracks(cfg, solvedTracks(cfg)).cells;
  const onRoute = new Set(route.map(([c, r]) => `${c},${r}`));
  const period = (ch: string) => (ch === '|' || ch === '-' ? 2 : 4);

  test(`tracks ${cfg.id}: map and taps line up, only known pieces, scenery never needs taps`, () => {
    assert.equal(cfg.taps.length, cfg.map.length);
    cfg.map.forEach((row, r) => {
      assert.equal(row.length, cfg.map[0].length);
      assert.equal(cfg.taps[r].length, row.length);
      row.split('').forEach((ch, c) => {
        assert.ok(isTrack(ch) || (SCENERY as readonly string[]).includes(ch), `unknown tile '${ch}'`);
        assert.match(cfg.taps[r][c], /[0-3]/);
        if (!isTrack(ch)) assert.equal(cfg.taps[r][c], '0', `scenery ${c},${r} has taps`);
      });
    });
  });
  test(`tracks ${cfg.id}: the drawn route reaches the stall; the start doesn't; every route piece starts wrong`, () => {
    assert.ok(traceTracks(cfg, solvedTracks(cfg)).reached);
    assert.ok(!traceTracks(cfg, initTracks(cfg)).reached);
    route.forEach(([c, r]) => assert.notEqual(Number(cfg.taps[r][c]) % period(cfg.map[r][c]), 0, `route piece ${c},${r} already right`));
    assert.ok(route.length >= 8, 'route is too short to be interesting');
  });
  test(`tracks ${cfg.id}: tapping each route piece the right number of times fixes it in exactly par taps`, () => {
    let s = initTracks(cfg);
    for (const [c, r] of route) for (let k = 0; k < Number(cfg.taps[r][c]) % period(cfg.map[r][c]); k++) s = tapPiece(s, c, r);
    assert.ok(traceTracks(cfg, s).reached);
    assert.equal(s.taps, tracksPar(cfg));
  });
  test(`tracks ${cfg.id}: taps turn pieces clockwise and leave scenery alone`, () => {
    const s = initTracks(cfg);
    cfg.map.forEach((row, r) =>
      row.split('').forEach((ch, c) => {
        const after = tapPiece(s, c, r);
        if (!isTrack(ch)) return assert.equal(after, s);
        assert.equal(after.taps, 1);
        const [a, b] = openings(s.pieces[r][c]!);
        const [a2, b2] = openings(after.pieces[r][c]!);
        assert.deepEqual([a2, b2], [(a + 1) % 4, (b + 1) % 4]);
      }),
    );
  });
  test(`tracks ${cfg.id}: 300 random games: the joined-up line is always a real chain of track`, () => {
    const rand = seededRandom(11);
    const rows = cfg.map.length;
    const cols = cfg.map[0].length;
    for (let game = 0; game < 300; game++) {
      let s = initTracks(cfg);
      for (let n = 0; n < 60; n++) {
        s = tapPiece(s, Math.floor(rand() * cols), Math.floor(rand() * rows));
        const t = traceTracks(cfg, s);
        t.cells.forEach(([c, r], i) => {
          assert.ok(s.pieces[r][c], 'line runs through scenery');
          if (i) assert.equal(Math.abs(c - t.cells[i - 1][0]) + Math.abs(r - t.cells[i - 1][1]), 1, 'line jumps');
        });
        assert.equal(new Set(t.cells.map(String)).size, t.cells.length, 'line loops');
        if (t.reached) assert.deepEqual(t.cells.at(-1), [cfg.goal, rows - 1]);
      }
    }
  });
  if (cfg.id === 'hard') {
    test('tracks hard: has decoy pieces off the route', () => {
      const decoys = cfg.map.join('').split('').filter((ch, i) => isTrack(ch) && !onRoute.has(`${i % cfg.map[0].length},${Math.floor(i / cfg.map[0].length)}`));
      assert.ok(decoys.length >= 8, `${decoys.length} decoys`);
    });
  }
}
test('tracks stars', () => {
  assert.equal(tracksStars(13, 13), 3);
  assert.equal(tracksStars(25, 13), 2);
  assert.equal(tracksStars(80, 13), 1);
});

// ---------------------------------------------------------------- snack snap (memory)
for (const game of Object.values(SNAP_GAMES)) {
  test(`snack snap ${game.id}: every deal has two of each snack and no pair side by side`, () => {
    for (let seed = 1; seed <= 200; seed++) {
      const cards = newMemory(game.snacks, seededRandom(seed), game.cols).cards;
      assert.equal(cards.length, game.snacks.length * 2);
      game.snacks.forEach((sn) => assert.equal(cards.filter((c) => c === sn).length, 2));
      cards.forEach((c, i) => {
        if (i % game.cols < game.cols - 1) assert.notEqual(cards[i + 1], c, `seed ${seed}: pair side by side`);
      });
    }
  });
  test(`snack snap ${game.id}: a player with perfect memory always finishes, mismatches are counted`, () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rand = seededRandom(seed * 7);
      let s = newMemory(game.snacks, rand, game.cols);
      const seen = new Map<number, string>();
      let guard = 0;
      while (!memoryDone(s) && guard++ < 200) {
        // flip an unknown card, then its partner if we've seen it, else another unknown card
        const hidden = s.cards.map((_, i) => i).filter((i) => !s.matched.includes(i));
        const known = [...seen.entries()].filter(([i]) => hidden.includes(i));
        const pair = known.find(([i, sn]) => known.some(([j, sn2]) => j !== i && sn2 === sn));
        const first = pair ? pair[0] : hidden.find((i) => !seen.has(i))!;
        s = flipCard(s, first);
        seen.set(first, s.cards[first]);
        const partner = hidden.find((i) => i !== first && seen.get(i) === s.cards[first]);
        const second = partner ?? hidden.find((i) => i !== first && !seen.has(i))!;
        s = flipCard(s, second);
        seen.set(second, s.cards[second]);
        assert.ok(pairResult(s));
        assert.ok(!canFlip(s, hidden.find((i) => i !== first && i !== second) ?? -1), 'a third card could be flipped');
        s = settle(s);
        assert.equal(s.up.length, 0);
      }
      assert.ok(memoryDone(s), 'never finished');
      assert.ok(s.mismatches <= game.snacks.length, `perfect memory needed ${s.mismatches} misses`);
    }
  });
}
test('snack snap: matched and face-up cards cannot be flipped again', () => {
  let s = newMemory(['jalebi', 'laddoo'], seededRandom(3), 2);
  const a = 0;
  const b = s.cards.indexOf(s.cards[0], 1);
  s = settle(flipCard(flipCard(s, a), b));
  assert.deepEqual(s.matched.sort(), [a, b].sort());
  assert.equal(flipCard(s, a), s);
  const c = [0, 1, 2, 3].find((i) => !s.matched.includes(i))!;
  s = flipCard(s, c);
  assert.equal(flipCard(s, c), s);
  assert.equal(memoryStars(3, 3), 3);
  assert.equal(memoryStars(3, 6), 2);
  assert.equal(memoryStars(3, 7), 1);
});

// ---------------------------------------------------------------- who's that shadow?
test("shadow: friends never start under their own shadow; drops find the closest shadow", () => {
  for (let n = 2; n <= 6; n++) {
    const items = Array.from({ length: n }, (_, i) => i);
    const order = trayOrder(items);
    assert.deepEqual([...order].sort(), items);
    order.forEach((v, i) => assert.notEqual(v, i, `size ${n}: item ${v} in its own spot`));
  }
  for (const game of Object.values(SHADOW_GAMES)) assert.equal(new Set(game.friends).size, game.friends.length);
  const slots = [{ x: 0, y: 0 }, { x: 100, y: 0 }];
  assert.equal(nearestSlot(slots, 70, 10, 50), 1);
  assert.equal(nearestSlot(slots, 50, 200, 50), -1);
  assert.deepEqual([shadowStars(0), shadowStars(1), shadowStars(3), shadowStars(4)], [3, 3, 2, 1]);
});

// ---------------------------------------------------------------- slide puzzle
function slideDistance(board: number[], n: number): number {
  const key = (b: number[]) => b.join(',');
  const goal = key(solvedBoard(n));
  const seen = new Set([key(board)]);
  let frontier = [board];
  for (let d = 0; frontier.length; d++) {
    if (frontier.some((b) => key(b) === goal)) return d;
    const next: number[][] = [];
    for (const b of frontier) {
      for (const spot of neighbours(n, b.indexOf(BLANK))) {
        const nb = slideTile(b, n, spot);
        if (!seen.has(key(nb))) {
          seen.add(key(nb));
          next.push(nb);
        }
      }
    }
    frontier = next;
  }
  return -1;
}
for (const game of Object.values(SLIDE_GAMES)) {
  test(`slide ${game.id}: start is solvable, mixed up, and the best solution is exactly par (${game.par}) moves`, () => {
    const n = game.size;
    assert.deepEqual([...game.start].sort((a, b) => a - b), [...solvedBoard(n)].sort((a, b) => a - b));
    assert.ok(isSolvable(game.start, n));
    assert.ok(!isSolved(game.start));
    assert.equal(game.start.filter((t, i) => t === i).length, 0, 'some tiles start in place');
    assert.equal(slideDistance(game.start, n), game.par);
  });
}
test('slide: only tiles next to the gap move; solvability check agrees with real play', () => {
  const n = 3;
  const b = solvedBoard(n);
  assert.ok(isSolved(b));
  assert.ok(canSlide(b, n, 5) && canSlide(b, n, 7));
  assert.ok(!canSlide(b, n, 0) && !canSlide(b, n, 4));
  assert.equal(slideTile(b, n, 0), b);
  const moved = slideTile(b, n, 7);
  assert.deepEqual(moved.slice(6), [6, BLANK, 7]);
  const rand = seededRandom(5);
  for (let k = 0; k < 40; k++) {
    let x = solvedBoard(n);
    for (let m = 0; m < 30; m++) {
      const options = neighbours(n, x.indexOf(BLANK));
      x = slideTile(x, n, options[Math.floor(rand() * options.length)]);
    }
    assert.ok(isSolvable(x, n), 'a reachable board was called unsolvable');
    const swapped = x.slice();
    const [i, j] = [0, 1, 2, 3].filter((s) => swapped[s] !== BLANK).slice(0, 2);
    [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
    assert.ok(!isSolvable(swapped, n), 'a board with two tiles swapped was called solvable');
  }
  assert.deepEqual([slideStars(10, 10), slideStars(25, 10), slideStars(90, 10)], [3, 2, 1]);
});

console.log(`\n${passed} checks passed`);

// Logic tests for the jigsaw geometry and the maze rules. Run with:  npm run test:logic
// Plain Node (no test framework needed). Fails with a non-zero exit code if anything is wrong.
import assert from 'node:assert/strict';

import { MAZES } from '../../data/mazes.ts';
import { jigsawStars, pieceMargin, piecePath, slotPath, trayLayout } from '../jigsaw.ts';
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

console.log(`\n${passed} checks passed`);

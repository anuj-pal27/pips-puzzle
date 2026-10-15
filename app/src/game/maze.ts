// Jalebi Hunt maze rules. Pure functions: (config, state, move) -> new state.
//
// Map legend:
//   '#' house   'R' railway   '.' road   'S' start   'J' jalebis (goal)   'o' laddoo   'C' napping cow
//   'A','B',...  gates          'a','b',...  levers (lever 'a' opens gate 'A' for good)
//   'x'  switch: flips every gate that has `openWhen` (opens some, shuts the others)
//
// Monkeys (Chunnu) walk back and forth along one lane. They never step onto Gappu: they turn round,
// and if cornered at the end of a lane they hop over him. Bumping into a monkey makes it snatch a laddoo.

export type Cell = [number, number]; // [column, row]
export type Dir = 'up' | 'down' | 'left' | 'right';

export type GateDef = {
  name: string; // used in messages: "the yellow gate"
  color: string;
  glyph: string; // small SVG path in a 12x12 box, so gates are told apart by shape as well as colour
  lever?: string; // lever letter that opens this gate
  openWhen?: boolean; // for switch gates: open when the switch is flipped (true) or not (false)
};

export type MonkeyLane = { axis: 'h' | 'v'; line: number; min: number; max: number; start: number; dir: 1 | -1 };

export type MazeConfig = {
  id: string;
  intro: string;
  map: string[];
  gates: Record<string, GateDef>;
  monkeys: MonkeyLane[];
};

export type Monkey = { p: number; d: number };

export type MazeState = {
  pos: Cell;
  levers: Record<string, boolean>;
  flip: boolean;
  got: string[]; // collected laddoos, as "c,r"
  won: boolean;
  msg: string | null;
  bump: number; // counts blocked moves (drives the little shake animation)
  mons: Monkey[];
};

const DIRS: Record<Dir, Cell> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const key = (c: number, r: number) => `${c},${r}`;
const same = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1];

export function tileAt(cfg: MazeConfig, c: number, r: number): string {
  if (r < 0 || r >= cfg.map.length || c < 0 || c >= cfg.map[0].length) return '#';
  return cfg.map[r][c];
}

export function findTile(cfg: MazeConfig, ch: string): Cell {
  for (let r = 0; r < cfg.map.length; r++) {
    const c = cfg.map[r].indexOf(ch);
    if (c >= 0) return [c, r];
  }
  throw new Error(`Maze ${cfg.id} has no '${ch}' tile`);
}

export function leverGate(cfg: MazeConfig, t: string): string | undefined {
  return Object.keys(cfg.gates).find((G) => cfg.gates[G].lever === t);
}

export function gateIsOpen(cfg: MazeConfig, G: string, s: Pick<MazeState, 'levers' | 'flip'>): boolean {
  const g = cfg.gates[G];
  return g.lever ? !!s.levers[g.lever] : s.flip === g.openWhen;
}

export function monkeyCell(cfg: MazeConfig, m: Monkey, i: number): Cell {
  const L = cfg.monkeys[i];
  return L.axis === 'h' ? [m.p, L.line] : [L.line, m.p];
}

function monkeyStep(cfg: MazeConfig, m: Monkey, i: number, player: Cell): Monkey {
  const L = cfg.monkeys[i];
  const onLane = (x: number) => x >= L.min && x <= L.max;
  const playerOn = L.axis === 'h' ? (player[1] === L.line ? player[0] : null) : player[0] === L.line ? player[1] : null;
  const blocked = (x: number) => x === playerOn;
  let dir = m.d;
  let n = m.p + dir;
  if (!onLane(n)) {
    dir = -dir;
    n = m.p + dir;
  }
  if (blocked(n)) {
    dir = -dir;
    n = m.p + dir;
  }
  if (!onLane(n) || blocked(n)) {
    const side = playerOn === null ? 0 : Math.sign(playerOn - m.p);
    const hop = m.p + 2 * side;
    if (side && onLane(hop)) return { p: hop, d: side };
    n = m.p;
  }
  return { p: n, d: dir };
}

export function initMaze(cfg: MazeConfig): MazeState {
  return {
    pos: findTile(cfg, 'S'),
    levers: {},
    flip: false,
    got: [],
    won: false,
    msg: null,
    bump: 0,
    mons: cfg.monkeys.map((m) => ({ p: m.start, d: m.dir })),
  };
}

export function stepMaze(cfg: MazeConfig, s: MazeState, dir: Dir): MazeState {
  if (s.won) return s;
  const [dc, dr] = DIRS[dir];
  const np: Cell = [s.pos[0] + dc, s.pos[1] + dr];
  const t = tileAt(cfg, np[0], np[1]);
  const blockedBy = (msg: string): MazeState => ({ ...s, bump: s.bump + 1, msg });

  if (t === '#') return blockedBy('Bonk! That is a house. Try another way.');
  if (t === 'R') return blockedBy('Trains zoom by here! Use a crossing gate.');
  if (t === 'C') return blockedBy('Shh! The cow is napping. Go around her.');
  if (cfg.gates[t] && !gateIsOpen(cfg, t, s)) {
    const G = cfg.gates[t];
    return blockedBy(`The ${G.name} gate is shut. ` + (G.lever ? `Find the ${G.name} lever!` : 'Try the switch!'));
  }
  if (s.mons.some((m, i) => same(np, monkeyCell(cfg, m, i)))) {
    const mons = s.mons.map((m, i) => monkeyStep(cfg, m, i, s.pos));
    if (s.got.length) {
      return { ...s, mons, bump: s.bump + 1, got: s.got.slice(0, -1), msg: 'Cheeky Chunnu snatched a laddoo! Go get it back.' };
    }
    return { ...s, mons, bump: s.bump + 1, msg: 'Oops! Chunnu is in the way. Let him pass!' };
  }

  const next: MazeState = { ...s, pos: np, msg: null, mons: s.mons.map((m, i) => monkeyStep(cfg, m, i, np)) };
  const LG = leverGate(cfg, t);
  if (LG && !s.levers[t]) {
    next.levers = { ...s.levers, [t]: true };
    next.msg = `Click! The ${cfg.gates[LG].name} gate is open!`;
  }
  if (t === 'x') {
    next.flip = !s.flip;
    const names = (open: boolean) =>
      Object.keys(cfg.gates)
        .filter((G) => !cfg.gates[G].lever && cfg.gates[G].openWhen === open)
        .map((G) => cfg.gates[G].name)
        .join(' and ');
    const opened = names(next.flip);
    next.msg = `Switch! ${opened.charAt(0).toUpperCase() + opened.slice(1)} gate open, ${names(!next.flip)} gate shut.`;
  }
  if (t === 'o' && !s.got.includes(key(np[0], np[1]))) {
    next.got = [...s.got, key(np[0], np[1])];
    next.msg = `Yum, a laddoo! ${next.got.length} of 3`;
  }
  if (t === 'J') next.won = true;
  return next;
}

export function mazeMessage(cfg: MazeConfig, s: MazeState): string {
  return s.msg ?? cfg.intro;
}

/** 1 to 3 stars: one per laddoo collected, at least one for finishing. */
export function mazeStars(s: MazeState): 1 | 2 | 3 {
  return Math.min(3, Math.max(1, s.got.length)) as 1 | 2 | 3;
}

// ---------------------------------------------------------------- Lantern Walk (Diwali Night)

/**
 * Squares you can see in the dark maze: around Gappu's lantern (two steps), around every diya he left
 * on the squares he walked (one step), and the jalebi stall, which always glows.
 */
export function lanternLit(cfg: MazeConfig, pos: Cell, trail: string[]): Set<string> {
  const lit = new Set<string>();
  const rows = cfg.map.length;
  const cols = cfg.map[0].length;
  const around = (c: number, r: number, reach: number) => {
    for (let dr = -reach; dr <= reach; dr++)
      for (let dc = -reach; dc <= reach; dc++) {
        const [x, y] = [c + dc, r + dr];
        if (Math.abs(dc) + Math.abs(dr) <= reach && x >= 0 && y >= 0 && x < cols && y < rows) lit.add(key(x, y));
      }
  };
  around(pos[0], pos[1], 2);
  for (const k of trail) {
    const [c, r] = k.split(',').map(Number);
    around(c, r, 1);
  }
  const [jc, jr] = findTile(cfg, 'J');
  lit.add(key(jc, jr));
  return lit;
}

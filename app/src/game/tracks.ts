// Fix the Tracks: turn the track pieces so the jalebi train can roll from the station (above the
// board) down to the jalebi stall (below it). Pure functions, no React: unit-tested in __tests__/run.ts.
//
// Map legend. Every piece is written the way it looks when it is RIGHT:
//   '|' straight, top to bottom        '-' straight, left to right
//   'a' curve top-right   'b' curve right-bottom   'c' curve bottom-left   'd' curve left-top
//   '.' grass   'T' tree   'H' house   'P' pond   'F' flowers    (scenery: can't be turned)
// `taps` (one digit per cell) says how many taps each piece needs to be right again: the game starts
// every piece that many quarter-turns back. Pieces off the train's route are decoys.

export type Side = 0 | 1 | 2 | 3; // top, right, bottom, left
export type PieceKind = 'straight' | 'curve';

export type TrackConfig = {
  id: string;
  map: string[];
  taps: string[];
  start: number; // column where the train comes in at the top
  goal: number; // column where it has to leave at the bottom
};

/** `rot` counts quarter-turns clockwise from the base shape and only ever goes up, so pieces always spin the same way. */
export type TrackPiece = { kind: PieceKind; rot: number };

export type TrackState = { pieces: (TrackPiece | null)[][]; taps: number };

const SHAPES: Record<string, TrackPiece> = {
  '|': { kind: 'straight', rot: 0 },
  '-': { kind: 'straight', rot: 1 },
  a: { kind: 'curve', rot: 0 },
  b: { kind: 'curve', rot: 1 },
  c: { kind: 'curve', rot: 2 },
  d: { kind: 'curve', rot: 3 },
};

export const SCENERY = ['.', 'T', 'H', 'P', 'F'] as const;

/** Sides a piece is open on. Base shapes: straight = top+bottom, curve = top+right. */
export function openings(p: TrackPiece): [Side, Side] {
  const base: [number, number] = p.kind === 'straight' ? [0, 2] : [0, 1];
  return [((base[0] + p.rot) % 4) as Side, ((base[1] + p.rot) % 4) as Side];
}

const STEP: Record<Side, [number, number]> = { 0: [0, -1], 1: [1, 0], 2: [0, 1], 3: [-1, 0] };
const opposite = (s: Side) => ((s + 2) % 4) as Side;
const period = (p: TrackPiece) => (p.kind === 'straight' ? 2 : 4);

export const isTrack = (ch: string) => ch in SHAPES;

/** The pieces as they are when the puzzle is solved. */
export function solvedTracks(cfg: TrackConfig): TrackState {
  return { pieces: cfg.map.map((row) => row.split('').map((ch) => (isTrack(ch) ? { ...SHAPES[ch] } : null))), taps: 0 };
}

/** The scrambled starting position. */
export function initTracks(cfg: TrackConfig): TrackState {
  const solved = solvedTracks(cfg);
  return {
    taps: 0,
    pieces: solved.pieces.map((row, r) =>
      row.map((p, c) => (p ? { kind: p.kind, rot: (p.rot - Number(cfg.taps[r][c]) + 8) % 4 } : null)),
    ),
  };
}

/** Tap a piece: it turns a quarter clockwise. Scenery doesn't move. */
export function tapPiece(s: TrackState, c: number, r: number): TrackState {
  const p = s.pieces[r]?.[c];
  if (!p) return s;
  return {
    taps: s.taps + 1,
    pieces: s.pieces.map((row, rr) => (rr === r ? row.map((q, cc) => (cc === c && q ? { ...q, rot: q.rot + 1 } : q)) : row)),
  };
}

export type Trace = { cells: [number, number][]; reached: boolean };

/** Follow the rails from the station: which pieces are joined up so far, and does the line reach the stall? */
export function traceTracks(cfg: TrackConfig, s: TrackState): Trace {
  const rows = s.pieces.length;
  const cols = s.pieces[0].length;
  const cells: [number, number][] = [];
  let c = cfg.start;
  let r = 0;
  let from: Side = 0;
  for (let guard = 0; guard <= rows * cols; guard++) {
    const p = s.pieces[r]?.[c];
    if (!p) break;
    const [a, b] = openings(p);
    if (a !== from && b !== from) break;
    cells.push([c, r]);
    const out = a === from ? b : a;
    c += STEP[out][0];
    r += STEP[out][1];
    from = opposite(out);
    if (r < 0 || r >= rows || c < 0 || c >= cols) {
      return { cells, reached: out === 2 && r === rows && c === cfg.goal };
    }
  }
  return { cells, reached: false };
}

/** Fewest taps needed to fix the intended route (decoys left alone). */
export function tracksPar(cfg: TrackConfig): number {
  const solved = solvedTracks(cfg);
  return traceTracks(cfg, solved).cells.reduce((sum, [c, r]) => sum + (Number(cfg.taps[r][c]) % period(solved.pieces[r][c]!)), 0);
}

/** 3 stars for a few spare taps, 2 for a lot, 1 for finishing at all. */
export function tracksStars(taps: number, par: number): 1 | 2 | 3 {
  const extra = taps - par;
  if (extra <= 6) return 3;
  if (extra <= par + 12) return 2;
  return 1;
}

/**
 * A new scramble for one play: every piece on the train's route starts turned the wrong way (curves
 * by 1 to 3 quarter-turns, straight pieces by one), and the decoy pieces off the route get any turn.
 * Returns the puzzle with new `taps`; tracksPar() of the result is the fewest taps for this play.
 */
export function scrambleTracks(cfg: TrackConfig, rand: () => number): TrackConfig {
  const solved = solvedTracks(cfg);
  const route = new Set(traceTracks(cfg, solved).cells.map(([c, r]) => `${c},${r}`));
  const taps = cfg.map.map((row, r) =>
    row
      .split('')
      .map((ch, c) => {
        const p = solved.pieces[r][c];
        if (!p) return '0';
        if (route.has(`${c},${r}`)) return String(p.kind === 'straight' ? 1 : 1 + Math.floor(rand() * 3));
        return String(Math.floor(rand() * 4));
      })
      .join(''),
  );
  return { ...cfg, taps };
}

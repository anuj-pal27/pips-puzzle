"""Make and check puzzle settings on the server, with the same rules as the app.

The app's rules live in app/src/game/*.ts; these are Python ports of the parts the server needs:
  - tracks: does the solved map really join the station to the stall? Generate new track puzzles.
  - slide:  shuffle a board and work out its fewest-moves `par`.
  - maze:   can Gappu reach the jalebis, and every laddoo, from the start?
"""

import heapq
import random
from collections import deque

# ---------------------------------------------------------------- tracks (app/src/game/tracks.ts)

TOP, RIGHT, BOTTOM, LEFT = 0, 1, 2, 3
STEP = {TOP: (0, -1), RIGHT: (1, 0), BOTTOM: (0, 1), LEFT: (-1, 0)}
# Each track letter, as the two sides it is open on when it's the right way round.
PIECES = {"|": {TOP, BOTTOM}, "-": {LEFT, RIGHT}, "a": {TOP, RIGHT}, "b": {RIGHT, BOTTOM}, "c": {BOTTOM, LEFT}, "d": {LEFT, TOP}}
SCENERY = ".THPF"


def piece_for(a: int, b: int) -> str:
    return next(ch for ch, sides in PIECES.items() if sides == {a, b})


def trace_tracks(rows: list[str], start: int, goal: int) -> tuple[list[tuple[int, int]], bool]:
    """Follow the solved map from the station. Returns the cells on the line and whether it reaches the stall."""
    h, w = len(rows), len(rows[0])
    c, r, came_from = start, 0, TOP
    cells = []
    for _ in range(w * h + 1):
        sides = PIECES.get(rows[r][c])
        if not sides or came_from not in sides:
            return cells, False
        cells.append((c, r))
        (out,) = sides - {came_from}
        c, r = c + STEP[out][0], r + STEP[out][1]
        came_from = (out + 2) % 4
        if not (0 <= r < h and 0 <= c < w):
            return cells, out == BOTTOM and r == h and c == goal
    return cells, False


def tracks_par(config: dict) -> int:
    """Fewest taps to fix the line (a straight piece looks the same after two turns)."""
    cells, _ = trace_tracks(config["map"], config["start"], config["goal"])
    total = 0
    for c, r in cells:
        period = 2 if config["map"][r][c] in "|-" else 4
        total += int(config["taps"][r][c]) % period
    return total


def generate_tracks(width: int, height: int, decoys: float = 0.35, seed: int | None = None) -> dict:
    """A new Fix the Tracks puzzle: one winding line from a station column at the top to a stall column at
    the bottom, scenery around it, and (with `decoys`) loose track pieces that lead nowhere."""
    rng = random.Random(seed)
    for _ in range(200):
        start, goal = rng.randrange(width), rng.randrange(width)
        path = _random_path(width, height, start, goal, rng)
        if path and len(path) >= height + min(width, height) - 1:
            break
    else:  # pragma: no cover - a winding path always turns up well before this
        raise ValueError("Couldn't make a track line that size. Try a bigger board.")

    grid = [[None] * width for _ in range(height)]
    came_from = TOP
    for i, (c, r) in enumerate(path):
        if i + 1 < len(path):
            nc, nr = path[i + 1]
            out = next(s for s, (dc, dr) in STEP.items() if (c + dc, r + dr) == (nc, nr))
        else:
            out = BOTTOM
        grid[r][c] = piece_for(came_from, out)
        came_from = (out + 2) % 4

    on_path = set(path)
    taps = [["0"] * width for _ in range(height)]
    for r in range(height):
        for c in range(width):
            if (c, r) in on_path:
                taps[r][c] = str(rng.choice([0, 1, 1, 2, 3]))
            elif rng.random() < decoys:
                grid[r][c] = rng.choice("|-abcd")
                taps[r][c] = str(rng.randrange(4))
            else:
                grid[r][c] = rng.choice("TTHHPFF.")
    config = {"map": ["".join(row) for row in grid], "taps": ["".join(row) for row in taps], "start": start, "goal": goal}
    # Make sure there is something to do: at least a third of the line starts turned the wrong way.
    if tracks_par(config) < len(path) // 3:
        return generate_tracks(width, height, decoys, rng.randrange(1 << 30))
    return config


def _random_path(width, height, start, goal, rng):
    """A random self-avoiding walk from (start, top row) to (goal, bottom row), found by depth-first search."""
    target = (goal, height - 1)
    path, seen = [(start, 0)], {(start, 0)}
    budget = [4000]

    def walk():
        budget[0] -= 1
        if budget[0] < 0:
            return False
        c, r = path[-1]
        if (c, r) == target:
            return True
        moves = [(c + dc, r + dr) for dc, dr in STEP.values() if 0 <= c + dc < width and 0 <= r + dr < height]
        rng.shuffle(moves)
        for nxt in moves:
            if nxt in seen:
                continue
            path.append(nxt)
            seen.add(nxt)
            if walk():
                return True
            path.pop()
            seen.discard(nxt)
        return False

    return path if walk() else None


# ---------------------------------------------------------------- slide (app/src/game/slide.ts)

BLANK = -1


def slide_solvable(board: list[int], n: int) -> bool:
    """Only half of all shuffles can be solved (same rule as the app)."""
    tiles = [t for t in board if t != BLANK]
    inversions = sum(1 for i in range(len(tiles)) for j in range(i + 1, len(tiles)) if tiles[i] > tiles[j])
    if n % 2 == 1:
        return inversions % 2 == 0
    return (inversions + n - board.index(BLANK) // n) % 2 == 1


def _neighbours(n: int, i: int) -> list[int]:
    r, c = divmod(i, n)
    return [(r + dr) * n + (c + dc) for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)) if 0 <= r + dr < n and 0 <= c + dc < n]


def solved_board(n: int) -> list[int]:
    return [*range(n * n - 1), BLANK]


def slide_par(board: list[int], n: int, limit: int = 60_000) -> int | None:
    """Fewest moves to solve `board` (A* search). None if it would take too long to find out."""
    goal = tuple(solved_board(n))
    start = tuple(board)

    def h(b):  # how far every tile is from home: never more than the real number of moves
        return sum(abs(i // n - t // n) + abs(i % n - t % n) for i, t in enumerate(b) if t != BLANK)

    best = {start: 0}
    queue = [(h(start), 0, start)]
    while queue and limit:
        limit -= 1
        _, g, b = heapq.heappop(queue)
        if b == goal:
            return g
        if g > best.get(b, g):
            continue
        gap = b.index(BLANK)
        for j in _neighbours(n, gap):
            nb = list(b)
            nb[gap], nb[j] = nb[j], nb[gap]
            nb = tuple(nb)
            if g + 1 < best.get(nb, 1 << 30):
                best[nb] = g + 1
                heapq.heappush(queue, (g + 1 + h(nb), g + 1, nb))
    return None


def shuffle_slide(n: int, moves: int, seed: int | None = None) -> dict:
    """Slide the gap around `moves` times from the solved board (so it's always solvable), until (almost) no
    tile is left in its own place, then work out the exact par."""
    rng = random.Random(seed)
    in_place_ok = 0 if n <= 3 else n  # big boards can't move every tile in a short shuffle
    for _ in range(500):
        board = solved_board(n)
        gap, prev = len(board) - 1, None
        for _ in range(moves):
            options = [j for j in _neighbours(n, gap) if j != prev]
            j = rng.choice(options)
            board[gap], board[j] = board[j], board[gap]
            prev, gap = gap, j
        if sum(t == i for i, t in enumerate(board)) > in_place_ok:
            continue
        par = slide_par(board, n)
        return {"size": n, "start": board, "par": par if par is not None else moves}
    raise ValueError("Couldn't shuffle that board. Try more moves.")  # pragma: no cover


# ---------------------------------------------------------------- maze (app/src/game/maze.ts)

MAZE_TILES = set("#R.SJoCx")


def check_maze(maze: dict) -> list[str]:
    """Problems with a maze, in plain words (an empty list means it's good to play).

    Gappu must be able to reach the jalebis and all three laddoos. Monkeys are left out: they walk
    back and forth (or hop over Gappu), so they only ever slow him down.
    """
    problems = []
    rows = maze.get("map") or []
    if not rows or len({len(r) for r in rows}) != 1:
        return ["The map must be a list of rows that are all the same length."]
    gates = maze.get("gates") or {}
    joined = "".join(rows)
    if joined.count("S") != 1 or joined.count("J") != 1:
        problems.append("The map needs exactly one start 'S' and one jalebi stall 'J'.")
    if joined.count("o") != 3:
        problems.append(f"Put exactly 3 laddoos 'o' on the map (it has {joined.count('o')}): one star each.")
    for letter, g in gates.items():
        if len(letter) != 1 or not letter.isupper() or letter in "RCSJ":
            problems.append(f"Gate '{letter}' must be one capital letter other than R, C, S and J.")
        if not isinstance(g, dict) or not all(isinstance(g.get(k), str) and g.get(k) for k in ("name", "color", "glyph")):
            problems.append(f"Gate '{letter}' needs a name, color and glyph (use one of the gate styles).")
            continue
        if "lever" in g and g["lever"] not in joined:
            problems.append(f"Gate '{letter}' opens with lever '{g['lever']}', but there's no '{g['lever']}' on the map.")
        if "lever" not in g and not isinstance(g.get("openWhen"), bool):
            problems.append(f"Gate '{letter}' needs a lever, or openWhen true/false to work with the switch 'x'.")
    levers = {g.get("lever") for g in gates.values() if isinstance(g, dict)}
    unknown = set(joined) - MAZE_TILES - set(gates) - levers
    if unknown:
        problems.append(f"Unknown tiles on the map: {' '.join(sorted(unknown))}. Add a gate for each capital letter.")
    for i, m in enumerate(maze.get("monkeys") or []):
        axis, line = m.get("axis"), m.get("line")
        size = len(rows[0]) if axis == "h" else len(rows)
        lines = len(rows) if axis == "h" else len(rows[0])
        if axis not in ("h", "v") or not all(isinstance(m.get(k), int) for k in ("line", "min", "max", "start")):
            problems.append(f"Monkey {i + 1} needs axis 'h' or 'v' and whole numbers for line, min, max and start.")
        elif not (0 <= line < lines and 0 <= m["min"] <= m["start"] <= m["max"] < size):
            problems.append(f"Monkey {i + 1}'s lane goes off the map.")
    if problems:
        return problems

    reach = _maze_reachable(rows, gates)
    w = len(rows[0])
    find = lambda ch: [(i % w, i // w) for i, t in enumerate(joined) if t == ch]  # noqa: E731
    if not reach & set(find("J")):
        problems.append("Gappu can't reach the jalebis 'J' from the start. Open a path (check the gates and levers).")
    missing = [cell for cell in find("o") if cell not in reach]
    if missing:
        problems.append(f"{len(missing)} laddoo(s) can't be reached, so 3 stars would be impossible.")
    return problems


def _maze_reachable(rows, gates) -> set[tuple[int, int]]:
    """Every cell Gappu can stand on, trying levers and the switch in every order."""
    w, h = len(rows[0]), len(rows)
    start = next((c, r) for r, row in enumerate(rows) for c, t in enumerate(row) if t == "S")
    lever_gate = {g["lever"]: G for G, g in gates.items() if g.get("lever")}

    def is_open(G, levers, flip):
        g = gates[G]
        return g["lever"] in levers if g.get("lever") else flip == g["openWhen"]

    seen = {(start, frozenset(), False)}
    queue = deque(seen)
    cells = {start}
    while queue:
        (c, r), levers, flip = queue.popleft()
        for dc, dr in STEP.values():
            nc, nr = c + dc, r + dr
            if not (0 <= nc < w and 0 <= nr < h):
                continue
            t = rows[nr][nc]
            if t in "#RC" or (t in gates and not is_open(t, levers, flip)):
                continue
            nl = levers | {t} if t in lever_gate else levers
            nf = (not flip) if t == "x" else flip
            state = ((nc, nr), nl, nf)
            if state not in seen:
                seen.add(state)
                cells.add((nc, nr))
                if t != "J":
                    queue.append(state)
    return cells

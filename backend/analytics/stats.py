"""Numbers for the dashboard, worked out from PlayEvent rows. Plain functions: (time window) -> dicts and lists."""

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from statistics import median

from django.db.models import Avg, Count, Min, Q
from django.db.models.functions import TruncDate
from django.utils import timezone

from content.ids import LAST_LEVEL, LEVELS
from content.models import Puzzle

from .models import DEMO_PREFIX, LAB_LESSONS, LAB_PREFIX, PlayEvent

START, FINISH, QUIT = PlayEvent.Type.START, PlayEvent.Type.FINISH, PlayEvent.Type.QUIT
RANGES = {"7": 7, "30": 30, "90": 90}  # ?days=... on the dashboard; anything else means all time


@dataclass
class Window:
    days: int | None  # None: all time
    start: datetime | None
    end: datetime

    @property
    def previous(self) -> "Window | None":
        """The same length of time just before this one, for "vs last week" changes."""
        if self.days is None:
            return None
        return Window(self.days, self.start - timedelta(days=self.days), self.start)

    def all_events(self):
        qs = PlayEvent.objects.filter(played_at__lt=self.end)
        return qs.filter(played_at__gte=self.start) if self.start else qs

    def events(self):
        """Puzzle plays only (Learn with Bit lessons are counted separately, in lab_lessons)."""
        return self.all_events().exclude(puzzle_slug__startswith=LAB_PREFIX)


def window(days: str | int | None, now: datetime | None = None) -> Window:
    now = now or timezone.now()
    n = RANGES.get(str(days)) if days is not None else None
    if n is None:
        return Window(None, None, now)
    # Whole days in local time, so "last 7 days" is today and the 6 days before it.
    today = timezone.localtime(now).replace(hour=0, minute=0, second=0, microsecond=0)
    return Window(n, today - timedelta(days=n - 1), now)


def _rate(part: int, whole: int) -> float | None:
    return min(1.0, part / whole) if whole else None


def summary(w: Window) -> dict:
    qs = w.events()
    counts = qs.aggregate(
        starts=Count("id", filter=Q(type=START)),
        finishes=Count("id", filter=Q(type=FINISH)),
        quits=Count("id", filter=Q(type=QUIT)),
        devices=Count("device", distinct=True),
        avg_stars=Avg("stars", filter=Q(type=FINISH)),
    )
    seconds = list(qs.filter(type=FINISH, seconds__isnull=False).values_list("seconds", flat=True))
    first_seen = PlayEvent.objects.values("device").annotate(first=Min("played_at"))
    new = first_seen.filter(first__lt=w.end)
    if w.start:
        new = new.filter(first__gte=w.start)
    return {
        **counts,
        "completion": _rate(counts["finishes"], counts["starts"]),
        "median_seconds": median(seconds) if seconds else None,
        "new_devices": new.count(),
    }


def change(now: dict, before: dict | None, key: str) -> float | None:
    """Relative change of `key` from the previous window (0.25 = up 25%). None when there's nothing to compare."""
    if not before or before.get(key) in (None, 0) or now.get(key) is None:
        return None
    return (now[key] - before[key]) / before[key]


def daily(w: Window) -> list[dict]:
    """One row per day in the window (days with no play included, as zeros)."""
    rows = (
        w.events()
        .annotate(day=TruncDate("played_at"))
        .values("day")
        .annotate(
            starts=Count("id", filter=Q(type=START)),
            finishes=Count("id", filter=Q(type=FINISH)),
            devices=Count("device", distinct=True),
        )
    )
    by_day = {r["day"]: r for r in rows}
    if w.start:
        first = timezone.localtime(w.start).date()
    else:
        first = min(by_day, default=timezone.localdate(w.end))
    last = timezone.localtime(w.end).date()
    out = []
    d = first
    while d <= last:
        r = by_day.get(d, {})
        out.append({"day": d, "starts": r.get("starts", 0), "finishes": r.get("finishes", 0), "devices": r.get("devices", 0)})
        d += timedelta(days=1)
    return out


def per_puzzle(w: Window) -> list[dict]:
    """Every puzzle in play order, with how it's doing. Unpublished puzzles are included (marked)."""
    counts = {
        r["puzzle_slug"]: r
        for r in w.events()
        .values("puzzle_slug")
        .annotate(
            starts=Count("id", filter=Q(type=START)),
            finishes=Count("id", filter=Q(type=FINISH)),
            quits=Count("id", filter=Q(type=QUIT)),
            players=Count("device", distinct=True),
            avg_stars=Avg("stars", filter=Q(type=FINISH)),
            one=Count("id", filter=Q(type=FINISH, stars=1)),
            two=Count("id", filter=Q(type=FINISH, stars=2)),
            three=Count("id", filter=Q(type=FINISH, stars=3)),
        )
    }
    seconds = defaultdict(list)
    for slug, s in w.events().filter(type=FINISH, seconds__isnull=False).values_list("puzzle_slug", "seconds"):
        seconds[slug].append(s)

    rows = []
    for p in Puzzle.objects.in_play_order():
        c = counts.get(p.slug, {})
        starts, finishes = c.get("starts", 0), c.get("finishes", 0)
        rows.append(
            {
                "puzzle": p,
                "starts": starts,
                "finishes": finishes,
                "quits": c.get("quits", 0),
                "players": c.get("players", 0),
                "completion": _rate(finishes, starts),
                "avg_stars": c.get("avg_stars"),
                "stars": [c.get("one", 0), c.get("two", 0), c.get("three", 0)],
                "median_seconds": median(seconds[p.slug]) if seconds[p.slug] else None,
            }
        )
    return rows


def hardest(rows: list[dict], min_starts: int = 5, limit: int = 5) -> list[dict]:
    """Puzzles children give up on most: lowest completion first (only puzzles with enough plays to tell)."""
    enough = [r for r in rows if r["starts"] >= min_starts]
    return sorted(enough, key=lambda r: (r["completion"], -r["starts"]))[:limit]


def funnel(w: Window) -> list[dict]:
    """How far players get: each step counts the devices that reached it, out of everyone who played."""
    level_of = dict(Puzzle.objects.values_list("slug", "level"))
    started = defaultdict(set)  # level -> devices
    finished_any, played = set(), set()
    for device, slug, kind in w.events().values_list("device", "puzzle_slug", "type"):
        played.add(device)
        if kind == FINISH:
            finished_any.add(device)
        level = level_of.get(slug)
        if level:
            started[level].add(device)
    total = len(played)
    steps = [
        ("Played a puzzle", played),
        ("Finished a puzzle", finished_any),
        ("Reached level 2", set().union(*(started[n] for n in LEVELS if n >= 2))),
        ("Reached level 5", set().union(*(started[n] for n in LEVELS if n >= 5))),
        (f"Reached level {LAST_LEVEL}", started[LAST_LEVEL]),
    ]
    return [{"label": label, "devices": len(devices), "share": _rate(len(devices), total)} for label, devices in steps]


def platforms(w: Window) -> list[dict]:
    rows = w.all_events().values("platform").annotate(devices=Count("device", distinct=True)).order_by("-devices")
    names = {"android": "Android", "ios": "iOS", "web": "Web"}
    return [{"platform": names.get(r["platform"], r["platform"] or "Unknown"), "devices": r["devices"]} for r in rows]


def by_level(rows: list[dict]) -> list[dict]:
    """Per-puzzle rows rolled up per level (levels with no puzzles are left out)."""
    out = []
    for level, place in LEVELS.items():
        mine = [r for r in rows if r["puzzle"].level == level]
        if not mine:
            continue
        starts, finishes = sum(r["starts"] for r in mine), sum(r["finishes"] for r in mine)
        out.append({"level": level, "label": f"{level}. {place}", "puzzles": len(mine), "starts": starts, "finishes": finishes, "completion": _rate(finishes, starts)})
    return out


def demo_events() -> int:
    return PlayEvent.objects.filter(device__startswith=DEMO_PREFIX).count()


def last_event_at() -> datetime | None:
    return PlayEvent.objects.order_by("-played_at").values_list("played_at", flat=True).first()


def lab_lessons(w: Window) -> list[dict]:
    """Learn with Bit: starts, finishes, players and average stars for each lesson."""
    qs = w.all_events().filter(puzzle_slug__startswith=LAB_PREFIX)
    found = {
        r["puzzle_slug"]: r
        for r in qs.values("puzzle_slug").annotate(
            starts=Count("id", filter=Q(type=START)),
            finishes=Count("id", filter=Q(type=FINISH)),
            players=Count("device", distinct=True),
            avg_stars=Avg("stars", filter=Q(type=FINISH)),
        )
    }
    rows = []
    for slug, title in LAB_LESSONS.items():
        r = found.get(slug, {})
        starts, finishes = r.get("starts", 0), r.get("finishes", 0)
        rows.append({"slug": slug, "title": title, "starts": starts, "finishes": finishes, "players": r.get("players", 0), "avg_stars": r.get("avg_stars"), "completion": _rate(finishes, starts)})
    return rows

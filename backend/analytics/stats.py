"""Numbers for the dashboard, worked out from PlayEvent rows. Plain functions: (time window) -> dicts and lists."""

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
from statistics import median

from django.db.models import Avg, Count, Min, Q
from django.db.models.functions import TruncDate
from django.utils import timezone

from content.models import TIER_RANK, Puzzle, Tier

from .models import DEMO_PREFIX, PlayEvent

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

    def events(self):
        qs = PlayEvent.objects.filter(played_at__lt=self.end)
        return qs.filter(played_at__gte=self.start) if self.start else qs


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
    tier_of = dict(Puzzle.objects.values_list("slug", "tier"))
    started = defaultdict(set)  # tier -> devices
    finished_any, played = set(), set()
    for device, slug, kind in w.events().values_list("device", "puzzle_slug", "type"):
        played.add(device)
        if kind == FINISH:
            finished_any.add(device)
        tier = tier_of.get(slug)
        if tier:
            started[tier].add(device)
    total = len(played)
    steps = [
        ("Played a puzzle", played),
        ("Finished a puzzle", finished_any),
        ("Reached Medium", started[Tier.MEDIUM]),
        ("Reached Hard", started[Tier.HARD]),
    ]
    return [{"label": label, "devices": len(devices), "share": _rate(len(devices), total)} for label, devices in steps]


def platforms(w: Window) -> list[dict]:
    rows = w.events().values("platform").annotate(devices=Count("device", distinct=True)).order_by("-devices")
    names = {"android": "Android", "ios": "iOS", "web": "Web"}
    return [{"platform": names.get(r["platform"], r["platform"] or "Unknown"), "devices": r["devices"]} for r in rows]


def by_tier(rows: list[dict]) -> list[dict]:
    """Per-puzzle rows rolled up per tier."""
    out = []
    for tier in sorted(TIER_RANK, key=TIER_RANK.get):
        mine = [r for r in rows if r["puzzle"].tier == tier]
        starts, finishes = sum(r["starts"] for r in mine), sum(r["finishes"] for r in mine)
        out.append({"tier": tier, "label": Tier(tier).label, "puzzles": len(mine), "starts": starts, "finishes": finishes, "completion": _rate(finishes, starts)})
    return out


def demo_events() -> int:
    return PlayEvent.objects.filter(device__startswith=DEMO_PREFIX).count()


def last_event_at() -> datetime | None:
    return PlayEvent.objects.order_by("-played_at").values_list("played_at", flat=True).first()

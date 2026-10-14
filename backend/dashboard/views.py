import csv
import json

from django.contrib import messages
from django.contrib.admin.views.decorators import staff_member_required
from django.db import transaction
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_POST

from accounts.models import ChildProfile, User
from analytics import stats
from analytics.models import PlayEvent
from content import builders
from content.management.commands.seed_puzzles import SEED_FILE
from content.models import Puzzle, Tier
from progress.models import Progress

from . import art, charts
from .forms import SLIDE_MOVES, PuzzleForm, free_slug, next_free_order

RANGE_CHOICES = [("7", "7 days"), ("30", "30 days"), ("90", "90 days"), ("all", "All time")]


def _range(request) -> str:
    days = request.GET.get("days", "30")
    return days if days in dict(RANGE_CHOICES) else "30"


def _common(request, days: str) -> dict:
    return {"days": days, "ranges": RANGE_CHOICES, "demo_events": stats.demo_events(), "last_event": stats.last_event_at()}


# ---------------------------------------------------------------- overview


@staff_member_required
def overview(request):
    days = _range(request)
    w = stats.window(days)
    now = stats.summary(w)
    before = stats.summary(w.previous) if w.previous else None
    rows = stats.per_puzzle(w)
    day_rows = stats.daily(w if w.start else stats.window("90"))
    context = {
        **_common(request, days),
        "now": now,
        "changes": {k: stats.change(now, before, k) for k in ("devices", "starts", "finishes", "completion", "avg_stars", "new_devices")},
        "chart": charts.line_chart(day_rows, [("starts", "Started"), ("finishes", "Finished")]),
        "chart_days": len(day_rows),
        "rows": rows,
        "tiers": stats.by_tier(rows),
        "hardest": stats.hardest(rows),
        "funnel": stats.funnel(w),
        "platforms": stats.platforms(w),
        "recent": PlayEvent.objects.select_related("puzzle")[:12],
        "accounts": {
            "parents": User.objects.filter(is_staff=False).count(),
            "children": ChildProfile.objects.count(),
            "synced": Progress.objects.values("child").distinct().count(),
        },
        "puzzle_counts": Puzzle.objects.aggregate(total=Count("id"), live=Count("id", filter=Q(is_published=True))),
    }
    return render(request, "dashboard/overview.html", context)


# ---------------------------------------------------------------- puzzles


@staff_member_required
def puzzles(request):
    days = _range(request)
    rows = stats.per_puzzle(stats.window(days))
    for r in rows:
        r["thumb"] = art.thumb_url(r["puzzle"])
    tiers = [(t, [r for r in rows if r["puzzle"].tier == t.value]) for t in Tier]
    return render(request, "dashboard/puzzles.html", {**_common(request, days), "tiers": tiers, "total": len(rows)})


@staff_member_required
def puzzle_detail(request, slug):
    days = _range(request)
    puzzle = get_object_or_404(Puzzle, slug=slug)
    w = stats.window(days)
    row = next(r for r in stats.per_puzzle(w) if r["puzzle"].pk == puzzle.pk)
    day_window = w if w.start else stats.window("90")
    day_rows = _daily_for(puzzle, day_window)
    context = {
        **_common(request, days),
        "puzzle": puzzle,
        "row": row,
        "thumb": art.thumb_url(puzzle),
        "chart": charts.line_chart(day_rows, [("starts", "Started"), ("finishes", "Finished")]),
        "chart_days": len(day_rows),
        "star_rows": list(zip(["1 star", "2 stars", "3 stars"], row["stars"])),
        "star_total": sum(row["stars"]),
        "preview": _preview(puzzle),
        "recent": puzzle.events.all()[:15],
    }
    return render(request, "dashboard/puzzle_detail.html", context)


def _daily_for(puzzle, w):
    counts = {
        r["day"]: r
        for r in w.events()
        .filter(puzzle_slug=puzzle.slug)
        .annotate(day=TruncDate("played_at"))
        .values("day")
        .annotate(starts=Count("id", filter=Q(type="start")), finishes=Count("id", filter=Q(type="finish")))
    }
    return [{**d, "starts": counts.get(d["day"], {}).get("starts", 0), "finishes": counts.get(d["day"], {}).get("finishes", 0)} for d in stats.daily(w)]


def _preview(p: Puzzle) -> dict:
    """What the dashboard's script needs to draw the puzzle the way the game will (see dash.js)."""
    c = p.config or {}
    out = {"kind": p.kind, "art": _art_urls()}
    if p.kind in (Puzzle.Kind.JIGSAW, Puzzle.Kind.SLIDE):
        out["picture"] = p.image.url if p.image else art.picture_url(p.picture)
    if p.kind == Puzzle.Kind.JIGSAW:
        out.update(cols=p.cols, rows=p.rows, spin=bool(c.get("spin")))
    elif p.kind == Puzzle.Kind.SLIDE:
        out.update(size=c.get("size"), start=c.get("start"), par=c.get("par"))
    elif p.kind == Puzzle.Kind.SHADOW:
        out.update(friends=c.get("friends", []), cols=c.get("cols", 3))
    elif p.kind == Puzzle.Kind.MEMORY:
        out.update(snacks=c.get("snacks", []), cols=c.get("cols"))
    elif p.kind == Puzzle.Kind.TRACKS:
        out["tracks"] = c
    elif p.kind == Puzzle.Kind.MAZE:
        out["maze"] = p.maze
    return out


def _art_urls() -> dict:
    """Every picture the previews might draw, by id."""
    return {
        "friends": {k: art.friend_url(k) for k in art.FRIENDS},
        "snacks": {k: art.snack_url(k) for k in art.SNACKS},
        "pictures": {k: art.picture_url(k) for k in art.PICTURES},
        "laddoo": art.game_art("laddoo"),
        "gappu": art.game_art("gappu-token"),
        "engine": art.game_art("engine"),
        "stall": art.game_art("stall"),
        "station": art.game_art("station-house"),
    }


KIND_CARDS = [
    ("jigsaw", "gappu", "Drag pieces onto the board. Spin option turns pieces round."),
    ("shadow", "shadow-easy-thumb", "Drag each friend onto their shadow."),
    ("memory", "snap-easy-thumb", "Find pairs of snack cards."),
    ("tracks", "tracks-medium-thumb", "Turn track pieces to join the station to the stall."),
    ("slide", "slide-thumb", "Slide tiles to fix a picture."),
    ("maze", "maze-thumb", "Walk Gappu to the jalebis: levers, gates, monkeys."),
]


def _form_context(form, puzzle=None) -> dict:
    labels = dict(Puzzle.Kind.choices)
    kinds = [(k, labels[k], art.game_art(thumb), help) for k, thumb, help in KIND_CARDS]
    templates = {}
    if SEED_FILE.exists():
        for item in json.loads(SEED_FILE.read_text(encoding="utf-8")):
            if item["kind"] == "maze":
                templates[item["tier"]] = {k: v for k, v in item["maze"].items() if k != "id"}
    return {
        "form": form,
        "puzzle": puzzle,
        "kinds": kinds,
        "pictures": [(k, v, art.picture_url(k)) for k, v in art.PICTURES.items()],
        "friends": [(k, v, art.friend_url(k)) for k, v in art.FRIENDS.items()],
        "snacks": [(k, v, art.snack_url(k)) for k, v in art.SNACKS.items()],
        "builder_data": {"art": _art_urls(), "mazeTemplates": templates, "currentImage": puzzle.image.url if puzzle and puzzle.image else None},
    }


@staff_member_required
def puzzle_new(request):
    if request.method == "POST":
        form = PuzzleForm(request.POST, request.FILES)
        if form.is_valid() and (puzzle := form.save()):
            messages.success(request, f"“{puzzle.title}” is saved as {puzzle.slug}. Phones get it the next time the game opens.")
            return redirect("dashboard:puzzle", slug=puzzle.slug)
    else:
        form = PuzzleForm(initial={"tier": request.GET.get("tier", "easy"), "kind": request.GET.get("kind", "jigsaw")})
    return render(request, "dashboard/puzzle_form.html", _form_context(form))


@staff_member_required
def puzzle_edit(request, slug):
    puzzle = get_object_or_404(Puzzle, slug=slug)
    if request.method == "POST":
        form = PuzzleForm(request.POST, request.FILES, instance=puzzle)
        if form.is_valid() and form.save():
            messages.success(request, f"Saved “{puzzle.title}”.")
            return redirect("dashboard:puzzle", slug=puzzle.slug)
    else:
        form = PuzzleForm(instance=puzzle)
    return render(request, "dashboard/puzzle_form.html", _form_context(form, puzzle))


@staff_member_required
@require_POST
def puzzle_action(request, slug, action):
    puzzle = get_object_or_404(Puzzle, slug=slug)
    if action == "publish":
        puzzle.is_published = not puzzle.is_published
        puzzle.save(update_fields=["is_published", "updated_at"])
        messages.success(request, f"“{puzzle.title}” is {'published' if puzzle.is_published else 'hidden from phones'}.")
    elif action in ("up", "down"):
        _move(puzzle, -1 if action == "up" else 1)
    elif action == "duplicate":
        copy = Puzzle.objects.get(pk=puzzle.pk)
        copy.pk = None
        copy.order = next_free_order(puzzle.tier)
        copy.slug = free_slug(puzzle.tier, copy.order)
        copy.title = f"{puzzle.title} (copy)"[:80]
        copy.is_published = False
        copy.save()
        messages.success(request, f"Copied to {copy.slug}, hidden from phones until you publish it.")
        return redirect("dashboard:edit", slug=copy.slug)
    elif action == "delete":
        title = puzzle.title
        puzzle.delete()
        messages.success(request, f"Deleted “{title}”. Its play stats are kept.")
        return redirect("dashboard:puzzles")
    back = request.POST.get("next", "")
    if url_has_allowed_host_and_scheme(back, allowed_hosts={request.get_host()}):
        return redirect(back)
    return redirect("dashboard:puzzles")


def _move(puzzle: Puzzle, direction: int):
    """Swap places with the neighbour in the same tier (play order)."""
    siblings = list(Puzzle.objects.filter(tier=puzzle.tier).order_by("order"))
    i = next(i for i, p in enumerate(siblings) if p.pk == puzzle.pk)
    j = i + direction
    if not 0 <= j < len(siblings):
        return
    other = siblings[j]
    with transaction.atomic():
        a, b = puzzle.order, other.order
        puzzle.order = 0  # out of the way of the one-puzzle-per-slot rule while swapping
        puzzle.save(update_fields=["order"])
        other.order = a
        other.save(update_fields=["order", "updated_at"])
        puzzle.order = b
        puzzle.save(update_fields=["order", "updated_at"])


# ---------------------------------------------------------------- builder tools (JSON, used by the form)


@staff_member_required
def tool_tracks(request):
    try:
        w = min(8, max(3, int(request.GET.get("width", 5))))
        h = min(8, max(3, int(request.GET.get("height", 5))))
        decoys = min(0.8, max(0.0, float(request.GET.get("decoys", 0.35))))
    except ValueError:
        return JsonResponse({"error": "Width, height and decoys must be numbers."}, status=400)
    config = builders.generate_tracks(w, h, decoys)
    return JsonResponse({"config": config, "par": builders.tracks_par(config)})


@staff_member_required
def tool_slide(request):
    try:
        n = int(request.GET.get("size", 3))
        moves = SLIDE_MOVES[n][request.GET.get("difficulty", "medium")]
    except (ValueError, KeyError):
        return JsonResponse({"error": "Board size 2-5 and difficulty easy, medium or hard."}, status=400)
    return JsonResponse(builders.shuffle_slide(n, moves))


@staff_member_required
@require_POST
def tool_check(request):
    """Check a tracks or maze puzzle while it's being made: {"kind": ..., "value": {...}} -> problems."""
    try:
        body = json.loads(request.body)
        kind, value = body["kind"], body["value"]
    except (ValueError, KeyError, TypeError):
        return JsonResponse({"problems": ["Not valid JSON."]})
    if kind == "maze":
        problems = builders.check_maze(value) if isinstance(value, dict) else ["The maze must be a JSON object."]
        return JsonResponse({"problems": problems})
    if kind == "tracks":
        p = Puzzle(kind="tracks", config=value if isinstance(value, dict) else {})
        try:
            p.clean()
        except Exception as e:  # ValidationError, or a badly shaped map
            return JsonResponse({"problems": list(getattr(e, "messages", [str(e)]))})
        return JsonResponse({"problems": [], "par": builders.tracks_par(value)})
    return JsonResponse({"problems": ["Unknown kind."]})


# ---------------------------------------------------------------- export


@staff_member_required
def export_events(request):
    days = _range(request)
    w = stats.window(days)
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="play-events-{days}.csv"'
    out = csv.writer(response)
    out.writerow(["played_at", "type", "puzzle", "stars", "seconds", "device", "platform", "app_version"])
    for e in w.events().order_by("played_at").iterator():
        out.writerow([e.played_at.isoformat(), e.type, e.puzzle_slug, e.stars or "", e.seconds if e.seconds is not None else "", e.device, e.platform, e.app_version])
    return response

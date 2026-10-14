import random
import uuid
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from analytics.models import DEMO_PREFIX, PlayEvent
from content.models import Puzzle

# Rough chance a child finishes a puzzle once started, by tier, and typical minutes it takes, by kind.
FINISH = {"easy": 0.9, "medium": 0.78, "hard": 0.62}
MINUTES = {"jigsaw": 2.5, "shadow": 1.0, "memory": 1.5, "tracks": 2.0, "slide": 3.5, "maze": 2.5}


class Command(BaseCommand):
    help = "Add made-up play events so the dashboard has something to show (or remove them with --clear)."

    def add_arguments(self, parser):
        parser.add_argument("--players", type=int, default=120, help="How many made-up phones (default 120).")
        parser.add_argument("--days", type=int, default=60, help="Spread over this many days back (default 60).")
        parser.add_argument("--clear", action="store_true", help="Remove all made-up events instead.")
        parser.add_argument("--seed", type=int, default=None)

    def handle(self, *args, **opts):
        demo = PlayEvent.objects.filter(device__startswith=DEMO_PREFIX)
        if opts["clear"]:
            n, _ = demo.delete()
            self.stdout.write(self.style.SUCCESS(f"Removed {n} made-up events. Only real plays are left."))
            return

        rng = random.Random(opts["seed"])
        puzzles = list(Puzzle.objects.published().in_play_order())
        if not puzzles:
            self.stderr.write("No published puzzles. Run `python manage.py seed_puzzles` first.")
            return
        # One made-up "problem puzzle" so the dashboard's "where children get stuck" has a story to tell.
        tricky = next((p.slug for p in puzzles if p.kind == "slide"), puzzles[-1].slug)

        now = timezone.now()
        events = []
        for _ in range(opts["players"]):
            device = f"{DEMO_PREFIX}{uuid.uuid4()}"
            platform = rng.choices(["android", "ios", "web"], [78, 20, 2])[0]
            # More new players lately: the game is (pretend) growing.
            first = now - timedelta(days=opts["days"] * (rng.random() ** 1.6), hours=rng.random() * 12)
            at = first
            skill = rng.uniform(0.75, 1.2)
            stars = {}
            for p in puzzles:
                if at > now:
                    break
                # Medium and Hard open once 5 puzzles in the tier before have a star (the app's rule).
                if p.tier != "easy":
                    before = "easy" if p.tier == "medium" else "medium"
                    if sum(1 for q in puzzles if q.tier == before and stars.get(q.slug)) < 5:
                        break
                chance = FINISH[p.tier] * skill * (0.55 if p.slug == tricky else 1)
                tries = 0
                while tries < 3 and at <= now:
                    tries += 1
                    events.append(self._event(device, p, "start", at, platform))
                    seconds = max(15, int(rng.gauss(MINUTES[p.kind] * 60 / skill, 35)))
                    at += timedelta(seconds=seconds)
                    if rng.random() < min(0.97, chance):
                        got = 3 if rng.random() < 0.55 * skill else 2 if rng.random() < 0.7 else 1
                        events.append(self._event(device, p, "finish", at, platform, stars=got, seconds=seconds))
                        stars[p.slug] = max(stars.get(p.slug, 0), got)
                        break
                    events.append(self._event(device, p, "quit", at, platform, seconds=seconds // 2))
                    at += timedelta(hours=rng.uniform(2, 40))  # comes back another time
                if p.slug not in stars and rng.random() < 0.5:
                    break  # gave up on the game for now
                # Sometimes a break between puzzles: later today, or another day.
                at += timedelta(minutes=rng.uniform(0.5, 4)) if rng.random() < 0.7 else timedelta(days=rng.uniform(0.5, 5))

        with transaction.atomic():
            PlayEvent.objects.bulk_create(events, batch_size=1000)
        self.stdout.write(self.style.SUCCESS(f"Added {len(events)} made-up events from {opts['players']} pretend phones. Remove them with --clear."))

    @staticmethod
    def _event(device, puzzle, kind, at, platform, stars=None, seconds=None):
        return PlayEvent(
            event_id=uuid.uuid4(),
            device=device,
            puzzle=puzzle,
            puzzle_slug=puzzle.slug,
            type=kind,
            stars=stars,
            seconds=seconds,
            platform=platform,
            app_version="1.0.0",
            played_at=min(at, timezone.now()),
        )

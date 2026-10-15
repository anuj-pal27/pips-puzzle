import uuid
from datetime import timedelta

from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase

from content.models import Puzzle

from . import stats
from .models import DEMO_PREFIX, PlayEvent


def event(kind="start", puzzle="easy-1", at=None, **extra):
    return {"id": str(uuid.uuid4()), "type": kind, "puzzle": puzzle, "at": (at or timezone.now()).isoformat(), **extra}


class IngestTests(APITestCase):
    def setUp(self):
        call_command("seed_puzzles", verbosity=0)

    def send(self, events, device="phone-1234abcd"):
        return self.client.post("/api/events/", {"device": device, "platform": "android", "app_version": "1.0.0", "events": events}, format="json")

    def test_public_and_saves_events(self):
        res = self.send([event("start"), event("finish", stars=3, seconds=40), event("quit", puzzle="easy-2", seconds=9)])
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json(), {"saved": 3})
        finish = PlayEvent.objects.get(type="finish")
        self.assertEqual((finish.puzzle.slug, finish.stars, finish.seconds, finish.platform), ("easy-1", 3, 40, "android"))

    def test_sending_the_same_batch_again_counts_it_once(self):
        batch = [event("start"), event("finish", stars=2, seconds=30)]
        self.send(batch)
        res = self.send(batch)
        self.assertEqual(res.json(), {"saved": 0})
        self.assertEqual(PlayEvent.objects.count(), 2)

    def test_phone_clock_problems(self):
        now = timezone.now()
        self.send([event(at=now + timedelta(days=2)), event(at=now - timedelta(days=200))])
        (only,) = PlayEvent.objects.all()
        self.assertLessEqual(only.played_at, timezone.now())  # future clamped to now; the very old one dropped

    def test_unknown_puzzle_is_kept_by_slug(self):
        self.send([event(puzzle="easy-99")])
        e = PlayEvent.objects.get()
        self.assertIsNone(e.puzzle)
        self.assertEqual(e.puzzle_slug, "easy-99")

    def test_stars_only_on_finishes_and_bad_input_rejected(self):
        self.send([event("start", stars=3, seconds=5)])
        e = PlayEvent.objects.get()
        self.assertEqual((e.stars, e.seconds), (None, None))
        self.assertEqual(self.send([event()], device="x").status_code, 400)
        self.assertEqual(self.send([event("finish", stars=5)]).status_code, 400)
        self.assertEqual(self.send([event()] * 101).status_code, 400)


class StatsTests(TestCase):
    def setUp(self):
        call_command("seed_puzzles", verbosity=0)
        self.now = timezone.now()
        self.later = self.now + timedelta(seconds=1)  # windows end just before "now"; look from a moment later

    def add(self, device, slug, kind, days_ago=0, **extra):
        PlayEvent.objects.create(
            event_id=uuid.uuid4(), device=device, puzzle=Puzzle.objects.get(slug=slug), puzzle_slug=slug, type=kind,
            played_at=self.now - timedelta(days=days_ago), **extra,
        )

    def test_numbers(self):
        self.add("a", "easy-1", "start")
        self.add("a", "easy-1", "finish", stars=3, seconds=60)
        self.add("b", "easy-1", "start")
        self.add("b", "easy-1", "quit", seconds=20)
        self.add("b", "medium-1", "start")
        self.add("c", "easy-2", "start", days_ago=10)  # before the 7-day window

        w = stats.window("7", now=self.later)
        s = stats.summary(w)
        self.assertEqual((s["devices"], s["starts"], s["finishes"], s["quits"]), (2, 3, 1, 1))
        self.assertAlmostEqual(s["completion"], 1 / 3)
        self.assertEqual((s["avg_stars"], s["median_seconds"], s["new_devices"]), (3, 60, 2))

        rows = {r["puzzle"].slug: r for r in stats.per_puzzle(w)}
        self.assertEqual((rows["easy-1"]["starts"], rows["easy-1"]["finishes"], rows["easy-1"]["players"]), (2, 1, 2))
        self.assertEqual(rows["easy-1"]["stars"], [0, 0, 1])
        self.assertEqual(len(rows), 15)

        funnel = {f["label"]: f["devices"] for f in stats.funnel(w)}
        self.assertEqual(funnel, {"Played a puzzle": 2, "Finished a puzzle": 1, "Reached Medium": 1, "Reached Hard": 0})

        days = stats.daily(w)
        self.assertEqual(len(days), 7)
        self.assertEqual(sum(d["starts"] for d in days), 3)
        self.assertEqual(stats.summary(stats.window("all", now=self.later))["devices"], 3)

    def test_bit_lessons_are_counted_apart_from_puzzles(self):
        self.add("a", "easy-1", "start")
        for kind, extra in [("start", {}), ("finish", {"stars": 3, "seconds": 50})]:
            PlayEvent.objects.create(event_id=uuid.uuid4(), device="a", puzzle_slug="lab-1", type=kind, played_at=self.now, **extra)
        w = stats.window("7", now=self.later)
        self.assertEqual(stats.summary(w)["starts"], 1)
        lab = {r["slug"]: r for r in stats.lab_lessons(w)}
        self.assertEqual((lab["lab-1"]["starts"], lab["lab-1"]["finishes"], lab["lab-1"]["avg_stars"]), (1, 1, 3))
        self.assertEqual(lab["lab-5"]["starts"], 0)

    def test_change_and_hardest(self):
        self.assertEqual(stats.change({"x": 15}, {"x": 10}, "x"), 0.5)
        self.assertIsNone(stats.change({"x": 15}, {"x": 0}, "x"))
        for i in range(6):
            self.add(f"d{i}", "hard-2", "start")
        self.add("d0", "hard-2", "finish", stars=1, seconds=300)
        hardest = stats.hardest(stats.per_puzzle(stats.window("30", now=self.later)))
        self.assertEqual(hardest[0]["puzzle"].slug, "hard-2")


class DemoDataTests(TestCase):
    def test_demo_data_is_marked_and_removable(self):
        call_command("seed_puzzles", verbosity=0)
        PlayEvent.objects.create(event_id=uuid.uuid4(), device="real-phone-1", puzzle_slug="easy-1", type="start", played_at=timezone.now())
        call_command("demo_analytics", players=10, seed=1, verbosity=0)
        self.assertTrue(PlayEvent.objects.filter(device__startswith=DEMO_PREFIX).exists())
        call_command("demo_analytics", clear=True, verbosity=0)
        self.assertEqual(list(PlayEvent.objects.values_list("device", flat=True)), ["real-phone-1"])

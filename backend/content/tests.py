from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APITestCase

from .models import Puzzle


class SeedTests(TestCase):
    def test_seed_loads_fifteen_puzzles_and_is_repeatable(self):
        call_command("seed_puzzles", verbosity=0)
        call_command("seed_puzzles", verbosity=0)
        self.assertEqual(Puzzle.objects.count(), 15)
        for tier in ["easy", "medium", "hard"]:
            kinds = list(Puzzle.objects.filter(tier=tier).order_by("order").values_list("kind", flat=True))
            self.assertEqual(kinds, ["jigsaw"] * 4 + ["maze"], tier)

    def test_maze_must_have_one_start_and_goal(self):
        bad = Puzzle(slug="x", tier="easy", order=1, kind="maze", title="x", maze={"map": ["S..", "..."]})
        with self.assertRaises(ValidationError):
            bad.clean()


class PuzzleApiTests(APITestCase):
    def setUp(self):
        call_command("seed_puzzles", verbosity=0)

    def test_health_is_public(self):
        res = self.client.get("/api/health/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok"})

    def test_puzzles_are_public_and_in_play_order(self):
        Puzzle.objects.filter(slug="hard-2").update(is_published=False)
        res = self.client.get("/api/puzzles/")
        self.assertEqual(res.status_code, 200)
        slugs = [p["slug"] for p in res.json()]
        self.assertEqual(slugs[:6], ["easy-1", "easy-2", "easy-3", "easy-4", "easy-5", "medium-1"])
        self.assertEqual(slugs[-1], "hard-5")
        self.assertNotIn("hard-2", slugs)
        maze = next(p for p in res.json() if p["slug"] == "medium-5")
        self.assertEqual(len(maze["maze"]["map"]), 10)

import json
from pathlib import Path

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
        kinds = {
            tier: list(Puzzle.objects.filter(tier=tier).order_by("order").values_list("kind", flat=True))
            for tier in ["easy", "medium", "hard"]
        }
        self.assertEqual(kinds["easy"], ["jigsaw", "shadow", "memory", "jigsaw", "maze"])
        self.assertEqual(kinds["medium"], ["jigsaw", "tracks", "shadow", "memory", "maze"])
        self.assertEqual(kinds["hard"], ["jigsaw", "slide", "tracks", "memory", "maze"])

    def test_no_two_puzzles_in_a_row_play_the_same_way(self):
        call_command("seed_puzzles", verbosity=0)
        kinds = list(Puzzle.objects.in_play_order().values_list("kind", flat=True))
        for a, b in zip(kinds, kinds[1:]):
            self.assertNotEqual(a, b)

    def test_reseeding_clears_settings_from_an_old_kind(self):
        # An older database where easy-2 was still a jigsaw.
        Puzzle.objects.create(slug="easy-2", tier="easy", order=2, kind="jigsaw", title="Mithu", picture="mithu", cols=3, rows=2)
        call_command("seed_puzzles", verbosity=0)
        p = Puzzle.objects.get(slug="easy-2")
        self.assertEqual((p.kind, p.picture, p.cols, p.rows), ("shadow", "", None, None))
        self.assertEqual(p.config["friends"], ["mithu", "tillu", "pip"])

    def test_maze_must_have_one_start_and_goal(self):
        bad = Puzzle(slug="x", tier="easy", order=1, kind="maze", title="x", maze={"map": ["S..", "..."]})
        with self.assertRaises(ValidationError):
            bad.clean()

    def test_settings_for_the_new_kinds_are_checked(self):
        bad = [
            Puzzle(kind="shadow", config={"friends": ["gappu", "motu"]}),
            Puzzle(kind="shadow", config={"friends": ["gappu", "gappu"]}),
            Puzzle(kind="memory", config={"snacks": ["jalebi"]}),
            Puzzle(kind="tracks", config={"map": ["|.", "|"], "taps": ["10", "1"], "start": 0, "goal": 0}),
            Puzzle(kind="tracks", config={"map": ["|x"], "taps": ["10"], "start": 0, "goal": 0}),
            Puzzle(kind="tracks", config={"map": ["|."], "taps": ["10"], "start": 0, "goal": 7}),
            Puzzle(kind="slide", picture="tillu", config={"size": 3, "start": [0, 1, 2, 3, 4, 5, 6, 7, 7]}),
            Puzzle(kind="slide", config={"size": 3, "start": [0, 1, 2, 3, 4, 5, 6, 7, -1]}),
            Puzzle(kind="slide", picture="tillu", config={"size": 2, "start": [2, 0, 1, -1]}),  # no par
            Puzzle(kind="slide", picture="tillu", config={"size": 3, "start": [1, 0, 2, 3, 4, 5, 6, 7, -1], "par": 9}),  # unsolvable
            Puzzle(kind="jigsaw", picture="gappu", cols=9, rows=2),
        ]
        for puzzle in bad:
            with self.assertRaises(ValidationError, msg=puzzle.config):
                puzzle.clean()
        Puzzle(kind="tracks", config={"map": ["|."], "taps": ["10"], "start": 0, "goal": 0}).clean()
        Puzzle(kind="slide", picture="tillu", config={"size": 2, "start": [2, 0, 1, -1], "par": 3}).clean()


class PuzzleApiTests(APITestCase):
    def setUp(self):
        call_command("seed_puzzles", verbosity=0)

    def test_health_is_public(self):
        res = self.client.get("/api/health/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok"})

    def test_privacy_policy_is_public(self):
        res = self.client.get("/privacy/")
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "Share play stats")
        self.assertContains(res, "mailto:")

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
        tracks = next(p for p in res.json() if p["slug"] == "hard-3")
        self.assertEqual(tracks["kind"], "tracks")
        self.assertEqual(len(tracks["config"]["map"]), 6)
        spin = next(p for p in res.json() if p["slug"] == "hard-1")
        self.assertEqual(spin["config"], {"spin": True})
        first = res.json()[0]
        self.assertEqual((first["cheer"], first["blurb"]), ("You made Gappu!", "Always hungry, always grinning."))

    def test_a_tier_can_get_more_than_five_puzzles(self):
        extra = Puzzle(slug="easy-6", tier="easy", order=6, kind="jigsaw", title="Mithu the Parrot", picture="mithu", cols=3, rows=2)
        extra.full_clean()
        extra.save()
        slugs = [p["slug"] for p in self.client.get("/api/puzzles/").json()]
        self.assertEqual(slugs[4:7], ["easy-5", "easy-6", "medium-1"])

    def test_reseeding_leaves_added_puzzles_alone(self):
        Puzzle.objects.create(slug="easy-6", tier="easy", order=6, kind="jigsaw", title="Mithu", picture="mithu", cols=3, rows=2)
        call_command("seed_puzzles", verbosity=0)
        self.assertTrue(Puzzle.objects.filter(slug="easy-6").exists())


class BuilderTests(TestCase):
    """The server's copies of the game rules (content/builders.py)."""

    def test_seed_puzzles_pass_the_checks(self):
        from content import builders

        for item in json.loads((Path(builders.__file__).parent / "seed.json").read_text()):
            if item["kind"] == "tracks":
                c = item["config"]
                self.assertTrue(builders.trace_tracks(c["map"], c["start"], c["goal"])[1], item["slug"])
            if item["kind"] == "maze":
                self.assertEqual(builders.check_maze(item["maze"]), [], item["slug"])
            if item["kind"] == "slide":
                self.assertEqual(builders.slide_par(item["config"]["start"], 3), item["config"]["par"])

    def test_generated_tracks_always_join_up(self):
        from content import builders

        for seed in range(40):
            w, h = 3 + seed % 6, 3 + (seed // 6) % 6
            c = builders.generate_tracks(w, h, decoys=(seed % 4) / 5, seed=seed)
            self.assertEqual((len(c["map"]), len(c["map"][0])), (h, w))
            self.assertTrue(builders.trace_tracks(c["map"], c["start"], c["goal"])[1], seed)
            Puzzle(kind="tracks", config=c).clean()

    def test_slide_shuffles_are_solvable_with_exact_par(self):
        from content import builders

        for seed in range(15):
            s = builders.shuffle_slide(3, 18, seed=seed)
            self.assertTrue(builders.slide_solvable(s["start"], 3))
            self.assertEqual(s["par"], builders.slide_par(s["start"], 3))
            self.assertFalse(any(t == i for i, t in enumerate(s["start"])))

    def test_maze_problems_are_found(self):
        from content import builders

        good = {"map": ["S.o", ".#o", "o.J"], "gates": {}, "monkeys": []}
        self.assertEqual(builders.check_maze(good), [])
        walled = {**good, "map": ["S#o", "##o", "o.J"]}
        self.assertTrue(any("can't reach the jalebis" in p for p in builders.check_maze(walled)))
        gated = {**good, "map": ["SAo", "A#o", "o.J"], "gates": {"A": {"name": "yellow", "color": "#FFC93C", "glyph": "M0 0h1v1z", "lever": "a"}}}
        self.assertTrue(any("no 'a' on the map" in p for p in builders.check_maze(gated)))
        with self.assertRaises(ValidationError):
            Puzzle(kind="maze", maze=walled).clean()

    def test_tracks_that_dont_join_are_refused(self):
        with self.assertRaises(ValidationError):
            Puzzle(kind="tracks", config={"map": ["-."], "taps": ["00"], "start": 0, "goal": 0}).clean()

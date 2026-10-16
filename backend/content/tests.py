import json
from pathlib import Path

from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TestCase, TransactionTestCase
from rest_framework.test import APITestCase

from .ids import LEVELS
from .models import Puzzle

SEED = json.loads((Path(__file__).parent / "seed.json").read_text())


class SeedTests(TestCase):
    def test_seed_loads_every_level_and_is_repeatable(self):
        call_command("seed_puzzles", verbosity=0)
        call_command("seed_puzzles", verbosity=0)
        self.assertEqual(Puzzle.objects.count(), len(SEED))
        self.assertEqual(sorted(set(Puzzle.objects.values_list("level", flat=True))), list(LEVELS))
        kinds = {n: list(Puzzle.objects.filter(level=n).order_by("order").values_list("kind", flat=True)) for n in LEVELS}
        self.assertEqual(kinds[1], ["jigsaw", "shadow", "memory", "jigsaw", "maze", "jigsaw"])
        self.assertEqual(kinds[3], ["jigsaw", "rangoli", "shadow", "memory", "maze"])
        self.assertEqual(kinds[10], ["jigsaw", "tracks", "shadow", "memory", "maze", "jigsaw"])
        self.assertEqual(Puzzle.objects.in_play_order().last().slug, "level-10-6")

    def test_no_two_puzzles_in_a_row_play_the_same_way(self):
        call_command("seed_puzzles", verbosity=0)
        for n in LEVELS:
            kinds = list(Puzzle.objects.filter(level=n).in_play_order().values_list("kind", flat=True))
            for a, b in zip(kinds, kinds[1:]):
                self.assertNotEqual(a, b, n)

    def test_reseeding_moves_a_puzzle_out_of_the_way_instead_of_failing(self):
        mine = Puzzle.objects.create(slug="my-own", level=2, order=1, kind="jigsaw", title="Mine", picture="mithu", cols=3, rows=2)
        call_command("seed_puzzles", verbosity=0)
        mine.refresh_from_db()
        self.assertEqual((mine.level, mine.order), (2, 7))
        self.assertEqual(Puzzle.objects.get(level=2, order=1).slug, "level-2-1")

    def test_reseeding_clears_settings_from_an_old_kind(self):
        # An older database where easy-2 was still a jigsaw.
        Puzzle.objects.create(slug="easy-2", level=1, order=2, kind="jigsaw", title="Mithu", picture="mithu", cols=3, rows=2)
        call_command("seed_puzzles", verbosity=0)
        p = Puzzle.objects.get(slug="easy-2")
        self.assertEqual((p.kind, p.picture, p.cols, p.rows), ("shadow", "", None, None))
        self.assertEqual(p.config["friends"], ["mithu", "tillu", "pip"])

    def test_maze_must_have_one_start_and_goal(self):
        bad = Puzzle(slug="x", level=1, order=1, kind="maze", title="x", maze={"map": ["S..", "..."]})
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
            Puzzle(kind="rangoli", config={"style": "graffiti", "rings": [{"shape": "disc", "count": 1, "colors": ["red"]}, {"shape": "petal", "count": 8, "colors": ["red"]}]}),
            Puzzle(kind="rangoli", config={"style": "kolam", "rings": [{"shape": "disc", "count": 1, "colors": ["red"]}]}),
            Puzzle(kind="rangoli", config={"style": "kolam", "rings": [{"shape": "disc", "count": 1, "colors": ["red"]}, {"shape": "petal", "count": 7, "colors": ["red", "white"]}]}),
            Puzzle(kind="rangoli", config={"style": "kolam", "rings": [{"shape": "disc", "count": 1, "colors": ["gold"]}, {"shape": "petal", "count": 8, "colors": ["red"]}]}),
            Puzzle(kind="maze", maze={**next(i for i in SEED if i["slug"] == "easy-5")["maze"], "goal": "pizza"}),
        ]
        for puzzle in bad:
            with self.assertRaises(ValidationError, msg=puzzle.config):
                puzzle.clean()
        Puzzle(kind="tracks", config={"map": ["|."], "taps": ["10"], "start": 0, "goal": 0}).clean()
        Puzzle(kind="slide", picture="tillu", config={"size": 2, "start": [2, 0, 1, -1], "par": 3}).clean()
        Puzzle(kind="rangoli", config={"style": "kolam", "rings": [{"shape": "disc", "count": 1, "colors": ["red"]}, {"shape": "petal", "count": 8, "colors": ["red", "white"]}], "extra": ["blue"]}).clean()
        Puzzle(kind="maze", maze={**next(i for i in SEED if i["slug"] == "easy-5")["maze"], "goal": "dhol"}).clean()


class PuzzleApiTests(APITestCase):
    def setUp(self):
        call_command("seed_puzzles", verbosity=0)

    def test_health_is_public(self):
        res = self.client.get("/api/health/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "ok"})

    def test_puzzles_carry_their_fact(self):
        easy1 = next(p for p in self.client.get("/api/puzzles/").json() if p["slug"] == "easy-1")
        self.assertIn("climb", easy1["fact"])

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
        self.assertEqual(slugs[:7], ["easy-1", "easy-2", "easy-3", "easy-4", "easy-5", "hard-1", "level-2-1"])
        self.assertEqual(slugs[-1], "level-10-6")
        self.assertNotIn("hard-2", slugs)
        self.assertEqual([p["level"] for p in res.json()], sorted(p["level"] for p in res.json()))
        self.assertNotIn("tier", res.json()[0], "apps from before the levels ignore this list and keep their own puzzles")
        maze = next(p for p in res.json() if p["slug"] == "medium-5")
        self.assertEqual(len(maze["maze"]["map"]), 10)
        tracks = next(p for p in res.json() if p["slug"] == "hard-3")
        self.assertEqual(tracks["kind"], "tracks")
        self.assertEqual(len(tracks["config"]["map"]), 6)
        spin = next(p for p in res.json() if p["slug"] == "level-10-6")
        self.assertEqual(spin["config"], {"spin": True})
        rangoli = next(p for p in res.json() if p["slug"] == "level-7-2")
        self.assertEqual((rangoli["kind"], rangoli["config"]["style"]), ("rangoli", "kolam"))
        first = res.json()[0]
        self.assertEqual((first["cheer"], first["blurb"]), ("You made Gappu!", "Always hungry, always grinning."))

    def test_a_level_can_get_more_puzzles(self):
        extra = Puzzle(slug="level-1-7", level=1, order=7, kind="jigsaw", title="Mithu the Parrot", picture="mithu", cols=3, rows=2)
        extra.full_clean()
        extra.save()
        slugs = [p["slug"] for p in self.client.get("/api/puzzles/").json()]
        self.assertEqual(slugs[5:8], ["hard-1", "level-1-7", "level-2-1"])

    def test_reseeding_leaves_added_puzzles_alone(self):
        Puzzle.objects.create(slug="level-1-7", level=1, order=7, kind="jigsaw", title="Mithu", picture="mithu", cols=3, rows=2)
        call_command("seed_puzzles", verbosity=0)
        self.assertTrue(Puzzle.objects.filter(slug="level-1-7").exists())


class DiwaliMigrationTests(TestCase):
    def test_old_medium_puzzles_become_diwali_night_unless_edited(self):
        import importlib

        from django.apps import apps

        diwali = importlib.import_module("content.migrations.0006_medium_becomes_diwali_night")
        Puzzle.objects.create(slug="medium-4", level=10, order=4, kind="memory", title="Snack Snap", config={"snacks": ["jalebi", "laddoo", "samosa", "chai"], "cols": 4})
        Puzzle.objects.create(slug="medium-1", level=10, order=1, kind="jigsaw", title="My own shop", picture="shop", cols=4, rows=3)
        diwali.to_diwali(apps, None)
        snap = Puzzle.objects.get(slug="medium-4")
        self.assertEqual((snap.title, snap.config["snacks"]), ("Mithai Snap", ["laddoo", "jalebi", "kajukatli", "gulabjamun"]))
        self.assertEqual(Puzzle.objects.get(slug="medium-1").picture, "shop")  # renamed in the dashboard: left alone


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
            if item["kind"] == "rangoli":
                self.assertEqual(builders.check_rangoli(item["config"]), [], item["slug"])

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
        self.assertTrue(any("can't reach the goal" in p for p in builders.check_maze(walled)))
        gated = {**good, "map": ["SAo", "A#o", "o.J"], "gates": {"A": {"name": "yellow", "color": "#FFC93C", "glyph": "M0 0h1v1z", "lever": "a"}}}
        self.assertTrue(any("no 'a' on the map" in p for p in builders.check_maze(gated)))
        with self.assertRaises(ValidationError):
            Puzzle(kind="maze", maze=walled).clean()

    def test_tracks_that_dont_join_are_refused(self):
        with self.assertRaises(ValidationError):
            Puzzle(kind="tracks", config={"map": ["-."], "taps": ["00"], "start": 0, "goal": 0}).clean()


class StoryMigrationTests(TransactionTestCase):
    """0007 and 0008 on a server from before the levels: stars stay (slugs don't change), dashboard-made
    puzzles move to the end of a level, edited puzzles are left alone, and the new puzzles arrive."""

    old = ("content", "0006_medium_becomes_diwali_night")
    new = ("content", "0008_story_levels")

    def tearDown(self):
        MigrationExecutor(connection).migrate(MigrationExecutor(connection).loader.graph.leaf_nodes())
        super().tearDown()

    def test_tiers_become_levels(self):
        executor = MigrationExecutor(connection)
        executor.migrate([self.old])
        OldPuzzle = executor.loader.project_state([self.old]).apps.get_model("content", "Puzzle")
        titles = {"easy-2": "Who's That Shadow?", "hard-2": "Tillu's Slide Puzzle", "medium-3": "Lamplight Shadows", "hard-5": "Jalebi Hunt"}
        for slug, title in titles.items():
            tier, _, n = slug.partition("-")
            OldPuzzle.objects.create(slug=slug, tier=tier, order=int(n), kind="jigsaw", title=title, picture="gappu", cols=3, rows=2)
        OldPuzzle.objects.create(slug="hard-1", tier="hard", order=1, kind="jigsaw", title="My station", picture="station", cols=5, rows=4)  # edited
        OldPuzzle.objects.create(slug="easy-6", tier="easy", order=6, kind="jigsaw", title="Mithu", picture="mithu", cols=3, rows=2)  # made in the dashboard
        OldPuzzle.objects.create(slug="hard-6", tier="hard", order=6, kind="jigsaw", title="Tillu", picture="tillu", cols=3, rows=2)

        executor = MigrationExecutor(connection)
        executor.migrate([self.new])
        Puzzle = executor.loader.project_state([self.new]).apps.get_model("content", "Puzzle")
        place = lambda slug: (lambda p: (p.level, p.order))(Puzzle.objects.get(slug=slug))  # noqa: E731

        self.assertEqual(place("easy-2"), (1, 2))
        self.assertEqual(place("hard-2"), (6, 4))
        self.assertEqual(place("medium-3"), (10, 3))
        self.assertEqual(place("hard-5"), (9, 4))
        self.assertEqual(place("hard-1"), (1, 6))
        self.assertEqual(place("easy-6"), (1, 7), "dashboard puzzles go after the game's own")
        self.assertEqual(place("hard-6"), (9, 7))
        # Unedited puzzles get their place in the story; the edited one keeps what it was given.
        self.assertEqual(Puzzle.objects.get(slug="hard-2").picture, "boat-race")
        self.assertEqual(Puzzle.objects.get(slug="easy-2").title, "Who's Coming Along?")
        station = Puzzle.objects.get(slug="hard-1")
        self.assertEqual((station.title, station.cols, station.rows), ("My station", 5, 4))
        # Every puzzle from the story is there, once.
        self.assertEqual(set(Puzzle.objects.values_list("slug", flat=True)) >= {i["slug"] for i in SEED}, True)
        self.assertEqual(Puzzle.objects.count(), len({i["slug"] for i in SEED} | {"easy-6", "hard-6"}))

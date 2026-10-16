import io
import json
import shutil
import tempfile
from pathlib import Path

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, override_settings
from PIL import Image

from accounts.models import User
from content import builders
from content.models import Puzzle

MEDIA = tempfile.mkdtemp()
# Uploads in tests always go to a temporary folder, even when .env points media at real cloud storage.
LOCAL_FILES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}


def png(w=90, h=60) -> SimpleUploadedFile:
    buf = io.BytesIO()
    Image.new("RGB", (w, h), "orange").save(buf, "PNG")
    return SimpleUploadedFile("new.png", buf.getvalue(), content_type="image/png")


BASE = {"title": "New one", "level": "1", "order": "", "cheer": "", "blurb": "", "is_published": "on", "cols": "3", "rows": "2", "size": "3", "difficulty": "easy", "shadow_cols": "3"}


@override_settings(MEDIA_ROOT=MEDIA, STORAGES=LOCAL_FILES)
class DashboardTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(MEDIA, ignore_errors=True)

    def setUp(self):
        call_command("seed_puzzles", verbosity=0)
        self.staff = User.objects.create_user("staff", "staff@example.com", "pw-for-tests-only", is_staff=True)
        self.client.force_login(self.staff)

    def create(self, **fields):
        return self.client.post("/dashboard/puzzles/new/", {**BASE, **fields})

    # ------------------------------------------------------------ access

    def test_only_staff_get_in(self):
        self.client.logout()
        self.assertRedirects(self.client.get("/dashboard/"), "/admin/login/?next=/dashboard/", fetch_redirect_response=False)
        parent = User.objects.create_user("parent", "p@example.com", "pw-for-tests-only")
        self.client.force_login(parent)
        self.assertEqual(self.client.get("/dashboard/puzzles/").status_code, 302)
        self.assertEqual(self.client.get("/dashboard/tools/tracks/").status_code, 302)

    def test_pages_render(self):
        for url in [
            "/dashboard/",
            "/dashboard/?days=all",
            "/dashboard/puzzles/",
            "/dashboard/puzzles/hard-5/",
            "/dashboard/puzzles/level-7-2/",
            "/dashboard/puzzles/new/",
            "/dashboard/puzzles/new/?level=4",
            "/dashboard/puzzles/medium-2/edit/",
            "/dashboard/puzzles/level-3-2/edit/",
        ]:
            self.assertEqual(self.client.get(url).status_code, 200, url)

    # ------------------------------------------------------------ making puzzles

    def test_create_each_kind(self):
        seed = json.loads((Path(builders.__file__).parent / "seed.json").read_text())
        maze = next(p for p in seed if p["slug"] == "easy-5")["maze"]
        rangoli = next(p for p in seed if p["kind"] == "rangoli")["config"]
        tracks = builders.generate_tracks(5, 5, seed=3)
        cases = {
            "jigsaw": {"picture": "mithu", "spin": "on"},
            "shadow": {"friends": ["gappu", "gauri", "pip"]},
            "memory": {"snacks": ["chai", "kulfi"]},
            "slide": {"picture": "tillu"},
            "tracks": {"tracks_json": json.dumps(tracks)},
            "maze": {"maze_json": json.dumps({**maze, "goal": "dhol"})},
            "rangoli": {"rangoli_json": json.dumps(rangoli)},
        }
        for kind, fields in cases.items():
            res = self.create(kind=kind, **fields)
            self.assertEqual(res.status_code, 302, f"{kind}: {res.context and res.context['form'].errors}")
        made = {p.kind: p for p in Puzzle.objects.filter(level=1, order__gte=7)}
        self.assertEqual(set(made), set(cases))
        self.assertEqual([p.order for p in Puzzle.objects.filter(level=1, order__gte=7).order_by("order")], [7, 8, 9, 10, 11, 12, 13])
        self.assertEqual(made["jigsaw"].slug, "level-1-7")
        self.assertEqual(made["maze"].maze["goal"], "dhol")
        self.assertEqual(made["rangoli"].config, rangoli)
        self.assertEqual(made["jigsaw"].config, {"spin": True})
        self.assertEqual(made["shadow"].config, {"friends": ["gappu", "gauri", "pip"], "cols": 3})
        slide = made["slide"].config
        self.assertTrue(builders.slide_solvable(slide["start"], 3))
        self.assertEqual(slide["par"], builders.slide_par(slide["start"], 3))
        self.assertEqual(made["tracks"].config, tracks)
        # New puzzles go straight into the app's list.
        slugs = [p["slug"] for p in self.client.get("/api/puzzles/").json()]
        self.assertIn(made["maze"].slug, slugs)

    def test_upload_a_picture(self):
        res = self.client.post("/dashboard/puzzles/new/", {**BASE, "kind": "jigsaw", "picture": "upload", "image": png()})
        self.assertEqual(res.status_code, 302)
        p = Puzzle.objects.get(slug="level-1-7")
        self.assertEqual((p.picture, p.image_width, p.image_height), ("", 90, 60))
        api = next(x for x in self.client.get("/api/puzzles/").json() if x["slug"] == "level-1-7")
        self.assertTrue(api["image"].startswith("http://testserver/media/puzzles/"))

    def test_broken_puzzles_are_refused(self):
        tracks = builders.generate_tracks(4, 4, seed=1)
        tracks["map"][0] = "TTTT"  # cut the line
        broken_maze = {"map": ["S..", "###", "J.o"], "gates": {}, "monkeys": []}
        for fields in [
            {"kind": "tracks", "tracks_json": json.dumps(tracks)},
            {"kind": "tracks", "tracks_json": "{not json"},
            {"kind": "maze", "maze_json": json.dumps(broken_maze)},
            {"kind": "shadow", "friends": ["gappu"]},
            {"kind": "jigsaw", "picture": "upload"},  # nothing uploaded
            {"kind": "jigsaw", "picture": "mithu", "order": "1"},  # level 1, order 1 is taken
            {"kind": "memory", "snacks": ["jalebi", "laddoo", "samosa", "chai", "kulfi", "mango", "lassi", "dhokla", "modak"]},  # 9 pairs
            {"kind": "rangoli", "rangoli_json": json.dumps({"style": "kolam", "rings": [{"shape": "disc", "count": 1, "colors": ["red"]}]})},
            {"kind": "maze", "maze_json": json.dumps({**json.loads(json.dumps(broken_maze)), "map": ["S.o", ".#o", "o.J"], "goal": "unicorn"})},
        ]:
            res = self.create(**fields)
            self.assertEqual(res.status_code, 200, fields)
            self.assertTrue(res.context["form"].errors, fields)
        self.assertEqual(Puzzle.objects.count(), len(json.loads((Path(builders.__file__).parent / "seed.json").read_text())))

    def test_edit_keeps_the_id(self):
        res = self.client.post("/dashboard/puzzles/easy-2/edit/", {**BASE, "kind": "shadow", "title": "Shadows!", "level": "10", "order": "", "friends": ["mithu", "pip"]})
        self.assertEqual(res.status_code, 302)
        p = Puzzle.objects.get(slug="easy-2")
        self.assertEqual((p.title, p.level, p.order, p.config["friends"]), ("Shadows!", 10, 7, ["mithu", "pip"]))

    def test_edit_form_round_trips_every_seed_puzzle(self):
        """Saving any built-in puzzle unchanged keeps its settings."""
        from dashboard.forms import PuzzleForm

        for p in Puzzle.objects.all():
            before = (p.kind, p.picture, p.cols, p.rows, p.config, p.maze)
            data = PuzzleForm.initial_from(p)
            post = {k: v for k, v in data.items() if v is not None}
            post["order"] = str(p.order)
            post["is_published"] = "on"
            res = self.client.post(f"/dashboard/puzzles/{p.slug}/edit/", post)
            self.assertEqual(res.status_code, 302, f"{p.slug}: {res.context and res.context['form'].errors}")
            p.refresh_from_db()
            after = (p.kind, p.picture, p.cols, p.rows, p.config, p.maze)
            if p.kind == "maze":  # the form leaves out the maze's old "id" (the app uses the slug instead)
                before = (*before[:5], {k: v for k, v in before[5].items() if k != "id"})
            self.assertEqual(after, before, p.slug)

    # ------------------------------------------------------------ actions

    def test_publish_move_duplicate_delete(self):
        post = lambda slug, action: self.client.post(f"/dashboard/puzzles/{slug}/{action}/")  # noqa: E731
        post("easy-3", "publish")
        self.assertFalse(Puzzle.objects.get(slug="easy-3").is_published)
        post("easy-3", "up")
        self.assertEqual(Puzzle.objects.get(slug="easy-3").order, 2)
        self.assertEqual(Puzzle.objects.get(slug="easy-2").order, 3)
        post("easy-1", "up")  # already first: nothing happens
        self.assertEqual(Puzzle.objects.get(slug="easy-1").order, 1)
        res = post("easy-1", "duplicate")
        copy = Puzzle.objects.get(slug="level-1-7")
        self.assertRedirects(res, "/dashboard/puzzles/level-1-7/edit/", fetch_redirect_response=False)
        self.assertEqual((copy.picture, copy.is_published, copy.level), ("gappu", False, 1))
        post("level-1-7", "delete")
        self.assertFalse(Puzzle.objects.filter(slug="level-1-7").exists())
        self.assertEqual(self.client.post("/dashboard/puzzles/easy-1/publish/", {"next": "https://evil.example/"}).url, "/dashboard/puzzles/")

    def test_tools(self):
        tracks = self.client.get("/dashboard/tools/tracks/?width=6&height=6&decoys=0.5").json()
        _, reached = builders.trace_tracks(tracks["config"]["map"], tracks["config"]["start"], tracks["config"]["goal"])
        self.assertTrue(reached)
        slide = self.client.get("/dashboard/tools/slide/?size=3&difficulty=hard").json()
        self.assertTrue(builders.slide_solvable(slide["start"], 3))
        check = lambda kind, value: self.client.post("/dashboard/tools/check/", {"kind": kind, "value": value}, content_type="application/json").json()  # noqa: E731
        self.assertEqual(check("tracks", tracks["config"])["problems"], [])
        self.assertTrue(check("maze", {"map": ["S.J"]})["problems"])  # no laddoos
        pattern = {"style": "pookalam", "rings": [{"shape": "disc", "count": 1, "colors": ["purple"]}, {"shape": "leaf", "count": 16, "colors": ["green"]}]}
        self.assertEqual(check("rangoli", pattern)["problems"], [])
        self.assertTrue(check("rangoli", {**pattern, "style": "graffiti"})["problems"])
        self.assertEqual(self.client.get("/dashboard/events.csv").status_code, 200)

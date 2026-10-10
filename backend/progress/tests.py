from django.core.management import call_command
from rest_framework.test import APITestCase

from accounts.models import ChildProfile, User
from accounts.tests import sign_in


class SyncTests(APITestCase):
    def setUp(self):
        call_command("seed_puzzles", verbosity=0)
        self.parent = sign_in(self.client)
        self.child = ChildProfile.objects.create(parent=self.parent, nickname="Meera")

    def sync(self, items, child=None):
        return self.client.post("/api/progress/sync/", {"child": child or self.child.id, "items": items}, format="json")

    def test_sync_keeps_the_best_stars(self):
        res = self.sync([{"puzzle": "easy-1", "stars": 2}, {"puzzle": "easy-2", "stars": 3}])
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["stars"], {"easy-1": 2, "easy-2": 3})
        # A worse result from another phone never lowers the score; a better one raises it.
        res = self.sync([{"puzzle": "easy-1", "stars": 3}, {"puzzle": "easy-2", "stars": 1}])
        self.assertEqual(res.json()["stars"], {"easy-1": 3, "easy-2": 3})
        listed = self.client.get(f"/api/progress/?child={self.child.id}").json()
        self.assertEqual({p["puzzle"]: p["stars"] for p in listed}, {"easy-1": 3, "easy-2": 3})

    def test_bad_input_is_rejected(self):
        self.assertEqual(self.sync([{"puzzle": "easy-1", "stars": 4}]).status_code, 400)
        self.assertEqual(self.sync([{"puzzle": "not-a-puzzle", "stars": 1}]).status_code, 400)
        self.assertEqual(self.client.get("/api/progress/").status_code, 400)

    def test_cannot_touch_another_parents_child(self):
        other = User.objects.create_user(username="o@example.com", email="o@example.com", password="x-long-password-1")
        theirs = ChildProfile.objects.create(parent=other, nickname="Not yours")
        self.assertEqual(self.sync([{"puzzle": "easy-1", "stars": 3}], child=theirs.id).status_code, 400)
        self.assertEqual(self.client.get(f"/api/progress/?child={theirs.id}").json(), [])

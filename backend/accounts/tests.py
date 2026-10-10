from rest_framework.test import APITestCase

from .models import ChildProfile, User


def sign_in(client, email="asha@example.com", password="jalebi-junction-42"):
    client.post("/api/auth/register/", {"email": email, "password": password}, format="json")
    tokens = client.post("/api/auth/token/", {"username": email, "password": password}, format="json").json()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    return User.objects.get(email=email)


class RegisterTests(APITestCase):
    def test_register_then_sign_in(self):
        res = self.client.post("/api/auth/register/", {"email": "Asha@Example.com", "password": "jalebi-junction-42"}, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()["email"], "asha@example.com")
        self.assertNotIn("password", res.json())
        tokens = self.client.post("/api/auth/token/", {"username": "asha@example.com", "password": "jalebi-junction-42"}, format="json")
        self.assertEqual(tokens.status_code, 200)
        self.assertIn("access", tokens.json())

    def test_weak_password_and_duplicate_email_are_rejected(self):
        self.assertEqual(self.client.post("/api/auth/register/", {"email": "a@example.com", "password": "123"}, format="json").status_code, 400)
        self.client.post("/api/auth/register/", {"email": "b@example.com", "password": "jalebi-junction-42"}, format="json")
        dup = self.client.post("/api/auth/register/", {"email": "B@example.com", "password": "jalebi-junction-42"}, format="json")
        self.assertEqual(dup.status_code, 400)


class ChildrenTests(APITestCase):
    def test_children_need_sign_in(self):
        self.assertEqual(self.client.get("/api/children/").status_code, 401)

    def test_parent_only_sees_own_children(self):
        other = User.objects.create_user(username="o@example.com", email="o@example.com", password="x-long-password-1")
        ChildProfile.objects.create(parent=other, nickname="Not yours")
        sign_in(self.client)
        res = self.client.post("/api/children/", {"nickname": "Meera"}, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()["avatar"], "pip")
        names = [c["nickname"] for c in self.client.get("/api/children/").json()]
        self.assertEqual(names, ["Meera"])
        other_child = ChildProfile.objects.get(nickname="Not yours")
        self.assertEqual(self.client.delete(f"/api/children/{other_child.id}/").status_code, 404)

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """A parent account. Children never sign in themselves.

    Kept as our own model from day one so fields can be added later without a painful migration.
    The parent's email is used as the username.
    """

    email = models.EmailField("email address", unique=True)


class ChildProfile(models.Model):
    """A child who plays on a parent's account. Deliberately minimal: no real names, ages or photos."""

    parent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="children")
    nickname = models.CharField(max_length=30)
    avatar = models.CharField(max_length=30, default="pip", help_text="Name of a built-in avatar in the app.")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"{self.nickname} ({self.parent.email})"

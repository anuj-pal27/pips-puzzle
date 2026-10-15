from django.db import models

from content.models import Puzzle


class PlayEvent(models.Model):
    """One thing that happened in a game on a phone: a puzzle was started, finished or left unfinished.

    Anonymous by design (it's a kids' app): `device` is a random id the app makes up on first launch,
    not linked to an account, a name or the phone's own ids. Nothing else about the child is sent.
    """

    class Type(models.TextChoices):
        START = "start", "Started"
        FINISH = "finish", "Finished"
        QUIT = "quit", "Left unfinished"

    event_id = models.UUIDField(unique=True, help_text="Made on the phone, so a batch sent twice is only counted once.")
    device = models.CharField(max_length=64, db_index=True)
    puzzle = models.ForeignKey(Puzzle, null=True, blank=True, on_delete=models.SET_NULL, related_name="events")
    puzzle_slug = models.SlugField(max_length=50, help_text="Kept even if the puzzle is deleted later.")
    type = models.CharField(max_length=10, choices=Type.choices)
    stars = models.PositiveSmallIntegerField(null=True, blank=True)
    seconds = models.PositiveIntegerField(null=True, blank=True, help_text="Time spent in the puzzle (finish and quit).")
    platform = models.CharField(max_length=10, blank=True)
    app_version = models.CharField(max_length=20, blank=True)
    played_at = models.DateTimeField(help_text="When it happened on the phone (events are sent later if it was offline).")
    received_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-played_at"]
        indexes = [
            models.Index(fields=["played_at"]),
            models.Index(fields=["puzzle_slug", "type"]),
        ]

    def __str__(self) -> str:
        return f"{self.get_type_display()} {self.puzzle_slug} ({self.device[:8]})"

    @property
    def is_demo(self) -> bool:
        return self.device.startswith(DEMO_PREFIX)

# Learn with Bit lessons are built into the app (app/src/game/teach.ts) and report plays under these slugs.
# Their stats are kept apart from the puzzles' (they aren't Puzzle rows).
LAB_PREFIX = "lab-"
LAB_LESSONS = {
    "lab-1": "Fruit or not?",
    "lab-2": "Can it fly?",
    "lab-3": "Hot or cold?",
    "lab-4": "Bit gets muddled",
    "lab-5": "Three baskets",
}


# Devices made up by `manage.py demo_analytics`, so demo data can be told apart and removed.
DEMO_PREFIX = "demo-"

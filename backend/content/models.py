from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Case, IntegerField, Value, When


class Tier(models.TextChoices):
    EASY = "easy", "Easy"
    MEDIUM = "medium", "Medium"
    HARD = "hard", "Hard"


TIER_RANK = {Tier.EASY: 0, Tier.MEDIUM: 1, Tier.HARD: 2}


class PuzzleQuerySet(models.QuerySet):
    def published(self):
        return self.filter(is_published=True)

    def in_play_order(self):
        """Easy -> Medium -> Hard, then 1..5 inside each tier."""
        rank = Case(*[When(tier=t, then=Value(r)) for t, r in TIER_RANK.items()], output_field=IntegerField())
        return self.annotate(tier_rank=rank).order_by("tier_rank", "order")


class Puzzle(models.Model):
    """One puzzle in the game. `slug` matches the id used in the app (e.g. "easy-3")."""

    class Kind(models.TextChoices):
        JIGSAW = "jigsaw", "Character jigsaw"
        MAZE = "maze", "Jalebi maze hunt"

    slug = models.SlugField(unique=True)
    tier = models.CharField(max_length=10, choices=Tier.choices)
    order = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    kind = models.CharField(max_length=10, choices=Kind.choices)
    title = models.CharField(max_length=80)
    picture = models.CharField(
        max_length=40,
        blank=True,
        help_text="Id of a picture bundled in the app (gappu, mithu, tillu, chunnu, shop, station).",
    )
    image = models.ImageField(
        upload_to="puzzles/",
        blank=True,
        help_text="Optional: a new picture sent from the server instead of a bundled one.",
    )
    cols = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Jigsaw columns (Easy 3, Medium 4, Hard 5).")
    rows = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Jigsaw rows (Easy 2, Medium 3, Hard 4).")
    maze = models.JSONField(
        null=True,
        blank=True,
        help_text="Maze map, gates and monkeys, in the same format as the app's src/data/mazes.ts.",
    )
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = PuzzleQuerySet.as_manager()

    class Meta:
        constraints = [models.UniqueConstraint(fields=["tier", "order"], name="one_puzzle_per_tier_slot")]

    def __str__(self) -> str:
        return f"{self.get_tier_display()} {self.order}: {self.title}"

    def clean(self):
        if self.kind == self.Kind.JIGSAW:
            if not (self.cols and self.rows):
                raise ValidationError("A jigsaw needs columns and rows.")
            if not (self.picture or self.image):
                raise ValidationError("A jigsaw needs a bundled picture id or an uploaded image.")
        if self.kind == self.Kind.MAZE:
            maze = self.maze or {}
            rows = maze.get("map") or []
            if not rows or len({len(r) for r in rows}) != 1:
                raise ValidationError("A maze needs a rectangular 'map' (a list of equal-length rows).")
            joined = "".join(rows)
            if joined.count("S") != 1 or joined.count("J") != 1:
                raise ValidationError("A maze map needs exactly one start 'S' and one jalebi stall 'J'.")

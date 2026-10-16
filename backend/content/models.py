from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from . import builders
from .ids import FRIENDS, LAST_LEVEL, LEVELS, SNACKS

LEVEL_CHOICES = [(n, f"Level {n}: {place}") for n, place in LEVELS.items()]


class PuzzleQuerySet(models.QuerySet):
    def published(self):
        return self.filter(is_published=True)

    def in_play_order(self):
        """Level 1 to 10, then 1, 2, 3... inside each level."""
        return self.order_by("level", "order")


class Puzzle(models.Model):
    """One puzzle in the game. `slug` matches the id used in the app (e.g. "level-3-2", or "easy-3" for the
    puzzles from before the levels, which kept their ids so children keep their stars)."""

    class Kind(models.TextChoices):
        JIGSAW = "jigsaw", "Jigsaw"
        MAZE = "maze", "Maze hunt"
        SHADOW = "shadow", "Who's That Shadow?"
        MEMORY = "memory", "Snack Snap (memory)"
        TRACKS = "tracks", "Fix the Tracks"
        SLIDE = "slide", "Slide puzzle"
        RANGOLI = "rangoli", "Rangoli"

    slug = models.SlugField(unique=True)
    level = models.PositiveSmallIntegerField(
        choices=LEVEL_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(LAST_LEVEL)],
        help_text="Which stop on the journey (STORY.md). A level opens once 4 puzzles of the level before have a star.",
    )
    order = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(99)],
        help_text="Position inside the level: 1 is played first. Add 7, 8, ... to give a level more puzzles.",
    )
    kind = models.CharField(max_length=10, choices=Kind.choices)
    title = models.CharField(max_length=80, help_text="Shown on the map and on the finish screen's name card.")
    cheer = models.CharField(max_length=40, blank=True, help_text='Big headline on the finish screen, e.g. "You made Gappu!".')
    blurb = models.CharField(max_length=120, blank=True, help_text="One short line under the name card on the finish screen.")
    fact = models.CharField(max_length=160, blank=True, help_text="Pip's fact: one short, true fun fact shown on the finish screen.")
    picture = models.CharField(
        max_length=40,
        blank=True,
        help_text="Id of a picture bundled in the app (see content/ids.py: gappu, bholu, kites, big-picture...). Jigsaws and slide puzzles.",
    )
    image = models.ImageField(
        upload_to="puzzles/",
        blank=True,
        width_field="image_width",
        height_field="image_height",
        help_text="Optional: a new picture sent from the server instead of a bundled one. About 3:2, at least 660 x 440.",
    )
    image_width = models.PositiveIntegerField(null=True, blank=True, editable=False)
    image_height = models.PositiveIntegerField(null=True, blank=True, editable=False)
    cols = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Jigsaw columns (3 in level 1, up to 6 in level 10).")
    rows = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Jigsaw rows (2 in level 1, up to 4 in level 10).")
    maze = models.JSONField(
        null=True,
        blank=True,
        help_text='Maze map, gates and monkeys, in the same format as the app\'s src/data/mazes.ts. Optional "goal": a snack or gift id instead of jalebis.',
    )
    config = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            "Settings for the other kinds, in the same format as the app's src/data/puzzles.ts: "
            'shadow {"friends": [...], "cols": 3}; memory {"snacks": [...], "cols": 4}; '
            'tracks {"map": [...], "taps": [...], "start": 0, "goal": 5}; slide {"size": 3, "start": [...], "par": 10}; '
            'rangoli {"style": "kolam", "rings": [{"shape": "disc", "count": 1, "colors": ["yellow"]}, ...]}; '
            'jigsaw {"spin": true} to start pieces turned round.'
        ),
    )
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = PuzzleQuerySet.as_manager()

    class Meta:
        constraints = [models.UniqueConstraint(fields=["level", "order"], name="one_puzzle_per_level_slot")]

    def __str__(self) -> str:
        return f"Level {self.level}.{self.order}: {self.title}"

    def clean(self):
        config = self.config or {}
        if self.kind == self.Kind.JIGSAW:
            if not (self.cols and self.rows):
                raise ValidationError("A jigsaw needs columns and rows.")
            if not (2 <= self.cols <= 6 and 2 <= self.rows <= 5):
                raise ValidationError("A jigsaw has 2 to 6 columns and 2 to 5 rows.")
            if not (self.picture or self.image):
                raise ValidationError("A jigsaw needs a bundled picture id or an uploaded image.")
        elif self.kind == self.Kind.MAZE:
            if not isinstance(self.maze, dict):
                raise ValidationError("A maze needs its map, gates and monkeys.")
            problems = builders.check_maze(self.maze)
            if problems:
                raise ValidationError(problems)
        elif self.kind == self.Kind.SHADOW:
            _unique_list(config, "friends", set(FRIENDS))
        elif self.kind == self.Kind.MEMORY:
            _unique_list(config, "snacks", set(SNACKS))
        elif self.kind == self.Kind.TRACKS:
            _check_tracks(config)
        elif self.kind == self.Kind.SLIDE:
            if not (self.picture or self.image):
                raise ValidationError("A slide puzzle needs a bundled picture id or an uploaded image.")
            _check_slide(config)
        elif self.kind == self.Kind.RANGOLI:
            problems = builders.check_rangoli(config)
            if problems:
                raise ValidationError(problems)


TRACK_TILES = set("|-abcd.THPF")


def _unique_list(config, key, allowed):
    items = config.get(key)
    if not isinstance(items, list) or len(items) < 2 or len(set(items)) != len(items):
        raise ValidationError(f"'{key}' must be a list of at least two different ids.")
    unknown = set(items) - allowed
    if unknown:
        raise ValidationError(f"Unknown {key}: {', '.join(sorted(unknown))}. The app has: {', '.join(sorted(allowed))}.")


def _check_tracks(config):
    rows, taps = config.get("map") or [], config.get("taps") or []
    if not rows or len({len(r) for r in rows}) != 1:
        raise ValidationError("A tracks puzzle needs a rectangular 'map'.")
    if [len(r) for r in taps] != [len(r) for r in rows]:
        raise ValidationError("'taps' must have one digit for every tile in 'map'.")
    if set("".join(rows)) - TRACK_TILES or set("".join(taps)) - set("0123"):
        raise ValidationError("'map' uses | - a b c d for track and . T H P F for scenery; 'taps' uses digits 0-3.")
    width = len(rows[0])
    for key in ("start", "goal"):
        if not isinstance(config.get(key), int) or not 0 <= config[key] < width:
            raise ValidationError(f"'{key}' must be a column number on the map.")
    _, reached = builders.trace_tracks(rows, config["start"], config["goal"])
    if not reached:
        raise ValidationError("The track pieces (as written, the right way round) don't join the station to the stall.")


def _check_slide(config):
    size, start = config.get("size"), config.get("start")
    if not isinstance(size, int) or not 2 <= size <= 5:
        raise ValidationError("'size' must be 2 to 5.")
    if not isinstance(start, list) or sorted(start) != [-1, *range(size * size - 1)]:
        raise ValidationError("'start' must list every tile once, with -1 for the gap.")
    if not builders.slide_solvable(start, size):
        raise ValidationError("This 'start' can never be solved: swap two tiles (not the gap) to fix it.")
    if not isinstance(config.get("par"), int) or config["par"] < 1:
        raise ValidationError("'par' must be the fewest moves that solve it (a whole number), for the stars.")


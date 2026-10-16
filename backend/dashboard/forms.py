import json

from django import forms
from django.core.exceptions import ValidationError

from content import builders
from content.models import LEVEL_CHOICES, Puzzle

from .art import FRIENDS, PICTURES, SNACKS

# How long the slide puzzle's shuffle is, by board size and difficulty.
SLIDE_MOVES = {
    2: {"easy": 4, "medium": 6, "hard": 8},
    3: {"easy": 12, "medium": 18, "hard": 26},
    4: {"easy": 16, "medium": 24, "hard": 32},
    5: {"easy": 20, "medium": 28, "hard": 36},
}
DIFFICULTY = [("easy", "Easy"), ("medium", "Medium"), ("hard", "Hard")]
UPLOAD = "upload"


def _ints(lo, hi):
    return [(n, str(n)) for n in range(lo, hi + 1)]


def next_free_order(level: int, exclude: int | None = None) -> int:
    used = set(Puzzle.objects.filter(level=level).exclude(pk=exclude).values_list("order", flat=True))
    n = 1
    while n in used:
        n += 1
    return n


def free_slug(level: int, order: int) -> str:
    slug, n = f"level-{level}-{order}", 2
    while Puzzle.objects.filter(slug=slug).exists():
        slug, n = f"level-{level}-{order}-{n}", n + 1
    return slug


class PuzzleForm(forms.Form):
    """Everything about one puzzle, with simple fields for each kind instead of raw JSON (raw JSON is still
    there for tracks, mazes and rangoli, filled in by the generator and the templates)."""

    kind = forms.ChoiceField(choices=Puzzle.Kind.choices, widget=forms.RadioSelect, initial=Puzzle.Kind.JIGSAW)
    title = forms.CharField(max_length=80, help_text="Shown on the map and on the finish screen.")
    level = forms.TypedChoiceField(choices=LEVEL_CHOICES, coerce=int, initial=1)
    order = forms.IntegerField(min_value=1, max_value=99, required=False, help_text="Leave blank to add it at the end of the level.")
    cheer = forms.CharField(max_length=40, required=False, help_text='Big headline when it\'s done, e.g. "You made Mithu!"')
    blurb = forms.CharField(max_length=120, required=False, help_text="One short line under the picture on the finish screen.")
    fact = forms.CharField(max_length=160, required=False, label="Pip's fact", help_text="One short, true fun fact for children, shown on the finish screen.")
    is_published = forms.BooleanField(required=False, initial=True, label="Published (phones get it next time the game opens)")

    # Jigsaw and slide: a picture from the app, or an uploaded one.
    picture = forms.ChoiceField(choices=[*PICTURES.items(), (UPLOAD, "Upload a new picture")], required=False, widget=forms.RadioSelect, initial="gappu")
    image = forms.ImageField(required=False, help_text="About 3:2 (wider than tall), at least 660 × 440. PNG or JPG.")
    # Fields for one kind only are optional: the other kinds don't use them.
    cols = forms.TypedChoiceField(choices=_ints(2, 6), coerce=int, empty_value=None, required=False, initial=3, label="Columns")
    rows = forms.TypedChoiceField(choices=_ints(2, 5), coerce=int, empty_value=None, required=False, initial=2, label="Rows")
    spin = forms.BooleanField(required=False, label="Spin: pieces start turned round (tap to turn)")

    size = forms.TypedChoiceField(choices=[(n, f"{n} × {n}") for n in range(2, 6)], coerce=int, empty_value=None, required=False, initial=3, label="Board")
    difficulty = forms.ChoiceField(choices=DIFFICULTY, required=False, initial="medium")
    slide_board = forms.CharField(required=False, widget=forms.HiddenInput)

    friends = forms.MultipleChoiceField(choices=FRIENDS.items(), required=False, widget=forms.CheckboxSelectMultiple, help_text="Pick 2 to 6.")
    shadow_cols = forms.TypedChoiceField(choices=_ints(2, 4), coerce=int, empty_value=None, required=False, initial=3, label="Shadows per row")

    snacks = forms.MultipleChoiceField(choices=SNACKS.items(), required=False, widget=forms.CheckboxSelectMultiple, help_text="Pick 2 to 8 (each one is a pair of cards).")
    memory_cols = forms.TypedChoiceField(choices=[("", "Automatic"), *_ints(2, 4)], coerce=int, empty_value=None, required=False, label="Cards per row")

    tracks_json = forms.CharField(required=False, widget=forms.Textarea(attrs={"rows": 9, "spellcheck": "false"}), label="Track map")
    maze_json = forms.CharField(required=False, widget=forms.Textarea(attrs={"rows": 16, "spellcheck": "false"}), label="Maze")
    rangoli_json = forms.CharField(required=False, widget=forms.Textarea(attrs={"rows": 14, "spellcheck": "false"}), label="Rangoli pattern")

    def __init__(self, *args, instance: Puzzle | None = None, **kwargs):
        self.instance = instance
        if instance is not None and "initial" not in kwargs:
            kwargs["initial"] = self.initial_from(instance)
        super().__init__(*args, **kwargs)

    @staticmethod
    def initial_from(p: Puzzle) -> dict:
        c = p.config or {}
        initial = {
            "kind": p.kind,
            "title": p.title,
            "level": p.level,
            "order": p.order,
            "cheer": p.cheer,
            "blurb": p.blurb,
            "fact": p.fact,
            "is_published": p.is_published,
            "picture": UPLOAD if p.image else (p.picture or "gappu"),
            "cols": p.cols or 3,
            "rows": p.rows or 2,
            "spin": bool(c.get("spin")),
        }
        if p.kind == Puzzle.Kind.SLIDE:
            initial.update(size=c.get("size", 3), slide_board=json.dumps({"start": c.get("start"), "par": c.get("par")}))
        elif p.kind == Puzzle.Kind.SHADOW:
            initial.update(friends=c.get("friends", []), shadow_cols=c.get("cols", 3))
        elif p.kind == Puzzle.Kind.MEMORY:
            initial.update(snacks=c.get("snacks", []), memory_cols=c.get("cols"))
        elif p.kind == Puzzle.Kind.TRACKS:
            initial["tracks_json"] = _pretty({k: c.get(k) for k in ("map", "taps", "start", "goal")})
        elif p.kind == Puzzle.Kind.MAZE:
            initial["maze_json"] = _pretty({k: v for k, v in (p.maze or {}).items() if k != "id"})
        elif p.kind == Puzzle.Kind.RANGOLI:
            initial["rangoli_json"] = _pretty(c)
        return initial

    # ------------------------------------------------------------------ turning the form into a puzzle

    def clean(self):
        data = super().clean()
        kind = data.get("kind")
        self.settings = {"picture": "", "cols": None, "rows": None, "maze": None, "config": {}}
        try:
            if kind in (Puzzle.Kind.JIGSAW, Puzzle.Kind.SLIDE):
                self._picture(data)
            if kind:
                getattr(self, f"_{kind}")(data)
        except ValidationError as e:
            self.add_error(None, e)
        return data

    def _picture(self, data):
        has_upload = bool(data.get("image")) or bool(self.instance and self.instance.image)
        if data.get("picture") == UPLOAD:
            if not has_upload:
                self.add_error("image", "Choose a picture file to upload.")
        elif not data.get("picture"):
            self.add_error("picture", "Pick a picture, or upload one.")
        else:
            self.settings["picture"] = data["picture"]

    def _jigsaw(self, data):
        self.settings.update(cols=data.get("cols") or 3, rows=data.get("rows") or 2)
        if data.get("spin"):
            self.settings["config"] = {"spin": True}

    def _slide(self, data):
        n = data.get("size") or 3
        board = _parse(data.get("slide_board"), "slide board") if data.get("slide_board") else {}
        start = board.get("start") if isinstance(board, dict) else None
        if not (isinstance(start, list) and len(start) == n * n and isinstance(board.get("par"), int)):
            board = builders.shuffle_slide(n, SLIDE_MOVES[n][data.get("difficulty") or "medium"])
        self.settings["config"] = {"size": n, "start": board["start"], "par": board["par"]}

    def _shadow(self, data):
        friends = data.get("friends") or []
        if not 2 <= len(friends) <= 6:
            self.add_error("friends", "Pick 2 to 6 friends.")
        self.settings["config"] = {"friends": friends, "cols": data.get("shadow_cols") or 3}

    def _memory(self, data):
        snacks = data.get("snacks") or []
        if not 2 <= len(snacks) <= 8:
            self.add_error("snacks", "Pick 2 to 8 snacks.")
        config = {"snacks": snacks}
        if data.get("memory_cols"):
            config["cols"] = data["memory_cols"]
        self.settings["config"] = config

    def _tracks(self, data):
        if not data.get("tracks_json"):
            self.add_error("tracks_json", "Press Generate to make a track map (or paste one).")
            return
        value = _parse(data["tracks_json"], "track map")
        if not isinstance(value, dict):
            raise ValidationError("The track map must be {\"map\": [...], \"taps\": [...], \"start\": 0, \"goal\": 0}.")
        self.settings["config"] = {k: value.get(k) for k in ("map", "taps", "start", "goal")}

    def _maze(self, data):
        if not data.get("maze_json"):
            self.add_error("maze_json", "Start from one of the templates, then change the map.")
            return
        value = _parse(data["maze_json"], "maze")
        if not isinstance(value, dict):
            raise ValidationError('The maze must be {"intro": ..., "goal": ..., "map": [...], "gates": {...}, "monkeys": [...]}.')
        value.setdefault("intro", "Help Gappu find the jalebis!")
        value.setdefault("gates", {})
        value.setdefault("monkeys", [])
        self.settings["maze"] = value

    def _rangoli(self, data):
        if not data.get("rangoli_json"):
            self.add_error("rangoli_json", "Start from one of the patterns, then change the colours or shapes.")
            return
        value = _parse(data["rangoli_json"], "rangoli pattern")
        if not isinstance(value, dict):
            raise ValidationError('The pattern must be {"style": ..., "rings": [...]}.')
        self.settings["config"] = {k: value[k] for k in ("style", "rings", "extra") if k in value}

    def save(self) -> Puzzle | None:
        """Write the puzzle to the database, or put the model's own checks on the form and return None."""
        data = self.cleaned_data
        p = self.instance or Puzzle()
        p.kind, p.title, p.level = data["kind"], data["title"], data["level"]
        p.cheer, p.blurb, p.is_published = data.get("cheer", ""), data.get("blurb", ""), data.get("is_published", False)
        p.fact = data.get("fact", "")
        p.order = data.get("order") or next_free_order(p.level, exclude=p.pk)
        for field, value in self.settings.items():
            setattr(p, field, value)
        uses_picture = p.kind in (Puzzle.Kind.JIGSAW, Puzzle.Kind.SLIDE)
        if uses_picture and data.get("picture") == UPLOAD and data.get("image"):
            p.image = data["image"]
        elif not uses_picture or data.get("picture") != UPLOAD:
            p.image = None  # a bundled picture was picked (or this kind has none): drop any old upload
        if not p.slug:
            p.slug = free_slug(p.level, p.order)  # never changed later: phones keep stars by slug
        try:
            p.full_clean()
        except ValidationError as e:
            for field, messages in e.message_dict.items():
                target = field if field in self.fields else None
                for m in messages:
                    self.add_error(target, m)
            return None
        p.save()
        return p


def _parse(text: str, what: str):
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise ValidationError(f"The {what} isn't valid JSON (line {e.lineno}, column {e.colno}): {e.msg}.") from e


def _pretty(value) -> str:
    """Indented JSON: one map row per line, so maps are easy to read and edit."""
    return json.dumps(value, indent=2)

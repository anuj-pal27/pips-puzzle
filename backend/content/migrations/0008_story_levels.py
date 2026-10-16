"""The story (STORY.md) on servers that already have puzzles: add the game's new puzzles, and give the 15
older ones their new titles and settings in the story, unless they were changed in the dashboard (their
title is no longer the one the game gave them). Everything comes from seed.json, the same list
`python manage.py seed_puzzles` loads. A new, empty server gets its puzzles from seed_puzzles as before.
"""

import json
from pathlib import Path

from django.db import migrations

SEED = Path(__file__).resolve().parents[1] / "seed.json"
FIELDS = ("level", "order", "kind", "title", "cheer", "blurb", "fact", "picture", "cols", "rows", "maze", "config")
BLANK = {"picture": "", "cols": None, "rows": None, "maze": None, "config": {}, "fact": ""}

# The titles the 15 older puzzles had before the story (after 0006).
ORIGINAL_TITLES = {
    "easy-1": "Gappu the Goat",
    "easy-2": "Who's That Shadow?",
    "easy-3": "Snack Snap",
    "easy-4": "Chunnu the Monkey",
    "easy-5": "Jalebi Hunt",
    "medium-1": "Gappu's Diwali Shop",
    "medium-2": "Diwali Express",
    "medium-3": "Lamplight Shadows",
    "medium-4": "Mithai Snap",
    "medium-5": "Lantern Walk",
    "hard-1": "All Aboard at Jalebi Junction",
    "hard-2": "Tillu's Slide Puzzle",
    "hard-3": "Fix the Tracks",
    "hard-4": "Snack Snap",
    "hard-5": "Jalebi Hunt",
}


def make_room(Puzzle, level, order, slug):
    """If another puzzle sits in this slot, move it to the end of its level."""
    other = Puzzle.objects.filter(level=level, order=order).exclude(slug=slug).first()
    if other:
        used = set(Puzzle.objects.filter(level=level).values_list("order", flat=True))
        free = max(used | {6}) + 1
        other.order = free
        other.save(update_fields=["order"])


def add_story(apps, schema_editor):
    Puzzle = apps.get_model("content", "Puzzle")
    if not SEED.exists() or not Puzzle.objects.exists():
        return
    for item in json.loads(SEED.read_text(encoding="utf-8")):
        values = {f: item.get(f, BLANK.get(f)) for f in FIELDS}
        p = Puzzle.objects.filter(slug=item["slug"]).first()
        if p is None:
            make_room(Puzzle, values["level"], values["order"], item["slug"])
            Puzzle.objects.create(slug=item["slug"], is_published=True, **values)
        elif p.title == ORIGINAL_TITLES.get(p.slug) and not p.image:
            make_room(Puzzle, values["level"], values["order"], p.slug)
            for field, value in values.items():
                setattr(p, field, value)
            p.save()


class Migration(migrations.Migration):
    dependencies = [("content", "0007_tiers_become_levels")]

    operations = [migrations.RunPython(add_story, migrations.RunPython.noop)]

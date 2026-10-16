"""Diwali Night: turn the five Medium puzzles into the Diwali chapter on servers that already have them.

Each puzzle is only changed if its title is still the original one, so puzzles edited in the dashboard are
left alone. New servers get the same content from seed.json.
"""

from django.db import migrations

# slug -> (original title, new text)
CHANGES = {
    "medium-1": ("Gappu's Jalebi Shop", {"title": "Gappu's Diwali Shop", "cheer": "Happy Diwali!", "blurb": "Diyas, lights and a marigold garland!", "fact": "Diwali is the festival of lights. Families light little clay lamps called diyas."}),
    "medium-2": ("Fix the Tracks", {"title": "Diwali Express", "cheer": "Choo choo!", "blurb": "The lamps lit up all the way to the stall.", "fact": "At Diwali, homes and streets twinkle with lights."}),
    "medium-3": ("Who's That Shadow?", {"title": "Lamplight Shadows", "cheer": "Super spotting!", "blurb": "Everyone found their shadow in the lamplight.", "fact": "A lamp makes shadows. The closer you stand to it, the bigger your shadow!"}),
    "medium-4": ("Snack Snap", {"title": "Mithai Snap", "cheer": "Mithai time!", "blurb": "Four pairs of Diwali sweets. Gappu says yum!", "fact": "Kaju katli is a Diwali sweet made from cashew nuts."}),
    "medium-5": ("Jalebi Hunt", {"title": "Lantern Walk", "cheer": "Yum!", "blurb": "Gappu lit the way to the jalebis!", "fact": "A kandil is a paper lantern that many families hang outside their homes at Diwali."}),
}
OLD_MAZE_INTRO = "Two gates this time! Find the yellow lever first."
NEW_MAZE_INTRO = "It's dark! Two gates this time. Find the yellow lever first."
OLD_SNACKS = ["jalebi", "laddoo", "samosa", "chai"]
NEW_SNACKS = ["laddoo", "jalebi", "kajukatli", "gulabjamun"]


def to_diwali(apps, schema_editor):
    Puzzle = apps.get_model("content", "Puzzle")
    for slug, (old_title, text) in CHANGES.items():
        p = Puzzle.objects.filter(slug=slug, title=old_title).first()
        if p is None:
            continue
        for field, value in text.items():
            setattr(p, field, value)
        if slug == "medium-1" and p.picture == "shop" and not p.image:
            p.picture = "diwali-shop"
        if slug == "medium-4" and (p.config or {}).get("snacks") == OLD_SNACKS:
            p.config = {**p.config, "snacks": NEW_SNACKS}
        if slug == "medium-5" and isinstance(p.maze, dict) and p.maze.get("intro") == OLD_MAZE_INTRO:
            p.maze = {**p.maze, "intro": NEW_MAZE_INTRO}
        p.save()


class Migration(migrations.Migration):
    dependencies = [("content", "0005_builtin_puzzle_facts")]

    operations = [migrations.RunPython(to_diwali, migrations.RunPython.noop)]

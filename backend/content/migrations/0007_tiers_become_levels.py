"""Easy, Medium and Hard become the 10 levels of the story (STORY.md).

The 15 puzzles from before keep their slugs (phones keep stars by slug) and move to their place in the
story. Puzzles made in the dashboard go to the end of a level: Easy ones to level 1, Medium ones (Diwali
Night) to level 10, Hard ones to level 9. Orders 1 to 6 of every level are left for the game's own puzzles,
which migration 0008 adds.
"""

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models

# slug -> (level, order) in the story
PLACES = {
    "easy-1": (1, 1),
    "easy-2": (1, 2),
    "easy-3": (1, 3),
    "easy-4": (1, 4),
    "easy-5": (1, 5),
    "hard-1": (1, 6),
    "hard-4": (5, 4),
    "hard-2": (6, 4),
    "hard-3": (8, 5),
    "hard-5": (9, 4),
    "medium-1": (10, 1),
    "medium-2": (10, 2),
    "medium-3": (10, 3),
    "medium-4": (10, 4),
    "medium-5": (10, 5),
}
TIER_LEVEL = {"easy": 1, "medium": 10, "hard": 9}
FIRST_FREE = 7


def to_levels(apps, schema_editor):
    Puzzle = apps.get_model("content", "Puzzle")
    taken = set(PLACES.values())
    for p in Puzzle.objects.order_by("tier", "order", "pk"):
        if p.slug in PLACES:
            p.level, p.order = PLACES[p.slug]
        else:
            level, order = TIER_LEVEL.get(p.tier, 1), FIRST_FREE
            while (level, order) in taken:
                order += 1
            taken.add((level, order))
            p.level, p.order = level, order
        p.save(update_fields=["level", "order"])


def to_tiers(apps, schema_editor):
    """Going back: the older puzzles get their old tier and place again; the rest go after them."""
    Puzzle = apps.get_model("content", "Puzzle")
    taken = set()
    rest = []
    for p in Puzzle.objects.order_by("level", "order", "pk"):
        tier, _, n = p.slug.partition("-")
        if p.slug in PLACES and n.isdigit():
            p.tier, p.order = tier, int(n)
            taken.add((p.tier, p.order))
            p.save(update_fields=["tier", "order"])
        else:
            rest.append(p)
    for p in rest:
        p.tier = "easy" if p.level == 1 else "medium" if p.level == 10 else "hard"
        order = 6
        while (p.tier, order) in taken:
            order += 1
        taken.add((p.tier, order))
        p.order = order
        p.save(update_fields=["tier", "order"])


class Migration(migrations.Migration):
    dependencies = [("content", "0006_medium_becomes_diwali_night")]

    operations = [
        migrations.RemoveConstraint(model_name="puzzle", name="one_puzzle_per_tier_slot"),
        migrations.AddField(model_name="puzzle", name="level", field=models.PositiveSmallIntegerField(null=True)),
        migrations.RunPython(to_levels, to_tiers),
        migrations.AlterField(
            model_name="puzzle",
            name="level",
            field=models.PositiveSmallIntegerField(
                choices=[
                    (1, "Level 1: Jalebi Junction"),
                    (2, "Level 2: Punjab"),
                    (3, "Level 3: Rajasthan"),
                    (4, "Level 4: Gujarat"),
                    (5, "Level 5: Mumbai"),
                    (6, "Level 6: Kerala"),
                    (7, "Level 7: Tamil Nadu"),
                    (8, "Level 8: Kolkata"),
                    (9, "Level 9: The Hills"),
                    (10, "Level 10: Home for Diwali"),
                ],
                help_text="Which stop on the journey (STORY.md). A level opens once 4 puzzles of the level before have a star.",
                validators=[MinValueValidator(1), MaxValueValidator(10)],
            ),
        ),
        migrations.RemoveField(model_name="puzzle", name="tier"),
        migrations.AlterField(
            model_name="puzzle",
            name="order",
            field=models.PositiveSmallIntegerField(
                help_text="Position inside the level: 1 is played first. Add 7, 8, ... to give a level more puzzles.",
                validators=[MinValueValidator(1), MaxValueValidator(99)],
            ),
        ),
        migrations.AddConstraint(model_name="puzzle", constraint=models.UniqueConstraint(fields=("level", "order"), name="one_puzzle_per_level_slot")),
        migrations.AlterField(
            model_name='puzzle',
            name='cols',
            field=models.PositiveSmallIntegerField(blank=True, help_text='Jigsaw columns (3 in level 1, up to 6 in level 10).', null=True),
        ),
        migrations.AlterField(
            model_name='puzzle',
            name='config',
            field=models.JSONField(blank=True, default=dict, help_text='Settings for the other kinds, in the same format as the app\'s src/data/puzzles.ts: shadow {"friends": [...], "cols": 3}; memory {"snacks": [...], "cols": 4}; tracks {"map": [...], "taps": [...], "start": 0, "goal": 5}; slide {"size": 3, "start": [...], "par": 10}; rangoli {"style": "kolam", "rings": [{"shape": "disc", "count": 1, "colors": ["yellow"]}, ...]}; jigsaw {"spin": true} to start pieces turned round.'),
        ),
        migrations.AlterField(
            model_name='puzzle',
            name='kind',
            field=models.CharField(choices=[('jigsaw', 'Jigsaw'), ('maze', 'Maze hunt'), ('shadow', "Who's That Shadow?"), ('memory', 'Snack Snap (memory)'), ('tracks', 'Fix the Tracks'), ('slide', 'Slide puzzle'), ('rangoli', 'Rangoli')], max_length=10),
        ),
        migrations.AlterField(
            model_name='puzzle',
            name='maze',
            field=models.JSONField(blank=True, help_text='Maze map, gates and monkeys, in the same format as the app\'s src/data/mazes.ts. Optional "goal": a snack or gift id instead of jalebis.', null=True),
        ),
        migrations.AlterField(
            model_name='puzzle',
            name='picture',
            field=models.CharField(blank=True, help_text='Id of a picture bundled in the app (see content/ids.py: gappu, bholu, kites, big-picture...). Jigsaws and slide puzzles.', max_length=40),
        ),
        migrations.AlterField(
            model_name='puzzle',
            name='rows',
            field=models.PositiveSmallIntegerField(blank=True, help_text='Jigsaw rows (2 in level 1, up to 4 in level 10).', null=True),
        ),
    ]

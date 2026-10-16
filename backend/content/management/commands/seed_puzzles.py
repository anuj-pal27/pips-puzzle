import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from content.models import Puzzle

SEED_FILE = Path(__file__).resolve().parents[2] / "seed.json"
BLANK = {"picture": "", "cols": None, "rows": None, "maze": None, "config": {}}


class Command(BaseCommand):
    help = (
        "Load (or refresh) the puzzles the app ships with: the 10 levels of the story (seed.json, made by the "
        "app's `npm run seed`). Safe to run again; puzzles you added yourself are left alone (moved to the end "
        "of their level if one of the game's puzzles needs their place)."
    )

    def handle(self, *args, **options):
        items = json.loads(SEED_FILE.read_text(encoding="utf-8"))
        created = updated = 0
        with transaction.atomic():
            for item in items:
                # Start from blanks so a slot that changed kind (say jigsaw -> shadow) loses its old settings.
                fields = {**BLANK, **{k: v for k, v in item.items() if k != "slug"}}
                puzzle = Puzzle(slug=item["slug"], **fields)
                puzzle.clean()  # same checks the admin runs
                _make_room(fields["level"], fields["order"], item["slug"])
                _, was_created = Puzzle.objects.update_or_create(slug=item["slug"], defaults=fields)
                created += was_created
                updated += not was_created
        self.stdout.write(self.style.SUCCESS(f"Puzzles ready: {created} added, {updated} updated."))


def _make_room(level: int, order: int, slug: str) -> None:
    """If another puzzle sits in this slot, move it to the end of the level (after the game's own puzzles)."""
    other = Puzzle.objects.filter(level=level, order=order).exclude(slug=slug).first()
    if other:
        used = set(Puzzle.objects.filter(level=level).values_list("order", flat=True))
        other.order = max(used | {6}) + 1
        other.save(update_fields=["order"])

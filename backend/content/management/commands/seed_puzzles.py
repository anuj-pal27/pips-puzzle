import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from content.models import Puzzle

SEED_FILE = Path(__file__).resolve().parents[2] / "seed.json"
BLANK = {"picture": "", "cols": None, "rows": None, "maze": None, "config": {}}


class Command(BaseCommand):
    help = "Load (or refresh) the 15 puzzles the app ships with: Easy, Medium and Hard, 5 each. Safe to run again; puzzles you added yourself are left alone."

    def handle(self, *args, **options):
        items = json.loads(SEED_FILE.read_text(encoding="utf-8"))
        created = updated = 0
        with transaction.atomic():
            for item in items:
                # Start from blanks so a slot that changed kind (say jigsaw -> shadow) loses its old settings.
                fields = {**BLANK, **{k: v for k, v in item.items() if k != "slug"}}
                puzzle = Puzzle(slug=item["slug"], **fields)
                puzzle.clean()  # same checks the admin runs
                _, was_created = Puzzle.objects.update_or_create(slug=item["slug"], defaults=fields)
                created += was_created
                updated += not was_created
        self.stdout.write(self.style.SUCCESS(f"Puzzles ready: {created} added, {updated} updated."))

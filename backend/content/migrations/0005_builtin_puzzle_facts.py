"""Give the 15 built-in puzzles their Pip's fact on servers that already have them (only where none is set yet,
so facts written in the dashboard are never replaced). New servers get them from seed.json."""

from django.db import migrations

FACTS = {
    "easy-1": "Goats are great climbers. Some even climb trees!",
    "easy-2": "Your shadow is shortest at lunchtime, when the sun is high in the sky.",
    "easy-3": "A samosa has three corners, just like a triangle!",
    "easy-4": "Monkeys use their long tails to help them balance in the trees.",
    "easy-5": "Cows sleep for only about four hours a day.",
    "medium-1": "Jalebis are made by swirling batter into hot oil, then dipping them in sugar syrup.",
    "medium-2": "India has one of the biggest railway networks in the whole world.",
    "medium-3": "A shadow appears when something blocks the light.",
    "medium-4": "Chai is tea cooked with milk and spices like ginger and cardamom.",
    "medium-5": "Laddoos are made by rolling a sweet mixture into little balls.",
    "hard-1": "Old steam trains ran on coal and water, and puffed out big clouds of steam.",
    "hard-2": "Some tortoises live for more than 100 years!",
    "hard-3": "The first train in India ran more than 170 years ago, in 1853.",
    "hard-4": "The mango is the national fruit of India.",
    "hard-5": "Monkeys eat fruit, leaves, seeds and even insects.",
}


def add_facts(apps, schema_editor):
    Puzzle = apps.get_model("content", "Puzzle")
    for slug, fact in FACTS.items():
        Puzzle.objects.filter(slug=slug, fact="").update(fact=fact)


class Migration(migrations.Migration):
    dependencies = [("content", "0004_puzzle_fact")]

    operations = [migrations.RunPython(add_facts, migrations.RunPython.noop)]

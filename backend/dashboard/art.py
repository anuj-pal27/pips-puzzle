"""The game's own pictures, by id, as the dashboard shows them (served from app/assets/images/game)."""

from django.templatetags.static import static

PICTURES = {
    "gappu": "Gappu the Goat",
    "mithu": "Mithu the Parrot",
    "tillu": "Tillu the Tortoise",
    "chunnu": "Chunnu the Monkey",
    "shop": "Gappu's Jalebi Shop",
    "diwali-shop": "Gappu's Diwali Shop",
    "station": "All Aboard at Jalebi Junction",
}
FRIENDS = {"gappu": "Gappu", "mithu": "Mithu", "tillu": "Tillu", "chunnu": "Chunnu", "gauri": "Gauri", "pip": "Pip"}
SNACKS = {
    "jalebi": "Jalebi",
    "laddoo": "Laddoo",
    "samosa": "Samosa",
    "chai": "Chai",
    "kulfi": "Kulfi",
    "mango": "Mango",
    "kajukatli": "Kaju katli",
    "gulabjamun": "Gulab jamun",
    "barfi": "Barfi",
}

# Map thumbnails for the kinds that don't show a picture, by tier (the app's src/data/art.ts THUMBS).
_THUMBS = {
    "maze": "maze-thumb",
    "maze-medium": "maze-night-thumb",
    "slide": "slide-thumb",
    "shadow-easy": "shadow-easy-thumb",
    "shadow-medium": "shadow-night-thumb",
    "memory-easy": "snap-easy-thumb",
    "memory-medium": "snap-night-thumb",
    "memory-hard": "snap-hard-thumb",
    "tracks-medium": "tracks-night-thumb",
    "tracks-hard": "tracks-hard-thumb",
}


def game_art(name: str) -> str:
    return static(f"game/{name}.png")


def picture_url(picture_id: str) -> str:
    return game_art(picture_id)


def friend_url(friend: str) -> str:
    return game_art(f"{friend}-cut")


def snack_url(snack: str) -> str:
    return game_art(snack)


def thumb_url(puzzle) -> str:
    """The picture a puzzle has on the game's map (same choice as the app's map screen)."""
    if puzzle.kind == "jigsaw":
        return puzzle.image.url if puzzle.image else picture_url(puzzle.picture)
    name = _THUMBS.get(f"{puzzle.kind}-{puzzle.tier}") or _THUMBS.get(puzzle.kind)
    if not name:
        name = next(v for k, v in _THUMBS.items() if k.startswith(f"{puzzle.kind}-"))
    return game_art(name)

"""The game's own pictures, as the dashboard shows them (served from app/assets/images/game)."""

from django.templatetags.static import static

from content.ids import FRIENDS, GIFTS, LEVELS, PICTURES, SNACKS  # noqa: F401  (the dashboard lists these)

# Pictures for the kinds whose map tile isn't a picture of their own. The app draws these tiles from the
# puzzle itself (src/components/PuzzleThumb.tsx); the dashboard shows a close picture.
_THUMBS = {
    "tracks": "tracks-hard-thumb",
    "tracks-10": "tracks-night-thumb",
    "maze": "maze-thumb",
    "maze-10": "maze-night-thumb",
    "rangoli": "rangoli-thumb",
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
    """A picture for the puzzle, close to its tile on the game's map."""
    c = puzzle.config or {}
    if puzzle.kind in ("jigsaw", "slide"):
        return puzzle.image.url if puzzle.image else picture_url(puzzle.picture)
    if puzzle.kind == "shadow" and c.get("friends"):
        return friend_url(c["friends"][0])
    if puzzle.kind == "memory" and c.get("snacks"):
        return snack_url(c["snacks"][0])
    if puzzle.kind == "maze" and (puzzle.maze or {}).get("goal") in {**SNACKS, **GIFTS}:
        return game_art(puzzle.maze["goal"])
    return game_art(_THUMBS.get(f"{puzzle.kind}-{puzzle.level}") or _THUMBS.get(puzzle.kind, "maze-thumb"))

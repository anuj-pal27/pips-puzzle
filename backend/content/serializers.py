from rest_framework import serializers

from .models import Puzzle


class PuzzleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Puzzle
        fields = [
            "slug",
            "level",
            "order",
            "kind",
            "title",
            "cheer",
            "blurb",
            "fact",
            "picture",
            "image",
            "image_width",
            "image_height",
            "cols",
            "rows",
            "maze",
            "config",
            "updated_at",
        ]

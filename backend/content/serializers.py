from rest_framework import serializers

from .models import Puzzle


class PuzzleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Puzzle
        fields = ["slug", "tier", "order", "kind", "title", "picture", "image", "cols", "rows", "maze"]

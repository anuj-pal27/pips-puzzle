from rest_framework import serializers

from accounts.models import ChildProfile
from content.models import Puzzle

from .models import Progress


class ProgressSerializer(serializers.ModelSerializer):
    puzzle = serializers.SlugRelatedField(slug_field="slug", read_only=True)

    class Meta:
        model = Progress
        fields = ["puzzle", "stars", "updated_at"]


class SyncItemSerializer(serializers.Serializer):
    puzzle = serializers.SlugRelatedField(slug_field="slug", queryset=Puzzle.objects.all())
    stars = serializers.IntegerField(min_value=1, max_value=3)


class SyncSerializer(serializers.Serializer):
    child = serializers.PrimaryKeyRelatedField(queryset=ChildProfile.objects.none())
    items = SyncItemSerializer(many=True, max_length=200)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            # A parent can only sync their own children.
            self.fields["child"].queryset = request.user.children.all()

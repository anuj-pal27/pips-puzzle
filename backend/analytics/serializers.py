from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from .models import PlayEvent

MAX_EVENTS = 100
OLDEST = timedelta(days=90)  # a phone that was offline for months: drop what's too old to matter


class EventSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    type = serializers.ChoiceField(choices=PlayEvent.Type.choices)
    puzzle = serializers.SlugField(max_length=50)
    stars = serializers.IntegerField(min_value=1, max_value=3, required=False, allow_null=True)
    seconds = serializers.IntegerField(min_value=0, max_value=24 * 3600, required=False, allow_null=True)
    at = serializers.DateTimeField()


class EventBatchSerializer(serializers.Serializer):
    device = serializers.RegexField(r"^[A-Za-z0-9-]{8,64}$")
    platform = serializers.CharField(max_length=10, required=False, allow_blank=True, default="")
    app_version = serializers.CharField(max_length=20, required=False, allow_blank=True, default="")
    events = EventSerializer(many=True, max_length=MAX_EVENTS)

    def to_events(self, puzzles_by_slug: dict) -> list[PlayEvent]:
        data = self.validated_data
        now = timezone.now()
        out = []
        for e in data["events"]:
            # Phone clocks can be wrong: never in the future, and old ones are dropped.
            at = min(e["at"], now)
            if now - at > OLDEST:
                continue
            out.append(
                PlayEvent(
                    event_id=e["id"],
                    device=data["device"],
                    puzzle=puzzles_by_slug.get(e["puzzle"]),
                    puzzle_slug=e["puzzle"],
                    type=e["type"],
                    stars=e.get("stars") if e["type"] == PlayEvent.Type.FINISH else None,
                    seconds=e.get("seconds") if e["type"] != PlayEvent.Type.START else None,
                    platform=data["platform"],
                    app_version=data["app_version"],
                    played_at=at,
                )
            )
        return out

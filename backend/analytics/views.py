from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from content.models import Puzzle

from .models import PlayEvent
from .serializers import EventBatchSerializer


class EventIngestView(APIView):
    """POST {device, platform, app_version, events: [{id, type, puzzle, stars?, seconds?, at}]} -> {"saved": n}.

    Public (the game has no sign-in). Events already received (same id) are ignored, so the app can
    safely send a batch again after a timeout.
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "events"

    def post(self, request):
        batch = EventBatchSerializer(data=request.data)
        batch.is_valid(raise_exception=True)
        slugs = {e["puzzle"] for e in batch.validated_data["events"]}
        puzzles = {p.slug: p for p in Puzzle.objects.filter(slug__in=slugs)}
        events = batch.to_events(puzzles)
        seen = set(PlayEvent.objects.filter(event_id__in=[e.event_id for e in events]).values_list("event_id", flat=True))
        new = [e for e in events if e.event_id not in seen]
        PlayEvent.objects.bulk_create(new, ignore_conflicts=True)
        return Response({"saved": len(new)}, status=status.HTTP_201_CREATED)

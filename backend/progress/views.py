from django.db import transaction
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Progress
from .serializers import ProgressSerializer, SyncSerializer


class ProgressListView(generics.ListAPIView):
    """GET /api/progress/?child=<id> -> that child's best stars per puzzle."""

    serializer_class = ProgressSerializer
    pagination_class = None

    def get_queryset(self):
        child = self.request.query_params.get("child")
        if not child or not child.isdigit():
            raise ValidationError({"child": "Pass ?child=<id> of one of your children."})
        return Progress.objects.filter(child_id=int(child), child__parent=self.request.user).select_related("puzzle")


class ProgressSyncView(APIView):
    """POST {child, items: [{puzzle, stars}]} -> merges with the server, keeping the best stars per puzzle.

    Returns the child's full merged progress as {"child": id, "stars": {"easy-1": 3, ...}},
    so the phone can update itself in one round trip.
    """

    def post(self, request):
        serializer = SyncSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        child = serializer.validated_data["child"]

        best: dict = {}
        for item in serializer.validated_data["items"]:
            puzzle = item["puzzle"]
            best[puzzle] = max(best.get(puzzle, 0), item["stars"])

        with transaction.atomic():
            for puzzle, stars in best.items():
                row, created = Progress.objects.select_for_update().get_or_create(
                    child=child, puzzle=puzzle, defaults={"stars": stars}
                )
                if not created and stars > row.stars:
                    row.stars = stars
                    row.save(update_fields=["stars", "updated_at"])

        merged = {p.puzzle.slug: p.stars for p in child.progress.select_related("puzzle")}
        return Response({"child": child.id, "stars": merged})

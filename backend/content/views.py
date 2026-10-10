from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Puzzle
from .serializers import PuzzleSerializer


class HealthView(APIView):
    """GET -> {"status": "ok"}. The app's grown-ups screen uses this to show whether the server is reachable."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"status": "ok"})


class PuzzleListView(generics.ListAPIView):
    """All published puzzles, Easy -> Medium -> Hard. Public: no sign-in needed."""

    permission_classes = [permissions.AllowAny]
    serializer_class = PuzzleSerializer
    pagination_class = None

    def get_queryset(self):
        return Puzzle.objects.published().in_play_order()

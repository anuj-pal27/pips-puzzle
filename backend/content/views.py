from datetime import date

from django.conf import settings
from django.views.generic import TemplateView
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


class PrivacyView(TemplateView):
    """The public privacy policy page (the app's grown-ups settings and the store listings link here)."""

    template_name = "content/privacy.html"
    extra_context = {"updated": date(2026, 10, 15), "owner": settings.PRIVACY_OWNER, "email": settings.PRIVACY_EMAIL}

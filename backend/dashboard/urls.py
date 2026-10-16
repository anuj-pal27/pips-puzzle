from django.urls import path

from . import views

app_name = "dashboard"

urlpatterns = [
    path("", views.overview, name="overview"),
    path("puzzles/", views.puzzles, name="puzzles"),
    path("puzzles/new/", views.puzzle_new, name="new"),
    path("puzzles/<slug:slug>/", views.puzzle_detail, name="puzzle"),
    path("puzzles/<slug:slug>/edit/", views.puzzle_edit, name="edit"),
    path("puzzles/<slug:slug>/<str:action>/", views.puzzle_action, name="action"),
    path("tools/tracks/", views.tool_tracks, name="tool-tracks"),
    path("tools/slide/", views.tool_slide, name="tool-slide"),
    path("tools/check/", views.tool_check, name="tool-check"),
    path("events.csv", views.export_events, name="export"),
]

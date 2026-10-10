from django.contrib import admin

from .models import Puzzle


@admin.register(Puzzle)
class PuzzleAdmin(admin.ModelAdmin):
    list_display = ["slug", "tier", "order", "kind", "title", "is_published", "updated_at"]
    list_filter = ["tier", "kind", "is_published"]
    list_editable = ["is_published"]
    search_fields = ["slug", "title", "picture"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = [
        (None, {"fields": ["slug", "title", "tier", "order", "kind", "is_published"]}),
        ("Picture", {"fields": ["picture", "image", "cols", "rows"], "description": "Jigsaws (and the picture for slide puzzles)."}),
        ("Maze", {"fields": ["maze"], "description": "Only for Jalebi Hunt mazes."}),
        ("Settings", {"fields": ["config"], "description": "Shadow, Snack Snap, tracks and slide puzzles; spin for jigsaws."}),
        ("History", {"fields": ["created_at", "updated_at"], "classes": ["collapse"]}),
    ]

    def get_queryset(self, request):
        return super().get_queryset(request).in_play_order()

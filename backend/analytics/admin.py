from django.contrib import admin

from .models import PlayEvent


@admin.register(PlayEvent)
class PlayEventAdmin(admin.ModelAdmin):
    """Raw play events, read-only (they come from phones). The dashboard shows them as numbers and charts."""

    list_display = ["played_at", "type", "puzzle_slug", "stars", "seconds", "device_short", "platform", "app_version"]
    list_filter = ["type", "platform", "puzzle_slug"]
    search_fields = ["device", "puzzle_slug"]
    date_hierarchy = "played_at"

    @admin.display(description="device")
    def device_short(self, obj):
        return obj.device[:8]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

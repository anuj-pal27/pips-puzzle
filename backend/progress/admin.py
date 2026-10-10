from django.contrib import admin

from .models import Progress


@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    list_display = ["child", "puzzle", "stars", "updated_at"]
    list_filter = ["puzzle__tier", "stars"]
    search_fields = ["child__nickname", "child__parent__email", "puzzle__slug"]
    list_select_related = ["child", "puzzle"]

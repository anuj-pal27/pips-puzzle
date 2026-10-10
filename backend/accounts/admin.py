from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import ChildProfile, User


class ChildInline(admin.TabularInline):
    model = ChildProfile
    extra = 0
    fields = ["nickname", "avatar", "created_at"]
    readonly_fields = ["created_at"]


@admin.register(User)
class ParentAdmin(UserAdmin):
    inlines = [ChildInline]
    list_display = ["email", "date_joined", "is_staff"]
    search_fields = ["email", "username"]
    ordering = ["-date_joined"]


@admin.register(ChildProfile)
class ChildProfileAdmin(admin.ModelAdmin):
    list_display = ["nickname", "parent", "avatar", "created_at"]
    search_fields = ["nickname", "parent__email"]

from django.contrib import admin
from .models import OfficerPost


@admin.register(OfficerPost)
class OfficerPostAdmin(admin.ModelAdmin):
    list_display = ("id", "post_header", "status", "author_name", "created_at", "updated_at")
    list_filter = ("status", "effective_status", "created_at")
    search_fields = ("post_header", "post_content", "author_name", "author_email")
    ordering = ("-created_at",)

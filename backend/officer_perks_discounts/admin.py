from django.contrib import admin
from .models import OfficerPerksDiscount


@admin.register(OfficerPerksDiscount)
class OfficerPerksDiscountAdmin(admin.ModelAdmin):
    list_display = ("id", "post_header", "company_name", "category", "status", "start_date", "end_date", "created_at")
    list_filter = ("status", "effective_status", "category", "created_at")
    search_fields = ("post_header", "post_content", "company_name", "location", "author_name", "author_email")
    ordering = ("-created_at",)

from django.contrib import admin
from .models import OfficerCalendarEvent


@admin.register(OfficerCalendarEvent)
class OfficerCalendarEventAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "event_date", "end_date", "category", "status", "created_at")
    list_filter = ("status", "category", "event_date", "created_at")
    search_fields = ("title", "description", "location", "contact_name", "contact_email")
    ordering = ("-created_at",)

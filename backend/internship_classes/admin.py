from django.contrib import admin
from .models import InternshipClass


@admin.register(InternshipClass)
class InternshipClassAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "subject",
        "section",
        "faculty_email",
        "school_program_code",
        "program_code",
        "status",
        "created_at",
    )
    search_fields = (
        "subject",
        "section",
        "faculty_email",
        "school_program_code",
        "school_program_full_name",
        "program_code",
        "program_full_name",
    )
    list_filter = ("status", "school_program_code", "program_code")

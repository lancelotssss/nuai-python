from django.contrib import admin
from .models import PreRegisteredIntern


@admin.register(PreRegisteredIntern)
class PreRegisteredInternAdmin(admin.ModelAdmin):
    list_display = [
        "student_id",
        "full_name",
        "nu_email",
        "course",
        "status",
        "claimed",
        "created_at",
    ]
    search_fields = ["student_id", "full_name", "nu_email", "course"]
    list_filter = ["status", "claimed", "course", "school_program_code"]

from django.db import models


class OfficerCalendarEvent(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    event_date = models.CharField(max_length=20, blank=True, db_index=True)
    end_date = models.CharField(max_length=20, blank=True)
    all_day = models.BooleanField(default=True)
    start_time = models.CharField(max_length=20, blank=True)
    end_time = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=255, blank=True)
    category = models.CharField(max_length=120, blank=True, db_index=True)
    custom_category = models.CharField(max_length=160, blank=True)
    audience = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=40, default="active", db_index=True)
    cover_image_url = models.TextField(blank=True)
    contact_name = models.CharField(max_length=255, blank=True)
    contact_email = models.EmailField(max_length=254, blank=True)
    tags = models.JSONField(default=list, blank=True)
    posted_on = models.CharField(max_length=120, blank=True)

    created_by_uid = models.CharField(max_length=160, blank=True)
    created_by_name = models.CharField(max_length=255, blank=True)
    created_by_email = models.EmailField(max_length=254, blank=True)
    updated_by_uid = models.CharField(max_length=160, blank=True)
    updated_by_name = models.CharField(max_length=255, blank=True)
    updated_by_email = models.EmailField(max_length=254, blank=True)

    extra_data = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "officer_calendar_events"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title or f"Event #{self.pk}"

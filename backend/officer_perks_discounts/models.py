from django.db import models


class OfficerPerksDiscount(models.Model):
    company_name = models.CharField(max_length=255)
    post_header = models.CharField(max_length=255)
    category = models.CharField(max_length=120, blank=True, db_index=True)
    custom_category = models.CharField(max_length=160, blank=True)
    post_content = models.TextField(blank=True)

    photo_urls = models.JSONField(default=list, blank=True)
    links = models.JSONField(default=list, blank=True)
    requirements = models.JSONField(default=list, blank=True)

    start_date = models.CharField(max_length=20, blank=True)
    end_date = models.CharField(max_length=20, blank=True)
    all_day = models.BooleanField(default=True)
    start_time = models.CharField(max_length=20, blank=True)
    end_time = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=255, blank=True)
    posted_on = models.CharField(max_length=120, blank=True)

    status = models.CharField(max_length=40, default="active", db_index=True)
    effective_status = models.CharField(max_length=40, default="active", db_index=True)
    closed_reason = models.CharField(max_length=120, blank=True, null=True)
    closed_by_system = models.BooleanField(default=False)
    closed_at = models.DateTimeField(blank=True, null=True)
    reopened_at = models.DateTimeField(blank=True, null=True)

    author_uid = models.CharField(max_length=160, blank=True)
    author_email = models.EmailField(max_length=254, blank=True)
    author_name = models.CharField(max_length=255, blank=True)
    author_role = models.CharField(max_length=80, blank=True)

    extra_data = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "officer_perks_discounts"
        ordering = ["-created_at"]

    def __str__(self):
        return self.post_header or self.company_name or f"Perk #{self.pk}"

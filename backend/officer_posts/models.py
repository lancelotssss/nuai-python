from django.db import models


class OfficerPost(models.Model):
    post_header = models.CharField(max_length=255)
    post_content = models.TextField(blank=True)
    links = models.JSONField(default=list, blank=True)
    photo_urls = models.JSONField(default=list, blank=True)

    status = models.CharField(max_length=40, default="open", db_index=True)
    effective_status = models.CharField(max_length=40, default="open", db_index=True)

    author_uid = models.CharField(max_length=160, blank=True)
    author_email = models.EmailField(max_length=254, blank=True)
    author_name = models.CharField(max_length=255, blank=True)
    author_role = models.CharField(max_length=80, blank=True)
    author_photo_url = models.TextField(blank=True)

    # Keeps small forward-compatible fields only; main post data is stored above.
    extra_data = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "officer_posts"
        ordering = ["-created_at"]

    def __str__(self):
        return self.post_header or f"Post #{self.pk}"

from django.db import models


class Partner(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("deactivated", "Deactivated"),
    ]

    ROLE_CHOICES = [
        ("partner", "Partner"),
    ]

    company_name = models.CharField(max_length=200, unique=True)
    company_address = models.TextField(blank=True, null=True)

    representative_name = models.CharField(max_length=150, blank=True, null=True)
    representative_position = models.CharField(max_length=150, blank=True, null=True)

    contact_number = models.CharField(max_length=30, blank=True, null=True)
    email = models.EmailField(max_length=150, blank=True, null=True)

    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="partner")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "partner_table"
        ordering = ["-created_at"]

    def __str__(self):
        return self.company_name

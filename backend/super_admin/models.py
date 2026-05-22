from django.db import models
from accounts.models import Account


class SuperAdmin(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("deactivated", "Deactivated"),
    ]

    ROLE_CHOICES = [
        ("super-admin", "Super Admin"),
    ]

    account = models.OneToOneField(
        Account,
        on_delete=models.CASCADE,
        related_name="super_admin_profile",
        blank=True,
        null=True,
    )

    email = models.EmailField(max_length=150, unique=True)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="super-admin")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "super_admin_table"
        ordering = ["-created_at"]

    def __str__(self):
        return self.email
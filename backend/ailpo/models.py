from django.db import models


class AILPO(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("deactivated", "Deactivated"),
    ]

    ROLE_CHOICES = [
        ("ailpo", "AILPO"),
    ]

    employee_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100)

    department = models.CharField(max_length=150, blank=True, null=True)
    position = models.CharField(max_length=150, blank=True, null=True)

    contact_number = models.CharField(max_length=30, blank=True, null=True)
    email = models.EmailField(max_length=150, blank=True, null=True)

    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="ailpo")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ailpo_table"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.employee_id} - {self.first_name} {self.last_name}"

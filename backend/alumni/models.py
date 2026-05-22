from django.db import models


class Alumni(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("deactivated", "Deactivated"),
    ]

    ROLE_CHOICES = [
        ("alumni", "Alumni"),
    ]

    student_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100)

    course = models.CharField(max_length=150, blank=True, null=True)
    graduation_year = models.CharField(max_length=20, blank=True, null=True)

    contact_number = models.CharField(max_length=30, blank=True, null=True)
    email = models.EmailField(max_length=150, blank=True, null=True)

    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="alumni")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "alumni_table"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student_id} - {self.first_name} {self.last_name}"

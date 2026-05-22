from django.db import models
from accounts.models import Account


class Faculty(models.Model):
    account = models.OneToOneField(
        Account,
        on_delete=models.CASCADE,
        related_name="faculty_profile",
        blank=True,
        null=True,
    )

    employee_id = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
    )

    first_name = models.CharField(max_length=100, blank=True, null=True)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)

    email = models.EmailField(
        unique=True,
        blank=True,
        null=True,
    )

    department = models.CharField(max_length=255, blank=True, null=True)
    position = models.CharField(max_length=255, blank=True, null=True)

    # Internship Adviser academic assignment
    school_program = models.CharField(max_length=255, blank=True, null=True)
    school_program_code = models.CharField(max_length=50, blank=True, null=True)
    program = models.CharField(max_length=255, blank=True, null=True)
    program_code = models.CharField(max_length=50, blank=True, null=True)

    role = models.CharField(max_length=50, default="faculty")
    status = models.CharField(max_length=30, default="active")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "faculty_table"
        ordering = ["-created_at"]

    def __str__(self):
        first_name = self.first_name or ""
        last_name = self.last_name or ""
        full_name = f"{first_name} {last_name}".strip()

        return full_name or self.email or "Faculty"
from django.db import models


class PreRegisteredAlumni(models.Model):
    STATUS_CHOICES = [
        ("pre-registered", "Pre-Registered"),
        ("claimed", "Claimed"),
        ("deactivated", "Deactivated"),
    ]

    ROLE_CHOICES = [
        ("alumni", "Alumni"),
    ]

    student_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100)

    nu_email = models.EmailField(max_length=150, unique=True)
    personal_email = models.EmailField(max_length=150, blank=True, null=True)

    course_graduated = models.CharField(max_length=150)
    course_graduated_full_name = models.CharField(max_length=255, blank=True, null=True)
    school_program = models.CharField(max_length=150, blank=True, null=True)
    school_program_full_name = models.CharField(max_length=255, blank=True, null=True)

    graduation_period = models.CharField(max_length=100)
    year_graduated = models.CharField(max_length=100, blank=True, null=True)
    academic_award = models.CharField(max_length=150, blank=True, null=True)
    loyalty = models.CharField(max_length=150, blank=True, null=True)

    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="alumni")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="pre-registered")
    claimed = models.BooleanField(default=False)
    claimed_at = models.DateTimeField(blank=True, null=True)
    claimed_by_email = models.EmailField(max_length=150, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pre_registered_alumni_table"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student_id} - {self.first_name} {self.last_name}"

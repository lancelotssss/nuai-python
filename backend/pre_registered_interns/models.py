from django.db import models


class PreRegisteredIntern(models.Model):
    STATUS_CHOICES = [
        ("pre-registered", "Pre-Registered"),
        ("transitioning", "Transitioning"),
        ("claimed", "Claimed"),
        ("deactivated", "Deactivated"),
    ]

    ROLE_CHOICES = [
        ("intern", "Intern"),
    ]

    student_id = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=255)
    gender = models.CharField(max_length=50, blank=True, null=True)

    nu_email = models.EmailField(max_length=150, unique=True)

    course = models.CharField(max_length=150, blank=True, null=True)
    course_full_name = models.CharField(max_length=255, blank=True, null=True)
    school_program_code = models.CharField(max_length=100, blank=True, null=True)
    school_program_full_name = models.CharField(max_length=255, blank=True, null=True)

    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="intern")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="pre-registered")
    claimed = models.BooleanField(default=False)
    claimed_at = models.DateTimeField(blank=True, null=True)
    claimed_by_email = models.EmailField(max_length=150, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pre_registered_interns_table"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student_id} - {self.full_name}"

from django.db import models


class TransitioningAlumni(models.Model):
    STATUS_CHOICES = [
        ("transitioning", "Transitioning"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("deactivated", "Deactivated"),
    ]

    TRANSITION_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
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

    role = models.CharField(max_length=30, default="alumni")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="transitioning")
    transition_status = models.CharField(
        max_length=30,
        choices=TRANSITION_STATUS_CHOICES,
        default="pending",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "transitioning_alumni_table"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student_id} - {self.first_name} {self.last_name}"

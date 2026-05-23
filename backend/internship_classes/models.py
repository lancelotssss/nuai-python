from django.db import models

try:
    from faculty.models import Faculty
except Exception:  # pragma: no cover
    Faculty = None


class InternshipClass(models.Model):
    faculty = models.ForeignKey(
        "faculty.Faculty",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="internship_classes",
    )

    faculty_email = models.EmailField(blank=True, null=True)

    subject = models.CharField(max_length=100)
    section = models.CharField(max_length=50)

    school_program_code = models.CharField(max_length=50)
    school_program_full_name = models.CharField(max_length=180)
    program_code = models.CharField(max_length=120)
    program_full_name = models.CharField(max_length=180)

    status = models.CharField(max_length=30, default="Active")
    students = models.JSONField(default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "internship_classes_table"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.subject} - {self.section}"

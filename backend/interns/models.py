from django.db import models


class Intern(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("transitioning", "Transitioning"),
        ("transitioned", "Transitioned"),
        ("deactivated", "Deactivated"),
    ]

    ROLE_CHOICES = [
        ("intern", "Intern"),
    ]

    student_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100)

    course = models.CharField(max_length=150, blank=True, null=True)
    year_level = models.CharField(max_length=50, blank=True, null=True)

    contact_number = models.CharField(max_length=30, blank=True, null=True)
    personal_email = models.EmailField(max_length=150, blank=True, null=True)
    email = models.EmailField(max_length=150, blank=True, null=True)

    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="intern")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "interns_table"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student_id} - {self.first_name} {self.last_name}"

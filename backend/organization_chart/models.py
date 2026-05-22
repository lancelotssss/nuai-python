from django.db import models
from academic_records.models import SchoolProgram


class OrganizationChartMember(models.Model):
    MEMBER_TYPE_CHOICES = [
        ("dean", "Dean"),
        ("executive_director", "Executive Director"),
        ("academic_director", "Academic Director"),
        ("ailpo_coordinator", "AILPO Coordinator"),
        ("other", "Other"),
    ]

    school_program = models.ForeignKey(
        SchoolProgram,
        on_delete=models.CASCADE,
        related_name="organization_chart_members",
        blank=True,
        null=True,
    )

    member_type = models.CharField(
        max_length=50,
        choices=MEMBER_TYPE_CHOICES,
        default="other",
    )

    full_name = models.CharField(max_length=255)
    primary_position = models.CharField(max_length=255)
    secondary_position = models.CharField(max_length=255, blank=True, null=True)
    tertiary_position = models.CharField(max_length=255, blank=True, null=True)

    display_order = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=30, default="active")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organization_chart_table"
        ordering = ["display_order", "member_type", "full_name"]

    def __str__(self):
        return f"{self.full_name} - {self.primary_position}"
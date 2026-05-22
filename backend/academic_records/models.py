from django.db import models


class YearGraduated(models.Model):
    value = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "year_graduated_table"
        ordering = ["-value"]

    def __str__(self):
        return self.value


class AcademicAward(models.Model):
    value = models.CharField(max_length=150, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "academic_award_table"
        ordering = ["value"]

    def __str__(self):
        return self.value


class SchoolProgram(models.Model):
    full_name = models.CharField(max_length=255)
    code = models.CharField(max_length=30, blank=True, null=True)
    display_order = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=30, default="active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "school_program_table"
        ordering = ["display_order", "full_name"]

    def __str__(self):
        if self.code:
            return f"{self.full_name} ({self.code})"
        return self.full_name


class AcademicProgram(models.Model):
    school_program = models.ForeignKey(
        SchoolProgram,
        on_delete=models.CASCADE,
        related_name="academic_programs",
    )
    full_name = models.CharField(max_length=255)
    code = models.CharField(max_length=30, blank=True, null=True)
    display_order = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=30, default="active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "academic_program_table"
        ordering = ["display_order", "full_name"]

    def __str__(self):
        if self.code:
            return f"{self.full_name} ({self.code})"
        return self.full_name
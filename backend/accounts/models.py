from django.db import models
from django.contrib.auth.hashers import make_password, check_password


class Account(models.Model):
    ROLE_CHOICES = [
        ("alumni", "Alumni"),
        ("intern", "Intern"),
        ("faculty", "Faculty"),
        ("alumni-officer", "Alumni Officer"),
        ("ailpo", "AILPO"),
        ("partner", "Partner"),
        ("registrar", "Registrar"),
        ("super-admin", "Super Admin"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("deactivated", "Deactivated"),
    ]

    email = models.EmailField(max_length=150, unique=True)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    class Meta:
        db_table = "accounts_table"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.email} - {self.role}"
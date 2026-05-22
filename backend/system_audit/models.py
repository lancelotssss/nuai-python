from django.db import models


class SystemAudit(models.Model):
    ACTION_CHOICES = [
        ("LOGIN_SUCCESS", "Login Success"),
        ("LOGOUT", "Logout"),

        ("CREATE", "Create"),
        ("UPDATE", "Update"),
        ("DELETE", "Delete"),
        ("VIEW", "View"),
        ("EXPORT", "Export"),
        ("IMPORT", "Import"),
        ("SYSTEM", "System"),

        ("CREATE_STAFF", "Create Staff"),
        ("UPDATE_STAFF", "Update Staff"),
        ("DELETE_STAFF", "Delete Staff"),
        ("ACTIVATE_STAFF", "Activate Staff"),
        ("DEACTIVATE_STAFF", "Deactivate Staff"),

        ("CREATE_ACADEMIC_RECORD", "Create Academic Record"),
        ("UPDATE_ACADEMIC_RECORD", "Update Academic Record"),
        ("DELETE_ACADEMIC_RECORD", "Delete Academic Record"),
        ("CREATE_ACADEMIC_PROGRAM", "Create Academic Program"),
        ("UPDATE_ACADEMIC_PROGRAM", "Update Academic Program"),
        ("DELETE_ACADEMIC_PROGRAM", "Delete Academic Program"),

        ("CREATE_ORGANIZATION_CHART", "Create Organization Chart"),
        ("UPDATE_ORGANIZATION_CHART", "Update Organization Chart"),
        ("DELETE_ORGANIZATION_CHART", "Delete Organization Chart"),

        ("UPDATE_ADMIN_PASSWORD", "Update Admin Password"),
    ]

    actor_email = models.EmailField(max_length=150, blank=True, null=True)
    actor_role = models.CharField(max_length=50, blank=True, null=True)

    action = models.CharField(max_length=80, choices=ACTION_CHOICES)
    details = models.TextField(blank=True, null=True)
    scope = models.CharField(max_length=100, blank=True, null=True)

    target_table = models.CharField(max_length=100, blank=True, null=True)
    target_id = models.CharField(max_length=100, blank=True, null=True)

    ip_address = models.CharField(max_length=100, blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)

    metadata = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "system_audit_table"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.action} - {self.actor_email or 'Unknown'}"

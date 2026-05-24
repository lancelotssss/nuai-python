from rest_framework import viewsets

from .models import PreRegisteredAlumni
from .serializers import PreRegisteredAlumniSerializer

try:
    from system_audit.utils import create_system_audit
except Exception:  # pragma: no cover
    create_system_audit = None


def build_alumni_name(instance):
    return " ".join(
        str(value or "").strip()
        for value in [
            getattr(instance, "first_name", ""),
            getattr(instance, "middle_name", ""),
            getattr(instance, "last_name", ""),
        ]
        if str(value or "").strip()
    )


class PreRegisteredAlumniViewSet(viewsets.ModelViewSet):
    queryset = PreRegisteredAlumni.objects.all()
    serializer_class = PreRegisteredAlumniSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        name = build_alumni_name(instance) or getattr(instance, "nu_email", "") or "Pre-Registered Alumni"

        if create_system_audit:
            create_system_audit(
                request=self.request,
                action="BULK_UPLOAD_PREREGISTERED_ALUMNI",
                details=f"Created pre-registered alumni record: {name}.",
                scope="alumni_management",
                target_table="pre_registered_alumni_table",
                target_id=instance.id,
                metadata={
                    "student_id": getattr(instance, "student_id", ""),
                    "nu_email": getattr(instance, "nu_email", ""),
                    "name": name,
                },
            )

    def perform_update(self, serializer):
        instance = serializer.save()
        name = build_alumni_name(instance) or getattr(instance, "nu_email", "") or "Pre-Registered Alumni"

        if create_system_audit:
            create_system_audit(
                request=self.request,
                action="UPDATE_PREREGISTERED_ALUMNI",
                details=f"Updated pre-registered alumni record: {name}.",
                scope="alumni_management",
                target_table="pre_registered_alumni_table",
                target_id=instance.id,
                metadata={
                    "student_id": getattr(instance, "student_id", ""),
                    "nu_email": getattr(instance, "nu_email", ""),
                    "name": name,
                    "status": getattr(instance, "status", ""),
                },
            )

    def perform_destroy(self, instance):
        target_id = instance.id
        name = build_alumni_name(instance) or getattr(instance, "nu_email", "") or "Pre-Registered Alumni"
        metadata = {
            "student_id": getattr(instance, "student_id", ""),
            "nu_email": getattr(instance, "nu_email", ""),
            "name": name,
        }

        instance.delete()

        if create_system_audit:
            create_system_audit(
                request=self.request,
                action="DELETE_PREREGISTERED_ALUMNI",
                details=f"Deleted pre-registered alumni record: {name}.",
                scope="alumni_management",
                target_table="pre_registered_alumni_table",
                target_id=target_id,
                metadata=metadata,
            )

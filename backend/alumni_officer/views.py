from rest_framework import viewsets

from .models import AlumniOfficer
from .serializers import AlumniOfficerSerializer
from system_audit.utils import create_system_audit


def build_staff_name(instance):
    return " ".join(
        str(value or "").strip()
        for value in [
            getattr(instance, "first_name", ""),
            getattr(instance, "middle_name", ""),
            getattr(instance, "last_name", ""),
        ]
        if str(value or "").strip()
    )


class AlumniOfficerViewSet(viewsets.ModelViewSet):
    queryset = AlumniOfficer.objects.all()
    serializer_class = AlumniOfficerSerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        name = build_staff_name(instance) or getattr(instance, "email", "") or "Alumni Affairs Officer"

        create_system_audit(
            request=self.request,
            action="CREATE_STAFF",
            details=f"Created Alumni Affairs Officer profile: {name}.",
            scope="staff_management",
            target_table="alumni_officer_table",
            target_id=instance.id,
            metadata={
                "role": getattr(instance, "role", ""),
                "email": getattr(instance, "email", ""),
                "employee_id": getattr(instance, "employee_id", ""),
                "name": name,
            },
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        name = build_staff_name(instance) or getattr(instance, "email", "") or "Alumni Affairs Officer"

        create_system_audit(
            request=self.request,
            action="UPDATE_STAFF",
            details=f"Updated Alumni Affairs Officer profile: {name}.",
            scope="staff_management",
            target_table="alumni_officer_table",
            target_id=instance.id,
            metadata={
                "role": getattr(instance, "role", ""),
                "email": getattr(instance, "email", ""),
                "employee_id": getattr(instance, "employee_id", ""),
                "name": name,
                "status": getattr(instance, "status", ""),
            },
        )

    def perform_destroy(self, instance):
        target_id = instance.id
        name = build_staff_name(instance) or getattr(instance, "email", "") or "Alumni Affairs Officer"
        metadata = {
            "role": getattr(instance, "role", ""),
            "email": getattr(instance, "email", ""),
            "employee_id": getattr(instance, "employee_id", ""),
            "name": name,
        }

        instance.delete()

        create_system_audit(
            request=self.request,
            action="DELETE_STAFF",
            details=f"Deleted Alumni Affairs Officer profile: {name}.",
            scope="staff_management",
            target_table="alumni_officer_table",
            target_id=target_id,
            metadata=metadata,
        )

from rest_framework import viewsets

from .models import Faculty
from .serializers import FacultySerializer
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


class FacultyViewSet(viewsets.ModelViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer

    def perform_create(self, serializer):
        instance = serializer.save()
        name = build_staff_name(instance) or getattr(instance, "email", "") or "Internship Adviser"

        create_system_audit(
            request=self.request,
            action="CREATE_STAFF",
            details=f"Created Internship Adviser profile: {name}.",
            scope="staff_management",
            target_table="faculty_table",
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
        name = build_staff_name(instance) or getattr(instance, "email", "") or "Internship Adviser"

        create_system_audit(
            request=self.request,
            action="UPDATE_STAFF",
            details=f"Updated Internship Adviser profile: {name}.",
            scope="staff_management",
            target_table="faculty_table",
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
        name = build_staff_name(instance) or getattr(instance, "email", "") or "Internship Adviser"
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
            details=f"Deleted Internship Adviser profile: {name}.",
            scope="staff_management",
            target_table="faculty_table",
            target_id=target_id,
            metadata=metadata,
        )

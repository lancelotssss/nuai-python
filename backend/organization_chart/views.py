from rest_framework import viewsets

from .models import OrganizationChartMember
from .serializers import OrganizationChartMemberSerializer
from system_audit.utils import create_system_audit


def member_label(instance):
    full_name = getattr(instance, "full_name", "") or ""
    primary_position = getattr(instance, "primary_position", "") or ""

    if full_name and primary_position:
        return f"{full_name} - {primary_position}"

    return full_name or primary_position or str(instance)


class OrganizationChartMemberViewSet(viewsets.ModelViewSet):
    queryset = OrganizationChartMember.objects.select_related("school_program").all()
    serializer_class = OrganizationChartMemberSerializer

    def get_queryset(self):
        queryset = OrganizationChartMember.objects.select_related("school_program").all()

        school_program = self.request.query_params.get("school_program")
        school_program_id = self.request.query_params.get("school_program_id")
        member_type = self.request.query_params.get("member_type")
        status = self.request.query_params.get("status")

        if school_program:
            queryset = queryset.filter(school_program_id=school_program)

        if school_program_id:
            queryset = queryset.filter(school_program_id=school_program_id)

        if member_type:
            queryset = queryset.filter(member_type=member_type)

        if status:
            queryset = queryset.filter(status=status)

        return queryset.order_by("display_order", "member_type", "full_name")

    def perform_create(self, serializer):
        instance = serializer.save()
        label = member_label(instance)

        create_system_audit(
            request=self.request,
            action="CREATE_ORGANIZATION_CHART",
            details=f"Created organization chart member: {label}.",
            scope="organization_chart",
            target_table="organization_chart_table",
            target_id=instance.id,
            metadata={
                "label": label,
                "member_type": instance.member_type,
                "school_program_id": instance.school_program_id,
                "full_name": instance.full_name,
                "primary_position": instance.primary_position,
            },
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        label = member_label(instance)

        create_system_audit(
            request=self.request,
            action="UPDATE_ORGANIZATION_CHART",
            details=f"Updated organization chart member: {label}.",
            scope="organization_chart",
            target_table="organization_chart_table",
            target_id=instance.id,
            metadata={
                "label": label,
                "member_type": instance.member_type,
                "school_program_id": instance.school_program_id,
                "full_name": instance.full_name,
                "primary_position": instance.primary_position,
            },
        )

    def perform_destroy(self, instance):
        target_id = instance.id
        label = member_label(instance)
        metadata = {
            "label": label,
            "member_type": instance.member_type,
            "school_program_id": instance.school_program_id,
            "full_name": instance.full_name,
            "primary_position": instance.primary_position,
        }

        instance.delete()

        create_system_audit(
            request=self.request,
            action="DELETE_ORGANIZATION_CHART",
            details=f"Deleted organization chart member: {label}.",
            scope="organization_chart",
            target_table="organization_chart_table",
            target_id=target_id,
            metadata=metadata,
        )

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action

from .models import (
    YearGraduated,
    AcademicAward,
    SchoolProgram,
    AcademicProgram,
)
from .serializers import (
    YearGraduatedSerializer,
    AcademicAwardSerializer,
    SchoolProgramSerializer,
    AcademicProgramSerializer,
)
from system_audit.utils import create_system_audit


def value_label(instance):
    return getattr(instance, "value", "") or str(instance)


def program_label(instance):
    full_name = getattr(instance, "full_name", "") or ""
    code = getattr(instance, "code", "") or ""

    if full_name and code:
        return f"{full_name} ({code})"

    return full_name or code or str(instance)


class AuditModelViewSet(viewsets.ModelViewSet):
    audit_scope = "academic_records"
    audit_table = "academic_records"
    audit_record_type = "academic_record"

    def get_audit_label(self, instance):
        return str(instance)

    def perform_create(self, serializer):
        instance = serializer.save()
        label = self.get_audit_label(instance)

        create_system_audit(
            request=self.request,
            action="CREATE_ACADEMIC_RECORD",
            details=f"Created {self.audit_record_type}: {label}.",
            scope=self.audit_scope,
            target_table=self.audit_table,
            target_id=instance.id,
            metadata={
                "record_type": self.audit_record_type,
                "label": label,
            },
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        label = self.get_audit_label(instance)

        create_system_audit(
            request=self.request,
            action="UPDATE_ACADEMIC_RECORD",
            details=f"Updated {self.audit_record_type}: {label}.",
            scope=self.audit_scope,
            target_table=self.audit_table,
            target_id=instance.id,
            metadata={
                "record_type": self.audit_record_type,
                "label": label,
            },
        )

    def perform_destroy(self, instance):
        target_id = instance.id
        label = self.get_audit_label(instance)
        metadata = {
            "record_type": self.audit_record_type,
            "label": label,
        }

        instance.delete()

        create_system_audit(
            request=self.request,
            action="DELETE_ACADEMIC_RECORD",
            details=f"Deleted {self.audit_record_type}: {label}.",
            scope=self.audit_scope,
            target_table=self.audit_table,
            target_id=target_id,
            metadata=metadata,
        )


class YearGraduatedViewSet(AuditModelViewSet):
    queryset = YearGraduated.objects.all()
    serializer_class = YearGraduatedSerializer
    audit_table = "year_graduated_table"
    audit_record_type = "year graduated"

    def get_audit_label(self, instance):
        return value_label(instance)


class AcademicAwardViewSet(AuditModelViewSet):
    queryset = AcademicAward.objects.all()
    serializer_class = AcademicAwardSerializer
    audit_table = "academic_award_table"
    audit_record_type = "academic award"

    def get_audit_label(self, instance):
        return value_label(instance)


class SchoolProgramViewSet(AuditModelViewSet):
    queryset = SchoolProgram.objects.prefetch_related("academic_programs").all()
    serializer_class = SchoolProgramSerializer
    audit_table = "school_program_table"
    audit_record_type = "school program"

    def get_audit_label(self, instance):
        return program_label(instance)

    @action(detail=True, methods=["get"], url_path="academic-programs")
    def academic_programs(self, request, pk=None):
        school_program = self.get_object()
        programs = school_program.academic_programs.all()
        serializer = AcademicProgramSerializer(programs, many=True)
        return Response(serializer.data)


class AcademicProgramViewSet(AuditModelViewSet):
    queryset = AcademicProgram.objects.select_related("school_program").all()
    serializer_class = AcademicProgramSerializer
    audit_table = "academic_program_table"
    audit_record_type = "academic program"

    def get_audit_label(self, instance):
        return program_label(instance)

    def get_queryset(self):
        queryset = AcademicProgram.objects.select_related("school_program").all()

        school_program = self.request.query_params.get("school_program")
        school_program_id = self.request.query_params.get("school_program_id")

        if school_program:
            queryset = queryset.filter(school_program_id=school_program)

        if school_program_id:
            queryset = queryset.filter(school_program_id=school_program_id)

        return queryset

    def perform_create(self, serializer):
        instance = serializer.save()
        label = self.get_audit_label(instance)

        create_system_audit(
            request=self.request,
            action="CREATE_ACADEMIC_PROGRAM",
            details=f"Created academic program: {label}.",
            scope=self.audit_scope,
            target_table=self.audit_table,
            target_id=instance.id,
            metadata={
                "record_type": self.audit_record_type,
                "label": label,
                "school_program_id": instance.school_program_id,
            },
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        label = self.get_audit_label(instance)

        create_system_audit(
            request=self.request,
            action="UPDATE_ACADEMIC_PROGRAM",
            details=f"Updated academic program: {label}.",
            scope=self.audit_scope,
            target_table=self.audit_table,
            target_id=instance.id,
            metadata={
                "record_type": self.audit_record_type,
                "label": label,
                "school_program_id": instance.school_program_id,
            },
        )

    def perform_destroy(self, instance):
        target_id = instance.id
        label = self.get_audit_label(instance)
        school_program_id = instance.school_program_id

        instance.delete()

        create_system_audit(
            request=self.request,
            action="DELETE_ACADEMIC_PROGRAM",
            details=f"Deleted academic program: {label}.",
            scope=self.audit_scope,
            target_table=self.audit_table,
            target_id=target_id,
            metadata={
                "record_type": self.audit_record_type,
                "label": label,
                "school_program_id": school_program_id,
            },
        )

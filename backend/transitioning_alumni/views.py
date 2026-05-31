from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.response import Response

from interns.models import Intern
from pre_registered_interns.models import PreRegisteredIntern

from .models import TransitioningAlumni
from .serializers import TransitioningAlumniSerializer

try:
    from system_audit.utils import create_system_audit
except Exception:  # pragma: no cover
    create_system_audit = None


ALLOWED_REGISTERED_INTERN_STATUSES = {"active", "registered"}
ALLOWED_PRE_REGISTERED_INTERN_STATUSES = {"pre-registered", "preregistered"}


def clean_text(value):
    return str(value or "").strip()


def normalize_email(value):
    return clean_text(value).lower()


def normalize_status(value):
    return clean_text(value).lower().replace("_", "-")


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


def split_full_name(full_name):
    parts = [part for part in clean_text(full_name).split() if part]

    if not parts:
        return "Intern", "", "User"

    if len(parts) == 1:
        return parts[0], "", "Intern"

    if len(parts) == 2:
        return parts[0], "", parts[1]

    return parts[0], " ".join(parts[1:-1]), parts[-1]


def get_first_value(data, *keys):
    for key in keys:
        value = data.get(key)
        if clean_text(value):
            return clean_text(value)
    return ""


def find_registered_intern(data):
    source_id = get_first_value(data, "source_id", "sourceId")
    student_id = get_first_value(data, "student_id", "studentId")
    nu_email = normalize_email(get_first_value(data, "nu_email", "nuEmail", "email"))

    queryset = Intern.objects.all()

    if source_id:
        try:
            return queryset.get(id=source_id)
        except (Intern.DoesNotExist, ValueError, TypeError):
            return None

    if student_id:
        found = queryset.filter(student_id=student_id).first()
        if found:
            return found

    if nu_email:
        found = queryset.filter(email__iexact=nu_email).first()
        if found:
            return found

    return None


def find_pre_registered_intern(data):
    source_id = get_first_value(data, "source_id", "sourceId")
    student_id = get_first_value(data, "student_id", "studentId")
    nu_email = normalize_email(get_first_value(data, "nu_email", "nuEmail", "email"))

    queryset = PreRegisteredIntern.objects.all()

    if source_id:
        try:
            return queryset.get(id=source_id)
        except (PreRegisteredIntern.DoesNotExist, ValueError, TypeError):
            return None

    if student_id:
        found = queryset.filter(student_id=student_id).first()
        if found:
            return found

    if nu_email:
        found = queryset.filter(nu_email__iexact=nu_email).first()
        if found:
            return found

    return None


def find_transition_source(data):
    raw_source_type = normalize_status(get_first_value(data, "source_type", "sourceType"))

    if raw_source_type in {"registered-intern", "registeredintern", "intern", "registered"}:
        intern = find_registered_intern(data)
        return "registered_intern", intern

    if raw_source_type in {
        "pre-registered-intern",
        "preregistered-intern",
        "pre-registeredintern",
        "preregisteredintern",
        "pre-registered",
        "unregistered",
    }:
        pre_registered = find_pre_registered_intern(data)
        return "pre_registered_intern", pre_registered

    intern = find_registered_intern(data)
    if intern:
        return "registered_intern", intern

    pre_registered = find_pre_registered_intern(data)
    if pre_registered:
        return "pre_registered_intern", pre_registered

    return "", None


def build_transition_data_from_registered_intern(intern, data):
    return {
        "student_id": intern.student_id,
        "first_name": clean_text(intern.first_name),
        "middle_name": clean_text(intern.middle_name),
        "last_name": clean_text(intern.last_name),
        "nu_email": normalize_email(intern.email),
        "personal_email": get_first_value(data, "personal_email", "personalEmail"),
        "course_graduated": clean_text(intern.course) or get_first_value(data, "course_graduated", "courseGraduated", "course"),
        "course_graduated_full_name": get_first_value(data, "course_graduated_full_name", "courseGraduatedFullName", "course_full_name", "courseFullName"),
        "school_program": get_first_value(data, "school_program", "schoolProgram", "school_program_code", "schoolProgramCode"),
        "school_program_full_name": get_first_value(data, "school_program_full_name", "schoolProgramFullName"),
        "graduation_period": get_first_value(data, "graduation_period", "graduationPeriod", "year_graduated", "yearGraduated") or "For Transition",
        "year_graduated": get_first_value(data, "year_graduated", "yearGraduated", "graduation_period", "graduationPeriod"),
        "academic_award": get_first_value(data, "academic_award", "academicAward"),
        "loyalty": get_first_value(data, "loyalty"),
        "role": "alumni",
        "status": "transitioning",
        "transition_status": "pending",
    }


def build_transition_data_from_pre_registered_intern(record, data):
    first_name, middle_name, last_name = split_full_name(record.full_name)

    return {
        "student_id": record.student_id,
        "first_name": first_name,
        "middle_name": middle_name,
        "last_name": last_name,
        "nu_email": normalize_email(record.nu_email),
        "personal_email": get_first_value(data, "personal_email", "personalEmail"),
        "course_graduated": clean_text(record.course) or get_first_value(data, "course_graduated", "courseGraduated", "course"),
        "course_graduated_full_name": clean_text(record.course_full_name) or get_first_value(data, "course_graduated_full_name", "courseGraduatedFullName", "course_full_name", "courseFullName"),
        "school_program": clean_text(record.school_program_code) or get_first_value(data, "school_program", "schoolProgram", "school_program_code", "schoolProgramCode"),
        "school_program_full_name": clean_text(record.school_program_full_name) or get_first_value(data, "school_program_full_name", "schoolProgramFullName"),
        "graduation_period": get_first_value(data, "graduation_period", "graduationPeriod", "year_graduated", "yearGraduated") or "For Transition",
        "year_graduated": get_first_value(data, "year_graduated", "yearGraduated", "graduation_period", "graduationPeriod"),
        "academic_award": get_first_value(data, "academic_award", "academicAward"),
        "loyalty": get_first_value(data, "loyalty"),
        "role": "alumni",
        "status": "transitioning",
        "transition_status": "pending",
    }


class TransitioningAlumniViewSet(viewsets.ModelViewSet):
    queryset = TransitioningAlumni.objects.all()
    serializer_class = TransitioningAlumniSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        source_kind, source_record = find_transition_source(data)

        if not source_record:
            return Response(
                {
                    "detail": "Transition failed. The uploaded Student ID or NU Email was not found in registered or pre-registered interns.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        source_status = normalize_status(getattr(source_record, "status", ""))

        if source_kind == "registered_intern":
            if source_status == "transitioning":
                return Response(
                    {"detail": "This registered intern is already marked as transitioning."},
                    status=status.HTTP_409_CONFLICT,
                )

            if source_status not in ALLOWED_REGISTERED_INTERN_STATUSES:
                return Response(
                    {"detail": "Only active registered interns are allowed to transition."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            transition_data = build_transition_data_from_registered_intern(source_record, data)

        else:
            if source_status == "transitioning":
                return Response(
                    {"detail": "This pre-registered intern is already marked as transitioning."},
                    status=status.HTTP_409_CONFLICT,
                )

            if source_status not in ALLOWED_PRE_REGISTERED_INTERN_STATUSES or getattr(source_record, "claimed", False):
                return Response(
                    {"detail": "Only unclaimed pre-registered interns are allowed to transition."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            transition_data = build_transition_data_from_pre_registered_intern(source_record, data)

        if TransitioningAlumni.objects.filter(student_id=transition_data["student_id"]).exists():
            return Response(
                {"detail": "This Student ID is already in the transitioning alumni list."},
                status=status.HTTP_409_CONFLICT,
            )

        if TransitioningAlumni.objects.filter(nu_email__iexact=transition_data["nu_email"]).exists():
            return Response(
                {"detail": "This NU Email is already in the transitioning alumni list."},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = self.get_serializer(data=transition_data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            instance = serializer.save()
            source_record.status = "transitioning"
            source_record.save(update_fields=["status", "updated_at"])

        name = build_alumni_name(instance) or getattr(instance, "nu_email", "") or "Transitioning Alumni"

        if create_system_audit:
            create_system_audit(
                request=self.request,
                action="BULK_UPLOAD_TRANSITIONING_ALUMNI",
                details=f"Created transitioning alumni record from {source_kind}: {name}.",
                scope="alumni_management",
                target_table="transitioning_alumni_table",
                target_id=instance.id,
                metadata={
                    "student_id": getattr(instance, "student_id", ""),
                    "nu_email": getattr(instance, "nu_email", ""),
                    "name": name,
                    "source_kind": source_kind,
                    "source_id": getattr(source_record, "id", None),
                    "transition_status": getattr(instance, "transition_status", ""),
                },
            )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        # Kept for DRF compatibility; create() handles the source validation/update flow.
        serializer.save()

    def perform_update(self, serializer):
        instance = serializer.save()
        name = build_alumni_name(instance) or getattr(instance, "nu_email", "") or "Transitioning Alumni"

        if create_system_audit:
            create_system_audit(
                request=self.request,
                action="UPDATE_TRANSITIONING_ALUMNI",
                details=f"Updated transitioning alumni record: {name}.",
                scope="alumni_management",
                target_table="transitioning_alumni_table",
                target_id=instance.id,
                metadata={
                    "student_id": getattr(instance, "student_id", ""),
                    "nu_email": getattr(instance, "nu_email", ""),
                    "name": name,
                    "status": getattr(instance, "status", ""),
                    "transition_status": getattr(instance, "transition_status", ""),
                },
            )

    def perform_destroy(self, instance):
        target_id = instance.id
        name = build_alumni_name(instance) or getattr(instance, "nu_email", "") or "Transitioning Alumni"
        metadata = {
            "student_id": getattr(instance, "student_id", ""),
            "nu_email": getattr(instance, "nu_email", ""),
            "name": name,
        }

        instance.delete()

        if create_system_audit:
            create_system_audit(
                request=self.request,
                action="DELETE_TRANSITIONING_ALUMNI",
                details=f"Deleted transitioning alumni record: {name}.",
                scope="alumni_management",
                target_table="transitioning_alumni_table",
                target_id=target_id,
                metadata=metadata,
            )

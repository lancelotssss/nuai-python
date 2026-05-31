import re
import secrets
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from accounts.models import Account
from interns.models import Intern
from system_audit.utils import create_system_audit

from .models import PreRegisteredIntern
from .serializers import PreRegisteredInternSerializer


OTP_TOKEN_PREFIX = "intern-dev-otp"
OTP_TOKEN_TTL_MINUTES = 10


class PreRegisteredInternViewSet(viewsets.ModelViewSet):
    queryset = PreRegisteredIntern.objects.all()
    serializer_class = PreRegisteredInternSerializer


def clean_text(value):
    return str(value or "").strip()


def normalize_email(value):
    return clean_text(value).lower()


def is_valid_student_id(value):
    return bool(re.fullmatch(r"20\d{2}-\d{6,7}", clean_text(value)))


def is_valid_otp(value):
    return bool(re.fullmatch(r"\d{6}", clean_text(value)))


def split_full_name(full_name):
    parts = [part for part in clean_text(full_name).split() if part]

    if not parts:
        return "Intern", "", "User"

    if len(parts) == 1:
        return parts[0], "", "Intern"

    if len(parts) == 2:
        return parts[0], "", parts[1]

    return parts[0], " ".join(parts[1:-1]), parts[-1]


def get_pre_registered_intern_or_response(student_id, nu_email):
    student_id = clean_text(student_id)
    nu_email = normalize_email(nu_email)

    if not student_id or not nu_email:
        return None, Response(
            {"message": "Student ID and NU Email are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not is_valid_student_id(student_id):
        return None, Response(
            {"message": "Student ID must be in the format 20XX-XXXXXX."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        record = PreRegisteredIntern.objects.get(
            student_id=student_id,
            nu_email__iexact=nu_email,
        )
    except PreRegisteredIntern.DoesNotExist:
        return None, Response(
            {
                "message": "No pre-registered intern record found for that Student ID and NU Email."
            },
            status=status.HTTP_404_NOT_FOUND,
        )

    if record.status == "deactivated":
        return None, Response(
            {"message": "This pre-registered intern record is deactivated."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if record.claimed or record.status == "claimed":
        return None, Response(
            {"message": "This intern pre-registration record has already been claimed."},
            status=status.HTTP_409_CONFLICT,
        )

    return record, None


def official_payload(record):
    return {
        "studentId": record.student_id,
        "fullName": record.full_name,
        "gender": record.gender or "",
        "nuEmail": record.nu_email,
        "course": record.course or "",
        "courseFullName": record.course_full_name or "",
        "schoolProgramCode": record.school_program_code or "",
        "schoolProgramFullName": record.school_program_full_name or "",
    }


def build_dev_otp_token(record, nu_email):
    random_part = secrets.token_urlsafe(24)
    expires_at = int((timezone.now() + timedelta(minutes=OTP_TOKEN_TTL_MINUTES)).timestamp())
    return f"{OTP_TOKEN_PREFIX}:{record.id}:{normalize_email(nu_email)}:{expires_at}:{random_part}"


def validate_dev_otp_token(token, record, nu_email):
    raw = clean_text(token)
    if not raw.startswith(f"{OTP_TOKEN_PREFIX}:"):
        return False

    parts = raw.split(":", 4)
    if len(parts) != 5:
        return False

    _, record_id, token_email, expires_at, _random_part = parts

    if clean_text(record_id) != str(record.id):
        return False

    if normalize_email(token_email) != normalize_email(nu_email):
        return False

    try:
        expiry = int(expires_at)
    except (TypeError, ValueError):
        return False

    return expiry >= int(timezone.now().timestamp())


@api_view(["POST"])
def intern_precheck(request):
    student_id = request.data.get("studentId") or request.data.get("student_id")
    nu_email = request.data.get("nuEmail") or request.data.get("nu_email")

    record, error_response = get_pre_registered_intern_or_response(student_id, nu_email)
    if error_response:
        return error_response

    return Response(
        {
            "shellDocId": str(record.id),
            "official": official_payload(record),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def send_intern_email_otp(request):
    student_id = request.data.get("studentId") or request.data.get("student_id")
    nu_email = request.data.get("nuEmail") or request.data.get("nu_email")

    record, error_response = get_pre_registered_intern_or_response(student_id, nu_email)
    if error_response:
        return error_response

    return Response(
        {
            "message": "OTP step opened. Email authentication is disabled for this build; any 6-digit code is accepted.",
            "cooldownSeconds": 60,
            "shellDocId": str(record.id),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def resend_intern_email_otp(request):
    return send_intern_email_otp(request)


@api_view(["POST"])
def verify_intern_email_otp(request):
    shell_doc_id = request.data.get("shellDocId") or request.data.get("shell_doc_id")
    nu_email = request.data.get("nuEmail") or request.data.get("nu_email")
    otp = request.data.get("otp") or request.data.get("code")

    if not is_valid_otp(otp):
        return Response(
            {"message": "OTP must be 6 digits."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        record = PreRegisteredIntern.objects.get(id=shell_doc_id)
    except (PreRegisteredIntern.DoesNotExist, ValueError, TypeError):
        return Response(
            {"message": "Invalid pre-registration reference."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if normalize_email(record.nu_email) != normalize_email(nu_email):
        return Response(
            {"message": "NU Email does not match the pre-registration record."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if record.claimed or record.status == "claimed":
        return Response(
            {"message": "This intern pre-registration record has already been claimed."},
            status=status.HTTP_409_CONFLICT,
        )

    return Response(
        {
            "message": "OTP accepted.",
            "otpToken": build_dev_otp_token(record, nu_email),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def register_intern_user(request):
    shell_doc_id = request.data.get("shellDocId") or request.data.get("shell_doc_id")
    nu_email = request.data.get("nuEmail") or request.data.get("nu_email")
    password = clean_text(request.data.get("password"))
    otp_token = request.data.get("otpToken") or request.data.get("otp_token")

    if not password:
        return Response(
            {"message": "Password is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        record = PreRegisteredIntern.objects.get(id=shell_doc_id)
    except (PreRegisteredIntern.DoesNotExist, ValueError, TypeError):
        return Response(
            {"message": "Invalid pre-registration reference."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if normalize_email(record.nu_email) != normalize_email(nu_email):
        return Response(
            {"message": "NU Email does not match the pre-registration record."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not validate_dev_otp_token(otp_token, record, nu_email):
        return Response(
            {"message": "Invalid or expired OTP token."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if record.claimed or record.status == "claimed":
        return Response(
            {"message": "This intern pre-registration record has already been claimed."},
            status=status.HTTP_409_CONFLICT,
        )

    if Account.objects.filter(email__iexact=nu_email).exists():
        return Response(
            {"message": "An account with this NU Email already exists."},
            status=status.HTTP_409_CONFLICT,
        )

    if Intern.objects.filter(student_id=record.student_id).exists():
        return Response(
            {"message": "An intern account with this Student ID already exists."},
            status=status.HTTP_409_CONFLICT,
        )

    first_name, middle_name, last_name = split_full_name(record.full_name)

    with transaction.atomic():
        account = Account(
            email=normalize_email(nu_email),
            role="intern",
            status="active",
        )
        account.set_password(password)
        account.save()

        intern = Intern.objects.create(
            student_id=record.student_id,
            first_name=first_name,
            middle_name=middle_name or None,
            last_name=last_name,
            course=record.course or record.course_full_name or None,
            year_level=None,
            contact_number=None,
            email=normalize_email(nu_email),
            role="intern",
            status="active",
        )

        record.claimed = True
        record.claimed_at = timezone.now()
        record.claimed_by_email = normalize_email(nu_email)
        record.status = "claimed"
        record.save(update_fields=["claimed", "claimed_at", "claimed_by_email", "status", "updated_at"])

    try:
        create_system_audit(
            request=request,
            action="INTERN_REGISTER_SUCCESS",
            actor_email=account.email,
            actor_role="intern",
            details=f"Intern account created from pre-registration record {record.id}.",
            scope="authentication",
            target_table="interns_table",
            target_id=str(intern.id),
            metadata={
                "pre_registered_intern_id": record.id,
                "student_id": record.student_id,
                "nu_email": account.email,
            },
        )
    except Exception:
        pass

    return Response(
        {
            "message": "Intern account registered successfully.",
            "account": {
                "id": account.id,
                "email": account.email,
                "role": account.role,
                "status": account.status,
            },
            "intern": {
                "id": intern.id,
                "studentId": intern.student_id,
                "student_id": intern.student_id,
                "fullName": record.full_name,
                "full_name": record.full_name,
                "nuEmail": account.email,
                "nu_email": account.email,
            },
            "redirect_to": "/intern",
        },
        status=status.HTTP_201_CREATED,
    )

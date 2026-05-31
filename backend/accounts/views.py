from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Account
from .serializers import AccountSerializer, RegisterSerializer, LoginSerializer

from alumni.models import Alumni
from interns.models import Intern
from system_audit.utils import create_system_audit


class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer


def norm(value):
    return str(value or "").strip().lower()


def safe(value):
    return str(value or "").strip()


def get_redirect_path(role):
    role_redirects = {
        "super-admin": "/super-admin",
        "alumni-officer": "/alumni-officer",
        "ailpo": "/ailpo",
        "registrar": "/registrar",
        "faculty": "/faculty",
        "partner": "/partner",
        "alumni": "/alumni",
        "intern": "/intern",
    }

    return role_redirects.get(norm(role), "/")


def set_if_has(instance, field, value):
    if hasattr(instance, field):
        setattr(instance, field, value)


def get_intern_nu_email(intern):
    """
    NU email is the school email and must be preserved separately from personal email.
    Priority:
    1. intern.nu_email
    2. intern.email only when it is still the NU/student email
    """

    nu_email = norm(getattr(intern, "nu_email", ""))

    if nu_email:
        return nu_email

    email = norm(getattr(intern, "email", ""))
    personal_email = norm(getattr(intern, "personal_email", ""))

    if email and email != personal_email:
        return email

    return ""


def get_intern_personal_email(intern):
    return norm(getattr(intern, "personal_email", ""))


def get_intern_by_id(intern_id):
    try:
        return Intern.objects.get(id=intern_id)
    except Intern.DoesNotExist:
        return None


def find_account_for_intern(intern, current_email=""):
    """
    While the user is still an intern, the account login email should be the NU email.
    During transition, we find the account using:
    - current_email from frontend
    - intern.nu_email
    - intern.email if still used as the NU login email
    """

    nu_email = get_intern_nu_email(intern)

    email_candidates = [
        norm(current_email),
        nu_email,
        norm(getattr(intern, "email", "")),
    ]

    for email in email_candidates:
        if not email:
            continue

        account = Account.objects.filter(email__iexact=email).first()
        if account:
            return account

    return None


def create_or_update_alumni_from_intern(intern, personal_email):
    """
    Creates/updates the Alumni record.

    Important:
    - Alumni.email is the Alumni login email, so it uses personal_email.
    - Alumni.personal_email also uses personal_email.
    - Alumni.nu_email keeps the original NU/student email.
    """

    student_id = safe(getattr(intern, "student_id", ""))
    nu_email = get_intern_nu_email(intern)

    alumni = None

    if student_id:
        alumni = Alumni.objects.filter(student_id=student_id).first()

    if not alumni:
        alumni = Alumni.objects.filter(email__iexact=personal_email).first()

    if not alumni:
        alumni = Alumni()

    set_if_has(alumni, "student_id", student_id)
    set_if_has(alumni, "first_name", safe(getattr(intern, "first_name", "")))
    set_if_has(alumni, "middle_name", safe(getattr(intern, "middle_name", "")))
    set_if_has(alumni, "last_name", safe(getattr(intern, "last_name", "")))
    set_if_has(alumni, "course", safe(getattr(intern, "course", "")))
    set_if_has(alumni, "contact_number", safe(getattr(intern, "contact_number", "")))

    # Separate email fields
    set_if_has(alumni, "email", personal_email)
    set_if_has(alumni, "personal_email", personal_email)
    set_if_has(alumni, "nu_email", nu_email)

    set_if_has(alumni, "role", "alumni")
    set_if_has(alumni, "status", "active")

    alumni.save()
    return alumni


@api_view(["POST"])
def register_account(request):
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        account = serializer.save()

        return Response(
            {
                "message": "Account registered successfully.",
                "account": AccountSerializer(account).data,
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def login_account(request):
    serializer = LoginSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    password = serializer.validated_data["password"]

    try:
        account = Account.objects.get(email__iexact=email)
    except Account.DoesNotExist:
        return Response(
            {"message": "Invalid email or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if account.status != "active":
        return Response(
            {"message": "Account is deactivated."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if not account.check_password(password):
        return Response(
            {"message": "Invalid email or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    redirect_to = get_redirect_path(account.role)

    create_system_audit(
        request=request,
        action="LOGIN_SUCCESS",
        actor_email=account.email,
        actor_role=account.role,
        details=f"Login successful. Redirected to {redirect_to}.",
        scope="authentication",
        target_table="accounts_table",
        target_id=str(account.id),
        metadata={
            "redirect_to": redirect_to,
            "role": account.role,
            "status": account.status,
        },
    )

    return Response(
        {
            "message": "Login successful.",
            "account": {
                "id": account.id,
                "email": account.email,
                "role": account.role,
                "status": account.status,
            },
            "redirect_to": redirect_to,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def complete_alumni_transition(request):
    intern_id = request.data.get("intern_id")
    current_email = norm(request.data.get("current_email"))
    personal_email = norm(request.data.get("personal_email"))

    if not intern_id:
        return Response(
            {"detail": "intern_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not personal_email:
        return Response(
            {"detail": "personal_email is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    intern = get_intern_by_id(intern_id)

    if not intern:
        return Response(
            {"detail": "Intern record not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    nu_email = get_intern_nu_email(intern)

    if not nu_email:
        return Response(
            {"detail": "NU email was not found for this intern."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if personal_email == nu_email:
        return Response(
            {"detail": "Personal email must be different from NU email."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if current_email and current_email != nu_email:
        return Response(
            {
                "detail": "Current login email does not match the intern's NU email.",
                "current_email": current_email,
                "nu_email": nu_email,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if safe(getattr(intern, "status", "")).lower() != "transitioning":
        return Response(
            {"detail": "Only transitioning interns can complete alumni transition."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    account = find_account_for_intern(intern, current_email=nu_email)

    if not account:
        return Response(
            {"detail": "Login account for this intern was not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    email_owner = (
        Account.objects.filter(email__iexact=personal_email)
        .exclude(id=account.id)
        .first()
    )

    if email_owner:
        return Response(
            {"detail": "This personal email is already used by another account."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        alumni = create_or_update_alumni_from_intern(intern, personal_email)

        # Account login changes to personal email because role becomes Alumni.
        account.email = personal_email
        account.role = "alumni"
        account.status = "active"
        account.save()

        # Preserve intern history.
        set_if_has(intern, "nu_email", nu_email)
        set_if_has(intern, "personal_email", personal_email)

        # Do NOT overwrite intern.email with personal_email if intern.email represents NU login.
        # Keep intern.email as NU email for historical consistency if the field exists.
        if hasattr(intern, "email"):
            intern.email = nu_email

        set_if_has(intern, "role", "intern")
        set_if_has(intern, "status", "transitioned")
        intern.save()

    create_system_audit(
        request=request,
        action="INTERN_TRANSITION_COMPLETED",
        actor_email=personal_email,
        actor_role="alumni",
        details=f"Intern {safe(getattr(intern, 'student_id', ''))} completed alumni transition.",
        scope="accounts",
        target_table="accounts_table",
        target_id=str(account.id),
        metadata={
            "intern_id": intern.id,
            "alumni_id": alumni.id,
            "nu_email": nu_email,
            "personal_email": personal_email,
            "old_login_email": nu_email,
            "new_login_email": personal_email,
        },
    )

    return Response(
        {
            "detail": "Alumni transition completed successfully.",
            "message": "Alumni transition completed successfully.",
            "account": {
                "id": account.id,
                "email": account.email,
                "role": account.role,
                "status": account.status,
                "nu_email": nu_email,
                "personal_email": personal_email,
            },
            "alumni": {
                "id": alumni.id,
                "email": getattr(alumni, "email", personal_email),
                "nu_email": getattr(alumni, "nu_email", nu_email),
                "personal_email": getattr(alumni, "personal_email", personal_email),
                "student_id": getattr(alumni, "student_id", ""),
            },
            "redirect": "/login",
        },
        status=status.HTTP_200_OK,
    )


# Backward-compatible alias for earlier patches/routes.
confirm_intern_transition = complete_alumni_transition
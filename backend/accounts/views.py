from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Account
from .serializers import AccountSerializer, RegisterSerializer, LoginSerializer

from system_audit.utils import create_system_audit


class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer


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

    return role_redirects.get(role, "/")


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
        account = Account.objects.get(email=email)
    except Account.DoesNotExist:
        # Failed login attempts are intentionally not audited.
        return Response(
            {"message": "Invalid email or password."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if account.status != "active":
        # Denied login attempts are intentionally not audited.
        return Response(
            {"message": "Account is deactivated."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if not account.check_password(password):
        # Failed login attempts are intentionally not audited.
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

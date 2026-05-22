from django.db.models import Q
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import api_view

from .models import SystemAudit
from .serializers import SystemAuditSerializer
from .utils import get_client_ip


class SystemAuditViewSet(viewsets.ModelViewSet):
    queryset = SystemAudit.objects.all()
    serializer_class = SystemAuditSerializer

    def get_queryset(self):
        queryset = SystemAudit.objects.all().exclude(
            action__in=["LOGIN_FAILED", "LOGIN_DENIED"]
        )

        search = self.request.query_params.get("search")
        action = self.request.query_params.get("action")
        actor_role = self.request.query_params.get("actor_role")
        actor_email = self.request.query_params.get("actor_email")
        scope = self.request.query_params.get("scope")

        if search:
            queryset = queryset.filter(
                Q(actor_email__icontains=search)
                | Q(actor_role__icontains=search)
                | Q(action__icontains=search)
                | Q(details__icontains=search)
                | Q(scope__icontains=search)
                | Q(target_table__icontains=search)
                | Q(target_id__icontains=search)
            )

        if action:
            queryset = queryset.filter(action=action)

        if actor_role:
            queryset = queryset.filter(actor_role=actor_role)

        if actor_email:
            queryset = queryset.filter(actor_email=actor_email)

        if scope:
            queryset = queryset.filter(scope=scope)

        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(
            ip_address=get_client_ip(self.request),
            user_agent=self.request.META.get("HTTP_USER_AGENT", ""),
        )


@api_view(["POST"])
def log_system_audit(request):
    data = request.data.copy()

    if data.get("action") in ["LOGIN_FAILED", "LOGIN_DENIED"]:
        return Response(
            {"message": "Failed login audit logs are disabled."},
            status=200,
        )

    data["ip_address"] = get_client_ip(request)
    data["user_agent"] = request.META.get("HTTP_USER_AGENT", "")

    serializer = SystemAuditSerializer(data=data)

    if serializer.is_valid():
        audit = serializer.save()

        return Response(
            {
                "message": "System audit logged successfully.",
                "audit": SystemAuditSerializer(audit).data,
            },
            status=201,
        )

    return Response(serializer.errors, status=400)

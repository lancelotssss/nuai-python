from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import SystemAuditViewSet, log_system_audit

router = DefaultRouter()
router.register(r"system-audit", SystemAuditViewSet, basename="system-audit")

urlpatterns = [
    path("system-audit/log/", log_system_audit, name="system-audit-log"),
]

urlpatterns += router.urls
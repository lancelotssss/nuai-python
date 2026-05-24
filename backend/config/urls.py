from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/", include("accounts.urls")),
    path("api/", include("alumni.urls")),
    path("api/", include("interns.urls")),
    path("api/", include("faculty.urls")),
    path("api/", include("alumni_officer.urls")),
    path("api/", include("ailpo.urls")),
    path("api/", include("partner.urls")),
    path("api/", include("registrar.urls")),
    path("api/", include("super_admin.urls")),
    path("api/", include("system_audit.urls")),
    path("api/", include("academic_records.urls")),
    path("api/", include("organization_chart.urls")),
    path("api/", include("internship_classes.urls")),
    path("api/", include("pre_registered_alumni.urls")),
]
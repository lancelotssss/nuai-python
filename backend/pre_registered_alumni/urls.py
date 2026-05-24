from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PreRegisteredAlumniViewSet

router = DefaultRouter()
router.register(r"pre-registered-alumni", PreRegisteredAlumniViewSet, basename="pre-registered-alumni")

urlpatterns = [
    path("", include(router.urls)),
]

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import TransitioningAlumniViewSet

router = DefaultRouter()
router.register(r"transitioning-alumni", TransitioningAlumniViewSet, basename="transitioning-alumni")

urlpatterns = [
    path("", include(router.urls)),
]

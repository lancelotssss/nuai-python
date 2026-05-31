from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import OfficerCalendarEventViewSet

router = DefaultRouter()
router.register(r"calendar-events", OfficerCalendarEventViewSet, basename="calendar-events")

urlpatterns = [path("", include(router.urls))]

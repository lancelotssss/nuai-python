from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import OfficerPostViewSet

router = DefaultRouter()
router.register(r"posts", OfficerPostViewSet, basename="posts")

urlpatterns = [path("", include(router.urls))]

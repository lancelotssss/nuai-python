from rest_framework.routers import DefaultRouter
from .views import RegistrarViewSet

router = DefaultRouter()
router.register(r"registrars", RegistrarViewSet, basename="registrars")

urlpatterns = router.urls

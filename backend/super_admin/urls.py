from rest_framework.routers import DefaultRouter
from .views import SuperAdminViewSet

router = DefaultRouter()
router.register(r"super-admins", SuperAdminViewSet, basename="super-admins")

urlpatterns = router.urls

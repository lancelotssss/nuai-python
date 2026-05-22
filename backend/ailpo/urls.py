from rest_framework.routers import DefaultRouter
from .views import AILPOViewSet

router = DefaultRouter()
router.register(r"ailpo", AILPOViewSet, basename="ailpo")

urlpatterns = router.urls

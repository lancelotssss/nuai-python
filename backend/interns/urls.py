from rest_framework.routers import DefaultRouter
from .views import InternViewSet

router = DefaultRouter()
router.register(r"interns", InternViewSet, basename="interns")

urlpatterns = router.urls
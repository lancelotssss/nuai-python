from rest_framework.routers import DefaultRouter
from .views import InternshipClassViewSet

router = DefaultRouter()
router.register(r"internship-classes", InternshipClassViewSet, basename="internship-classes")

urlpatterns = router.urls

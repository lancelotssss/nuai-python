from rest_framework.routers import DefaultRouter
from .views import FacultyViewSet

router = DefaultRouter()
router.register(r"faculty", FacultyViewSet, basename="faculty")

urlpatterns = router.urls
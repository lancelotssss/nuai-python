from rest_framework.routers import DefaultRouter
from .views import AlumniOfficerViewSet

router = DefaultRouter()
router.register(r"alumni-officers", AlumniOfficerViewSet, basename="alumni-officers")

urlpatterns = router.urls

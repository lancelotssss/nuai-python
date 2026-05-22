from rest_framework.routers import DefaultRouter
from .views import OrganizationChartMemberViewSet

router = DefaultRouter()
router.register(
    r"organization-chart",
    OrganizationChartMemberViewSet,
    basename="organization-chart",
)

urlpatterns = router.urls
from rest_framework.routers import DefaultRouter

from .views import (
    YearGraduatedViewSet,
    AcademicAwardViewSet,
    SchoolProgramViewSet,
    AcademicProgramViewSet,
)

router = DefaultRouter()
router.register(r"year-graduated", YearGraduatedViewSet, basename="year-graduated")
router.register(r"academic-awards", AcademicAwardViewSet, basename="academic-awards")
router.register(r"school-programs", SchoolProgramViewSet, basename="school-programs")
router.register(r"academic-programs", AcademicProgramViewSet, basename="academic-programs")

urlpatterns = router.urls
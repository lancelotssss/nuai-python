from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import OfficerPerksDiscountViewSet

router = DefaultRouter()
router.register(r"perks-discounts", OfficerPerksDiscountViewSet, basename="perks-discounts")

urlpatterns = [path("", include(router.urls))]

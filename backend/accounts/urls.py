from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AccountViewSet, register_account, login_account

router = DefaultRouter()
router.register(r"accounts", AccountViewSet, basename="accounts")

urlpatterns = [
    path("accounts/register/", register_account, name="accounts-register"),
    path("accounts/login/", login_account, name="accounts-login"),
]

urlpatterns += router.urls
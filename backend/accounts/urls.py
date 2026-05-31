from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AccountViewSet,
    complete_alumni_transition,
    confirm_intern_transition,
    login_account,
    register_account,
)

router = DefaultRouter()
router.register(r"accounts", AccountViewSet, basename="accounts")

urlpatterns = [
    path("accounts/register/", register_account, name="accounts-register"),
    path("accounts/login/", login_account, name="accounts-login"),
    path(
        "accounts/complete-alumni-transition/",
        complete_alumni_transition,
        name="accounts-complete-alumni-transition",
    ),
    path(
        "accounts/confirm-intern-transition/",
        confirm_intern_transition,
        name="accounts-confirm-intern-transition",
    ),
]

urlpatterns += router.urls

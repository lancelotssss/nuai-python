from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    PreRegisteredInternViewSet,
    intern_precheck,
    register_intern_user,
    resend_intern_email_otp,
    send_intern_email_otp,
    verify_intern_email_otp,
)

router = DefaultRouter()
router.register(
    r"pre-registered-interns",
    PreRegisteredInternViewSet,
    basename="pre-registered-interns",
)

urlpatterns = [
    path("intern-registration/precheck/", intern_precheck, name="intern-registration-precheck"),
    path("intern-registration/send-otp/", send_intern_email_otp, name="intern-registration-send-otp"),
    path("intern-registration/resend-otp/", resend_intern_email_otp, name="intern-registration-resend-otp"),
    path("intern-registration/verify-otp/", verify_intern_email_otp, name="intern-registration-verify-otp"),
    path("intern-registration/register/", register_intern_user, name="intern-registration-register"),
]

urlpatterns += router.urls

from django.urls import path

from .views import SupabaseUploadView

urlpatterns = [
    path("", SupabaseUploadView.as_view(), name="supabase-upload"),
]

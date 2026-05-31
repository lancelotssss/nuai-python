from rest_framework import viewsets
from .models import OfficerPost
from .serializers import OfficerPostSerializer


class OfficerPostViewSet(viewsets.ModelViewSet):
    serializer_class = OfficerPostSerializer

    def get_queryset(self):
        queryset = OfficerPost.objects.all()
        status_value = self.request.query_params.get("status")
        if status_value:
            queryset = queryset.filter(status=status_value)
        ordering = self.request.query_params.get("ordering", "-created_at")
        if ordering in {"created_at", "-created_at", "updated_at", "-updated_at", "post_header", "-post_header"}:
            queryset = queryset.order_by(ordering)
        return queryset

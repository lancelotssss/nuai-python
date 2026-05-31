from rest_framework import viewsets
from .models import OfficerCalendarEvent
from .serializers import OfficerCalendarEventSerializer


class OfficerCalendarEventViewSet(viewsets.ModelViewSet):
    serializer_class = OfficerCalendarEventSerializer

    def get_queryset(self):
        queryset = OfficerCalendarEvent.objects.all()
        status_value = self.request.query_params.get("status")
        if status_value:
            queryset = queryset.filter(status=status_value)
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)
        ordering = self.request.query_params.get("ordering", "-created_at")
        if ordering in {"created_at", "-created_at", "updated_at", "-updated_at", "event_date", "-event_date", "title", "-title"}:
            queryset = queryset.order_by(ordering)
        return queryset

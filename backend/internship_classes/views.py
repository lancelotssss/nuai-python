from rest_framework import viewsets

from faculty.models import Faculty
from .models import InternshipClass
from .serializers import InternshipClassSerializer


class InternshipClassViewSet(viewsets.ModelViewSet):
    serializer_class = InternshipClassSerializer

    def get_queryset(self):
        queryset = InternshipClass.objects.select_related("faculty").all()

        faculty_email = self.request.query_params.get("faculty_email")
        faculty_id = self.request.query_params.get("faculty_id")
        status = self.request.query_params.get("status")

        if faculty_email:
            queryset = queryset.filter(faculty_email__iexact=faculty_email)

        if faculty_id:
            queryset = queryset.filter(faculty_id=faculty_id)

        if status:
            queryset = queryset.filter(status__iexact=status)

        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        faculty_email = self.request.data.get("faculty_email", "")
        faculty = None

        if faculty_email:
            faculty = Faculty.objects.filter(email__iexact=faculty_email).first()

        serializer.save(faculty=faculty, faculty_email=faculty_email or None)

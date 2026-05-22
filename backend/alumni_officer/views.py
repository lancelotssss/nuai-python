from rest_framework import viewsets
from .models import AlumniOfficer
from .serializers import AlumniOfficerSerializer


class AlumniOfficerViewSet(viewsets.ModelViewSet):
    queryset = AlumniOfficer.objects.all()
    serializer_class = AlumniOfficerSerializer

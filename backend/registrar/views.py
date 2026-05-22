from rest_framework import viewsets
from .models import Registrar
from .serializers import RegistrarSerializer


class RegistrarViewSet(viewsets.ModelViewSet):
    queryset = Registrar.objects.all()
    serializer_class = RegistrarSerializer

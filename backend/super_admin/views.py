from rest_framework import viewsets
from .models import SuperAdmin
from .serializers import SuperAdminSerializer


class SuperAdminViewSet(viewsets.ModelViewSet):
    queryset = SuperAdmin.objects.all()
    serializer_class = SuperAdminSerializer
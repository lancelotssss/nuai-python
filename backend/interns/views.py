from rest_framework import viewsets
from .models import Intern
from .serializers import InternSerializer


class InternViewSet(viewsets.ModelViewSet):
    queryset = Intern.objects.all()
    serializer_class = InternSerializer

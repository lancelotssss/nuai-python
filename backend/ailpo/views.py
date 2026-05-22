from rest_framework import viewsets
from .models import AILPO
from .serializers import AILPOSerializer


class AILPOViewSet(viewsets.ModelViewSet):
    queryset = AILPO.objects.all()
    serializer_class = AILPOSerializer

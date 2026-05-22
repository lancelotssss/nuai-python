from rest_framework import serializers
from .models import AILPO


class AILPOSerializer(serializers.ModelSerializer):
    class Meta:
        model = AILPO
        fields = "__all__"

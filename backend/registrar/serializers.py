from rest_framework import serializers
from .models import Registrar


class RegistrarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Registrar
        fields = "__all__"

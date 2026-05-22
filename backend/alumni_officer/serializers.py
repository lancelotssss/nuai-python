from rest_framework import serializers
from .models import AlumniOfficer


class AlumniOfficerSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlumniOfficer
        fields = "__all__"

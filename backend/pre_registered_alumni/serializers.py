from rest_framework import serializers
from .models import PreRegisteredAlumni


class PreRegisteredAlumniSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreRegisteredAlumni
        fields = "__all__"

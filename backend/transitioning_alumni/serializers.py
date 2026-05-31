from rest_framework import serializers
from .models import TransitioningAlumni


class TransitioningAlumniSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransitioningAlumni
        fields = "__all__"

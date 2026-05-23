from rest_framework import serializers
from .models import InternshipClass


class InternshipClassSerializer(serializers.ModelSerializer):
    faculty_name = serializers.SerializerMethodField()

    class Meta:
        model = InternshipClass
        fields = "__all__"

    def get_faculty_name(self, obj):
        if not obj.faculty:
            return ""

        first_name = getattr(obj.faculty, "first_name", "") or ""
        middle_name = getattr(obj.faculty, "middle_name", "") or ""
        last_name = getattr(obj.faculty, "last_name", "") or ""

        return " ".join(
            item.strip() for item in [first_name, middle_name, last_name] if item.strip()
        )

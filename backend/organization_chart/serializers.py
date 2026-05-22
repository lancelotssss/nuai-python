from rest_framework import serializers
from .models import OrganizationChartMember


class OrganizationChartMemberSerializer(serializers.ModelSerializer):
    school_program_label = serializers.SerializerMethodField()
    school_program_code = serializers.SerializerMethodField()

    class Meta:
        model = OrganizationChartMember
        fields = "__all__"

    def get_school_program_label(self, obj):
        if not obj.school_program:
            return ""

        if obj.school_program.code:
            return f"{obj.school_program.full_name} ({obj.school_program.code})"

        return obj.school_program.full_name

    def get_school_program_code(self, obj):
        if not obj.school_program:
            return ""

        return obj.school_program.code or ""
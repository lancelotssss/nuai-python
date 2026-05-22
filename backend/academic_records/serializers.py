from rest_framework import serializers
from .models import (
    YearGraduated,
    AcademicAward,
    SchoolProgram,
    AcademicProgram,
)


class YearGraduatedSerializer(serializers.ModelSerializer):
    class Meta:
        model = YearGraduated
        fields = "__all__"


class AcademicAwardSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicAward
        fields = "__all__"


class AcademicProgramSerializer(serializers.ModelSerializer):
    school_program_label = serializers.SerializerMethodField()

    class Meta:
        model = AcademicProgram
        fields = "__all__"

    def get_school_program_label(self, obj):
        if obj.school_program.code:
            return f"{obj.school_program.full_name} ({obj.school_program.code})"
        return obj.school_program.full_name


class SchoolProgramSerializer(serializers.ModelSerializer):
    academic_programs = AcademicProgramSerializer(many=True, read_only=True)

    class Meta:
        model = SchoolProgram
        fields = "__all__"
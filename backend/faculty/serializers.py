from rest_framework import serializers
from .models import Faculty


class FacultySerializer(serializers.ModelSerializer):
    account_email = serializers.SerializerMethodField()
    account_role = serializers.SerializerMethodField()
    account_status = serializers.SerializerMethodField()

    class Meta:
        model = Faculty
        fields = "__all__"

    def get_account_email(self, obj):
        return obj.account.email if obj.account else ""

    def get_account_role(self, obj):
        return obj.account.role if obj.account else ""

    def get_account_status(self, obj):
        return obj.account.status if obj.account else ""
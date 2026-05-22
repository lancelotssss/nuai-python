from rest_framework import serializers
from .models import SuperAdmin


class SuperAdminSerializer(serializers.ModelSerializer):
    account_email = serializers.EmailField(source="account.email", read_only=True)

    class Meta:
        model = SuperAdmin
        fields = "__all__"
from rest_framework import serializers
from .models import Account


class AccountSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Account
        fields = [
            "id",
            "email",
            "password",
            "role",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        account = Account(**validated_data)

        if password:
            account.set_password(password)

        account.save()
        return account

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Account
        fields = ["id", "email", "password", "role", "status"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        account = Account(**validated_data)
        account.set_password(password)
        account.save()
        return account


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

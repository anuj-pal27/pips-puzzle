from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import ChildProfile

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate_email(self, value: str) -> str:
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        try:
            validate_password(attrs["password"], user=User(username=attrs["email"], email=attrs["email"]))
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return attrs

    def create(self, validated_data):
        email = validated_data["email"]
        return User.objects.create_user(username=email, email=email, password=validated_data["password"])

    def to_representation(self, instance):
        return {"id": instance.id, "email": instance.email}


class ChildSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChildProfile
        fields = ["id", "nickname", "avatar", "created_at"]
        read_only_fields = ["id", "created_at"]

from rest_framework import generics, permissions, viewsets
from rest_framework.exceptions import ValidationError

from .serializers import ChildSerializer, RegisterSerializer

MAX_CHILDREN = 6


class RegisterView(generics.CreateAPIView):
    """POST {email, password} -> creates a parent account. Sign in afterwards at /api/auth/token/."""

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ChildViewSet(viewsets.ModelViewSet):
    """The signed-in parent's children. A parent only ever sees their own."""

    serializer_class = ChildSerializer

    def get_queryset(self):
        return self.request.user.children.all()

    def perform_create(self, serializer):
        if self.request.user.children.count() >= MAX_CHILDREN:
            raise ValidationError(f"You can add up to {MAX_CHILDREN} children.")
        serializer.save(parent=self.request.user)

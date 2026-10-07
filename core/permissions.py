from rest_framework.permissions import BasePermission


class IsSelfOrAdmin(BasePermission):
    """
    Object-level permission: a user may only act on their own User record.
    Staff may act on any user.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        return request.user.is_staff or obj.pk == request.user.pk

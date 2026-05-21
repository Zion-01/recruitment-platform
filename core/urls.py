from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, 
    JobViewSet, 
    ApplicationViewSet, 
    CustomTokenObtainPairView  # 🚨 1. Import your custom JWT Login View
)
from rest_framework_simplejwt.views import TokenRefreshView

# The router automatically generates standard CRUD URL patterns for our ViewSets
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'jobs', JobViewSet)
router.register(r'applications', ApplicationViewSet, basename='application')

urlpatterns = [
    # --- REST API Table Routes ---
    # Fulfills endpoints like: GET /api/users/, POST /api/jobs/, PATCH /api/applications/
    path('', include(router.urls)),

    # --- Authentication & Security Routes ---
    # 🚨 2. Route the login endpoint directly to your custom claim view
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # Standard SimpleJWT endpoint to refresh expired access tokens securely
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserProfile, Job, Application, UserInteraction, Recommendation, Feedback

# 1. Custom User Admin
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Adds your custom fields to the main display table
    list_display = ('username', 'email', 'first_name', 'last_name', 'phone_number', 'location', 'is_staff')
    search_fields = ('username', 'email', 'phone_number')
    # Note: UserAdmin handles the password hashing logic in the admin panel safely.

# 2. User Profile Admin
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'preferred_job_type', 'experience_years', 'preferred_location')
    list_filter = ('preferred_job_type', 'experience_years')
    search_fields = ('user__username', 'skills')

# 3. Job Admin
@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('job_title', 'company_name', 'job_type', 'job_location', 'date_posted')
    list_filter = ('job_type', 'experience_required', 'date_posted')
    search_fields = ('job_title', 'company_name', 'required_skills')

# 4. Tracking & AI Data Admins
@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('user', 'job', 'application_status', 'application_date')
    list_filter = ('application_status', 'application_date')

@admin.register(UserInteraction)
class UserInteractionAdmin(admin.ModelAdmin):
    list_display = ('user', 'job', 'interaction_type', 'interaction_date')
    list_filter = ('interaction_type', 'interaction_date')

@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ('user', 'job', 'recommendation_score', 'generated_date')
    list_filter = ('generated_date',)
    ordering = ('-recommendation_score',) # Shows the highest scoring matches first

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('user', 'job', 'rating', 'feedback_date')
    list_filter = ('rating', 'feedback_date')
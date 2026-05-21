import math
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, UserProfile, Job, Application, Recommendation


# 1. Job Serializer
class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = '__all__'  # We want the frontend to see all job details for browsing


class RecommendationSerializer(serializers.ModelSerializer):
    """
    Packages the computed AI fidelity score as a clean frontend percentage 
    alongside the complete target job details.
    """
    job = JobSerializer(read_only=True)
    match_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Recommendation
        fields = ('id', 'match_percentage', 'recommendation_score', 'job')

    def get_match_percentage(self, obj):
        if obj.recommendation_score is None:
            return 0
            
        # ⚡ ALGORITHMIC BOOST: Apply a square root curve to raw cosine similarity floats.
        # This naturally lifts strict TF-IDF scores (e.g., 0.35 becomes 0.59 -> 59%) 
        # providing a much more encouraging and realistic alignment metric for users.
        boosted_score = math.sqrt(obj.recommendation_score)
        raw_percentage = boosted_score * 100
        
        return min(int(round(raw_percentage)), 100)


# 2. User Profile Serializer
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        exclude = ('user',) 


# 3. User Serializer (Nested Approach Secured)
class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'phone_number', 'location', 'is_staff', 'profile')
        extra_kwargs = {'password': {'write_only': True}} 

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', None)
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        
        if password:
            user.set_password(password)
            user.save()
            
        if profile_data is None:
            UserProfile.objects.create(user=user)
            
        return user

    def update(self, instance, validated_data):
        # 1. Pop nested layers and sensitive credentials out safely
        profile_data = validated_data.pop('profile', None)
        password = validated_data.pop('password', None)
        
        # 🚨 SECURITY FIX: Hash passwords correctly if provided during an update
        if password:
            instance.set_password(password)

        # 2. Update the base User model fields
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        instance.location = validated_data.get('location', instance.location)
        instance.save()

        # 3. Dynamically update all related UserProfile model fields
        if profile_data is not None:
            profile, created = UserProfile.objects.get_or_create(user=instance)
            
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
                
            profile.save()

        return instance


# 4. Application Serializer
class ApplicationSerializer(serializers.ModelSerializer):
    job_details = JobSerializer(source='job', read_only=True)

    class Meta:
        model = Application
        fields = ('id', 'user', 'job', 'job_details', 'application_status', 'application_date')
        read_only_fields = ('user', 'application_status')


# 5. Custom JWT Claims Customization
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Pack custom claims directly into the encrypted JWT payload
        token['username'] = user.username
        token['is_staff'] = user.is_staff  

        return token
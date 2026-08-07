from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(source='phone_number', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone', 'role')
        read_only_fields = ('role',)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField()

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'password')

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role='customer'
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def validate(self, attrs):
        if 'password' in attrs:
            attrs['username'] = attrs.get('email', '')
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data
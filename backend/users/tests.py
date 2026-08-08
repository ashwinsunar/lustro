from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthAPITests(APITestCase):
    def setUp(self):
        self.email = 'test@lustro.ch'
        self.password = 'secret123'

    def test_register_creates_user_and_returns_tokens(self):
        resp = self.client.post(
            reverse('auth_register'),
            {'email': self.email, 'first_name': 'Test', 'last_name': 'User', 'password': self.password},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email=self.email).exists())
        body = resp.data
        self.assertIn('tokens', body)
        self.assertIn('access', body['tokens'])
        self.assertEqual(body['user']['email'], self.email)
        self.assertEqual(body['user']['role'], 'customer')

    def test_register_rejects_duplicate_email(self):
        User.objects.create_user(email=self.email, password=self.password)
        resp = self.client.post(
            reverse('auth_register'),
            {'email': self.email, 'password': self.password},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_accepts_email_and_returns_tokens(self):
        User.objects.create_user(email=self.email, password=self.password)
        resp = self.client.post(
            reverse('token_obtain_pair'),
            {'email': self.email, 'password': self.password},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', resp.data)
        self.assertIn('user', resp.data)

    def test_token_refresh_endpoint(self):
        user = User.objects.create_user(email=self.email, password=self.password)
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        resp = self.client.post(
            reverse('token_refresh_alt'),
            {'refresh': str(refresh)},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('access', resp.data)

    def test_profile_requires_auth(self):
        resp = self.client.get(reverse('user_profile'))
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

class NewsletterAPITests(APITestCase):
    def test_subscribe_creates_subscriber(self):
        resp = self.client.post(
            reverse('newsletter_subscribe'),
            {'email': 'collector@example.com', 'source': 'footer'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        from .models import NewsletterSubscriber
        self.assertTrue(NewsletterSubscriber.objects.filter(email='collector@example.com').exists())

    def test_subscribe_idempotent(self):
        from .models import NewsletterSubscriber
        NewsletterSubscriber.objects.create(email='dup@example.com')
        resp = self.client.post(
            reverse('newsletter_subscribe'),
            {'email': 'DUP@example.com'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(NewsletterSubscriber.objects.filter(email='dup@example.com').count(), 1)

    def test_subscribe_rejects_invalid_email(self):
        resp = self.client.post(
            reverse('newsletter_subscribe'),
            {'email': 'not-an-email'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

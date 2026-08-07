from rest_framework import status
from rest_framework.test import APITestCase
from django.urls import reverse
from .models import Conversation, ChatMessage, Appointment


class ChatAPITests(APITestCase):
    def test_message_required(self):
        resp = self.client.post(reverse('chatbot'), {}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reply_and_conversation_persisted(self):
        resp = self.client.post(
            reverse('chatbot'),
            {'message': 'Show me a diver under 5000'},
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('reply', resp.data)
        self.assertIn('conversation_id', resp.data)
        conv = Conversation.objects.get(id=resp.data['conversation_id'])
        self.assertEqual(ChatMessage.objects.filter(conversation=conv).count(), 2)

    def test_conversation_reuse(self):
        first = self.client.post(reverse('chatbot'), {'message': 'Hello'}, format='json').data
        second = self.client.post(
            reverse('chatbot'),
            {'message': 'Recommend a GMT', 'conversation_id': first['conversation_id']},
            format='json',
        ).data
        self.assertEqual(first['conversation_id'], second['conversation_id'])

    def test_catalog_recommendation(self):
        from watches.models import Brand, Category, Watch
        brand = Brand.objects.create(name='Rolex', slug='rolex')
        cat = Category.objects.create(name='GMT')
        Watch.objects.create(
            title='GMT-Master II', slug='rolex-gmt', brand=brand, category=cat,
            price=13000, reference_number='126710BLRO', movement='automatic',
            case_size='40mm', case_material='Steel', dial_color='Black/Red',
            strap_material='Oyster', water_resistance='100m', description='Pepsi.',
        )
        resp = self.client.post(
            reverse('chatbot'),
            {'message': 'recommend a GMT under 15000'},
            format='json',
        )
        self.assertIn('GMT-Master', resp.data['reply'])


class AppointmentAPITests(APITestCase):
    def test_create_appointment(self):
        resp = self.client.post(
            reverse('appointments'),
            {
                'full_name': 'Ada Lovelace',
                'email': 'ada@example.com',
                'date': '2026-09-01',
                'preference': 'Virtual appointment',
                'message': 'Interested in the Moonphase.',
            },
            format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Appointment.objects.filter(email='ada@example.com').exists())

    def test_appointment_requires_name_and_email(self):
        resp = self.client.post(reverse('appointments'), {'email': 'x@y.com'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
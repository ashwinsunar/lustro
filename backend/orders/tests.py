from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from watches.models import Brand, Category, Watch
from .models import Order, Coupon

User = get_user_model()


class OrderAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='buyer@test.ch', password='secret123')
        self.client.force_authenticate(user=self.user)
        brand = Brand.objects.create(name='Rolex', slug='rolex', country='Switzerland')
        cat = Category.objects.create(name='Dress')
        self.watch = Watch.objects.create(
            title='Submariner', slug='rolex-sub', brand=brand, category=cat,
            price=10250, reference_number='126610', movement='automatic',
            case_size='41mm', case_material='Steel', dial_color='Black',
            strap_material='Steel', water_resistance='300m',
            description='Iconic diver.', stock_count=5,
        )
        self.shipping = {
            'full_name': 'Jane Doe',
            'email': 'buyer@test.ch',
            'phone_number': '+41',
            'address_line': 'Rue du Rhône 17',
            'city': 'Geneva',
            'postal_code': '1204',
            'country': 'Switzerland',
        }

    def test_create_order_decrements_stock(self):
        resp = self.client.post(reverse('order-list-create'), {
            'items': [{'watch_id': self.watch.id, 'quantity': 2}],
            'shipping': self.shipping,
            'payment_method': 'card',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        order = Order.objects.get(order_number=resp.data['order_number'])
        self.assertEqual(order.total, Decimal('20500'))
        self.watch.refresh_from_db()
        self.assertEqual(self.watch.stock_count, 3)

    def test_order_requires_auth(self):
        self.client.force_authenticate(user=None)
        resp = self.client.post(reverse('order-list-create'), {
            'items': [{'watch_id': self.watch.id, 'quantity': 1}],
            'shipping': self.shipping,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_order_rejects_insufficient_stock(self):
        resp = self.client.post(reverse('order-list-create'), {
            'items': [{'watch_id': self.watch.id, 'quantity': 99}],
            'shipping': self.shipping,
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_coupon_discount(self):
        Coupon.objects.create(code='WELCOME10', discount_percent=10, active=True)
        resp = self.client.post(reverse('order-list-create'), {
            'items': [{'watch_id': self.watch.id, 'quantity': 1}],
            'shipping': self.shipping,
            'coupon_code': 'WELCOME10',
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(resp.data['discount']), Decimal('1025'))
        self.assertEqual(Decimal(resp.data['total']), Decimal('9225'))

    def test_coupon_validate(self):
        Coupon.objects.create(code='WELCOME10', discount_percent=10, active=True)
        resp = self.client.get(reverse('coupon-validate', args=['WELCOME10']))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_advertised_promo_auto_created_on_validation(self):
        # The checkout copy says "try LUSTRO10" — the promo must validate even
        # before the seed command has run against a fresh database.
        self.assertFalse(Coupon.objects.filter(code='LUSTRO10').exists())
        resp = self.client.get(reverse('coupon-validate', args=['LUSTRO10']))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['code'], 'LUSTRO10')
        self.assertEqual(int(resp.data['discount_percent']), 10)
        self.assertTrue(Coupon.objects.filter(code='LUSTRO10', active=True).exists())

    def test_orders_list_scoped_to_user(self):
        other = User.objects.create_user(email='other@test.ch', password='secret123')
        self.client.post(reverse('order-list-create'), {
            'items': [{'watch_id': self.watch.id, 'quantity': 1}],
            'shipping': self.shipping,
        }, format='json')
        other_order = Order.objects.create(
            user=other, payment_method='card', full_name='Other', email='other@test.ch',
            address_line='X', city='Paris',
        )
        resp = self.client.get(reverse('order-list-create'))
        numbers = [o['order_number'] for o in resp.data]
        self.assertNotIn(other_order.order_number, numbers)
        self.assertEqual(len(numbers), 1)
    def test_cancel_order_restores_stock(self):
        resp = self.client.post(reverse('order-list-create'), {
            'items': [{'watch_id': self.watch.id, 'quantity': 2}],
            'shipping': self.shipping,
            'payment_method': 'cod',
        }, format='json')
        order_number = resp.data['order_number']
        self.watch.refresh_from_db()
        self.assertEqual(self.watch.stock_count, 3)

        cancel = self.client.post(reverse('order-cancel', args=[order_number]))
        self.assertEqual(cancel.status_code, status.HTTP_200_OK)
        self.assertEqual(cancel.data['status'], 'cancelled')
        self.watch.refresh_from_db()
        self.assertEqual(self.watch.stock_count, 5)

    def test_cannot_cancel_someone_elses_order(self):
        other = User.objects.create_user(email='other@test.ch', password='secret123')
        other_order = Order.objects.create(
            user=other, payment_method='card', full_name='Other', email='other@test.ch',
            address_line='X', city='Paris',
        )
        resp = self.client.post(reverse('order-cancel', args=[other_order.order_number]))
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

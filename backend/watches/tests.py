from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Brand, Category, Watch, WatchImage, StockNotify


class WatchAPITests(APITestCase):
    def setUp(self):
        self.roleplay = Brand.objects.create(name='Rolex', slug='rolex', country='Switzerland')
        self.omega = Brand.objects.create(name='Omega', slug='omega', country='Switzerland')
        self.dive = Category.objects.create(name='Dive')
        self.dress = Category.objects.create(name='Dress')

        self.sub = Watch.objects.create(
            title='Submariner', slug='rolex-submariner', brand=self.roleplay, category=self.dive,
            price=10250, reference_number='126610LN', movement='automatic',
            case_size='41mm', case_material='Steel', dial_color='Black',
            strap_material='Steel', water_resistance='300m', description='Dive icon.',
        )
        self.sm = Watch.objects.create(
            title='Speedmaster', slug='omega-speedmaster', brand=self.omega, category=self.dress,
            price=9950, discount_price=7950, reference_number='310.30', movement='manual',
            case_size='42mm', case_material='Steel', dial_color='Black',
            strap_material='Leather', water_resistance='50m', description='Moonwatch.',
            is_featured=True, is_trending=True, in_stock=True,
        )

    def test_list_paginated(self):
        resp = self.client.get(reverse('watch-list'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data['count'], 2)

    def test_multi_brand_filter(self):
        resp = self.client.get(reverse('watch-list'), {'brands': 'rolex,omega'})
        self.assertEqual(resp.data['count'], 2)
        resp = self.client.get(reverse('watch-list'), {'brands': 'omega'})
        self.assertEqual(resp.data['count'], 1)

    def test_on_sale_filter(self):
        resp = self.client.get(reverse('watch-list'), {'on_sale': 'true'})
        self.assertEqual(resp.data['count'], 1)
        self.assertEqual(resp.data['results'][0]['title'], 'Speedmaster')

    def test_search(self):
        resp = self.client.get(reverse('watch-list'), {'search': 'submariner'})
        self.assertEqual(resp.data['count'], 1)

    def test_exclude_filter(self):
        resp = self.client.get(reverse('watch-list'), {'exclude': self.sub.id})
        self.assertEqual(resp.data['count'], 1)
        self.assertEqual(resp.data['results'][0]['id'], self.sm.id)

    def test_brand_has_watch_count(self):
        resp = self.client.get(f"{reverse('brand-list')}rolex/")
        self.assertEqual(resp.data['watch_count'], 1)

    def test_detail_serializer_has_images(self):
        resp = self.client.get(reverse('watch-detail', args=[self.sub.slug]))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn('images', resp.data)
        self.assertIn('brand', resp.data)
        self.assertIn('collection', resp.data)

class StockNotifyAPITests(APITestCase):
    def setUp(self):
        self.brand = Brand.objects.create(name='Rolex', slug='rolex')
        self.cat = Category.objects.create(name='GMT')
        self.watch = Watch.objects.create(
            title='GMT-Master II', slug='rolex-gmt', brand=self.brand, category=self.cat,
            price=13000, reference_number='126710BLRO', movement='automatic',
            case_size='40mm', case_material='Steel', dial_color='Black/Red',
            strap_material='Oyster', water_resistance='100m', description='Pepsi.',
        )

    def url(self):
        return reverse('stock-notify-list', kwargs={'watch_slug': self.watch.slug})

    def test_join_waitlist(self):
        resp = self.client.post(self.url(), {'email': 'wait@list.com'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(StockNotify.objects.filter(email='wait@list.com', watch=self.watch).exists())

    def test_duplicate_email_same_watch(self):
        self.client.post(self.url(), {'email': 'wait@list.com'}, format='json')
        resp = self.client.post(self.url(), {'email': 'wait@list.com'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(StockNotify.objects.filter(email='wait@list.com').count(), 1)

    def test_unknown_watch_404(self):
        resp = self.client.post(
            reverse('stock-notify-list', kwargs={'watch_slug': 'does-not-exist'}),
            {'email': 'x@y.com'}, format='json',
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_missing_email_400(self):
        resp = self.client.post(self.url(), {}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class WatchImportFilterTests(APITestCase):
    """Phase 11: imported-watch facets (source, availability, movement_type)."""

    def setUp(self):
        self.brand = Brand.objects.create(name='Omega', slug='omega')
        self.local = Watch.objects.create(
            title='Seamaster', slug='omega-seamaster-local', brand=self.brand,
            price=6400, reference_number=None, movement='automatic',
            currency='CHF', in_stock=True, availability='',
            source='', sources='',
        )
        self.imported = Watch.objects.create(
            title='Seamaster Import', slug='omega-seamaster-import', brand=self.brand,
            price=4100, reference_number=None, movement='quartz',
            movement_type='quartz', currency='USD', in_stock=True,
            availability='in_stock', source='teddy_baldassarre',
            sources='teddy_baldassarre,watchmaxx',
        )

    def test_source_filter(self):
        resp = self.client.get(reverse('watch-list'), {'source': 'teddy_baldassarre'})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['count'], 1)
        self.assertEqual(resp.data['results'][0]['slug'], 'omega-seamaster-import')

    def test_sources_multi_filter(self):
        resp = self.client.get(reverse('watch-list'), {'sources': 'teddy_baldassarre,watchmaxx'})
        self.assertEqual(resp.data['count'], 1)
        resp = self.client.get(reverse('watch-list'), {'sources': 'watchmaxx'})
        self.assertEqual(resp.data['count'], 0)

    def test_availability_filter(self):
        resp = self.client.get(reverse('watch-list'), {'availabilities': 'in_stock'})
        self.assertEqual(resp.data['count'], 1)

    def test_movement_type_filter(self):
        resp = self.client.get(reverse('watch-list'), {'movement_types': 'quartz'})
        self.assertEqual(resp.data['count'], 1)

    def test_imported_flag(self):
        resp = self.client.get(reverse('watch-list'), {'imported': 'true'})
        self.assertEqual(resp.data['count'], 1)
        resp = self.client.get(reverse('watch-list'), {'imported': 'false'})
        self.assertEqual(resp.data['count'], 1)

    def test_list_serializer_exposes_source_fields(self):
        resp = self.client.get(reverse('watch-list'))
        row = next(r for r in resp.data['results'] if r['slug'] == 'omega-seamaster-import')
        self.assertEqual(row['currency'], 'USD')
        self.assertEqual(row['availability'], 'in_stock')
        self.assertEqual(row['source'], 'teddy_baldassarre')
        self.assertEqual(row['sources'], 'teddy_baldassarre,watchmaxx')
        self.assertEqual(row['movement_type'], 'quartz')

import os
import shutil
import random
from django.core.management.base import BaseCommand
from django.core.files.images import ImageFile
from django.conf import settings
from watches.models import Brand, Category, Collection, Watch, WatchImage

class Command(BaseCommand):
    help = 'Seeds the database with initial luxury watch data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding data...')
        
        # Clear existing data
        Watch.objects.all().delete()
        Brand.objects.all().delete()
        Category.objects.all().delete()
        Collection.objects.all().delete()
        
        # Create Brands
        brands_data = [
            {'name': 'Rolex', 'founded_year': 1905, 'country': 'Switzerland'},
            {'name': 'Omega', 'founded_year': 1848, 'country': 'Switzerland'},
            {'name': 'Patek Philippe', 'founded_year': 1839, 'country': 'Switzerland'},
            {'name': 'Audemars Piguet', 'founded_year': 1875, 'country': 'Switzerland'},
            {'name': 'TAG Heuer', 'founded_year': 1860, 'country': 'Switzerland'},
        ]
        
        brands = {}
        for b_data in brands_data:
            b = Brand.objects.create(**b_data)
            brands[b.name] = b
            
        # Create Categories
        cats_data = ['Dress', 'Sport', 'Dive', 'Pilot', 'Chronograph']
        categories = {}
        for c_data in cats_data:
            c = Category.objects.create(name=c_data)
            categories[c.name] = c
            
        # Create Watches
        watches_data = [
            {
                'title': 'Submariner Date',
                'brand': brands['Rolex'],
                'category': categories['Dive'],
                'price': 10250.00,
                'reference_number': '126610LN',
                'movement': 'automatic',
                'case_size': '41mm',
                'case_material': 'Oystersteel',
                'dial_color': 'Black',
                'strap_material': 'Oystersteel',
                'water_resistance': '300m',
                'description': 'The Rolex Submariner Date is the quintessential dive watch.',
                'is_featured': True,
                'is_trending': True,
                'is_best_seller': True,
            },
            {
                'title': 'Speedmaster Professional Moonwatch',
                'brand': brands['Omega'],
                'category': categories['Chronograph'],
                'price': 7000.00,
                'discount_price': 6500.00,
                'reference_number': '310.30.42.50.01.001',
                'movement': 'manual',
                'case_size': '42mm',
                'case_material': 'Stainless Steel',
                'dial_color': 'Black',
                'strap_material': 'Stainless Steel',
                'water_resistance': '50m',
                'description': 'The Moonwatch is one of the world\'s most iconic timepieces.',
                'is_featured': True,
                'is_new_arrival': True,
                'is_best_seller': True,
            },
            {
                'title': 'Nautilus',
                'brand': brands['Patek Philippe'],
                'category': categories['Sport'],
                'price': 35000.00,
                'reference_number': '5711/1A',
                'movement': 'automatic',
                'case_size': '40mm',
                'case_material': 'Stainless Steel',
                'dial_color': 'Blue Gradient',
                'strap_material': 'Stainless Steel',
                'water_resistance': '120m',
                'description': 'The Nautilus epitomizes the elegant sports watch.',
                'is_featured': True,
                'is_trending': True,
            },
            {
                'title': 'Royal Oak Selfwinding',
                'brand': brands['Audemars Piguet'],
                'category': categories['Sport'],
                'price': 27000.00,
                'reference_number': '15500ST',
                'movement': 'automatic',
                'case_size': '41mm',
                'case_material': 'Stainless Steel',
                'dial_color': 'Blue',
                'strap_material': 'Stainless Steel',
                'water_resistance': '50m',
                'description': 'The Royal Oak overturned prevailing codes in 1972.',
                'is_trending': True,
            },
            {
                'title': 'Monaco Calibre 11',
                'brand': brands['TAG Heuer'],
                'category': categories['Chronograph'],
                'price': 7500.00,
                'reference_number': 'CAW211P.FC6356',
                'movement': 'automatic',
                'case_size': '39mm',
                'case_material': 'Stainless Steel',
                'dial_color': 'Blue',
                'strap_material': 'Leather',
                'water_resistance': '100m',
                'description': 'The classic square-faced chronograph.',
                'is_new_arrival': True,
            },
        ]
        
        for w_data in watches_data:
            watch = Watch.objects.create(**w_data)
            self.stdout.write(f'Created {watch}')
            
        self.stdout.write(self.style.SUCCESS('Successfully seeded data'))

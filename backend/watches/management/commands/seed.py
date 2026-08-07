from django.core.management.base import BaseCommand
from watches.models import Brand, Category, Watch
import random

class Command(BaseCommand):
    help = 'Seed database with sample watches'

    def handle(self, *args, **kwargs):
        Brand.objects.all().delete()
        Category.objects.all().delete()
        Watch.objects.all().delete()

        rolex = Brand.objects.create(name='Rolex', description='Swiss luxury watchmaker')
        omega = Brand.objects.create(name='Omega', description='Swiss luxury watchmaker')
        ap = Brand.objects.create(name='Audemars Piguet', description='Swiss manufacturer of luxury watches')

        diver = Category.objects.create(name='Diver')
        chrono = Category.objects.create(name='Chronograph')
        dress = Category.objects.create(name='Dress')

        watches = [
            {
                'title': 'Submariner Date',
                'brand': rolex,
                'category': diver,
                'price': 10250.00,
                'reference_number': '126610LN',
                'movement': 'automatic',
                'case_size': '41mm',
                'case_material': 'Oystersteel',
                'dial_color': 'Black',
                'strap_material': 'Oystersteel',
                'water_resistance': '300m',
                'description': 'The ultimate dive watch.',
                'is_featured': True
            },
            {
                'title': 'Speedmaster Moonwatch',
                'brand': omega,
                'category': chrono,
                'price': 7000.00,
                'reference_number': '310.30.42.50.01.002',
                'movement': 'manual',
                'case_size': '42mm',
                'case_material': 'Steel',
                'dial_color': 'Black',
                'strap_material': 'Steel',
                'water_resistance': '50m',
                'description': 'The first watch on the moon.',
                'is_featured': True
            },
            {
                'title': 'Royal Oak Offshore',
                'brand': ap,
                'category': chrono,
                'price': 42500.00,
                'reference_number': '26420SO',
                'movement': 'automatic',
                'case_size': '43mm',
                'case_material': 'Steel/Ceramic',
                'dial_color': 'Black',
                'strap_material': 'Rubber',
                'water_resistance': '100m',
                'description': 'A bold and iconic design.',
                'is_featured': True
            }
        ]

        for w_data in watches:
            Watch.objects.create(**w_data)

        self.stdout.write(self.style.SUCCESS('Successfully seeded database.'))

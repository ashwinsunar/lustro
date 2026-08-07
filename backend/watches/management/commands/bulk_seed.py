import urllib.request
from io import BytesIO
from uuid import uuid4
from django.core.management.base import BaseCommand
from django.core.files.images import ImageFile
from watches.models import Brand, Category, Watch, WatchImage

# Free-license watch photography (Unsplash). Rotated across all watches.
IMAGE_POOL = [
    'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1622434641406-a158123450f9?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1594534475808-b18fc33b045e?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1622260614153-03223fb72052?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?auto=format&fit=crop&w=1000&q=80',
]

BRANDS = [
    {'name': 'Rolex', 'founded_year': 1905, 'country': 'Switzerland'},
    {'name': 'Omega', 'founded_year': 1848, 'country': 'Switzerland'},
    {'name': 'Patek Philippe', 'founded_year': 1839, 'country': 'Switzerland'},
    {'name': 'Audemars Piguet', 'founded_year': 1875, 'country': 'Switzerland'},
    {'name': 'IWC', 'founded_year': 1868, 'country': 'Switzerland'},
    {'name': 'Breitling', 'founded_year': 1884, 'country': 'Switzerland'},
    {'name': 'Cartier', 'founded_year': 1847, 'country': 'France'},
    {'name': 'TAG Heuer', 'founded_year': 1860, 'country': 'Switzerland'},
    {'name': 'Tudor', 'founded_year': 1926, 'country': 'Switzerland'},
    {'name': 'Jaeger-LeCoultre', 'founded_year': 1833, 'country': 'Switzerland'},
]

CATEGORIES = ['Dress', 'Sport', 'Dive', 'Pilot', 'Chronograph', 'GMT']

MODELS = {
    'Rolex': [
        ('Submariner Date', 'Dive', '126610LN', 'automatic', '41mm', 'Oystersteel', 'Black', 'Oystersteel', '300m', 10250),
        ('Datejust 41', 'Dress', '126334', 'automatic', '41mm', 'Oystersteel & White Gold', 'Blue', 'Oystersteel', '100m', 15450),
        ('GMT-Master II', 'GMT', '126710BLRO', 'automatic', '40mm', 'Oystersteel', 'Black/Red', 'Oyster', '100m', 21300),
        ('Daytona', 'Chronograph', '126500LN', 'automatic', '40mm', 'Oystersteel', 'White', 'Oyster', '100m', 41200),
        ('Explorer', 'Sport', '124270', 'automatic', '36mm', 'Oystersteel', 'Black', 'Oyster', '100m', 9775),
        ('Yacht-Master 42', 'Sport', '226659', 'automatic', '42mm', 'White Gold', 'Black', 'Rubber', '100m', 36500),
        ('Milgauss', 'Sport', '116400GV', 'automatic', '40mm', 'Oystersteel', 'Blue', 'Oyster', '100m', 12650),
        ('Datejust 36', 'Dress', '126200', 'automatic', '36mm', 'Oystersteel', 'Slate', 'Jubilee', '100m', 11200),
        ('Oyster Perpetual 41', 'Dress', '124300', 'automatic', '41mm', 'Oystersteel', 'Green', 'Oyster', '100m', 8850),
    ],
    'Omega': [
        ('Speedmaster Moonwatch', 'Chronograph', '310.30.42.50.01.001', 'manual', '42mm', 'Steel', 'Black', 'Leather', '50m', 9950),
        ('Seamaster Diver 300', 'Dive', '210.30.42.20.01.001', 'automatic', '42mm', 'Steel', 'Black', 'Steel', '300m', 3850),
        ('Constellation Globemaster', 'Dress', '130.33.39.89.01.001', 'automatic', '39mm', 'Steel', 'Silver', 'Leather', '100m', 6200),
        ('Aqua Terra 41', 'Dress', '220.10.41.21.06.001', 'automatic', '41mm', 'Steel', 'Sunburst Blue', 'Rubber', '150m', 6200),
        ('Speedmaster Racing', 'Chronograph', '322.13.38.00.01.001', 'automatic', '38mm', 'Steel', 'Red', 'Steel', '50m', 4450),
        ('Seamaster Planet Ocean 43', 'Dive', '453.30.43.20.03.001', 'automatic', '43mm', 'Steel', 'Black', 'Steel', '600m', 7200),
    ],
    'Patek Philippe': [
        ('Nautilus 5712/1A', 'Dress', '5712/1A-001', 'automatic', '40mm', 'Steel', 'Grey', 'Steel', '120m', 128000),
        ('Calatrava 6119', 'Dress', '6119R-001', 'manual', '39mm', 'Rose Gold', 'Silver', 'Leather', '30m', 31400),
        ('Aquanaut', 'Sport', '5167A-001', 'automatic', '40mm', 'Steel', 'Black', 'Rubber', '120m', 36700),
        ('Grand Complication', 'Chronograph', '5270G-001', 'automatic', '41mm', 'White Gold', 'Sunburst', 'Leather', '30m', 485000),
        ('Twenty-4', 'Dress', '730/1200A-001', 'quartz', '31mm', 'Steel', 'White', 'Steel', '30m', 23500),
    ],
    'Audemars Piguet': [
        ('Royal Oak Jumbo', 'Sport', '16202ST.OO.1240ST.01', 'automatic', '39mm', 'Steel', 'Bleu', 'Steel', '50m', 49000),
        ('Royal Oak Offshore', 'Sport', '26420RO.OO.A002CA.01', 'automatic', '42mm', 'Rose Gold', 'Black', 'Rubber', '100m', 86200),
        ('Royal Oak 41 Perpetual', 'Sport', '26574ST.OC.1241ST.01', 'automatic', '41mm', 'Steel', 'Silver', 'Steel', '50m', 214000),
        ('Code 11.59', 'Dress', '15210OR.OO.A002CR.01', 'automatic', '41mm', 'Rose Gold', 'Iced', 'Croco', '30m', 34800),
    ],
    'IWC': [
        ('Big Pilot', 'Pilot', 'IW510401', 'automatic', '43mm', 'Bronze', 'Bronze', 'Leather', '60m', 13500),
        ('Mark XX', 'Pilot', 'IW328201', 'automatic', '41mm', 'Steel', 'Black', 'Leather', '60m', 4890),
        ('Aquatimer', 'Dive', 'IW276407', 'automatic', '43mm', 'Steel', 'Black', 'Rubber', '300m', 6200),
        ('Ingenieur', 'Sport', 'IW328904', 'automatic', '40mm', 'Steel', 'Green', 'Steel', '80m', 10900),
        ('Portugieser', 'Chronograph', 'IW371615', 'automatic', '41mm', 'Rose Steel', 'Champagne', 'Croco', '60m', 9400),
    ],
    'Breitling': [
        ('Navitimer B01', 'Chronograph', 'AB0138211B1S1', 'automatic', '41mm', 'Steel', 'Silver', 'Croco', '30m', 9300),
        ('Superocean Heritage', 'Dive', 'A13313121B1S1', 'automatic', '42mm', 'Steel', 'Blue', 'Steel', '200m', 6200),
        ('Avenger GMT', 'GMT', 'A32397111C1S1', 'automatic', '43mm', 'Steel', 'Black', 'Steel', '300m', 6100),
        ('Chronomat', 'Chronograph', 'AB0134101G1A1', 'automatic', '41mm', 'Steel', 'Mint', 'Steel', '200m', 9600),
        ('Premier Heritage', 'Dress', 'A41310121B1P2', 'automatic', '42mm', 'Steel', 'Blue', 'Croco', '100m', 7700),
    ],
    'Cartier': [
        ('Tank Louis', 'Dress', 'WGTA0011', 'automatic', '35mm', 'Rose Gold', 'Silver', 'Leather', '30m', 16300),
        ('Santos de Cartier', 'Dress', 'WSSA0039', 'automatic', '39.8mm', 'Steel', 'Silver', 'Steel', '100m', 8700),
        ('Ballon Bleu', 'Dress', 'WSBB0023', 'automatic', '42mm', 'Steel', 'Grey', 'Steel', '30m', 8600),
        ('Panthère', 'Dress', 'W2PN0007', 'quartz', '27mm', 'Steel & Gold', 'White', 'Steel', '30m', 15800),
        ('Drive de Cartier', 'Dress', 'WSNM0004', 'automatic', '41mm', 'Pink Gold', 'Blue', 'Leather', '30m', 22500),
    ],
    'TAG Heuer': [
        ('Carrera Chronograph', 'Chronograph', 'CBN2011.FC6492', 'automatic', '44mm', 'Steel', 'Panda', 'Leather', '100m', 6800),
        ('Monaco', 'Chronograph', 'CAW211P.FC6356', 'automatic', '39mm', 'Steel', 'Blue', 'Leather', '100m', 6500),
        ('Aquaracer', 'Dive', 'WBP2110.BA0627', 'automatic', '43mm', 'Steel', 'Green', 'Steel', '300m', 3600),
        ('Formula 1', 'Sport', 'WAZ111A.BA0875', 'quartz', '43mm', 'Steel', 'Black', 'Steel', '200m', 1750),
        ('Autavia', 'Pilot', 'CBE2110.FC8226', 'automatic', '42mm', 'Bronze', 'Brown', 'Leather', '100m', 4700),
    ],
    'Tudor': [
        ('Black Bay 58', 'Dive', 'M79030N-0001', 'automatic', '39mm', 'Steel', 'Black', 'Steel', '200m', 4150),
        ('Pelagos', 'Dive', 'M25600TB-0001', 'automatic', '42mm', 'Titanium', 'Blue', 'Titanium', '500m', 5100),
        ('Black Bay Chrono', 'Chronograph', 'M79360N-0002', 'automatic', '41mm', 'Steel', 'Black', 'Steel', '200m', 5750),
        ('Ranger', 'Sport', 'M79950-0001', 'automatic', '39mm', 'Steel', 'Black', 'Steel', '100m', 3500),
        ('Royal 41', 'Dress', 'M28600-0001', 'automatic', '41mm', 'Steel & Gold', 'Black', 'Steel', '100m', 3400),
    ],
    'Jaeger-LeCoultre': [
        ('Reverso Classic', 'Dress', 'Q397848J', 'manual', '40mm', 'Steel', 'Silver', 'Leather', '30m', 8800),
        ('Master Ultra Thin Moon', 'Dress', 'Q1362520', 'automatic', '39mm', 'Steel', 'Silver', 'Leather', '50m', 12800),
        ('Master Control Chronograph', 'Chronograph', 'Q1538430', 'automatic', '40mm', 'Steel', 'Silver', 'Leather', '50m', 11900),
        ('Polaris', 'Dive', 'Q9008470', 'automatic', '42mm', 'Steel', 'Blue', 'Steel', '100m', 10100),
        ('Master Compressor', 'Sport', 'Q2058470', 'automatic', '42mm', 'Steel', 'Black', 'Rubber', '300m', 11200),
    ],
}

BASE_DESCS = {
    'Dress': 'A {brand} {title} exemplifies {brand} refinement — a precision manufacture movement, hand-finished {material} case, and a dial designed to be noticed without ever demanding attention.',
    'Sport': 'Engineered for presence, this {brand} {title} pairs its manufacture movement with a sporting {strap} strap and water-resistance of {wr}.',
    'Dive': 'A professional {brand} dive instrument certified to {wr}, combining readable luminosity, a unidirectional bezel and a reliable manufacture movement.',
    'Pilot': 'Born for the cockpit, the {brand} {title} balances crisp legibility with {material} construction and a {movement} heart.',
    'Chronograph': 'The {brand} {title} chronograph fuses a {movement} calibre, tachymetric scale and a commanding {material} presence.',
    'GMT': 'A dual-time {brand} instrument with a bi-directional ceramic bezel — the traveller\u2019s choice in {material}.',
}


class Command(BaseCommand):
    help = 'Seeds 100+ products with realistic specs and free-license photos'

    def handle(self, *args, **kwargs):
        Watch.objects.all().delete()
        WatchImage.objects.all().delete()
        Brand.objects.all().delete()
        Category.objects.all().delete()

        cats = {}
        for c in CATEGORIES:
            cats[c] = Category.objects.create(name=c)

        brands = {}
        for b in BRANDS:
            brands[b['name']] = Brand.objects.create(name=b['name'], founded_year=b['founded_year'], country=b['country'])

        created = 0
        idx = 0
        for bname, models in MODELS.items():
            brand = brands[bname]
            for (title, cat_key, ref, movement, size, material, dial, strap, wr, price) in models:
                idx += 1
                ix = idx % len(IMAGE_POOL)
                category = cats[cat_key]
                desc = BASE_DESCS[cat_key].format(brand=brand.name, title=title, material=material, strap=strap, wr=wr, movement=movement)
                watch = Watch.objects.create(
                    title=title, brand=brand, category=category, price=price,
                    reference_number=ref, movement=movement,
                    case_size=size, case_material=material, dial_color=dial,
                    strap_material=strap, water_resistance=wr,
                    gender='unisex', warranty_period='5 Years',
                    description=desc, in_stock=True, stock_count=25,
                    rating=round(4 + (ix % 10) / 10, 2),
                    review_count=8 + (ix * 3) % 40,
                    is_featured=ix % 5 == 0,
                    is_trending=ix % 4 == 0,
                    is_new_arrival=ix % 6 == 0,
                    is_best_seller=ix % 7 == 0,
                )
                url = IMAGE_POOL[ix]
                img = self.fetch(url)
                if img:
                    WatchImage.objects.create(watch=watch, image=img, is_primary=True)
                created += 1
                self.stdout.write(f'[{created}] {brand.name} {title}')

        self.stdout.write(self.style.SUCCESS(f'Done: {created} watches, {len(BRANDS)} brands'))

    def fetch(self, url):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            data = urllib.request.urlopen(req, timeout=30).read()
            return ImageFile(BytesIO(data), name=f'watch-{uuid4().hex[:8]}.jpg')
        except Exception as e:
            self.stdout.write(f'  ! image fail: {e}')
            return None

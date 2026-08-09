"""Offline bulk seed: reuses local media images instead of downloading from Unsplash."""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.core.files import File as DjangoFile
from watches.models import Brand, Category, Collection, Watch, WatchImage

from watches.management.commands.bulk_seed import (
    BRANDS, MODELS, CATEGORIES, COLLECTIONS, GENDER_OVERRIDES, BASE_DESCS, IMAGE_POOL,
)

IMAGE_DIR = Path(__file__).resolve().parents[3] / 'media' / 'watches'


def main():
    local_images = sorted(IMAGE_DIR.glob('*.jpg'))
    if not local_images:
        print('No local images found in', IMAGE_DIR)
        sys.exit(1)
    print(f'Using {len(local_images)} local images')

    Watch.objects.all().delete()
    WatchImage.objects.all().delete()
    Brand.objects.all().delete()
    Category.objects.all().delete()
    Collection.objects.all().delete()

    cats = {c: Category.objects.create(name=c) for c in CATEGORIES}
    collections = {
        col['name']: Collection.objects.create(name=col['name'], description=col['description'], featured=col['featured'])
        for col in COLLECTIONS
    }
    brands = {
        b['name']: Brand.objects.create(name=b['name'], founded_year=b['founded_year'], country=b['country'], description=b['description'])
        for b in BRANDS
    }

    created = 0
    idx = 0
    for bi in BRANDS:
        brand = brands[bi['name']]
        collection = collections[bi['collection']]
        for (title, cat_key, ref, movement, size, material, dial, strap, wr, price) in MODELS[bi['name']]:
            idx += 1
            category = cats[cat_key]
            desc = BASE_DESCS[cat_key].format(brand=brand.name, title=title, material=material, strap=strap, wr=wr, movement=movement)
            discount = None
            if idx % 3 == 0 and price > 3000:
                discount = round(price * (1 - (0.08 + (idx % 4) / 100)), 2)
            watch = Watch.objects.create(
                title=title, brand=brand, category=category, collection=collection, price=price,
                discount_price=discount,
                reference_number=ref, movement=movement,
                case_size=size, case_material=material, dial_color=dial,
                strap_material=strap, water_resistance=wr,
                gender=GENDER_OVERRIDES.get(title, 'men'), warranty_period='5 Years',
                description=desc, in_stock=True, stock_count=25,
                rating=round(4 + (idx % 10) / 10, 2),
                review_count=8 + (idx * 3) % 40,
                is_featured=idx % 5 == 0,
                is_trending=idx % 4 == 0,
                is_new_arrival=idx % 6 == 0,
                is_best_seller=idx % 7 == 0,
            )
            img_path = local_images[idx % len(local_images)]
            with img_path.open('rb') as f:
                WatchImage.objects.create(watch=watch, image=DjangoFile(f, name=img_path.name), is_primary=True)
            created += 1
            print(f'[{created}] {brand.name} {title}')

    print(f'Done: {created} watches, {len(BRANDS)} brands')


if __name__ == '__main__':
    main()
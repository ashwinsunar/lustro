"""Offline bulk seed: reuses local media images instead of downloading from Unsplash.

Each watch gets a visually distinct variant (crop/zoom/rotation/grade) of one of the
unique local photos, so 54 watches never share an identical image.
"""

import hashlib
import io
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from PIL import Image, ImageEnhance, ImageOps
from django.core.files import File as DjangoFile
from watches.models import Brand, Category, Collection, Watch, WatchImage

from watches.management.commands.bulk_seed import (
    BRANDS, MODELS, CATEGORIES, COLLECTIONS, GENDER_OVERRIDES, BASE_DESCS, IMAGE_POOL,
)

IMAGE_DIR = Path(__file__).resolve().parents[3] / 'media' / 'watches'

TARGET = (1200, 1200)


def _unique_photos():
    """Return one file path per distinct photo (by md5), so identical downloads collapse."""
    seen = {}
    for p in sorted(IMAGE_DIR.glob('*.jpg')):
        digest = hashlib.md5(p.read_bytes()).hexdigest()
        seen.setdefault(digest, p)
    return list(seen.values())


def _variant(photo: Path, idx: int):
    """Produce a distinct 1200x1200 JPEG from a base photo using a deterministic recipe.

    idx rotates through 13 recipes; photos are large (1000x1500), so we crop a
    1200x1200-ish window with per-index zoom, vertical focus and slight rotation.
    """
    im = Image.open(photo).convert('RGB')
    zoom = 1.06 + (idx % 9) * 0.10          # 1.06x .. 1.86x
    focus_y = ((idx * 53) % 100) / 100      # vertical crop anchor 0..1
    flip = (idx % 7) == 0                   # occasional mirror for variety
    if flip:
        im = ImageOps.mirror(im)

    cw = int(min(im.width, im.height * (im.width / im.height)))
    ch = int(cw / (TARGET[0] / TARGET[1]))
    ch = min(ch, im.height)
    x0 = (im.width - cw) // 2
    y0 = max(0, min(int((im.height - ch) * focus_y), im.height - ch))
    crop = im.crop((x0, y0, x0 + cw, y0 + ch))

    if zoom > 1:
        crop = crop.resize((int(cw * zoom), int(ch * zoom)), Image.LANCZOS)
    crop = crop.crop((
        (crop.width - TARGET[0]) // 2,
        (crop.height - TARGET[1]) // 2,
        (crop.width - TARGET[0]) // 2 + TARGET[0],
        (crop.height - TARGET[1]) // 2 + TARGET[1],
    ))

    if idx % 3 == 1:
        crop = ImageEnhance.Color(crop).enhance(1.12)
    elif idx % 3 == 2:
        crop = ImageEnhance.Brightness(crop).enhance(0.94)
    if idx % 5 == 0:
        crop = ImageOps.grayscale(crop).convert('RGB')

    return crop


def main():
    photos = _unique_photos()
    if not photos:
        print('No local images found in', IMAGE_DIR)
        sys.exit(1)
    print(f'Using {len(photos)} unique photos')

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
            variant = _variant(photos[idx % len(photos)], idx)
            buf = io.BytesIO()
            variant.save(buf, 'JPEG', quality=88)
            buf.seek(0)
            WatchImage.objects.create(
                watch=watch,
                image=DjangoFile(buf, name=f'watch-{idx:03d}-v{idx % 13}.jpg'),
                is_primary=True,
            )
            created += 1
            print(f'[{created}] {brand.name} {title}')

    print(f'Done: {created} watches, {len(BRANDS)} brands')


if __name__ == '__main__':
    main()
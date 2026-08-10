"""Fix images for specific watches that have wrong/incorrect images."""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from watches.models import Watch, WatchImage
from django.core.files import File as DjangoFile
import hashlib
from PIL import Image, ImageEnhance, ImageOps
import io

TARGET = (1200, 1200)
IMAGE_DIR = Path(__file__).resolve().parents[3] / 'media' / 'watches'

# Watches that need image fixes (slug -> brand keyword for matching)
FIXES = {
    'jaeger-lecoultre-master-control-chronograph-q1538430': 'jaeger',
    'jaeger-lecoultre-master-ultra-thin-moon-q1362520': 'jaeger',
    'tag-heuer-formula-1-waz111aba0875': 'tag',
}


def _unique_photos():
    """Return one file path per distinct photo (by md5)."""
    seen = {}
    for p in sorted(IMAGE_DIR.glob('*.jpg')):
        digest = hashlib.md5(p.read_bytes()).hexdigest()
        seen.setdefault(digest, p)
    return list(seen.values())


def _variant(photo: Path, idx: int):
    """Produce a distinct 1200x1200 JPEG from a base photo."""
    im = Image.open(photo).convert('RGB')
    zoom = 1.06 + (idx % 9) * 0.10
    focus_y = ((idx * 53) % 100) / 100
    flip = (idx % 7) == 0
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
    
    print(f'Found {len(photos)} unique photos')
    
    fixed = 0
    for slug, brand_keyword in FIXES.items():
        try:
            watch = Watch.objects.get(slug=slug)
            print(f'\nFixing: {watch.brand.name} {watch.title} ({slug})')
            
            # Delete old images
            old_count = WatchImage.objects.filter(watch=watch).count()
            WatchImage.objects.filter(watch=watch).delete()
            print(f'  Removed {old_count} old images')
            
            # Assign a new image based on watch id for variety
            idx = watch.id % len(photos)
            variant = _variant(photos[idx], watch.id)
            
            buf = io.BytesIO()
            variant.save(buf, 'JPEG', quality=88)
            buf.seek(0)
            
            WatchImage.objects.create(
                watch=watch,
                image=DjangoFile(buf, name=f'watch-{watch.id:03d}-fixed.jpg'),
                is_primary=True,
            )
            print(f'  Added new image: watch-{watch.id:03d}-fixed.jpg')
            fixed += 1
            
        except Watch.DoesNotExist:
            print(f'  Watch not found: {slug}')
    
    print(f'\nDone: Fixed {fixed} watches')


if __name__ == '__main__':
    main()

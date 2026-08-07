from io import BytesIO
import urllib.request
import uuid

from django.core.management.base import BaseCommand
from django.core.files.images import ImageFile

from watches.models import WatchImage


class Command(BaseCommand):
    help = 'Re-downloads any WatchImage whose file is missing from disk, keeping DB rows intact.'

    def handle(self, *args, **kwargs):
        missing = 0
        repaired = 0
        failed = 0
        for wi in WatchImage.objects.select_related('watch').all().order_by('id'):
            if wi.image and wi.image.storage.exists(wi.image.name):
                continue
            missing += 1
            url = self._url_for(wi)
            if not url:
                failed += 1
                self.stdout.write(f'  ! no URL for image #{wi.id} ({wi.watch.title})')
                continue
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                data = urllib.request.urlopen(req, timeout=60).read()
                name = f'watch-{uuid.uuid4().hex[:8]}.jpg'
                wi.image.save(name, ImageFile(BytesIO(data)), save=True)
                repaired += 1
                self.stdout.write(f'  + {wi.watch.title} -> {wi.image.name}')
            except Exception as e:
                failed += 1
                self.stdout.write(f'  ! {wi.watch.title}: {e}')

        self.stdout.write(
            self.style.SUCCESS(f'Done: {missing} missing files, {repaired} repaired, {failed} failed.')
        )

    def _url_for(self, wi):
        # bulk_seed assigned the i-th image (1-based) to pool[(i) % len(pool)]
        # via creation order; replay that mapping by re-reading the pool in order.
        from watches.management.commands.bulk_seed import IMAGE_POOL
        idx = WatchImage.objects.filter(id__lte=wi.id).count()
        return IMAGE_POOL[(idx - 1) % len(IMAGE_POOL)] if IMAGE_POOL else None
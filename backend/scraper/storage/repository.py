"""Django ORM storage for normalized watches (Phase 8).

Upsert strategy (stable across runs):
  1. (source, source_product_id) identity  -> update that row
  2. reference_number match (exact, case-insensitive) + brand equality -> merge
  3. sku match + brand equality -> merge
  4. otherwise insert a new catalogue row

Never creates duplicate rows for the same underlying watch; merging keeps the
retail-facing fields refreshed while preserving catalogue flags (featured,
trending, reviews, rating) attached to the original row.

Django models are imported lazily so parsers/normalizer stay framework-free.
"""
from __future__ import annotations

import logging
from decimal import Decimal, InvalidOperation
from typing import Optional

from django.db.models import Count

from scraper.models.watch import NormalizedWatch
from scraper.validation.quality import validate as validate_watch

logger = logging.getLogger('scraper.storage')


def _decimal(value, places: int = 2) -> Optional[Decimal]:
    if value is None:
        return None
    try:
        return Decimal(str(value)).quantize(Decimal(f'1.{"0" * places}'))
    except (InvalidOperation, ValueError):
        return None


class Repository:
    """Stores NormalizedWatches into the Lustro catalog via Django ORM."""

    def __init__(self, dry_run: bool = False) -> None:
        self.dry_run = dry_run

    def _models(self):
        from watches.models import Brand, Category, Watch  # noqa: PLC0415

        return Brand, Category, Watch

    def _get_brand(self, Brand, name: str):
        if not name:
            return None
        name = name.strip()
        brand = Brand.objects.filter(name__iexact=name).first()
        if brand is None:
            brand = Brand.objects.create(name=name)
        return brand

    def upsert(self, watch: NormalizedWatch) -> tuple[str, object | None]:
        """Insert or merge; returns ('inserted'|'updated'|'invalid'|'failed', row_or_None) and stats."""
        vr = validate_watch(watch)
        if not vr.valid:
            watch.quality = 'flagged'
            return 'invalid', None
        watch.quality = vr.quality

        Brand, Category, Watch = self._models()
        brand = self._get_brand(Brand, watch.brand)
        if brand is None:
            return 'invalid', None
        category = None
        if watch.category:
            category = Category.objects.get_or_create(name=watch.category.strip())[0]

        ref = watch.reference_number.strip().upper()
        sku = watch.sku.strip()
        source_id = watch.source_product_id.strip()

        data = {
            'title': (watch.title or watch.model or f'{watch.brand} {ref}'.strip() or 'Untitled')[:200],
            'brand': brand,
            'category': category,
            'price': _decimal(watch.price),
            'discount_price': _decimal(watch.original_price),
            'currency': (watch.currency or 'CHF')[:3],
            'reference_number': ref,
            'sku': sku[:120],
        }
        if data['price'] is None:
            return 'invalid', None

        data.update({
            'movement': watch.movement or 'automatic',
            'movement_type': watch.movement_type,
            'caliber': watch.caliber[:100],
            'power_reserve': watch.power_reserve[:50],
            'case_size': (watch.case_diameter or '')[:50],
            'case_shape': watch.case_shape[:100],
            'case_diameter_mm': _decimal(watch.case_diameter_mm, 1),
            'case_thickness_mm': _decimal(watch.case_thickness_mm, 1),
            'lug_to_lug_mm': _decimal(watch.lug_to_lug_mm, 1),
            'case_material': watch.case_material[:100] or 'Other',
            'crystal': watch.crystal[:100],
            'bezel': watch.bezel[:100],
            'dial_color': watch.dial_color[:100],
            'strap_material': watch.strap_material[:100] or 'Other',
            'bracelet_material': watch.bracelet_material[:100],
            'clasp': watch.clasp[:100],
            'water_resistance': watch.water_resistance[:50],
            'water_resistance_m': watch.water_resistance_m,
            'functions': ', '.join(watch.functions)[:2000],
            'gender': watch.gender or 'unisex',
            'year': watch.year[:20],
            'limited_edition': bool(watch.limited_edition),
            'warranty_period': watch.warranty[:50] or 'Not specified',
            'country': watch.country[:100],
            'description': watch.description[:5000],
            'in_stock': watch.availability != 'out_of_stock',
            'stock_count': 1 if watch.availability == 'in_stock' else 0,
            'availability': watch.availability[:20],
            'source': watch.source,
            'source_product_id': source_id,
            'source_url': watch.source_url,
            'image_url': watch.image_url,
            'image_license': watch.image_license or 'retailer-copyright',
            'image_attribution': watch.image_attribution,
            'data_quality': watch.quality or 'ok',
        })

        if self.dry_run:
            return 'inserted', None

        # --- reconcile ------------------------------------------------
        existing = None
        if watch.source and source_id:
            existing = Watch.objects.filter(source=watch.source, source_product_id=source_id).first()

        if existing is None and ref:
            by_ref = (
                Watch.objects.filter(reference_number__iexact=ref)
                .select_related('brand')
                .first()
            )
            if by_ref and by_ref.brand.name.lower() == brand.name.lower():
                existing = by_ref
        if existing is None and sku:
            by_sku = (
                Watch.objects.filter(sku__iexact=sku)
                .select_related('brand')
                .first()
            )
            if by_sku and by_sku.brand.name.lower() == brand.name.lower():
                existing = by_sku

        if existing is not None:
            # merge: refresh retail fields; keep catalogue flags & reviews
            for fld, val in data.items():
                if fld in ('brand', 'category', 'title', 'price', 'discount_price', 'currency'):
                    continue
                setattr(existing, fld, val)
            if data['price'] is not None:
                existing.price = data['price']
            if data['discount_price'] is not None:
                existing.discount_price = data['discount_price']
            existing.currency = data['currency'] or existing.currency
            if watch.source:
                known = {s.strip() for s in (existing.sources or '').split(',') if s.strip()}
                known.add(watch.source)
                existing.sources = ','.join(sorted(known))
                existing.source = watch.source
            existing.save()
            return 'updated', existing

        try:
            obj = Watch(**data)
            obj.save()
            return 'inserted', obj
        except Exception as exc:  # noqa: BLE001 - DB constraint/type issues logged, never crash run
            logger.warning('insert failed %s/%s: %s', watch.source, source_id, exc)
            return 'failed', None

    def count_by_source(self) -> dict[str, int]:
        Watch = self._models()[2]
        rows = (
            Watch.objects.exclude(source='')
            .values('source')
            .annotate(total=Count('id'))
            .order_by('source')
        )
        return {r['source']: r['total'] for r in rows}


__all__ = ['Repository', '_decimal']
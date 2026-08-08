"""Data-quality validation (Phase 13).

A watch is rejected when critical fields are missing/malformed:
  - brand missing
  - model missing (title used as fallback)
  - price malformed
  - URL invalid
  - clearly not a watch (e.g. strap-only products, gift cards)
Non-critical gaps lower the quality flag: 'ok' | 'partial' | 'flagged'.

Policies:
  * Nothing is fabricated: unknown values stay None/''.
  * Validation is deterministic and unit-testable.
"""
from __future__ import annotations

import re

from scraper.models.watch import NormalizedWatch
from scraper.parsers.strings import clean, is_url

NOT_WATCH_MARKERS = (
    'strap', 'band', 'buckle', 'bracelet only', 'gift card', 'watch box',
    'winder', 'tool', 'kit', 'display case', 'accessory', 'travel roll',
)


class ValidationResult:
    __slots__ = ('valid', 'errors', 'warnings', 'quality')

    def __init__(self, valid: bool, errors: list[str], warnings: list[str], quality: str) -> None:
        self.valid = valid
        self.errors = errors
        self.warnings = warnings
        self.quality = quality

    def __repr__(self) -> str:  # pragma: no cover
        return f'ValidationResult(valid={self.valid}, quality={self.quality})'


def validate(watch: NormalizedWatch) -> ValidationResult:
    errors: list[str] = []
    warnings: list[str] = []

    brand = clean(watch.brand)
    model = clean(watch.model or watch.title)
    price = watch.price

    if not brand:
        errors.append('brand is missing')

    if not model:
        errors.append('model is missing')

    if price is None:
        errors.append('price is malformed/missing')
    else:
        try:
            if float(price) <= 0:
                errors.append('price must be positive')
        except (TypeError, ValueError):
            errors.append('price is malformed')

    if watch.source_url and not is_url(watch.source_url):
        errors.append('source_url is invalid')
    if watch.image_url and not is_url(watch.image_url):
        warnings.append('image_url is invalid')

    # clearly-not-a-watch heuristic (title + model + description)
    haystack = f"{watch.title} {watch.model} {watch.description}".lower()
    if any(marker in haystack for marker in NOT_WATCH_MARKERS) and not any(
        word in haystack for word in ('watch', 'timepiece', 'chronograph', 'calibre', 'movement')
    ):
        errors.append('product does not appear to be a watch')

    if not watch.reference_number and not watch.sku:
        warnings.append('no reference number or sku (dedupe weakened)')
    if not watch.movement:
        warnings.append('movement unknown')
    if not watch.case_diameter_mm and not watch.case_diameter:
        warnings.append('case diameter unknown')
    if watch.original_price is not None and price is not None:
        try:
            if float(watch.original_price) < float(price):
                warnings.append('original price below current price')
        except (TypeError, ValueError):
            pass

    quality = 'ok'
    if errors:
        quality = 'flagged'
    elif len(warnings) >= 2:
        quality = 'partial'

    return ValidationResult(valid=not errors, errors=errors, warnings=warnings, quality=quality)
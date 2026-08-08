"""Swiss Timepieces Nepal — MANUAL.

Probe results (2026-08): site built on GoDaddy Website Builder 8. Pages are
server-rendered static-ish but carry no prices, no JSON-LD, no product
schema, no shop/cart structure. Catalogue appears to be presented via
appointments/WhatsApp. No permitted automated access to a structured
catalog exists today. Status: MANUAL.
"""
from __future__ import annotations

from typing import Iterable

from scraper.models.watch import RawProduct
from scraper.sources.base import SourceAdapter, register_slug


@register_slug
class SwissTimepiecesNepalAdapter(SourceAdapter):
    slug = 'swiss_timepieces_nepal'
    display_name = 'Swiss Timepieces Nepal'
    base_url = 'https://swisstimepiecesnepal.com'
    status = 'manual'
    note = (
        'GoDaddy Website Builder site: no prices, JSON-LD or product schema '
        'server-rendered; catalogue delivered via appointment. Manual entry only.'
    )

    def discover_urls(self, max_pages: int = 5) -> Iterable[str]:
        return iter(())

    def parse_product(self, html: str, url: str) -> RawProduct | None:
        return None
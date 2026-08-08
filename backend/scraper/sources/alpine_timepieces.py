"""Alpine Timepieces — UNSUPPORTED (structured access).

Probe results (2026-08): robots.txt is Cloudflare-managed and allows
generic crawlers for search (search=yes, use=reference), but the site is a
Next.js client-side shell: `/sitemap.xml` returns an HTML page (no <loc>
entries), the home page exposes no server-rendered product links or
structured product data. Without a sitemap or JSON-LD we have no permitted
way to enumerate products reliably. Marked UNSUPPORTED for automated
ingestion; revisit if a sitemap appears.
"""
from __future__ import annotations

from typing import Iterable

from scraper.models.watch import RawProduct
from scraper.sources.base import SourceAdapter, register_slug


@register_slug
class AlpineTimepiecesAdapter(SourceAdapter):
    slug = 'alpine_timepieces'
    display_name = 'Alpine Timepieces'
    base_url = 'https://alpinetimepieces.com'
    status = 'unsupported'
    note = 'Next.js CSR shell; /sitemap.xml has no <loc> entries; no JSON-LD/OG product data on pages.'

    def discover_urls(self, max_pages: int = 5) -> Iterable[str]:
        return iter(())

    def parse_product(self, html: str, url: str) -> RawProduct | None:
        return None
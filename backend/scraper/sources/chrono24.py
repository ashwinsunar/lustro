"""Chrono24 — BLOCKED (documented, not scraped).

Probe results (2026-08): every request (robots.txt included) returns
HTTP 403 from Cloudflare; robots.txt disallows a long list of crawler
agents; the marketplace requires an account for most product detail API
calls. There is no permitted, reliable machine-access path today.
Per project policy we do not attempt any bypass. Status: BLOCKED.
"""
from __future__ import annotations

from typing import Iterable

from scraper.models.watch import RawProduct
from scraper.sources.base import SourceAdapter, register_slug


@register_slug
class Chrono24Adapter(SourceAdapter):
    slug = 'chrono24'
    display_name = 'Chrono24'
    base_url = 'https://www.chrono24.com'
    status = 'blocked'
    note = (
        'All requests return HTTP 403 (Cloudflare WAF); robots.txt disallows most '
        'crawlers. No permitted public data API. Not scraped per policy.'
    )

    def discover_urls(self, max_pages: int = 5) -> Iterable[str]:
        return iter(())

    def parse_product(self, html: str, url: str) -> RawProduct | None:
        return None
"""Regency Watch Nepal — UNSUPPORTED.

The domain `regencywatchnepal.com` does not resolve (NXDOMAIN, 2026-08 probe);
no stable public catalog was reachable. Marked UNSUPPORTED until a working
domain or permitted feed is verified.
"""
from __future__ import annotations

from typing import Iterable

from scraper.models.watch import RawProduct
from scraper.sources.base import SourceAdapter, register_slug


@register_slug
class RegencyWatchNepalAdapter(SourceAdapter):
    slug = 'regency_watch_nepal'
    display_name = 'Regency Watch Nepal'
    base_url = ''
    status = 'unsupported'
    note = 'Domain does not resolve (NXDOMAIN on probe). Revisit when a working URL is provided.'

    def discover_urls(self, max_pages: int = 5) -> Iterable[str]:
        return iter(())

    def parse_product(self, html: str, url: str) -> RawProduct | None:
        return None
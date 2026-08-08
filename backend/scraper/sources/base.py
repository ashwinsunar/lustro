"""Source adapter interface (Phase 3).

Every retailer implements this contract; adding a source = adding one module
and registering it in registry.py. Nothing else changes.

The pipeline per source:
    discover()  -> listing/product URLs (bounded)
    fetch(item) -> html (via PoliteClient, robots-aware)
    parse(html, url) -> RawProduct | None
    normalize (shared) -> NormalizedWatch
"""
from __future__ import annotations

import abc
import logging
from typing import Iterable

from scraper.models.watch import NormalizedWatch, RawProduct
from scraper.normalizer.watch_normalizer import normalize_watch
from scraper.safety.http import PoliteClient, SourceRunnerStats
from scraper.validation.quality import validate as validate_watch

logger = logging.getLogger('scraper.sources')


class SourceAdapter(abc.ABC):
    """Common interface every data source implements."""

    slug: str = ''              # canonical source key, e.g. "watches_of_switzerland"
    display_name: str = ''      # human label
    base_url: str = ''          # scheme+host
    default_category: str = ''  # fallback category label when unknown

    # Compliance posture
    #   active       — robots-verified crawlable
    #   partial      — works today but fragile (CF-fronted etc.)
    #   blocked      — anti-bot / robots disallow; run() returns immediately
    #   unsupported  — no viable permitted access method
    status: str = 'active'
    note: str = ''

    def __init__(self, client: PoliteClient | None = None) -> None:
        self.client = client or PoliteClient()
        self.stats = SourceRunnerStats()

    # -- hooks -------------------------------------------------------
    @abc.abstractmethod
    def discover_urls(self, max_pages: int = 5) -> Iterable[str]:
        """Yield product listing/product URLs for this crawl (bounded)."""

    @abc.abstractmethod
    def parse_product(self, html: str, url: str) -> RawProduct | None:
        """Extract a RawProduct from a fetched page. Return None to skip."""

    # -- shared helpers ----------------------------------------------
    def fetch(self, url: str):
        return self.client.get(url)

    def run(self, max_pages: int = 5, max_products: int = 100, dry_run: bool = False):
        """Execute the whole per-source pipeline: discover -> parse -> normalize -> validate.

        Yields (NormalizedWatch, url) tuples; stats accumulated on self.stats.
        Storage is performed by the jobs layer (keeps adapters DB-free)."""
        if self.status in ('blocked', 'unsupported'):
            self.stats.errors.append(f'{self.display_name}: {self.note}')
            return

        seen: set[str] = set()
        for url in self.discover_urls(max_pages=max_pages):
            self.stats.products_found += 1
            if url in seen:
                continue
            seen.add(url)
            if self.stats.products_parsed >= max_products:
                break
            try:
                resp = self.fetch(url)
            except Exception as exc:  # noqa: BLE001 - one bad page must not kill the run
                self.stats.errors.append(f'{url}: {exc}')
                logger.warning('%s fetch failed: %s', self.display_name, exc)
                continue
            if resp.status_code != 200:
                self.stats.errors.append(f'{url}: HTTP {resp.status_code}')
                continue

            raw = self.parse_product(resp.text, url)
            if raw is None:
                self.stats.products_invalid += 1
                continue
            raw.source = self.slug
            if not raw.source_product_id:
                raw.source_product_id = self._product_id(url, raw)
            if not raw.source_url:
                raw.source_url = url
            if not raw.category and self.default_category:
                raw.category = self.default_category
            if not raw.image_license:
                raw.image_license = 'retailer-copyright'
            if not raw.image_attribution:
                raw.image_attribution = self.display_name

            normalized = normalize_watch(raw)
            self.stats.products_parsed += 1
            yield normalized
        else:
            logger.warning(f'{self.display_name}: discover_urls returned nothing.')

    # -- misc ---------------------------------------------------------
    @staticmethod
    def _url_product_id(url: str) -> str:
        """Best-effort stable id from the product URL (e.g. trailing /p/12345)."""
        import hashlib
        import re

        m = re.search(r'/p/(\d+)', url)
        if m:
            return m.group(1)
        # trailing reference-ish token: /Brand-Model-REF12345.html
        m = re.search(r'/([A-Za-z0-9+._-]+?)-(\d{4,})\.html?$', url)
        if m:
            return f'{m.group(1)}-{m.group(2)}'
        return hashlib.md5(url.encode('utf-8')).hexdigest()[:14]


SLUG_REGISTRY: dict[str, type[SourceAdapter]] = {}


def register_slug(cls: type[SourceAdapter]) -> type[SourceAdapter]:
    SLUG_REGISTRY[cls.slug] = cls
    return cls


def get_adapter(slug: str) -> type[SourceAdapter] | None:
    return SLUG_REGISTRY.get(slug)


def all_adapters() -> list[type[SourceAdapter]]:
    return list(dict.fromkeys(SLUG_REGISTRY.values()))
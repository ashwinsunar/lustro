"""Jomashop — PARTIAL.

Access method: public robots.txt permits product pages; sitemap index
(`/sitemap.xml`) exposes eight large urlset files whose product URLs look
like `/brand-model-ref.html`. Probed product pages, however, ship a mostly
static shell (price is rendered client-side; no schema.org JSON-LD). The
adapter therefore attempts structured extraction (JSON-LD / meta / price
markup) and yields nothing when the page doesn't expose it — honest
partial coverage rather than fabricated values.

Status: PARTIAL (discovery works; field-level extraction unreliable for now;
revisit when the site serves structured data).
"""
from __future__ import annotations

import logging
import re
from typing import Iterable

from scraper.models.watch import RawProduct
from scraper.parsers.jsonld import jsonld_products, meta_content
from scraper.parsers.price import parse_price
from scraper.parsers.strings import clean
from scraper.sources.base import SourceAdapter, register_slug
from scraper.sources.sitemap import SitemapCrawler

logger = logging.getLogger('scraper.sources.jomashop')

SITEMAP_INDEX = 'https://www.jomashop.com/sitemap.xml'


@register_slug
class JomashopAdapter(SourceAdapter):
    slug = 'jomashop'
    display_name = 'Jomashop'
    base_url = 'https://www.jomashop.com'
    status = 'partial'
    note = 'Sitemap OK; product pages require JS for price/specs — extraction best-effort only.'

    def discover_urls(self, max_pages: int = 5) -> Iterable[str]:
        # Phase 1: enumerate the per-domain sitemap files from the root index.
        # (The crawler yields matched index children without re-fetching them.)
        crawler = SitemapCrawler(self.client, max_bytes=24 * 1024 * 1024, max_children=6)
        sitemaps = list(
            dict.fromkeys(
                crawler.product_urls(SITEMAP_INDEX, url_filter='.xml', max_urls=60)
            )
        )
        # Phase 2: product pages carry numeric reference tokens before ".html".
        budget = max_pages
        for sm in sitemaps:
            if budget <= 0:
                return
            for url in crawler.product_urls(sm, url_filter='.html', max_urls=budget):
                if re.search(r'-(?:watch-)?\d{3,}[a-z]*\.html$', url, re.I) and budget > 0:
                    budget -= 1
                    yield url

    def parse_product(self, html: str, url: str) -> RawProduct | None:
        # 1) structured
        for p in jsonld_products(html):
            name = clean(p.get('name') or '')
            offers = p.get('offers') or {}
            if isinstance(offers, list):
                offers = offers[0] if offers else {}
            price_raw = offers.get('price') or offers.get('lowPrice')
            amount, currency = parse_price(str(price_raw)) if price_raw else (None, None)
            if name and amount:
                raw = RawProduct(
                    source=self.slug,
                    source_product_id=clean(str(p.get('sku') or p.get('mpn') or '')),
                    source_url='',
                    brand='',
                    model=name[:200],
                    title=name[:200],
                    description=clean(str(p.get('description') or ''))[:3000],
                    price=amount,
                    currency=currency or '',
                    image_url=clean(str(p.get('image') or '')),
                )
                raw.source_url = f"{self.base_url}/{re.sub(r'^https?://[^/]+', '', url)}"
                return raw

        # 2) <title> + meta fallback (price still requires script execution -> reject)
        title = clean(re.sub(r'<title>([^<]*)</title>', r'\1', html))
        if title:
            ref = re.search(r'\b([A-Z0-9]{4,20})\s*$', title)
            price_probe = re.search(r'\$[\d,]+', html)
            if not price_probe:
                return None  # no server-side price => cannot build a valid catalogue row
        return None
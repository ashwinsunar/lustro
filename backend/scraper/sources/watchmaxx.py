"""WatchMaxx — ACTIVE.

Access: robots.txt allows product pages; sitemap index -> per-brand urlset
sitemaps contain product URLs `<brand>-watch-<model>.html`. Product pages
embed schema.org JSON-LD (Product) with offers (price + currency),
brand, sku/mpn, description, image. JSON-LD-first parsing.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Iterable

from scraper.models.watch import RawProduct
from scraper.parsers.jsonld import jsonld_products, title_tag
from scraper.parsers.price import parse_price
from scraper.parsers.jsonld import rewrite_ld_value
from scraper.parsers.strings import clean
from scraper.sources.base import SourceAdapter, register_slug
from scraper.sources.sitemap import SitemapCrawler

logger = logging.getLogger('scraper.sources.watchmaxx')

SITEMAP_ROOT = 'https://www.watchmaxx.com/sitemap.xml'


def _ld(v):
    return rewrite_ld_value(v)


@register_slug
class WatchMaxxAdapter(SourceAdapter):
    slug = 'watchmaxx'
    display_name = 'WatchMaxx'
    base_url = 'https://www.watchmaxx.com'
    status = 'active'
    note = 'Per-brand sitemaps + schema.org JSON-LD on product pages (offers with price).'

    def discover_urls(self, max_pages: int = 5) -> Iterable[str]:
        # override above with a simpler contract: resolve brand sitemap -> products
        yield from self._plan(max_pages)

    def _plan(self, max_pages: int) -> Iterable[str]:
        crawler = SitemapCrawler(self.client, max_bytes=4 * 1024 * 1024, max_children=40)
        brand_sitemaps = list(crawler.product_urls(
            SITEMAP_ROOT,
            url_filter='-sitemap.xml',
            max_urls=max_pages,
        ))
        for sm in brand_sitemaps:
            prod_crawler = SitemapCrawler(self.client, max_bytes=4 * 1024 * 1024, max_children=2)
            # brand sitemap URLs follow many patterns (-watch-, -strap-, -chatron-...),
            # so we accept every loc on a brand sitemap; parse filters out non-products.
            for url in prod_crawler.product_urls(sm, max_urls=1):
                yield url

    def parse_product(self, html: str, url: str) -> RawProduct | None:
        products = jsonld_products(html)
        if not products:
            return None
        p = products[0]

        brand = clean(str(p.get('brand', {}).get('name') if isinstance(p.get('brand'), dict) else p.get('brand')))
        name = clean(p.get('name') or '')
        if not brand or not name:
            return None

        offers = p.get('offers') or {}
        if isinstance(offers, list):
            offers = offers[0] if offers else {}
        price_raw = _ld(offers.get('price') or offers.get('lowPrice') or '')
        price, currency = parse_price(price_raw)
        if price is None and price_raw:
            price, currency = parse_price(str(price_raw))
        # JSON-LD often carries the currency code on the offer itself
        if not currency:
            currency = clean(str(_ld(offers.get('priceCurrency') or '')))

        availability = ''
        avail_ld = _ld(offers.get('availability') or '')
        if 'InStock' in avail_ld:
            availability = 'in_stock'
        elif 'OutOfStock' in avail_ld:
            availability = 'out_of_stock'
        elif 'PreOrder' in avail_ld:
            availability = 'pre_order'

        images = p.get('image')
        images = images if isinstance(images, list) else ([images] if images else [])
        primary = next((str(i) for i in images if str(i).startswith('http')), '')
        extra = [str(i) for i in images if str(i).startswith('http') and i != primary]

        description = clean(re.sub(r'<[^>]+>', ' ', _ld(p.get('description') or '')))
        sku = clean(str(p.get('sku') or p.get('mpn') or p.get('model') or ''))

        raw = RawProduct(
            source=self.slug,
            source_product_id=clean(str(p.get('sku') or p.get('mpn') or url)),
            source_url=url,
            brand=brand,
            model=name[:200],
            title=name[:200],
            reference_number=sku or '',
            sku=sku,
            price=price,
            currency=currency or '',
            description=description[:3000],
            availability=availability,
            image_url=primary,
            additional_images=extra,
            warranty='',
        )
        return raw
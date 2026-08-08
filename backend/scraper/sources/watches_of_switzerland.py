"""Watches of Switzerland — ACTIVE (verified).

Access: robots.txt allows; product sitemap (`/sitemap/product-en-gbp.xml`)
lists `/…/p/{productId}` URLs. Product pages embed a structured JSON state
block (`<script id="ng-state" type="application/json">`) carrying name,
manufacturer, mpn, price {currencyIso, value, formattedValue}, stock, and
images — we parse that structured payload (no CSS-selector scraping).
"""
from __future__ import annotations

import json
import logging
import re
from typing import Iterable

from scraper.models.watch import RawProduct
from scraper.parsers.strings import clean
from scraper.sources.base import SourceAdapter, register_slug
from scraper.sources.sitemap import SitemapCrawler

logger = logging.getLogger('scraper.sources.wos')

PRODUCT_SITEMAP = 'https://www.watches-of-switzerland.co.uk/sitemap/product-en-gbp.xml'


@register_slug
class WatchesOfSwitzerlandAdapter(SourceAdapter):
    slug = 'watches_of_switzerland'
    display_name = 'Watches of Switzerland'
    base_url = 'https://www.watches-of-switzerland.co.uk'
    status = 'active'
    note = 'Product sitemap + in-page ng-state JSON (price, stock, images, mpn).'

    def discover_urls(self, max_pages: int = 5) -> Iterable[str]:
        crawler = SitemapCrawler(self.client, max_bytes=14 * 1024 * 1024, max_children=6)
        return crawler.product_urls(PRODUCT_SITEMAP, url_filter='/p/', max_urls=max_pages)

    def parse_product(self, html: str, url: str) -> RawProduct | None:
        m = re.search(r'<script id="ng-state" type="application/json">(.*?)</script>', html, re.S)
        if not m:
            return None
        try:
            state = json.loads(m.group(1))
        except json.JSONDecodeError:
            return None

        entity = self._find_product_entity(state)
        if not entity:
            return None

        name = clean(entity.get('name') or '')
        manufacturer = clean(entity.get('manufacturer') or '')
        if not name or not manufacturer:
            return None

        price = entity.get('price') or {}
        stock = entity.get('stock') or {}
        stock_status = clean(stock.get('stockLevelStatus') or '')
        images = entity.get('images') or []
        image_url = images[0].get('url', '') if images else ''
        extra = [i.get('url', '') for i in images[1:] if i.get('url')]
        mpn = clean(entity.get('mpn') or '')
        code = clean(str(entity.get('code') or entity.get('variantId') or ''))
        desc = clean(re.sub(r'<[^>]+>', ' ', entity.get('description') or ''))
        price_value = price.get('value')
        currency = price.get('currencyIso') or ''
        first_image = ''
        if images and images[0].get('url', '').startswith('http'):
            first_image = images[0]['url']

        raw = RawProduct(
            source=self.slug,
            source_product_id=code,
            source_url=url,
            brand=manufacturer,
            model=name[:200],
            title=name[:200],
            reference_number=mpn,
            price=float(price_value) if isinstance(price_value, (int, float)) else None,
            currency=currency,
            availability=self._availability(stock_status),
            in_stock=stock_status not in ('outOfStock', 'out_of_stock'),
            image_url=first_image,
            additional_images=[u for u in extra if u],
            description=desc[:3000],
            gender=self._gender_from_desc(desc),
            warranty='',
        )
        return raw

    @staticmethod
    def _find_product_entity(state: dict) -> dict | None:
        """Find the entity block that has price+manufacturer+name (product detail)."""
        best: dict | None = None
        best_name_len = 10**9

        def walk(node):
            nonlocal best, best_name_len
            if isinstance(node, dict):
                if 'price' in node and isinstance(node.get('price'), dict) and 'name' in node:
                    n = clean(node.get('name') or '')
                    if n and len(n) < best_name_len:
                        best_name_len = len(n)
                        best = node
                for v in node.values():
                    walk(v)
            elif isinstance(node, list):
                for v in node:
                    walk(v)

        walk(state)
        return best

    @staticmethod
    def _availability(status: str) -> str:
        status = (status or '').lower()
        if 'outofstock' in status or 'out_of_stock' in status:
            return 'out_of_stock'
        if 'instock' in status or 'in_stock' in status:
            return 'in_stock'
        if 'preorder' in status or 'pre_order' in status:
            return 'pre_order'
        return ''

    @staticmethod
    def _gender_from_desc(desc: str) -> str:
        low = desc.lower()
        if "men's" in low or 'mens' in low:
            return 'men'
        if "women's" in low or 'ladies' in low:
            return 'women'
        if 'unisex' in low:
            return 'unisex'
        return ''

raw = None  # keep linters quiet about the inline expression below
"""Teddy Baldassarre (Shopify storefront) — ACTIVE.

Access method: the official public Shopify storefront product feed
`/products.json` (standard public JSON feed Shopify serves for its storefronts;
robots.txt explicitly allows crawling of product/collection/pages and even
documents an agent endpoint for shopping assistance).

Only catalog reads: product name, vendor, type, price, images, tags, body.
We never touch checkout/cart/account endpoints.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Iterable

from scraper.models.watch import RawProduct
from scraper.parsers.strings import clean
from scraper.sources.base import SourceAdapter, register_slug
from scraper.sources.sitemap import SitemapCrawler  # noqa: F401 (interface parity)

logger = logging.getLogger('scraper.sources.teddy')

FEED_PAGE_SIZE = 250


@register_slug
class TeddyBaldassarreAdapter(SourceAdapter):
    slug = 'teddy_baldassarre'
    display_name = 'Teddy Baldassarre'
    base_url = 'https://teddybaldassarre.com'
    status = 'active'
    note = 'Public Shopify /products.json feed; robots.txt allows product pages.'

    def discover_urls(self, max_pages: int = 5) -> Iterable[str]:
        """products.json is paginated; each 'page' is one feed page."""
        for page in range(1, max_pages + 1):
            yield f'{self.base_url}/products.json?limit={FEED_PAGE_SIZE}&page={page}'

    def fetch(self, url: str):
        resp = self.client.get(url)
        if resp.status_code == 200 and resp.headers.get('content-type', '').startswith('application/json'):
            return resp
        # feed may be HTML for >9999 pages etc.; treat as error
        resp.raise_for_status()
        return resp

    def parse_product(self, html: str, url: str) -> RawProduct | None:
        data = json.loads(html)
        products = data.get('products', [])
        self.stats.products_found += len(products)
        raw = self._parse_listing(products)
        return raw

    def _parse_listing(self, products: list[dict]) -> RawProduct | None:
        """The feed carries several products per page; return the first 'Watches' one."""
        for p in products:
            if str(p.get('product_type', '')).lower() != 'watches':
                continue
            variants = p.get('variants') or []
            if not variants:
                continue
            v0 = variants[0]
            brand = clean(p.get('vendor') or '')
            title = clean(p.get('title') or '')
            # model: strip brand prefix from title ("Baume et Mercier Clifton 10870..." -> "Clifton 10870 ...")
            model = title
            if brand and model.lower().startswith(brand.lower()):
                model = model[len(brand):].strip().lstrip('-– ')

            ref = self._reference_from_tags(p.get('tags') or [], title)
            sku = clean(v0.get('sku') or '')
            price = v0.get('price')
            compare = v0.get('compare_at_price') or None
            available = v0.get('available', True)
            image = (p.get('images') or [{}])[0].get('src', '')
            extra = [i.get('src', '') for i in (p.get('images') or [])[1:]]
            body = clean(re.sub(r'<[^>]+>', ' ', p.get('body_html') or ''))

            raw = RawProduct(
                source=self.slug,
                source_product_id=str(p.get('id') or ''),
                source_url=f"{self.base_url}/products/{p.get('handle', '')}",
                brand=brand,
                model=model[:200],
                title=title[:200],
                reference_number=ref,
                sku=sku,
                price=price,
                original_price=compare,
                currency='USD',
                availability='in_stock' if available else 'out_of_stock',
                in_stock=bool(available),
                image_url=image,
                additional_images=[u for u in extra if u],
                description=body[:5000],
                warranty='',
            )
            # movement hint from title/body (e.g. "Automatic Chronograph")
            mv = self._movement_from_text(f'{title} {body}')
            if mv:
                raw.movement = mv
            self.stats.products_found += 1
            return raw
        return None

    @staticmethod
    def _reference_from_tags(tags: list[str], title: str) -> str:
        # References look like "M0A10870", "BM7662-59L" or a GTIN
        # (8061611212893). Marketing tags ("BOUTIQUE", "AFFIRM", "NEW") are
        # common in the feed and must NOT be captured as references.
        for tag in tags:
            t = clean(tag).replace('ref:', '').replace('reference:', '')
            if re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9-]{1,19}', t) and re.search(r'\d', t):
                return t.upper()
        m = re.search(r'([A-Z0-9]{4,20})\s*$', title)
        if m and re.search(r'\d', m.group(1)):
            return m.group(1).upper()
        return ''

    @staticmethod
    def _movement_from_text(text: str) -> str:
        low = text.lower()
        if 'spring drive' in low:
            return 'spring drive'
        if 'automatic' in low:
            return 'automatic'
        if 'hand-wound' in low or 'manual' in low:
            return 'manual'
        if 'quartz' in low:
            return 'quartz'
        return ''
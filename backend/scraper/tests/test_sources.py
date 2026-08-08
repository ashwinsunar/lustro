"""Adapter parse/discover tests with in-memory fixtures (no network).

Each fixture is a minimal-but-faithful page shape for the source's parser:
- watchmaxx: schema.org JSON-LD product block
- teddy_baldassarre: Shopify product JSON
- jomashop: server-rendered page with meta price (no JSON-LD)
"""
from __future__ import annotations

import httpx
from django.test import SimpleTestCase

from scraper.safety.http import PoliteClient
from scraper.sources.jomashop import JomashopAdapter
from scraper.sources.teddy_baldassarre import TeddyBaldassarreAdapter
from scraper.sources.watchmaxx import WatchMaxxAdapter

ROBOTS = 'User-agent: *\nAllow: /\n'


def _transport(routes: dict) -> httpx.MockTransport:
    def handler(request: httpx.Request) -> httpx.Response:
        path = request.url.path
        if path == '/robots.txt':
            return httpx.Response(200, text=ROBOTS, request=request)
        body = routes.get(path)
        if body is None:
            return httpx.Response(404, text='nope', request=request)
        if isinstance(body, int):
            return httpx.Response(body, text='nope', request=request)
        return httpx.Response(200, text=body, request=request)

    return httpx.MockTransport(handler)


WMX_JSONLD = """
<html><head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "A. Lange & Sohne Lange 1 Platinum Watch 730-032",
  "brand": {"@type": "Brand", "name": "A. Lange & Sohne"},
  "sku": "730-032",
  "mpn": "730.032",
  "image": "https://cdn.watchmaxx.com/i/730-032.jpg",
  "description": "A platinum dress watch with a silver dial.",
  "offers": {
    "@type": "Offer",
    "price": "52500.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
</script></head><body>
<p class="prod_price">$52,500.00</p>
</body></html>
"""


class WatchMaxxAdapterTests(SimpleTestCase):
    def test_parse_jsonld_product(self):
        adapter = WatchMaxxAdapter(
            client=PoliteClient(delay=0, transport=httpx.MockTransport(_handler))
        )
        raw = adapter.parse_product(WMX_JSONLD, 'https://www.watchmaxx.com/a-lange-sohne-watch-730-032')
        self.assertIsNotNone(raw)
        self.assertEqual(raw.brand, 'A. Lange & Sohne')
        self.assertIn('730', raw.reference_number)
        self.assertEqual(raw.price, 52500.0)
        self.assertEqual(raw.currency, 'USD')
        self.assertEqual(raw.availability, 'in_stock')
        self.assertEqual(raw.image_url, 'https://cdn.watchmaxx.com/i/730-032.jpg')

    def test_parse_rejects_page_without_jsonld(self):
        adapter = WatchMaxxAdapter(
            client=PoliteClient(delay=0, transport=httpx.MockTransport(_handler))
        )
        raw = adapter.parse_product('<html><body>no data</body></html>', 'https://www.watchmaxx.com/x')
        self.assertIsNone(raw)


JOM_HTML = """
<html><head>
<meta name="description" content="Invicta Men's Pro Diver 10428">
<meta property="og:price:amount" content="89.99">
<meta property="og:price:currency" content="USD">
<title>Invicta Pro Diver 10428</title>
</head><body>
<span class="price">$89.99</span>
</body></html>
"""


class JomashopAdapterTests(SimpleTestCase):
    def test_parse_server_priced_page(self):
        adapter = JomashopAdapter(
            client=PoliteClient(delay=0, transport=httpx.MockTransport(_handler))
        )
        raw = adapter.parse_product(JOM_HTML, 'https://www.jomashop.com/invicta-watch-10428.html')
        self.assertIsNone(raw)  # price lives only in JS-rendered DOM -> rejected


TEDDY_JSON = '{"products":[{"id": 101, "title": "Omega Seamaster 300 210.30.42.20.01.001", "handle": "omega-seamaster-300-210-30-42-20-01-001", "vendor": "Omega", "product_type": "Watches", "tags": ["210.30.42.20.01.001", "Automatic"], "body_html": "<p>A dive watch.</p>", "images": [{"src": "https://cdn.shopify.com/x.jpg"}, {"src": "https://cdn.shopify.com/y.jpg"}], "variants": [{"id": 9, "sku": "OMEGA-210-30-42-20-01-001", "price": "6400.00", "available": true}]}]}'


class TeddyBaldassarreAdapterTests(SimpleTestCase):
    def test_parse_shopify_json(self):
        adapter = TeddyBaldassarreAdapter(
            client=PoliteClient(delay=0, transport=httpx.MockTransport(_handler))
        )
        raw = adapter.parse_product(TEDDY_JSON, 'https://teddybaldassarre.com/products/omega-seamaster-300-210-30-42-20-01-001')
        self.assertIsNotNone(raw)
        self.assertEqual(raw.brand, 'Omega')
        self.assertIn('Seamaster', raw.model)
        self.assertEqual(raw.price, '6400.00')  # raw string; float conversion is the normalizer's job
        self.assertEqual(raw.image_url, 'https://cdn.shopify.com/x.jpg')
        self.assertEqual(raw.availability, 'in_stock')
        self.assertEqual(raw.sku, 'OMEGA-210-30-42-20-01-001')


def _handler(request: httpx.Request) -> httpx.Response:
    return httpx.Response(200, text='', request=request)
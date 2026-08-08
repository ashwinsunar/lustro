"""SitemapCrawler tests: index yielding, filters, bounds (no network)."""
from __future__ import annotations

import httpx
from django.test import SimpleTestCase

from scraper.safety.http import PoliteClient
from scraper.sources.sitemap import SitemapCrawler

ROBOTS = 'User-agent: *\nAllow: /\n'

INDEX_XML = """<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://shop.example/sitemaps/brand-a-sitemap.xml</loc></sitemap>
  <sitemap><loc>https://shop.example/sitemaps/brand-b-sitemap.xml</loc></sitemap>
  <sitemap><loc>https://shop.example/sitemaps/brand-c-sitemap.xml</loc></sitemap>
</sitemapindex>
"""

BRAND_A_XML = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://shop.example/a-watch-001</loc></url>
  <url><loc>https://shop.example/a-strap-901</loc></url>
</urlset>
"""

BRAND_B_XML = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://shop.example/b-watch-002</loc></url>
</urlset>
"""


def _handler(request: httpx.Request) -> httpx.Response:
    routes = {
        '/robots.txt': ROBOTS,
        '/sitemap.xml': INDEX_XML,
        '/sitemaps/brand-a-sitemap.xml': BRAND_A_XML,
        '/sitemaps/brand-b-sitemap.xml': BRAND_B_XML,
        '/sitemaps/brand-c-sitemap.xml': 404,
    }
    body = routes.get(request.url.path)
    if isinstance(body, int):
        return httpx.Response(body, text='nope', request=request)
    if body is None:
        return httpx.Response(404, text='nope', request=request)
    return httpx.Response(200, text=body, request=request)


def _crawler(max_children: int = 10) -> SitemapCrawler:
    return SitemapCrawler(
        PoliteClient(delay=0, transport=httpx.MockTransport(_handler)),
        max_bytes=1_000_000,
        max_children=max_children,
    )


class SitemapCrawlerTests(SimpleTestCase):
    def test_index_children_are_yielded_by_filter(self):
        urls = list(
            _crawler().product_urls(
                'https://shop.example/sitemap.xml',
                url_filter='-sitemap.xml',
                max_urls=10,
            )
        )
        self.assertEqual(
            urls,
            [
                'https://shop.example/sitemaps/brand-a-sitemap.xml',
                'https://shop.example/sitemaps/brand-b-sitemap.xml',
                'https://shop.example/sitemaps/brand-c-sitemap.xml',
            ],
        )

    def test_terminal_loc_filter(self):
        urls = list(
            _crawler().product_urls(
                'https://shop.example/sitemaps/brand-a-sitemap.xml',
                url_filter='-watch-',
                max_urls=10,
            )
        )
        self.assertEqual(urls, ['https://shop.example/a-watch-001'])

    def test_index_children_are_also_crawled(self):
        urls = list(
            _crawler().product_urls(
                'https://shop.example/sitemap.xml',
                url_filter='',
                max_urls=10,
            )
        )
        # matched index children plus everything their urlsets contain
        self.assertEqual(len(urls), 3 + 2 + 1)

    def test_budget_caps_yields(self):
        urls = list(
            _crawler().product_urls(
                'https://shop.example/sitemaps/brand-a-sitemap.xml',
                max_urls=1,
            )
        )
        self.assertEqual(len(urls), 1)

    def test_missing_child_skipped_not_fatal(self):
        urls = list(
            _crawler().product_urls(
                'https://shop.example/sitemap.xml',
                url_filter='-sitemap.xml',
                max_urls=10,
            )
        )
        self.assertIn('https://shop.example/sitemaps/brand-c-sitemap.xml', urls)
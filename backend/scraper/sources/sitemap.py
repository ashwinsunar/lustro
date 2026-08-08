"""Sitemap-based product discovery (Spring/Exeter/Nexus sitemaps, cross-source, robots-checked).

Preferred because sitemaps are the publisher-sanctioned way to list products;
falls back gracefully and respects robots rules via PoliteClient.
"""
from __future__ import annotations

import logging
import re
import xml.etree.ElementTree as ET
from typing import Iterable

logger = logging.getLogger('scraper.sources.sitemap')

LOC_NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'


def parse_locs(xml_text: str) -> list[str]:
    """Extract <loc> (un-namespaced tolerant) from any sitemap/xml."""
    return re.findall(r'<loc>\s*([^<\s]+)\s*</loc>', xml_text, re.IGNORECASE)


def is_sitemap_index(xml_text: str) -> bool:
    return '<sitemapindex' in xml_text.lower()


class SitemapCrawler:
    """Bounded sitemap follower: root index -> child sitemaps -> product URLs.

    Politeness:
      * only fetches sitemaps robots.txt permits (via the injected client)
      * caps total sitemap bytes (default 12 MB) and child count
    """

    def __init__(self, client, max_bytes: int = 12 * 1024 * 1024, max_children: int = 20) -> None:
        self.client = client
        self.max_bytes = max_bytes
        self.max_children = max_children

    def product_urls(
        self,
        root_sitemap: str,
        *,
        url_filter: str = '',
        max_urls: int = 50,
    ) -> Iterable[str]:
        """Follow an index (or single urlset) and yield URLs matching url_filter (substring)."""
        pattern = url_filter or ''
        count = 0
        stack = [root_sitemap]
        fetched = 0
        while stack and fetched < self.max_children:
            url = stack.pop(0)
            try:
                resp = self.client.get(url)
            except Exception as exc:  # noqa: BLE001
                logger.warning('sitemap fetch failed %s: %s', url, exc)
                continue
            fetched += 1
            if resp.status_code != 200 or len(resp.content) > self.max_bytes:
                continue
            text = resp.text
            if is_sitemap_index(text):
                children = parse_locs(text)[: self.max_children]
                # a matched index child (e.g. a brand sitemap) is itself a
                # deliverable URL — yield it, then keep recursing into it.
                for child in children:
                    if pattern and pattern not in child:
                        continue
                    yield child
                    count += 1
                    if max_urls and count >= max_urls:
                        return
                stack.extend(children)
                continue
            for loc in parse_locs(text):
                if pattern and pattern not in loc:
                    continue
                if loc.startswith('http'):
                    yield loc
                    count += 1
                    if max_urls and count >= max_urls:
                        return
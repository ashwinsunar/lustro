"""Structured-data extraction: JSON-LD, OpenGraph, meta tags, Shopify JSON,"""
from __future__ import annotations

import json
import re
from typing import Any, Iterator

from bs4 import BeautifulSoup

from scraper.parsers.strings import clean


def iter_jsonld(html: str) -> Iterator[dict[str, Any]]:
    """Yield every parseable application/ld+json block from an HTML string."""
    if not html:
        return
    for match in re.finditer(
        r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html,
        re.IGNORECASE | re.DOTALL,
    ):
        raw = match.group(1).strip()
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if isinstance(data, list):
            yield from (d for d in data if isinstance(d, dict))
        elif isinstance(data, dict):
            yield data


def jsonld_products(html: str) -> list[dict[str, Any]]:
    """All schema.org Product graphs within an HTML document (including @graph)."""
    out: list[dict[str, Any]] = []

    def walk(node: Any) -> None:
        if isinstance(node, dict):
            if node.get('@type') in ('Product', 'IndividualProduct', 'ProductGroup', 'Watch'):
                out.append(node)
            for v in node.values():
                if isinstance(v, (dict, list)):
                    walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)

    for block in iter_jsonld(html):
        walk(block)
    return out


def meta_content(html: str, attrs: dict[str, str]) -> str:
    """First matching <meta>/<link> attr value (og:title, twitter:image, …)."""
    if not html:
        return ''
    soup = BeautifulSoup(html, 'html.parser')
    for key, value in attrs.items():
        el = soup.find('meta', {key: value})
        if el and el.get('content'):
            return clean(el['content'])
        el = soup.find('link', {key: value})
        if el and el.get('href'):
            return clean(el['href'])
    return ''


def og_tags(html: str) -> dict[str, str]:
    out: dict[str, str] = {}
    if not html:
        return out
    soup = BeautifulSoup(html, 'html.parser')
    for el in soup.find_all('meta', attrs={'property': True}):
        prop = el.get('property', '')
        content = el.get('content')
        if prop.startswith('og:') and content:
            out[prop] = clean(content)
    return out


def title_tag(html: str) -> str:
    return clean(BeautifulSoup(html, 'html.parser').title.string if html and BeautifulSoup(html, 'html.parser').title else '')


def rewrite_ld_value(v: Any) -> str:
    """JSON-LD values may be {'@value': ...} or list of dicts with @value."""
    if isinstance(v, list):
        return ', '.join(rewrite_js_val(x) for x in v if x)
    if isinstance(v, dict):
        if '@value' in v:
            return clean(str(v['@value']))
        return ''
    return clean(str(v))


def rewrite_js_val(v: Any) -> str:
    if v is None:
        return ''
    if isinstance(v, str):
        return v
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, bool):
        return str(v)
    return ''
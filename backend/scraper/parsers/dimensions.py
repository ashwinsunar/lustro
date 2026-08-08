"""Dimension parsing: case diameter, thickness, lug-to-lug.

Accepted forms (returned values are mm floats):
  "40 mm" / "40mm" / "Case Diameter: 40 mm"  -> 40.0
  "Ø 39.5 mm" / "39,5mm"                     -> 39.5
  "39 mm x 47 mm" (w x l)                    -> diameter 39.0, lug_to_lug handled via label
  "thickness: 10.4 mm"                       -> thickness 10.4
"""
from __future__ import annotations

import re

from scraper.parsers.strings import first_num, nums

MM = re.compile(r'(\d[\d.]*(?:,\d+)?)\s*mm', re.IGNORECASE)


def parse_mm(text: str | None, *, label_hint: str = '') -> float | None:
    """Extract the best mm figure from a spec string with optional label guidance."""
    if not text:
        return None
    # explicit label-based extraction: "case diameter", "diameter", "width"
    label = label_hint.lower()
    body = str(text)
    if label:
        # e.g. "Case diameter 40 mm" or "diameter: 40"
        pat = re.compile(
            re.escape(label) + r'\s*(?:[:=]?\s*)(\d+(?:[.,]\d+)?)\s*(?:mm)?', re.IGNORECASE
        )
        m = pat.search(body)
        if m:
            return _to_float(m.group(1))
    matches = MM.findall(body)
    if matches:
        vals = [_to_float(x) for x in matches]
        vals = [v for v in vals if v is not None and 0 < v < 200]
        return max(vals) if vals else None
    # bare numbers only when the unit is implied (e.g. "Size 40")
    for v in nums(body):
        if 10 <= v <= 100:
            return v
    return None


def _to_float(s: str) -> float | None:
    s = s.replace(',', '.')
    try:
        return float(s)
    except ValueError:
        return None


def parse_case_diameter(text: str) -> float | None:
    """Prefer an explicit 'diameter'/'Ø'/'case size' phrasing, else any mm value."""
    if not text:
        return None
    for hint in ('case diameter', 'diameter', 'case size', 'width', 'Ø', 'case width'):
        if hint.lower() in str(text).lower():
            v = parse_mm(text, label_hint=hint)
            if v:
                return v
    return parse_mm(text)


def parse_case_thickness(text: str) -> float | None:
    for hint in ('case thickness', 'thickness', 'height', 'thick'):
        if hint.lower() in str(text).lower():
            v = parse_mm(text, label_hint=hint)
            if v:
                return v
    return None


def parse_lug_to_lug(text: str) -> float | None:
    for hint in ('lug to lug', 'lug-to-lug', 'lug-to-lug length', 'lug width'):
        if hint.lower() in str(text).lower():
            v = parse_mm(text, label_hint=hint)
            if v:
                return v
    return None


def parse_two_dimensions(text: str) -> tuple[float | None, float | None]:
    """Common retailer format: '39 mm x 41 mm' -> (39.0, 41.0) width x length."""
    if not text:
        return None, None
    matches = MM.findall(str(text))
    if len(matches) >= 2:
        a, b = _to_float(matches[0]), _to_float(matches[1])
        if a and b:
            return min(a, b), max(a, b)
    return None, None
"""Water resistance normalization to meters.

  "100 meters" / "100m" / "10 ATM" / "10 bar" / "100 M" -> 100
  "3 ATM" -> 30 (3 x 10, standard conversion)
  "30M"   -> 30
  "5 Bar" -> 50
"""
from __future__ import annotations

import re

from scraper.parsers.strings import first_num

ATM_BAR = 10.0


def water_resistance_to_meters(text: str | None) -> int | None:
    if not text:
        return None
    t = str(text).strip().lower()
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*(m|meters?|metres?|atm|bar)\b', t)
    if not m:
        # bare number with WR context ("300"/"water resistant 300")
        if 'water' in t or 'resistant' in t or 'atm' in t or 'bar' in t:
            v = first_num(t)
            return int(v) if v is not None else None
        return None
    value = float(m.group(1).replace(',', '.'))
    unit = m.group(2)
    if unit.startswith('atm') or unit.startswith('bar'):
        return int(round(value * ATM_BAR))
    return int(round(value))


def format_display_meters(meters: int | None) -> str:
    """Canonical display string, e.g. 100 -> '100m'."""
    if meters is None:
        return ''
    return f'{meters}m'
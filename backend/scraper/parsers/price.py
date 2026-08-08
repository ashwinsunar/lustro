"""Price parsing and currency normalization.

Accepted forms:
  "CHF 12,500"        -> 12500.0, CHF
  "$12,500.00"        -> 12500.0, USD
  "€ 4,300"           -> 4300.0, EUR
  "GBP 9,950"         -> 9950.0, GBP
  "12.500,00 €"       -> 12500.0, EUR
  "9,950"             -> 9950.0, (currency unknown)
"""
from __future__ import annotations

import re

from scraper.parsers.strings import clean

CURRENCY_TOKENS: dict[str, str] = {
    'CHF': 'CHF', 'CH': 'CHF', 'SFr': 'CHF', 'Fr': 'CHF',
    'USD': 'USD', '$': 'USD', 'US$': 'USD',
    'EUR': 'EUR', '€': 'EUR', 'EUR': 'EUR',
    'GBP': 'GBP', '£': 'GBP', 'GBP£': 'GBP',
    'JPY': 'JPY', '¥': 'JPY',
    'AUD': 'AUD', 'A$': 'AUD',
    'CAD': 'CAD', 'C$': 'CAD',
    'NPR': 'NPR', 'Rs': 'NPR', 'NRs': 'NPR', 'रू': 'NPR',
    'INR': 'INR',
}

_SYM = r'(?:CHF|US\$|\$|€|EUR|GBP|£|JPY|¥|A\$|AUD|CAD|C\$|NPR|NRs|Rs|रू|INR)'
# number with optional thousands separators: 12,500 / 12.500 / 12500.5
_NUM_GRP = r'([\d][\d\.,]*(?:\.\d{2})?|\d+(?:\.\d{1,2})?)'


def parse_price(text: str | None) -> tuple[float | None, str | None]:
    """Return (amount, currency_code_or_None). Never raises."""
    raw = clean(text)
    if not raw:
        return None, None

    lowered = raw.lower()
    for token, code in sorted(CURRENCY_TOKENS.items(), key=lambda kv: -len(kv[0])):
        if token.lower() in lowered:
            currency = code
            break
    else:
        currency = None

    # strip currency tokens & non-numeric residue
    body = re.sub(_SYM, ' ', raw)
    body = re.sub(r'[^0-9.,\s-]', ' ', body)

    # try to find the largest plausible number (e.g. "12,500.00" vs "12,500")
    matches = re.findall(r'\d[\d\.,]*(?:\.\d{1,2})?', body.replace(' ', ''))
    if not matches:
        return None, currency

    def _to_float(s: str) -> float | None:
        s = s.strip()
        if '.' in s and ',' in s:
            # European: 12.500,00  or US: 1,234.56 -> decide by last separator
            if s.rfind('.') > s.rfind(','):
                s = s.replace(',', '')  # 1,234.56
            else:
                s = s.replace('.', '').replace(',', '.')  # 12.500,00
        elif ',' in s:
            tail = s.rsplit(',', 1)[1]
            if len(tail) == 3 and '.' not in s:
                s = s.replace(',', '')  # thousands: "9,950" -> 9950 ; "1,234,567" -> 1234567
            else:
                s = s.replace(',', '.')  # decimal: "12,5" / "12,95"
        try:
            return float(s)
        except ValueError:
            return None

    candidates = [_to_float(m) for m in matches]
    candidates = [c for c in candidates if c is not None and 0 < c < 1_000_000_000]
    if not candidates:
        return None, currency
    return max(candidates), currency


def parse_price_range(text: str | None) -> tuple[float | None, float | None]:
    """Parse "3,900 – 4,200" style ranges. Returns (min, max)."""
    raw = clean(text)
    if not raw:
        return None, None
    vals = [v for v, _ in [parse_price(t) for t in re.split(r'[-–—to]', raw) if parse_price(t)[0]]]
    if not vals:
        return None, None
    return min(vals), max(vals)


def normalize_currency(code: str | None) -> str:
    """Map any detected currency token to ISO-4217 code (unknown -> '')."""
    if not code:
        return ''
    return CURRENCY_TOKENS.get(code.strip().upper(), code.strip().upper())
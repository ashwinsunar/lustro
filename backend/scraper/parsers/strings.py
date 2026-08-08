"""String utilities shared by parsers: cleaning, tokens, number extraction, dates."""
from __future__ import annotations

import re

_WS = re.compile(r'\s+')
_NUM = re.compile(r'-?\d+(?:[.,]\d+)?')


def clean(text: str | None) -> str:
    """Collapse whitespace, strip; empty if None."""
    if not text:
        return ''
    return _WS.sub(' ', str(text)).strip()


def nums(text: str | None) -> list[float]:
    """Every numeric literal in a string (dots->decimals, commas stripped)."""
    if not text:
        return []
    out = []
    for m in _NUM.finditer(str(text)):
        tok = m.group(0).replace(',', '.')
        try:
            out.append(float(tok))
        except ValueError:
            continue
    return out


def first_num(text: str | None) -> float | None:
    vals = nums(text)
    return vals[0] if vals else None


def year_of(text: str | None) -> str:
    if not text:
        return ''
    m = re.search(r'\b(19|20)\d{2}\b', str(text))
    return m.group(0) if m else ''


def extract_tokens(text: str | None, max_tokens: int = 8) -> list[str]:
    """Downcased alphanumeric tokens (for matching/dedupe)."""
    if not text:
        return []
    toks = re.findall(r"[a-z0-9]+", str(text).lower())
    return toks[:max_tokens]


def is_url(text: str | None) -> bool:
    if not text:
        return False
    return bool(re.match(r'^https?://[^\s]+$', str(text).strip()))


def parse_bool(text: str | None) -> bool | None:
    if not text:
        return None
    t = str(text).strip().lower()
    if t in ('1', 'true', 'yes', 'y'):
        return True
    if t in ('0', 'false', 'no', 'n'):
        return False
    return None
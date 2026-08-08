"""Duplicate detection across retailers (Phase 6).

All rules are conservative: we only auto-merge with high confidence
>= AUTO_MERGE_THRESHOLD and never merge purely on "looks similar" names.

Confidence composition:
  reference_exact        = 1.0   (same ref number + same normalized brand)
  reference_exact_loose  = 0.95  (same ref, brand likely-equivalent)
  brand_model_exact      = 0.9   (normalized brand + normalized model equal)
  sku_exact              = 0.85  (same SKU + same brand)
  source_id_exact        = 1.0   (same source_product_id within a source)
  fuzzy_name             = 0.6   (fuzzy ratio on normalized full name) — never
                                  auto-merged; only reported as candidate
"""
from __future__ import annotations

import re
from difflib import SequenceMatcher

from scraper.models.watch import NormalizedWatch

AUTO_MERGE_THRESHOLD = 0.9
CANDIDATE_THRESHOLD = 0.6

_TOKEN_RE = re.compile(r'[a-z0-9]+')


def normalize_brand_name(name: str) -> str:
    """'TAG Heuer' -> 'tag heuer'; 'Jaeger-LeCoultre' -> 'jaeger lecoultre'."""
    if not name:
        return ''
    return ' '.join(_TOKEN_RE.findall(name.lower()))


def normalize_model_name(name: str) -> str:
    """Lowercase-sorted tokens: 'Presage Cocktail Time' -> 'cocktail presage time'.

    Token-sorting avoids word-order noise while remaining semantically stable.
    """
    if not name:
        return ''
    tokens = _TOKEN_RE.findall(name.lower())
    return ' '.join(sorted(set(tokens)))


def canonical_reference(ref: str) -> str | None:
    """Normalize common reference formats: 'SRPB43', 'srpb43', 's.r.p.b.43' -> 'srpb43'."""
    if not ref:
        return None
    tokens = _TOKEN_RE.findall(str(ref).lower())
    if not tokens:
        return None
    return ''.join(tokens)


class MatchResult:
    __slots__ = ('score', 'key', 'reason')

    def __init__(self, score: float, key: str, reason: str) -> None:
        self.score = score
        self.key = key
        self.reason = reason

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f'MatchResult({self.score:.2f}, {self.key!r}, {self.reason!r})'


def match_pair(a: NormalizedWatch, b: NormalizedWatch) -> MatchResult:
    """Confidence that `a` and `b` describe the same underlying watch."""

    ref_a = canonical_reference(a.reference_number)
    ref_b = canonical_reference(b.reference_number)
    brand_a = normalize_brand_name(a.brand)
    brand_b = normalize_brand_name(b.brand)
    model_a = normalize_model_name(a.model or a.title)
    model_b = normalize_model_name(b.model or b.title)

    # 1) same source product id (same listing resent) — identity
    if (
        a.source and b.source and a.source == b.source
        and a.source_product_id and b.source_product_id
        and a.source_product_id == b.source_product_id
    ):
        return MatchResult(1.0, 'source_product_id', 'same source product id')

    # 2) reference exact (ref alone is globally unique in watchmaking practice)
    if ref_a and ref_b and ref_a == ref_b:
        if brand_a and brand_b and brand_a == brand_b:
            return MatchResult(1.0, 'reference_brand', 'reference + brand exact')
        if brand_a and brand_b:
            return MatchResult(0.95, 'reference', 'reference exact, brand variant')
        return MatchResult(0.95, 'reference', 'reference exact')

    # 3) sku + brand
    sku_a, sku_b = (a.sku or '').strip().lower(), (b.sku or '').strip().lower()
    if sku_a and sku_b and sku_a == sku_b and brand_a and brand_a == brand_b:
        return MatchResult(0.85, 'sku_brand', 'sku + brand exact')

    # 4) brand + exact normalized model
    if brand_a and brand_b and brand_a == brand_b and model_a and model_a == model_b:
        return MatchResult(0.9, 'brand_model', 'brand + model exact')

    # 5) fuzzy name — report only (never auto-merge)
    if model_a and model_b:
        ratio = SequenceMatcher(None, model_a, model_b).ratio()
        if brand_a and brand_b and brand_a == brand_b and ratio >= CANDIDATE_THRESHOLD:
            return MatchResult(min(ratio, 0.6), 'fuzzy_brand_model', f'fuzzy name ratio {ratio:.2f}')

    return MatchResult(0.0, '', 'no match')


def find_duplicate(
    candidate: NormalizedWatch,
    existing: list[NormalizedWatch],
) -> MatchResult | None:
    """Best match (>= AUTO_MERGE_THRESHOLD) among existing rows, else None."""
    best: MatchResult | None = None
    for row in existing:
        mr = match_pair(candidate, row)
        if mr.score >= AUTO_MERGE_THRESHOLD and (best is None or mr.score > best.score):
            best = mr
    if best and best.score >= AUTO_MERGE_THRESHOLD:
        return best
    return None

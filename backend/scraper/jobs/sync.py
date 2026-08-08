"""Sync orchestration: run adapter(s) -> normalize -> validate -> upsert (Phase 10).

Produces the CLI contract output:
    [Chrono24] Fetching page 1
    [Chrono24] Found 24 products
    ...
    [DB] Inserted 15 / Updated 7 / Duplicates: 0
    [Errors] 0
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field

from scraper.config import CONFIG
from scraper.safety.http import SourceRunnerStats
from scraper.sources import all_adapters, get_adapter

logger = logging.getLogger('scraper.jobs')


@dataclass
class RunReport:
    per_source: dict[str, SourceRunnerStats] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)

    def lines(self) -> str:
        out: list[str] = []
        totals = SourceRunnerStats()
        totals.source = 'ALL'
        for slug, st in self.per_source.items():
            out.extend(st.summary_lines())
            out.append('')
            totals.requests += st.requests
            totals.products_found += st.products_found
            totals.products_parsed += st.products_parsed
            totals.products_invalid += st.products_invalid
            totals.products_failed += st.products_failed
            totals.products_duplicate += st.products_duplicate
            totals.inserted += st.inserted
            totals.updated += st.updated
            totals.errors.extend(st.errors)
        out.extend(totals.summary_lines())
        return '\n'.join(out)


def run_source(
    slug: str,
    *,
    dry_run: bool = False,
    max_pages: int | None = None,
    max_products: int | None = None,
    repository=None,
) -> SourceRunnerStats:
    """Run a single source end to end (discover -> parse -> normalize -> upsert)."""
    adapter_cls = get_adapter(slug)
    if adapter_cls is None:
        raise ValueError(f'unknown source slug: {slug!r}')

    adapter = adapter_cls()
    stats = SourceRunnerStats()
    stats.source = adapter.display_name or slug

    if adapter.status in ('blocked', 'unsupported', 'manual'):
        stats.errors.append(f'{adapter.display_name}: {adapter.note}')
        adapter.client.close()
        return stats

    pages = max_pages if max_pages is not None else CONFIG.max_pages
    products = max_products if max_products is not None else CONFIG.max_products

    for watch in adapter.run(max_pages=pages, max_products=products):
        if dry_run:
            logger.info(
                '[%s] dry-run: %s %s (%s) @ %s %s',
                slug, watch.brand, watch.model, watch.reference_number, watch.price, watch.currency,
            )
            stats.inserted += 1
            continue

        from scraper.storage.repository import Repository  # noqa: PLC0415

        repo = repository or Repository()
        outcome, _obj = repo.upsert(watch)
        if outcome == 'updated':
            stats.updated += 1
            stats.products_duplicate += 1  # matched an existing catalogue row
        elif outcome == 'inserted':
            stats.inserted += 1
        elif outcome == 'invalid':
            stats.products_invalid += 1
        elif outcome == 'failed':
            stats.products_failed += 1

    # fold in HTTP-level stats observed by the adapter's client
    http = adapter.client.stats
    stats.requests += http.requests
    stats.bytes_read += http.bytes_read
    stats.robots_blocks += http.robots_blocks
    stats.errors.extend(http.errors)
    # discovery/parse counters live on the adapter
    stats.products_found = adapter.stats.products_found
    stats.products_parsed = adapter.stats.products_parsed
    if adapter.stats.products_invalid > stats.products_invalid:
        stats.products_invalid = adapter.stats.products_invalid
    adapter.client.close()
    return stats


def run_all(
    *,
    dry_run: bool = False,
    max_pages: int | None = None,
    max_products: int | None = None,
) -> RunReport:
    report = RunReport()
    for cls in all_adapters():
        slug = cls.slug
        try:
            report.per_source[slug] = run_source(
                slug, dry_run=dry_run, max_pages=max_pages, max_products=max_products
            )
        except Exception as exc:  # noqa: BLE001 - one adapter must not abort the batch
            logger.exception('source %s failed', slug)
            report.errors.append(f'{slug}: {exc}')
    return report


__all__ = ['run_source', 'run_all', 'RunReport']
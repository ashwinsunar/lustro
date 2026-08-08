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
import time
from dataclasses import dataclass, field

from scraper.config import CONFIG
from scraper.safety.http import SourceRunnerStats
from scraper.sources import all_adapters, get_adapter

logger = logging.getLogger('scraper.jobs')


def log_audit(
    source: str,
    *,
    dry_run: bool,
    status: str,
    stats: SourceRunnerStats,
    note: str = '',
) -> None:
    """Persist one audit row per run (Phase 16). No-op when Django is unavailable."""
    try:
        from django.utils import timezone as dj_tz  # noqa: PLC0415

        from watches.models import IngestRun  # noqa: PLC0415
    except Exception:  # noqa: BLE001 - standalone CLI without Django
        return
    try:
        IngestRun.objects.create(
            source=source,
            status=status,
            started_at=dj_tz.now(),
            duration_seconds=0.0,
            requests=stats.requests,
            products_found=stats.products_found,
            products_parsed=stats.products_parsed,
            inserted=stats.inserted,
            updated=stats.updated,
            duplicates=stats.products_duplicate,
            invalid=stats.products_invalid,
            failed=stats.products_failed,
            dry_run=dry_run,
            errors='\n'.join(stats.errors[:20]),
            note=note[:300],
        )
    except Exception as exc:  # noqa: BLE001 - audit must never break a run
        logger.warning('audit write failed for %s: %s', source, exc)


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
        logger.info('[%s] %s', adapter.display_name, adapter.note)
        adapter.client.close()
        return stats

    pages = max_pages if max_pages is not None else CONFIG.max_pages
    products = max_products if max_products is not None else CONFIG.max_products

    started_at = time.time()
    try:
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
    finally:
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

        status = 'ok'
        if stats.products_failed or stats.errors:
            status = 'failed'
        elif stats.products_invalid:
            status = 'partial'
        log_audit(
            slug,
            dry_run=dry_run,
            status=status,
            stats=stats,
            note=f'took {time.time() - started_at:.0f}s',
        )
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
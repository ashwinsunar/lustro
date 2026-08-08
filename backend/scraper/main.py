"""CLI entrypoint: `python -m scraper.main [source] --dry-run --limit N`.

Examples:
    python -m scraper.main list
    python -m scraper.main teddy_baldassarre --limit 3
    python -m scraper.main all --dry-run
"""
from __future__ import annotations

import argparse
import sys

from scraper.config import CONFIG
from scraper.safety.logging_setup import setup_logging
from scraper.sources import all_adapters


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog='scraper', description='Lustro catalog ingestion')
    p.add_argument('source', nargs='?', default='all', help='source slug or "all" or "list"')
    p.add_argument('--dry-run', action='store_true', help='parse & normalize only; never write to DB')
    p.add_argument('--limit', type=int, help=f'products per run (default {CONFIG.max_products})')
    p.add_argument('--pages', type=int, help=f'pages/URLs per source (default {CONFIG.max_pages})')
    p.add_argument('--delay', type=float, help='seconds between requests (default {CONFIG.delay_seconds})')
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    setup_logging()

    if args.source == 'list':
        for cls in all_adapters():
            print(f'{cls.slug:<28} {cls.status:<12} {cls.note}')
        return 0

    if not args.dry_run:
        # Storage layer uses the Django ORM; only needed when writing to the DB.
        import os  # noqa: PLC0415

        import django  # noqa: PLC0415

        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
        django.setup()

    from scraper.jobs.sync import run_all, run_source

    max_pages = args.pages or CONFIG.max_pages
    max_products = args.limit or CONFIG.max_products

    if args.source == 'all':
        report = run_all(dry_run=args.dry_run, max_pages=max_pages, max_products=max_products)
        print(report.lines())
        for err in report.errors:
            print(f'[Errors] {err}', file=sys.stderr)
        return 1 if report.errors else 0

    stats = run_source(args.source, dry_run=args.dry_run, max_pages=max_pages, max_products=max_products)
    print('\n'.join(stats.summary_lines()))
    for err in stats.errors:
        print(f'[Errors] {err}', file=sys.stderr)
    return 1 if stats.errors else 0


if __name__ == '__main__':
    raise SystemExit(main())
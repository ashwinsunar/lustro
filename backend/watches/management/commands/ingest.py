"""Django management command wrapper around the scraper CLI.

    python manage.py ingest teddy_baldassarre --dry-run --limit 3
    python manage.py ingest all --limit 25
"""
from django.core.management.base import BaseCommand, CommandError

from scraper.config import CONFIG
from scraper.safety.logging_setup import setup_logging
from scraper.sources import all_adapters, get_adapter


class Command(BaseCommand):
    help = 'Run the watch-catalog ingestion pipeline for one source or all sources.'

    def add_arguments(self, parser):
        parser.add_argument('source', nargs='?', default='all', help='source slug or "all"')
        parser.add_argument('--dry-run', action='store_true', help='parse/normalize only, no DB writes')
        parser.add_argument('--limit', type=int, default=None, help='max products per source')
        parser.add_argument('--pages', type=int, default=None, help='max listing pages/URLs per source')

    def handle(self, *args, **options):
        setup_logging()
        slug = options['source']
        max_pages = options['pages'] or CONFIG.max_pages
        max_products = options['limit'] or CONFIG.max_products

        if slug == 'list':
            for cls in all_adapters():
                self.stdout.write(f'{cls.slug:<28} {cls.status:<12} {cls.note}')
            return

        if slug != 'all' and get_adapter(slug) is None:
            raise CommandError(f'Unknown source slug: {slug}')

        from scraper.jobs.sync import run_all, run_source

        if slug == 'all':
            report = run_all(dry_run=options['dry_run'], max_pages=max_pages, max_products=max_products)
            self.stdout.write(report.lines())
            for err in report.errors:
                self.stderr.write(f'[Errors] {err}')
            if report.errors:
                raise CommandError('Ingestion finished with errors (see above).')
            return

        stats = run_source(slug, dry_run=options['dry_run'], max_pages=max_pages, max_products=max_products)
        self.stdout.write('\n'.join(stats.summary_lines()))
        for err in stats.errors:
            self.stderr.write(f'[Errors] {err}')
        if stats.errors:
            raise CommandError('Ingestion finished with errors (see above).')
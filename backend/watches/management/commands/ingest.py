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
        parser.add_argument(
            '--history',
            type=int,
            nargs='?',
            const=10,
            default=None,
            help='print last N ingest run audit rows and exit',
        )

    def handle(self, *args, **options):
        setup_logging()
        slug = options['source']

        if options['history'] is not None:
            self._show_history(options['history'])
            return

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

    def _show_history(self, limit: int):
        from watches.models import IngestRun

        rows = IngestRun.objects.all()[: max(1, min(limit, 200))]
        if not rows:
            self.stdout.write('No ingestion runs recorded yet.')
            return
        self.stdout.write(
            f'{"source":<24}{"status":<8}{"when":<22}{"req":>4}{"found":>6}{"parsed":>6}'
            f'{"ins":>4}{"upd":>4}{"invalid":>7}{"failed":>6}'
        )
        for r in rows:
            self.stdout.write(
                f'{r.source:<24}{r.status:<8}{r.started_at:%Y-%m-%d %H:%M:%S}'
                f'{r.requests:>4}{r.products_found:>6}{r.products_parsed:>6}'
                f'{r.inserted:>4}{r.updated:>4}{r.invalid:>7}{r.failed:>6}'
            )
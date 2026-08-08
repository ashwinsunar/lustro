"""Source registry — import every adapter so decorators register their slugs."""
from scraper.sources import (  # noqa: F401
    alpine_timepieces,
    chrono24,
    jomashop,
    regency_watch_nepal,
    swiss_timepieces_nepal,
    teddy_baldassarre,
    watchmaxx,
    watches_of_switzerland,
)
from scraper.sources.base import (
    SLUG_REGISTRY,
    SourceAdapter,
    all_adapters,
    get_adapter,
    register_slug,
)

__all__ = [
    'SLUG_REGISTRY',
    'SourceAdapter',
    'register_slug',
    'get_adapter',
    'all_adapters',
]
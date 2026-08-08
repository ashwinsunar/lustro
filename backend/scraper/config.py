"""Global configuration for the Lustro catalog ingestion system.

All values are environment-driven with conservative, polite defaults.
See report/scraper-status.md and the README for the full table.

Hard rules (never configurable off):
- No CAPTCHA/Cloudflare/anti-bot bypass, no fingerprint spoofing, no proxy
  rotation intended to evade blocking, no login automation.
- robots.txt is always checked per host before any request.
"""
from __future__ import annotations

import os


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


class ScraperConfig:
    """Global ingestion configuration (safety + behaviour)."""

    # ---- Safety / politeness ----
    user_agent = os.environ.get(
        'SCRAPER_USER_AGENT',
        'LustroCatalog/0.1 (+https://www.lustro.ch; catalog research; no commercial reuse of site content)',
    )
    timeout_seconds = _env_float('SCRAPER_TIMEOUT_SECONDS', 20)
    max_retries = _env_int('SCRAPER_MAX_RETRIES', 3)
    backoff_base_seconds = _env_float('SCRAPER_BACKOFF_BASE_SECONDS', 2.0)
    delay_seconds = _env_float('SCRAPER_DELAY_SECONDS', 3.0)  # between requests to the same host
    max_pages = _env_int('SCRAPER_MAX_PAGES', 5)  # listing pages (or product pages) per run/source
    max_products = _env_int('SCRAPER_MAX_PRODUCTS', 25)  # hard cap on parsed products per run/source
    robots_policy = 'strict'  # 'strict': refuse if robots.txt forbids; 'ignore': log only (not available)
    accept_jsonld = True
    minimum_product_age_minutes: int = 0

    # ---- Logging ----------------------------------------------------
    log_level = os.environ.get('SCRAPER_LOG_LEVEL', 'INFO')
    log_file = os.environ.get('SCRAPER_LOG_FILE', '')  # empty => console only


CONFIG = ScraperConfig()
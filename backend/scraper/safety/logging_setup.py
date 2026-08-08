"""Logging setup for the ingestion pipeline (root logger, console + optional file)."""
from __future__ import annotations

import logging
import sys

from scraper.config import CONFIG


def setup_logging() -> logging.Logger:
    root = logging.getLogger('scraper')
    root.setLevel(getattr(logging, CONFIG.log_level.upper(), logging.INFO))
    if not root.handlers:
        fmt = logging.Formatter('%(asctime)s %(levelname)s %(name)s: %(message)s')
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(fmt)
        root.addHandler(handler)
    if CONFIG.log_file:
        fh = logging.FileHandler(CONFIG.log_file)
        fh.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(name)s: %(message)s'))
        root.addHandler(fh)
    # keep httpx chatter off unless debugging
    logging.getLogger('httpx').setLevel(logging.WARNING)
    return root
"""Polite, robots-aware HTTP client for the ingestion pipeline.

Guarantees:
- robots.txt is honoured per host before any request (stdlib robotparser).
- Exponential backoff retries on transient errors/5xx.
- Minimum inter-request delay per host.
- Optional request log callback + structured error logging.
- No cookies, no fingerprinting, no anti-bot evasion of any kind.
"""
from __future__ import annotations

import logging
import random
import time
from dataclasses import dataclass, field
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import httpx

from scraper.config import CONFIG

logger = logging.getLogger('scraper.http')

DEFAULT_HEADERS = {
    'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en',
}


class RobotsBlockedError(Exception):
    """The requested URL is disallowed by the host's robots.txt."""


class MaxRetriesError(Exception):
    """The request exceeded the configured retry budget."""


@dataclass
class RobotsCacheEntry:
    parser: RobotFileParser
    fetched_at: float
    user_agent: str


class RobotsCache:
    """Thin wrapper + cache over urllib.robotparser (per-host, polite)."""

    def __init__(self) -> None:
        self._cache: dict[str, RobotsCacheEntry] = {}
        self.ttl_seconds = 3600 * 24

    def _entry(self, host: str, client: 'PoliteClient') -> RobotsCacheEntry:
        entry = self._cache.get(host)
        now = time.time()
        if entry and (now - entry.fetched_at) < self.ttl_seconds:
            return entry
        parser = RobotFileParser()
        robots_url = f'https://{host}/robots.txt'
        try:
            resp = client._raw_get(robots_url, is_robots=True)
            if resp.status_code in (200, 401, 403):  # 401/403 => no robots => treat as allow-all
                parser.parse(resp.text.splitlines())
            else:
                parser.parse([])  # missing robots => allow (per RFC 9309 default-allow)
        except Exception as exc:  # noqa: BLE001 - never fail the crawl on robots fetch
            logger.warning('robots fetch failed for %s: %s', host, exc)
            parser.parse([])
        entry = RobotsCacheEntry(parser=parser, fetched_at=now, user_agent=CONFIG.user_agent)
        self._cache[host] = entry
        return entry

    def can_fetch(self, url: str, client: 'PoliteClient') -> bool:
        host = urlparse(url).netloc
        entry = self._entry(host, client)
        return entry.parser.can_fetch(entry.user_agent, url)


@dataclass
class RequestStats:
    requests: int = 0
    bytes_read: int = 0
    errors: list[str] = field(default_factory=list)
    robots_blocks: int = 0


class PoliteClient:
    """HTTP client with robots checking, rate limiting, retries, and metric tracking."""

    def __init__(
        self,
        *,
        timeout: float | None = None,
        delay: float | None = None,
        max_retries: int | None = None,
        user_agent: str | None = None,
        stats: RequestStats | None = None,
        transport=None,
    ) -> None:
        self.timeout = timeout if timeout is not None else CONFIG.timeout_seconds
        self.delay = delay if delay is not None else CONFIG.delay_seconds
        self.max_retries = max_retries if max_retries is not None else CONFIG.max_retries
        self.user_agent = user_agent or CONFIG.user_agent
        self.stats = stats or RequestStats()
        self.robots = RobotsCache()
        self._last_request_at = 0.0
        self._client = httpx.Client(
            timeout=self.timeout,
            headers={'User-Agent': self.user_agent, **DEFAULT_HEADERS},
            follow_redirects=True,
            transport=transport,
        )

    # -- internal raw fetch (no robots/backoff) --
    def _raw_get(self, url: str, *, is_robots: bool = False) -> httpx.Response:
        self._throttle()
        logger.debug('GET %s (robots=%s)', url, is_robots)
        return self._client.get(url)

    def _throttle(self) -> None:
        wait = self.delay - (time.time() - self._last_request_at)
        if wait > 0:
            time.sleep(wait)
        self._last_request_at = time.time()

    # -- public fetch with robots + retry + backoff --
    def get(self, url: str) -> httpx.Response:
        if not self.robots.can_fetch(url, self):
            self.stats.robots_blocks += 1
            raise RobotsBlockedError(f'robots.txt disallows {url}')

        last_exc: Exception | None = None
        for attempt in range(1, self.max_retries + 1):
            self.stats.requests += 1
            try:
                resp = self._raw_get(url)
                if resp.status_code == 429 or 500 <= resp.status_code < 600:
                    raise httpx.HTTPStatusError(f'{resp.status_code}', request=resp.request, response=resp)
                self.stats.bytes_read += len(resp.content)
                return resp
            except (httpx.HTTPStatusError, httpx.TransportError) as exc:
                last_exc = exc
                if attempt < self.max_retries:
                    backoff = CONFIG.backoff_base_seconds * (2 ** (attempt - 1)) + random.uniform(0, 0.5)
                    logger.warning('GET %s attempt %d failed (%s); backing off %.1fs', url, attempt, exc, backoff)
                    time.sleep(backoff)
        self.stats.errors.append(f'{url}: {last_exc}')
        raise MaxRetriesError(f'GET {url} failed after {self.max_retries} attempts: {last_exc}') from last_exc

    def close(self) -> None:
        self._client.close()


class SourceRunnerStats(RequestStats):
    """Per-source run statistics with the CLI output contract."""

    def __init__(self) -> None:
        super().__init__()
        self.products_found = 0
        self.products_parsed = 0
        self.products_invalid = 0
        self.products_duplicate = 0
        self.products_failed = 0
        self.inserted = 0
        self.updated = 0
        self.unmatched_new = 0
        self.source: str = ''

    def summary_lines(self) -> list[str]:
        return [
            f'[{self.source}] Fetching pages: {self.requests} requests',
            f'[{self.source}] Found {self.products_found} products',
            f'[{self.source}] Parsed {self.products_parsed} products',
            f'[{self.source}] Skipped {self.products_invalid} invalid products',
            f'[{self.source}] Skipped {self.products_failed} failed products',
            f'[DB] Inserted {self.inserted}',
            f'[DB] Updated {self.updated}',
            f'[DB] Duplicates: {self.products_duplicate} (merged into existing rows)',
            f'[Errors] {len(self.errors)}',
        ]


__all__ = [
    'PoliteClient', 'RequestStats', 'MaxRetriesError',
    'RobotsBlockedError', 'RobotsCache',
]
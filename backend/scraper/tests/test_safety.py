"""Safety tests for PoliteClient: robots honouring, retries, budgets."""
from __future__ import annotations

import httpx
from django.test import SimpleTestCase

from scraper.safety.http import MaxRetriesError, PoliteClient, RobotsBlockedError

ROBOTS_ALLOW = 'User-agent: *\nAllow: /\n'
ROBOTS_PARTIAL = 'User-agent: *\nDisallow: /private\n'


def mock_transport(routes: dict) -> httpx.MockTransport:
    robots = routes.get('/robots.txt', ROBOTS_ALLOW)

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == '/robots.txt':
            return httpx.Response(200, text=robots, request=request)
        body = routes.get(request.url.path)
        if body is None:
            return httpx.Response(404, text='nope', request=request)
        if isinstance(body, int):
            return httpx.Response(body, request=request)
        return httpx.Response(200, text=body, request=request)

    return httpx.MockTransport(handler)


class PoliteClientRobotsTests(SimpleTestCase):
    def test_fetch_allowed_by_robots(self):
        client = PoliteClient(delay=0, transport=mock_transport({'/product': 'ok'}))
        resp = client.get('https://shop.example/product')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(client.stats.requests, 1)

    def test_blocked_by_robots(self):
        client = PoliteClient(
            delay=0,
            transport=mock_transport({'/robots.txt': ROBOTS_PARTIAL, '/product': 'ok'}),
        )
        with self.assertRaises(RobotsBlockedError):
            client.get('https://shop.example/private/product')
        self.assertEqual(client.stats.robots_blocks, 1)
        self.assertEqual(client.stats.requests, 0)


class PoliteClientRetriesTests(SimpleTestCase):
    def test_retries_then_succeeds(self):
        state = {'n': 0}

        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path == '/robots.txt':
                return httpx.Response(200, text=ROBOTS_ALLOW, request=request)
            state['n'] += 1
            if state['n'] == 1:
                return httpx.Response(500, text='boom', request=request)
            return httpx.Response(200, text='ok', request=request)

        client = PoliteClient(
            delay=0, max_retries=3, transport=httpx.MockTransport(handler)
        )
        resp = client.get('https://shop.example/x')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(client.stats.requests, 2)

    def test_gives_up_after_retry_budget(self):
        state = {'n': 0}

        def handler(request: httpx.Request) -> httpx.Response:
            if request.url.path == '/robots.txt':
                return httpx.Response(200, text=ROBOTS_ALLOW, request=request)
            state['n'] += 1
            return httpx.Response(503, text='busy', request=request)

        from unittest.mock import patch

        with patch('scraper.safety.http.CONFIG.backoff_base_seconds', 0.001):
            client = PoliteClient(
                delay=0, max_retries=3, transport=httpx.MockTransport(handler)
            )
            with self.assertRaises(MaxRetriesError):
                client.get('https://shop.example/x')
        self.assertEqual(state['n'], 3)
        self.assertEqual(len(client.stats.errors), 1)


class PoliteClientMetricsTests(SimpleTestCase):
    def test_bytes_and_error_tracking(self):
        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, text='hello world', request=request)

        client = PoliteClient(
            delay=0, max_retries=2, transport=httpx.MockTransport(handler)
        )
        client.get('https://shop.example/one')
        self.assertEqual(client.stats.requests, 1)
        self.assertEqual(client.stats.bytes_read, len(b'hello world'))
        self.assertEqual(client.stats.errors, [])
import os
import json
import asyncio
import sys
import logging
from datetime import datetime
from pathlib import Path

import django
from django.conf import settings
from django.core.handlers.wsgi import WSGIHandler

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

application = WSGIHandler()


def create_proxy_handler():
    """Create a serverless handler that proxies requests to the Django backend."""

    async def handler(request):
        logger.info(f"Proxy request: {request.method} {request.path}")

        api_base = os.getenv("VITE_API_URL", "http://localhost:8000")
        target_url = f"{api_base}{request.path}"

        body = None
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            try:
                body = await request.json()
            except Exception:
                body = request.body

        try:
            import httpx

            async with httpx.AsyncClient() as client:
                if body:
                    resp = await client.post(
                        target_url,
                        json=body,
                        headers=dict(request.headers),
                        timeout=30.0,
                    )
                else:
                    resp = await client.request(
                        request.method,
                        target_url,
                        headers=dict(request.headers),
                    )

            return resp.json(), resp.status_code
        except Exception as e:
            logger.error(f"Proxy error: {e}")
            return {"error": str(e), "status": "proxy_failed"}, 502

    return handler


def main():
    logger.info("Vercel-compatible backend started")
    logger.info(f"API base URL: {os.getenv('VITE_API_URL', 'http://localhost:8000')}")
    logger.info(f"Debug mode: {settings.DEBUG}")


if __name__ == "__main__":
    main()
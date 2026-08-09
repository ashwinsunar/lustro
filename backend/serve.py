import os
import json
import logging
import asyncio
import sys
import io
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

        # Build the target URL
        api_base = os.getenv("VITE_API_URL", "http://localhost:8000")
        target_url = f"{api_base}{request.path}"

        # Prepare request body
        body = None
        if request.method in ("POST", "PUT", "PATCH", "DELETE"):
            try:
                body = await request.json()
            except Exception:
                body = request.body

        # Prepare request
        req = None
        try:
            from starlette.requests import Request as StarletteRequest
            from starlette.responses import JSONResponse

            # Use httpx to proxy
            import httpx

            async with httpx.AsyncClient() as client:
                if body:
                    response = await client.post(
                        target_url,
                        json=body,
                        headers=dict(request.headers),
                        timeout=30.0,
                    )
                else:
                    response = await client.request(
                        request.method,
                        target_url,
                        headers=dict(request.headers),
                    )

            # Build response
            return JSONResponse(
                content=response.json(),
                status_code=response.status_code,
            )
        except Exception as e:
            logger.error(f"Proxy error: {e}")
            return JSONResponse(
                content={"error": str(e), "status": "proxy_failed"},
                status_code=502,
            )

    return handler


def main():
    logger.info("Vercel-compatible backend started")
    logger.info(f"API base URL: {os.getenv('VITE_API_URL', 'http://localhost:8000')}")
    logger.info(f"Debug mode: {settings.DEBUG}")

    # Start Django WSGI server
    application = WSGIHandler()
    logger.info("Django server ready")


if __name__ == "__main__":
    main()
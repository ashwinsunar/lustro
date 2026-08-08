# Lustro catalog ingestion (`backend/scraper`)

Permitted, robots-aware ingestion of watch catalogue data into the Lustro
catalog. Everything runs on public, publisher-sanctioned endpoints (sitemaps,
JSON-LD, storefront feeds). No scraping that robots.txt prohibits, no
anti-bot evasion, no cookies, no account sessions, no checkout access.

## Status by source (2026-08)

| Slug | Status | Access method |
|---|---|---|
| `teddy_baldassarre` | active | Public Shopify `/products.json` feed |
| `watches_of_switzerland` | active | Product sitemap + in-page `ng-state` JSON |
| `watchmaxx` | active | Per-brand sitemaps + schema.org JSON-LD |
| `jomashop` | partial | Sitemap OK; prices render client-side only (JS) — most pages rejected, JSON-LD pages ingested |
| `chrono24` | blocked | Cloudflare 403 on all requests; robots disallows crawlers |
| `swiss_timepieces_nepal` | manual | GoDaddy builder site; no structured data — manual entry |
| `alpine_timepieces` | unsupported | Next.js CSR shell; sitemap has no `<loc>` entries |
| `regency_watch_nepal` | unsupported | Domain does not resolve |

## Usage

Standalone CLI (parsers/normalizer only in `--dry-run`; Django settings boot
automatically when writing to the DB):

```bash
cd backend
./venv/bin/python -m scraper.main list                     # statuses & notes
./venv/bin/python -m scraper.main teddy_baldassarre --dry-run --limit 3
./venv/bin/python -m scraper.main all --limit 25           # real ingest
```

Or as a management command (same output):

```bash
./venv/bin/python manage.py ingest teddy_baldassarre --limit 5
./venv/bin/python manage.py ingest all --dry-run
```

Example run report:

```
[Teddy Baldassarre] Fetching pages: 2 requests
[Teddy Baldassarre] Found 505 products
[Teddy Baldassarre] Parsed 2 products
[DB] Inserted 2
[DB] Updated 3
[DB] Duplicates: 3 (merged into existing rows)
[Errors] 0
```

## Pipeline

```
discover_urls (sitemaps/products feed) -> PoliteClient.fetch (robots,
throttle, retries, metrics) -> parse_product -> RawProduct -> normalize ->
validate (quality ok/partial/flagged) -> Repository.upsert
```

**Upsert identity** (never creates duplicates, keeps catalogue flags):
1. `(source, source_product_id)` → update that row
2. `reference_number` + normalized brand → merge
3. `sku` + normalized brand → merge
4. insert otherwise; on a reference-UNIQUE collision with the same watch
   (normalized brand) it merges instead of failing

## Politeness contract (`scraper/safety/http.py`)

- robots.txt honoured per host before every request (stdlib `robotparser`,
  RFC 9309 semantics: 401/403/missing robots = allow-all)
- minimum delay between requests, exponential backoff with jitter on 5xx/429
- one request per listing, bounded pages/products per run
- every URL seen is logged; nothing is fetched twice within a run

## Tests

```bash
./venv/bin/python manage.py test scraper.tests    # unit tests, no network
./venv/bin/python manage.py test                  # full suite
```

Covered: robots allow/block, retry budgets, byte/error metrics, sitemap
crawler index-children yielding and filters, adapters' parsing against
fixtures (watchmaxx JSON-LD, teddy Shopify JSON, jomashop rejection).

## Adding a source

1. Create `scraper/sources/<slug>.py` with a `@register_slug` adapter
   (implement `discover_urls` and `parse_product`).
2. Import it in `scraper/sources/__init__.py`.
3. Set `status` honestly: `active` / `partial` / `blocked` / `unsupported` /
   `manual` — nothing runs for the last three, and the blocklists make that
   explicit.
4. Add a parse test with a minimal fixture.
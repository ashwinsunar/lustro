# Lustro — Scraper Source Status (Phase 15)

Date: 2026-08-08 · Snapshot of the live ingestion registry (companion: `project-audit.md`, `data-quality.md`)

## 1. Registry (`backend/scraper/sources/base.py`)

Adapters register via `@register_slug` in `base.py`; `all_adapters()` drives the CLI, `manage.py ingest`, and the API facet `GET /api/v1/sources/`.

| slug | Display | Status | Discovery | Notes |
| ---- | ------- | ------ | --------- | ----- |
| `teddy_baldassarre` | Teddy Baldassarre | `active` | Shopify `products.json` sitemap | 3 watches imported; refs parsed from tags (marketing tags rejected, digit required) |
| `watchmaxx` | WatchMaxx | `active` | brand sitemaps + JSON-LD | 2 watches imported; every sitemap `loc` accepted (no `-watch-` filter) |
| `watches_of_switzerland` | Watches of Switzerland | `active` | `ng-state` JSON payload | 2 watches imported |
| `jomashop` | Jomashop | `partial` | sitemap_001 categories, two-phase discovery | prices fully JS-rendered → 0 parseable; kept at `partial`, never emits prices it cannot read |
| `chrono24` | Chrono24 | `blocked` | — | Cloudflare 403; no anti-bot evasion per policy |
| `swiss_timepieces_nepal` | Swiss Timepieces Nepal | `manual` | — | requires explicit flag before enabling |
| `alpine_timepieces` | Alpine Timepieces | `unsupported` | — | no catalog structure |
| `regency_watch_nepal` | Regency Watch Nepal | `unsupported` | — | no catalog structure |

Status semantics: `active` = being synced; `partial` = structure parseable but some fields unavailable; `manual` = only run when explicitly enabled; `blocked` = unreachable without evasion (evasion forbidden); `unsupported` = retailer cannot be ingested at all.

## 2. Safety layer (`scraper/safety/http.py`)

- Polite client: robots.txt check (stdlib `urllib.robotparser`), per-source delay, retries with backoff, page caps per run, transport injection for offline unit tests.
- No CAPTCHA/Cloudflare bypass, no auth/paywall scraping, no personal data, no retailer imagery stored (manifest URL + license only).

## 3. Server access (`manage.py ingest`)

| Flag | Purpose |
| ---- | ------- |
| `--dry-run` | report only, no writes |
| `--limit N` | cap products per source |
| `--all` | run every registered source |
| `--history` | list recent `IngestRun` audit rows |

## 4. Health at a glance

| Check | Result |
| ----- | ------ |
| scraper-only tests (no network) | 14 passing |
| full backend suite (`manage.py test`) | 53 passing |
| frontend `tsc`/Vitest/build | clean / 21 passing / ok |
| audit trail | every run in `IngestRun`; see `python manage.py ingest --history` |

## 5. Backlog

1. jomashop: decide between a headless/price-token strategy or downgrading to `blocked`.
2. chrono24: stays `blocked` by policy (no evasion).
3. Re-evaluate `unsupported` list when retailers ship machine-readable catalogs.
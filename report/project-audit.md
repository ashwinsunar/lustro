# Lustro — Project Audit

Date: 2026-08-08 · Author: lead-eng agent · Scope: watch-catalog ingestion system

## 1. Existing architecture

| Layer     | Tech                                                              |
| --------- | ----------------------------------------------------------------- |
| Frontend  | React 19, TypeScript, Vite 8, Tailwind v4, three.js, GSAP, framer-motion, Zustand, TanStack Query (axios client) |
| Backend   | Django 5.2, Django REST Framework 3.17, SimpleJWT, django-filter, SQLite (dev) / PostgreSQL (docker-compose) |
| Data      | SQLite `db.sqlite3` seeded with 54 watches / 10 brands            |
| Testing   | Vitest (frontend, 21 tests) · Django test runner (backend, 33 tests) · pytest available |
| HTTP on backend | httpx 0.28, openai SDK (chat), Pillow (images) installed        |

Repo layout: `backend/` (config, watches, orders, users, chat) · `frontend/` (Vite SPA) · `docker/`, `docker-compose.yml`, `docs/`, `report/`.

## 2. Existing watch/product model (`watches/models.py`)

- `Brand` (name unique, slug, description, logo, founded_year, country)
- `Category` (name unique, slug, description, image)
- `Collection` (name unique, slug, description, cover_image, featured)
- `Watch` — title, slug, brand FK, category FK, collection FK, price (Decimal), discount_price,
  `reference_number` (unique), movement (choices: automatic/manual/quartz/spring_drive),
  `case_size` (CharField e.g. "41mm"), case_material, dial_color, strap_material,
  `water_resistance` (CharField e.g. "300m"), gender (choices), warranty_period,
  description, is_featured/trending/new_arrival/best_seller, in_stock, stock_count,
  rating, review_count, created_at, updated_at; slug auto = `brand title ref`
- `WatchImage` (image FileField upload_to watches/, is_primary, order)
- `WatchVideo` (video, thumbnail, title)
- `Review`, `StockNotify` (support models)

Missing vs. target schema: caliber, movement_type, power_reserve, case shape (diameter/thickness/lug-to-lug numeric), crystal, bezel, clasp, functions, year, limited_edition, currency, availability, source/source_product_id/source_url, image_url(s), image license/attribution, URI/JSON failure logs. `case_size`/`water_resistance` are strings — need numeric + raw-string preservation.

## 3. Existing APIs (`watches/urls.py` + DRF ViewSets)

- `GET /api/v1/brands|categories|collections|watches` — paginated (12/page), DRF.
- Watches filter backend: DjangoFilterBackend + Search + Ordering; `WatchFilter` supports min/max price, brand(s), category(s), movements, genders, on_sale, featured/trending/new/best, in_stock, exclude.
- Search fields: title, brand__name, reference_number, description. Ordering: price, created_at, rating, review_count, title.
- Reviews: `watches/{slug}/reviews` (list/create, verified-purchase flag). Stock notify `watches/{slug}/notify`.
- `users`: auth (login/register/refresh/profile, JWT), newsletter. `orders/api/v1/`: cart/checkout/orders, coupons. `chat`: concierge thread + appointments (OpenAI backend).

## 4. Existing UI (frontend)

- Shop (`ShopPage`) → `WatchFilters` (brands, categories, movements, genders, price) + `WatchSortBar` + `WatchGrid`; `WatchCard` (image, brand, title, movement, case size, price, availability) ; SearchPage; brand detail; compare (case, movement, price, gender, stock, rating); product detail with specs table (movement/case/dial/strap/water/warranty + reference row), JSON-LD breadcrumb, images lightbox; cart/checkout/orders native.

## 5. Existing seed data

- `watches/management/commands/bulk_seed.py` — resets + seeds 54 watches across 10 real brands (Rolex…Jaeger-LeCoultre), 5 collections, image pool from Unsplash (free license, includes source attribution in code comments only), review "Demo" unverified.

## 6. Existing image handling

- Watches store ImageField on WatchImage; `bulk_seed` downloads from Unsplash pool at seed time; `fix_missing_images` reparses; frontends render local media URLs (or fig fallbacks). No source-URL / license / attribution tracking yet.

## 7. Existing problems (from audit + prior sessions)

- Live imports raise new failure modes: catalog is a curated retail showcase; guard Rails: never market a mis-specified watch. Must validate/normalize/dedupe before writes.
- Watch filtered model stores some specs as display strings ("41mm"), so cross-source numeric comparison is impossible without computed numeric fields.
- No source-credibility or license metadata; source URLs unreachable via craw
- No ingest audit log (failed-webhook, invalid product, duplicate rejection).
- No scraper safety layer (rate limits, robots, timeouts, retries).

## 8. Recommended integration architecture

Create a **standalone Python ingestion package** `backend/scraper/` (importable package with Django String):

```
backend/scraper/
├── sources/  (one adapter per retailer)
├── models/    (pydantic RawProduct / NormalizedWatch)
├── parsers/   price, dimensions, movement, water, materials, colors, dates, jsonld
├── normalizer/ watch_normalizer.py
├── deduplication/ matcher.py
├── storage/   repository.py (Django ORM)
├── jobs/      sync.py (single run entry)
├── safety/    http.py (rate limiting, retry, robots), logging
└── validators/ data_quality.py
```

- Backend model: extend `Watch` with a migration (nullable columns + `source`/`source_product_id`/`source_url`/`availability`/`is_imported` + image-source/license/attribution), plus sparse `WatchSourceRecord`? Prefer single normalized row per watch reference: same real watch from multiple retailers = 1 catalogue row (price/availability refreshed on sync).
- Management command `python manage.py ingest <source>` wraps scraper CLI; supports `--dry-run`, `--limit`.
- API: add facets (case materials, dial colors, straps, sources, water) + filters + `source` order; frontend: filter chips fill from facets.
- UI integration: extend `WatchCard` and product detail to show new spec chips — imports only via existing Watch.rating=0, review_count=0 (no fake reviews).
- Data store: use SQLite (mirrors dev); schema compatible with Postgres (docker) via a single migration.

### Legal/compliance baseline (Phase 9+15)

- Respect robots.txt via Python stdlib `urllib.robotparser`; polite UA, per-source delays; max pages; no CAPTCHA/CF/anti-bot evasions; no paywall/auth; no personal data; no scraping personal data.
- Copyright: do not store/redistribute retailer photography. Store only original manifest URL + license field; product descriptions are short facts.

Phase gates: audit → schema & package → parser/normalizer/dedupe/quality tests → adapters → CLI → API/UI → docs. All phases verified via `manage.py test`, `pytest`, npm build/lint/test, dry-run with fixture data.

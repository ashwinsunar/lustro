# Lustro — Data Quality Report (Phase 13)

Date: 2026-08-08 · Scope: imported watch-catalog rows · Companion: `project-audit.md`, `scraper-status.md`

## 1. Validation pipeline (`backend/scraper/validation/quality.py`)

Every candidate product passes deterministic validation before it is allowed into the catalog:

- **Rejects** (row dropped, logged): missing brand, missing model, malformed/absent price, invalid URL, or a product that is clearly not a watch (strap, band, buckle, bracelet only, gift card, watch box, winder, tool, kit, display case, accessory, travel roll).
- **Warnings** (row kept, quality flagged): unsupported movement, numeric spec strings, missing description, missing specs (case size / water resistance), missing image.
- **Quality flags**: `ok` (minimal risk), `partial` (some non-critical gaps), `flagged` (multiple gaps or suspect data).
- Nothing is fabricated: unknown values stay `None`/`''`; no retailer photography is stored (only the manifest URL + source product id + license).

## 2. Normalization rules (`scraper/normalizer/`)

| Attribute   | Rule |
| ----------- | ---- |
| brand       | must resolve to existing `Brand` row (slug/name, `_norm_brand`) — unknown brands skip |
| model       | falls back to title; cleaned |
| price       | parsed from retailer currency/format, validation-required |
| reference_number | stored as `None` when absent (not string-typed) to keep unique constraints clean |
| source      | slug of the supplying adapter |
| sources     | comma-separated provenance when a row matches multiple retailers |

Normalization is deterministic and unit-tested (14 scraper unit tests, no network).

## 2. Live-run snapshot (2026-08, 4th run)

| Source | result | rows written | quality mix |
| ------ | ------ | ------------ | ----------- |
| teddy_baldassarre | ok | 3 | partial (sites with prices) |
| watchmaxx | ok | 2 | partial |
| watches_of_switzerland | ok | 2 | partial |
| jomashop | partial (0 prices parseable — amounts are JS-rendered) | 0 | flagged |
| chrono24 | blocked | 0 | — |
| Total imported | – | 7 | 7 partial, 0 perfect |

Catalogue: 54 seeded catalogue rows + 7 imported = 61 rows against 40+ distinct references. 0 duplicate rows were created (merge on unique `brand+title+reference`).

## 3. Known data-quality gaps

1. **Price integrity on JS-rendered retailers**: jomashop's prices are client-side rendered; server HTML contains no numeric price tokens → 0 rows ingested. The source remains `partial` — matches the "never market a mis-specified watch" guardrail.
2. **Spec depth**: `case_size`/`water_resistance` stored as display strings ("41mm"); cross-source numeric comparison requires computed numeric columns (Phase 13 recommendation, not yet implemented).
3. **Missing specs**: several imported rows warn on description/spec gaps; flagged rows are still listed, but they never get fake prices — `rating`/`review_count` are 0 for imports.
4. **Reference collisions**: unique refs now `NULL` when absent; a rebuild recover-integrity path merges into existing rows instead of failing (ref-collision fix shipped in commit `4831907`).

## 4. Metrics before/after sync

- 53 backend tests pass (`manage.py test`), incl. 6 Phase-11 facet tests and 14 scraper-only tests (no network).
- Frontend: `tsc --noEmit` clean, 21 Vitest tests pass, production build ok.
- Import runs are recorded in `IngestRun` audit table (Phase 16) — every run state visible via `python manage.py ingest --history`.
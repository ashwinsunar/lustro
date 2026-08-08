# Lustro

Curating the world's most exceptional timepieces — a full-stack luxury watch e-commerce experience with a 3D home experience, concierge chat, reviews, wishlist, compare, coupon checkout and order tracking.

## Stack

| Layer     | Tech                                                        |
| --------- | ----------------------------------------------------------- |
| Frontend  | React 19, TypeScript, Vite 8, Tailwind CSS v4, three.js, GSAP, framer-motion, Zustand, TanStack Query |
| Backend   | Django 6, Django REST Framework, SimpleJWT, SQLite (dev) / PostgreSQL (docker) |
| Testing   | Vitest (frontend), Django test runner (backend)             |

## Quick start

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver  # http://127.0.0.1:8000
```

The repo ships with a seeded SQLite database (54 watches across 10 brands). Re-seed with:

```bash
python manage.py bulk_seed        # resets and reseeds catalog
python manage.py createsuperuser  # admin access
```

### Frontend

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

API base URL defaults to `http://127.0.0.1:8000` — override with `VITE_API_URL`.

## Environment variables (backend)

| Variable                | Default          | Notes                                   |
| ----------------------- | ---------------- | --------------------------------------- |
| `DJANGO_SECRET_KEY`     | dev-only fallback | **Set a real value in production**      |
| `DJANGO_DEBUG`          | `true`           | `false` in production                   |
| `DJANGO_ALLOWED_HOSTS`  | `*`              | comma-separated in production           |
| `DJANGO_SECURE`         | `false`          | enables HTTPS/secure-cookie hardening   |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | —           | comma-separated                        |
| `CORS_ALLOWED_ORIGINS`  | —                | comma-separated (all origins in dev)    |
| `DB_HOST` / `DB_NAME` / `DB_USER` / `DB_PASS` / `DB_PORT` | — | when `DB_HOST` is set, Postgres is used |

## Docker

```bash
docker compose up --build   # backend :8000, frontend :5173, postgres, redis
```

## Features

- **Immersive 3D home** — three.js watch scene with GSAP scroll choreography (`/`)
- **Catalog** — 54 watches, 10 brands, 6 categories; filters (brand, category, movement, gender, price, stock, sale), sorting, grid/list views, URL-driven state, pagination, search
- **Product pages** — image gallery, specs, collector reviews (verified purchases), related pieces, waitlist for sold-out pieces, share link
- **Commerce** — cart (save for later), wishlist, compare (max 3), coupon checkout (`LUSTRO10`), card/COD payment, stock reservation and release on cancel
- **Orders** — order confirmation with status tracker, order history, cancel with stock restore
- **Accounts** — register/login with JWT refresh, profile editing, role model (customer/seller/admin)
- **Concierge chat** — rule-based recommendation engine (brand, budget, style), conversation persistence, quick-reply chips
- **Newsletter** — footer subscription with admin management
- **Admin** — Django admin for watches, brands, orders, coupons, waitlists, newsletters

## API surface

```
POST /api/v1/auth/login/            POST /api/v1/auth/register/
GET/PATCH /api/v1/auth/profile/     POST /api/v1/auth/newsletter/
GET  /api/v1/watches/?brands=rolex,omega&min_price=5000&ordering=-price
GET  /api/v1/watches/<slug>/        GET/POST /api/v1/watches/<slug>/reviews/
POST /api/v1/watches/<slug>/notify/
GET  /api/v1/brands/  /categories/  /collections/
GET  /api/v1/orders/                POST /api/v1/orders/
POST /api/v1/orders/<number>/cancel/
GET  /api/v1/orders/coupon/<code>/
POST /api/v1/chat/                  POST /api/v1/chat/appointments/
```

## Testing

```bash
cd backend && source venv/bin/activate && python manage.py test
cd frontend && npm run test && npm run lint && npm run build
```

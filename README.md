# Lustro

A luxury watch e-commerce platform with immersive 3D home experience, AI concierge chat, reviews, wishlist, compare, coupon checkout, and order tracking.

**Live:** [lustro.vercel.app](https://lustro.vercel.app)

## Stack

| Layer    | Tech                                                             |
| -------- | ---------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4, three.js, GSAP, Framer Motion, Zustand, TanStack Query |
| Backend  | Django 6, Django REST Framework, SimpleJWT                       |
| Database | Neon Postgres (production) / SQLite (local dev)                  |
| Deploy   | Vercel (frontend + backend services)                             |

## Quick start

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver  # http://127.0.0.1:8000
```

Re-seed the catalog:

```bash
python manage.py bulk_seed        # resets and reseeds 54 watches across 10 brands
python manage.py createsuperuser  # admin access
```

### Frontend

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

API base URL defaults to `http://127.0.0.1:8000` — override with `VITE_API_URL`.

### Demo account

```
Email:    demo@lustro.com
Password: Demo1234!
```

Pre-loaded with a sample order (`LST-668CDD`) and 10 reviews.

## Environment variables (backend)

| Variable                          | Default           | Notes                              |
| --------------------------------- | ----------------- | ---------------------------------- |
| `DJANGO_SECRET_KEY`               | dev-only fallback | **Set a real value in production** |
| `DJANGO_DEBUG`                    | `true`            | `false` in production              |
| `DJANGO_ALLOWED_HOSTS`            | `*`               | comma-separated in production      |
| `DJANGO_SECURE`                   | `false`           | enables HTTPS/secure-cookie hardening |
| `DJANGO_CSRF_TRUSTED_ORIGINS`     | —                 | comma-separated                   |
| `CORS_ALLOWED_ORIGINS`            | —                 | comma-separated (all origins in dev) |
| `DATABASE_URL` / `POSTGRES_URL`   | —                 | Neon Postgres connection string    |
| `DB_HOST` / `DB_NAME` / `DB_USER` / `DB_PASS` / `DB_PORT` | — | Postgres via individual vars |

## Features

- **Immersive 3D home** — three.js watch scene with GSAP scroll choreography (`/`)
- **Catalog** — 54 watches, 10 brands, 6 categories; filters, sorting, grid/list views, URL-driven state, pagination, search
- **Product pages** — image gallery, specs, collector reviews (verified purchases), related pieces, waitlist for sold-out pieces
- **Commerce** — cart (save for later), wishlist, compare (max 3), coupon checkout (`LUSTRO10` for 10% off), card/COD payment
- **Orders** — order confirmation with status tracker, order history, cancel with stock restore
- **Accounts** — register/login with JWT refresh, profile editing
- **Concierge chat** — rule-based recommendation engine (brand, budget, style), conversation persistence
- **Admin** — Django admin for watches, brands, orders, coupons, waitlists

## API surface

```
POST   /api/v1/auth/login/              POST /api/v1/auth/register/
GET    /api/v1/auth/profile/            PATCH /api/v1/auth/profile/
POST   /api/v1/auth/newsletter/
GET    /api/v1/watches/                 GET  /api/v1/watches/<slug>/
GET    /api/v1/watches/<slug>/reviews/  POST /api/v1/watches/<slug>/reviews/
POST   /api/v1/watches/<slug>/notify/
GET    /api/v1/brands/                  GET  /api/v1/categories/
GET    /api/v1/orders/                  POST /api/v1/orders/
POST   /api/v1/orders/<number>/cancel/
GET    /api/v1/orders/coupon/<code>/
POST   /api/v1/chat/
```

## Testing

```bash
cd backend && source venv/bin/activate && python manage.py test
cd frontend && npm run test && npm run lint && npm run build
```

## License

Private — Ashwin Sunar

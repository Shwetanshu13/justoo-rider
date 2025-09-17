## Justoo Rider App (Frontend + Backend Monorepo)

End-to-end rider application consisting of:

1. React Native (Expo) mobile app for riders to log in, view their current delivery, review completed orders (filterable), and manage their profile + logout.
2. Node.js/Express backend (with Drizzle ORM & PostgreSQL/Neon) providing authentication and rider/order APIs.

---

### Contents

-   Overview & Features
-   Architecture & Directory Layout
-   Tech Stack
-   Quick Start (TL;DR)
-   Backend Setup
-   Frontend (Expo) Setup
-   Environment Variables
-   Running (Dev & Prod Notes)
-   API Summary
-   Data Model Reference
-   Troubleshooting & Common Issues
-   Next Steps / Enhancements

---

## Overview & Features

Rider-focused delivery app enabling:

-   Email/password authentication (JWT-based)
-   View current assigned order (status: out_for_delivery)
-   View completed (delivered) orders with date/month filtering (client-side filters; server accepts optional query params)
-   Update order status (endpoint scaffold-ready)
-   View rider profile (id, name, status, etc.)
-   Secure logout & persisted auth (AsyncStorage)
-   Responsive layout with Safe Areas handled for iOS/Android devices

## Architecture & Directory Layout

Monorepo style root folder:

```
justoo-rider/
  App.js
  index.js
  package.json              # Frontend (Expo) package
  README.md
  README_AUTH.md            # Original backend auth notes (left intact)
  schema.txt                # Drizzle schema definition (reference only)
  backend/                  # Node.js API service
    index.js
    package.json
    routes/
    controllers/
    db/                     # Drizzle / db helpers
    config/
    middleware/
    seed.js                 # (If used for seeding data)
    test_auth.js            # Simple manual auth test script
  src/                      # Frontend source
    context/                # AuthContext etc.
    navigation/             # Tab navigator
    screens/                # Login, CurrentOrders, CompletedOrders, Profile
    services/               # ApiService
  assets/                   # App icons & splash
```

## Tech Stack

Frontend:

-   Expo SDK 54 (React Native 0.81, React 19)
-   React Navigation (bottom tabs, stack)
-   AsyncStorage for token persistence
-   Safe Area Context
-   Fetch / Axios (Axios currently in deps; core calls use fetch)

Backend:

-   Node.js + Express 5
-   Drizzle ORM (PostgreSQL)
-   Neon/PostgreSQL (serverless friendly) via `@neondatabase/serverless`
-   JWT (jsonwebtoken)
-   bcrypt / bcryptjs (password hashing) [only one is necessary long-term]
-   dotenv, cors

Tooling:

-   drizzle-kit for migrations (planned/optional)
-   EAS / Expo tooling for builds

## Quick Start (TL;DR)

```
# 1. Backend
cd backend
cp .env.example .env   # (If .env.example exists; otherwise create .env manually)
npm install
npm run dev

# 2. Frontend (new terminal at repo root)
npm install
export EXPO_PUBLIC_RIDER_BACKEND_URL="http://<your-lan-ip>:3006"
npm start

# Open Expo Go (device) or emulator
```

Use test credentials (if seeded):

-   Email: test.rider@justoo.com
-   Password: test123

## Backend Setup

1. Navigate into `backend/`:
    ```bash
    cd backend
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Create `.env` file (if not present):
    ```env
    RIDER_BACKEND_PORT=3006
    JWT_SECRET=change-me-in-production
    JWT_EXPIRES_IN=676h
    DATABASE_URL=postgres://<user>:<password>@<host>/<db>?sslmode=require
    ```
4. (Optional) Run migrations / apply schema:
    - Currently schema lives in `schema.txt` (Drizzle definitions). Integrate with drizzle-kit by creating a drizzle config and running `npx drizzle-kit generate` & `drizzle-kit push` when formalized.
5. (Optional) Seed data:
    ```bash
    node seed.js
    ```
6. Start the server:
    ```bash
    npm run dev   # auto reload (node --watch)
    # or
    npm start
    ```
7. Server listens on `http://localhost:3006` (or your configured port).

### Notes

-   Only one of `bcrypt` or `bcryptjs` is required; you can remove the unused one in future cleanup.
-   Ensure Neon/Postgres connection string uses SSL if required.
-   JWT includes rider identification fields.

## Frontend (Expo) Setup

1. At the repo root:
    ```bash
    npm install
    ```
2. Provide backend URL to the app. Options:
    - (Recommended) Create `app.config.js` or use `.env` with `EXPO_PUBLIC_RIDER_BACKEND_URL`.
    - Or export in your shell before starting:
        ```bash
        export EXPO_PUBLIC_RIDER_BACKEND_URL="http://<your-lan-ip>:3006"
        ```
3. Start Metro / Expo:
    ```bash
    npm start
    ```
4. Open on:
    - Android emulator
    - iOS simulator
    - Physical device via Expo Go (must be on same network as backend)

### Android Emulator Localhost Mapping

If you leave the URL empty, the app attempts to derive host from the Metro bundler. For Android emulators `localhost` is internally remapped to `10.0.2.2` automatically by the helper logic.

### Safe Areas

All screens and tab bar are wrapped with `react-native-safe-area-context` for consistent padding.

## Environment Variables

Backend (`backend/.env`):

```
RIDER_BACKEND_PORT=3006
JWT_SECRET=...
JWT_EXPIRES_IN=676h
DATABASE_URL=...
```

Frontend (Expo):

```
EXPO_PUBLIC_RIDER_BACKEND_URL=http://<lan-ip>:3006
```

If omitted, the app derives a base URL from the Metro host. For physical devices you must supply a reachable LAN IP.

## Running (Dev & Prod)

Development:

```
Backend: npm run dev (hot reload)
Frontend: npm start (Expo)
```

Production (conceptual):

-   Containerize backend or deploy to serverless (Neon-compatible host, Render, Railway, Fly.io, etc.).
-   Build mobile app with EAS or bare build:
    -   `npx expo prebuild` (if ejecting)
    -   `eas build --platform android` / `--platform ios`
-   Set `EXPO_PUBLIC_RIDER_BACKEND_URL` at build time to production API URL.

## API Summary

Authentication header for protected endpoints:

```
Authorization: Bearer <jwt>
```

| Endpoint                 | Method | Description                                      | Body / Query                               |
| ------------------------ | ------ | ------------------------------------------------ | ------------------------------------------ |
| `/api/auth/login`        | POST   | Email/password login                             | `{ email, password }`                      |
| `/api/auth/profile`      | GET    | Get current rider profile                        | -                                          |
| `/api/orders/current`    | GET    | Current assigned order (status out_for_delivery) | -                                          |
| `/api/orders/completed`  | GET    | Completed (delivered) orders                     | `?startDate&endDate&month&year` (optional) |
| `/api/orders/:id/status` | PUT    | Update order status (planned/partial)            | `{ status }`                               |

Sample login:

```bash
curl -X POST http://localhost:3006/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test.rider@justoo.com","password":"test123"}'
```

## Data Model Reference

Full schema reference: `schema.txt` (Drizzle definitions). Key tables:

-   `justoo_riders` – Rider identity & status
-   `orders` – Order lifecycle (status enum: placed → delivered/cancelled)
-   `order_items` – Line items (quantity, price, unit)
-   `justoo_payments` – Payment metadata
-   `inventory_users` – (Shared users; riders currently mapped separately)

Important Enums:

-   `order_status`, `payment_status`, `payment_method`, `rider_status`.

## Troubleshooting & Common Issues

| Issue                                 | Cause                           | Fix                                                                  |
| ------------------------------------- | ------------------------------- | -------------------------------------------------------------------- |
| Network request failed                | Device cannot reach `localhost` | Use LAN IP & set `EXPO_PUBLIC_RIDER_BACKEND_URL`                     |
| Android emulator not hitting backend  | Using `localhost`               | Use `10.0.2.2` or rely on auto replacement                           |
| 401 Unauthorized                      | Missing/expired token           | Re-login; clear AsyncStorage if corrupted                            |
| Play Protect blocks APK               | Unsigned / dev build            | Use EAS internal distribution or enable install from unknown sources |
| Wrong backend URL in production build | Env not injected at build time  | Set env in `eas.json` or via `--env-file`                            |

Debug tips:

-   Check Metro console for `[ApiService] Using backend base URL:` line.
-   Use `curl` or Postman to confirm backend responses before testing in-app.
-   Tail backend logs for 500 errors.

## Next Steps / Enhancements

Potential improvements:

-   Formal Drizzle migration setup & automated migrations
-   Replace duplicate bcrypt packages with one
-   Add order status update UI + optimistic updates
-   Add pagination / infinite scroll for completed orders
-   Add unit / integration tests (backend + frontend)
-   Add centralized error boundary & toast notifications
-   Add CI workflow (lint, build, test)
-   Implement rate limiting & request validation middleware in production

## License

Internal project (no explicit license specified). Add one if open-sourcing.

---

Maintained by the Justoo team. Contributions and refinements welcome.

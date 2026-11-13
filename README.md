# Ledger — budget tracker

A personal-finance app built with Angular 17 (standalone components + signals). Track income and expenses, see where this month's money went, and set monthly budgets per category. Accounts, data and authentication are served by the shared Express + PostgreSQL API in [`../back-end`](../back-end).

## Features

- **Dashboard** — all-time balance, this month's income and spending (colour-coded against your alert thresholds), spending by category, and recent transactions. Add or edit transactions without leaving the page.
- **Transactions** — search (merchant, category, notes), filter by category, sort any column, and see the net total of what's shown. Click a row to edit or delete it.
- **Budgets** — an overall monthly limit plus optional per-category limits, with progress and status.
- **Settings** — account details and password, two-factor authentication, currency, theme, custom categories and spending-alert thresholds.
- **Accounts** — registration with email verification (6-digit code, sent through Resend), forgot-password by emailed code, and optional TOTP two-factor authentication (any authenticator app). Each user only sees their own transactions and budgets.
- **Admin** — administrators get a *Platform management* page to see all accounts, create users, grant/remove admin, reset a user's 2FA and delete accounts.

## Getting started

1. Start the API and database from the repository root (Postgres + backend on port 5000):

   ```bash
   ./run-dev.sh
   ```

   Rebuild the backend image whenever its dependencies change (the script passes `--build -V`).

2. Start the app:

   ```bash
   npm install
   npm start        # http://localhost:4200 — /api is proxied to localhost:5000 (proxy.conf.json)
   ```

3. Sign in with the **default admin: `Admin` / `admin123`** (seeded in development only, together with a couple of months of demo transactions and budgets), or create an account on the *Create one* page.

With the default `EMAIL_PROVIDER=console`, verification and reset codes are printed in the backend log instead of being emailed. To send real email, set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` and `EMAIL_FROM` in `back-end/.env.development.local`.

### Default admin password

Reset it from the command line at any time — this also clears the account's 2FA and recreates it if it was deleted:

```bash
cd ../back-end && yarn build && yarn admin-cli reset-admin-password   # local
./admin-cli.sh reset-admin-password                                    # on a deployed host
```

See [`deploy/admin-cli.md`](../deploy/admin-cli.md) for the full CLI. In production the default admin is only created when `DEFAULT_ADMIN_PASSWORD` is set.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Dev server with live reload and the `/api` proxy |
| `npm run build` | Production build into `dist/` |
| `npm test` | Unit tests (Karma + Jasmine) |

## Project layout

```
src/app/
  pages/        routed screens (dashboard, transactions, budgets, settings, admin, and the
                signed-out flows: login, register, verify-email, forgot-password, two-factor)
  components/   reusable UI (header, cards, transaction form/row, change-password, 2FA settings, create-user form)
  UI/           generic primitives (modal backdrop, auth card)
  services/     state + data access (signals, HttpClient)
  guards/       authGuard, adminGuard, guestGuard
  pipes/        money (follows the selected currency), displayDate
  utils/        pure helpers (dates, money, API errors, resend cooldown)
  models/       types and transaction helpers
```

Everything is stored per account on the server: transactions, budgets, categories and settings (currency, alert thresholds, theme). Each store loads when a user signs in and clears on sign-out (`services/session.ts`). The only things kept in `localStorage` are the session token (attached to `/api` calls by `auth.interceptor.ts`) and a copy of the last theme, so the page doesn't flash light before settings arrive.

## API

The app uses these backend routes (all under `/api`):

- `auth/*` — register, verify-code, resend-code, login, forgot-password, reset-password, me, password
- `auth/totp/*` — setup, enable, disable, login (second step after a password/code proves identity)
- `admin/users*` — list, create, update, reset password, reset 2FA, delete (admins only)
- `budget-tracker/transactions` (GET, POST, PATCH/DELETE `:id`), `budget-tracker/budgets` (GET, POST, PATCH `:id`)
- `budget-tracker/categories` (GET, POST, DELETE `:type/:name` — also moves that category's transactions to Uncategorized), `budget-tracker/settings` (GET, PUT partial)

All `budget-tracker` routes are scoped to the signed-in user; another user's record returns 404.

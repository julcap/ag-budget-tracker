# Ledger — budget tracker

A small personal-finance app built with Angular 17 (standalone components + signals). Track income and expenses, see where this month's money went, and set monthly budgets per category.

## Features

- **Dashboard** — all-time balance, this month's income and spending (colour-coded against your alert thresholds), spending by category, and recent transactions. Add or edit transactions without leaving the page.
- **Transactions** — search (merchant, category, notes), filter by category, sort any column, and see the net total of what's shown. Click a row to edit or delete it.
- **Budgets** — an overall monthly limit plus optional per-category limits, with progress and status (On track / Near limit / Over budget).
- **Settings** — profile, currency (USD, EUR, DKK), light/dark theme, custom categories, and spending-alert thresholds. Preferences are stored in the browser.

Sign-in is demo-only: any email and password work, and the session is kept in `localStorage`.

## Getting started

```bash
npm install
npm run db      # mock REST API (json-server) on http://localhost:3001, backed by dev/db.json
npm start       # app on http://localhost:4200
```

Keep `npm run db` running in a separate terminal. json-server writes changes back to `dev/db.json`; use `git checkout dev/db.json` to restore the seed data.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Dev server with live reload (development config → API at `localhost:3001`) |
| `npm run db` | Mock API from `dev/db.json` |
| `npm run build` | Production build into `dist/` |
| `npm test` | Unit tests (Karma + Jasmine) |

## Project layout

```
src/app/
  pages/        routed screens (dashboard, transactions, budgets, settings, login)
  components/   reusable UI (header, balance card, transaction row, transaction form)
  UI/           generic primitives (modal backdrop)
  services/     state + data access (signals, HttpClient)
  pipes/        money (follows the selected currency), displayDate
  utils/        pure helpers for dates and money formatting
  models/       types and transaction helpers
```

## Data format

Transactions are stored with ISO dates (`YYYY-MM-DD`) and a `type` of `expense` or `income`; expenses have negative amounts. Older records with `Today`/`Sep 8` dates or no `type` are still read correctly.

The production environment (`src/environments/environment.ts`) uses a relative API URL, so a production deployment needs a backend serving `/transactions` and `/budgets` on the same origin.

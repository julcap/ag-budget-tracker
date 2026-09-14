# Repository guidance for coding agents

## Scope and intent

This repository is an Angular learning project being improved through small, working increments into a portfolio-quality budget tracker. Preserve the learning value: explain consequential choices, keep changes reviewable, and prefer the simplest design that satisfies current behavior. Do not turn a focused task into a broad rewrite, framework migration, authentication project, or deployment.

Use the current task and acceptance criteria as the primary authority. This file supplies repository-wide defaults. Historical notes under `.junie/plans/` describe individual proposals; verify them against the current code and task before using them.

## Source of truth

- `package.json` and `package-lock.json`: available scripts and exact dependency graph. Use `npm ci`; do not replace the lockfile or run a forced audit fix casually.
- `angular.json`: build, test, environment-replacement, asset, and global-style configuration.
- `tsconfig.json`: strict TypeScript and Angular template checks. Keep them enabled.
- `src/app/app.routes.ts`: current navigation and route access rules.
- `src/environments/`: API base URLs by build configuration.
- `src/app/models/` plus the consuming services: current data shapes and persistence behavior.
- `src/styles.scss`: the registered global stylesheet. The filename is plural `styles.scss`, not `style.scss`.
- Tests next to source (`*.spec.ts`): executable behavior expectations.
- `dev/db.json`: development seed data for JSON Server, not a production database or schema authority.

If documentation and executable configuration disagree, stop and resolve the discrepancy explicitly rather than silently choosing one.

## Current technical baseline

- Angular 17.3 standalone components, strict TypeScript, signals, RxJS 7.8, SCSS, Jasmine, and Karma.
- Routes are currently eager-loaded. Authentication is only an in-memory demonstration signal; it is not real security and resets on reload.
- Transactions and budgets use HTTP against JSON Server during development. Categories, settings, and theme use browser `localStorage` (theme also changes a DOM attribute).
- The production environment currently has an empty API base URL. There is no deployed backend, durable multi-user store, or end-to-end test runner in the repository.

Do not describe the demonstration login, route guard, JSON Server, or local storage as production authentication or a production backend.

## Architecture and Angular conventions

- Organize new work by feature when a feature has enough files to benefit. Pages orchestrate route-level use cases; focused feature components own interactions; focused services own data access or shared domain state.
- Put a component in shared UI only after it is genuinely generic and reused. Do not add empty `core`, `shared`, repository, facade, or state-library layers in anticipation of future work.
- Keep standalone components. Prefer `inject`, typed reactive forms, signals for synchronous local/shared state, and `computed` for derivations when supported by Angular 17.3.
- Use RxJS for asynchronous HTTP composition, cancellation, retries, and errors. Avoid nested subscriptions and subscriptions that hide completion or failure from the initiating UI.
- Use `ChangeDetectionStrategy.OnPush` for new or materially revised components when their inputs and state are compatible; do not churn untouched components solely to add it.
- Prefer route-level `loadComponent` when incrementally revising a route boundary, but do not reorganize every route in an unrelated change.
- Keep templates declarative. Move substantial calculations and data normalization into typed component helpers, computed state, or domain services.
- Do not use APIs from a newer Angular release until the project has been deliberately upgraded and its supported Node/toolchain versions are documented.

## Data and financial correctness

- Treat money and dates as domain data, not presentation strings. Existing records contain decimal JavaScript numbers and mixed date formats (`Today`, display dates, and ISO-like dates); do not expand that ambiguity.
- For new persistence contracts, choose and document one canonical date representation and a deliberate money strategy (prefer integer minor units where practical). Any migration of existing records must be explicit, backward-aware, and tested.
- Validate transaction type, amount, category, date, and required text at the form boundary and again at any real API boundary. Preserve the sign invariant consistently: expenses are negative and income is positive in the current model.
- Use Angular currency/date formatting or a single tested formatter rather than duplicating locale and currency literals across pages.
- Never commit real financial data, credentials, access tokens, or user-identifying fixtures. Seed data must be obviously synthetic.
- Define privacy, retention, ownership, authorization, and concurrency behavior before introducing a real multi-user backend.

## Styling and UX

- Keep design tokens, reset/base rules, typography, theme variables, and genuinely shared primitives in `src/styles.scss`.
- Keep feature layout and component-specific styling in each component's `.scss` file under Angular style encapsulation.
- Reuse the existing CSS custom properties before adding near-duplicate colors, spacing, radii, shadows, or button/form variants. Remove duplicates when a touched area can be simplified safely.
- Preserve a consistent light/dark theme, responsive behavior, keyboard operation, visible focus, semantic labels, loading states, empty states, and actionable error messages.
- For modal work, use one accessible ownership model. Do not layer a native `<dialog>` and a custom backdrop without a verified reason.

## Testing and change discipline

- Add or update unit tests for new business rules, component interactions, validation, error states, and formatting behavior.
- Add HTTP service tests for URL, method, payload, success-state updates, and failures. Add route/integration coverage when navigation or cross-component flows change.
- Keep production changes and their tests in the same increment. Reproduce a bug with a failing test before fixing it when feasible.
- Run a focused spec while iterating, then the full test and production build before handoff. Report environmental blockers separately from assertion failures.
- Do not modify generated output in `dist/` or commit `node_modules/`.
- Avoid dependency changes unless they are the task. Never use `npm audit fix --force` as routine cleanup; Angular major upgrades require a separate, supported migration.
- Keep commits focused. Do not impose another repository's branching model, merge branches, publish, or deploy unless the task explicitly requires it.

## Commands

Run commands from the repository root and prefer the checked-in npm scripts over a global Angular CLI:

```text
npm ci
npm run db                         # terminal 1: development JSON Server on :3001
npm start                          # terminal 2: Angular development server on :4200
npm run build                      # production build
npm test -- --watch=false --browsers=ChromeHeadless
```

Karma requires a Chrome/Chromium binary; set `CHROME_BIN` when it is not auto-detected. A focused Karma run can add `--include=src/path/to/file.spec.ts`. To compile the test TypeScript without launching a browser:

```text
./node_modules/.bin/tsc --project tsconfig.spec.json --noEmit
```

There is currently no lint or end-to-end script. Do not claim either check ran, and do not invent a command for it.

## Handoff expectations

For each increment, summarize the problem and options briefly, state the chosen approach and why, list changed files, and report commands with actual outcomes. Call out pre-existing failures and unresolved risks. Before implementing persistence or authentication beyond the current demo, obtain the product decision: local single-user portfolio demo or real multi-user application.

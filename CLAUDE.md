# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Breedly frontend: an Angular 21 SPA for dog breeders (pets, breedings, offspring, waitlists, genealogy), pet seekers (map search, favorites, waitlists, messaging) and service providers. It talks to a separate backend API (`environment.API_URL`). Deployed as a static build behind nginx (`deploy/Dockerfile`, `deploy/nginx.conf`); Jenkins builds the image and deploys to dev (`https://dev.breedly.us`).

## Commands

```bash
npm start                                   # ng serve, development config → API at http://breedly.com:8000
npx ng serve --configuration waitlist       # dev server with the waitlist feature flag on
npm run build                               # production build (default config) → dist/pets.frontend.dev
```

Unit tests (Karma + Jasmine, ChromeHeadless). There is no `test` npm script, so call the CLI directly:

```bash
npx ng test --watch=false                                                   # all specs once
npx ng test --watch=false --include src/app/services/waitlist.service.spec.ts   # one spec file
```

Specs renamed to `*.spec.ts.skip` are disabled on purpose.

E2E tests (Playwright, `e2e/`, projects `chromium` and `mobile` (iPhone 12)). The config starts `npm run start` on :4200 itself:

```bash
npm run test:e2e                                        # all
npx playwright test e2e/import-wizard.spec.ts           # one file
npx playwright test -g "test name" --project=chromium   # one test, one project
```

- Most e2e specs mock the API with `page.route('**/api/**', ...)`, so no backend is needed. `e2e/messaging-e2e.spec.ts` is the exception: it hits a real API.
- `e2e/waitlist.spec.ts` needs a flag-on build. Run `npx ng serve --configuration waitlist --port 4300`, then run the tests with `WAITLIST_BASE_URL=http://localhost:4300`. Without that, the flow test is skipped and only the flag-off smoke runs.
- `e2e/csv-parser.property.spec.ts` uses `fast-check` property tests.

There is no lint script or ESLint config.

## Environments and feature flags

`src/environments/` contains three files, swapped in through `fileReplacements` in `angular.json`:
- `environment.ts`: the **production** build (the default build config). It points at `https://api-dev.breedly.us`.
- `environment.development.ts`: `ng serve` default. It points at the local backend at `http://breedly.com:8000` (`breedly.com` is in `allowedHosts`, so map it to localhost in `/etc/hosts`).
- `environment.waitlist.ts`: the same as development but with `enableWaitlist: true`. It is for local and e2e use only.

Feature flags are **build-time** and must match the backend's `.env`:
- `enableServiceProviders` ↔ `ENABLE_SERVICE_PROVIDERS`
- `enableWaitlist` ↔ `ENABLE_WAITLIST`

Both flags are currently `false`. Hide flagged UI by checking `environment.<flag>` in components. Gate flagged routes with a guard like `WaitlistGuard`, composed before the role guard (`canActivate: [WaitlistGuard, BreederGuard]`). When you add or change a flag, update all three environment files.

## Architecture

- **NgModule-based app.** Most components are declared in `src/app/app.module.ts` with `standalone: false`. Some newer components are standalone (for example `page-header`, `message-thread`, `join-waitlist-modal`, `*-documents`) and are imported into the module. A new non-standalone component must be added to `declarations`. All routes live in `src/app/app-routing.module.ts`. Components are flat under `src/app/components/<name>/`, except settings sub-pages, which are child routes under `components/settings/`.
- **Auth.** `AuthService` stores the JWT in `localStorage` (`id_token`) and exposes `isLoggedIn`/`currentUser` BehaviorSubjects and the `isBreeder`/`isPetSeeker` getters. `AuthInterceptor` attaches the bearer token **only** to requests whose URL starts with `environment.API_HOST`. On a 401 it calls `handleSessionExpired()` once, even when several requests fail together.
- **Roles.** There are three account types: breeder (`user.is_breeder`), pet seeker (`account_type: 'pet_seeker'`) and service provider. Routes are protected by `AuthGuard`, `BreederGuard`, `PetSeekerGuard` and `ServiceProviderGuard` in `src/app/guard/`. Some routes are public, such as `/offspring/:id`, `/breeder/:id/offsprings` and `/search-pets`.
- **Services.** HTTP services live in `src/app/services/` and are built from `environment.API_URL`. `DataService` is the large legacy service for pets, breeds, locations, breedings and profile. Newer features have their own service (`waitlist`, `breeding-planner`, `offspring`, `message`, `billing`, `review`, ...). Interfaces live in `src/app/models/`. `models/README.md` and `SEARCH_MODELS_SUMMARY.md` document the search/map models.
- **UI stack.** Several UI libraries are in use together: PrimeNG 21 (tables, selects), Angular Material, Tailwind 3 (brand colors in `tailwind.config.js`), Leaflet with markercluster (map search), ngx-toastr wrapped by `ToastService`, and `ConfirmService`/`ConfirmDialogComponent` for confirmations.
- **Shared UI kit.** It lives in global `src/styles.css` and provides the `ui-btn` (`--primary`, `--secondary`, `--ghost`, `--danger`, `--sm`), `ui-icon-btn`, `ui-badge--*`, `ui-table`, `ui-table-container`, `ui-row-actions`, `ui-cell-title`/`ui-cell-sub`, `ui-truncate` and `ui-link` classes. Prefer these over one-off styles. Brand colors are CSS variables in `:root`. Keep `--primary-strong` and the other `*-strong` values in sync with `tailwind.config.js`. The "Legacy button styles" in the same file exist only for backward compatibility.
- **Mobile.** Pages must work at 390px wide with no horizontal scroll. Buttons are globally forced to a 44–48px minimum touch target. Breeders get a bottom tab bar on mobile.
- **Error reporting.** Sentry (`@sentry/angular`) is configured from `environment.sentryDsn`.

## Conventions

- Commit messages use Conventional Commits with a feature scope, for example `feat(waitlist): ...`, `fix(planner): ...`, `test(waitlist): ...`, `docs(privacy): ...`. Feature work happens on `feature/*` branches merged into `develop`.
- When a feature changes what data is stored or what emails are sent, update the legal pages too (`privacy-policy`, `terms-of-use` and related components), as the waitlist and planner work did.
- `docs/qa/` holds the manual happy-path QA scripts (01–08). Update the relevant script when a user-facing workflow changes.
- TypeScript is `strict` (with `strictPropertyInitialization` off), but `strictTemplates` is **off**, so template type errors are not caught at build time.

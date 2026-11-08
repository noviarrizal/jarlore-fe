# End-to-end tests

Playwright tests that drive the real stack: PostgreSQL → jarlore-be (Go API) → this app, in a browser.

| Spec | Covers |
|---|---|
| `core-workflow.spec.ts` | F1 batch → four F2 bottles with different additions → bottle observations → rate → mark best → save as bottle recipe → finish → brew again → new bottle from the recipe with a live diff ("becomes v2") → compare → history unchanged → reload persistence → a second account gets 404 |
| `auth.spec.ts` | Signed-out redirects with `?next=`, malformed/unsigned/foreign tokens land on `/login?expired=1`, development sign-in returns to `next`, no off-site redirect, sign-out clears the session, the token is never visible to page scripts |
| `timezone.spec.ts` | Profiles start in the browser's zone (Asia/Jakarta, Europe/London, America/New_York); times read in that zone; changing the zone in Me changes presentation, not stored instants; invalid hints fall back to UTC |
| `hardening.spec.ts` | Security headers, no CSP violations or console errors across pages at 390/768/1440 px with no horizontal overflow, not-found and refused compare states |

## Run locally

You need Go (for jarlore-be), pnpm, and a **disposable** PostgreSQL database migrated like production. Every run creates new users and data.

```bash
# 1. Database (local PostgreSQL superuser), once
cd ../jarlore-be
psql -U postgres -f scripts/local-db.sql
DIRECT_DATABASE_URL='postgres://jarlore_owner:jarlore_owner_local@localhost:5432/jarlore?sslmode=disable' go run ./cmd/migrate up
psql -U postgres -d jarlore -c 'GRANT jarlore_app TO jarlore_api'

# 2. Tests (stop your own `pnpm dev` first: Next allows one dev server per project)
cd ../jarlore-fe
pnpm exec playwright install chromium        # or E2E_BROWSER_CHANNEL=chrome to use installed Chrome
E2E_DATABASE_URL='postgres://jarlore_api:jarlore_api_local@localhost:5432/jarlore?sslmode=disable' pnpm e2e
```

Playwright starts jarlore-be's local test issuer (`go run ./cmd/devauth`, port 9999, reused if already running), the API on port 18080 and `next dev` on port 3100. Set `JARLORE_BE_DIR` if jarlore-be isn't at `../jarlore-be`.

## Safety

- **Never point `E2E_DATABASE_URL` at production.** The config refuses any `*.neon.tech` host unless `E2E_NEON_BRANCH_IS_DISPOSABLE=1` (only for a throwaway, non-production branch), and refuses hosts listed in `JARLORE_PRODUCTION_DB_HOSTS`.
- Sign-in uses the test issuer only: tests never create Neon Auth users or send email. Real Neon Auth sign-in is checked by hand on the `dev` branch (see `docs/deployment/FRONTEND_HOSTING.md` and jarlore-be `docs/deployment/ENVIRONMENT_STRATEGY.md`).
- The test issuer refuses to run with `APP_ENV=production` or on a non-loopback address, and the app ignores development sign-in in production builds.

In CI (`.github/workflows/ci.yml`, job `e2e`) the database is a PostgreSQL 18 service container and jarlore-be is checked out from GitHub.

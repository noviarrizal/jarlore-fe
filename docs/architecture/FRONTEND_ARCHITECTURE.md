# Jarlore — Frontend Architecture

**Stack (verified 5 Nov 2026):**
- Next.js 16.4.5 (App Router, `cacheComponents` + `partialPrefetching` on, Turbopack)
- React 19.3
- TypeScript 5.9
- Tailwind CSS 4.3 (CSS-first `@theme`, no config file)
- lucide-react for general icons
- `server-only`
- pnpm

No component library, no state-management library, no form library. Each would earn its place only when a real problem appears.

The backend contract lives in **`jarlore-be/api/openapi.yaml`**. `pnpm gen:api` generates `src/lib/api/schema.d.ts` from it with openapi-typescript (dev dependency); `src/lib/api/types.ts` only gives the generated shapes short names.

## Folder structure

```
src/
  app/
    layout.tsx, globals.css        root: font (Recursive), tokens
    page.tsx, not-found.tsx        public front page
    (app)/                         authenticated app (route group; URLs have no prefix)
      layout.tsx                   ToastProvider → QuickLogProvider → nav + content
      today/ batches/ batches/new/ batches/[id]/ batches/[id]/bottles/ batches/[id]/brew-again/
      recipes/ recipes/[id]/ compare/ me/
  components/
    ui/                            primitives (no API imports)
    app/                           product-composed components
  features/
    batches/ compare/ today/       feature UI + server actions
  lib/
    api/contract.ts                JarloreApi interface (one method per endpoint)
    api/schema.d.ts                generated from the OpenAPI spec (never edit)
    api/types.ts                   short names for the generated types
    api/http.ts                    fetch wrapper + ApiError (problem+json), server-only
    api/http-api.ts                JarloreApi over jarlore-be, with the session token
    api/index.ts                   `api` singleton (server-only)
    auth/session.ts                session cookie, dev sign-in switch
    format.ts                      dates, units, labels (display only)
  proxy.ts                         no session cookie → /login (optimistic check only)
```

## Data flow

```
Server Component page ──await──▶ api.* (lib/api, server-only) ──▶ http-api.ts ──Bearer──▶ jarlore-be /v1
Client Component ──calls──▶ server action (features/*/actions.ts) ──▶ api.* ──▶ result {ok|error}
                     └──── router.refresh() on success to re-render server data
```

**Rules**
1. **Reads happen in Server Components.** Each page renders a static shell (title, skeleton) and wraps the data part in `<Suspense>`. With Cache Components on, uncached reads and `params`/`searchParams` must sit inside a Suspense boundary; the build fails otherwise.
2. **Writes go through server actions** that return `{ ok, data } | { ok: false, message, code }` instead of throwing. Client components never call `fetch` or import `@/lib/api` (it is `server-only`).
3. **Client state is local `useState`.** Two app-wide contexts exist: toasts, and the quick-log sheet. URL state is used where a view should be shareable (`/compare?items=…`).
4. **No business rules in the frontend.**

   | Rule | Owner |
   |---|---|
   | Diffs and "what changed" (`DiffRow.differs`, `direction`) | Backend: `/v1/compare`, `/v1/batches/diff-preview`, `/v1/recipes/{id}/diff` |
   | Recipe versioning on Brew again | Backend. The UI only explains it. |
   | Batch codes, reminder completion, entitlement limits | Backend (`/v1/entitlements` drives the UI's caps) |
   | Validation | Backend. The UI gives early hints (measurement ranges warn, never block). |

   The frontend only decides *where the marker goes* (`features/compare/marking.ts`): against the first column, or against sibling bottles.
5. **Idempotency.** Every write from a client sends an `Idempotency-Key` (UUID per user intent), so Retry is safe.
6. **Errors.** `ApiError` wraps RFC 9457 problems. Pages map 404 to `notFound()`. Actions surface `message`, and the toast offers Retry.

## Routes and rendering

| Route | Rendering | Data |
|---|---|---|
| `/` | Static | None (example lineage is static markup) |
| `/today` | Partial prerender + streamed | `getToday`, `listFermentationTypes`, `getBatch` (F2 batches, for bottles) |
| `/batches` | PPR | `listBatches`, `getEntitlements`, `getBatch` (F2) |
| `/batches/[id]` | PPR | `getBatch`, `listBatchLogs`, `getBatchReference`, parent `getBatch`, `compare(bottles)` |
| `/batches/[id]/bottles` | PPR | `getBatch`, `listBatchLogs`, `compare(bottles)` |
| `/batches/[id]/brew-again` | PPR | `getBrewAgainDraft`, then `previewDiff` + `startBatch` actions |
| `/batches/new` | PPR | `listFermentationTypes`, `getBatchTemplate`, `getRecipeVersion` |
| `/recipes`, `/recipes/[id]` | PPR | `listRecipes`, `getRecipe`, `listRecipeVersions`, `listRecipeBatches`, `diffRecipeVersions` |
| `/compare` | PPR | `getEntitlements`, `compare` |
| `/me` | PPR | `getMe`, `getEntitlements`, `listMeasurementDefinitions` |

Every API call reads the session cookie, so pages render at request time; `api.now()` calls `connection()` first for the same reason.

## Authentication

Neon Auth (Managed Better Auth, `@neon/auth` 0.8.2) is the identity provider; jarlore-be verifies the JWT it mints (ADR-003). The browser never holds a token in JavaScript.

```
/login (Server Actions)                         every app page / Server Action (src/proxy.ts)
  email → auth.emailOtp.sendVerificationOtp        Neon session cookie? ── no ──▶ /login?next=…
  code  → auth.signIn.emailOtp                     auth.middleware(): verify / refresh the session
        Neon sets __Secure-neon-auth.* cookies     jarlore_session JWT missing or < 2 min left?
        jarlore_tz ← browser time zone               GET {NEON_AUTH_BASE_URL}/token (session cookie)
        redirect to ?next                            → httpOnly jarlore_session, also visible to this render
                                                   pages/actions: Authorization: Bearer <jarlore_session>
```

- **Files:** `src/lib/auth/neon.ts` (SDK instance, token minting, typed calls), `src/lib/auth/cookies.ts` (cookie names, JWT expiry, pure helpers shared with the proxy), `src/lib/auth/session.ts` (server-only cookie access), `src/proxy.ts`, `src/features/auth/*`, `src/app/login/page.tsx`.
- **Why the proxy mints the JWT:** Server Components may not write cookies, and Neon Auth's SDK writes cookies when it refreshes a session. The proxy runs before every app page and Server Action and is allowed to, so pages only ever read `jarlore_session`. `auth.getSession()` is not used to get the token: on the server it returns the opaque session token, not the JWT.
- **Lifetimes:** Neon Auth JWTs live 15 minutes; the proxy refreshes when under 2 minutes remain. The Neon session itself is refreshed by the SDK middleware. If Neon Auth is unreachable the proxy keeps a still-valid token; otherwise the page's API call fails and the error boundary offers a retry.
- **Expiry and rejection:** a 401 from jarlore-be redirects to `/login?expired=1` (Server Actions rethrow it with `unstable_rethrow`). The proxy also sends visitors with no Neon session to `/login?next=<path>`; `next` must be a same-site path.
- **Sign-out:** `auth.signOut()` ends the Neon session server-side, then the API token cookie is deleted.
- **Development sign-in:** `/login` also offers jarlore-be's local issuer (`cmd/devauth`) when `JARLORE_DEV_AUTH_URL` is set, **only** outside production builds and only for a loopback URL (`devAuthUrlFrom`). It sets `jarlore_session` plus a `jarlore_dev_session` marker so the proxy skips the Neon check. Tests use it (e2e/).
- **Typing gap:** `@neon/auth` 0.8.2's types omit the email-OTP plugin although its runtime has the endpoints; `NeonAuthCalls` in `neon.ts` types the three calls Jarlore makes.
- **Authorization.** All authorization happens in the API, never in the UI. The proxy is a convenience gate, not the security boundary.
- **The UI never decides anything from a cached claim** except navigation (e.g. hiding Pro hints).

## Time zones

- Every date and time is shown in the user's IANA zone from the profile (`GET /v1/me`, read once per request through `api.timezone()`). Formatters in `src/lib/format.ts` take the zone explicitly (`formatTime(iso, tz)`, `relativeDay(iso, now, tz)` …), so server and client render the same text. There is no app-wide default zone; an unknown zone falls back to UTC.
- "Today"/"Yesterday" compare calendar days in that zone, so midnight and daylight-saving changes are handled (unit tests in `src/lib/format.test.ts`).
- New accounts start in the browser's zone: the sign-in form records `Intl.DateTimeFormat().resolvedOptions().timeZone` in the `jarlore_tz` cookie, and every API call carries it as `Jarlore-Timezone`; jarlore-be uses it only when it creates the profile.
- Me → Profile edits the zone (and name, units, temperature) through `PATCH /v1/me`. Stored timestamps are UTC and never change.

## Errors

- `src/app/(app)/error.tsx` (inside the app shell), `src/app/error.tsx` (sign-in, landing, and failures of the app layout itself) and `src/app/global-error.tsx` (root layout). They show "This page didn't load", **Try again** (`retry()`) and **Go to Today**, plus the error digest that matches the server log. Server errors reach the browser without their message in production.
- `.catch()` on API calls uses `onApiError(fallback)` (`src/lib/api/http.ts`): it swallows only the API's own refusals (402, 404 …) and rethrows redirects and `ApiUnavailableError`, so an expired session still signs in again and an unreachable API reaches the boundary.

## Security headers

Set in `next.config.ts` for every route: CSP (`default-src 'self'`, scripts and styles `'self' 'unsafe-inline'`, `connect-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a `Permissions-Policy` that disables camera/microphone/location/payment/USB, and HSTS outside development. `'unsafe-inline'` scripts are required because nonce-based CSP is incompatible with Partial Prerendering (Next.js CSP guide); the browser only ever talks to this origin. `X-Powered-By` is off.

## Environment

| Variable | Use |
|---|---|
| `JARLORE_API_URL` | jarlore-be base URL, server-side only |
| `NEON_AUTH_BASE_URL` | The Neon branch's Auth URL (server-side only); empty disables email sign-in |
| `NEON_AUTH_COOKIE_SECRET` | 32+ characters, signs the SDK's session cache cookie (secret) |
| `JARLORE_DEV_AUTH_URL` | Development sign-in issuer; loopback only, ignored in production builds |

## Contract gaps (resolved)

All five gaps below were resolved in the Go API (2026-11-07): fermentation types carry blank-batch defaults, `GET /v1/recipe-versions/{id}` exists, previews return `willCreateVersion`/`nextVersionNo`, custom batches keep stage `f1`, and reminders filter by `batchId`. The original notes:

| Gap | Current frontend workaround | Proposed contract change |
|---|---|---|
| Blank-batch starting ingredients per type | `api.getBatchTemplate(type)` (mock only) | Add `defaultIngredients`, `defaultVolumeMl` and `defaultParams` to `FermentationType` |
| Brew from a recipe version by id | `api.getRecipeVersion(versionId)` | `GET /v1/recipe-versions/{versionId}`, or keep `{recipeId, versionNo}` in links |
| Reminders for one batch | `listBatchReminders(batchId)` (unused by screens; `Batch.nextReminder` suffices) | Add a `batchId` filter to `GET /v1/reminders` if a reminders screen needs it |
| `diff-preview` doesn't say whether a new recipe version will be created | The UI explains the rule in prose | Add `willCreateVersion: boolean` and `nextVersionNo` to the response |
| Custom-type batches have stage `f1`, but the type stage is `ferment` | Falls back to the first type stage | Add `ferment` to `BatchStage`, or map it explicitly |

## Testing

- **Gates (CI runs all of them, `.github/workflows/ci.yml`):** `pnpm lint`, `pnpm typecheck`, `pnpm test:unit` (Node's test runner on `src/**/*.test.ts`, no extra dependency), `pnpm check:api-types` (generated types match jarlore-be's spec), `pnpm build`, `pnpm e2e`, and a container build.
- **End to end:** `e2e/` with `@playwright/test` against PostgreSQL → Go API → this app: the full acceptance journey, auth redirects and token rejection, time zones, security headers and responsive layout. See `e2e/README.md`.
- **Contract:** response shapes are validated against the spec by jarlore-be's contract tests; this app's types are generated from the same spec.
- **No unit tests yet.** The first worthwhile ones are `features/compare/marking.ts` and `lib/format.ts`, since they're pure functions. A test runner (Vitest) wasn't added to avoid an unused dependency.

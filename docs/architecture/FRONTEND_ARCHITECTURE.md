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

- **Built:** the access token is kept in the httpOnly `jarlore_session` cookie, read on the server and sent as `Authorization: Bearer` to jarlore-be. `src/proxy.ts` sends visitors without the cookie to `/login`. A 401 from the API (expired token) redirects to `/login?expired=1`; server actions rethrow that redirect instead of reporting an error.
- **Development sign-in:** `/login` asks jarlore-be's local issuer (`cmd/devauth`, `JARLORE_DEV_AUTH_URL`) for a token for the demo brewer or a second brewer (to see isolation). It is disabled in production builds.
- **Not built (P0):** Neon Auth sign-in with `@neon/auth` (email OTP, then Google), per jarlore-be ADR-003. It plugs into `session.ts`: the server reads the Neon Auth JWT (EdDSA, 15-minute lifetime, refreshed by the SDK) for the current session and forwards it. Needs `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET`, server-side only.
- **Authorization.** All authorization happens in the API, never in the UI.
- **The UI never decides anything from a cached claim** except navigation (e.g. hiding Pro hints).

## Environment

| Variable | Use |
|---|---|
| `JARLORE_API_URL` | jarlore-be base URL, server-side only |
| `JARLORE_DEV_AUTH_URL` | Development sign-in issuer; ignored in production builds |

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

- **Current gates:** `pnpm lint`, `npx tsc --noEmit`, `pnpm build`.
- **End to end:** a Playwright script (outside the repo) runs the full acceptance scenario against the real stack (PostgreSQL → Go API → this app): sign in, create an F1, log pH and temperature, bottle four experiments, burp all, rate each bottle, mark the best, save it as a bottle recipe, finish and brew again, bottle a new experiment from the recipe with a changed form and amount (live diff, new version), rate it, compare, check history, and confirm a second account sees a 404. Moving it into `e2e/` with `@playwright/test` is a recommended next step.
- **Contract:** response shapes are validated against the spec by jarlore-be's contract tests; this app's types are generated from the same spec.
- **No unit tests yet.** The first worthwhile ones are `features/compare/marking.ts` and `lib/format.ts`, since they're pure functions. A test runner (Vitest) wasn't added to avoid an unused dependency.

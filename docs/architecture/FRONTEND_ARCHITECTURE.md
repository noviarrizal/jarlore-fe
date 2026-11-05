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

The backend contract lives in **`jarlore-be/docs/api/openapi.yaml`**. `src/lib/api/types.ts` mirrors it by hand; when they disagree, the spec wins.

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
    api/types.ts                   DTOs from the OpenAPI spec
    api/http.ts                    fetch wrapper + ApiError (problem+json)
    api/index.ts                   `api` singleton (server-only), currently the mock
    format.ts                      dates, units, labels (display only)
  mocks/
    fixtures.ts, api.ts, diff.ts   in-memory stand-in for jarlore-be
```

## Data flow

```
Server Component page ──await──▶ api.* (lib/api, server-only) ──▶ mocks/api.ts   (today)
                                                              └─▶ http-api.ts    (when jarlore-be exists)
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

The mock calls `connection()` on every method, so it renders at request time like the real authenticated API will.

## Authentication (planned, not built)

- **Flow.** Supabase Auth (magic link/OTP and Google), per jarlore-be ADR-003 (Proposed).
  - The frontend holds the session in cookies.
  - `src/proxy.ts` (Next 16 replaces middleware) refreshes the session and redirects unauthenticated users from `(app)` to `/login`.
  - The server reads the access token and sends `Authorization: Bearer` to jarlore-be.
- **Authorization.** All authorization happens in the API, never in the UI.
- **The UI never decides anything from a cached claim** except navigation (e.g. hiding Pro hints).

## Switching from mock to the real API

1. Implement `src/lib/api/http-api.ts`: `JarloreApi` on top of `request()`, passing the session token.
2. In `src/lib/api/index.ts`, choose `httpApi` when `JARLORE_API_URL` is set.
3. Delete `src/mocks` once every screen works against the API. No screen imports the mocks directly.

## Contract gaps found while building (frontend impact)

These were also added to `jarlore-be/docs/architecture/ARCHITECTURE_DECISIONS.md`.

| Gap | Current frontend workaround | Proposed contract change |
|---|---|---|
| Blank-batch starting ingredients per type | `api.getBatchTemplate(type)` (mock only) | Add `defaultIngredients`, `defaultVolumeMl` and `defaultParams` to `FermentationType` |
| Brew from a recipe version by id | `api.getRecipeVersion(versionId)` | `GET /v1/recipe-versions/{versionId}`, or keep `{recipeId, versionNo}` in links |
| Reminders for one batch | `listBatchReminders(batchId)` (unused by screens; `Batch.nextReminder` suffices) | Add a `batchId` filter to `GET /v1/reminders` if a reminders screen needs it |
| `diff-preview` doesn't say whether a new recipe version will be created | The UI explains the rule in prose | Add `willCreateVersion: boolean` and `nextVersionNo` to the response |
| Custom-type batches have stage `f1`, but the type stage is `ferment` | Falls back to the first type stage | Add `ferment` to `BatchStage`, or map it explicitly |

## Testing

- **Current gates:** `pnpm lint`, `npx tsc --noEmit`, `pnpm build`.
- **Visual review:** Playwright (with the installed Chrome) captures 390/768/1440 px full-page screenshots and runs the core flows (quick log, select → compare, brew again → start). The script lives outside the repo; adding it as `e2e/` with `@playwright/test` is a recommended next step.
- **No unit tests yet.** The first worthwhile ones are `features/compare/marking.ts` and `lib/format.ts`, since they're pure functions. A test runner (Vitest) wasn't added to avoid an unused dependency.

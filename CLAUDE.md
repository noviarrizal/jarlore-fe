@AGENTS.md

# Jarlore frontend — conventions for every change

Jarlore is a mobile-first fermentation notebook: track batches, split F1 into F2 bottles, version recipes, brew again, compare. Read these before any UI work:
- `docs/design/DESIGN_FOUNDATIONS.md`: tokens, type, colour meaning, the lineage signature
- `docs/design/COMPONENT_SYSTEM.md`: what exists and when to use it
- `docs/design/SCREEN_GUIDELINES.md`: screen inventory, layout specs, review checklist
- `docs/architecture/FRONTEND_ARCHITECTURE.md`: data flow and what the frontend must never decide
- The API contract is `../jarlore-be/api/openapi.yaml`. Types are generated from it into `src/lib/api/schema.d.ts` (`pnpm gen:api`); `types.ts` only aliases them. Never hand-write API shapes.

## Design rules (non-negotiable)
- Use only the tokens in `src/app/globals.css` (`bg-paper`, `text-ink-2`, `border-rule`, `rounded-control`, `max-w-content`, …). No hex values, arbitrary radii, shadows or `[..rem]` widths in components. If a value is missing, add a token and document it.
- One typeface: Recursive. Interface = sans; `.note` = words the user wrote; `.num` = measured numbers; `.code` = batch codes. Never use mono for labels.
- Colour carries meaning only:
  - stage: F1 `tea`, F2 `action`/`bottle-wash`, done `ink`
  - status: success / warning / danger / info
  - change: `<Changed>`, the only user of `--marker`
  - never colour by fermentation type
- Rows on the page, not card grids. Elevation (`shadow-float`) only for floating layers (sheet, toast, "+").
- Parent → child relationships use `Lineage`/`Branch`.
- Sentence case. No ALL-CAPS eyebrows, no "A · B · C" meta strings, no emoji icons, no gradients, no glassmorphism, no invented statistics.
- Mobile first, 390 px. Primary action in the thumb zone (sheet footer or sticky submit). Touch targets ≥ 44 px. Inputs 16 px. Numeric fields use `inputMode="decimal"`.
- Copy: fermentation words (jar, bottle, burp, brew again). Buttons say what happens; toasts repeat the verb. Never call a ferment "safe" or "ready".

## Code rules
- Pages are Server Components that read through `api` from `@/lib/api` (server-only), with data inside `<Suspense>`. Required with Cache Components; `pnpm build` fails otherwise.
- Client components never fetch. They call server actions in `src/features/*/actions.ts`, which return `{ ok, ... }`, and then `router.refresh()`.
- Writes send an idempotency key. Errors are `ApiError` (problem+json); map 404 to `notFound()`.
- No business rules in the frontend: diffs, versioning, entitlements and validation belong to jarlore-be. The UI renders `DiffRow`s and decides only where the marker goes (`features/compare/marking.ts`).
- Layers: `components/ui` (no API imports) → `components/app` → `features/*` → `app/**`. Don't create an abstraction with one consumer.
- There is no mock data. Screens read jarlore-be through `api` (`src/lib/api/http-api.ts`); a failure shows an error state, never invented data.
- The access token lives in the httpOnly `jarlore_session` cookie and is read only on the server (`src/lib/auth/session.ts`).
- Don't add dependencies without a concrete need (currently lucide-react and server-only; openapi-typescript as a dev tool).

## Before you say a UI change is done
1. `pnpm lint`, `npx tsc --noEmit`, `pnpm build`.
2. Screenshot at 390, 768 and 1440 px with long names, 4+ bottles, empty and missing data, and look at them.
3. Keyboard pass: tab order, visible focus, Esc closes sheets.

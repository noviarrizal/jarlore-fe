# Jarlore — Component System

Layers (import direction only goes downward):

```
app/(app)/**/page.tsx      routes: fetch via `api`, compose features, no styling decisions
features/<area>/*          feature components and server actions (batches, compare, today)
components/app/*           composed, product-specific: nav, rows, lineage, timeline, quick log
components/ui/*            base primitives: no product data, no API imports
app/globals.css            tokens (the only place colours, radii and shadows are defined)
```

A component exists because it solves a repeated problem. If something has one consumer and no clear reason to be shared, keep it in that feature.

## Base primitives (`components/ui`)

| Component | Purpose | Variants / props | Notes |
|---|---|---|---|
| `Button`, `ButtonLink` | Actions and action-styled links | `primary` (one per view), `secondary`, `quiet`, `danger`; `md` 44 px, `sm` 36 px (dense desktop rows only) | The label says what happens. `icon` goes before the text. |
| `IconButton` | Icon-only action | `label` is required and becomes `aria-label` + `title` | 44×44 touch target |
| `Field` + `Input`, `Textarea`, `Select` | Labelled form controls | `hint`, `error` (sets `aria-invalid` and `aria-describedby`) | 16 px text so iOS doesn't zoom. `Textarea` uses the casual voice because the user is writing. |
| `MeasurementInput` | Numeric reading with its unit | Takes a `MeasurementDefinition` | `inputMode="decimal"`. Out of range is a **warning, not a block**; the server validates. |
| `Segmented` | Switch one view filter or one mode | Options with optional count | ARIA radiogroup; arrow keys move the selection |
| `Sheet` | Bottom sheet (mobile), dialog (≥768 px) | `title`, `description`, `footer` | Native `<dialog>`: focus trap, Esc and inert page come free. The primary action goes in `footer` (thumb zone). |
| `ToastProvider` / `useToast` | Confirm or report an action | `success` auto-hides after 3.2 s; `error` stays and can carry a `Retry` action | The toast repeats the verb: "Logged on KB-014". |
| `StageTag`, `Tag` | Stage of a batch or bottle | `f1` tea, `f2` bottle green, done ink, discarded danger | The only colour-coded element. Never colour by fermentation type. |
| `Score` | 1–5 rating, read-only | `label` for screen readers | Five tally bars plus the number. Not stars. |
| `Changed` | Marker highlight for diffs | `when` | **The only use of `--marker`.** Adds "(changed)" for screen readers. |
| `JarGlyph`, `BottleGlyph` | Product vocabulary icons | `filled` | Drawn in-house; everything else comes from lucide. |
| `EmptyState`, `ErrorState`, `Skeleton`, `SkeletonRows` | Empty, error and loading | — | Empty states invite an action; errors state what happened and the fix. Loading uses skeleton rows, never a full-screen spinner. |

Deliberately **not** built yet, because nothing needs them: dropdown menu, tooltip, tabs (sections are used instead), data-grid table, a progress bar (`DayWindow` covers the one real use).

## Composed components (`components/app`)

| Component | Purpose |
|---|---|
| `AppNav` / `AppNavShell` | Bottom bar plus centre "+" (<768 px), sidebar (≥768 px). The shell variant has no URL data, so it can be prerendered. |
| `CreateSheet` | The "+" sheet: log something brewing, brew again, or start from scratch, in order of frequency. |
| `QuickLogProvider`, `useQuickLog`, `LogButton`, `QuickLogSheet` | One app-wide quick-log sheet. Taste / Burp / Measure / Note, pH plus temperature visible, more readings behind disclosure, and a bottle picker for F2. It saves optimistically with an idempotency key. |
| `BatchRow` | A batch as a list row: code + name, stage tag, type, recipe version, day window, bottle strip, last note, Log. |
| `DayWindow` | Today's day against the template's typical range. Not a "ready" meter. |
| `Lineage`, `Branch` | **Signature.** A parent node with a trunk and branches. Used for jar → bottles and recipe v1 → vN. |
| `Timeline` | Logs grouped by day: time and kind in the interface voice, values in mono, notes in casual. |
| `PageHeader`, `Page`, `Section` | Title block, width containers (`narrow` / `list` / `full`), section headings. |

## Feature components (`features/*`)

- `batches/batches-browser`: segmented filter, search, type, sort, and select-to-compare with an entitlement-aware action bar.
- `batches/bottle-lineage`: F2 lineage with sibling-diff markers.
- `batches/batch-form`: one form for Brew again (with a live server diff) and New batch.
- `batches/rating-summary`: the finished result's dimensions.
- `batches/actions.ts`: server actions (`logEntry`, `previewDiff`, `startBatch`).
- `compare/diff-table`, `compare/compare-view`, `compare/marking`: rendering of server `DiffRow`s.
- `today/due-list`: the reminder checklist that opens the quick log already set up.

## Interaction states

| State | Rule |
|---|---|
| Hover | Border moves to `--rule-strong`, or the background to `--well`. No lift, no shadow. |
| Focus | `:focus-visible` ring: 2 px paper gap plus 2 px `--action`, defined globally. Never remove it without a replacement. |
| Active / pressed | `--action-hover` on primary, `--well` on secondary. Toggles use `aria-pressed` or `aria-checked`. |
| Selected | `--action` border plus `--bottle-wash` background. Not the marker. |
| Disabled | 45% opacity, no pointer events. Prefer explaining why nearby, as the compare bar does with the plan limit. |
| Loading | Skeleton rows inside the Suspense boundary. Buttons say "Starting…" while pending. |
| Success | A toast with the verb. The list re-renders through `router.refresh()`. |
| Error | A persistent danger toast with `Retry` (same idempotency key), or an inline `ErrorState` for page loads. |
| Validation | Inline under the field via `Field.error`. Measurement ranges warn but don't block. |
| Motion | Sheet slide (180 ms) and toast fade. All motion is removed under `prefers-reduced-motion`. |

## Accessibility rules

- Touch targets ≥ 44 px (`h-11`, `size-11`, `min-h-14` rows).
- Every icon-only control has an accessible name. Decorative SVGs are `aria-hidden`.
- Whole-row links use one real `<a>` stretched with `after:absolute`. Secondary actions sit above it (`relative z-10`).
- Lists are `ul`/`ol`; key–value pairs are `dl`; comparisons are a real `<table>` with `caption`, `scope` and a sticky row header.
- Colour is never the only signal: stage tags include text, changed values add "(changed)" for screen readers, and score bars carry the number.
- Contrast (AA) was checked for every text token pairing; see DESIGN_FOUNDATIONS.md.

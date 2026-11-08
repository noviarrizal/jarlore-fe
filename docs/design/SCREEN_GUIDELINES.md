# Jarlore — Screen Guidelines

Every screen answers, in this order:
1. What is this?
2. What stage is it in?
3. What did I last notice?
4. What can I do next?
5. What is different from before?

Everything else is behind disclosure or on a deeper screen.

## Inventory

| Route | Screen | Status | Primary question |
|---|---|---|---|
| `/` | Front page | Built | What is Jarlore? |
| `/today` | Today | Built | What's happening with my ferments today? |
| `/batches` | Batches | Built | Find a batch; pick some to compare |
| `/batches/new` | New batch (type → form; `?recipeVersion=`) | Built | Start something |
| `/batches/[id]` | Batch detail | Built | Everything about this batch, and how it relates to others |
| `/batches/[id]/bottles` | F2 experiments | Built | How do these bottles differ, and how are they doing? |
| `/batches/[id]/brew-again` | Brew again | Built | Repeat a batch while changing one thing on purpose |
| `/recipes` | Recipes | Built | My saved configurations |
| `/recipes/[id]` | Recipe detail | Built | Current version, how it evolved, what came of it |
| `/compare?items=batch:a,batch:b` | Compare | Built | What changed, and how did the result differ? |
| `/batches/[id]/bottle` | Bottle it / Add bottles | Built | Split the jar: one experiment per bottle, optionally from a bottle recipe or an earlier bottle (live diff) |
| (sheet) | Finish & rate | Built | Rate a batch or a bottle; ratings are history |
| (sheet) | Save as recipe | Built | Batch → base recipe; bottle → bottle recipe; new recipe or next version |
| `/me` | Me | Read-only overview, sign out | Settings and trust (plan, food safety) |
| `/login` | Sign in | Development sign-in only | Supabase sign-in is P0 |
| — | Onboarding, editing settings, discard/archive, export | **Not built** | Next tasks |

## Layout specs

### Mobile (360–430 px)
- 16 px gutters. A bottom nav (64 px plus safe area) with "+" in the centre.
- Primary actions sit in the bottom third: sheet footers and sticky form submit.
- Rows, not cards. The Log button on rows is a 44 px icon button; it gets a text label from 768 px.

### Tablet and desktop
- From 768 px the sidebar (232 px) replaces the bottom bar, and "New" sits at the top of the sidebar.
- From 1200 px (`wide:`) batch detail becomes a main column plus a 20 rem aside (frozen ingredients).

### Content width
- Detail screens: `Page width="narrow"` (44 rem).
- Lists: `list` (56 rem).
- Compare and wide detail: up to 72–90 rem.

## Wireframes (as built)

**Today**
```
Today
Thursday 5 November
Due today                              2
[ ] Burp bottle B          KB-013       08:00
[ ] Burp bottle C          KB-013       08:00
On the counter
KB-014 Black tea base                    [✎]
[F1 day 8] Kombucha  Recipe v2
━━━━━━|░░░░░░░   typical 7–14 days
Today: Drier now. Bottle tomorrow.        (casual voice)
In bottles
KB-013 Ginger fizz                       [✎]
[F2 day 2] … [A Ginger][B Ginger][C Ginger][D Raspberry–lime]
Recently finished
KB-012 Ginger fizz  4/5 "Bottle A…"   [↻ Brew again]
```

**Batch detail (≥1200 px)**
```
< Batches
KB-013 Ginger fizz                                        [✎ Log]
Kombucha, started 18 Oct 2026 from Ginger fizz v3
───────────────────────────────────────────────┐  Ingredients
[F2 day 2]  Last logged … | Next …              │  Frozen from v3…
What you're testing                             │  Filtered water   3.8 L
  Does the form of the ginger change fizz…      │  Cane sugar       228 g
  Brewed again from KB-012, 4/5 [See what changed]
F2 bottles (4)                  Open F2 experiments
 ○ KB-013 F1 jar
 ├─ [A] Ginger, [juice] 30 ml …      F2 day 2  Burped today
 ├─ [B] Ginger, [puree] 30 g …
 └─ [D] [Raspberry–lime] …           Chilled
Timeline …
```

**F2 experiments**: hypothesis → lineage → "What differs between bottles" table (sibling baseline) → bottle log.

**Compare**: the first column is the baseline. "Only differences" is on by default. Groups: Ingredients, Conditions, Process, Result. Arrows show the direction for numbers.

## Core flows

1. **Quick log** (2–3 taps): row Log, or a Due item, or "+" → batch → kind (Taste preselected, Burp preselected from a burp reminder) → value → Log taste. The sheet closes at once and a toast confirms; on failure the toast offers Retry.
2. **Brew again**: finished batch or recipe → form prefilled → the sticky diff panel updates live from the server → write the hypothesis → Start batch → redirect to the new batch.
3. **Compare**: Batches → Select to compare → tick 2 (free) → Compare. Also "See what changed" on a batch, and "Compare with results" on F2.

## Responsive and content rules

- Long names wrap (`break-words`, `text-balance` on titles). Lists may truncate names to one line only where the full name is one tap away.
- Values with units never wrap (`.num` is `nowrap`).
- Comparison tables scroll sideways on phones with a sticky attribute column. With more than two bottles, a one-line hint says to swipe.
- Missing data shows "—" in tables, "Nothing logged yet" (warning colour) on active rows, and "Not rated" for scores. It is never hidden.

## Review checklist (run before merging UI work)

- Screenshots at 390, 768 and 1440 px, with long names, 4+ bottles, an empty list and a missing measurement.
- No new hex values, radii or shadows outside `globals.css`.
- One primary button per view. The marker is used only by `Changed`.
- Keyboard: Tab reaches every action, focus is visible, Esc closes sheets.

# Jarlore — Design Foundations

> Status: v0.1 (5 Nov 2026). This is the source of truth for visual decisions. The tokens live in `src/app/globals.css`.
> When a screen needs something this document does not cover, extend this document first, then build.

## 1. Who we design for

- **The user.** A home kombucha or water-kefir brewer who runs 1–4 jars and splits each F1 into 3–6 flavoured F2 bottles.
- **When they open the app.** Standing at the kitchen counter, phone in one hand, often with sticky fingers.
- **What they want to know.** "What's brewing, what do I do today, and why was batch 12 so good?"

Three moments matter most:

1. **Logging**: 2–3 taps, one hand, at the counter.
2. **Seeing the F1 → F2 split**: one parent jar and several bottle experiments.
3. **Seeing what changed**: between this batch and the one they loved.

## 2. Two directions explored

### Direction A — "Label & stamp"
- **Look.** Surfaces look like bottle labels: die-cut corners, stamped batch codes, kraft-paper tones, rubber-stamp status marks.
- **Strength.** Instantly "craft".
- **Rejected because:**
  - It drifts into rustic kitsch, and the kraft-paper and stamp palette lands close to the cream-and-terracotta AI default.
  - Label shapes make dense data (measurements, diffs) hard to read.
  - It decorates instead of explaining.

### Direction B — "Field notebook with lineage" (chosen)
- **Look.** A cool, glass-and-brine paper tone with ink text. The user's own observations look written, while measured values look measured.
- **Lineage drawing.** Wherever F1 → F2 or recipe versions appear, the interface draws lineage: a trunk line from the jar that branches to bottles.
- **Diff marker.** "What changed" is always shown the same way, as a highlighter mark, like a brewer marking up their own notebook.

**Why B.** It encodes the product's three differentiators — history, lineage and difference — as visual language rather than decoration. It also stays quiet enough for dense, data-rich screens.

### Self-critique of B before building

| Risk | Decision |
|---|---|
| "Notebook" usually becomes cream paper + serif + terracotta (an AI-UI default) | Paper is a **cool green-grey** (`#F2F3EE`). There is **no serif**, and the accent is **tea amber**, not clay. |
| Monospace small labels are a cliché | Mono is used **only for measured numbers and batch codes**, where tabular alignment helps. It is never used for labels. |
| Everything becomes a card | Lists are rows on the page surface, divided by rules. Elevated surfaces are reserved for things that float (sheets, toasts, the create button) or are the subject of a page (the lineage block). |
| One radius everywhere | Radius follows hierarchy: 4 for tags, 8 for controls, 12 for panels, 20 for sheets. |
| Colour per fermentation type | **No.** Colour encodes **stage** (F1 jar = tea amber, F2 bottle = bottle green, done = ink) and **change** (marker). Type is shown with a word, not a colour. |
| Handwriting font gimmick | The casual axis of the same family (Recursive `CASL`) is used **only for text the user wrote** (notes, hypotheses, taste notes). The interface itself never "handwrites". |
| ALL-CAPS eyebrows and dot-joined meta strings | Labels are sentence case. Meta is written as a short sentence or laid out in separate cells. |

## 3. Brand personality and principles

**Personality:** curious, careful, warm, unpretentious. Like a friend who keeps immaculate brewing notes and is happy to show you.

**Principles**
1. **Lineage is the signature.** Parent → child relationships (jar → bottles, version → version, batch → brew-again) are always drawn the same way, with an amber trunk and branches.
2. **Change is highlighted, never coloured at random.** The marker highlight (`--marker`) means exactly one thing: *this differs from what you're comparing against*.
3. **Written vs measured.** The user's words appear in the casual voice, measurements in the mono voice, and the interface speaks in the plain sans voice.
4. **Next action in the thumb zone.** On mobile, primary actions sit in the bottom third of the screen.
5. **Density with calm.** Show the five questions (what is it, stage, last observation, next action, what's different) and hide the rest behind disclosure.
6. **No invented numbers.** No vanity statistics, streaks or charts that do not answer a brewer's question.

## 4. Colour

The palette is restrained: one neutral ramp, one action colour, two stage colours, one marker, and four status colours.

| Token | HEX | Use |
|---|---|---|
| `--paper` | `#F2F3EE` | App background (cool brine-grey; deliberately not cream) |
| `--sheet` | `#FBFBF8` | Elevated surfaces: sheets, panels, lineage block, inputs on paper |
| `--well` | `#E6E8E1` | Sunken areas: idle segmented controls, chips, table header |
| `--rule` | `#D5D8CF` | Hairline dividers and input borders |
| `--rule-strong` | `#B5BAAE` | Hover borders, the empty-state outline |
| `--ink` | `#17302A` | Primary text (bottle-glass green-black, 12.6:1 on paper) |
| `--ink-2` | `#4A5B54` | Secondary text (6.5:1 on paper) |
| `--ink-3` | `#5C6A63` | Tertiary text, icons and placeholders (5.1:1 on paper, 4.6:1 on well) |
| `--action` | `#1F5C4C` | Primary buttons, active nav, focus ring base. Also the F2 / bottle colour. |
| `--action-hover` | `#174A3D` | Hover and pressed state for the primary action |
| `--on-action` | `#FFFFFF` | Text on action |
| `--tea` | `#B26C0C` | F1 / jar stage colour, lineage trunk, rating fill. Graphics only (3.7:1, meets the 3:1 non-text rule). Never text. |
| `--tea-ink` | `#87500A` | Amber text on light surfaces (6.4:1 on sheet, 5.9:1 on paper) |
| `--tea-wash` | `#F6E9CF` | Background tint for the F1 stage tag |
| `--bottle-wash` | `#DDEBE4` | Background tint for the F2 stage tag |
| `--marker` | `#F5DB7A` | **"Changed" highlight only** |
| `--success` / `--success-wash` | `#2C7149` / `#DDEFE3` | Saved, finished |
| `--warning` / `--warning-wash` | `#8C6200` / `#FBEFC9` | Due or overdue reminders, unverified values |
| `--danger` / `--danger-wash` | `#A93A2E` / `#F7E0DC` | Errors, discard |
| `--info` / `--info-wash` | `#2E6380` / `#E0ECF2` | Neutral system notices |

Rules:
- Stage colour appears in **one** place per item: the stage tag or the lineage line, not both plus a border.
- Never use `--marker` for emphasis, promotion or selection. Selection uses an `--action` outline.
- Status colours are used for status only, never for decoration.
- A dark theme is **not** part of v0.1. Tokens are semantic so one can be added later without touching components.

## 5. Typography

**One family: [Recursive](https://www.recursive.design/)** (SIL Open Font License), self-hosted through `next/font/google` with `CASL` and `MONO` axes.
- **Why Recursive.** It gives three voices from one variable file — sans, casual and mono. That maps exactly onto *interface / user's handwriting / measurement* without loading three families.
- **Why not the defaults.** It is not Inter or Geist, and not a display serif.

| Role | Size / line height | Weight | Axis settings | Tailwind |
|---|---|---|---|---|
| Display (marketing and empty hero only) | 40/44 (mobile 32/36) | 760 | sans | `text-display` |
| Page title | 26/32 (mobile 22/28) | 700 | sans, tracking −0.01em | `text-title` |
| Section heading | 17/24 | 650 | sans | `text-section` |
| Body | 15/22 | 420 | sans | `text-body` |
| Body large (inputs on mobile, to avoid iOS zoom) | 16/24 | 420 | sans | `text-body-lg` |
| Small / meta | 13/18 | 450 | sans | `text-small` |
| Label | 13/16 | 600 | sans, sentence case | `text-label` |
| Numeric value | inherits size | 520 | `MONO 1`, tabular | `.num` |
| Batch code | 13/16 | 620 | `MONO 1` | `.code` |
| User note | 15/22 | 430 | `CASL 1`, `slnt −4` | `.note` |

Line length: body text is capped at `68ch` (`max-w-prose`).

## 6. Spacing and layout

- **Base unit 4 px.** Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 (Tailwind default spacing; no arbitrary values).
- **Mobile gutters** 16 px (`px-4`). Tablet 24 px. Desktop 32 px.
- **Breakpoints:**
  - `<768` mobile, with a bottom nav.
  - `≥768` tablet/desktop, with a left sidebar (232 px).
  - `≥1200` wide, where batch detail shows its main column plus an aside.
- **Content width:**
  - Reading and detail screens `max-w-[44rem]` (`--content-narrow`).
  - Lists `max-w-[56rem]`.
  - Compare is full width.
- **Vertical rhythm:** 24 px between sections on mobile, 32 px on desktop. 12 px between a heading and its content.
- **Rows instead of cards.** A list item is a full-bleed row with a 1 px `--rule` divider and a minimum 56 px touch height.
- **Alignment:** everything is left-aligned. Nothing in the app is centred except empty states and the create button.

## 7. Radius, elevation and motion

| Token | Value | Use |
|---|---|---|
| `--radius-tag` | 4 px | Stage tags, bottle labels, marker |
| `--radius-control` | 8 px | Buttons, inputs, segmented controls |
| `--radius-panel` | 12 px | Lineage block, compare columns, toast |
| `--radius-sheet` | 20 px | Bottom sheet top corners, dialogs |

- **Elevation** is used only for floating layers: `--shadow-float` (sheet, toast, create button). Static content has no shadow.
- **Motion** is used only when it explains a change:
  - The sheet slides up (180 ms).
  - The toast fades in.
  - A logged entry gets a one-time marker sweep (600 ms) so you see where it landed.
  - All motion is disabled under `prefers-reduced-motion`.

## 8. The signature: lineage

```
 KB-013  Black tea base v2          F2 · day 2
 ●──────────────────────────────── 3.8 L jar, bottled 4 Nov
 │
 ├─ A  Ginger, [juice]   1 tsp sugar     burped today
 ├─ B  Ginger, [puree]   1 tsp sugar     burp due
 ├─ C  Ginger, [chunks]  [2 tsp] sugar   burp due
 └─ D  [Raspberry–lime]  1 tsp sugar     chilled
```

- **Trunk.** A 2 px `--tea` line from the jar node.
- **Branch.** Each bottle branches off at its row.
- **Marker.** `[ ]` is the marker highlight, applied to each value that differs from its siblings. The diff rows come from the API (`POST /v1/compare`); the client never computes diffs.
- **Elsewhere.** The same component draws recipe version history (v1 → v4) and "brewed again from" chains.

## 9. Voice and copy

- Fermentation words, not data words: *jar, bottle, burp, taste, brew again, how did it turn out?* Avoid *record, entity, submit*.
- Buttons say what happens: "Log", "Bottle it", "Save as recipe", "Brew again", "Compare 3". A toast repeats the verb: "Logged", "Bottled".
- Food safety: never say safe, ready, passed or failed. Say "Day 8 of a typical 7–14", not "Ready".
- Empty states invite an action. They do not apologise.

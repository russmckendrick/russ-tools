# Handoff: Signal — the new russ.tools design language

## Overview

A replacement visual language for russ.tools, covering the shared shell
(header/footer), the tool index at `/`, and two representative tool pages
(`/ssl-checker` as a lookup tool, `/cron` as a builder tool). It is a
deliberate departure from the current dark-panelled system: square edges,
weight-contrasted rules instead of radius and shadow, Instrument Sans + Red Hat
Mono, a chartreuse action accent, and two themes instead of seven palettes.

The design language — not just these three pages — is the deliverable. It is
specified in full in `DESIGN.md`, written against the schema of the repo's
existing `DESIGN.md` so it can replace it and drive `pnpm generate:tokens`.

## About the design files

`prototype/russ.tools - Signal.dc.html` is a **design reference created in
HTML** — a prototype showing intended look and behaviour, not production code
to copy. The task is to implement this language in the existing Astro + React 19
+ Tailwind 4 codebase using its established patterns: `DESIGN.md` front-matter
→ `pnpm generate:tokens` → `src/styles/tokens.generated.css`, the semantic
utility layer in `src/styles/globals.css` / `shell.css`, the primitives in
`src/components/ui/`, and the shell parts in `src/shell/`.

The prototype stacks three pages vertically in one file with labelled dividers
between them, so all of them can be compared at once. In the real app they are
separate routes.

## Fidelity

**High-fidelity.** Colours, type scale, spacing, rule weights and hover states
are final and exact. Content is real copy taken from the tool manifests. The
only intentionally fake material is the SSL result data and check history, which
stand in for live API output.

## Files

| File | What it is |
|---|---|
| `DESIGN.md` | **The deliverable.** Drop-in replacement for the repo root `DESIGN.md` — front-matter tokens plus the prose design authority. |
| `signal-tokens.css` | Readable reference of the same values as CSS custom properties, for checking the generator's output. |
| `prototype/russ.tools - Signal.dc.html` | The hi-fi prototype: shell, index, SSL checker, CRON builder, with a working theme toggle. Open directly in a browser. |
| `prototype/support.js` | Runtime the prototype needs. Not part of the deliverable. |

## What changed, in one table

| Previously | Signal |
|---|---|
| Rounded 6/8/10/12px, shadow vocabulary | `rounded: 0` everywhere; `shadow: none` — the scale is deleted |
| Inter + JetBrains Mono | Instrument Sans + Red Hat Mono |
| `primary: #7d94ff` | `primary: #c6f232` (chartreuse) |
| Surface `#0d0f12`, blue-cast neutrals | Surface `#16171b`, neutral-warm greys |
| 7 palettes (Solarized, Catppuccin, Dracula, Nord, Tokyo Night, GitHub) | 2 themes: graphite dark, bone light |
| Cards with `gap` and individual borders | One shared-edge grid; borders belong to the grid |
| Category hue as hover border + glow | Category hue as a solid badge block; hover shifts ground |
| Card entrance stagger | No entrance motion |

## Screens

### 1. Shell (every page)

**Header.** Full-width bar closed by a **3px** bottom rule in `--color-rule`.
Inside, a `1200px` max-width row with `32px` gutters.

- Brand, left: a `14px × 14px` solid `#c6f232` square, `10px` gap, then
  `russ.tools` at Instrument Sans 17px/700/-0.02em. Vertical padding `18px 0`.
- Nav, right: items are **edge-to-edge cells** filling the header's full height,
  each `padding: 0 22px`, separated by `1px solid var(--color-outline)` on
  `border-left`. Type: 13px/500 (600 when active).
  - Active item (`Tools`): ground `--color-nav-active`, text
    `--color-primary-text`.
  - Inactive: `--color-on-surface-muted`, hover `--color-on-surface`.
  - Last cell is the theme toggle, `◐` in Red Hat Mono 12px.

**Footer.** `border-top: 3px solid var(--color-rule)`, ground
`--color-footer` — **dark in both themes** (`#101114` dark / `#16171b` light) —
text `#e9eaec` / `#f4f4f1`. Padding `28px 32px 44px`. Three parts on one
baseline: brand (12px accent square + name at 15px/700), the mono strip
`CLIENT-SIDE ONLY · NO ANALYTICS · NO ACCOUNTS` at Red Hat Mono 11px in
`--color-on-surface-faint`, and three links at 13px/500 with `24px` gap.

### 2. Index (`/`)

**Purpose.** Show the fifteen tools; filter by category or name.

**Head.** `48px 0 32px`. `Tools` at Instrument Sans 64px/700/-0.04em on the
left; on the right, baseline-aligned, `15 utilities · everything runs in your
browser` at Red Hat Mono 12px in `--color-on-surface-faint`. No hero, no stat
strip — consistent with the existing product decision.

**Filter row.** `border-top: 3px solid var(--color-rule)`, `border-bottom: 1px
solid var(--color-outline)`. Chips are Red Hat Mono 11px, `padding: 12px 18px`
(`12px 18px 12px 0` for the first), `--color-on-surface-muted`, hover
`--color-on-surface`. The active chip (`ALL 15`) is 600 weight with
`border-bottom: 3px solid var(--color-primary)` and `margin-bottom: -1px` so
the accent overlaps the hairline. Right-aligned hint `/ to filter` at 11px in
`--color-on-surface-dim`.

**Grid.** `display: grid; grid-template-columns: repeat(3, 1fr)` with
`border-left: 1px solid var(--color-outline)` on the container. **No `gap`.**
Each tile: `border-right` + `border-bottom` `1px solid var(--color-outline)`,
`padding: 18px 20px 16px`, ground `--color-surface`, flex column, `8px` gap.

Tile contents, in order:

1. Row, `justify-content: space-between; align-items: center`:
   - the tool's Material icon at **20px** in its `--color-category-*` text hue;
   - the category badge — solid `--color-category-fill-*`, text `#16171b`,
     Red Hat Mono 9px/600/0.08em, `padding: 3px 7px`, `white-space: nowrap`.
2. Title, Instrument Sans 17px/700/-0.02em, `line-height: 1.2`.
3. `shortDescription`, 13px/1.45 in `--color-on-surface-muted`.
4. Route path + `→`, Red Hat Mono 11px in `--color-primary-text`, pinned with
   `margin-top: auto`.

**Hover:** ground → `--color-surface-inset`. Nothing else changes; the icon
keeps its category hue and nothing moves.

Icons per tool, taken from each `manifest.mjs` (`src/shell/icons.mjs` keys):
`dns`, `lan`, `badge`, `manage-search`, `new-label`, `apps`, `corporate-fare`,
`token`, `password`, `policy`, `data-object`, `schedule`, `transform`,
`table-view`, `campaign`.

### 3. SSL Certificate Checker (`/ssl-checker`)

**Head.** Breadcrumb in Red Hat Mono 11px: `TOOLS → SECURITY`, with the
category crumb in `--color-category-security` at 600. Then a row with the
`policy` icon at **30px** in the category hue, `14px` gap, and the `h1` at
Instrument Sans 44px/700/-0.03em. Then one factual sentence at 15px/500 in
`--color-on-surface-muted`, `36px` below.

**Input.** One object: `border: 3px solid var(--color-rule)`, containing a
flex-1 field (`padding: 18px 22px`, Red Hat Mono 15px, ground
`--color-surface-raised`) and the submit button flush to its right — accent
ground, `#16171b` ink, `padding: 0 36px`, 15px/700, label `Check →`. Hover:
`--color-primary-hover`. No gap, no radius between them.

**Result panel.** `border: 1px solid var(--color-outline)` with `border-top: 3px
solid var(--color-rule)`; `grid-template-columns: 240px 1fr`.

- Left cell (`border-right` hairline, `padding: 28px`, ground
  `--color-surface-raised`): label `GRADE` in `label-caps`; the grade at
  Instrument Sans **104px**/700/-0.06em in `--color-success`; host and IP below
  at Red Hat Mono 12px in `--color-on-surface-faint`.
- Right cell: rows of `grid-template-columns: 200px 1fr`, each with a
  `border-bottom` hairline. Key cell: `label-caps` on `--color-surface`, ink
  `--color-on-surface-faint`, `13px 24px`, hairline `border-right`. Value cell:
  Red Hat Mono 13px on `--color-surface-raised`, `13px 24px`. Values that carry
  a verdict take `--color-success` (`VALID UNTIL`, `HSTS`); absent values take
  `--color-on-surface-faint`.

**Recent checks.** `h2` at 24px/700/-0.02em on a 3px bottom rule with `CLEAR`
right-aligned on the same baseline in `label-caps`. Rows:
`grid-template-columns: 1fr 80px 180px 110px`, `20px` gap, `14px 0`, hairline
`border-bottom`. Domain in Red Hat Mono 14px; grade at 17px/700 in the status
colour; timestamp at Red Hat Mono 12px muted; `RECHECK ↻` right-aligned in
`--color-primary-text`.

### 4. CRON Expression Builder (`/cron`)

Same head pattern with the `schedule` icon and the developer hue.

**Expression bar.** `border: 3px solid var(--color-rule)`, ground
`--color-surface-raised`. Top row: the expression at Red Hat Mono
**32px**/500/0.06em, `padding: 22px 24px`; flush right, a `COPY` button —
secondary style (`label-caps`, hairline `border-left`, panel ground) that
**inverts to the accent on hover** (`background: var(--color-primary); color:
var(--color-on-primary)`). Below, on a hairline, the plain-English translation
at 14px/500 in `--color-on-surface-muted` with the time itself bold in
`--color-on-surface`, plus the next fire time.

**Field row.** Five equal cells, `grid-template-columns: repeat(5, 1fr)`,
container `border: 1px solid var(--color-outline)` with `border-top: 3px solid
var(--color-rule)`, each cell hairline `border-right`, `padding: 18px 20px
20px`, `10px` gap. Per cell: `label-caps` field name; a select control
(`1px solid var(--color-outline-strong)`, `10px 12px`, 13px/600, `▾` in
`--color-on-surface-dim`, hover `border-color: var(--color-on-surface)`); and
the resulting token at Red Hat Mono 12px in `--color-primary-text`.

**Common schedules.** Two-column shared-edge grid, same border idiom as the
index. Each row: label 14px/600 left, expression Red Hat Mono 12px accent
right; hover → `--color-surface-inset`.

## Interactions & behaviour

- **Theme toggle** (`◐` in the header): switches graphite dark ⇄ bone light.
  Keep the existing mechanism — `vite-ui-theme` in localStorage, resolved
  synchronously in `BaseLayout.astro`'s head script before first paint. Remove
  the palette selector and `russ-tools-palette`; read it for one release only
  so a stored value degrades to a valid theme.
- **Hover** everywhere is a ground or colour change of `90–140ms linear`. No
  transform, no scale, no glow, no shadow.
- **Index filtering** behaviour is unchanged from today — category radio group,
  `/` to focus the name filter, `?q=` and `#category` in the URL, demoted
  groups rather than an empty page. Only the styling changes.
- **Card entrance stagger is removed.** A ruled grid arriving cell by cell
  reads as a rendering fault. Delete `rt-surface-enter` and the `restage()`
  call in `index.astro`.
- **Loading / error / empty** states were not redesigned in this prototype.
  Apply the language mechanically: a loading panel is `panel` with the message
  at `body-md` and a mono progress line; an error is `panel` with a 3px
  `--color-error` top rule and the word `ERROR` in `label-caps`; empty states
  keep today's copy. Flag these back if you want them drawn explicitly.

## State

No new state. The prototype's only state is the theme (`'dark' | 'light'`),
which maps onto the existing theme store. Everything else is presentational.

## Design tokens

All values live in `DESIGN.md` front-matter (`colors`, `typography`, `rounded`,
`borderWidth`, `shadow`, `spacing`, `components`, `motion`) and are mirrored as
CSS custom properties in `signal-tokens.css`. Highlights:

- Accent `#c6f232`, ink on accent `#16171b`; accent-as-text is `#c6f232` in
  dark and `#5f7d0a` in light — `#c6f232` is 1.4:1 on bone and must never be
  text there.
- Category hues have two roles: `category-fill-*` (theme-independent, always
  with `#16171b` ink) and `category-*` (text, deepened in light mode).
- Rules: `1px` hairline, `3px` structural. Radius `0`. Shadow `none`.
- Space scale `4 / 8 / 12 / 16 / 20 / 28 / 36 / 56 / 88`, gutter `32`,
  max-width `1200`.

Two contrast-test additions are required: validate `primary` only as a fill
against `on-primary`, and validate `category-fill-*` against `#16171b` while
`category-*` is validated as text against both grounds.

## Assets

- **Icons:** unchanged. The Material Design Icons set already in
  `src/shell/icons.mjs` (Apache 2.0, Google LLC), copied verbatim into the
  prototype. No new icons were drawn.
- **Fonts:** Instrument Sans and Red Hat Mono. Install
  `@fontsource-variable/instrument-sans` and
  `@fontsource-variable/red-hat-mono` and swap them for the Inter and
  JetBrains Mono imports in `BaseLayout.astro`. The prototype loads them from
  Google Fonts for convenience only.
- No images, illustrations or generated graphics are used anywhere.

## Open items

- Loading, error and empty states are described but not drawn.
- `/delete` and `/404` are not in this prototype.
- Open Graph card generation (`scripts/generate-og.mjs`) will need its
  template updated to the new type and palette.

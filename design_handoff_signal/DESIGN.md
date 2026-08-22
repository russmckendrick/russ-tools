---
version: signal-1
name: russ.tools
description: >-
  Signal: a hard-edged, grid-ruled interface language. Structure comes from
  weight-contrasted rules (3px structural, 1px hairline) rather than radius or
  shadow — nothing in the interface is rounded and nothing floats. One accent
  (chartreuse) does every action; six category hues label and never fill large
  areas. Graphite dark is the house ground, with a peer light theme on bone.

# ---------------------------------------------------------------------------
# COLOURS
# Two themes only. The alternate palettes (Solarized, Catppuccin, Dracula,
# Nord, Tokyo Night, GitHub) are retired — see "Palettes" in the prose below.
# ---------------------------------------------------------------------------
colors:
  # ---- Graphite dark (primary) ----
  surface: "#16171b"
  surface-raised: "#1d1f24"
  surface-inset: "#1f2127"
  outline: "#2a2d34"
  outline-strong: "#3a3e47"
  rule: "#e9eaec"            # NEW — the 3px structural rule
  on-surface: "#e9eaec"
  on-surface-muted: "#a2a8b3"
  on-surface-faint: "#8b919c"
  on-surface-dim: "#6b7180"  # NEW — hints, counters, placeholder metadata
  primary: "#c6f232"
  primary-hover: "#d4f75e"
  on-primary: "#16171b"
  nav-active: "#22242a"
  footer: "#101114"
  success: "#7ade7f"
  warning: "#f5c04e"
  error: "#f87171"
  info: "#6ba3ff"
  category-network: "#4fd8c4"
  category-azure: "#6ba3ff"
  category-microsoft: "#b79cff"
  category-security: "#f5c04e"
  category-developer: "#7ade7f"
  category-content: "#f58ab8"

  # ---- Bone light (peer; `-light` suffix) ----
  surface-light: "#f4f4f1"
  surface-raised-light: "#ffffff"
  surface-inset-light: "#eaeae4"
  outline-light: "#dddcd5"
  outline-strong-light: "#b9b8af"
  rule-light: "#16171b"
  on-surface-light: "#16171b"
  on-surface-muted-light: "#5d616a"
  on-surface-faint-light: "#767b84"
  on-surface-dim-light: "#9a9ea6"
  primary-light: "#c6f232"
  primary-hover-light: "#b1dd1f"
  on-primary-light: "#16171b"
  nav-active-light: "#e7e7e0"
  footer-light: "#16171b"        # the footer stays dark in both themes
  success-light: "#15803d"
  warning-light: "#a16207"
  error-light: "#dc2626"
  info-light: "#2563eb"
  category-network-light: "#0e7a6e"
  category-azure-light: "#2563eb"
  category-microsoft-light: "#7c3aed"
  category-security-light: "#a16207"
  category-developer-light: "#15803d"
  category-content-light: "#be185d"

  # ---- Category FILL hues -------------------------------------------------
  # A category badge is a solid block of hue with #16171b text, identical in
  # both themes: the bright dark-theme hue is the fill in light mode too,
  # because the text on it is always the graphite ink. The `category-*` values
  # above are the TEXT hues (crumbs, icons, small labels) and differ per theme.
  category-fill-network: "#4fd8c4"
  category-fill-azure: "#6ba3ff"
  category-fill-microsoft: "#b79cff"
  category-fill-security: "#f5c04e"
  category-fill-developer: "#7ade7f"
  category-fill-content: "#f58ab8"
  on-category-fill: "#16171b"

  # ---- Accent as TEXT -----------------------------------------------------
  # #c6f232 as text on the bone ground is 1.4:1. Light mode therefore uses an
  # olive derivative for accent text and links, and keeps #c6f232 for fills
  # only. Dark mode uses the accent directly.
  primary-text: "#c6f232"
  primary-text-light: "#5f7d0a"

# ---------------------------------------------------------------------------
# TYPOGRAPHY
# Instrument Sans replaces Inter; Red Hat Mono replaces JetBrains Mono.
# Prose is tight and heavy (700 at display sizes, -0.03em to -0.05em);
# mono is the label voice as well as the data voice.
# ---------------------------------------------------------------------------
typography:
  display:
    fontFamily: Instrument Sans
    fontSize: 64px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Instrument Sans
    fontSize: 44px
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: -0.03em
  headline-md:
    fontFamily: Instrument Sans
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.02em
  title-sm:
    fontFamily: Instrument Sans
    fontSize: 17px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Instrument Sans
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.5
  body-md:
    fontFamily: Instrument Sans
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.5
  body-sm:
    fontFamily: Instrument Sans
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
  label-caps:
    fontFamily: Red Hat Mono
    fontSize: 10px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.1em
  label-caps-sm:
    fontFamily: Red Hat Mono
    fontSize: 9px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.08em
  data-xl:
    fontFamily: Red Hat Mono
    fontSize: 32px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.06em
  data-lg:
    fontFamily: Red Hat Mono
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.4
  data-md:
    fontFamily: Red Hat Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  data-sm:
    fontFamily: Red Hat Mono
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.4
  # The grade / hero numeral. Sans, not mono — it is a verdict, not data.
  verdict:
    fontFamily: Instrument Sans
    fontSize: 104px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: -0.06em

# ---------------------------------------------------------------------------
# SHAPE — everything is square. This is the single biggest departure.
# ---------------------------------------------------------------------------
rounded:
  sm: 0px
  md: 0px
  lg: 0px
  xl: 0px
  full: 9999px   # retained for the one legitimate pill: status dots

borderWidth:
  hairline: 1px
  control: 1px
  structural: 3px

# No elevation scale. Shadows are removed from the language entirely; depth is
# expressed by ground value (surface -> surface-raised) and by rule weight.
shadow:
  none: none

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 28px
  3xl: 36px
  4xl: 56px
  5xl: 88px
  gutter: 32px
  max-width: 1200px

components:
  # ---- shell ----
  site-header:
    borderBottomColor: "{colors.rule}"
    borderBottomWidth: "{borderWidth.structural}"
    padding: 0
  nav-item:
    typography: "{typography.body-sm}"
    textColor: "{colors.on-surface-muted}"
    borderLeftColor: "{colors.outline}"
    padding: 0 22px
  nav-item-active:
    backgroundColor: "{colors.nav-active}"
    textColor: "{colors.primary-text}"
  site-footer:
    backgroundColor: "{colors.footer}"
    textColor: "{colors.on-surface}"
    borderTopColor: "{colors.rule}"
    borderTopWidth: "{borderWidth.structural}"
    padding: 28px 32px 44px

  # ---- panels ----
  panel:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.outline}"
    borderTopColor: "{colors.rule}"
    borderTopWidth: "{borderWidth.structural}"
    rounded: "{rounded.lg}"
    padding: 0
  panel-emphasis:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.rule}"
    borderWidth: "{borderWidth.structural}"

  # ---- the tool tile ----
  card:
    backgroundColor: "{colors.surface}"
    borderRightColor: "{colors.outline}"
    borderBottomColor: "{colors.outline}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 18px 20px 16px
  card-hover:
    backgroundColor: "{colors.surface-inset}"

  # ---- controls ----
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.sm}"
    padding: 0 36px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    borderColor: "{colors.outline}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.sm}"
    padding: 0 28px
  button-secondary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  input:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.rule}"
    borderWidth: "{borderWidth.structural}"
    textColor: "{colors.on-surface}"
    typography: "{typography.data-lg}"
    rounded: "{rounded.sm}"
    padding: 18px 22px
  select:
    backgroundColor: transparent
    borderColor: "{colors.outline-strong}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: 10px 12px
  chip:
    backgroundColor: transparent
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.sm}"
    padding: 12px 18px
  chip-active:
    textColor: "{colors.on-surface}"
    borderBottomColor: "{colors.primary}"
    borderBottomWidth: "{borderWidth.structural}"

  # ---- markers ----
  badge-category:
    backgroundColor: "{colors.category-fill-network}"
    textColor: "{colors.on-category-fill}"
    typography: "{typography.label-caps-sm}"
    rounded: "{rounded.sm}"
    padding: 3px 7px
  key-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-faint}"
    typography: "{typography.label-caps}"
    borderRightColor: "{colors.outline}"
    padding: 13px 24px
  value-cell:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.data-md}"
    padding: 13px 24px

motion:
  duration-fast: 90ms
  duration-base: 140ms
  easing: linear
---

# russ.tools Design System — Signal

## Overview

Signal is a **ruled grid**, not a set of cards. Every boundary in the interface
is a straight line of one of two weights, and every region is a rectangle that
shares its edges with its neighbours. There are no rounded corners, no shadows,
no gradients and no floating surfaces. What was previously communicated with
radius and elevation is now communicated with **rule weight** and **ground
value**.

Three rules produce the whole language:

1. **3px rules divide, 1px rules organise.** A 3px rule marks the top of a
   region a reader should treat as a new thing — the header, the footer, a
   results panel, a section heading. A 1px rule separates peers inside it —
   table rows, grid cells, list items. Nothing else draws a boundary.
2. **The accent acts, the category labels.** Chartreuse `#c6f232` is the only
   colour that appears on a thing you can press. The six category hues appear
   as small solid badge fills and as icon/crumb text, never as a large fill and
   never on a control.
3. **Grids share their edges.** The tool index is a single 3-column grid with
   one hairline between cells and no gap. Cells are not separated objects with
   their own borders; the border belongs to the grid.

### What changed from the previous system

| Previously | Now |
|---|---|
| Rounded panels (6/8/10/12px), shadow vocabulary | Square. `rounded: 0` everywhere. No shadow scale at all. |
| Inter + JetBrains Mono | **Instrument Sans** + **Red Hat Mono** |
| `primary: #7d94ff` (periwinkle) | `primary: #c6f232` (chartreuse) |
| Near-black `#0d0f12`, blue-cast neutrals | Graphite `#16171b`, neutral-warm greys |
| Seven palettes (Solarized, Catppuccin, Dracula, Nord, Tokyo Night, GitHub) | **Two**: graphite dark + bone light |
| Cards separated by `gap`, each with its own border | One shared-edge grid, hairline dividers, no gap |
| Category hue as hover border + glow | Category hue as a solid badge block; hover is a ground shift |
| Muted category text badges | Solid category fill with `#16171b` ink |

### Palettes

The alternate palettes are retired. They multiplied every colour decision by
seven, forced the accent to be re-derived per palette, and made the contrast
matrix in `tokens.contrast.test.js` the largest single constraint on the
design. Signal ships **graphite dark** and **bone light**. The theme toggle in
the header stays exactly as built — `vite-ui-theme` in localStorage, resolved
synchronously in the head before first paint — and the palette selector and
`russ-tools-palette` key are removed. Keep the `data-palette` read for one
release so a stored value fails to a valid theme rather than an error.

## Colours

### The accent

`#c6f232` is a fill colour. It is 1.4:1 as text on bone, so **light mode never
uses it for text or links** — it uses `primary-text-light: #5f7d0a` there,
while dark mode uses the raw accent (`primary-text: #c6f232`, 12.9:1 on
graphite). Buttons, the active-chip underline, and the accent square in the
brand mark are the same `#c6f232` in both themes, always with `#16171b` ink.

### The category hues

Each category has **two** values, and they are not interchangeable:

- **`category-fill-*`** — the bright hue, used as a solid badge block with
  `#16171b` text. Identical in both themes, because the ink on it is always
  graphite.
- **`category-*`** — the text hue for breadcrumbs, tool icons and small labels.
  Bright in dark mode, deepened in light mode (`#0e7a6e` rather than
  `#4fd8c4`) so it clears 4.5:1 on bone.

A category hue is still never a button, a large panel fill, or a page ground.

### The footer is dark in both themes

The footer inverts under light mode — `footer-light: #16171b`. It closes the
page with the same weight in both themes and stops a long bone page from
running off the bottom of the viewport.

## Typography

`Instrument Sans` for everything that is prose or a heading; `Red Hat Mono` for
everything that is data **and** everything that is a small label. Labels being
mono is a change: `label-caps` and `label-caps-sm` are the mono voice at 9–10px
with wide tracking, and they carry all key cells, chips, crumbs and metadata.

Headings are heavy and tight — 700 weight, `-0.02em` to `-0.06em` — and this is
what makes the language recognisable at a glance. Do not set a heading below
600, and do not letterspace a heading positively.

One numeral escapes the mono rule: the **verdict** step (`104px/700` sans) is
for a single graded result — the SSL grade, and nothing else per page. It is a
judgement, not a value.

Install via fontsource, matching the existing pattern in `BaseLayout.astro`:

```js
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/red-hat-mono';
```

## Layout

- One content column, `max-width: 1200px`, `32px` gutters. Wider than before
  (1120px) because the index grid is 3 shared-edge columns.
- **The tool index** is `grid-template-columns: repeat(3, 1fr)` with
  `border-left` on the container and `border-right`/`border-bottom` on each
  cell — no `gap`. The outer frame is completed by the container's left border
  and the last column's right border.
- **Key/value results** are a 2-column grid, `200px 1fr`. The key cell takes
  `surface` and the value cell `surface-raised`, so the split reads without a
  vertical rule doing the work alone.
- **Section headings** sit on a 3px bottom rule with their action right-aligned
  on the same baseline.
- Vertical rhythm between major regions is `56px` inside a page and `88px`
  between pages/sections.

## Shape

Radius is `0` at every step. If a control looks unfinished square, the fix is
rule weight or padding, never radius. The only permitted curve in the system is
`rounded.full` on a status dot.

## Elevation

There is none. `shadow: none` is the whole scale. Depth ordering, lightest to
heaviest: `surface` → `surface-raised` → `surface-inset` (hover) — plus rule
weight. A panel that needs to feel primary takes a 3px border
(`panel-emphasis`), not a shadow.

## Components

### Navigation

The header is a full-width bar closed by a 3px rule. Nav items are
**edge-to-edge cells** separated by 1px vertical rules, each `0 22px`, filling
the header's full height — not pills with gaps. The active item takes the
`nav-active` ground and accent text. The brand is the accent square (14px) plus
`russ.tools` at 700.

### The tool tile

Icon (20px, category text hue) and category badge on the first line, opposed;
title at `title-sm`; description at `body-sm` in `on-surface-muted`; the route
path at `data-sm` in the accent, pinned to the bottom. Hover moves the ground
to `surface-inset` — it does **not** invert to a solid fill, and the icon keeps
its category hue.

### Inputs

The primary input on a tool page is a single 3px-bordered row: the field at
`data-lg` on `surface-raised`, and the submit button as a flush accent block
with no gap and no radius. The field and the button are one object.

### Buttons

- **Primary**: accent ground, graphite ink, `0 36px`, hover to
  `primary-hover`.
- **Secondary**: panel ground, 1px outline, `label-caps` type, and on hover it
  **becomes** the primary (accent ground, graphite ink). That inversion is the
  system's one flourish; use it on utility actions like COPY.

### Chips (the index category filter)

A row of mono labels on a 3px top rule and a 1px bottom rule. The active chip
is marked by a 3px accent underline that overlaps the hairline
(`margin-bottom: -1px`), not by a filled background.

### Badges

Category badges are solid `category-fill-*` blocks with `#16171b` ink at
`label-caps-sm`. Status uses text colour only (`success`, `warning`, `error`)
plus its literal word — colour is never the sole carrier.

## Iconography

Unchanged. The Material Design Icons set in `src/shell/icons.mjs` is kept
verbatim, one glyph per tool from its manifest, `currentColor`, 24px grid.
Render at **20px** in a tool tile and **30px** beside a tool-page `h1`, in the
category text hue. Do not add a tile, ring or ground behind an icon.

## Motion

Deliberately minimal. Hover ground and colour changes are `90–140ms linear`;
there is no easing curve, no scale, no translate and no glow. The card entrance
stagger is removed — a ruled grid arriving one cell at a time reads as a fault.
Ambient motion stays off under `prefers-reduced-motion`, which now costs
almost nothing because there is almost no motion.

## Accessibility

The existing CI floors continue to apply, with two additions the contrast test
must cover:

1. `primary` may only be validated as a **fill** (with `on-primary`), never as
   text. Assert `primary-text` / `primary-text-light` for the text role.
2. `category-fill-*` must be validated against `on-category-fill` (`#16171b`),
   and `category-*` against both grounds as text.

`category-accent.test.js` should keep guarding the "no action colour in a text
slot" rule; the accent is now further from a legible text colour than before,
so that guard matters more.

## Do's and Don'ts

### Do

- Let regions share edges; put the border on the grid, not the cell.
- Use rule weight to say "new thing" (3px) versus "next item" (1px).
- Set data, labels, crumbs and metadata in Red Hat Mono.
- Keep the accent for actions and the category hue for identity.
- Invert secondary buttons to the accent on hover.

### Don't

- Add radius, shadow, gradient or glow anywhere.
- Fill anything large with a category hue, or put one on a button.
- Use `#c6f232` as text on the light ground.
- Reintroduce `gap` into the index grid, or give tiles individual borders.
- Letterspace headings positively, or set them below 600 weight.
- Animate a card entrance, or move anything on hover.

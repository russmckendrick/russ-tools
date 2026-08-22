---
version: stacks-1
name: russ.tools
description: >-
  Stacks: a warm, chunky, high-contrast interface language. Structure comes
  from a 2px ink border and a hard offset shadow — nothing blurs, nothing
  floats, and the shadow is a statement of pressability, not of elevation.
  One green accent does every action; six candy category hues label and never
  fill large areas. Paper light is the house ground; the dark peer is a warm
  espresso that keeps the same physics — cards lighter than the page, shadows
  darker — rather than an inversion into cream-on-black.

# ---------------------------------------------------------------------------
# COLOURS
# Two themes only, unchanged from Signal's economy: the alternate palettes
# stay retired.
#
# Every value here is measured by src/styles/tokens.contrast.test.js. The
# binding constraint is the light theme: a category or status hue used as
# TEXT must clear 4.5:1 on the inset ground (#f1ead9), which is why the
# light text hues are so much deeper than the fills.
# ---------------------------------------------------------------------------
colors:
  # ---- Espresso dark (peer values, unsuffixed because dark stays the CSS
  #      default theme; see "Which theme is the house" in the prose).
  #      The dark theme keeps the LIGHT theme's physics: the page is a warm
  #      cocoa, cards sit visibly LIGHTER on it, and the press shadow is
  #      darker than the page — not an inversion into cream-on-black, which
  #      collapsed every card into a wire outline. ----
  surface: "#241f18"
  surface-raised: "#2e2820"
  surface-inset: "#383025"
  outline: "#453c2c"
  outline-strong: "#8f8670"  # a control boundary needs 3:1 on every ground
  rule: "#7d735e"            # a quiet warm taupe — full cream borders glowed
  on-surface: "#f5efe0"
  on-surface-muted: "#bab19c"
  on-surface-faint: "#a59c86"
  on-surface-dim: "#877e66"  # non-text metadata only — held to 3:1, never 4.5:1
  primary: "#6ee787"
  primary-hover: "#8bf09e"
  on-primary: "#17150f"
  nav-active: "#332c22"
  footer: "#191510"
  success: "#6ee787"
  warning: "#ffc857"
  error: "#ff6b6b"
  info: "#5aa7ff"
  success-subtle: "#2b3b26"
  warning-subtle: "#423a28"
  info-subtle: "#2b3547"
  error-subtle: "#422b26"
  category-network: "#2dd4bf"
  category-azure: "#5aa7ff"
  category-microsoft: "#b393ff"
  category-security: "#ffc857"
  category-developer: "#ff9f43"
  category-content: "#ff7eb6"

  # ---- Paper light (the house ground; `-light` suffix) ----
  surface-light: "#faf4e8"
  surface-raised-light: "#fffdf7"
  surface-inset-light: "#f1ead9"
  outline-light: "#e8e0cd"
  outline-strong-light: "#7b7359"    # 3.95:1 on the inset, 4.66:1 on a card
  rule-light: "#17150f"              # the 2px structural border is ink on paper
  on-surface-light: "#17150f"
  on-surface-muted-light: "#4d493e"
  on-surface-faint-light: "#5d5748"
  on-surface-dim-light: "#6e6855"
  primary-light: "#6ee787"
  primary-hover-light: "#4fd96f"
  on-primary-light: "#17150f"
  nav-active-light: "#eee5d0"
  footer-light: "#efe7d3"            # a deepened paper band, not an ink slab
  success-light: "#14793a"           # 4.58:1 on the inset
  warning-light: "#975c07"           # 4.55:1 on the inset
  error-light: "#ce2121"             # 4.53:1 on the inset
  info-light: "#1e5eea"              # 4.55:1 on the inset
  success-subtle-light: "#e2efe0"
  warning-subtle-light: "#f4ead6"
  info-subtle-light: "#e4eafb"
  error-subtle-light: "#f8e6e0"
  category-network-light: "#0e766b"    # 4.59:1 on the inset
  category-azure-light: "#1e5eea"
  category-microsoft-light: "#7c3aed"
  category-security-light: "#975c07"
  category-developer-light: "#9c5205"  # 4.84:1 on the inset
  category-content-light: "#be185d"

  # ---- Category FILL hues -------------------------------------------------
  # A category badge is a solid block of hue behind #17150f ink, identical in
  # both themes: the bright hue is the fill in light mode too, because the
  # ink on it is always graphite. The `category-*` values above are the TEXT
  # hues (crumbs, icons, small labels) and differ per theme. The two slots
  # are not interchangeable — a text hue behind the badge ink measures 1.6:1.
  category-fill-network: "#2dd4bf"
  category-fill-azure: "#5aa7ff"
  category-fill-microsoft: "#b393ff"
  category-fill-security: "#ffc857"
  category-fill-developer: "#ff9f43"
  category-fill-content: "#ff7eb6"
  on-category-fill: "#17150f"

  # ---- Accent as TEXT -----------------------------------------------------
  # #6ee787 as text on paper is ~1.6:1. Light mode therefore uses a deep
  # green for accent text, links and the focus ring, and keeps #6ee787 for
  # fills only. Dark mode uses the raw accent.
  primary-text: "#6ee787"
  primary-text-light: "#1b7038"  # 4.9:1 on nav-active-light, 5.1:1 on the inset

  # ---- Ink on a solid status fill -----------------------------------------
  # NOT `on-primary`. The accent is bright and takes graphite ink in both
  # themes; the status hues are bright in dark mode and deep in light mode,
  # so their ink has to flip.
  on-status: "#17150f"
  on-status-light: "#ffffff"

  # ---- The press shadow ---------------------------------------------------
  # The offset shadow's colour, distinct from `rule` on purpose: the border
  # inverts with the theme (ink on paper, taupe on espresso) but a shadow
  # is always DARKER than the ground it falls on. In light it is the ink; in
  # dark it is true black, because on the cocoa grounds anything softer
  # disappears. A pale shadow reads as a glow, not a press.
  shadow-ink: "#000000"
  shadow-ink-light: "#17150f"

  # ---- Ink on the footer --------------------------------------------------
  # The footer ground follows the theme (a deepened step of each theme's own
  # ground), so its ink follows too. The ink-slab footer was tried and read
  # as jarring against the paper page.
  on-footer: "#f5efe0"
  on-footer-muted: "#b5ad99"
  on-footer-light: "#17150f"
  on-footer-muted-light: "#4d493e"

# ---------------------------------------------------------------------------
# TYPOGRAPHY
# Bricolage Grotesque replaces Instrument Sans for display and headings;
# Space Grotesk replaces it for body and labels; Space Mono replaces
# Red Hat Mono for data. Three families, strictly separated jobs.
#
# Step names are load-bearing in five other places — scripts/generate-tokens.mjs
# (LINE_HEIGHTS), src/lib/utils.js (TYPE_SCALE), src/lib/utils.test.js (STEPS),
# eslint.config.js (the off-scale message) and tokens.contrast.test.js. Adding
# or renaming a step means editing all five. The names are unchanged from
# Signal for exactly that reason.
# ---------------------------------------------------------------------------
typography:
  display:
    fontFamily: Bricolage Grotesque
    fontSize: 56px
    fontWeight: 800
    lineHeight: 1
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 40px
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Bricolage Grotesque
    fontSize: 22px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Bricolage Grotesque
    fontSize: 17px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.5
  body-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Space Grotesk
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.07em
  label-caps-sm:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.06em
  data-xl:
    fontFamily: Space Mono
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.2
  data-lg:
    fontFamily: Space Mono
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.4
  data-md:
    fontFamily: Space Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  data-sm:
    fontFamily: Space Mono
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.4
  # The grade / hero numeral. Display voice, not mono — it is a verdict.
  verdict:
    fontFamily: Bricolage Grotesque
    fontSize: 96px
    fontWeight: 800
    lineHeight: 1
    letterSpacing: -0.04em

# ---------------------------------------------------------------------------
# SHAPE — rounded is back, and it is chunky rather than soft. The radius is
# always paired with the 2px ink border; a radius on a borderless region is
# not part of the language.
# ---------------------------------------------------------------------------
rounded:
  sm: 8px
  md: 10px
  lg: 14px
  xl: 18px
  full: 9999px

# ---------------------------------------------------------------------------
# The four keys below — borderWidth, shadow, components, motion — are
# DOCUMENTATION. `pnpm generate:tokens` shells out to @google/design.md, whose
# css-tailwind emitter reads only `colors`, `typography`, `rounded` and
# `spacing`; everything else produces no output whatsoever. The border, motion
# and shadow values are therefore hand-written into the @theme block in
# src/styles/globals.css, and `components` is implemented by hand in
# src/components/ui/ and src/styles/shell.css. Keep them in step by reading.
# ---------------------------------------------------------------------------
borderWidth:
  hairline: 1px
  control: 2px
  structural: 2px

# The offset shadow is hard-edged (no blur) and its colour is always the
# `shadow-ink` token — the ink in light, true black in dark; never grey,
# never translucent, never a light colour (a pale shadow reads as a glow).
# It means exactly one thing: THIS IS PRESSABLE.
# Pressing an element sinks it: translate by the offset, shadow to none.
# The one exception is `press-lg`, which also marks the page's one emphasis
# panel (the result you came for), because that panel is the page's object.
# (Offsets only here; the colour is always `colors.rule`, stated in prose
# because the exporter cannot carry a reference inside a shadow string.)
shadow:
  press-sm: 3px 3px 0
  press: 4px 4px 0
  press-lg: 5px 5px 0

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
    borderBottomWidth: 2px
    padding: 0
  # Nav items are folder TABS standing on the header's bottom rule: bordered
  # on three sides, top corners rounded, no bottom border. The active tab
  # opens into the page — its ground and bottom edge are the page surface.
  nav-item:
    typography: "{typography.body-sm}"
    textColor: "{colors.on-surface-muted}"
    backgroundColor: "{colors.nav-active}"
    borderColor: "{colors.rule}"
    borderWidth: 2px
    rounded: 10px 10px 0 0
    padding: 10px 17px
  nav-item-active:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.rule}"
    textColor: "{colors.on-surface}"
  site-footer:
    backgroundColor: "{colors.footer}"
    textColor: "{colors.on-footer}"
    borderTopColor: "{colors.rule}"
    borderTopWidth: 2px
    padding: 28px 32px 44px

  # ---- panels ----
  # The offset shadow is on `panel-emphasis`, NOT on `panel`. A page here
  # stacks five to ten panels; a shadow under every one of them stops meaning
  # anything. See "Panels" in the prose.
  panel:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.rule}"
    borderWidth: 2px
    rounded: "{rounded.lg}"
    padding: 0
  panel-emphasis:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.rule}"
    borderWidth: 2px
    rounded: "{rounded.lg}"
    shadow: 5px 5px 0

  # ---- the tool tile ----
  card:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.rule}"
    borderWidth: 2px
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 18px 20px 16px
  card-hover:
    shadow: 4px 4px 0

  # ---- controls ----
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    borderColor: "{colors.rule}"
    borderWidth: 2px
    typography: "{typography.body-lg}"
    rounded: "{rounded.md}"
    shadow: 3px 3px 0
    padding: 0 22px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    borderColor: "{colors.rule}"
    borderWidth: 2px
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    shadow: 3px 3px 0
    padding: 0 18px
  input:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.rule}"
    borderWidth: 2px
    textColor: "{colors.on-surface}"
    typography: "{typography.data-md}"
    rounded: "{rounded.md}"
    padding: 10px 13px
  select:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.rule}"
    borderWidth: 2px
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.md}"
    padding: 10px 12px
  chip:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface-muted}"
    borderColor: "{colors.rule}"
    borderWidth: 2px
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: 7px 14px
  chip-active:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.surface}"

  # ---- markers ----
  badge-category:
    backgroundColor: "{colors.category-fill-network}"
    textColor: "{colors.on-category-fill}"
    borderColor: "{colors.rule}"
    borderWidth: 2px
    typography: "{typography.label-caps-sm}"
    rounded: "{rounded.sm}"
    padding: 3px 8px
  badge-status:
    backgroundColor: "{colors.success-subtle}"
    textColor: "{colors.success}"
    typography: "{typography.label-caps-sm}"
    rounded: "{rounded.sm}"
    padding: 3px 8px
  key-cell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-faint}"
    typography: "{typography.label-caps}"
    padding: 13px 24px
  value-cell:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.data-md}"
    padding: 13px 24px

motion:
  duration-fast: 90ms
  duration-base: 140ms
  easing: ease-out
---

# russ.tools Design System — Stacks

## Overview

Stacks is **playful and structural at once**: every region is a rounded
rectangle drawn with a real 2px ink border, and every pressable thing sits on
a hard offset shadow that vanishes when pressed. There are no blurs, no
gradients, no translucency and no grey shadows — depth is a flat, honest
offset in the structural colour, and it is a statement of *pressability*, not
of elevation.

Three rules produce the whole language:

1. **The border is the structure.** A 2px border in the `rule` colour (ink
   on paper, a quiet warm taupe on espresso — full cream glowed) bounds
   every panel, control and badge. The 1px
   `outline` hairline organises peers *inside* a bordered region — table
   rows, list items, a panel's header bar. Nothing else draws a boundary.
2. **Shadow means pressable; pressing sinks it.** The offset shadow
   (`press-sm` on buttons, `press` on a hovered tile, `press-lg` on the one
   emphasis panel) is hard-edged, offset down-right, and always the `rule`
   colour. `:active` translates the element by the offset and removes the
   shadow — the press is the animation. Panels at rest have **no** shadow.
3. **The accent acts, the category labels.** Green `#6ee787` is the only
   colour on a thing you can press. The six category hues appear as solid
   badge blocks, icon tiles, crumbs and small labels — never as a large fill,
   never on a control, and never as the shadow of anything but a tool tile.

### What changed from Signal

| Signal | Stacks |
|---|---|
| Square, `rounded: 0` everywhere, no shadow scale | Chunky radii (8–14px) + hard offset shadows on pressables |
| Rule *weight* (3px vs 1px) as the structural grammar | Rule *colour* at 2px as the structural grammar; hairlines stay 1px |
| Graphite dark house ground, bone light peer | **Paper light house ground**, ink dark peer |
| Chartreuse `#c6f232` accent | Green `#6ee787` accent |
| Instrument Sans + Red Hat Mono | **Bricolage Grotesque** (display) + **Space Grotesk** (body/labels) + **Space Mono** (data) |
| Shared-edge index grid, no gap | Separated tiles with gap — the border belongs to the tile again |
| Mono small labels | Sans small labels; mono is data only again |

What did **not** change: the two-theme economy (no alternate palettes), the
category fill/text two-slot system, the `on-status` / `on-footer` roles, the
accent-as-fill-never-as-text rule, the spacing scale, and every token *name*.

### Which theme is the house

Paper light is the house ground — the OG cards, screenshots and first-run
default should read as paper. The CSS layer keeps **dark as the unsuffixed
default** purely as plumbing: the `-light` suffix convention, the theme
toggle, the pre-paint script and the test matrix all assume it, and flipping
the plumbing would churn every consumer for zero visual difference. The
browser `theme_color` follows the dark surface because the manifest cannot
switch per theme.

## Colours

### The accent

`#6ee787` is a fill colour. It is ~1.6:1 as text on paper, so **light mode
never uses it for text, links or the focus ring** — it uses
`primary-text-light: #1b7038` there, while dark mode uses the raw accent
(`primary-text: #6ee787`). Buttons and toggles are the same `#6ee787` in both
themes, always with `#17150f` ink and a 2px `rule` border.

The accent deliberately shares its hue family with `success`: a confirmation
and an action rhyme. It is **not** the developer category hue — that is
orange `#ff9f43` — so a primary button never reads as a category signal.
(The design-canvas mockups had developer green; the coded system moved it to
orange precisely because green was already spoken for by the accent.)

### The category hues

Each category has **two** values, and they are not interchangeable:

- **`category-fill-*`** — the bright candy hue, used as a solid badge block
  or icon tile with `#17150f` ink and a 2px `rule` border. Identical in both
  themes.
- **`category-*`** — the text hue for breadcrumbs and small labels. Bright in
  dark mode, deepened in light mode (`#0e766b` rather than `#2dd4bf`) so it
  clears 4.5:1 on paper.

A category hue is still never a button, a large panel fill, or a page ground.
`--cat` carries a `category-*` **text** hue and never a `category-fill-*`
value. `category-accent.test.js` enforces both directions.

(An earlier dark theme let tool tiles cast category-hued hover shadows.
That flourish is retired with the Espresso rework: the shadow is `shadow-ink`
in both themes, because a coloured shadow undermined the press metaphor the
whole elevation story rests on.)

### Status colour has three roles, not one

- **`success` / `warning` / `error` / `info`** — the hue as *text*, over any
  of the three grounds.
- **`*-subtle`** — a quiet tint used as the ground of an alert or a status
  badge. Its own hue must stay legible on it.
- **`on-status`** — the ink on a *solid* status fill. Not `on-primary`: the
  accent is bright in both themes and takes graphite ink, while the status
  hues flip (bright in dark, deep in light), so their ink flips too
  (`#17150f` dark, `#ffffff` light).

Colour is never the sole carrier of a status — the literal word goes with it.
An alert marks itself with a solid status icon block (2px-bordered square of
the status fill with `on-status` ink), never with a tinted left border.

### The footer follows the theme

The footer is a deepened band of the theme's own ground (`#efe7d3` on paper,
`#191510` on espresso), closed above by the 2px rule — a step down, not a slab.
An ink footer on the paper page was tried and read as jarring. Because the
ground now flips, its ink flips with it: `on-footer` / `on-footer-muted`
carry `-light` peers like every other surface role.

### The dim step is not body text

`on-surface-dim` is the fourth and last step of the text ramp, held to **3:1
rather than 4.5:1**. It is for non-essential metadata duplicated elsewhere —
a counter, a placeholder, a keyboard hint. Anything a reader has to read is
`on-surface-faint` or above.

## Typography

Three families, strictly separated jobs:

- **Bricolage Grotesque** — display, headlines, titles, the verdict numeral.
  Heavy (700–800) and tight (`-0.01em` to `-0.04em`). This is the voice that
  makes Stacks recognisable; do not set a heading below 700 or letterspace
  one positively.
- **Space Grotesk** — body, UI copy, and **all small labels**. `label-caps`
  and `label-caps-sm` are sans now (600 weight, modest tracking), not mono:
  Stacks labels are friendly signage, not machine tags.
- **Space Mono** — data and only data: IPs, tokens, hashes, cron fields,
  code, the route path. If a human typed it or a machine emitted it, it is
  mono; if the site is speaking, it is not.

**One class applies one step.** `text-title-sm` carries its own weight,
line-height and letter-spacing; never put a `font-*`, `leading-*` or
`tracking-*` beside it. Tailwind's stock sizes are off-scale and ESLint
blocks them.

Install via fontsource, matching the existing pattern in `BaseLayout.astro`:

```js
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/space-grotesk';
import '@fontsource/space-mono';
import '@fontsource/space-mono/700.css';
```

## Layout

- One content column, `max-width: 1200px`, `32px` gutters.
- **The tool index** is a 3-column grid of separated tiles with a real `gap`
  (16–22px). Signal's shared-edge idiom is retired: the border belongs to
  the tile again, because the tile is a pressable object.
- **Controls above results, stacked.** The two-column control/result split
  was tried and withdrawn (Session 6); Stacks does not resurrect it. A tool
  page is: head, input band, result panels, in one column.
- **Key/value results** are a 2-column grid, `200px 1fr`, key cells at
  `label-caps` on the page ground, value cells at `data-md` on the panel
  ground, hairline rows.
- Vertical rhythm between major regions is `56px` inside a page and `88px`
  between pages/sections.

## Shape

The scale is `8 / 10 / 14 / 18px` — badge and chip, control, panel, sheet.
A radius always travels with the 2px border; a borderless rounded region is
not in the language. `rounded.full` is for pills: nav items, the toggle
knob, status dots, keycap hints.

## Elevation

There is no elevation. The offset shadow is not "height"; it is
**pressability**, drawn flat in `shadow-ink` with zero blur — darker than
the ground in both themes, exactly like the light theme's ink shadow:

- `press-sm` (3px) — buttons, chips, small controls.
- `press` (4px) — a hovered/focused tool tile.
- `press-lg` (5px) — the one `panel-emphasis` per page, and nothing else.

`:active` on any shadowed control translates it by its offset and removes
the shadow. Panels at rest, inputs, badges, tables and rows carry **no**
shadow — a page dense with data goes quiet, and the chunk stays on the
frame and the controls.

## Components

### Navigation

The header is a full-width bar closed by a 2px `rule`, and the rule is a
**shelf**: the nav items are folder tabs standing on it. A tab is bordered
on three sides with rounded top corners and the `nav-active` ground; the
active tab takes the page ground and erases the rule beneath itself, so it
reads as open into the page. On a page none of the tabs own (a tool page),
every tab sits closed. The theme control renders as the last tab and keeps
its three-state system → light → dark cycle button with `aria-live`
labelling.

The brand is **signage, not a chip**: the toolbox mark in `primary-text`
beside `russ.tools` set in the display face at the `headline-md` step — no
box, no border, no shadow, and no off-ramp size. The wordmark competes with
nothing because it is the only display type in the bar.

Nav tabs may carry a small leading Lucide glyph where it names the
destination — the GitHub mark on Source, the disc on Saved data — never a
trailing arrow.

### Panels

A panel is `surface-raised` inside a 2px `rule` border at `rounded.lg`, with
**no shadow at rest**. Its header bar sits on the page ground behind a
hairline, title at `label-caps`. **One panel per page** — the result, the
output, the thing you came for — takes `press-lg` via `<Card emphasis>`.
That is the whole emphasis system; do not stack it.

An error panel swaps its border colour to `error` and says the word ERROR;
colour never carries the state alone.

### The tool tile

A bordered card: icon in a small `category-fill` tile (2px border,
`rounded.sm`) and the category badge on the first line, opposed; title at
`title-sm`; description at `body-sm` in `on-surface-muted`; the route path
at `data-sm` in `primary-text`, pinned to the bottom. Hover lifts nothing
and tints nothing: the tile gains the `press` shadow (category-hued in dark
mode) and moves up-left by 2px, exactly as if it had risen under the finger.
Reduced motion: shadow only, no translate.

### Inputs

A 2px `rule` border on `surface-raised` at `rounded.md`, content at
`data-md` (input is data). Focus is the ring (`--color-ring` →
`primary-text`), not a border swap. The primary input row on a tool page may
join the field and its submit button flush, sharing the border.

### Buttons

- **Primary**: accent ground, graphite ink, 2px border, `press-sm` shadow.
  Hover to `primary-hover`; press sinks it.
- **Secondary**: panel ground, same border and shadow. It does not invert on
  hover — Signal's inversion flourish is retired; the press is the flourish.
- **Ghost/link**: borderless, shadowless, `primary-text` for links.
- **Destructive**: `error` fill with `on-status` ink, same chrome as primary.

### Chips (the index category filter)

Bordered pills with `press-sm` shadows — they read as keyboard keys. The
active chip inverts to `on-surface` (ink chip on paper, cream chip on
espresso) with the page ground as its text — the theme's strongest
contrast, which the demoted taupe rule no longer provides in dark. Counts ride inside the chip in
`on-surface-dim`.

### Badges

Category badges are solid `category-fill-*` blocks with `#17150f` ink, a 2px
`rule` border and `rounded.sm`, at `label-caps-sm`. Status badges are the
status hue on its own `*-subtle` tint (hairline border, no shadow), plus the
literal word. The quiet default badge stays: hairline outline, category
*text* hue, `data-sm` — for record types, counts and keys.

### Loading, error and empty

A loading state is a `panel` with the message at `body-md` and a mono
progress line. An error is a `panel` with its border swapped to `error` and
the word ERROR at `label-caps`. Empty states keep their copy and take
`on-surface-muted`.

## Iconography

One library for everything: **Lucide**, stroke-based on the 24px grid with a
2px `currentColor` stroke — the same weight as the structural border, so an
icon is drawn with the same pen as the panel it sits in. Per-tool glyphs are
vendored in `src/shell/icons.mjs` (one drawing, rendered by both the Astro
`ToolIcon` and the React `ui/tool-icon.jsx`), keyed by kebab-cased Lucide
names from the manifests; generic UI glyphs come from lucide-react directly.
The filled Material set is retired — solid slabs fought the stroke language.

In a tool tile the glyph sits in a `category-fill` icon tile at 20px with
`on-category-fill` ink; beside a tool-page `h1` it renders at 30px in the
category *text* hue, no tile.

## Motion

Snappy and physical, still minimal: hover and ground changes at
`90–140ms ease-out`; the press (translate + shadow removal) is instant on
`:active`. No entrance animations, no ambient motion, no parallax, no glow.
`prefers-reduced-motion` removes the hover translate and keeps the shadow
change, which conveys the same state without movement.

## Accessibility

The CI floors are enforced by `src/styles/tokens.contrast.test.js` against
the real stylesheet, in both themes:

1. `primary` is validated only as a **fill** (with `on-primary`), never as
   text. The text role is `primary-text` / `primary-text-light`, which also
   backs the focus ring.
2. `category-fill-*` is validated against `on-category-fill` (`#17150f`);
   `category-*` is validated as text against all three grounds.
3. `on-status` is validated against each solid status fill.
4. `on-footer` / `on-footer-muted` are validated against `footer`.
5. `on-surface-dim` is validated at **3:1**, and is documented above as a
   non-text role.
6. `nav-active` is a fourth ground for `primary-text` and `on-surface`.
7. The 2px `rule` border and `outline-strong` are validated at 3:1 as
   component boundaries (WCAG 1.4.11).

`category-accent.test.js` keeps guarding the "no action colour in a text
slot" rule in both directions.

## Do's and Don'ts

### Do

- Draw every panel, control and badge with the 2px `rule` border.
- Reserve the offset shadow for pressables (and the one emphasis panel);
  sink the element on press.
- Put category hues in badges, icon tiles and small labels; put the accent
  on actions.
- Set data in Space Mono and headings in Bricolage at 700+.
- Keep tables, rows and inputs shadow-free so dense tools stay quiet.

### Don't

- Add blur, gradients, translucency, grey shadows or glows anywhere.
- Fill anything large with a category hue, or put one on a control.
- Use `#6ee787` as text or as the focus ring on the light ground.
- Give a rounded region no border, or a border no radius.
- Stack `press-lg` panels, or shadow a panel at rest.
- Letterspace headings positively, or set them below 700 weight.
- Hand-edit `src/styles/tokens.generated.css`, or a hex in `globals.css` —
  change this file and run `pnpm generate:tokens`.

---
version: datasheet-1
name: russ.tools
description: >-
  Datasheet: a flat, ruled, typographic interface language. Structure comes
  from a 1px rule and white space rather than from boxes and shadows. The
  site header and the head of every page sit on one deep ink-green band; the
  working area below is plain paper with ruled rows. One green accent does
  every action. IBM Plex Sans reads, IBM Plex Mono carries data.

# ---------------------------------------------------------------------------
# COLOURS
# Two themes only: the alternate palettes stay retired.
#
# Every value here is measured by src/styles/tokens.contrast.test.js. The
# binding constraint is the light theme: a category or status hue used as
# TEXT must clear 4.5:1 on the inset ground (#f4f6f3), which is why the
# light text hues are so much deeper than the fills.
# ---------------------------------------------------------------------------
colors:
  # ---- Ink dark (peer values, unsuffixed because dark stays the CSS
  #      default theme). A green-black page with panels one step lighter. ----
  surface: "#0c1410"
  surface-raised: "#121c17"
  surface-inset: "#18251e"
  outline: "#223229"
  outline-strong: "#6c8577"
  rule: "#5f7a6b"
  on-surface: "#eef4ef"
  on-surface-muted: "#b4c3b9"
  on-surface-faint: "#9bada1"
  on-surface-dim: "#7b8f83"
  primary: "#6ee787"
  primary-hover: "#8bf09e"
  on-primary: "#0b1f16"
  nav-active: "#18251e"
  footer: "#080e0b"
  success: "#6ee787"
  warning: "#ffc857"
  error: "#ff6b6b"
  info: "#5aa7ff"
  success-subtle: "#17301f"
  warning-subtle: "#332b17"
  info-subtle: "#17263a"
  error-subtle: "#3a1d1b"
  category-network: "#2dd4bf"
  category-azure: "#5aa7ff"
  category-microsoft: "#b393ff"
  category-security: "#ffc857"
  category-developer: "#ff9f43"
  category-content: "#ff7eb6"

  # ---- Paper light (white; `-light` suffix) ----
  surface-light: "#ffffff"
  surface-raised-light: "#ffffff"
  surface-inset-light: "#f4f6f3"
  outline-light: "#d7dcd6"
  outline-strong-light: "#788379"
  rule-light: "#869088"
  on-surface-light: "#111411"
  on-surface-muted-light: "#454d46"
  on-surface-faint-light: "#566056"
  on-surface-dim-light: "#6b756c"
  primary-light: "#0b6b43"
  primary-hover-light: "#095a38"
  on-primary-light: "#ffffff"
  nav-active-light: "#f4f6f3"
  footer-light: "#f4f6f3"
  success-light: "#14793a"
  warning-light: "#975c07"
  error-light: "#ce2121"
  info-light: "#1e5eea"
  success-subtle-light: "#e2efe0"
  warning-subtle-light: "#f4ead6"
  info-subtle-light: "#e4eafb"
  error-subtle-light: "#f8e6e0"
  category-network-light: "#0e766b"
  category-azure-light: "#1e5eea"
  category-microsoft-light: "#7c3aed"
  category-security-light: "#975c07"
  category-developer-light: "#9c5205"
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
  on-category-fill: "#111411"

  # ---- Accent as TEXT -----------------------------------------------------
  # Dark mode uses the mint for fills and text alike. Light mode's accent is
  # a deep green that clears 4.5:1 on paper, so fill and text share a value.
  primary-text: "#6ee787"
  primary-text-light: "#0b6b43"

  # ---- Ink on a solid status fill -----------------------------------------
  # The status hues are bright in dark mode and deep in light mode, so their
  # ink flips with them.
  on-status: "#111411"
  on-status-light: "#ffffff"

  # ---- The lip -------------------------------------------------------------
  # The colour of the 1px lip that is all that remains of the press shadow —
  # a hairline tint in light, a step darker than the page in dark.
  shadow-ink: "#070c09"
  shadow-ink-light: "#d7dcd6"

  # ---- Ink on the footer ---------------------------------------------------
  on-footer: "#eef4ef"
  on-footer-muted: "#a9b9ae"
  on-footer-light: "#111411"
  on-footer-muted-light: "#566056"

  # ---- The ink band -------------------------------------------------------
  # The site header and the head of every page sit on one deep ink-green
  # band, identical in both themes. `accent-bright` is the mint that acts on
  # it: the light theme's `primary` is a deep green and would vanish there.
  band: "#0b1f16"
  band-raised: "#12301f"
  band-outline: "#2e6b48"
  on-band: "#ffffff"
  on-band-muted: "#c5d8cc"
  accent-bright: "#6ee787"
  on-accent-bright: "#0b1f16"

# ---------------------------------------------------------------------------
# TYPOGRAPHY
# One superfamily: IBM Plex Sans for everything that is read, IBM Plex Mono
# for data and small uppercase labels. Headings are medium weight, set tight.
#
# Step names are load-bearing in five other places — scripts/generate-tokens.mjs
# (LINE_HEIGHTS), src/lib/utils.js (TYPE_SCALE), src/lib/utils.test.js (STEPS),
# eslint.config.js (the off-scale message) and tokens.contrast.test.js. Adding
# or renaming a step, or changing a line-height, means editing them.
# ---------------------------------------------------------------------------
typography:
  display:
    fontFamily: IBM Plex Sans
    fontSize: 56px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 40px
    fontWeight: 500
    lineHeight: 1.05
    letterSpacing: -0.025em
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: -0.015em
  title-sm:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: -0.005em
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.45
  label-caps:
    fontFamily: IBM Plex Sans
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.06em
  label-caps-sm:
    fontFamily: IBM Plex Sans
    fontSize: 10px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.06em
  data-xl:
    fontFamily: IBM Plex Mono
    fontSize: 30px
    fontWeight: 500
    lineHeight: 1.2
  data-lg:
    fontFamily: IBM Plex Mono
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.4
  data-md:
    fontFamily: IBM Plex Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  data-sm:
    fontFamily: IBM Plex Mono
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.4
  # The grade / hero numeral. Sans, not mono — it is a verdict.
  verdict:
    fontFamily: IBM Plex Sans
    fontSize: 96px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: -0.04em

# ---------------------------------------------------------------------------
# SHAPE — small radii. A radius softens a corner; it never makes a pill
# except `full`, which is for filter chips, the toggle knob and status dots.
# ---------------------------------------------------------------------------
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
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
  control: 1px
  structural: 1px

# Datasheet is flat. What is left of the press shadow is a 1–2px lip straight
# down, in `shadow-ink`, on the few components still classed against these
# names. Overlays (dialog, select menu, toast) use a soft drop shadow instead.
shadow:
  press-sm: 0px 1px 0
  press: 0px 1px 0
  press-lg: 0px 2px 0

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
  site-header:
    backgroundColor: "{colors.band}"
    textColor: "{colors.on-band}"
  nav-item:
    typography: "{typography.body-md}"
    textColor: "{colors.on-band-muted}"
  nav-item-active:
    textColor: "{colors.on-band}"
    borderBottomColor: "{colors.accent-bright}"
    borderBottomWidth: 2px
  band:
    backgroundColor: "{colors.band}"
    textColor: "{colors.on-band}"
  paste-panel:
    backgroundColor: "{colors.band-raised}"
    borderColor: "{colors.band-outline}"
    borderWidth: 1px
    rounded: "{rounded.lg}"
  button-on-band:
    backgroundColor: "{colors.accent-bright}"
    textColor: "{colors.on-accent-bright}"
    rounded: "{rounded.md}"
  tool-row:
    borderBottomColor: "{colors.outline}"
    borderBottomWidth: 1px
    padding: 14px 10px
  tool-row-hover:
    backgroundColor: "{colors.surface-inset}"
  section-head:
    borderBottomColor: "{colors.on-surface}"
    borderBottomWidth: 1px
  panel:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.rule}"
    borderWidth: 1px
    rounded: "{rounded.lg}"
  panel-emphasis:
    borderColor: "{colors.on-surface}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    borderColor: "{colors.outline-strong}"
    borderWidth: 1px
    rounded: "{rounded.md}"
  input:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.outline-strong}"
    borderWidth: 1px
    typography: "{typography.data-md}"
    rounded: "{rounded.md}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    borderColor: "{colors.outline}"
    borderWidth: 1px
    rounded: "{rounded.full}"
  chip-active:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.surface}"
  badge-category:
    backgroundColor: "{colors.category-fill-network}"
    textColor: "{colors.on-category-fill}"
    typography: "{typography.label-caps-sm}"
    rounded: "{rounded.sm}"

motion:
  duration-fast: 90ms
  duration-base: 140ms
  duration-settle: 240ms
  easing: ease-out
---

# russ.tools Design System — Datasheet

Datasheet replaced Stacks in November 2026. The token **names** survived so that
no component had to be re-classed; nearly every value changed. This file is the
single source of truth for colour, type, layout, shape and components. The YAML
above is machine-read (`pnpm generate:tokens`); this prose is the rationale.

## Overview

The site is a set of working tools, and it should look like the documentation
for a piece of equipment: quiet, ruled, exact. Three ideas carry it.

1. **A rule, not a box.** Structure is a 1px line and white space. Panels have
   a hairline edge and no shadow. The catalogue is ruled rows, not cards.
2. **One ink band.** The site header and the head of every page share a deep
   ink-green ground with a faint 40px grid. It is the only dark, textured
   surface, and it is the same in both themes.
3. **One accent, and it acts.** Green marks what can be pressed. It is mint on
   the band and in dark mode, and a deep green on paper.

Nothing on a page sells the site to someone already using it: no taglines, no
stat strips, no feature claims. A heading says what the page is.

## Colors

- **Grounds.** Light is white (`surface`), with `surface-inset` (#f4f6f3) for
  wells, table headers and hover. Dark is a green-black page with panels one
  step lighter.
- **Rules.** `outline` is the decorative hairline between peers. `rule` is the
  structural edge of a panel and clears 3:1 on its ground. `outline-strong` is
  the boundary of a form control and clears 3:1 everywhere. Section heads close
  with a 1px rule in `on-surface`.
- **Accent.** `primary` is the fill for buttons, toggles and sliders;
  `primary-text` is the same role as text, links and the focus ring. On the
  band use `accent-bright` and `on-accent-bright` instead: the light theme's
  `primary` is a deep green and disappears there.
- **Band.** `band`, `band-raised`, `band-outline`, `on-band`, `on-band-muted`.
  These do not change with the theme.
- **Category hues.** The six `category-*` text hues and `category-fill-*`
  blocks still exist and still label badges and record types **inside** tools
  through `--cat` / `--cat-fill`. The shell no longer draws them: the catalogue
  and the tool header are green only. The two slots remain non-interchangeable.
- **Status.** `success`, `warning`, `error`, `info`, each with a `-subtle` tint
  and `on-status` ink.

Every pair is measured in `src/styles/tokens.contrast.test.js`. Do not hand-edit
a hex in CSS; change it here and regenerate.

## Typography

IBM Plex Sans for everything that is read; IBM Plex Mono for data, paths,
counts and the small uppercase labels on the band. Both are self-hosted.
Headings are weight 500 with tight tracking — never bold display type. One
class applies one step: `text-title-sm` carries its own weight, line-height and
tracking.

## Layout

A 1200px column with a 32px gutter. The band is full-bleed; its content sits in
the same column. Tool pages are one full-width column under the band; a tool
composes its own body. The two-column control/result split stays withdrawn.

The index is five sections (Network, Microsoft & Azure, Security, Developer,
Content). Each is headed by its group glyph on an ink tile, the name and a
count, over an ink rule, with the tools beneath as ruled rows in two columns.
Sections are never numbered.

## Elevation & Depth

Flat. No offset shadows. Overlays that float above the page — dialog, select
menu, toast — take a soft drop shadow, because they do float. The `press-*`
shadow names survive as a 1–2px lip for the components still classed against
them.

## Shapes

Radii are 4 / 6 / 8 / 12px: badge, control, panel, sheet. `full` is for filter
chips, the toggle knob and status dots. Borders are 1px.

## Iconography

Tool and group glyphs are **custom-drawn** in `src/shell/icons.mjs`: a 24px
grid, square-cornered boxes, circles and straight strokes with round caps, at a
1.75px `currentColor` line. One drawing serves the Astro `ToolIcon` and the
React `ui/tool-icon.jsx`. Two tools never share a glyph. In a catalogue row the
glyph sits on a soft accent tile that fills on hover; at the head of a tool
page it sits on the bright accent. Generic interface glyphs inside tools come
from lucide-react; `react-icons` is for brand marks only.

## Motion

Motion says that something arrived or that something can be pressed.

- **Arriving.** `.rt-rise`: 14px and opacity over 600ms, staggered by `--rt-i`
  and capped. Used by the head of each page and the index sections.
  `.rt-enter-surface` / `.rt-enter-content` give tool panels a shorter 8px
  rise on mount. Table rows do not animate.
- **The index illustration** draws its connectors in order, once.
- **The paste box** steps through one example at a time while empty.
- **Pressable.** A catalogue row tints, fills its tile and slides in an arrow.
  Buttons sink 1px on `:active`.
- **Refiltering** uses view transitions so surviving rows travel.

Everything is disabled or collapsed under `prefers-reduced-motion`.

## Components

`src/components/ui/` is the design surface — change the component, not the call
site. `src/styles/shell.css` holds the shell (header, band, catalogue, tool
head, footer) and its classes are `rt-`-prefixed.

## Do's and Don'ts

- Do use semantic tokens. Raw Tailwind palette classes are an ESLint error.
- Do put anything that sits on the band in band tokens.
- Don't add a shadow to make something look pressable; use the accent.
- Don't number sections, and don't add marketing copy to a page head.
- Don't fill a large area with a category hue.

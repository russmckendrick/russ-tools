---
version: alpha
name: russ.tools
description: >-
  Dark-first interface for a collection of client-side developer and cloud
  utilities. Panelled, information-dense, quiet. Six tool categories each carry
  a fixed hue used as a functional code, never as decoration.

colors:
  # ---- Dark theme (primary) ----
  surface: "#0d0f12"
  surface-raised: "#14171c"
  surface-inset: "#191d23"
  outline: "#23282f"
  outline-strong: "#616a76"
  on-surface: "#e7eaee"
  on-surface-muted: "#98a1ab"
  on-surface-faint: "#7d858f"
  primary: "#7d94ff"
  on-primary: "#0d0f12"
  success: "#4ade80"
  warning: "#fbbf24"
  error: "#f87171"
  info: "#60a5fa"
  category-network: "#2dd4bf"
  category-azure: "#60a5fa"
  category-microsoft: "#a78bfa"
  category-security: "#fbbf24"
  category-developer: "#4ade80"
  category-content: "#f472b6"

  # ---- Light theme (peer; `-light` suffix) ----
  surface-light: "#fafafb"
  surface-raised-light: "#ffffff"
  surface-inset-light: "#f6f7f9"
  outline-light: "#e5e8ec"
  outline-strong-light: "#838a94"
  on-surface-light: "#14171a"
  on-surface-muted-light: "#5a636d"
  on-surface-faint-light: "#69717b"
  primary-light: "#3b5bdb"
  on-primary-light: "#ffffff"
  success-light: "#15803d"
  warning-light: "#b45309"
  error-light: "#dc2626"
  info-light: "#2563eb"
  category-network-light: "#0f766e"
  category-azure-light: "#2563eb"
  category-microsoft-light: "#7c3aed"
  category-security-light: "#b45309"
  category-developer-light: "#15803d"
  category-content-light: "#be1a63"

typography:
  display:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: 660
    lineHeight: 1.06
    letterSpacing: -0.035em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: 650
    lineHeight: 1.12
    letterSpacing: -0.032em
  headline-md:
    fontFamily: Inter
    fontSize: 21px
    fontWeight: 640
    lineHeight: 1.2
    letterSpacing: -0.025em
  title-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: -0.006em
  body-sm:
    fontFamily: Inter
    fontSize: 13.5px
    fontWeight: 400
    lineHeight: 1.45
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 10.5px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.12em
  data-md:
    fontFamily: JetBrains Mono
    fontSize: 12.5px
    fontWeight: 400
    lineHeight: 1.5
  data-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.4

rounded:
  sm: 6px
  md: 8px
  lg: 10px
  xl: 12px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  gutter: 22px
  max-width: 1120px

components:
  panel:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.outline}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  panel-header:
    backgroundColor: "{colors.surface-inset}"
    textColor: "{colors.on-surface-faint}"
    typography: "{typography.label-caps}"
    padding: "{spacing.md}"
  card:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.outline}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  card-hover:
    borderColor: "{colors.category-network}"
  icon-tile:
    rounded: "{rounded.md}"
    size: 32px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: 8px 13px
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    borderColor: "{colors.outline-strong}"
    rounded: "{rounded.sm}"
    padding: 8px 13px
  input:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.outline-strong}"
    textColor: "{colors.on-surface}"
    typography: "{typography.data-md}"
    rounded: "{rounded.sm}"
    padding: 8px 11px
  chip:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface-muted}"
    borderColor: "{colors.outline}"
    rounded: "{rounded.sm}"
    padding: 7px 12px
  chip-active:
    backgroundColor: "{colors.surface-inset}"
    textColor: "{colors.on-surface}"
  badge:
    backgroundColor: "{colors.surface-inset}"
    textColor: "{colors.on-surface-muted}"
    borderColor: "{colors.outline}"
    typography: "{typography.data-sm}"
    rounded: "{rounded.sm}"
    padding: 2px 8px
  toast:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.outline}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  table-row:
    typography: "{typography.data-md}"
    padding: 7px 13px
---

# russ.tools Design System

## Overview

russ.tools is a collection of fifteen small utilities for people who work with
networks, cloud platforms and certificates — subnet planning, DNS and WHOIS
lookups, Azure naming, JWTs, encoders and converters. Every one of them runs
entirely in the browser; nothing the user pastes is uploaded or stored
off-device. That privacy guarantee is the product's single most important
claim, and the interface should feel like a local instrument rather than a
web service.

The tone is **quiet, dense and engineered**. It borrows structure from
monitoring consoles — panels, hairline borders, tabular data, information
visible without interaction — and restraint from modern product UI: near-black
grounds, a single ambient wash, tight letter-spacing, generous but purposeful
space. Nothing decorative. Every colour and rule encodes something true about
the content.

Nothing on a page is there to sell the page. There is no hero, no statistic
that is really a slogan, and no capability pill restating what the tool
plainly is. A visitor arrived to use a tool; anything above that tool which
is not navigation is in the way.

Dark is the primary target and where the design is at its best. Light is a
designed peer with its own values, not an inversion of the dark theme.

The failure mode to design against is the one this site had before: fifteen
tools rendered identically in a single hue, with a page full of unlabelled
icons and empty space. **A user should be able to tell any two tools apart at a
glance, and should never have to hover to find out what something is.**

## Colors

The palette is a cool near-black neutral ramp with a blue-violet house accent,
plus six fixed category hues.

**Neutrals** carry almost the whole interface. They are cool and very slightly
blue, chosen to sit under the accent rather than being a default grey.

- **Surface** (`#0d0f12`): the page ground.
- **Surface raised** (`#14171c`): panels and cards, lifted off the page.
- **Surface inset** (`#191d23`): panel headers, pressed states, zebra striping.
- **Outline** (`#23282f`): hairline separators and card borders — decorative.
- **Outline strong** (`#616a76`): input and control boundaries, which must be
  perceivable and therefore clear 3:1 against their surface.
- **On-surface** (`#e7eaee` / muted `#98a1ab` / faint `#7d858f`): a three-step
  text ramp. Faint is the floor and is still legible; it is not a decorative grey.

**Primary** (`#7d94ff`) is the house accent, used for the wordmark, focus rings
and the ambient wash behind the header. It is deliberately *not* used on tool
cards, because that job belongs to the category hues.

**Category hues** are a functional code, assigned once per category and never
reused for anything else:

| Category | Dark | Light |
|---|---|---|
| Network | `#2dd4bf` teal | `#0f766e` |
| Azure | `#60a5fa` blue | `#2563eb` |
| Microsoft | `#a78bfa` violet | `#7c3aed` |
| Security | `#fbbf24` amber | `#b45309` |
| Developer | `#4ade80` green | `#15803d` |
| Content | `#f472b6` pink | `#be1a63` |

The hue comes from the tool's `category` field in its manifest, so a new tool
colours itself correctly the moment it declares one. A tool never picks its own
colour.

**Status colours** (`success`, `warning`, `error`, `info`) are separate from
both the accent and the category hues, and are the only colours permitted to
express state. Category green and status green share a value by coincidence of
palette, not by meaning — do not substitute one for the other.

**Light theme.** Every token has a `-light` counterpart in the front matter.
The light values are independently chosen, not lightened versions: the category
hues in particular are considerably darker, because the bright dark-theme
values fall to around 3.5:1 on white and are unusable as text.

## Typography

Two families, with strictly separated jobs.

- **Inter** carries all prose and UI — headings, descriptions, labels, buttons.
  It is self-hosted (`@fontsource-variable/inter`), never loaded from a font
  CDN, because a third-party font request on first paint would contradict the
  site's privacy claim.
- **JetBrains Mono** is reserved for **data only**: DNS records, CIDR blocks,
  tokens, hashes, file paths, counts and uppercase meta labels. If a user might
  compare it character by character, or copy it, it is monospace. Prose is never
  monospace.

Headings run tight — display sits at `-0.035em` — which is what gives the
interface its compact, engineered feel. Body text loosens to near-normal for
readability. Weights stay in the 400–660 range; there is no light weight and no
black weight.

There is **no serif anywhere** in this system.

Numerals in any column, table or statistic use `tabular-nums` so digits align.

## Layout

A single centred column, `max-width: 1120px`, with a `22px` gutter. The
interface is a stack of full-width sections rather than a sidebar shell.

Spacing follows a 4px base scale (`4 / 8 / 12 / 16 / 24 / 32 / 48`). Card
padding is `16px`, grid gaps are `12px`, and space between category groups is
`24px`.

Tool cards sit in a responsive grid: one column below 600px, two to 940px,
three above. Cards are uniform — no featured or double-width tiles — because
every tool is equally reachable and hierarchy here would be a lie.

Tools are always grouped by category, each group introduced by a coloured label,
a hairline rule and a count. Category filter chips sit above the grid.

On a tool page the body splits into a `320px` control column and a fluid result
column above 820px, stacking below it. Controls left, output right, always.

Density is deliberate: aim for the whole tool index to be visible in roughly one
and a half screens. **Empty vertical space below the content is a bug**, not
breathing room.

## Elevation & Depth

Depth is tonal, not cast. There are no drop shadows on resting elements.

Three flat layers do the work: page (`surface`), panel (`surface-raised`),
inset (`surface-inset`), each separated by a 1px `outline` hairline. A card
additionally carries a `inset 0 1px 0 rgba(255,255,255,.05)` top highlight,
which reads as a lit top edge and is the main thing that stops the dark theme
looking flat.

The only cast shadow appears on hover, and it is a **category-tinted glow**
rather than a neutral drop shadow:
`0 6px 22px -12px <category hue at 60%>`, paired with a 1px lift. This is the
single piece of ornament in the system; it must not be extended to other states.

One ambient element exists: a broad radial wash of the primary accent at ~13%
behind the top of the page, fading out by 62%. It sets the mood and must stay
low enough that it never competes with content.

## Shapes

The shape language is rectangular and lightly softened — engineered, not
friendly.

- `6px` (`sm`) — controls: buttons, inputs and chips.
- `8px` (`md`) — icon tiles.
- `10px` (`lg`) — cards and panels.
- `12px` (`xl`) — the outermost application frame.
- `9999px` (`full`) — only status dots and category markers.

Radii nest: a container is always at least as round as anything inside it.
Nothing in the interface is fully square, and nothing except a status dot is
fully round.

Borders are always exactly `1px`. There are no thick borders and no double rules.

## Components

- **Card** — the tool tile, and the workhorse. A 32px category-tinted icon
  tile, the tool name at `title-sm`, a two-line clamped description at
  `body-sm`, then a hairline-separated footer of monospace metadata. On hover
  the border takes the category hue, the card lifts 1px and the category glow
  appears; the route path fades in on the right. Never more than two lines of
  description — clamp rather than reflow, so the grid stays even.
- **Icon tile** — the icon in its category hue on a 13% tint of the same hue,
  with a 26% border. This is the only place a category hue is used as a fill.
- **Panel** — a bordered container with an optional header bar in
  `surface-inset` carrying a `label-caps` title and an optional right-aligned
  status. Used for both inputs and results on tool pages.
- **Button, primary** — a solid fill with a subtle top highlight.
  **In the dark theme the label is near-black** (`on-primary`), not white:
  white on any of these accents lands near 2:1 and is unreadable. In the light
  theme the label is white. When a primary button belongs to a tool, it takes
  that tool's category hue rather than the house accent.
- **Button, secondary** — `outline-strong` border on the raised surface.
- **Input** — `outline-strong` border on the page ground, monospace content,
  `6px` radius. Inputs sit *darker* than their panel, not lighter.
- **Chip** — the category filter. Carries a small hue dot; the active chip
  moves to `surface-inset` with a hue-tinted border.
- **Tool header** — breadcrumb, then a category-tinted icon beside the `h1`,
  then one factual sentence. Three lines, and nothing else: no capability
  pills, no route-pattern badge, no blurb. The long `description` in a
  manifest is written for a search snippet and belongs in `<meta>`, not on
  the page; the page renders `shortDescription`.
- **Badge** — a small monospace marker for a record type, a grade, a count or
  a state: data *about* the content, rendered as data. Not to be confused
  with the capability pills that used to sit under a tool title — those
  restated what the tool plainly was and are gone. A badge always labels
  something concrete on the page. The default takes the category hue as a
  13% tint; status variants are the only ones expressing state.
- **Tabs** — a segmented control on `surface-inset` inside the `outline`
  hairline; the active segment lifts to `surface-raised` and takes the card's
  top highlight. Never a full-width row of underlined links.
- **Select** — the Input contract exactly: same ground, same `outline-strong`
  boundary, same monospace. A closed select and a text input must be
  indistinguishable apart from the chevron, because they are the same kind of
  thing. The menu is a panel; group labels are `label-caps`.
- **Dialog** — a panel that happens to float: `surface-raised`, `outline`
  hairline, 10px radius, over a `surface/80` scrim. The only place a cast
  shadow is allowed other than card hover.
- **Tooltip** — an inset chip in `surface-inset` with a hairline. Never a
  filled accent block; an accent fill here reads as a status it does not have.
- **Toast** — the panel again, bottom-right, with the status colour on the
  icon only. Every tool notifies through the same component; a tool never
  configures its own toaster.
- **Help** — one affordance, everywhere: a secondary icon button carrying the
  same glyph in the same place, opening a Dialog. A tool supplies the content
  and nothing else. There were four answers to this question before — two
  bespoke dialogs, a tooltip, and a `helpButton` prop no tool ever passed —
  which is how an interface stops reading as one product.
- **Table row** — monospace, odd rows tinted with `surface-inset`, the type
  column in the category hue. This is how all record-style output is rendered.

**These are shared components, and that is the point.** Every tool renders
through one implementation of each — 48 files use the card, 47 the button —
so the way to change how the interface looks is to change the component, not
to restyle it at a call site. A tool that reaches for its own container, its
own button colour or its own toaster has made the interface less consistent
by exactly one tool.

## Do's and Don'ts

- **Do** derive a tool's colour from its `category` manifest field. **Don't**
  let a tool hardcode a colour, and don't reuse a category hue for anything
  other than that category.
- **Do** use monospace for data and Inter for prose. **Don't** set descriptions,
  headings or button labels in monospace.
- **Do** use dark labels on filled buttons in the dark theme. **Don't** use
  white — it fails contrast badly on every accent in this palette.
- **Do** give every tool a real one-sentence description, and show it on the
  card. **Don't** ship a tool represented only by an icon and a name.
- **Do** keep the interface dense enough to scan in one or two screens.
  **Don't** pad the page with empty space or decorative full-width sections.
- **Do** let a page open on the thing the visitor came for. **Don't** add a
  hero, a stat tile that is a slogan with a number on it, a capability pill,
  or a sentence describing what the tool below plainly does.
- **Do** keep the hover glow as the only ornament. **Don't** add gradients,
  ambient animation, floating elements or drifting icons.
- **Do** use status colours only for state. **Don't** use them for emphasis or
  variety.
- **Do** use semantic tokens in markup. **Don't** use raw Tailwind palette
  classes such as `bg-green-500` — ESLint blocks these.
- **Do** design light mode with its own values. **Don't** derive it by
  inverting or lightening the dark theme.
- **Do** change a shared component when the interface should change. **Don't**
  override it at a call site — a `className` that re-rounds a card or recolours
  a button is a fifteenth of the design system quietly forking.
- **Do** let the primary action, focus ring, active tab and default badge pick
  up `--cat`, which ToolLayout sets once per page from the manifest. **Don't**
  hardcode a hue in a tool, and don't pass one down as a prop.

## Iconography

Icons are a **bespoke set**, one per tool, drawn on a 24px grid with a `1.6px`
stroke, round caps and round joins, and no fill. They inherit `currentColor` so
the category hue applies automatically.

Each icon depicts what the tool operates on, not a generic abstraction: nested
rectangles for subnet allocation, a three-segment bar for a JWT's header /
payload / signature, a wrapped globe for DNS. Two tools should never share an
icon.

The set is drawn for this project rather than taken from a library, and it is
drawn **once**: `src/shell/icons.mjs` holds the paths, the Astro `ToolIcon`
renders them into prerendered HTML and the React `ToolIcon`
(`src/components/ui/tool-icon.jsx`) renders the same strings inside an island.
Before this, each tool wrapped a third-party glyph, so the icon in the page
header and the icon inside the tool were two different pictures of the same
thing.

Where a generic UI icon is needed (chevron, close, copy, external link), use
**lucide-react**, which is the project's only icon dependency. `@tabler/icons-react`
is being removed and must not be used.

## Accessibility

This section is a hard floor, not an aspiration, and it is enforced by an
automated contrast test that parses the real stylesheet on every `pnpm test`.

- Body and secondary text clear **4.5:1** on every surface it can appear on.
  Measured: `on-surface` 15.90:1 and `on-surface-muted` 7.33:1 on the dark
  ground; 17.25:1 and 5.85:1 on the light ground. Even `on-surface-faint`
  clears 4.5:1, because it is used for small uppercase labels.
- "Every surface" means all three — page, panel **and inset**. Two light values
  were corrected in Phase 2 when they were measured against the inset rather
  than only against white: `on-surface-faint-light` `#6b737d` → `#69717b`
  (4.48:1 on `surface-inset`, now 4.61:1) and `outline-strong-light` `#8b939d`
  → `#838a94` (2.90:1 on `surface-inset` and 2.98:1 on the page, now 3.25:1
  and 3.34:1). The dark values were already clear.
- Every category hue clears **4.5:1 as text** on both the page and a panel, in
  both themes. This is why the light category values are so much darker than
  the dark ones.
- Focus rings and control boundaries clear **3:1**. `outline-strong` exists
  solely to satisfy this for inputs; the decorative `outline` hairline does not
  and is never used as a control boundary.
- Every focusable element has a visible `:focus-visible` ring — 2px, 2px offset,
  in the category hue where one applies, otherwise the house accent.
- All ambient motion and hover transforms are disabled under
  `prefers-reduced-motion: reduce`. Spinners continue, slowed.
- Colour is never the only carrier of meaning. Category is always accompanied by
  a text label and a distinct icon; status is always accompanied by text.

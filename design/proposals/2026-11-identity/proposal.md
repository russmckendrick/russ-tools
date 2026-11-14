# russ.tools identity proposal — November 2026

A new mark, a new colour scheme and the language that ties them together.
Three directions to choose from. Nothing here has been applied: `DESIGN.md`,
`src/`, `public/` and the tests are untouched.

Open `preview.html` first. It shows all three side by side with a light/dark
toggle. `preview-light.png` and `preview-dark.png` are the same page rendered
at 1440px.

| | Mark | Scheme | The idea |
|---|---|---|---|
| **A** | Hex | Copper | The name and the tool in one drawing |
| **B** | Block | Cyanotype | What the tools do: divide one space into parts |
| **C** | Ligature | Iris | The name, set as one continuous rule |

**Recommended: A, Hex / Copper.** Reasoning is in [Recommendation](#recommendation).

---

## What all three keep

Datasheet was chosen on 13 November, steered by the owner, and is pinned by
tests. The complaint it answered ("not professional enough") was about
structure, and the structure is working. So this proposal changes the
identity and leaves the skeleton alone:

- **A rule, not a box.** 1px rules, white space, no offset shadows.
- **One band.** Header and page head on one dark ground with the 40px grid,
  identical in both themes. Everything on it uses band tokens.
- **One accent, and it acts.** Category hues stay unified, as of 13 November.
- **White paper in light, a tinted near-black in dark.** No cream, no
  alternate palettes.
- **IBM Plex Sans and IBM Plex Mono.** Every type step unchanged.
- **Radii 4 / 6 / 8 / 12, 1px borders.** Unchanged, and pinned by
  `tokens.contrast.test.js`.
- **Single-column tool pages, sections without numbers, no marketing copy.**
- **Diagrams by Pele on a piece of the band.** Same geometry; only the
  tokens they read change.
- **Every token name.** Each scheme is a change of values, not of roles.

What changes in every direction:

- The toolbox is retired. It is drawn with the same pen as the 24 tool
  glyphs, so in the header it reads as one more tool, not as the site.
- The wordmark moves from Plex Sans 600 to **Plex Mono**. A hostname is
  data, and `DESIGN.md` already gives data to Mono. The dot keeps the accent
  and takes each mark's own shape.
- The mark is **filled, not stroked**, and heavier than the glyphs. It is the
  one solid thing beside a family of 1.75px outlines.
- Text that today sits just under my floors is lifted (see
  [Contrast](#contrast)).

---

## A — Hex / Copper

**Idea.** A hex key and the bolt it turns. The key is a single bar bent once,
which is also a lowercase r; the bolt is a hexagon standing on the baseline,
which is also the dot of russ.tools. It says the name and the word "tools"
without drawing a toolbox.

**The mark.** Two filled shapes, 15 path commands. The bar is 3.5 units wide
on the 24 grid, exactly twice the glyphs' 1.75 stroke, bent on a 5-unit
centreline radius with both ends cut square. The bolt is a flat-topped
hexagon 7.5 across. On the band the key is white and the bolt copper; on
paper the key is ink and the bolt copper. At 16px the bolt reads as a dot,
which is what it is standing in for.

**The scheme.** A cool graphite band (`#16181b`) with copper (`#f0915a`) as
the only chroma. Copper is what the audience calls a cable, and russet is the
colour the name comes from. Paper stays white with cool neutral greys, so
nothing drifts back toward Stacks' cream.

- Dark: copper is fill and text alike, as mint is today.
- Light: fill and text **split**. The button is bright copper `#d9662b` with
  dark ink `#1c0f07`; links and the focus ring are russet `#a5460f`. This is
  deliberate. `CLAUDE.md` records that a hue deepened to 4.5:1 and used as a
  button fill made "a brown slab" on every security tool; keeping the fill
  bright avoids repeating that.

**What it costs.**

- Copper sits between amber and red. To keep status readable beside it,
  warning moves to an olive-yellow and error to rose. Measured OKLab distance
  from the accent: 0.12 to 0.18 for warning, 0.12 to 0.13 for error. With
  today's amber the light-theme figure would be 0.06, which is too close.
  Status always carries a text label, so this is a matter of comfort, not of
  meaning, but it is the real price of this direction.
- `on-primary-light` flips from white to dark ink, and `primary-light` no
  longer equals `primary-text-light`. Two places in `src` use `text-primary`
  as a text colour and would need `text-primary-text`.
- In dark mode the band and the page are almost the same value (1.06:1), as
  they are today (1.09:1). The band is marked by its grid and rule, not by a
  step in tone.

**History.** The band is within a shade of Signal's graphite `#16171b`, and
Signal was rejected. What was rejected was a whole language: square corners,
3px rules, a bone page, chartreuse. Here graphite is only the band and the
dark page, paper is white, and the structure is Datasheet's. It is still the
closest any direction comes to something already turned down.

---

## B — Block / Cyanotype

**Idea.** One square divided the way a prefix divides: a half, a quarter, an
eighth and two sixteenths, with one block lit. It is the subnet calculator's
divide table and the index illustration reduced to a mark, and it is also the
positioning: one whole made of parts.

**The mark.** Five filled cells separated by 2-unit gaps, so the rules are
the ground showing through, not drawn lines. Only the outer corners are
rounded. 30 path commands. On the band the cells are white and the quarter
sky blue; on paper they are the band blue with a mid-blue quarter
(`#3f86e0`, a mark-only colour that clears 3:1 on white). The 24-grid master
lands on thirds of a pixel at 16px, so there is a separate pixel-fitted
drawing for the favicon, `marks/block-favicon-16.svg`.

**The scheme.** The band becomes a real blue, `#143a80`, the blue of a
cyanotype print. The same value is the light theme's accent, so the band, the
buttons and the links are one colour. Sky blue (`#62c6ff`) acts on the band;
a softer `#7fb6ff` acts in dark mode.

- Diagrams on the band read as blueprints with no further work.
- In dark mode the band separates from the page at 1.79:1. It is the only
  direction where the band is visibly a different surface in both themes.
- Success, warning and error are all well clear of the accent (0.21 or
  more). Info **shares** the accent on purpose, the way success shares it in
  Datasheet today. That is arguably better than now: at present a green
  "valid" badge and a green button are the same colour.
- Structurally the smallest change: fill and text share a value in light,
  white ink on the accent, exactly as Datasheet works today.

**What it costs.**

- The mark is the least distinctive of the three. Any mosaic of rectangles
  sits near the generic layout and dashboard icon, and near the
  `layout-grid` glyph Microsoft Portals already uses.
- `accent-bright` on `band-raised` is the tightest text pair in the whole
  proposal at 4.59:1. A brighter band leaves less room above it.
- Blue plus IBM Plex is the house look of a large part of enterprise
  software. The deep cyanotype value and the grid keep it from being a copy
  of anyone, but it will not surprise.

**History.** A "Blueprint" light theme existed on the old site (August 2025),
and in July 2026 "Blueprint-both-ways" was offered and passed over for
Solarized. That was a blue-tinted page with deep-blue body text on a shadcn
layout. Here the page is white, the text is neutral, and blue is confined to
the band and to things that can be pressed. Different enough to show again,
but the owner has declined blue once.

---

## C — Ligature / Iris

**Idea.** r and t sharing one stroke. The r is a stem and a quarter turn, and
its arm runs on to become the crossbar of the t: one rule carried across two
letters, the way Datasheet carries one rule across a row. Both bends use the
radius of the diagram connectors.

**The mark.** Two filled shapes, 18 path commands, 2.5 units wide with
square-cut ends. The r is ink; the t is lit and sits over the shared bar. It
is the most literal of the three and the thinnest: 1.7px at favicon size,
where it holds but has nothing to spare.

**The scheme.** An indigo-black band (`#1c1538`) with an iris accent,
`#bba8ff` on the band and `#5b3fc4` on paper. Violet is the one region of the
wheel that all four status hues leave empty, so this is the only scheme where
nothing had to give: success, warning and error keep their conventional hues
and sit 0.18 or more from the accent. Info moves from blue to cyan to stay
clear (0.13 to 0.15).

**What it costs.** Violet on near-black is the default look of a great many
developer products. The scheme is the cleanest on paper and the least
particular to this site. The mark is competent but it is a monogram, and
monograms are common.

**History.** None. Neither violet nor a lettered mark has been tried here.

---

## Typography

**Keep IBM Plex Sans and IBM Plex Mono.** They were adopted on 13 November,
they are self-hosted, the family names are pinned in
`tokens.contrast.test.js`, and the step names are load-bearing in five other
files. A sans and a mono cut from one design is exactly what a site that sets
prose beside addresses needs. Signal, Stacks and Datasheet each brought their
own typefaces; a fourth set is not needed to carry a new mark and colour.

One change: the **wordmark is Plex Mono** (weight 600 with Hex, 500 with the
others), tracked in by 0.035em, with the dot drawn as a shape. In the files
under `marks/` the wordmark is converted to outlines from the repo's own
`@fontsource/ibm-plex-mono`, so no lockup depends on an installed font. In
the header it can stay live text.

## Shape, border and the mark's construction

- Radii, border widths, the flat lip and the motion values are unchanged.
- All marks: 24-unit grid, filled paths only, no strokes to keep in step, no
  gradients, no raster. Square-cut ends and true circular arcs.
- A mark is 2 to 2.5 units inset from the edge of its box. Clear space
  around a lockup is the width of the mark's lit shape.
- Two inks at most: the reading colour of the ground, and the accent. The
  one-colour files use `currentColor`.
- Minimum size 16px. Below 24px on an unknown ground, use the tile
  (`*-favicon.svg`), which carries its own band-coloured ground.
- **The motif stays in the mark.** No hexagonal bullets, status dots or
  buttons. The hexagon appears twice: in the mark and as the wordmark's dot.

## The band and diagrams

The band keeps its grid, its rule and its tokens in every direction. What
each scheme does to it:

- **Copper:** neutral graphite, so copper is the only colour on it. Nodes are
  `band-raised` with a grey `band-outline`; connectors and the accented node
  are copper. The quietest band of the three.
- **Cyanotype:** the band is the brand colour. Nodes, grid and connectors
  are all blues, which is what makes a diagram look like a drawing, and less
  like a dark panel.
- **Iris:** as Datasheet today, with violet for green.

`band-outline` is raised to 3:1 against both band grounds in all three. In
Datasheet it measures 2.26 to 2.71, so node and paste-panel edges are
currently below the bar for a boundary. The diagrams gain a visibly firmer
node edge from this.

## Contrast

Calculated by `_work/contrast.mjs` (WCAG 2.x relative luminance) over the 103
pairs listed in `_work/palettes.mjs`: 45 per theme and 13 on the band. Full
tables are in `contrast.md`. All three schemes clear every floor.

| Theme | Pair | Hex | Block | Ligature | Datasheet now | Floor |
|---|---|---:|---:|---:|---:|---:|
| light | on-surface on surface | 18.46 | 18.59 | 18.70 | 18.55 | 4.5 |
| light | on-surface-dim on surface-inset | 4.70 | 4.75 | 5.08 | 4.41 | 4.5 |
| light | primary-text on surface-inset | 5.48 | 9.87 | 6.50 | 6.04 | 4.5 |
| light | on-primary on primary | 5.25 | 10.79 | 7.11 | 6.57 | 4.5 |
| light | primary on surface | 3.57 | 10.79 | 7.11 | 6.57 | 3 |
| light | outline-strong on surface-inset | 3.74 | 3.69 | 4.08 | 3.63 | 3 |
| dark | on-surface on surface | 16.86 | 17.19 | 17.03 | 16.76 | 4.5 |
| dark | on-surface-dim on surface-inset | 5.18 | 5.19 | 5.00 | 4.61 | 4.5 |
| dark | primary-text on surface-inset | 6.87 | 8.55 | 8.14 | 10.17 | 4.5 |
| dark | on-primary on primary | 7.94 | 8.43 | 7.86 | 11.00 | 4.5 |
| dark | outline-strong on surface-inset | 3.81 | 3.86 | 3.78 | 3.98 | 3 |
| band | on-band on band | 17.79 | 10.79 | 17.30 | 17.19 | 4.5 |
| band | on-band-muted on band-raised | 9.74 | 6.32 | 9.73 | 9.58 | 4.5 |
| band | accent-bright on band-raised | 6.69 | 4.59 | 7.31 | 9.16 | 4.5 |
| band | on-accent-bright on accent-bright | 7.94 | 8.49 | 8.78 | 11.00 | 4.5 |
| band | band-outline on band-raised | 3.19 | 3.40 | 3.12 | 2.26 | 3 |

Lowest text pair per theme:

| | light | dark | band |
|---|---|---|---|
| Hex | 4.54 info on info-subtle | 5.18 dim on inset | 6.02 band-error on band-raised |
| Block | 4.59 error on error-subtle | 5.19 dim on inset | 4.59 accent-bright on band-raised |
| Ligature | 4.59 error on error-subtle | 5.00 dim on inset | 6.71 band-error on band-raised |

Two notes on method:

- My list is stricter than the repo's test in two places. It holds
  `on-surface-dim` to 4.5 (the test holds it to 3) and `band-outline` to 3
  (the test does not measure it). The four Datasheet "failures" in
  `contrast.md` are against my floors, not the repo's.
- The mark is measured as a graphic object at 3:1. Lowest is the copper bolt
  on white at 3.57.

## Recommendation

**A, Hex / Copper.**

1. **The mark is the best of the three.** It is the only one that could not
   belong to another site: it says russ, it says tools, and the dot is the
   dot. Block describes the subject and Ligature spells the name; Hex does
   both in two shapes and survives 16px.
2. **The scheme gives the site a colour of its own.** Green on dark is the
   default terminal palette, blue is the default enterprise one, violet the
   default developer-product one. Copper on graphite is none of those, and it
   has reasons to be here.
3. **It is still Datasheet.** Same rules, band, type, radii and token names.
   The change is a set of values and one drawing.
4. **Its cost is known and bounded.** The status hues move and the light
   theme's fill and text split. Both are measured above, both pass, and
   neither touches a frozen contract.

If the shifted warning and error hues are not acceptable, take **B's scheme
with A's mark**. The marks do not depend on their palettes: the strip at the
foot of `preview.html` shows all three on today's green, where any of them
could replace the toolbox with no token change at all. The mark
recommendation is firmer than the colour one.

## Draft front matter for A

Only `version`, `description` and `colors` change. `typography`, `rounded`,
`borderWidth`, `shadow`, `spacing`, `components` and `motion` are
**unchanged from datasheet-1**: `components` refers to colours by token
name, so it follows the new values without an edit. The `colors` block below
is generated by `_work/build-yaml.mjs` from the measured palette, with every
key `DESIGN.md` has today and no new ones.

```yaml
---
version: datasheet-2
name: russ.tools
description: >-
  Datasheet: a flat, ruled, typographic interface language. Structure comes
  from a 1px rule and white space rather than from boxes and shadows. The
  site header and the head of every page sit on one graphite band; the
  working area below is plain paper with ruled rows. One copper accent does
  every action. IBM Plex Sans reads, IBM Plex Mono carries data.

colors:
  # ---- Copper dark (unsuffixed: dark stays the CSS default) ----
  surface: "#0f1113"
  surface-raised: "#16191c"
  surface-inset: "#1d2125"
  outline: "#2a2f34"
  outline-strong: "#727c86"
  rule: "#66707a"
  on-surface: "#f0f2f4"
  on-surface-muted: "#b8bfc6"
  on-surface-faint: "#9fa7af"
  on-surface-dim: "#89939c"
  primary: "#f0915a"
  primary-hover: "#f5a676"
  on-primary: "#1c0f07"
  nav-active: "#1d2125"
  footer: "#0a0c0d"
  success: "#6fd58c"
  warning: "#f2d94e"
  error: "#ff7096"
  info: "#6cb0ff"
  success-subtle: "#16301f"
  warning-subtle: "#332d14"
  info-subtle: "#172840"
  error-subtle: "#3d1c20"
  category-network: "#f0915a"
  category-azure: "#f0915a"
  category-microsoft: "#f0915a"
  category-security: "#f0915a"
  category-developer: "#f0915a"
  category-content: "#f0915a"

  # ---- Copper light (`-light` suffix) ----
  surface-light: "#ffffff"
  surface-raised-light: "#ffffff"
  surface-inset-light: "#f3f4f6"
  outline-light: "#d8dbdf"
  outline-strong-light: "#767e87"
  rule-light: "#848b93"
  on-surface-light: "#121416"
  on-surface-muted-light: "#454b51"
  on-surface-faint-light: "#565d64"
  on-surface-dim-light: "#676e75"
  primary-light: "#d9662b"
  primary-hover-light: "#e2733a"
  on-primary-light: "#1c0f07"
  nav-active-light: "#f3f4f6"
  footer-light: "#f3f4f6"
  success-light: "#14793a"
  warning-light: "#6f6500"
  error-light: "#c2185b"
  info-light: "#1e5eea"
  success-subtle-light: "#e1f0e2"
  warning-subtle-light: "#f3edcf"
  info-subtle-light: "#e4eafb"
  error-subtle-light: "#f9e4e6"
  category-network-light: "#a5460f"
  category-azure-light: "#a5460f"
  category-microsoft-light: "#a5460f"
  category-security-light: "#a5460f"
  category-developer-light: "#a5460f"
  category-content-light: "#a5460f"

  # ---- Category fills: all the bright accent, as today ----
  category-fill-network: "#f0915a"
  category-fill-azure: "#f0915a"
  category-fill-microsoft: "#f0915a"
  category-fill-security: "#f0915a"
  category-fill-developer: "#f0915a"
  category-fill-content: "#f0915a"
  on-category-fill: "#1c0f07"

  # ---- Accent as text ----
  primary-text: "#f0915a"
  primary-text-light: "#a5460f"

  # ---- Ink on a solid status fill ----
  on-status: "#111315"
  on-status-light: "#ffffff"

  # ---- The lip ----
  shadow-ink: "#08090a"
  shadow-ink-light: "#d8dbdf"

  # ---- Ink on the footer ----
  on-footer: "#f0f2f4"
  on-footer-muted: "#a9b1b9"
  on-footer-light: "#121416"
  on-footer-muted-light: "#565d64"

  # ---- The band: identical in both themes ----
  band: "#16181b"
  band-raised: "#202327"
  band-outline: "#69717b"
  on-band: "#ffffff"
  on-band-muted: "#c6ccd2"
  accent-bright: "#f0915a"
  on-accent-bright: "#1c0f07"
  band-warning: "#f2d94e"
  band-error: "#ff7096"

# typography, rounded, borderWidth, shadow, spacing, components, motion:
# unchanged from datasheet-1.
---
```

### Size of the change

| What | Where | Note |
|---|---|---|
| Token values | `DESIGN.md`, then `pnpm generate:tokens` | 0 keys added or removed |
| Light remap | `src/styles/globals.css` | No edit expected: it aliases by `var()`. To be confirmed |
| Accent as text | 2 uses of `text-primary`, 2 of `var(--color-primary)` in `src/styles` | Check each is a fill, or move to `primary-text` |
| The mark | `src/shell/SiteMark.astro` | The wrapper sets `fill="none"` and a stroke; a filled mark needs both changed |
| OG cards | `scripts/generate-og.mjs`, then `pnpm generate:og` | It inlines SiteMark's inner markup; its wrapper and colours need checking |
| Favicon | `public/assets/logo.svg`, `favicon.ico`, three PNGs | Rasters are not produced here |
| Theme colour | `THEME_COLOR` in `src/shell/site.mjs`, `public/site.webmanifest` | `#16181b`; `seo.test.js` follows the constant |
| Wordmark | `.rt-brand` in `src/styles/shell.css` | Family and weight only |
| Prose | `DESIGN.md` Overview and Colors, `CLAUDE.md`'s short version | "Ink-green" and "mint" become graphite and copper |

Not touched: routes, the share codec, localStorage, SEO structure, Workers,
type steps, radii, fonts, component markup.

## Set aside

- **Loop** — a ring leaving and returning to a node, for "nothing leaves the
  browser". Drawn and dropped: at every size it read as a speech bubble, and
  three lookups do leave the browser.
- **Bracketed dot, `[.]`** — crisp at 16px, but it is how the audience
  defangs a malicious domain. The wrong thing to say about your own.
- **`r/`** — reads as a subreddit.
- **An evolved toolbox, or an RJ45 port** — the same silhouette as today.
- **Per-category hues, a two-column tool page, numbered sections, a new
  typeface, cream paper** — all decided against in the Session Log, and
  nothing here gives a reason to reopen them.

## Not verified

- No scheme has been run through `pnpm generate:tokens` or
  `src/styles/tokens.contrast.test.js`. That needs an edit to `DESIGN.md`,
  which is out of scope. My pair list was written to cover the test's, but
  the test is the arbiter. In particular I have not read how `globals.css`
  maps the shadcn aliases (`secondary`, `accent`, `muted`).
- The preview is a reduced mock of the shell, not the real components. No
  tool has been seen in any of these schemes.
- Whether the olive warning and rose error read correctly in the real SSL,
  DNSSEC and email tools is a judgement to make on those pages.
- I have checked the marks against the logos I know and found no match. That
  is not a trademark search.
- The 16px check was done in Chromium at 1x and 2x (`_work/zoom.png`). Not
  checked in Safari or Firefox tab strips, or as a raster `.ico`.

## Files

```
proposal.md              this document
preview.html             the three directions side by side, light/dark toggle
preview-light.png        preview.html at 1440px
preview-dark.png
contrast.md              every measured pair, per direction, plus Datasheet
marks/
  {hex,block,ligature}-mark-on-light.svg    two colours, for a white ground
  {hex,block,ligature}-mark-on-dark.svg     two colours, for the band
  {hex,block,ligature}-mark-mono.svg        one colour, currentColor
  {hex,block,ligature}-lockup-on-light.svg  mark + russ.tools, outlined
  {hex,block,ligature}-lockup-on-dark.svg
  {hex,block,ligature}-lockup-mono.svg
  {hex,block,ligature}-favicon.svg          the mark on its own band tile
  block-favicon-16.svg                      Block refitted to the 16px grid
_work/
  palettes.mjs           the palettes and the list of measured pairs (source)
  marks.mjs              the hand-written path data (source)
  contrast.mjs           WCAG ratios and OKLab distances -> contrast.md
  build-marks.mjs        writes marks/, outlines the wordmark
  build-preview.mjs      writes preview.html
  build-yaml.mjs         prints a colors: block for DESIGN.md
  render.mjs             Playwright -> preview-*.png (run from the repo root)
  zoom.mjs, zoom.png     the 16px pixel check
```

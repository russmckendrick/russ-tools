# Design reference

## `approved-direction.html`

The mockup approved on 2026-07-19 (session 3), and the visual reference behind
[`DESIGN.md`](../../DESIGN.md). Open it directly in a browser — it is a single
self-contained file with no build step and no external requests.

It shows two frames:

1. **The tool index** — masthead, stat strip, category filter chips (interactive),
   and the panelled tool grid with per-category colour and bespoke icons.
2. **A tool page** — the same panel system one level down, with the category hue
   carried into the primary button and the record-type column. This is the layout
   `ToolLayout.astro` has to produce from a manifest.

It follows the OS light/dark preference, and dark is the primary target.

**`DESIGN.md` wins where the two disagree.** This file is a hand-built mockup and
carries three known faults that measurement caught afterwards and `DESIGN.md`
corrects:

- filled buttons use white labels, which fall to 1.67–2.72:1 in dark mode
  (`DESIGN.md` mandates near-black labels on accent fills in dark);
- the light-theme teal is `#0d9488`, only 3.74:1 as text (corrected to `#0f766e`);
- it uses one border token where two are needed — decorative `outline` and
  `outline-strong` for control boundaries, which must clear 3:1.

Treat it as the intent, not the specification. It is kept because the composition
— density, hierarchy, panel anatomy, how the six category hues are deployed — is
much easier to see than to read.

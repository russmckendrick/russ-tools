# russ.tools design spec

**Status:** authoritative for the redesign · Phase 1 output, 2026-07-19
**Implements:** [`src/styles/globals.css`](../src/styles/globals.css)
**Enforced by:** [`src/styles/tokens.contrast.test.js`](../src/styles/tokens.contrast.test.js) and the raw-palette lint rule in [`eslint.config.js`](../eslint.config.js)

This supersedes the colour sections of `DESIGN_SYSTEM.md` and `STYLE_GUIDE.md`,
which describe a Mantine-era system that no longer exists.

---

## 1. The decision

**Solarized, in both modes.**

The site previously ran two unrelated design languages: a blue-tinted
"Blueprint" light theme and a Solarized dark theme. They shared no hue, no
neutral ramp and no intent. Phase 1 picks one.

Solarized was chosen over the alternatives (Blueprint-both-ways, neutral slate)
because it is a real, documented palette with a fixed relationship between its
sixteen values — which makes deriving accessible variants a calculation rather
than a taste argument — and because its character suits a set of network and
infrastructure tools.

## 2. Colour

### 2.1 The ramp is the source of truth

All sixteen Solarized values are exposed as `--color-solar-*`. Everything else
is derived from them.

| | light | dark |
|---|---|---|
| page | `base2` `#eee8d5` | `base03` `#002b36` |
| card (lifts off the page) | `base3` `#fdf6e3` | `base02` `#073642` |
| body text | `#4d656d` | `#97a4a3` |
| secondary text | `#526c74` | `#8c9b9b` |

### 2.2 Why the accents are not the Solarized accents

**Raw Solarized accents fail WCAG AA as text on the surfaces this app actually
puts them on.** Measured against the light card (`#fdf6e3`):

| accent | as text | verdict |
|---|---|---|
| green `#859900` | 2.97:1 | fail |
| cyan `#2aa198` | 2.93:1 | fail |
| yellow `#b58900` | 2.98:1 | fail |
| blue `#268bd2` | 3.41:1 | large text only |
| red `#dc322f` | 4.29:1 | large text only |

Dark mode fails in the opposite direction — red, orange, violet and magenta all
land at 2.8–3.0:1 on `base02`.

So each semantic accent is pulled toward `base03` (light) or `base2` (dark)
until it clears **4.5:1 on the page, on a card, and on its own subtle tint**.
The raw ramp remains available as `--color-solar-*` for decoration, where
1.4.11 does not apply.

### 2.3 The status token contract

Four semantic families, three slots each. This is the whole vocabulary — if a
component needs a colour that is not here, the answer is a new token, not a
palette class.

| slot | what it is for |
|---|---|
| `--color-<name>` | text, icons, borders, and solid fills. Readable everywhere. |
| `--color-<name>-foreground` | text placed **on** a solid `--color-<name>` fill |
| `--color-<name>-subtle` | tinted background for alerts, badges, callouts |

Families: `success`, `warning`, `info`, `danger`. Plus the shadcn set
(`background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`,
`accent`, `destructive`, `border`, `input`, `ring`), whose names are kept
verbatim so existing components render unchanged under the new theme.

```jsx
// no
<div className="bg-green-50 border-green-200 text-green-800 dark:bg-green-950">

// yes
<div className="bg-success-subtle border-success text-success">
```

The lint rule blocks the first form. It is a **warning** in
`src/components/tools/**` (505 pre-existing occurrences across 31 files) and an
**error** in `src/components/ui/**` and `src/components/layout/**`. Each tool
flips to error as it is ported.

### 2.4 Focus and controls

`--color-ring` is **mode-specific and must stay that way**. No single blue
clears 3:1 against both a light card and a dark card:

| candidate | light page | light card | dark page | dark card |
|---|---|---|---|---|
| Solarized blue `#268bd2` | 3.00 | 3.41 | 4.08 | 3.53 |
| darkened `#1b6ea3` | 4.50 | 5.12 | 2.72 ✗ | 2.36 ✗ |
| lightened `#4e9ed3` | 2.40 ✗ | 2.72 ✗ | 5.12 | 4.43 |

Light uses `#217fbf`, dark uses `#268bd2`.

`--color-input` is deliberately stronger than `--color-border`: an input outline
is a control boundary and owes 3:1, while a decorative separator does not.

## 3. Typography

Self-hosted **Inter** (`@fontsource-variable/inter`). The previous
`@import url('https://fonts.googleapis.com/…')` meant every visitor's browser
announced itself to Google on first paint, which contradicted the site's own
privacy claim.

Scale is a 1.200 minor third off a 16px base, exposed as `--text-2xs` … `--text-4xl`.

| element | size | weight | tracking |
|---|---|---|---|
| `h1` (one per page) | `--text-2xl` 1.728rem | 600 | -0.02em |
| `h2` | `--text-xl` 1.44rem | 600 | -0.015em |
| `h3` | `--text-lg` 1.2rem | 600 | — |
| body | `--text-base` 1rem | 400 | — |
| secondary / help | `--text-sm` 0.9rem | 400 | — |

Monospace (`--font-mono`) is for code, keys, hashes, IPs and CIDR blocks — any
value the user might compare character by character.

## 4. Tool-page rhythm

Every tool page, without exception:

```
h1  — the tool name. Exactly one per page.
p   — one-sentence description, --text-base, muted-foreground, max-w-2xl
[action slot] — right-aligned on wide viewports, wraps below on narrow
─────
cards — the tool itself, stacked with space-y-6
```

Today this is `ToolHeader`, which will be replaced by `ToolLayout.astro` in
Phase 2 — at which point the h1 and description come from the tool's manifest
and become real prerendered HTML rather than a client-rendered div.

Two things `ToolHeader` does today that should not survive the port:

- It takes an `iconColor` prop that **14 tools pass and it never reads**.
- Its alert slot hardcodes `border-blue-200 bg-blue-50/50 …` — the exact
  pattern §2.3 replaces. It becomes `bg-info-subtle text-info border-info`.

## 5. Motion

Ambient motion (the drifting home-page icon map, floating keycaps, hover float)
is kept — it is part of the site's character — but it now stops completely under
`prefers-reduced-motion: reduce`. Spinners keep animating, slowly, because they
carry meaning.

The reduced-motion block is last in `globals.css` and must stay there so it wins
on specificity ties.

## 6. The accessibility floor

Non-negotiable, and enforced by `tokens.contrast.test.js` on every `pnpm test`:

- Body and secondary text clear **4.5:1** on every surface they can land on.
- Status text clears **4.5:1** on the page, on a card, and on its own subtle tint.
- Focus rings and input outlines clear **3:1** against page and card.
- Labels on solid fills clear **4.5:1** against that fill.
- Every focusable element shows a visible ring (`:focus-visible`, 2px, 2px offset).
- No animation for users who asked for none.

The test parses the real stylesheet rather than a copy, so retuning a colour
without re-checking its contrast fails CI. It caught dark `--color-secondary` at
4.26:1 during Phase 1 itself.

## 7. Open, deferred to later phases

- **Home-page identity** — the current page is a decorative icon map plus
  widget cards. Phase 6 rebuilds it from the tool registry; its visual direction
  is deliberately not fixed here.
- **Spacing density** — `space-y-6` between cards, `gap-4` within them is the de
  facto convention, not yet enforced. Worth a token pass once a few tools are
  ported and the real patterns are visible.
- **Dark-mode elevation** — dark currently distinguishes surfaces by lightness
  alone (`base03` → `base02`). Whether cards also need a border in dark mode is
  a judgement call best made against ported tools.
- **prismjs → shiki** — the KQL grammar is custom; the swap is an optional
  Phase 6 follow-up and would need its own theme mapping onto these tokens.

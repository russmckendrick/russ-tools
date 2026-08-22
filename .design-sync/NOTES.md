# design-sync notes — russ-tools

Repo-specific gotchas for syncing `src/components/ui/` to claude.ai/design.
First sync: 2026-08-15. Project: `1789cdfa-b1da-486d-920f-b82aa476bd36`.

## What this repo is (and isn't)

- This is an **Astro app, not a published component package**. There is no library
  `dist/`, no shipped `.d.ts`, and `node_modules/russ-tools` does not exist. The converter
  therefore needs an explicit `--entry`, and component discovery cannot come from `.d.ts`
  exports — every component is pinned by hand in `cfg.componentSrcMap`.
- **Adding a component to `src/components/ui/` does NOT add it to the sync.** Add it to
  `componentSrcMap` and give it a doc in `.design-sync/docs/<Name>.md` (the frontmatter
  `category:` is what puts it in a group). `gen-entry.mjs` picks the *file* up automatically,
  so its sub-exports reach the bundle, but it gets no card without those two edits.
- Scope is the 23 primaries, one per file. The ~54 compound sub-parts (`CardHeader`,
  `SelectItem`, `DialogFooter`, …) ship in the bundle — 78 exports on `window.RussTools` —
  and are documented in each primary's `.prompt.md`, but deliberately get no cards of their
  own, which would flood the picker with meaningless entries.

## The build sequence

`cfg.buildCmd` is `pnpm build && node .design-sync/prep-css.mjs && node .design-sync/gen-entry.mjs`,
then:

```sh
node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules \
  --entry .design-sync/.cache/entry.jsx --out ./ds-bundle --remote .design-sync/.cache/remote-sync.json
```

- ~~**`pnpm build` currently FAILS on `main`**~~ — **fixed** in the Signal session. It was
  not Astro/`cookie` interop as such: an old npm install had left a real
  `node_modules/cookie@1.0.2` directory that pnpm does not own, and Node resolved that
  orphan ahead of pnpm's copies when importing the built prerender entry from `dist/`.
  `rm -rf node_modules/cookie` fixes it. It can come back with another stray npm install,
  and the symptom is `Named export 'parseCookie' not found` in `generatePages`.
- `prep-css.mjs` exists because Astro's stylesheet name carries a content hash (so a direct
  `cssEntry` into `dist/` rots every build) and its `@font-face` urls are site-absolute
  (`/_astro/…`), which the converter cannot resolve — fonts would silently not ship. It
  copies to a stable `.design-sync/.cache/css/app.css` with relative urls and the woff2s
  beside it.
- **npm is blocked on this machine.** Install converter deps with
  `pnpm i --ignore-workspace esbuild ts-morph @types/react playwright@1.62.1` inside
  `.ds-sync/`. pnpm reports `[ERR_PNPM_IGNORED_BUILDS] esbuild` — ignore it, the binary works.
- `.design-sync/tsconfig.json` exists only to give esbuild the `@/* -> src/*` alias, which
  otherwise lives solely in `astro.config.mjs`'s Vite config where esbuild can't see it. It
  is not a step toward TypeScript.
- Playwright 1.62.1 matches the cached `chromium_headless_shell-1234`. Keep them in step.

## Two sync-owned modules in the bundle

Both are `cfg.extraEntries`, and both are deliberate:

- **`ds-preview-root.jsx`** (`DesignSystemRoot`) — previews mount inside it. Nothing in
  `ui/` sets a theme, so without it previews render in whatever `prefers-color-scheme` the
  screenshot browser has (light, in headless Chromium) on the harness's hardcoded white
  body, and `--cat` is undefined so every category hue silently falls back to the accent.
  It reproduces what `BaseLayout.astro` + `ToolLayout.astro` do around every real component.
- **`ds-toast.js`** (`toast`) — `toaster.jsx` exports the host but not the function that
  raises a toast, so without this the bundle shipped a toaster nothing could put anything in.
  A preview cannot `import { toast } from 'sonner'` itself: a second copy has its own
  observer and the shipped `<Toaster />` never hears it.

## Known render warns (triaged — not new)

- **`[FONT_MISSING] "Instrument Sans"`** — expected and benign. `--font-sans` is
  `"Instrument Sans Variable", "Instrument Sans", system-ui, …`; the *first* family is
  shipped as woff2 subsets, and the bare name is a deliberate fallback for people who have
  it installed locally, so it legitimately has no `@font-face`. The same applies to bare
  `"Red Hat Mono"` in `--font-mono`. Verified visually: previews render in Instrument Sans
  Variable and Red Hat Mono Variable, not a system fallback. Do not "fix" with
  `cfg.extraFonts`.

  (These were Inter and JetBrains Mono before the Signal redesign; if you see the old
  names in a warning, the sync is running against a stale bundle.)

## Preview gotchas worth keeping

- **Overlays** (`Dialog`, `Sheet`, `HelpDialog`, `Tooltip`, `Toaster`) are pinned to
  `cardMode: "single"` in `cfg.overrides` with a `primaryStory`, and are rendered `open`.
  In a plain grid they either escape the cell or collapse to nothing.
- **Toaster** needs three things or it screenshots empty: `<Toaster />` must mount *before*
  `toast()` is called (a `setTimeout(fire, 0)` in an effect placed after the host),
  `duration: Infinity` so sonner doesn't auto-dismiss before capture, and `theme="dark"` —
  the shipped default is `theme="system"`, which follows the **OS**, not the theme class, so
  it renders white cards on the dark ground.
- **`ToolAction`** returns `null` without a provider, so its preview composes
  `ToolActionsProvider` with a real target node held in state.
- **`--cat` is per-item, not per-page**, wherever several categories appear together —
  `ToolCard.astro` sets it on each tile. A grid that sets it once colours every badge the
  same and quietly destroys the category signal. Since Signal there are **two** properties
  to set, not one: `--cat` (the text hue) and `--cat-fill` (the solid badge block). A
  preview that sets only `--cat` renders the `category` badge variant in the raw accent.
- Hover/focus-only states (the `Tooltip` on `HelpHint`, `Button` hover) cannot render
  statically and are not attempted.

## Re-sync risks — what can go stale

- **The shipped CSS is a snapshot of the app's utility usage.** `styles.css` carries only the
  ~440 Tailwind utilities `src/` happens to use. Utilities that are valid Tailwind but unused
  here (`min-h-screen`, `max-w-xl`, `gap-1.5`) emit **nothing** and fail silently in any
  design built with this system. `conventions.md` documents the safe families and the exact
  `gap-*` / `p-*` / `max-w-*` values that exist. **If `src/` stops using a utility, it
  disappears from the next sync's stylesheet** and any design relying on it degrades with no
  error. Worth considering: a small safelist source file so Tailwind emits a stable, wider
  set — that is an app-side change and was not made here.
- **`componentSrcMap` and `.design-sync/docs/` are hand-maintained** and will drift as
  `src/components/ui/` changes. A removed component leaves a stale map entry (build fails
  loudly); an added one is silently absent (no card).
- **`prep-css.mjs` picks the largest `dist/_astro/*.css`.** If the app ever emits a second
  large stylesheet, that heuristic needs revisiting.
- **`DESIGN.md` was rewritten wholesale** by the Signal redesign, so the `.prompt.md`
  bodies transcribed from its Components section are stale until revisited, and any grade
  written against the old look is measuring a design that no longer exists.
- **`DESIGN.md` and `PRODUCT.md` ship as `guidelines/`** and are copied verbatim. The default
  `guidelinesGlob` would have swept `docs/*.md` (ARCHITECTURE, DEPLOYMENT, DEVELOPMENT)
  instead — engineering docs that are noise for a design agent. Keep the explicit glob.
- **Grades are keyed on the authored `.tsx` plus preview-affecting config.** Changing
  `extraEntries` or `overrides` clears every grade written before the change, forcing a full
  re-read of the sheets. Settle config before grading, not after — this cost one full
  re-grade pass on the first sync.
- The `.prompt.md` bodies are transcribed from `DESIGN.md`'s Components section. If that
  section is rewritten, the docs in `.design-sync/docs/` should be revisited.

# AGENTS.md

Guidance for Claude Code when working in this repository.

## ⚠️ Read this first

**This is an Astro static site**: every page is prerendered HTML, with one **React
island** per tool, everything derived from per-tool manifests. The React SPA that
preceded it has been **deleted** — if you find a document describing `src/App.jsx`,
`src/components/tools/`, Vite as the build, or two apps side by side, that document is
stale and the code wins.

The redesign that got here is recorded in
[`docs/plans/redesign-plan.md`](docs/plans/redesign-plan.md) — read it for the *why*
behind decisions, and keep its **Session Log** updated as you go. Note the two-column
control/result split was built, applied to ten tools, rejected as unbalanced and **fully
withdrawn** — see `DESIGN.md`'s Layout section before proposing it again.

**`src/tools/<id>/manifest.mjs` is the contract.** The registry is
`src/tools/registry.mjs` (`import.meta.glob`, Vite-only) with a plain-Node twin
`src/tools/loadManifests.mjs` for build scripts; `registry.test.js` asserts they agree.

**`src/bridge/ToolIsland.jsx` is load-bearing**, despite the plan calling the directory
Phase 2 scaffolding. It mounts every tool and supplies a `BrowserRouter` whose routes come
from the manifest's `params` (so `useParams` works unchanged in the nine tools that call
it) plus the shared `<Toaster/>`. Only `ShellContext` died at cutover.

**The design system is [`DESIGN.md`](DESIGN.md) in the repo root — read it before touching
any styling.** It follows the [Stitch DESIGN.md spec](https://stitch.withgoogle.com/docs/design-md/specification)
(YAML token front matter + prose rationale) and is the single source of truth for colour,
type, layout, shape and components.

Short version — the language is **Stacks** (it replaced Signal in August 2026; the
token *names* survived, every value changed): **chunky rounded** (8/10/14/18px, always
paired with a 2px `rule` border — ink on paper, cream on ink), a hard **offset shadow**
that appears only on pressables and the one `panel-emphasis` per page (`:active` sinks
the element and removes it), **paper light** as the house ground with an **ink dark**
peer and *no other palettes*, one green accent (`#6ee787`) that only ever appears on
something you can press (as text/ring it is `primary-text`, a deep green in light mode),
six candy category hues that label and never fill, **Bricolage Grotesque** for display
and headings, **Space Grotesk** for body and every small label, **Space Mono** for data
and only data. Use semantic tokens, never raw Tailwind palette classes (`bg-green-50`) —
ESLint **errors** on those across `src/tools/` and `src/components/ui/`.

**`src/components/ui/` is the design surface — change the component, not the call site.**
Every tool renders through it (48 files use the card, 47 the button), so it is the one
place a change reaches all fifteen tools at once, and it is now written against DESIGN.md
rather than shadcn's stock values. Notably: the default badge takes `var(--cat)` and the
`category` badge `var(--cat-fill)`, both set once per page by `ToolLayout` from the
manifest's `category` — a tool never names a colour. The focus ring is `--color-ring`,
which resolves to `primary-text` (the accent in dark, a deep green in light);
the raw accent is ~1.6:1 on paper and cannot be a ring or text there. There is one `<Toaster/>`
(`ui/toaster.jsx`, mounted by `ToolIsland`), one help affordance (`ui/help-dialog.jsx`), and
one source for the Material tool icons (`src/shell/icons.mjs`, rendered by the Astro
`ToolIcon` and the React `ui/tool-icon.jsx`).

**Shell CSS classes are `rt-`-prefixed** (`src/styles/shell.css`). They were bare before,
and `.grid` collided with Tailwind's `grid` utility — the shell's rule won, so every
`grid grid-cols-*` inside every tool silently became a 3-column grid. Don't add an
unprefixed class to that file.

### ⚠️ Token names collide with Tailwind's scales — three bugs, one cause

`DESIGN.md` names its steps `xs`…`3xl` and `title-sm`/`body-sm`/`data-md`, which are
**exactly** Tailwind's own container, size and colour scale keys. Tailwind resolves the
collision silently, in Tailwind's favour. All three known cases are fixed and pinned by
tests; the pattern is the thing to remember:

| Collision | Symptom | Fixed in |
|---|---|---|
| `--spacing-lg` vs the *container* scale | `max-w-lg` = 16px, `max-w-3xl` = 48px — every dialog a sliver | `scripts/generate-tokens.mjs` (emits `--rt-space-*`) |
| `--font-title-sm` vs the font **family** namespace | `font-title-sm` set `font-family: "Instrument Sans"` (not the self-hosted `"Instrument Sans Variable"`) → headings fell back to **serif** | same script strips per-step family tokens; each step folds into one `--text-*` carrying weight/line-height/tracking |
| `text-body-sm` looks like a colour to tailwind-merge | `cn()` **deleted** the size class; the scale was in the source, absent from the DOM | `src/lib/utils.js` (`extendTailwindMerge`), pinned by `src/lib/utils.test.js` |

**Fix collisions in the generator or in `cn()`, never by renaming things in `DESIGN.md`.**
And note every one of these failed silently: `pnpm lint` was clean and the classes were in
the files. **Lint proves a class was written; only the rendered DOM proves it was applied** —
check computed styles in a browser.

**One class applies one type step.** `text-title-sm` carries its own weight, line-height and
letter-spacing — never put a `font-*`, `leading-*` or `tracking-*` beside it. Tailwind's
stock sizes (`text-sm`, `text-lg`) are off-scale and ESLint blocks them: **error** in
`src/components/ui/`, **warning** in tools.

**The accent acts; the category labels.** Buttons, toggles, sliders and focus rings are
`primary` in both themes. `--cat` (set once per page by `ToolLayout` from the manifest's
`category`) is for the icon tile, badges, borders, small type and the hover glow — never a
large fill. A category hue must clear 4.5:1 as text, and the amber security hue at 4.5:1 is
brown, so filling a button with it produced a brown slab on every security tool.

**The token layer is generated — do not hand-edit hexes.** `src/styles/tokens.generated.css`
comes from `DESIGN.md` via `pnpm generate:tokens`; `src/styles/globals.css` only switches the
light peers in and aliases the shadcn names the un-ported components use (by `var()` reference,
so the light remap carries through). To change a colour: edit `DESIGN.md`, regenerate, run
`pnpm test`. `tokens.contrast.test.js` fails if the generated file has drifted from `DESIGN.md`,
or if any pair drops below its WCAG floor — it has caught five real contrast faults so far.

> `docs/DESIGN_SPEC.md`, `docs/DESIGN_SYSTEM.md` and `docs/STYLE_GUIDE.md` carried an
> abandoned palette and the Mantine-era component map. All three are **deleted** —
> `DESIGN.md` is the only design authority.

### Trust caveats (this file used to lie — verify before relying)

A prior version of this file misdescribed the codebase. Corrected facts:

- There are **15 tools**. Don't take a count from prose anywhere — the generated tables
  in the READMEs are the only inventory that is checked (`src/tools/docs.test.js`).
- Theming is a **pre-paint inline script** in `BaseLayout.astro` reading `vite-ui-theme`
  from localStorage, plus `src/shell/appearance-controls.js`. There is no React theme
  provider and no `next-themes`. The six alternate palettes and `russ-tools-palette` were
  retired with Signal; the key is deliberately left in localStorage but nothing reads it.
- Routes are **generated from manifests** (`allRoutes()` in `src/tools/registry.mjs` →
  `scripts/generate-redirects.mjs`). The legacy route list is frozen in
  `registry.test.js`.
- `src/utils/_iconImports.js`, `toolsUtils.js`, `cron.js`, `generateSitemap.js`,
  `index.js`, `tldUtils.js`, `api/apiUtils.js`, `sharelink.js`, `seoUtils.js`,
  `toolsConfig.json` and the `regions/` modules **have been deleted** — older docs
  reference them. The sitemap generator is `scripts/generate-sitemap.js`; the share codec
  is `src/core/sharelink.js`; the API client is `src/core/api.js`.
- The azure-kql `*Shadcn` files **have been deleted**; they were a dead parallel
  implementation. The live entry is `AzureKQLTool.jsx`.
- `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/DEPLOYMENT.md` and the workers
  README were regenerated from the code at cutover. Earlier warnings about them being
  Mantine-era no longer apply.

## Package manager & commands

**This project uses `pnpm`** (this machine blocks `npm`; `pnpm@11` + Node ≥20). The
lockfile is `pnpm-lock.yaml`. A stale, gitignored `package-lock.json` may linger — ignore it.

> **If `pnpm build` dies in `generatePages` with `Named export 'parseCookie' not found`**,
> look for a real `node_modules/cookie` directory. An old npm install left `cookie@1.0.2`
> there as a plain folder — pnpm owns neither it nor the two versions it *does* manage
> (1.1.1 for msw, 2.0.1 for astro), and Node resolves the orphan when it imports the built
> prerender entry from `dist/`. `rm -rf node_modules/cookie` fixes it; pnpm restores
> anything it actually owns on the next install. This is environment state, not a repo
> change, so it can come back with another stray npm install.

- `pnpm install` — install deps (esbuild is the one approved build script, see `pnpm.onlyBuiltDependencies`)
- `pnpm generate:tokens` — regenerate the token layer from `DESIGN.md` (needs network once).
  The exporter is **pinned** (`@google/design.md@0.3.0`) because its output shape is not a
  stable contract and an unpinned upgrade would fail the drift test on an untouched file.
  It reads only `colors`, `typography`, `rounded` and `spacing`; `borderWidth`, `shadow`,
  `motion` and `components` are documentation, transcribed by hand into `globals.css`.
- `pnpm test` — Vitest (514 tests; **keep these green**) · `pnpm test:watch` to iterate.
  The count dropped from ~1000 when the palettes were retired: `tokens.contrast.test.js`
  ran its pair list over 12 palette/mode combinations and now runs it over 2. It measures
  *more* roles than before, against fewer themes.
- `pnpm test:e2e` — Playwright deep-link and help matrix (41 tests) against
  `wrangler pages dev`
- `pnpm lint` — ESLint. **0 errors, and CI blocks on that.** 11 warnings remain
  (exhaustive-deps and react-refresh) — the raw-palette and off-scale-type warnings are
  all cleared. Don't add errors, and don't let the warning count climb.
- `pnpm generate:sitemap` — regenerate `public/sitemap.xml` **from the manifests**
- `pnpm generate:og` — regenerate the Open Graph cards (Playwright; commits PNGs)
- `pnpm generate:docs` — regenerate the tool tables in `README.md` and `docs/README.md`

> If a bare `pnpm <script>` fails with a `runDepsStatusCheck` / ignored-builds error,
> run the tool binary directly (`./node_modules/.bin/eslint .`) or `pnpm approve-builds`.

## Current architecture

Astro static site, React island per tool. All processing is **client-side /
privacy-first** — no data leaves the browser except three explicit lookups (WHOIS, SSL,
Microsoft tenant), proxied through **Cloudflare Workers** (`cloudflare-worker/`; client
config in `src/utils/api/apiConfig.json`, accessed via `src/core/api.js`).

### Tool structure

A few files still carry a `Shadcn` suffix (`AzureNamingShadcn.jsx`,
`AzureKQLTool.jsx`'s neighbours) — that is **migration residue**, not a convention to
copy.

### The tools

**Don't keep a list here.** The inventory is generated from the registry into `README.md`
and `docs/README.md` (`pnpm generate:docs`, pinned by `src/tools/docs.test.js`) precisely
because every hand-maintained copy drifted: this file claimed 15 including a "Network
Designer" that was retired and replaced by the Subnet Calculator, and filed SSL Checker
under Network when its category is `security`.

## Frozen contracts (never break these — "keep the functionality" means these)

1. **Deep-link routes** — the 26 paths frozen in `src/tools/registry.test.js` are
   compatibility contracts (e.g. `/ssl-checker/:domain`, `/jwt/:token`, `/base64/:input`).
   They were read out of `App.jsx`'s router until that file was deleted; the list is now
   transcribed in the test. **Nothing is ever removed from it** — a retiring tool declares
   `redirectFrom` so its old path 301s.
2. **Share-URL codec** (`src/core/sharelink.js`) — the wire format is
   `safeStringify → pako.deflate` (**raw zlib, NOT gzip**) `→ URL-safe base64`, plus a
   legacy uncompressed-`btoa` fallback. Changing it silently breaks every shared link.
   Preserve it byte-for-byte; test round-trips against captured fixtures.
3. **localStorage** — real user data (saved networks, histories). Migrations must be
   non-destructive (read-old/write-new/keep-old ≥12 months).
4. **SEO** — per-tool meta/OG/schema from the manifest via `BaseLayout`/`ToolLayout`,
   plus `/sitemap.xml` and the per-tool OG cards. Pinned by `src/layouts/seo.test.js`
   and `canonical.test.js`, which assert the **built** output.
5. **Cloudflare Workers** — request/response schemas are a stable contract; leave them
   until the dedicated phase.

## Conventions

- **JavaScript / JSX only** — this is deliberately **not** a TypeScript project. (The
  redesign adds JSDoc + `checkJs` on the framework/manifest layer only, never full TS.)
- Functional components with hooks only; no class components.
- `.jsx` for components, `.js` for utilities; PascalCase components, camelCase utilities.
- No code comments unless asked.
- Prefer editing existing files; if a file exceeds ~200 lines, factor additions into a component.
- Documentation lives in `docs/` (see `docs/README.md`). Redesign notes go in the plan's Session Log.

## Do not re-add (removed in Phase 0 — verified unused)

`dayjs`, `framer-motion`, `d3-force`, `@svgdotjs/svg.js`, `next-themes`,
`tailwindcss-animate`, `uuid` (use `crypto.randomUUID()`), `autoprefixer`,
`@radix-ui/react-scroll-area`. Icons: **lucide-react is the only icon library for generic
UI glyphs**, and per-tool icons are selected filled Material Design glyphs vendored in
`src/shell/icons.mjs` (Astro `ToolIcon`, React `ui/tool-icon.jsx`) — one drawing, both
renderers, with no `react-icons` runtime dependency.
`@tabler/icons-react` is **removed**; do not reintroduce it. Also removed at cutover:
`postcss`, `@tailwindcss/postcss` (Tailwind arrives via `@tailwindcss/vite`),
`@astrojs/sitemap`, `jwt-decode` (`jose` already exports `decodeJwt`), and
**`exceljs`**.

> The *why* behind the xlsx choice (`write-excel-file` + `read-excel-file`, **not**
> exceljs or SheetJS) and the removal history lives in the `dependency-policy` skill —
> read it before swapping or removing a package.

## Traps and open issues

- **Gotcha:** TOML integers come back from `@ltd/j-toml` as **`BigInt`**, and `JSON.stringify`
  throws on them. Any TOML→JSON path must coerce. Pinned in `validation.test.js`.
- **Gotcha:** the JSON parser attaches `Symbol(newline)`/`Symbol(indent)` metadata to parsed
  objects, so `toEqual` against a plain object fails — compare structurally.
- **Gotcha:** JSX attribute string literals do **not** process escapes — `value="\t"` is a
  backslash and a `t`, not a tab. Use `value={'\t'}`.
- **Gotcha:** each category has **two** hues and they are not interchangeable.
  `--cat` / `--color-category-*` is the TEXT hue, deepened in light mode to clear 4.5:1 on
  bone. `--cat-fill` / `--color-category-fill-*` is the solid badge block, identical in
  both themes because the ink on it is always graphite. Putting a text hue behind that ink
  measures 1.6:1. `category-accent.test.js` guards both slots, in both directions.
- **Gotcha:** ink on a solid *status* fill is `on-status`, not `on-primary`. The accent is
  bright in both themes and takes graphite ink; the status hues flip, so their ink flips
  too. `src/styles/tokens.contrast.test.js` measures every pair in both themes, so a
  hand-tuned hex in `globals.css` will fail `pnpm test`.
- **Gotcha:** `--color-ring` is legitimately different in light and dark, and now points at
  `primary-text` rather than `primary`. No single value clears 3:1 against both a light and
  a dark card, and the chartreuse accent is 1.18:1 on bone. Don't "simplify" it to one value
  and don't point it back at `primary`.

All six bugs found in the Phase 0 audit are **fixed** (Microsoft Portals `undefined/…` URLs,
azure-kql missing `persist`, markdown-table undo/redo + tab delimiter, sharelink
`ReferenceError`, `Math.random` passwords, AWS Terraform bare prefix lengths). See the plan's
Session Log for details.

## Documentation map

- Redesign: `docs/plans/redesign-plan.md` (**authoritative, living**)
- Design: **[`DESIGN.md`](DESIGN.md) in the repo root is the sole authority** for colour,
  type, layout, shape and components.
- Behaviour ledger: `docs/BEHAVIOR_CHANGES.md` (every deliberate divergence from a
  characterization fixture is logged here, in the PR that makes it)
- Audit inputs / knowledge graph: `graphify-out/` (gitignored)
- Per-tool docs: `docs/tools/<id>/`, named by manifest id. The inventory tables in
  `README.md` and `docs/README.md` are **generated** from the registry
  (`pnpm generate:docs`) and pinned by `src/tools/docs.test.js` — don't hand-edit them.
- `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/DEPLOYMENT.md` and
  `docs/cloudflare-workers/README.md` were **regenerated from the code** at cutover.
- Workers/API: `docs/cloudflare-workers/README.md`, `docs/api/API_CONFIG.md`

# AGENTS.md

Guidance for Codex (Codex.ai/code) when working in this repository.

## ⚠️ Read this first

This project is undergoing a **ground-up redesign**. The authoritative plan is
[`docs/plans/redesign-plan.md`](docs/plans/redesign-plan.md) — read it before doing
any redesign work, and keep its **Session Log** updated as you go (it is the living
record across sessions).

**Target architecture:** a static **Astro** shell with one **React island** per tool,
everything derived from per-tool manifests. Phases 0 (stabilise) and 1 (design pass) are
**complete**, as are **2 (shell + bridge)**, **3–5 (all fifteen tools ported)** and all
three cutover gates — the preview deploy, the worker origin rotation and the Playwright
matrix, proven against real Pages infrastructure. **Phase 6 (demolition) is in progress:**
SEO has been reworked and the dead modules removed; the SPA itself is still here. The
two-column control/result split was built, applied to ten tools, rejected as unbalanced
and **fully withdrawn** — see `DESIGN.md`'s Layout section before proposing it again.

**Both apps exist in the tree right now, side by side.** Nothing has been cut over.

| | Live production app | New shell (not yet live) |
|---|---|---|
| Stack | React 19 + Vite SPA, react-router | Astro 7 static, React islands |
| Commands | `pnpm dev` · `pnpm build` | `pnpm dev:astro` · `pnpm build:astro` |
| Output | `dist/` | `dist-astro/` |
| Source | `src/components/`, `src/App.jsx` | `src/pages/`, `src/layouts/`, `src/shell/`, `src/tools/` |

**The bridge is live.** Every tool page mounts its existing React component through
`src/bridge/ToolIsland.jsx`, which supplies the three things Astro does not have: a
`BrowserRouter` whose routes are generated from the manifest's `params` (so `useParams`
works unchanged in the nine tools that call it), the shared `<Toaster/>`, and a
`ShellContext` marker. Shared chrome that would duplicate the shell's page furniture —
`SEOHead`, `ToolHeader`'s icon/h1/description — stands down when that context is present.
`src/bridge/` is Phase 2 scaffolding and is deleted at cutover.

`src/tools/<id>/manifest.mjs` is the contract (15 bridge manifests exist). The registry is
`src/tools/registry.mjs` (`import.meta.glob`, Vite-only) with a plain-Node twin
`src/tools/loadManifests.mjs` for build scripts; `registry.test.js` asserts they agree and
that every route in `App.jsx` is still served.

**The design system is [`DESIGN.md`](DESIGN.md) in the repo root — read it before touching
any styling.** It follows the [Stitch DESIGN.md spec](https://stitch.withgoogle.com/docs/design-md/specification)
(YAML token front matter + prose rationale) and is the single source of truth for colour,
type, layout, shape and components. Short version: **dark-first**, panelled, six category
hues driven by each tool's `category`, Inter for prose and JetBrains Mono for data only,
no serif. Use semantic tokens, never raw Tailwind palette classes (`bg-green-50`) — ESLint
warns on those in tools and errors in `src/components/ui/` and `src/components/layout/`.

**`src/components/ui/` is the design surface — change the component, not the call site.**
Every tool renders through it (48 files use the card, 47 the button), so it is the one
place a change reaches all fifteen tools at once, and it is now written against DESIGN.md
rather than shadcn's stock values. Notably: the primary button, focus ring, active tab and
default badge all take `var(--cat)`, which `ToolLayout` sets once per page from the
manifest's `category` — a tool never names a colour. There is one `<Toaster/>`
(`ui/toaster.jsx`, mounted by both apps), one help affordance (`ui/help-dialog.jsx`), and
one source for the bespoke tool icons (`src/shell/icons.mjs`, rendered by the Astro
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
| `--font-title-sm` vs the font **family** namespace | `font-title-sm` set `font-family: "Inter"` (not the self-hosted `"Inter Variable"`) → headings fell back to **serif** | same script strips per-step family tokens; each step folds into one `--text-*` carrying weight/line-height/tracking |
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

> `docs/DESIGN_SPEC.md`, `docs/DESIGN_SYSTEM.md` and `docs/STYLE_GUIDE.md` carried the
> abandoned **Solarized** palette and the Mantine-era component map. All three are
> **deleted** — `DESIGN.md` is the only design authority.

### Trust caveats (this file used to lie — verify before relying)

A prior version of this file misdescribed the codebase. Corrected facts:

- There are **15 tools**, not 14 (the 16th `toolsConfig.json` entry, `github-source`,
  is an external link, not a tool).
- The theme system is a **custom provider** (`src/components/theme-provider.jsx`),
  **not** `next-themes`.
- Routes are **hand-maintained** in `src/App.jsx` (~26 `<Route>` entries incl. param
  routes). There is **no** automatic route generation today.
- `src/utils/_iconImports.js`, `src/utils/toolsUtils.js`, `src/utils/cron.js` and
  `src/utils/generateSitemap.js` **have been deleted** (Phase 0) — older docs still reference
  them. The live sitemap generator is `scripts/generate-sitemap.js`.
- The azure-kql `*Shadcn` files **have been deleted**; they were a dead parallel
  implementation. The live entry is `AzureKQLTool.jsx`.
- `docs/ARCHITECTURE.md` and `docs/DEVELOPMENT.md` are **half-migrated / partly Mantine-era**
  and untrustworthy; they will be regenerated in a later phase. Prefer the redesign plan.

## Package manager & commands

**This project uses `pnpm`** (this machine blocks `npm`; `pnpm@11` + Node ≥20). The
lockfile is `pnpm-lock.yaml`. A stale, gitignored `package-lock.json` may linger — ignore it.

- `pnpm install` — install deps (esbuild is the one approved build script, see `pnpm.onlyBuiltDependencies`)
- `pnpm dev` — Vite dev server (the live SPA)
- `pnpm build` — generate sitemap + Vite production build → `dist/`
- `pnpm dev:astro` / `pnpm build:astro` — the new Astro shell → `dist-astro/` (build also
  regenerates `_redirects` from the manifests)
- `pnpm generate:tokens` — regenerate the token layer from `DESIGN.md` (needs network once)
- `pnpm test` — Vitest (1015 tests; **keep these green**) · `pnpm test:watch` to iterate
- `pnpm test:e2e` — Playwright deep-link matrix (22 tests) against `wrangler pages dev`
- `pnpm lint` — ESLint. **0 errors, and CI blocks on that.** 13 warnings remain
  (exhaustive-deps and react-refresh) — the raw-palette and off-scale-type warnings are
  all cleared. Don't add errors, and don't let the warning count climb.
- `pnpm preview` — preview the production build
- `pnpm generate:sitemap` — regenerate `public/sitemap.xml` **from the manifests**
- `pnpm generate:og` — regenerate the Open Graph cards (Playwright; commits PNGs)
- `pnpm generate:docs` — regenerate the tool tables in `README.md` and `docs/README.md`

> If a bare `pnpm <script>` fails with a `runDepsStatusCheck` / ignored-builds error,
> run the tool binary directly (`./node_modules/.bin/eslint .`) or `pnpm approve-builds`.

## Current architecture (the React SPA as it exists today)

React 19 SPA built with Vite. All processing is **client-side / privacy-first** — no
data leaves the browser except explicit external lookups, which are proxied through
**Cloudflare Workers** (`workers/` or `cloudflare-worker/`; client config in
`src/utils/api/apiConfig.json`, accessed via `src/utils/api/apiUtils.js`).

### Tool structure

Each tool lives in `src/components/tools/<tool-name>/`:
- `<ToolName>*.jsx` — entry component (many still carry a `Shadcn` suffix, which is
  **migration residue** to be dropped, not a convention to copy)
- `components/` — sub-components
- `hooks/`, `utils/`, `context/`, `store/` — vary per tool (state is currently
  inconsistent: zustand in one tool, Context+reducer in another, ad-hoc hooks elsewhere;
  the redesign standardises on one zustand-per-tool recipe)

Tool metadata now lives in each tool's `src/tools/<id>/manifest.mjs`.
`src/utils/toolsConfig.json` is the SPA's copy and is **retiring with the SPA** — nothing
in the Astro build reads it any more.

### The tools

**Don't keep a list here.** The inventory is generated from the registry into `README.md`
and `docs/README.md` (`pnpm generate:docs`, pinned by `src/tools/docs.test.js`) precisely
because every hand-maintained copy drifted: this file claimed 15 including a "Network
Designer" that was retired and replaced by the Subnet Calculator, and filed SSL Checker
under Network when its category is `security`.

## Frozen contracts (never break these — "keep the functionality" means these)

1. **Deep-link routes** — every path in `src/App.jsx` is a compatibility contract
   (e.g. `/ssl-checker/:domain`, `/jwt/:token`, `/base64/:input`). Do not rename or drop.
2. **Share-URL codec** (`src/core/sharelink.js`) — the wire format is
   `safeStringify → pako.deflate` (**raw zlib, NOT gzip**) `→ URL-safe base64`, plus a
   legacy uncompressed-`btoa` fallback. Changing it silently breaks every shared link.
   Preserve it byte-for-byte; test round-trips against captured fixtures.
3. **localStorage** — real user data (saved networks, histories). Migrations must be
   non-destructive (read-old/write-new/keep-old ≥12 months).
4. **SEO** — per-tool meta/OG/Schema via `toolsConfig.json` + sitemap generation.
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
UI glyphs**, and per-tool icons come from the shared bespoke set in `src/shell/icons.mjs`
(Astro `ToolIcon`, React `ui/tool-icon.jsx`) — one drawing used by both apps. `@tabler` is
down to two SPA-only layout files plus `IconBrandTerraform`, which has no lucide
equivalent; do not add new `@tabler` usage.

> Removing a package can break `vite.config.js` `manualChunks`, which lists vendor entries
> by name — a stale entry becomes a hard "Could not resolve entry module" build failure.

## Traps and open issues

- **Gotcha:** TOML integers come back from `@ltd/j-toml` as **`BigInt`**, and `JSON.stringify`
  throws on them. Any TOML→JSON path must coerce. Pinned in `validation.test.js`.
- **Gotcha:** the JSON parser attaches `Symbol(newline)`/`Symbol(indent)` metadata to parsed
  objects, so `toEqual` against a plain object fails — compare structurally.
- **Gotcha:** JSX attribute string literals do **not** process escapes — `value="\t"` is a
  backslash and a `t`, not a tab. Use `value={'\t'}`.
- **KNOWN-BUG (deliberately unfixed, pinned in `csvParser.test.js`):** `convertToCSV` coerces
  falsy cells via `String(field || '')`, so a numeric `0` or `false` is lost on export. Fix
  during the markdown-table port and update the fixture in the same PR.
- Subnet-allocator and base64 logic are still inline in their components, so neither has
  characterization tests yet. Extract them first when porting those tools.
- **Gotcha:** raw Solarized accents are **not** usable as text — green is 2.97:1 on the light
  card. The semantic tokens are derived, accessible variants; `--color-solar-*` is the raw
  ramp and is for decoration only. `src/styles/tokens.contrast.test.js` enforces this, so a
  hand-tuned hex in `globals.css` will fail `pnpm test`.
- **Gotcha:** `--color-ring` is legitimately different in light and dark. No single blue
  clears 3:1 against both a light and a dark card. Don't "simplify" it to one value.
- `ToolHeader` accepts an **`iconColor` prop that 14 tools pass and it never reads** — drop it
  per-tool during that tool's port, not in a drive-by.
- `dns-lookup` and `whois` compute autocomplete suggestions into state that nothing renders
  (`_autocompleteData`). Resolve during the Phase 4 lookup-hook port.
- **Known bugs surfaced by the Phase 2 sweep, deliberately left for their tools' ports:**
  `MarkdownPreview.getValidationVariant` returns `'default'` for warnings, so a warning
  renders as info; `DNSAnalysisDisplay.getProviderColor` takes an argument it ignores;
  `TenantLookupShadcn` and `TenantInfoDisplay` hold byte-identical copies of
  `getTenantTypeColor`; `BuzzwordIpsum` sets an inline `style={{fontSize}}` that ESLint
  cannot see.

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
- `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/DEPLOYMENT.md` are still
  **SPA-era and untrustworthy**; they are regenerated when the SPA is deleted.
- Workers/API: `docs/cloudflare-workers/README.md`, `docs/api/API_CONFIG.md` (document
  infrastructure that partly does not exist — verify against code)

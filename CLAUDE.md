# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## ⚠️ Read this first

**This is an Astro static site**: every page is prerendered HTML, with one **React
island** per tool, everything derived from per-tool manifests. The React SPA that
preceded it has been **deleted** — if you find a document describing `src/App.jsx`,
`src/components/tools/`, Vite as the build, or two apps side by side, that document is
stale and the code wins.

| | |
|---|---|
| Stack | Astro 7 static · React 19 islands · Tailwind 4 |
| Commands | `pnpm dev` · `pnpm build` · `pnpm preview` |
| Output | `dist/` |
| Source | `src/pages/`, `src/layouts/`, `src/shell/`, `src/tools/`, `src/core/` |

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
type, layout, shape and components. Short version: **dark-first**, panelled, six category
hues driven by each tool's `category`, Inter for prose and JetBrains Mono for data only,
no serif. Use semantic tokens, never raw Tailwind palette classes (`bg-green-50`) —
ESLint **errors** on those across `src/tools/` and `src/components/ui/`.

**`src/components/ui/` is the design surface — change the component, not the call site.**
Every tool renders through it (48 files use the card, 47 the button), so it is the one
place a change reaches all fifteen tools at once, and it is now written against DESIGN.md
rather than shadcn's stock values. Notably: the primary button, focus ring, active tab and
default badge all take `var(--cat)`, which `ToolLayout` sets once per page from the
manifest's `category` — a tool never names a colour. There is one `<Toaster/>`
(`ui/toaster.jsx`, mounted by `ToolIsland`), one help affordance (`ui/help-dialog.jsx`), and
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

- There are **15 tools**. Don't take a count from prose anywhere — the generated tables
  in the READMEs are the only inventory that is checked (`src/tools/docs.test.js`).
- Theming is a **pre-paint inline script** in `BaseLayout.astro` reading `vite-ui-theme`
  and `russ-tools-palette` from localStorage, plus `src/shell/appearance-controls.js`.
  There is no React theme provider and no `next-themes`.
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

- `pnpm install` — install deps (esbuild is the one approved build script, see `pnpm.onlyBuiltDependencies`)
- `pnpm dev` — Astro dev server
- `pnpm build` — sitemap + `astro build` → `dist/` + generated `_redirects`
- `pnpm preview` — serve the production build
- `pnpm generate:tokens` — regenerate the token layer from `DESIGN.md` (needs network once)
- `pnpm test` — Vitest (1000 tests; **keep these green**) · `pnpm test:watch` to iterate
- `pnpm test:e2e` — Playwright deep-link matrix (22 tests) against `wrangler pages dev`
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

Each tool is one folder, `src/tools/<id>/`:
- `manifest.mjs` — the contract: path, category, icon, params, storageKeys, seo, features
- `island.jsx` — the entry component the manifest lazy-loads
- `components/`, `lib/`, `hooks/`, `store/` — as the tool needs

A few files still carry a `Shadcn` suffix (`AzureNamingShadcn.jsx`,
`AzureKQLTool.jsx`'s neighbours) — that is **migration residue**, not a convention to
copy.

Tool metadata lives in each tool's `src/tools/<id>/manifest.mjs`. The SPA's
`src/utils/toolsConfig.json` copy is **deleted**.

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
UI glyphs**, and per-tool icons come from the shared bespoke set in `src/shell/icons.mjs`
(Astro `ToolIcon`, React `ui/tool-icon.jsx`) — one drawing, both renderers.
`@tabler/icons-react` is **removed**; do not reintroduce it. Also removed at cutover:
`postcss`, `@tailwindcss/postcss` (Tailwind arrives via `@tailwindcss/vite`) and
`@astrojs/sitemap`.

> This used to be riskier: `vite.config.js` listed vendor chunks by name, so removing a
> package turned a stale entry into a hard "Could not resolve entry module" failure. That
> file is gone — Astro chunks automatically — so a removal now fails, if at all, at the
> import site.

## Traps and open issues

- **Gotcha:** TOML integers come back from `@ltd/j-toml` as **`BigInt`**, and `JSON.stringify`
  throws on them. Any TOML→JSON path must coerce. Pinned in `validation.test.js`.
- **Gotcha:** the JSON parser attaches `Symbol(newline)`/`Symbol(indent)` metadata to parsed
  objects, so `toEqual` against a plain object fails — compare structurally.
- **Gotcha:** JSX attribute string literals do **not** process escapes — `value="\t"` is a
  backslash and a `t`, not a tab. Use `value={'\t'}`.
- **Gotcha:** a raw palette ramp is **not** usable as text — Solarized green is 2.97:1 on
  the light card. The semantic tokens are derived, accessible variants; `--color-solar-*`
  and the other raw ramps are for decoration only. `src/styles/tokens.contrast.test.js`
  enforces this across all twelve palette/mode combinations (694 assertions), so a
  hand-tuned hex in `globals.css` will fail `pnpm test`.
- **Gotcha:** `--color-ring` is legitimately different in light and dark. No single blue
  clears 3:1 against both a light and a dark card. Don't "simplify" it to one value.

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

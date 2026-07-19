# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## ⚠️ Read this first

This project is undergoing a **ground-up redesign**. The authoritative plan is
[`docs/plans/redesign-plan.md`](docs/plans/redesign-plan.md) — read it before doing
any redesign work, and keep its **Session Log** updated as you go (it is the living
record across sessions).

**Target architecture:** a static **Astro** shell with one **React island** per tool,
everything derived from per-tool manifests. Phases 0 (stabilise) and 1 (design pass) are
**complete**; **Phase 2 is in progress**.

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

**The token layer is generated — do not hand-edit hexes.** `src/styles/tokens.generated.css`
comes from `DESIGN.md` via `pnpm generate:tokens`; `src/styles/globals.css` only switches the
light peers in and aliases the shadcn names the un-ported components use (by `var()` reference,
so the light remap carries through). To change a colour: edit `DESIGN.md`, regenerate, run
`pnpm test`. `tokens.contrast.test.js` fails if the generated file has drifted from `DESIGN.md`,
or if any pair drops below its WCAG floor — it has caught five real contrast faults so far.

> **Remaining stale doc:** `docs/DESIGN_SPEC.md` still carries the abandoned **Solarized**
> palette and is marked superseded. It is retired in Phase 6. `globals.css` and the contrast
> test were reconciled in Phase 2 and no longer mention Solarized.

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
- `pnpm test` — Vitest (209 tests; **keep these green**) · `pnpm test:watch` to iterate
- `pnpm lint` — ESLint. **0 errors, and CI blocks on that.** ~234 warnings remain, mostly
  the raw-palette ban; each tool clears its own as it is ported. Don't add errors.
- `pnpm preview` — preview the production build
- `pnpm generate:sitemap` — regenerate `public/sitemap.xml`

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

Tool metadata (title, description, icon, SEO, category, routes) is centrally defined in
`src/utils/toolsConfig.json` — this registry is genuinely good and is being kept.

### The 15 tools

Network: Network Designer & Subnet Calculator, DNS Lookup, WHOIS Lookup, SSL Checker ·
Azure: Resource Naming (CAF), KQL Query Builder · Microsoft: Portals (GDAP), Tenant
Lookup · Security: JWT Decoder/Validator, Password Generator · Developer: Base64,
Data Converter (JSON/YAML/TOML), CRON Builder, Markdown Table · Utility: Buzzword Ipsum.

## Frozen contracts (never break these — "keep the functionality" means these)

1. **Deep-link routes** — every path in `src/App.jsx` is a compatibility contract
   (e.g. `/ssl-checker/:domain`, `/jwt/:token`, `/base64/:input`). Do not rename or drop.
2. **Share-URL codec** (`src/utils/sharelink.js`) — the wire format is
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
`@radix-ui/react-scroll-area`. Icons: the project still has **two** icon libraries
(`@tabler/icons-react` + `lucide-react`); the redesign standardises on **lucide only** —
do not add new `@tabler` usage.

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

All six bugs found in the Phase 0 audit are **fixed** (Microsoft Portals `undefined/…` URLs,
azure-kql missing `persist`, markdown-table undo/redo + tab delimiter, sharelink
`ReferenceError`, `Math.random` passwords, AWS Terraform bare prefix lengths). See the plan's
Session Log for details.

## Documentation map

- Redesign: `docs/plans/redesign-plan.md` (**authoritative, living**)
- Design: `docs/DESIGN_SPEC.md` (**authoritative** for colour, type, motion, a11y floor)
- Behaviour ledger: `docs/BEHAVIOR_CHANGES.md` (every deliberate divergence from a
  characterization fixture is logged here, in the PR that makes it)
- Audit inputs / knowledge graph: `graphify-out/` (gitignored)
- Design system: `docs/DESIGN_SYSTEM.md`, `docs/STYLE_GUIDE.md` — **superseded on colour
  and typography by `DESIGN_SPEC.md`**; the rest is Mantine-era and still untrustworthy
- Per-tool docs: `docs/tools/<tool-name>/` (some reference deleted pre-migration files)
- Workers/API: `docs/cloudflare-workers/README.md`, `docs/api/API_CONFIG.md` (document
  infrastructure that partly does not exist — verify against code)

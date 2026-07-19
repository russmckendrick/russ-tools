# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## ⚠️ Read this first

This project is undergoing a **ground-up redesign**. The authoritative plan is
[`docs/plans/redesign-plan.md`](docs/plans/redesign-plan.md) — read it before doing
any redesign work, and keep its **Session Log** updated as you go (it is the living
record across sessions).

**Target architecture:** a static **Astro** shell with one **React island** per tool,
everything derived from per-tool manifests. **Current architecture:** a React 19 +
Vite SPA (react-router). We are migrating from the latter to the former in phases;
right now we are in **Phase 0** (stabilise the live site: CI, tests, bug fixes,
dead-code purge) — the codebase is still the React SPA.

Do not describe or assume the Astro architecture exists yet. It does not.

### Trust caveats (this file used to lie — verify before relying)

A prior version of this file misdescribed the codebase. Corrected facts:

- There are **15 tools**, not 14 (the 16th `toolsConfig.json` entry, `github-source`,
  is an external link, not a tool).
- The theme system is a **custom provider** (`src/components/theme-provider.jsx`),
  **not** `next-themes`.
- Routes are **hand-maintained** in `src/App.jsx` (~26 `<Route>` entries incl. param
  routes). There is **no** automatic route generation today.
- `src/utils/_iconImports.js`, `src/utils/toolsUtils.js`, `src/utils/cron.js` and
  `src/utils/generateSitemap.js` are **dead code** slated for deletion — do not build on them.
- Several dependencies are installed but **never imported** (see "Do not re-adopt" below).
- `docs/ARCHITECTURE.md` and `docs/DEVELOPMENT.md` are **half-migrated / partly Mantine-era**
  and untrustworthy; they will be regenerated in a later phase. Prefer the redesign plan.

## Package manager & commands

**This project uses `pnpm`** (this machine blocks `npm`; `pnpm@11` + Node ≥20). The
lockfile is `pnpm-lock.yaml`. A stale, gitignored `package-lock.json` may linger — ignore it.

- `pnpm install` — install deps (esbuild is the one approved build script, see `pnpm.onlyBuiltDependencies`)
- `pnpm dev` — Vite dev server
- `pnpm build` — generate sitemap + Vite production build
- `pnpm lint` — ESLint (currently ~98 pre-existing errors; being cleaned in Phase 1 — see plan)
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

## Do not re-adopt (installed but dead — being removed in Phase 0)

`dayjs`, `framer-motion`, `d3-force`, `@svgdotjs/svg.js`, `next-themes`,
`tailwindcss-animate`, `uuid` (use `crypto.randomUUID()`), `autoprefixer`. Icons: the
project has **two** icon libraries (`@tabler/icons-react` + `lucide-react`); the redesign
standardises on **lucide only** — do not add new `@tabler` usage.

## Known live bugs (fixed early in Phase 0 — check the plan/Session Log for status)

- Microsoft Portals: `undefined/…` URLs for 24 of 31 Azure links (`baseUrl` resolution bug).
- azure-kql: zustand `persist` imported but never applied → history/favourites lost on refresh.
- markdown-table: undo/redo off-by-one; literal `'\t'` CSV delimiter.
- sharelink: calls to an un-imported `notifications` throw `ReferenceError` on error paths.
- Password Generator: uses `Math.random()` instead of `crypto.getRandomValues`.
- **Naming trap:** for azure-kql the live entry is `AzureKQLTool.jsx`; the
  `AzureKQLShadcn.jsx` stack is **dead** and being deleted. Do not pattern-match on the suffix.

## Documentation map

- Redesign: `docs/plans/redesign-plan.md` (**authoritative, living**)
- Audit inputs / knowledge graph: `graphify-out/` (gitignored)
- Design system: `docs/DESIGN_SYSTEM.md`, `docs/STYLE_GUIDE.md` (aspirational — much is
  not yet implemented; being reconciled in Phase 1)
- Per-tool docs: `docs/tools/<tool-name>/` (some reference deleted pre-migration files)
- Workers/API: `docs/cloudflare-workers/README.md`, `docs/api/API_CONFIG.md` (document
  infrastructure that partly does not exist — verify against code)

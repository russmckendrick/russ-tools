# Development

How to work on russ.tools. For how the site is put together, read
[`ARCHITECTURE.md`](ARCHITECTURE.md) first; for anything touching styling, read
[`DESIGN.md`](../DESIGN.md) in the repo root, which is the authority for colour, type,
layout, shape and components.

## Prerequisites

- **Node ≥ 20** (`package.json` `engines`; CI runs Node 22)
- **pnpm** — `packageManager` pins `pnpm@11.14.0`, and the lockfile is `pnpm-lock.yaml`.
  A stale, gitignored `package-lock.json` may linger in a working copy; ignore it.

```bash
git clone https://github.com/russmckendrick/russ-tools.git
cd russ-tools
pnpm install
pnpm dev
```

`pnpm install` builds one dependency (`esbuild`, so Vite has its native binary). pnpm 11
reads that from `pnpm-workspace.yaml` — `allowBuilds` / `onlyBuiltDependencies` — not from
a `pnpm` field in `package.json`. `msw` is deliberately not built: its postinstall only
prepares the browser service-worker artefact, and the tests use `msw/node`. If a bare `pnpm <script>` fails with a `runDepsStatusCheck`
or ignored-builds error, run the binary directly (`./node_modules/.bin/eslint .`) or
`pnpm approve-builds`.

## Scripts

Every script below exists in `package.json`.

| Command | What it runs | When to use it |
|---|---|---|
| `pnpm dev` | `astro dev` | Day-to-day development. Note that param deep links 404 here — there is no `_redirects` layer in the dev server. |
| `pnpm build` | `generate:sitemap` → `astro build` → `generate:redirects` | Produce `dist/`. Also required before the built-output test suites will run. |
| `pnpm preview` | `astro preview` | Serve the built `dist/` as static files. Still no `_redirects` handling — for that, use `wrangler pages dev dist`. |
| `pnpm test` | `vitest run` | The unit and contract suites. |
| `pnpm test:watch` | `vitest` | Iterating on a test. |
| `pnpm test:e2e` | `playwright test` | The deep-link matrix. Needs a Cloudflare runtime — see Testing. |
| `pnpm lint` | `eslint .` | Zero errors is enforced in CI. |
| `pnpm generate:sitemap` | `scripts/generate-sitemap.js` | Rewrite `public/sitemap.xml` from the manifests. Runs as part of `build`. |
| `pnpm generate:redirects` | `scripts/generate-redirects.mjs` | Rewrite `dist/_redirects` from the manifests. Runs as part of `build`; requires `dist/` to exist. |
| `pnpm generate:tokens` | `scripts/generate-tokens.mjs` | Regenerate `src/styles/tokens.generated.css` after editing `DESIGN.md`. Needs network access. |
| `pnpm generate:og` | `scripts/generate-og.mjs` | Regenerate the committed Open Graph cards in `public/og/`. |
| `pnpm generate:docs` | `scripts/generate-docs.mjs` | Regenerate the tool tables in `README.md` and `docs/README.md`. |

Worker-backed lookups (WHOIS, SSL, tenant) call the deployed Cloudflare Workers, which
enforce a CORS origin allowlist. A local development origin must be in the relevant
worker's `ALLOWED_ORIGINS` for those lookups to succeed; everything else works offline.

## Adding a tool

A tool is one folder. Nothing central is edited — no routing table, no page, no registry
entry.

```
src/tools/<id>/
  manifest.mjs          the contract
  island.jsx            the React entry component
  lib/                  pure logic, unit-testable without React
  components/           sub-components, if the island outgrows one file
  __tests__/            island tests
```

### 1. Write the manifest

`manifest.mjs` default-exports one plain object. Every field, and what it drives:

| Field | Type | What it drives |
|---|---|---|
| `id` | string | The folder name. Namespaces storage (`rt:<id>:<slot>`), names the Open Graph card, keys `TOOLS_BY_ID`. |
| `path` | `/kebab-case` | The URL, the prerendered page, the canonical, the sitemap entry, the router patterns. |
| `title` | string | The `h1`, the index card, the documentation tables, the schema `name`. |
| `shortDescription` | string, ≤ 80 chars | The index card and the sentence under the `h1`. |
| `description` | string | The meta description and the schema `description`. |
| `category` | one of `network`, `azure`, `microsoft`, `security`, `developer`, `content` | The hue, the index group, the breadcrumb label, the schema `applicationCategory`. |
| `icon` | key of `TOOL_ICONS` in `src/shell/icons.mjs` | The tool's drawing. Must be unused by any other tool. |
| `badges` | string[] | The short capability strings on the index card. |
| `params` | string[] | Deep-link segments, in order. Drives the `_redirects` rewrites and the island's router patterns. Empty array if the tool has none. |
| `redirectFrom` | string[], optional | Retired paths that 301 here. |
| `features` | string[] | The schema.org `featureList`. |
| `seo.title` | string, ≤ 65 chars | The `<title>`. Must equal `title` or start with `"<title> - "`. |
| `seo.keywords` | string[] | The keywords meta and the schema `keywords`. |
| `storageKeys` | string[] | The `rt:<id>:<slot>` slots the tool owns. Enumerated and cleared by `/delete`. |
| `legacyKeys` | string[] | Pre-rewrite localStorage keys read forward and also cleared by `/delete`. |
| `island` | `() => import('./island.jsx')` | The lazily loaded component. |

Copy an existing manifest as the starting point — `src/tools/dns-lookup/manifest.mjs` for
a tool with no params, `src/tools/subnet-calculator/manifest.mjs` for one with two.

### 2. Write the island

`island.jsx` default-exports a React component. It renders into `ToolLayout`'s slot, so it
must not render its own `h1`, description, breadcrumb or SEO — the shell already did.

- Import shared plumbing from `@/core` (`copyText`, `downloadFile`, `createToolStorage`,
  `createCache`, `apiFetch`, the share-link helpers) and UI from `@/components/ui/*`.
- Read deep-link segments with `useParams()` from `react-router-dom` — `ToolIsland`
  provides the router.
- For a lookup-shaped tool (query in, cached result out, history), use
  `useLookupTool` from `@/lib/useLookupTool.js` rather than hand-rolling loading state, a
  cache and a history.
- Never name a colour. The category hue arrives as `--cat`, already set by `ToolLayout`.

### 3. Regenerate and test

```bash
pnpm generate:docs     # tool tables in README.md and docs/README.md
pnpm generate:og       # the tool's Open Graph card
pnpm build             # sitemap and _redirects pick the tool up automatically
pnpm test
```

`registry.test.js` will reject a malformed manifest, a duplicate icon, an over-long
`shortDescription` or `seo.title`, and a route that is not on the frozen list —
adding a new URL means adding it to that list deliberately.

## Testing

### Vitest

`vitest.config.js` runs with `environment: 'node'` by default; component tests opt into
jsdom per file. `src/test/setup.js` repoints Node's own experimental `localStorage` and
`sessionStorage` globals at jsdom's, because under Node ≥ 22 they shadow jsdom's
origin-scoped storage and every storage-backed test silently no-ops. jsdom is given a real
origin (`http://localhost/`) for the same reason — an opaque origin carries no storage.

`include` is `src/**/*.{test,spec}.{js,jsx}`, so the Playwright specs in `e2e/` are not
picked up.

Worker responses are stubbed with MSW: handlers in `src/test/msw/handlers.js`, captured
fixtures in `src/test/fixtures/workers/`.

Roughly what the suites cover:

- **Contracts** — `src/tools/registry.test.js` (manifest shape, the frozen 26-route list,
  the two loaders agreeing), `src/tools/sitemap.test.js`, `src/tools/docs.test.js`,
  `src/core/sharelink.test.js` (golden fixtures for the share codec),
  `src/core/storage.test.js` (the never-delete migration).
- **Design tokens** — `src/styles/tokens.contrast.test.js` re-reads `DESIGN.md` and fails
  if `tokens.generated.css` has drifted or any pair drops below its WCAG floor.
  `src/lib/utils.test.js` pins the tailwind-merge type-scale fix.
- **Tools** — pure logic under each tool's `lib/`, plus island tests under `__tests__/`.

### The built-output suites, and why CI builds first

Three suites assert the contents of `dist/` rather than the source:

- `src/layouts/canonical.test.js` — the index canonical is the bare origin, no canonical
  anywhere carries a `.html` suffix, and each tool page is canonical to its manifest path.
- `src/layouts/seo.test.js` — the emitted head and JSON-LD: theme colour, description, Open
  Graph and Twitter tags, and the `SoftwareApplication`/`BreadcrumbList` nodes with their
  `author`, `publisher`, `featureList`, `keywords` and `isPartOf`.
- `src/tools/sitemap.test.js` — the generated `public/sitemap.xml` matches the registry
  exactly, in both directions.

They read the build because the faults they guard against are invisible in the source.
`Astro.url.pathname` is the *output filename* during a static build, so a canonical that
looks correct in the layout resolves to `/index.html`; and a structured-data regression
leaves valid JSON-LD on a page that looks identical.

Each is wrapped in `describe.runIf(built)` and skips when `dist/` is absent, so `pnpm test`
stays useful without a build. `.github/workflows/ci.yml` therefore runs **build → test →
lint**, in that order: without the build step those suites silently skip.

### Playwright

`pnpm test:e2e` runs `e2e/deeplinks.spec.js` — the browser-level gate for the deep-link
contract. It proves what only the Cloudflare Pages layer can: that a param deep link
200-rewrites with the URL intact, that the prerendered page underneath is the right tool,
that `/network-designer` 301s to `/subnet-calculator`, and that the island applies the param
after hydration. It also covers the index grouping and the mobile navigation.

`astro dev` serves param routes as 404s by design, so the matrix never runs against it.
Two targets:

```bash
# Local Cloudflare runtime — the config auto-starts `wrangler pages dev dist` on :8788
pnpm build && pnpm test:e2e

# A deployed preview (the real gate)
PW_BASE_URL=https://russ-tools-preview.pages.dev pnpm test:e2e
```

Worker-backed lookups fire on mount but are not asserted: the matrix proves routing and
param application, which is origin-independent, whereas live lookups depend on the target
origin being in each worker's `ALLOWED_ORIGINS`.

## Linting

`pnpm lint` runs ESLint over the whole tree (`dist`, `.astro`, `.wrangler` and `coverage`
are ignored). **Zero errors, and CI blocks on that.** Warnings are permitted but the count
should not climb.

Base rules everywhere: `eslint:recommended`, the react-hooks recommended set,
`react/jsx-uses-vars` and `react/jsx-uses-react`, `no-unused-vars` with an `^_` ignore
pattern, `no-empty` with `allowEmptyCatch` (the house idiom for storage that may be
unavailable), and `react-refresh/only-export-components` as a warning.

Two restrictions come from `DESIGN.md` and are enforced as `no-restricted-syntax`, in both
string literals and template elements:

| Restriction | What it catches | Where it is an error |
|---|---|---|
| Raw Tailwind palette classes | `bg-green-50`, `text-red-500`, `hover:border-blue-300` and every prefixed variant | `src/components/ui/**` and `src/tools/**` |
| Off-scale typography | Tailwind's stock sizes (`text-xs`…`text-9xl`) and weights outside 400–660 (`font-bold`, `font-light`, …) | `src/components/ui/**` and `src/tools/**` |

Use semantic tokens instead of palette classes — `bg-success-subtle`, `text-danger`,
`border-info`, `text-muted-foreground`. Use the type steps `DESIGN.md` defines instead of
stock sizes: `text-display`, `text-headline-lg`, `text-headline-md`, `text-title-sm`,
`text-body-lg`, `text-body-md`, `text-body-sm`, `text-label-caps`, `text-data-lg`,
`text-data-md`, `text-data-sm`. Each step carries its own weight, line-height and tracking,
so it never takes a `font-*`, `leading-*` or `tracking-*` alongside it. (The ESLint message
lists ten of the eleven — `data-lg` is missing from it, but the step exists in `DESIGN.md`
and in `cn()`'s merge configuration.)

Both rules see source text only. A class written as a computed string, or an inline
`style={{ fontSize }}`, passes lint regardless — lint proves a class was written, only the
rendered DOM proves it was applied.

## Conventions

- **JavaScript and JSX only.** Not a TypeScript project. JSDoc is used on the framework,
  manifest and `core/` layers; full TypeScript is not on the table.
- `.jsx` for components, `.js` for utilities, `.mjs` for manifests and Node-side modules.
  PascalCase component files, camelCase utilities.
- Functional components with hooks. No class components — the one exception is the island
  error boundary in `src/bridge/ToolIsland.jsx`, because React offers no hook for it.
- **No code comments unless asked.** Where a comment does exist in this tree it explains
  why something is the way it is, usually because the obvious alternative was tried and
  broke something.
- Prefer editing an existing file to adding one. If a file passes roughly 200 lines, factor
  the addition into a component or a `lib/` module rather than growing it.
- Change the shared component, not the call site. `src/components/ui/` is the design
  surface and the one place a change reaches every tool at once.
- Shell CSS classes in `src/styles/shell.css` are `rt-`-prefixed. Do not add an unprefixed
  class there — it will collide with the Tailwind utility of the same name.
- Never hand-edit `src/styles/tokens.generated.css`. Edit `DESIGN.md`, run
  `pnpm generate:tokens`, run `pnpm test`.
- Documentation lives in `docs/` (see [`docs/README.md`](README.md)). Deliberate
  divergences from previously captured behaviour go in
  [`BEHAVIOR_CHANGES.md`](BEHAVIOR_CHANGES.md), in the change that makes them.

## The generator scripts

All five read the manifests (via `src/tools/loadManifests.mjs`, the plain-Node twin of the
registry) and write files that are otherwise hand-maintained and therefore drift.

| Script | Output | Committed? | Run by |
|---|---|---|---|
| `scripts/generate-sitemap.js` | `public/sitemap.xml` | No — gitignored | `pnpm build`, first step |
| `scripts/generate-redirects.mjs` | `dist/_redirects` | No — build artefact | `pnpm build`, last step |
| `scripts/generate-tokens.mjs` | `src/styles/tokens.generated.css` | Yes | On demand, after editing `DESIGN.md` |
| `scripts/generate-og.mjs` | `public/og/<id>.png` and `public/og/default.png` | Yes | On demand |
| `scripts/generate-docs.mjs` | The tables between `<!-- TOOLS:START -->` and `<!-- TOOLS:END -->` in `README.md` and `docs/README.md` | Yes | On demand |

Notes worth knowing before running them:

- **Tokens** shells out to `pnpm dlx @google/design.md`, so it needs network access on
  first run. That is why the output is committed and CI never regenerates it — the contrast
  test is what proves the committed file still matches `DESIGN.md`.
- **Open Graph cards** are drawn by headless Chromium (via `@playwright/test`) rather than
  satori or sharp, because `@fontsource-variable/inter` ships woff2 only and the
  alternatives cannot read it without extra packages or a font that happens to exist on the
  build image. Colours are read out of `tokens.generated.css`, so run `generate:tokens`
  first if the palette changed. Cards are committed because they change roughly never and a
  font pipeline has no business on the critical path of a deploy.
- **Docs tables** are pinned by `src/tools/docs.test.js`, so adding a tool without running
  `pnpm generate:docs` fails CI. The two tables differ only in link prefix (`docs/tools/…`
  from the root README, `tools/…` from `docs/README.md`), and a doc link is only emitted
  when `docs/tools/<id>/` actually exists.
- **Sitemap** takes `lastmod` from each tool's last commit date, not the build clock, and
  omits the field entirely outside a git checkout. Param routes are deliberately absent:
  a deep link is a link into a result, not a page worth indexing.
- **Redirects** exits non-zero if `dist/` is missing, so it cannot silently produce nothing
  when run outside `pnpm build`.

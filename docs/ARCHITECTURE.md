# Architecture

How russ.tools is put together, as the code stands today. If this document and the code
disagree, the code wins — and the disagreement is a bug in this file.

Related reading: [`DESIGN.md`](../DESIGN.md) in the repo root is the authority for colour,
type, layout, shape and components; [`DEVELOPMENT.md`](DEVELOPMENT.md) covers how to work
on the tree; [`plans/redesign-plan.md`](plans/redesign-plan.md) is the living record of how
the current shape came about.

## The short version

The site is an [Astro](https://astro.build) 7 static build. Every page is prerendered to
HTML at build time; each tool is a single React island mounted inside that HTML. There is
no server at runtime: the output is a directory of files served by Cloudflare Pages, plus
a `_redirects` file that handles deep links.

- **JavaScript and JSX only.** This is deliberately not a TypeScript project. JSDoc plus
  editor inference is as far as the type layer goes.
- **Client-side processing.** Nothing leaves the browser except three lookups that
  physically cannot run in it, which are proxied through Cloudflare Workers.
- **One folder per tool.** `src/tools/<id>/` holds a `manifest.mjs` and an `island.jsx`,
  and everything else — the page, the index card, the sitemap entry, the redirect rules,
  the Open Graph card, the saved-data listing, the documentation tables — is derived from
  the manifest.

Commands: `pnpm dev`, `pnpm build` (output `dist/`), `pnpm preview`.

## Repository layout

| Path | What lives there |
|---|---|
| `astro.config.mjs` | The single build configuration. Astro carries its own Vite config; there is no `vite.config.js`. |
| `src/pages/` | The four pages: `index.astro`, `[tool].astro`, `delete.astro`, `404.astro`. |
| `src/layouts/` | `BaseLayout.astro` (head, theme, chrome) and `ToolLayout.astro` (the per-tool page furniture). |
| `src/shell/` | Astro chrome and the plain-JS modules it reads: categories, palettes, site identity, the shared Material icon set. |
| `src/tools/<id>/` | One folder per tool: `manifest.mjs`, `island.jsx`, and whatever `lib/`, `components/` or `hooks/` that tool needs. |
| `src/tools/registry.mjs` | The registry. `loadManifests.mjs` is its plain-Node twin. |
| `src/bridge/ToolIsland.jsx` | The one island entry that mounts any tool's React component. |
| `src/core/` | Framework-agnostic plumbing: storage, cache, clipboard, download, HTTP client, share-link codec. |
| `src/lib/` | React-level shared code: `useLookupTool.js`, `utils.js` (`cn`, `useLocalStorage`). |
| `src/components/ui/` | The shared component layer every tool renders through. |
| `src/components/common/` | `StorageManager.jsx`, the island behind `/delete`. |
| `src/styles/` | `globals.css`, the generated `tokens.generated.css`, and `shell.css`. |
| `src/utils/` | What remains of the pre-rewrite utilities: `api/apiConfig.json`, `azure/`, `devLog.js`, the Prism loaders. |
| `src/test/` | Vitest setup, MSW handlers and captured worker fixtures. |
| `scripts/` | The five generators: sitemap, redirects, tokens, Open Graph cards, documentation tables. |
| `e2e/` | The Playwright deep-link matrix. |
| `cloudflare-worker/` | Worker sources and their `wrangler-*.toml` configs. |
| `public/` | Static assets, including the committed `og/` cards. `public/sitemap.xml` is generated and gitignored. |

## The Astro shell

`astro.config.mjs` sets `output: 'static'`, `outDir: './dist'`, `trailingSlash: 'never'`
and `build.format: 'file'`. Those last two matter together: with `format: 'file'` a page
is written as `dist/dns-lookup.html` and served by Cloudflare Pages at the extensionless
`/dns-lookup`, and `trailingSlash: 'never'` keeps `/dns-lookup` and `/dns-lookup/` from
becoming two URLs for one page.

The only integration is `@astrojs/react`, declared with no include/exclude filter — React
is the only island framework, so it claims every `.jsx`. There is no sitemap integration;
`scripts/generate-sitemap.js` is the single source (see below).

Four pages exist:

- **`index.astro`** — the tool index, rendered entirely from the registry. Groups are
  category groups, except that Azure and Microsoft are merged into one "Microsoft & Azure"
  group at render time. Filtering is a plain script that toggles `hidden` on prerendered
  groups, so the page degrades to "everything visible" without JavaScript. It publishes a
  `WebSite` and an `ItemList` node.
- **`[tool].astro`** — one prerendered page per tool via `getStaticPaths()` over `TOOLS`.
  Its whole body is `<ToolIsland client:only="react" toolId={tool.id} />`.
- **`delete.astro`** — the saved-data page. Prerendered copy plus the `StorageManager`
  island; marked `noindex` because it is a per-browser control panel, not content.
- **`404.astro`** — a real not-found page, so a mistyped URL does not soft-404 into the
  index. No canonical, and `noindex`.

`BaseLayout.astro` owns the `<head>`: canonical, robots, description, keywords, Open Graph
and Twitter tags, one `<script type="application/ld+json">` per schema node, and an inline
pre-paint script that applies the stored theme and palette to `<html>` before first paint.
The canonical default strips `index.html`/`.html` from `Astro.url.pathname`, because during
a static build that pathname is the *output file* rather than the served URL.

`ToolLayout.astro` builds a tool page from its manifest alone: the `SoftwareApplication`
and `BreadcrumbList` schema nodes, the SEO title, the canonical, the Open Graph card path,
the breadcrumb, the icon, the `h1` and the one-line description — then a single slot for
the tool. A tool cannot reach the head, cannot set its own colour, and cannot invent its
own page furniture.

## The island model

Every tool page mounts `src/bridge/ToolIsland.jsx` with `client:only="react"`. It is
`client:only` rather than `client:load` because the tool components read `localStorage` and
`window.location` during their first render, so there is no meaningful server pass to
hydrate against — and the crawler-visible content (`h1`, description, structured data) is
produced by `ToolLayout`, not by the island.

`ToolIsland` supplies four things:

1. **A router.** Several tools call `useParams`. The island mounts a real `BrowserRouter`
   whose `<Route>` patterns are generated from the manifest's `params` — the same source
   the `_redirects` rewrites come from, so a deep link cannot match in one place and miss
   in the other.
2. **Toasts.** One `<Toaster/>` (`sonner`, via `src/components/ui/toaster.jsx`) per page.
3. **Lazy loading and an error boundary.** The manifest's `island` is a lazy
   `() => import('./island.jsx')`, wrapped in `Suspense` with a loading panel and a class
   error boundary offering a reload.
4. **Link interception.** A capture-phase click handler on the island root turns any
   same-origin anchor click into a real browser navigation. Without it, a react-router
   `Link` inside an island would call `preventDefault` and hand the URL to a router that
   only knows this one tool's routes, so a cross-tool link would change the address bar and
   render nothing.

The theme needs nothing from the island: it is a class and a `data-palette` attribute on
`<html>`, written by `BaseLayout`'s pre-paint script.

## The manifest is the contract

`src/tools/<id>/manifest.mjs` default-exports one plain object. Its fields, and what each
one drives:

| Field | Drives |
|---|---|
| `id` | Folder name, storage namespace (`rt:<id>:<slot>`), Open Graph filename, `TOOLS_BY_ID` key. |
| `path` | The URL, the prerendered page, the canonical, the sitemap entry, the router patterns. |
| `title` | The `h1`, the index card, the documentation tables, the schema `name`. |
| `shortDescription` | The card and the one-line sentence under the `h1`. Capped at 80 characters by the registry test. |
| `description` | The meta description and the schema `description`. |
| `category` | The hue (`--cat`), the index group, the breadcrumb label, the schema `applicationCategory`. |
| `icon` | Which drawing from `src/shell/icons.mjs` renders. Every tool has a distinct one. |
| `badges` | The short capability strings on the index card. |
| `params` | Deep-link segments — the `_redirects` rewrite patterns and the island's router patterns. |
| `redirectFrom` | Retired paths that 301 to this tool. Only `subnet-calculator` uses it (`/network-designer`). |
| `features` | The schema.org `featureList`. |
| `seo.title` / `seo.keywords` | The `<title>`, the keywords meta, the schema `keywords`. |
| `storageKeys` | The `rt:<id>:<slot>` slots the tool owns — enumerated and cleared by `/delete`. |
| `legacyKeys` | Pre-rewrite localStorage keys the tool reads forward and `/delete` also clears. |
| `island` | `() => import('./island.jsx')` — the lazy component `ToolIsland` mounts. |

Everything derived from that one object:

| Derived artefact | Produced by |
|---|---|
| The prerendered tool page | `src/pages/[tool].astro` |
| The index card, category group and filter chip | `src/pages/index.astro`, `src/shell/ToolCard.astro` |
| The page head, canonical and structured data | `src/layouts/ToolLayout.astro` |
| `public/sitemap.xml` | `scripts/generate-sitemap.js` |
| `dist/_redirects` | `scripts/generate-redirects.mjs` |
| `public/og/<id>.png` | `scripts/generate-og.mjs` |
| The `/delete` listing and clear actions | `src/components/common/StorageManager.jsx` |
| The tool tables in `README.md` and `docs/README.md` | `scripts/generate-docs.mjs` |
| The island's router patterns | `src/bridge/ToolIsland.jsx` |

Adding a tool is one new folder. No routing table, no central list, no page edits.

## The registry and its plain-Node twin

`src/tools/registry.mjs` collects every manifest with
`import.meta.glob('./*/manifest.mjs', { eager: true, import: 'default' })` and exports:

- `TOOLS` — sorted by category order then title, which is the order the index renders in
- `TOOLS_BY_ID` and `getTool(id)`
- `groupedByCategory()` — the categories that have tools, each with its tools
- `allRoutes()` — every path the shell owns, literal and parameterised, expanded from each
  manifest's `params`

`import.meta.glob` only resolves inside Vite, so the registry works under Astro and under
Vitest but not under bare Node. The build scripts run under bare Node, so
`src/tools/loadManifests.mjs` does the same job by reading the directory with
`node:fs`. Both loaders exist because neither environment can use the other's mechanism;
`registry.test.js` asserts they return the same tools, with the same paths and the same
params, so the duplication cannot drift.

Only the registry reads manifests. Tools do not import each other, and nothing else imports
a manifest directly.

## The shared layers

### `src/core/`

Plain JavaScript, no React, no DOM assumptions beyond a guarded `document` — so the same
modules run in an island, in a build script and under Vitest's `node` environment. Exported
from `src/core/index.js`:

- **`storage.js`** — namespaced `localStorage` (`rt:<toolId>:<slot>`) with a
  read-old/write-new migration shim that never deletes a legacy key, plus `toolStorageKeys`
  and `clearTool` for the `/delete` page. Injectable backend, with a null backend when
  storage is absent (during the build, or in a browser with storage disabled).
- **`cache.js`** — a TTL cache over that storage, with an entry cap and oldest-first
  eviction, and an injectable clock.
- **`clipboard.js`** — `copyText`/`readText`, with the `execCommand` fallback that makes
  copying work on non-secure origins.
- **`download.js`** — `downloadFile`/`downloadJSON`/`safeFilename`, revoking the object URL
  on the next frame.
- **`api.js`** — the HTTP client for the worker lookups: a real `AbortController` deadline,
  retries limited to 5xx/408/425/429 and genuine transport failures, and an `ApiError`
  carrying the status.
- **`sharelink.js`** — the share-URL codec (see below).

Tools import from `@/core`, not from `src/utils/`.

### `src/lib/`

- **`useLookupTool.js`** — one state machine for the lookup tools (dns-lookup, whois,
  ssl-checker, tenant-lookup, microsoft-portals): loading and error state, the TTL cache,
  a deduplicated history, lookup-on-mount from a URL param, aborts and toasts. The tool
  brings a `fetcher` that owns *what* is requested; the hook owns *when*.
- **`utils.js`** — `cn()` (see the token traps below) and a small `useLocalStorage` hook.

### `src/components/ui/`

The design surface. Radix primitives styled against `DESIGN.md`, and the one place a change
reaches every tool at once. The primary button, focus ring, active tab and default badge
read `var(--cat)`, which `ToolLayout` sets once per page from the manifest's `category`, so
a tool never names a colour. There is one `<Toaster/>`, one help affordance
(`help-dialog.jsx`), and one tool-icon renderer (`tool-icon.jsx`) sharing
`src/shell/icons.mjs` with the Astro `ToolIcon.astro`.

### `src/shell/`

Astro-side chrome — `SiteMark`, `HeaderActions`, `AppearanceControls`, `ToolCard`,
`ToolIcon` — plus the plain modules both sides read: `categories.mjs`, `palettes.mjs`,
`site.mjs` (one site name, one theme colour, one author, the shared schema.org nodes) and
`icons.mjs`.

Shell CSS classes in `src/styles/shell.css` are all `rt-`-prefixed. An unprefixed class
here collides with a Tailwind utility of the same name — `.grid` did exactly that, and the
shell's rule won, so every `grid grid-cols-*` inside every tool silently became a 3-column
grid.

## The design-token pipeline

```
DESIGN.md (YAML front matter)
  → pnpm generate:tokens  (scripts/generate-tokens.mjs, via @google/design.md@0.3.0)
    → src/styles/tokens.generated.css   [committed, never hand-edited]
      → src/styles/globals.css          [light peers, shadcn aliases, hand-held tokens]
```

`DESIGN.md`'s front matter carries the graphite dark tokens and their bone `-light` peers.
The generator exports them into `tokens.generated.css`; `globals.css` does only the jobs
the exporter cannot — switch the light peers in under `:root.light` and
`prefers-color-scheme`, and alias the shadcn names the components render against by
`var()` reference so the light remap carries through.

**The exporter reads four keys and silently ignores the rest.** `colors`, `typography`,
`rounded` and `spacing` produce output; `borderWidth`, `shadow`, `motion` and `components`
produce nothing at all. The border and motion values are therefore transcribed by hand
into the `@theme` block in `globals.css`, and `tokens.contrast.test.js` asserts they match
what `DESIGN.md` declares. `components` is documentation, implemented by hand in
`src/components/ui/` and `src/styles/shell.css`.

The exporter version is **pinned**. Its output shape is not a stable contract — 0.1.1 had
no `css-tailwind` format at all — so an unpinned `pnpm dlx` would change the committed
stylesheet with no repo change and fail the drift assertion on a file nobody touched.

`src/styles/tokens.contrast.test.js` reads all three files and fails if the generated CSS
has drifted from `DESIGN.md` or if any pair falls below its WCAG floor (4.5:1 for body
text, 3:1 for large text, UI boundaries and the `on-surface-dim` metadata step). The
generator needs the network on first run, which is why its output is committed and CI
never runs it.

There are two themes. The six alternate palettes (Solarized, Catppuccin, Dracula, Nord,
Tokyo Night, GitHub) were retired with the Signal redesign, along with the picker and the
`russ-tools-palette` key; that key is left in `localStorage` but nothing reads it. The
pre-paint script reads `vite-ui-theme` and stamps `class` and `data-theme-pref` on
`<html>` before the first frame.

Three colour roles exist because a single token could not do both jobs:

| Pair | Why |
|---|---|
| `category-*` / `category-fill-*` | the text hue is deepened in light mode to clear 4.5:1 on bone; the fill is identical in both themes because the ink on it is always graphite |
| `primary` / `primary-text` | the chartreuse accent is 1.18:1 on bone, so it is a fill only; `primary-text` is the accent in dark and an olive derivative in light, and is what `--color-ring` points at |
| `on-primary` / `on-status` | the accent takes graphite ink in both themes; the status hues are bright in dark and deep in light, so their ink flips |

### Three name collisions with Tailwind's own scales

`DESIGN.md` names its steps `xs`…`3xl` and `title-sm`/`body-sm`/`data-md`, which are
exactly Tailwind's container, size and colour scale keys. Tailwind resolves each collision
silently, in Tailwind's favour. All three are fixed and pinned by tests; the pattern is the
thing to remember.

| Collision | Symptom | Fixed in |
|---|---|---|
| `--spacing-lg` against Tailwind's *container* scale | `max-w-lg` became 16px — every dialog a sliver | `scripts/generate-tokens.mjs` renames the scale to `--rt-space-*` |
| `--font-title-sm` against the font **family** namespace | `font-title-sm` set `font-family: "Instrument Sans"` rather than the self-hosted `"Instrument Sans Variable"`, so headings fell back to serif | the same script strips per-step family tokens and folds each step into one `--text-*` carrying weight, line-height and tracking |
| `text-body-sm` looks like a colour to tailwind-merge | `cn()` deleted the size class: present in the source, absent from the DOM | `src/lib/utils.js` declares the type steps as a `font-size` group, pinned by `src/lib/utils.test.js` |

Fix a collision in the generator or in `cn()`, never by renaming things in `DESIGN.md`.
Every one of these failed silently with a clean lint, which is why the rule is: lint proves
a class was written, only the rendered DOM proves it was applied.

One class applies one type step — `text-title-sm` carries its own weight, line-height and
letter-spacing, so nothing goes beside it.

## The category-hue system

`src/shell/categories.mjs` defines six categories in render order: `network`, `azure`,
`microsoft`, `security`, `developer`, `content`. Each carries a label and a schema.org
`applicationCategory`.

A tool's `category` selects its hue everywhere it appears. `ToolLayout` sets `--cat:
var(--color-category-<category>)` once on the page wrapper, and everything below inherits
it — the icon tile, the breadcrumb, badges, borders, small type and the hover glow.

The division of labour is deliberate: **the accent acts, the category labels.** Buttons,
toggles, sliders and focus rings are `primary` in both themes. A category hue is never a
large fill — it has to clear 4.5:1 as text, and the security amber at 4.5:1 is brown, so a
button filled with it is a brown slab.

## How a deep link works, end to end

Take `/subnet-calculator/10.0.0.0/16`.

1. **The manifest declares the segments.** `params: ['ip', 'prefix']`.
2. **`scripts/generate-redirects.mjs` expands them.** For each prefix of the params list it
   emits a rewrite onto the tool's own page:
   ```
   /subnet-calculator/:ip                  /subnet-calculator        200
   /subnet-calculator/:ip/:prefix          /subnet-calculator        200
   ```
   Status `200` is a rewrite, not a redirect: the visitor keeps the URL they arrived on and
   Cloudflare serves `subnet-calculator.html` underneath it. A 301 here would rewrite the
   address bar and break every shared link. Retired paths declared as `redirectFrom` are
   emitted first, as genuine 301s.
3. **Cloudflare Pages serves the prerendered page** with the deep-link URL intact, so the
   `h1`, description and structured data are correct before any JavaScript runs.
4. **`ToolIsland` mounts a `BrowserRouter`** whose route patterns are expanded from the same
   `params` array, so `/subnet-calculator/:ip/:prefix` matches.
5. **The tool reads `useParams()`** and applies the values on mount.

`astro dev` has no `_redirects` layer, so it serves param routes as 404s. That is expected:
the Playwright matrix runs against the Cloudflare runtime (`wrangler pages dev dist`) or a
deployed preview, never against the dev server.

The frozen route list lives in `src/tools/registry.test.js` — all 26 paths the retired SPA
served, transcribed verbatim from its router at the commit that deleted it. The suite fails
if the registry would drop one, and also if the registry would *add* one that is not on the
list, so a new URL is always deliberate.

## The share-link codec

`src/core/sharelink.js` is a frozen contract. The wire format is:

```
safeStringify → pako.deflate (raw zlib, NOT gzip) → URL-safe base64, padding stripped
```

with a legacy branch that still reads the uncompressed `btoa(JSON)` format some links in
the wild use. Every detail is load-bearing:

- `pako.deflate` emits a zlib wrapper. `pako.gzip` is the obvious "modernisation" and would
  silently break every link ever shared.
- Padding is stripped on encode and reconstructed on decode from `length % 4`. A decoder
  that requires padding rejects every existing URL.
- `safeStringify` **drops values**, and that is part of the format: anything whose
  constructor is not `Object` or `Array` encodes as `undefined` and is omitted, and a
  repeated object reference becomes `'[Circular]'` even when the graph is a DAG. Tools have
  been written against that for years.

`src/core/sharelink.test.js` holds golden fixtures generated from the pre-rewrite module;
they must keep decoding forever.

## The Cloudflare boundary

Everything runs in the browser except three lookups that cannot: WHOIS, SSL analysis and
Microsoft tenant discovery. Those go through Cloudflare Workers on dedicated subdomains.

| Endpoint | Worker source | Used by |
|---|---|---|
| `https://whois.russ.tools/` | `cloudflare-worker/whois.js` | whois-lookup |
| `https://ssl.russ.tools/` | `cloudflare-worker/ssl.js` | ssl-checker |
| `https://tenant.russ.tools/` | `cloudflare-worker/tenant.js` | tenant-lookup, microsoft-portals |

URLs, timeouts and retry counts are declared in `src/utils/api/apiConfig.json` and read by
the tools that need them; requests go through `apiFetch`/`buildUrl` from `src/core/api.js`,
which applies the configured timeout and the retry policy. Request and response schemas are
a frozen contract — the client changes when a request is given up on, not what is sent.

DNS lookups use public DNS-over-HTTPS endpoints directly (`dns.google/resolve` and
`1.1.1.1/dns-query`), with no worker in between.

Each worker enforces a CORS origin allowlist from an `ALLOWED_ORIGINS` secret set per
worker (`cloudflare-worker/configs/wrangler-*.toml` documents the `wrangler secret put`
invocation). A local dev origin has to be on that list for worker-backed lookups to
succeed from a development server.

`cloudflare-worker/buzzwords.js` is also in the tree, but no current client code calls it:
the Buzzword Ipsum tool generates from a bundled `data/buzzwords.json`. The worker exists
to serve that word list as a public API. Its import path still pointed at the
pre-rewrite `src/components/tools/…` location until the cutover, so a deploy from source
would have failed to bundle; it now reads `src/tools/buzzword-ipsum/data/buzzwords.json`.

## Storage model

Anything a tool saves is `localStorage`, in this browser, under `rt:<toolId>:<slot>`. A
manifest's `storageKeys` enumerates the slots the tool owns and `legacyKeys` names the
pre-rewrite keys it reads forward.

Reads fall back to the legacy key when the namespaced one is absent and copy the value
forward as they go. A read never deletes the legacy key: an old bookmark, a rollback or a
cached build must still find the data where it looks for it.

`/delete` is the one deliberate exception. `StorageManager.jsx` surveys every tool's keys
from the registry, shows sizes, and `clearTool` removes the namespaced and legacy
generations together — per tool or all tools. Site preferences (theme, palette) and
unrelated origin storage are outside that control.

## Build and hosting

`pnpm build` runs three steps in order:

1. `pnpm generate:sitemap` — writes `public/sitemap.xml` from the manifests, with `lastmod`
   taken from each tool's last commit date rather than the build clock.
2. `astro build` — prerenders every page into `dist/`, including `public/` verbatim.
3. `pnpm generate:redirects` — writes `dist/_redirects` from the manifests. It fails loudly
   if `dist/` does not exist.

The result is a static directory served by Cloudflare Pages. `robots.txt` advertises
`/sitemap.xml`, which is the only sitemap the site publishes.

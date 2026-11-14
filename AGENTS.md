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

Short version — the language is **Datasheet** (it replaced Stacks in November 2026;
the token *names* survived, every value changed): **flat and ruled** — structure is a 1px
`rule` and white space, no offset shadows, radii of 4/6/8/12px. The site header and the
head of every page sit on one deep **ink band** (`band`, `band-raised`, `band-outline`,
`on-band`, `on-band-muted`), identical in both themes; anything on it uses band tokens and
acts in `accent-bright`, never `primary`. Below the band the ground is white in light and
green-black in dark, *no other palettes*. One green accent that only ever appears on
something you can press: mint in dark, a deep green (`#0b6b43`) in light, where fill and
text share the value. The six category hues still label badges **inside** tools; the shell
(catalogue, tool header) no longer draws them. **IBM Plex Sans** for everything that is
read, **IBM Plex Mono** for data and small uppercase labels. Tool and group glyphs are
**custom-drawn** in `src/shell/icons.mjs`. No section numbering and no marketing copy in a
page head. Use semantic tokens, never raw Tailwind palette classes (`bg-green-50`) —
ESLint **errors** on those across `src/tools/` and `src/components/ui/`.

**`src/components/ui/` is the design surface — change the component, not the call site.**
Every tool renders through it (48 files use the card, 47 the button), so it is the one
place a change reaches all fifteen tools at once, and it is now written against DESIGN.md
rather than shadcn's stock values. Notably: the default badge takes `var(--cat)` and the
`category` badge `var(--cat-fill)`, both set once per page by `ToolLayout` from the
manifest's `category` — a tool never names a colour. The focus ring is `--color-ring`,
which resolves to `primary-text` (the accent in dark, a deep green in light);
the raw accent is ~1.6:1 on paper and cannot be a ring or text there. There is one `<Toaster/>`
(`ui/toaster.jsx`, mounted by `ToolIsland`), one tool-level help affordance (the prerendered
`/<tool>/help` page — `src/pages/[tool]/help.astro`, linked from the band by `ToolLayout.astro`; the
old drawer `ui/help-dialog.jsx` and `ui/sheet.jsx` are deleted), one field-level hint
(`ui/help-hint.jsx`), and
one source for the Material tool icons (`src/shell/icons.mjs`, rendered by the Astro
`ToolIcon` and the React `ui/tool-icon.jsx`).

**Page actions live on the band.** `ToolLayout.astro` prerenders the action row beside the
breadcrumb (`[data-tool-actions]`) with the Help link already in it; a tool's own page-level
action goes through `<ToolAction>` (`ui/tool-actions.jsx`), which `ToolIsland` portals into the
slot beside Help. `.rt-band .rt-tool-acts :is(a, button)` in `shell.css` redraws whatever lands
there in band tokens, so a tool passes an ordinary `<Button>` and never styles it for the band.

**Phones are a first-class target — the rules are in `DESIGN.md`'s Layout section.** The
mechanics: `.rt-tap` (in `globals.css`, on every `Button` and `TabsTrigger`) is an invisible
44px touch target on coarse pointers; `.rt-tool-body` is `minmax(0, 1fr)` because an implicit
`auto` grid track let one nowrap row push the help prose off-screen; `TabsList` owns its layout
(never pass it `grid grid-cols-N`); `FlowDiagram` will not scale a drawing below 85% and scrolls
its panel instead; and an ID or address in a table cell is `whitespace-nowrap` or
`[overflow-wrap:anywhere]`, never `break-all` — `break-all` in an auto-layout table collapses
the column to one character and made each licence row 130px tall.

**The site mark is the hex key** (`src/shell/SiteMark.astro`, adopted 2026-11-14 from
`design/proposals/2026-11-identity/`, on the existing green): a key bent to the "r" and the bolt
it turns, which is the dot of russ.tools. Two filled shapes — the key in `currentColor`, the bolt
in `--rt-mark-bolt` — so it is not drawn with the 1.75px pen the tool glyphs use. That one file is
the only drawing: the OG cards and every icon file are generated from it. The proposal's copper,
blue and violet schemes were **not** adopted.

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

- There are **24 tools** (2026-11-14). Don't take a count from prose anywhere — the generated tables
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
- `pnpm dev:api` — `wrangler pages dev` on :8788, serving the Pages Functions in
  `functions/api/`. Run it beside `pnpm dev`, whose Vite proxy forwards `/api` to it;
  without it the WHOIS, SSL and tenant tools fail locally and everything else works.
- `pnpm generate:tokens` — regenerate the token layer from `DESIGN.md` (needs network once).
  The exporter is **pinned** (`@google/design.md@0.3.0`) because its output shape is not a
  stable contract and an unpinned upgrade would fail the drift test on an untouched file.
  It reads only `colors`, `typography`, `rounded` and `spacing`; `borderWidth`, `shadow`,
  `motion` and `components` are documentation, transcribed by hand into `globals.css`.
- `pnpm test` — Vitest (1080 tests; **keep these green**) · `pnpm test:watch` to iterate.
  The count dropped from ~1000 when the palettes were retired: `tokens.contrast.test.js`
  ran its pair list over 12 palette/mode combinations and now runs it over 2. It measures
  *more* roles than before, against fewer themes.
- `pnpm test:e2e` — Playwright deep-link, help and API matrix (90 tests) against
  `wrangler pages dev`. It reuses whatever is already listening on :8788, so a stale
  server gets tested instead of the build — `PW_PORT=8798 pnpm test:e2e` moves it.
- `pnpm lint` — ESLint. **0 errors, and CI blocks on that.** 11 warnings remain
  (exhaustive-deps and react-refresh) — the raw-palette and off-scale-type warnings are
  all cleared. Don't add errors, and don't let the warning count climb.
- `pnpm generate:sitemap` — regenerate `public/sitemap.xml` **from the manifests**
- `pnpm generate:og` — regenerate the Open Graph cards (Playwright; commits PNGs)
- `pnpm generate:icons` — regenerate `public/assets/logo.svg`, `favicon.ico` and the touch /
  home-screen PNGs from `src/shell/SiteMark.astro` and the token layer (Playwright; commits them).
  Run both after changing the mark or the band / accent colours.
- `pnpm generate:docs` — regenerate the tool tables in `README.md` and `docs/README.md`

> If a bare `pnpm <script>` fails with a `runDepsStatusCheck` / ignored-builds error,
> run the tool binary directly (`./node_modules/.bin/eslint .`) or `pnpm approve-builds`.

## Current architecture

Astro static site, React island per tool. All processing is **client-side /
privacy-first** — no data leaves the browser except three explicit lookups (WHOIS, SSL,
Microsoft tenant), which go to the site's **own same-origin API** (below; client config in
`src/utils/api/apiConfig.json`, accessed via `src/core/api.js`).

### The lookup API (`/api/*`, added 2026-11-14)

`/api/ssl`, `/api/whois` and `/api/tenant` are **Cloudflare Pages Functions** in
`functions/api/`, one module per lookup, deployed with the site. They were ported from the
three standalone workers, whose query parameters and JSON bodies they keep exactly.

- **`functions-lib/http.js` is the shared guard**, and it lives outside `functions/` on
  purpose: every file under `functions/` becomes a route. Don't move it in, and don't put
  tests or helpers under `functions/`.
- **Same-origin only, and honest about it.** No CORS headers anywhere; `Sec-Fetch-Site`
  must be `same-origin` when present; `Origin` must equal the request URL's own origin
  when present; GET only. That stops other sites using or reading it. It does **not** stop
  a non-browser client, which can forge or omit those headers — never describe the API as
  private or authenticated. Rate limiting is a Cloudflare zone rule, not code.
- **There is no `ALLOWED_ORIGINS` and no localhost entry.** "Own origin" is derived from
  the request, so previews work unconfigured. A loopback `Origin` is accepted only when
  the function's own URL is loopback, which only happens under `wrangler pages dev`.
- **Secrets** (`SSL_LABS_EMAIL`, `SSL_LABS_USER_AGENT`, `GRAPH_CLIENT_ID`,
  `GRAPH_CLIENT_SECRET`, `GRAPH_TENANT_ID`) are set on the Pages project per environment;
  locally they come from the gitignored `.dev.vars` (names in `.dev.vars.example`). All
  are optional: each lookup degrades to its unauthenticated sources without them.
  `SSL_LABS_EMAIL` is SSL Labs' credential, sent as an `email` header on `analyze` and
  `getEndpointData`; it must be an address registered with SSL Labs, and it is never
  logged. The legacy `cloudflare-worker/ssl.js` reads it and never sends it — don't copy
  that back.
- **Do not add a `wrangler.toml` with `pages_build_output_dir`.** It would become the
  source of truth and lock the dashboard's settings for the same fields.
- **The contract is tested by replay.** `src/test/functions/` rebuilds each upstream's
  data from the production captures in `src/test/fixtures/workers/`, runs the handler and
  requires the captured response back. Several quirks are therefore deliberate: the
  `apiSource` strings still say "Cloudflare Worker", the tenant lookup's
  `openid_configuration` URLs are wrong and never match, and the SSL 500 body carries
  `stack`. Changing any of them is a contract change — log it in `BEHAVIOR_CHANGES.md`.
- **The old workers are still deployed and still in `cloudflare-worker/`** until the owner
  retires them; don't edit or delete them. `cloudflare-worker/buzzwords.js` is a separate
  public API and is not part of any of this.

Full reference: `docs/cloudflare-workers/README.md`.

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

### The AI-agent surface (added 2026-08-22)

Four pieces — the first three manifest-driven, the fourth static:

- **`scripts/generate-llms.mjs`** writes `public/llms.txt`, `public/llms-full.txt` and
  `public/agents.md` (all gitignored) from `loadManifests()` + the help blocks of
  `docs/tools/*/README.md`. Runs at the head of `pnpm build`; pinned against the
  registry by `src/tools/llms.test.js`. The public `/agents.md` is unrelated to this
  file. `@adkinn/astro-ai-readiness` was evaluated and **rejected** — Astro `^5||^6`
  peer only, and it would duplicate the existing JSON-LD/robots/sitemap.
- **`astro-webmcp`** (in `astro.config.mjs`) injects a client script registering
  site-wide WebMCP tools (search/sections/navigate/page-info) on browsers with
  `document.modelContext`, and emits `dist/_webmcp/manifest.json` +
  `dist/.well-known/skills/index.json`. Its dist scan can't read flat
  `build.format:'file'` pages, so **`scripts/patch-webmcp-manifest.mjs` rewrites the
  manifest from the manifests as the build's last step** — pinned by
  `src/tools/webmcp.test.js`. Don't use its config-level `customTools` (stringified
  function bodies, run on every page).
- **Per-tool WebMCP tools** register from the island via `useWebMCPTool` in
  `src/lib/useWebMCPTool.js` — descriptor as a **module-scope constant** (it is the
  effect dependency), `execute` calling the tool's own `lib/` functions, results
  through `textResult()`. Subnet Calculator (`calculate_subnet`) and Base64
  (`base64_encode`/`base64_decode`) are the pattern to copy. Mind the BigInt gotcha:
  `ipv6Details().totalAddresses` doesn't survive `JSON.stringify`.
- **Discovery statics** (checked in, not generated): `public/_headers` puts an RFC 8288
  `Link: rel="api-catalog"` + `rel="service-doc"` on `/` and sets
  `application/linkset+json` + open CORS on the catalog; `public/.well-known/api-catalog`
  (RFC 9727 linkset) anchors the three `/api/*` lookup endpoints from `apiConfig.json` (on `SITE_URL`, each titled as same-origin only);
  `public/.well-known/ai-catalog.json` is the ARD manifest pointing at llms.txt, the
  WebMCP manifest and the api-catalog; `robots.txt` carries
  `Content-Signal: search=yes, ai-input=yes` (`ai-train` deliberately undeclared — an
  owner's rights call, not a default). All pinned against `apiConfig.json` and
  `site.mjs` by `src/tools/agent-discovery.test.js`. OAuth discovery / protected-resource
  metadata / auth.md / an MCP server card were considered and **rejected** — there are no
  protected APIs and no standalone MCP server, and publishing metadata for auth that
  doesn't exist would misdirect agents.

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
5. **The lookup API** (`/api/ssl`, `/api/whois`, `/api/tenant`, and the legacy workers
   they were ported from) — request/response schemas are a stable contract, pinned by
   replay tests in `src/test/functions/`. They change only on purpose, with a
   `BEHAVIOR_CHANGES.md` entry.

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
`@radix-ui/react-scroll-area`. Icons: **lucide-react is the only library for generic
interface glyphs** inside tools. Per-tool and per-group icons are **custom drawings** in
`src/shell/icons.mjs` (Astro `ToolIcon`, React `ui/tool-icon.jsx`) — one drawing, both
renderers, at a 1.75px stroke. Their keys are the Lucide names the manifests declared under
Stacks, kept as identifiers only.
**`react-icons` is allowed for brand marks only** (vendor/service logos where Lucide has
none, e.g. the email-provider marks in
`src/tools/email-dns-analyser/lib/providerIcons.js`) — never for interface glyphs, and
always via per-set entry points (`react-icons/si`, `react-icons/fa6`) so only imported
marks reach the bundle. The filled Material set was retired with Stacks, and the
`@fontsource` Bricolage Grotesque / Space Grotesk / Space Mono packages with Datasheet.
`@tabler/icons-react` is **removed**; do not reintroduce it. Also removed at cutover:
`postcss`, `@tailwindcss/postcss` (Tailwind arrives via `@tailwindcss/vite`),
`@astrojs/sitemap`, `jwt-decode` (`jose` already exports `decodeJwt`), and
**`exceljs`**.

> The *why* behind the xlsx choice (`write-excel-file` + `read-excel-file`, **not**
> exceljs or SheetJS) and the removal history lives in the `dependency-policy` skill —
> read it before swapping or removing a package.

**Diagrams are drawn by `pele`** (Mermaid syntax to themeable SVG, zero dependencies), via
`src/components/ui/tree-diagram.jsx`. Import from `pele/core` and register only the diagram
types in use — the bare `pele` entry pulls in every type (about 230 kB gzipped against
about 63 kB for flowchart alone). Do not add `mermaid` itself.

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
- **Gotcha:** `--color-ring` is `primary-text`, which is a deep green in light and mint in
  dark. On the ink band neither is right in light mode, so `shell.css` rings everything on
  the header and band in `accent-bright` instead.
- **Gotcha:** entrance animations use `backwards` fill, so a tab that loads in the
  background holds its first (invisible) frame until it is shown. In the in-app browser
  pane this looks like a blank band; `document.getAnimations().forEach(a => a.finish())`
  shows the settled page.

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
- Lookup API and legacy workers: `docs/cloudflare-workers/README.md`,
  `docs/api/API_CONFIG.md`

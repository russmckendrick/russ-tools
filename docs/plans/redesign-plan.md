# russ-tools Redesign — Plan of Attack

**Date:** 2026-07-19
**Status:** Phase 0 complete · **Phase 1 complete (design direction reversed once — see below)**
· branch `redesign/phase-0` (no PR) · next decision point: start Phase 2 (Astro shell + legacy bridge)
**Owner directive:** start-from-scratch redesign, keep all functionality; nothing off limits framework-wise or CSS-wise; modern and useful.

> **This is a living document.** Update the [Session Log](#session-log) and the current
> phase's task board at the end of each working session. The plan body above the log is
> the stable reference; the log is the running record.
>
> **Companion documents:**
> - [`DESIGN.md`](../../DESIGN.md) (repo root) — **the authoritative design system.**
>   Follows the [Stitch DESIGN.md spec](https://stitch.withgoogle.com/docs/design-md/specification):
>   YAML design tokens + prose rationale. Read this before any styling work.
> - [`docs/BEHAVIOR_CHANGES.md`](../BEHAVIOR_CHANGES.md) — frozen contract #6's ledger.
> - [`docs/DESIGN_SPEC.md`](../DESIGN_SPEC.md) — **superseded.** Phase 1's Solarized
>   spec, kept for its method (derived accents, enforced contrast floor), not its palette.

---

## How this plan was made

A knowledge graph of the full repo (955 nodes, 2,005 edges — `graphify-out/`) fed a 7-dimension audit (dependencies/build, architecture/state, cross-tool duplication, heavy-tool deep dives, API/Workers layer, docs drift, UX consistency). Five complete redesign proposals were then generated independently and judged adversarially through three lenses: solo-maintainer realism, functionality preservation, and the owner's modern-and-useful directive.

| Proposal | Shape | Maintainer | Functionality | Modern+Useful |
|---|---|---|---|---|
| Trellis | React strangler-fig, in place | **9** | **9** | 5 |
| Manifest Monolith | React 3-package workspace, legacy bridges | 7 | 8 | 6 |
| **Archipelago** | Astro static shell + one React island per tool | 6 | 7 | **8** |
| Clean-Room "toolbelt" | New repo, TypeScript + TanStack Router | 4 | 6.5 | 6.5 |
| Runeforge | Svelte 5 + SvelteKit rewrite | 3.5 | 4.5 | 7 |

**The chosen plan merges the top scorers:** Trellis's opening (ship fixes and safety nets to the live site first) + Archipelago's destination (prerendered Astro shell, tools as React islands) + Manifest Monolith's delivery mechanism (legacy bridges, so the new shell reaches production early with unported tools still working inside it). This removes Archipelago's only structural weakness — the big-bang cutover — and delivers a genuinely visible redesign, which pure Trellis by its own rules never does.

### What was evaluated and rejected (the "nothing off limits" receipts)

- **Svelte 5 / SvelteKit, SolidStart, Qwik** — rejected on port-cost evidence, not incumbency. All ~123 JSX components would be hand-rewritten in a new component language, @dnd-kit and every Radix primitive replaced, with parity verifiable only by manual checklist (characterization tests cover ~7% of the code — the pure cores). Solid 2.0 was mid-beta at evaluation; Qwik's resumability optimizes a problem this client-side app doesn't have. The islands *architecture* won; the non-React *runtimes* lost.
- **TypeScript + TanStack Router clean-room rewrite** — best verification apparatus, worst delivery shape: all-or-nothing cutover after ~20+ sessions, two new mental models, and a router swap whose param-encoding edge cases (`/jwt/:token`, `/base64/:input`) are exactly where deep links break silently. react-router is removed anyway in this plan (Astro file routes replace it), without adopting a second router to learn.
- **pnpm 3-package workspace** — the physical import firewall is nice but `eslint-plugin-boundaries` gets ~90% of it with zero ceremony for a solo maintainer with one deploy target.
- **UnoCSS / Panda CSS / StyleX / plain-CSS-only** — all 123 components are already Tailwind-classed; every alternative forces a full className rewrite for no user-visible gain. Tailwind 4 stays *on merit*. What was actually broken in the styling layer — missing semantic tokens, three conflicting dark palettes, no a11y floor — gets rebuilt (see Phase 1).
- **Preact/compat islands** — ~40 kB cached-once saving in exchange for debugging Radix portals and @dnd-kit sensors under a compat shim, alone. No.
- **shadcn/ui replacement (Base UI, Ark, hand-rolled)** — shadcn survives because it's vendored owned code, regenerated fresh from the current CLI. Base UI 1.0 (MUI-maintained, ex-Radix team) is the named watch item: because primitives are vendored, any single one can be swapped later without a flag-day if Radix maintenance keeps decaying.

---

## The decision

**Architecture:** static Astro shell, one React island per tool, everything derived from per-tool manifests.

**Design system:** [`DESIGN.md`](../../DESIGN.md) — dark-first, panelled, six category hues
driven by each tool's `category`. Inter for prose, JetBrains Mono for data only, no serif.
Authored to the Stitch DESIGN.md spec, so `pnpm dlx @google/design.md export DESIGN.md
--format css-tailwind` emits the Tailwind 4 `@theme` block directly — **the token layer is
generated from it, not retyped.**

**Stack (versions current as of 2026-07):**

- **Astro 7.0.x** (`output: 'static'`, pinned patch; Astro 6.x is the proven fallback — the design uses nothing 7-specific) with **@astrojs/react**, React 19.2.x as the sole island framework
- **Tailwind CSS 4.3.x** via `@tailwindcss/vite`; **shadcn/ui** regenerated fresh into `src/primitives/` (never copied from the old tree); **lucide-react 1.x** as the only icon library
- **zustand 5 + persist** as the single state recipe (kills the four coexisting patterns)
- **JavaScript stays** (owner convention). JSDoc typedefs + `checkJs` on exactly two surfaces: the manifest contract and `core/` public APIs — most of TS's contract value, zero convention breach
- **Vitest 4.x + Playwright**, ESLint 10 flat config (drop the `varsIgnorePattern: '^[A-Z_]'` that hides dead imports) + eslint-plugin-boundaries + Prettier, GitHub Actions CI, npm (matches the lockfile), `engines`/`packageManager`/`.nvmrc` pinned
- **Kept verbatim:** pako, netmask, jose, jwt-decode, js-yaml(+source-map), @ltd/j-toml, ajv family, @dnd-kit, sonner, react-dropzone, exceljs (dynamic import), prismjs (shiki swap is an optional follow-up)
- **Deleted:** react-router-dom (Astro file routes replace it), dayjs, framer-motion, d3-force, @svgdotjs/svg.js, next-themes, tailwindcss-animate, uuid (→ `crypto.randomUUID`), autoprefixer, @tabler/icons-react (by end of tool ports)

**Why this wins the brief:** it is modern where users and crawlers can see it — every tool page becomes real prerendered HTML with an actual `h1`, description, OG/schema.org markup (today: empty div, no h1, on a site whose owner cares about SEO) — while keeping 100% of the React component code, so port cost scales with ~20 pages rather than 123 components. There is no app root, so the class of bug where azure-naming's provider fetches a Terraform file on every page load for every visitor becomes *unrepresentable*, not just discouraged. And per-island framework choice stays open forever — the only reading of "nothing is off limits" that holds as an ongoing property.

### Source layout

```
src/
  core/            # framework-agnostic plain JS: sharelink codec (verbatim), storage
                   # (namespaced + migration shim), api client (real timeouts, retry
                   # 5xx/network only), clipboard, downloadFile, cache-with-TTL,
                   # history-with-undo, domain validation
  primitives/      # regenerated shadcn + IconButton (aria-label required) + FormRow
  tools/<id>/      # manifest.mjs, island.jsx, components/, lib/ (pure core), store.js,
                   # __tests__/
  layouts/         # ToolLayout.astro — h1, description, badges, action slot, SEO head;
                   # consumes manifests; tools never import layout/SEO/config
  pages/           # [...tool].astro + index.astro, fully derived from the registry
workers/           # unchanged until the final phase
```

### The tool-module contract

Each tool declares one `manifest.mjs`:

```js
export default {
  id: 'ssl-checker',
  path: '/ssl-checker',
  title: 'SSL Certificate Checker',
  description: '…', shortDescription: '…',
  icon: 'shield-check', iconColor: 'green', category: 'network', badges: [...],
  seo: { title: '…', keywords: [...] },
  params: ['domain'],                       // deep-link segments → generated _redirects
  storageKeys: ['state', 'history', 'cache'],  // rt:<id>:<slot>
  legacyKeys: ['ssl-checker-history', 'ssl-checker-cache'],
  island: () => import('./island.jsx'),
  hydrate: 'load',
}
```

The registry (`import.meta.glob` over manifests) drives `getStaticPaths`, the sidebar, home cards, sitemap, `_redirects`, and the storage-clear UI. A Vitest contract test asserts every manifest's shape, unique ids, unique paths. **Tool #16 = one new folder. Nothing else is touched.**

**`category`, `shortDescription` and `icon` are required, not optional** — `DESIGN.md` makes
them load-bearing. `category` selects the tool's hue (one of six) everywhere it appears, so a
tool never picks its own colour; `shortDescription` is rendered on the card, so a tool cannot
ship as a bare icon and a name; `icon` names one of the bespoke set. The contract test enforces
all three, and that `category` is one of the six known values. Note `iconColor` is **not** in
the manifest: it was a dead prop in the old `ToolHeader` and colour now derives from category.

---

## The six frozen contracts ("keep the functionality" made precise)

1. **Deep links** — all 26 current routes preserved verbatim, including `/ssl-checker/:domain`, `/jwt/:token`, `/base64/:input`, `/whois-lookup/:query`, `/tenant-lookup/:domain`, `/microsoft-portals/:domain`, `/azure-kql/:service(/:template)`. Param routes served via `_redirects` 200-rewrites *generated from manifest `params`*, read by one shared `useDeepLinkParam` helper. Gates: a route-table snapshot test frozen from today's `App.jsx`, plus a Playwright matrix that loads every param route with realistic values (a real JWT, a real domain) and asserts the param is applied.
2. **Share URLs** — the wire format is `safeStringify → pako.deflate` (**raw zlib, NOT gzip** — confirmed by reading `sharelink.js`; "fixing" this to gzip breaks every existing link) `→ URL-safe base64`, plus the legacy uncompressed-`btoa` fallback branch (sharelink.js ~138–152), plus `safeStringify`'s object-dropping quirks — all of it is the contract. Golden fixtures are *generated by executing the old `sharelink.js` under Node* and committed; the codec ports byte-for-byte. Per-tool shape-upgrade functions with old-URL→new-state fixtures whenever a tool's internal state model changes (e.g. network-designer's Mantine `{name,index}` colors → hex).
3. **localStorage** — one-time migration shim maps all ~26 legacy keys (four naming conventions) to `rt:<toolId>:<slot>`; read-old-if-new-missing, write-new, never delete; shim stays **≥ 12 months** (the owner's own return cadence). Tested against an export of real production localStorage — saved networks are the most valuable user data in the app.
4. **SEO** — identical URLs; crawler-visible HTML strictly *improves* (real h1/content vs empty div). Gates: URL-by-URL rendered-meta diff against production before cutover; sitemap URL-set diff (lastmod derived from git history per tool dir, not build date); Search Console monitoring for 4–6 weeks after.
5. **Cloudflare Workers** — request/response schemas untouched until the final phase. Response-shape fixtures are captured from the **live** endpoints (repo-vs-deployed drift is proven — the deleted certificate worker still routes) and reused as MSW mocks so all five lookup tools are testable offline.
6. **Behavior at large** — characterization tests over the five pure cores (subnet allocator + Terraform generators, sharelink codec, markdown-table parse/format, data-converter tri-format, azure-kql template pipeline) written against the **old** code before anything moves, annotated `KEEP` vs `KNOWN-BUG` at capture time. Every deliberate divergence updates its fixture in the same PR and is logged in `BEHAVIOR_CHANGES.md`.

---

## Phases

Rules that hold throughout: main is always deployable; after Phase 2 starts, only P0 fixes touch unported code (freeze rule); every replaced duplicate is deleted in the PR that replaces it; boundaries lint (tools import only `core/`, `primitives/`, their own folder; only the registry reads manifests; no tool-to-tool imports).

### Phase 0 — Stabilize the live site (2–3 weekends, ships to prod immediately)

1. **CI first:** GitHub Actions running lint + test + build on PR (the repo has no `.github/` at all today).
2. **Characterization tests** (Vitest) over the five pure cores; golden share-URL fixtures generated from old `sharelink.js`; live worker fixtures → MSW mocks.
3. **Fix the five confirmed live bugs, each its own PR:** microsoft-portals `undefined/...` base URL (24 of 31 Azure links broken today — one-liner), azure-kql store not wrapped in `persist()` (history/favorites silently lost), markdown-table undo/redo off-by-one + literal `'\t'` CSV delimiter, sharelink's un-imported Mantine `notifications` ReferenceError, password generator on `Math.random()` → `crypto.getRandomValues` (the home-page widget already does it right).
4. **Dead-code purge (~3,500 lines), build-verified per PR:** the entire azure-kql parallel Shadcn stack (~2,980 lines, unrouted), `cron.js` TODO stubs, `_iconImports.js`/`toolsUtils.js`/`generateSitemap.js` dead chain, ui-demo, certificate-chain-analyzer remnants in `apiConfig.json` and docs.
5. **Dependency purge (verified zero imports):** dayjs, framer-motion, d3-force, @svgdotjs/svg.js, next-themes, tailwindcss-animate, uuid, autoprefixer. Fix CLAUDE.md's dependency section, which currently instructs agents that several of these are in use.

*Abandonment check: stopping here still leaves the repo strictly better — tested, CI'd, five bugs fixed, 3,500 lines lighter.*

### Phase 1 — Design the redesign (1 weekend) — **DONE**

The gap every judge flagged: no proposal actually *designs* the new look — all deliver "fresh" as a side effect of regenerating shadcn. Before any porting: pick one dark palette (today Blueprint-light vs Solarized-dark are two different design languages — decide, once); define semantic status tokens (`--color-success/-warning/-info` + foregrounds) and ban raw palette classes (`bg-green-50`) in tools via ESLint; typography scale, spacing density, tool-page rhythm (h1 + description + action slot + card structure), home-page identity; self-hosted Inter (makes the privacy claim true); focus-visible fixed to `var(--color-ring)`; `prefers-reduced-motion` wrapping all ambient animation. Output: a one-page design spec + the actual `globals.css` token layer the shell will use.

**Outcome: the first attempt was rejected and redone.** Worth recording in full, because the
failure was structural rather than a matter of taste.

*Attempt 1 — Solarized, both modes* (owner's call). Delivered `docs/DESIGN_SPEC.md` and a
rebuilt `globals.css`. Rejected on sight: *"I hate the look and colors — it all feels off and
disconnected."*

**The diagnosis: Phase 1 as originally written was scoped wrong.** It treated "pick a palette"
as *the* design decision and explicitly deferred home-page identity to Phase 6. But the site's
problem was never the palette — it was fifteen tools rendered identically in one hue, on a
layout with no hierarchy, with `category` and `shortDescription` sitting unused in
`toolsConfig.json`. Recolouring an undesigned layout yields a recoloured undesigned layout.
Two aggravating faults: Solarized is a *syntax* palette whose `base2`/`base3` were drawn as
editor background and go muddy across large UI surfaces; and `ToolHeader` accepts an
`iconColor` prop that fourteen tools pass and it never reads, so what colour variety existed
in the data was being thrown away.

*Attempt 2 — three directions pitched against the real 15 tools* (Console / Drafting /
Catalogue). Catalogue chosen, then **spoiled by rebuilding it rather than extending it** — the
ask was "add icons", and what came back changed palette, ground and typography too. Corrected
by keeping Catalogue's substance (six categories, real descriptions, quiet ground) and changing
only what was actually flagged: serif → sans, index rows → panels, icons integrated into cards.

**Final: [`DESIGN.md`](../../DESIGN.md)** — dark-first, panelled; Linear-grade surface,
Grafana-grade density. Validated with the official `@google/design.md lint`: **0 errors**.

**Lesson carried into Phase 2: composition is not a colour problem.** Hierarchy, density and
the category system get decided in the phase that builds `ToolLayout.astro` — not in a token
pass, and not deferred to the end.

### Phase 2 — Astro shell + legacy bridge → production (2–3 weekends)

**Opening move — reconcile the token layer with `DESIGN.md`.** Phase 1 left a known
inconsistency: `src/styles/globals.css` and `src/styles/tokens.contrast.test.js` still carry
the abandoned Solarized palette, and 63 of the 127 passing tests assert it. Deliberately not
fixed at the time, because Phase 2 rebuilds the shell anyway and doing it twice is waste.
Generate the `@theme` block (`pnpm dlx @google/design.md export DESIGN.md --format
css-tailwind`) rather than retyping it, and repoint the contrast test at the new token names —
keeping the test's *structure*, which is palette-independent and is what caught three real
contrast failures in the approved mockup.

**Then the composition work Phase 1 should have carried** (see the Phase 1 note above): the
tool-card grid, category grouping and filter chips, the stat strip, and the panel system —
all of it derived from `category` + `shortDescription` in the manifest. This is the phase where
the redesign becomes visible, so `ToolLayout.astro` is a design deliverable, not just plumbing.

Scaffold Astro 7 (React integration, Tailwind 4.3, regenerated primitives, theme via inline data-attr script — works before hydration, no provider). Build `ToolLayout.astro`, the registry, `[...tool].astro`, generated `_redirects`, `@astrojs/sitemap`, and `core/` (storage + migration shim, clipboard, download, cache, api client, history-with-undo with debounced persistence built in, sharelink verbatim).

**The bridge:** all 15 tools get thin bridge manifests whose islands lazy-load the *existing old components* nearly unchanged (old tree stays in the Tailwind content globs; token names stay shadcn-compatible, so old components render under the new theme — visual diffs are expected, it *is* a redesign; functional behavior is unchanged and smoke-tested).

**Gates before flipping production:** route-snapshot test green, Playwright deep-link matrix green on a Pages preview (this proves `_redirects` param handling early — the plan's riskiest platform assumption), share-URL fixtures decode, rendered-meta diff acceptable, exceljs dynamic-import smoke test (its `global: 'globalThis'` hack must be re-checked under the new toolchain).

*From here the redesigned shell — new nav, real h1s, prerendered HTML, new tokens — is live, and every subsequent weekend ships an increment.*

### Phase 3 — Simple tools (6) (≈3 weekends)

`base64` first as the pilot (deep link + share + clipboard — exercises every seam). **Its first task is extracting `lib/base64.js` and writing its suite — see [Deferred test coverage](#deferred-test-coverage--the-two-missing-suites) §B; the codec has no Phase 0 cover, and the `escape`/`unescape` UTF-8 path must be pinned before it is modernised.** Then password-generator, cron, jwt, buzzword-ipsum, markdown-table (adopts the shared history utility — undo fixed by construction). Per-tool PR checklist: move into `src/tools/<id>/`, real manifest replaces bridge manifest, delete the tool's SEO/header ritual + hand-rolled clipboard/download/storage code *in the same PR*, migrate storage keys, drop the Shadcn suffix, **draw the tool's bespoke icon and convert its raw palette classes to semantic tokens (flip the ESLint rule to `error` for that folder)**, dark/light manual pass, tests green.

### Phase 4 — The lookup family (5) on one hook (≈3–4 weekends)

Build `useLookupTool({toolId, fetcher, cacheTTL, maxHistory, urlParam})` — loading/error, TTL cache with eviction, history, deep-link-on-mount, toasts — then port dns-lookup, whois, ssl-checker, tenant-lookup, microsoft-portals. This deletes the six hand-rolled cache/history subsystems (structurally the same tool, written six times). Deliberate behavior changes, logged: ssl-checker's fabricated-certificate fallback is replaced with an honest "analysis unavailable — HTTPS connectivity verified" state; dns-lookup's OpenDNS option either becomes real OpenDNS DoH or is removed (today it silently queries Google).

### Phase 5 — Heavy tools (4) (≈4–5 weekends)

- **data-converter:** debounce validate-on-type (today: re-parses up to 3× and rewrites up to 5 MB of localStorage per keystroke), decouple history from auto-convert, move the ~450 lines of suggestion string tables to data files.
- **azure-naming:** provider moves inside the island (the root-mount bug dies structurally); rules engine + CAF data untouched under Phase 0 tests.
- **azure-kql:** port the *live* zustand implementation only (beware the naming trap: `AzureKQLTool.jsx` is real, the Shadcn-suffixed file was the dead one); make custom templates round-trip (today the Templates tab is write-only); fix the FILTER_PRIORITY case-mismatch that leaves filter ordering inert.
- **network-designer last** (highest risk, most user data, 2 weekends alone): **first task is extracting `lib/allocator.js` and writing its suite — see [Deferred test coverage](#deferred-test-coverage--the-two-missing-suites) §A. There is no Phase 0 cover for this code; nothing else in this tool should move until that suite is green,** including the differential test proving the two duplicate allocator copies agree. Then: split the 1,088-line monolith, fix the aligned-block CIDR-size bug (compute per-gap largest *aligned* block, not `floor(log2(gap))`), kill the multi-million-entry candidate arrays, stable subnet ids, hex colors (with the share-URL shape-upgrade function for old `{name,index}` payloads), @dnd-kit unchanged inside the island.

### Phase 6 — Finish (≈2 weekends)

Home page (static cards from registry + the password widget as a tiny island), storage-clear page driven by declared `storageKeys`, delete the old `src/` tree and @tabler (**by this point every tool has a bespoke icon, so @tabler has no remaining callers**), retire `docs/DESIGN_SPEC.md` once nothing references it, regenerate ARCHITECTURE/DEVELOPMENT/CLAUDE.md from the new code (tool inventories *generated* from the registry — ends the 13-vs-14-vs-15 drift; the current docs are half-Mantine and produce uncompilable code if followed), rewrite the workers README from source (the current one documents KV caching, rate limiting, and API keys that don't exist). Workers hygiene: shared CORS module, stop logging secrets/stack traces, wrangler-action deploy CI (diff live behavior per endpoint first — deployed drift is proven), decommission or re-source `certificate.russ.tools`. Search Console monitoring begins. Optional follow-ups, each its own PR, only if appetite remains: prismjs → shiki (port the custom KQL grammar), html2canvas → html-to-image, worker consolidation into one router, per-primitive Base UI swaps.

**Total: ~17–21 weekends, with production improving from weekend one and a visible redesign live from roughly weekend six.**

---

## Top risks

| Risk | Mitigation |
|---|---|
| Astro 7.0 is weeks old | Pin patch; Astro 6 fallback supports the identical architecture |
| `_redirects` param-route edge cases | Proven on a real Pages preview in Phase 2 before anything depends on it; fallback: `@astrojs/cloudflare` adapter with `prerender=false` for those routes only |
| Share-codec drift (the least forgiving contract) | Node-generated golden fixtures from old code, byte-for-byte port, legacy-btoa branch + `safeStringify` quirks pinned as fixtures |
| localStorage data loss (saved networks) | Never-delete migration, ≥12-month shim, tested on real production export |
| Old components under new tokens during the bridge | Same shadcn variable names; per-tool smoke + dark/light pass; visual diffs accepted as part of the redesign |
| **Design churn** — the direction was already rejected once | `DESIGN.md` is now a written, linted contract rather than taste held in someone's head. Anything new gets mocked against the **real 15 tools** and approved *before* it is built. Corollary learned the hard way: when feedback asks for one change, make that change — do not take it as licence to redesign. |
| **Token layer contradicts `DESIGN.md`** (globals.css + 63 tests still Solarized) | Known and recorded, not hidden — flagged in CLAUDE.md and in `DESIGN_SPEC.md`'s superseded banner. Fixed as Phase 2's opening move, by *generating* the `@theme` block from `DESIGN.md` rather than retyping it. |
| Solo-maintainer stall | Every phase ends shippable; a stall after Phase 2 still leaves a redesigned, working, live site |
| MPA remounts (SPA→MPA is observable) | zustand-persist covers cross-page state (matches current localStorage behavior); view-transitions deliberately out of scope |
| Characterization tests freeze bugs as spec | `KEEP` / `KNOWN-BUG` annotations + `BEHAVIOR_CHANGES.md` |

---

## Start here

**Phases 0 and 1 are done. Phase 2's shell, bridge and design-system work are done** —
every tool page mounts its real React component through `src/bridge/ToolIsland.jsx`, and
`src/components/ui/` is now one implementation of each component written against
`DESIGN.md`, so all fifteen tools share their card, button, input, select, tabs, dialog,
sheet, toaster, help affordance and icon set. Raw palette classes and off-scale typography
in tools are both at zero, enforced by ESLint.

**Read [Session 5](#2026-07-19--session-5-the-bridge-and-the-consistency-sweep) before
touching styling.** It records six faults, five of which were silent — three of them the
same underlying cause: DESIGN.md's token names collide with Tailwind's own scales, and
Tailwind resolves that quietly in its own favour. All three are fixed in
`scripts/generate-tokens.mjs` / `src/lib/utils.js` and pinned by tests. The rule that came
out of it: **`pnpm lint` proves a class was written; only the rendered DOM proves it was
applied.** Verify computed styles in a browser, not the source.

What remains in Phase 2:

1. **`core/`** — storage + the non-destructive migration shim (`rt:<id>:<slot>`,
   read-old/write-new, never delete — frozen contract #3), sharelink ported **verbatim**
   (frozen contract #2), clipboard, download, cache-with-TTL, api client.
2. **The two-column split.** `DESIGN.md`'s Layout section specifies a 320px control column
   beside a fluid result column, and `ToolLayout` already provides the `controls` slot —
   but bridged tools render everything into the default slot, so only password-generator
   has the shape, and it built its own grid. This is the largest remaining source of
   "this page looks different from that one".
3. **Theme toggle** in the shell (the pre-paint script exists; there is no control).
4. **`/delete`** storage-clear page, driven by declared `storageKeys`.
5. **The gates:** a real Pages preview deploy, the Playwright deep-link matrix against it,
   a rendered-meta diff against production, a sitemap URL-set diff, and the exceljs
   dynamic-import smoke test.
6. Carried from Phase 0: capture live worker response fixtures (ssl/whois/tenant) → MSW mocks.

<details>
<summary>Original Phase 0 starting steps (complete)</summary>

1. Phase 0.1: create `.github/workflows/ci.yml` (lint + build).
2. Phase 0.3 first PR: the microsoft-portals one-line base-URL fix — 24 broken links, live today.
3. Phase 0.2: Vitest + the sharelink round-trip suite with Node-generated golden fixtures (unblocks everything else).

</details>

---

## Phase 0 task board

Legend: `[x]` done · `[~]` in progress · `[ ]` not started.

- [x] Toolchain: adopt **pnpm** (machine blocks npm), pin `packageManager`/`engines`, make `build` script pnpm-native, add `pnpm-workspace.yaml` (`onlyBuiltDependencies: [esbuild]`)
- [x] CI: `.github/workflows/ci.yml` — install + test + build (blocking), lint (informational until Phase 1)
- [x] Vitest set up (`vitest.config.js`, `test`/`test:watch` scripts)
- [x] Characterization suite: **sharelink codec** — round-trips, legacy fallback, 4 v1 golden fixtures (11 tests, green)
- [x] Bug fix: **Microsoft Portals** `undefined/…` base URL → 24 Azure links restored (`PortalLinkGenerator.jsx`)
- [x] Bug fix: **sharelink** un-imported `notifications` ReferenceError removed (2 sites)
- [x] Rewrite **CLAUDE.md** to reality + plan-awareness (removes the dead-dep/14-tool/next-themes lies)
- [x] Bug fix: **azure-kql** wrap `useKQLStore` in `persist()` (history/favourites lost on refresh)
- [x] Bug fix: **markdown-table** undo/redo off-by-one + literal `'\t'` CSV delimiter
- [x] Bug fix: **Password Generator** → `crypto.getRandomValues` (+ unbiased Fisher–Yates shuffle)
- [x] Dead-code purge — 23 files / ~3,300 LOC, verified by transitive reachability (now zero unreachable files)
- [x] Dependency purge — 9 packages removed; `uuid` → `crypto.randomUUID`
- [x] Characterization tests — **64 tests / 7 files**: sharelink codec, markdown-table `csvParser` + `tableFormatter`, Terraform export (AWS/Azure/VCD), data-converter tri-format validators, Azure CAF naming rules, Microsoft Portals link generator
- [x] Bug fix (found while testing): **AWS Terraform export** emitted `cidr_block = "24"` (bare prefix length) — invalid Terraform
- [ ] **Two test sets still missing — see [Deferred test coverage](#deferred-test-coverage--the-two-missing-suites)**: the **subnet allocator** and **base64 codec**. Both are blocked on extraction, not on effort, and both are the *first* task of their respective ports.

**Carried into Phase 1 (small housekeeping, none blocking):**

- [x] Purge certificate-chain-analyzer remnants from `src/utils/api/apiConfig.json` (`certificate`, `hackertarget_ssl`) — neither key was referenced by any code
- [x] Investigate the 1 remaining ESLint parse-error file — **it was never a parse error**: an unused `eslint-disable` directive in `Base64ToolShadcn.jsx`, misreported because the old config had no `reportUnusedDisableDirectives` setting
- [x] Add `BEHAVIOR_CHANGES.md` ledger → [`docs/BEHAVIOR_CHANGES.md`](../BEHAVIOR_CHANGES.md)
- [x] Flip CI lint to blocking once the Phase 1 ESLint overhaul clears the 83 remaining errors
- [ ] Capture live worker response fixtures (ssl/whois/tenant) → MSW mocks — **still open, carried into Phase 2**; it is a prerequisite for testing the five lookup tools offline, not for the shell itself

---

## Phase 1 task board

**Design system — the durable output:**

- [x] **[`DESIGN.md`](../../DESIGN.md)** authored to the Stitch spec, `@google/design.md lint` clean (0 errors)
- [x] Direction settled: dark-first, panelled, six category hues, Inter + JetBrains Mono, no serif
- [x] Bespoke per-tool icon set specified (24px grid, 1.6px stroke, `currentColor`) — replaces the 15 `@tabler` wrappers
- [x] Every colour pair measured before being written down — **caught three real faults** (white-on-accent buttons at 1.67–2.72:1 in dark; light teal at 3.74:1; input border indistinguishable from a decorative hairline)
- [x] `docs/DESIGN_SPEC.md` marked **superseded**; CLAUDE.md records the inconsistency rather than hiding it

**Toolchain and a11y — unaffected by the palette reversal:**

- [x] ESLint: raw-palette ban (warn in tools, error in `ui/` + `layout/`)
- [x] ESLint: add `eslint-plugin-react`, drop `varsIgnorePattern`, clear **all** errors (0 remaining)
- [x] CI lint blocking
- [x] Self-host Inter (`@fontsource-variable/inter`); drop the Google Fonts `@import`
- [x] Fix `:focus-visible` (pointed at `hsl(var(--primary))`, a token that has never existed)
- [x] `prefers-reduced-motion` over all ambient animation
- [x] Merge the duplicate `global.css` into `globals.css`
- [x] Three latent bugs fixed: `useTLDs()` inside `try/catch` (×2), hooks called from a JSX IIFE

**Superseded by the reversal — done as Phase 2's opening move (session 4):**

- [x] `src/styles/globals.css` — regenerated from `DESIGN.md` via the CLI export (`pnpm generate:tokens` → `src/styles/tokens.generated.css`)
- [x] `tokens.contrast.test.js` — structure kept, repointed and extended; a new test asserts the generated file still matches `DESIGN.md`
- [x] Semantic status tokens — the names survive; the values are now derived from `DESIGN.md`

**Still deferred, deliberately:**

- [ ] Converting the 505 raw palette occurrences across 31 tool files — each tool converts during its own port, when it can be checked visually
- [ ] Spacing-density enforcement — `DESIGN.md` sets the 4px scale; snapping every component to it happens per port

---

## Phase 2 task board

- [x] **Opening move — token layer reconciled with `DESIGN.md`**, generated rather than retyped; two more contrast faults found and corrected in `DESIGN.md`
- [x] Self-host JetBrains Mono (DESIGN.md's data-only mono family)
- [x] Scaffold Astro 7.1.1 + `@astrojs/react` 6 + `@astrojs/sitemap` + Tailwind 4.3 alongside the Vite SPA, into `dist-astro/`
- [x] Bespoke icon set — 15 icons, 24px grid, 1.6px stroke, `currentColor` (`src/shell/icons.mjs`)
- [x] Manifest registry + plain-Node twin + contract test (which caught an invented deep-link route)
- [x] `ToolLayout.astro`, `BaseLayout.astro`, `[tool].astro`, `index.astro`, `404.astro`
- [x] Generated `_redirects` from manifest `params`
- [x] **Prove `_redirects` param handling** — all 8 rewrites correct against Cloudflare's runtime; the `@astrojs/cloudflare` fallback is not needed
- [x] The bridge — each manifest's `island` lazy-loads its existing component
- [x] Shared component layer rebuilt against `DESIGN.md` (`src/components/ui/`) — one card,
      button, input, select, tabs, dialog, sheet, tooltip, table, alert, badge; one toaster;
      one help affordance; one tool-icon source shared with the shell
- [x] Page furniture owned by the shell — `ToolHeader`/`SEOHead` stand down under it; pills,
      hero, stat strip and footer pitch removed
- [x] Raw Tailwind palette classes in tools: 205 → 0
- [x] Off-scale typography in tools → the `DESIGN.md` ten-step scale: 497 → 0, ESLint rule added
- [x] Shared `--cat` rule settled: **the accent acts, the category labels** — buttons,
      toggles, sliders and focus rings are `primary`; `--cat` keeps the icon tile, badges,
      borders, small type and the hover glow
- [x] `data-lg` type step added for the one artefact a tool exists to produce
- [x] Three silent token/merge collisions fixed and pinned by tests (`--spacing-*` vs
      Tailwind's container scale, `font-<scale>` vs the family namespace, `cn()` filing
      type steps as colours)
- [x] `core/` — storage + migration shim, sharelink verbatim, clipboard, download, cache, api client
- [x] Theme toggle in the new shell (three states, no island — the stored key already had three)
- [~] Two-column control/result split — **the rule is narrower than the plan assumed.**
      `ToolSplit` is built and lands on the five lookup tools + jwt; applied to four more
      it was rejected as unbalanced and reverted. See [Session 6](#2026-07-19--session-6-core-the-theme-control-and-the-split-half-landed).
      The Astro `controls` slot cannot carry it — controls and results share React state
- [ ] Remaining bespoke per-tool chrome (e.g. data-converter's `ControlPanel` header card)
- [ ] Last `@tabler` import in a tool file (`IconBrandTerraform`, no lucide equivalent)
- [ ] `/delete` storage-clear page driven by declared `storageKeys`
- [ ] Real Pages preview deploy + Playwright deep-link matrix
- [ ] Rendered-meta diff against production; sitemap URL-set diff
- [ ] exceljs dynamic-import smoke test under the new toolchain
- [x] Display vs SEO titles — display titles kept; SEO titles brought into line with them, pinned by tests

---

## Deferred test coverage — the two missing suites

Phase 0 characterized five pure cores (64 tests). **Two of the six named in frozen contract #6
are still uncovered**, and both for the same structural reason: the logic is not a module, it
is inline inside a large component, so there is nothing importable to test. Writing the tests
therefore *is* the extraction — which is why each is scheduled as the **first task of its own
port**, before any behaviour moves.

This matters more than the count suggests: these are the two cores whose failure modes are
silent. A broken allocator produces a plausible-looking but overlapping network plan; a broken
codec produces a string that looks like base64 and isn't.

### A. Subnet allocator (network-designer) — owed by Phase 5

**Where it lives now:** `src/components/tools/network-designer/NetworkDesignerShadcn.jsx`
(1,089 lines). The algorithm exists **twice**, and the two copies are not identical:

| Concern | Location | Notes |
|---|---|---|
| Primary allocator | `handleAddSubnet` (~L513) | first-fit, aligned; overlap-checks against sorted used ranges |
| Duplicate allocator | `handleReorderSubnets` (~L651, loop ~L680–715) | re-places *every* subnet after a drag reorder; has its own `safetyCounter`/`maxIterations` guard the primary lacks |
| Size picker | `SubnetForm.cidrOptions` (~L241) | decides which `/n` options the user is offered |

**Extract to** `src/tools/network-designer/lib/allocator.js` — pure, `netmask`-only, no React:

```js
export function allocateSubnet(parent, existingSubnets, prefixLength) // -> baseIp | null
export function availablePrefixLengths(parent, existingSubnets)       // -> number[]
export function reallocateAll(parent, orderedSubnets)                 // -> subnets[]
```

**Tests the suite must contain:**

1. **First-fit alignment** — into an empty `10.0.0.0/24`, a `/26` lands at `10.0.0.0`; the next `/26` at `10.0.0.64`; the next at `.128`.
2. **Gap reuse** — remove the middle subnet, and the next allocation of that size fills the hole rather than appending at the end.
3. **Alignment is enforced, not just size** — a `/25` must never be placed at `10.0.0.64`; only `.0` or `.128` are legal starts.
4. **Exhaustion** — returns `null` (today this surfaces only as a toast, so the contract is currently untested).
5. **Differential test between the two copies** — `reallocateAll(parent, [a,b,c])` must produce exactly the same placements as adding `a`, then `b`, then `c` sequentially. *This test is the whole point of the extraction:* it is the only thing that proves the duplicate implementations agree, and it will very likely fail first time.
6. **KNOWN-BUG to pin, then fix:** `cidrOptions` computes `32 - Math.floor(Math.log2(largestGapSize))` — it sizes options against the largest gap's **length while ignoring its alignment**. A 128-address gap starting at `.64` cannot hold a `/25`, but `/25` is still offered; selecting it then fails with "No available space for this subnet size." Capture the current (wrong) option list, then fix by computing, per gap, the largest *aligned* block that fits.
7. **Off-by-one in gap measurement:** middle gaps use `next.start - prev.end - 1`, but the trailing gap uses `parentEnd - lastEnd` (no `- 1`). Pin both, then reconcile.
8. **Performance guard:** both copies materialise every candidate address into an array before scanning (`for (addr = parentStart; …; addr += subnetSize) candidates.push(addr)`). For a `/8` parent with a `/30` subnet that is ~4M entries. Add a large-parent case that would be intolerably slow pre-fix, so the early-exit rewrite is verified rather than assumed.

### B. Base64 codec — owed by Phase 3

**Where it lives now:** `src/components/tools/base64/Base64ToolShadcn.jsx` (796 lines):

| Concern | Location |
|---|---|
| `encodeBase64(text, type)` | ~L219 — `standard` / URL-safe / `mime` |
| `decodeBase64(text, type)` | ~L248 |
| `isValidBase64` | ~L106 — separate standard and URL-safe regexes |
| Image signature detection | `FILE_TYPES` ~L40, `createImagePreviewUrl` ~L170 |
| Double-encoding detection | ~L416 |

**Extract to** `src/tools/base64/lib/base64.js` (pure; no DOM beyond `btoa`/`atob`).

**Tests the suite must contain:**

1. **Round-trip per mode** — `standard`, URL-safe and `mime`, for ASCII *and* multi-byte unicode (`café — ☕`).
2. **Pin the UTF-8 mechanism.** Encoding goes through `btoa(unescape(encodeURIComponent(text)))`. `escape`/`unescape` are deprecated and a future rewrite will reach for `TextEncoder` — which is **not** byte-identical for lone surrogates and other edge inputs. Pin the current output for a surrogate case *before* touching it, or the "cleanup" silently changes encoded output.
3. **URL-safe alphabet** — output contains no `+`, `/` or `=`, and decodes back to the original.
4. **MIME line breaks** — 76-character wrapping is present, and the decoder tolerates embedded whitespace/newlines.
5. **Validation** — accepts both standard and URL-safe input, rejects wrong-length and invalid-character strings.
6. **Image signature detection** — `/9j/` → JPEG, `iVBORw0KGgo` → PNG, and a non-image string is not misidentified.
7. **Deep-link contract** — `/base64/:input` decodes on mount. This is a frozen contract (#1) and currently has no test at any level.

### Why these were not simply done in Phase 0

Extracting either module is a real refactor of a large component with no test cover — exactly
the change the plan says must happen *inside* a port PR, with the tool's own smoke tests
around it, not as a drive-by during a stabilisation phase. Doing it early would have meant
refactoring the riskiest file in the repo (`NetworkDesignerShadcn.jsx`) with nothing to catch
a mistake. Listing them as blocked is the honest state, not a deferral of effort.

---

## Session Log

### 2026-07-19 — Session 1 (setup, toolchain, first fixes)

**Model:** Opus 4.8. **Branch:** `redesign/phase-0` (off `main`).

**Decisions**
- **Package manager: pnpm** (was an open question in the plan). This machine hard-blocks
  `npm` (aliased to an error) and ships pnpm 11 + Node 26; `package-lock.json` is gitignored
  (never tracked), so the "matches the npm lockfile" argument was moot. Committed
  `pnpm-lock.yaml`. This **supersedes** the plan body's "npm (matches the lockfile)" note.
- esbuild is the one dependency allowed to run its install script
  (`pnpm-workspace.yaml` → `onlyBuiltDependencies`; a local guardrail hook also records the
  approval under `allowBuilds`). Without it, `pnpm`'s pre-command dep check fails.

**Done**
- `package.json`: added `packageManager: pnpm@11.14.0`, `engines.node >=20`; changed `build`
  from `npm run generate:sitemap && …` to `pnpm generate:sitemap && …`; added `test` /
  `test:watch` scripts.
- `pnpm-workspace.yaml` created; `pnpm-lock.yaml` generated.
- Rewrote `CLAUDE.md` — accurate current-state (15 tools not 14, custom theme provider not
  next-themes, hand-maintained routes, dead utils flagged), frozen-contract list, pnpm
  commands, "do not re-adopt" dead-dep list, known-bugs list, and a pointer to this plan.
- `.github/workflows/ci.yml` — pnpm + Node 22; `pnpm install --frozen-lockfile`, `test`,
  `build` blocking; `lint` `continue-on-error` (96 pre-existing errors, cleared in Phase 1).
- Vitest 4.1.10 + `vitest.config.js` (node env). `src/utils/sharelink.test.js`: 11 tests
  green — round-trips (simple/nested/unicode), legacy uncompressed-base64 fallback, malformed
  input returns null, and 4 committed v1 golden encoded strings that must keep decoding.
  Confirmed the codec is **raw zlib deflate, not gzip** (frozen contract #2).
- **Bug fix — Microsoft Portals:** `PortalLinkGenerator.jsx` used `getApiEndpoint('external').azure_portal`,
  which is `undefined` (the helper returns a `{url,…}` wrapper). Changed to
  `getApiEndpoint('external', 'azure_portal').url`. Verified: 24/31 Azure portals were
  producing `undefined/…`; now 0. (Note for Phase 4: the no-tenant `.path` branch yields a
  cosmetic `//` double-slash — pre-existing, Azure tolerates it; clean up during the port.)
- **Bug fix — sharelink:** removed two `notifications.show(...)` calls (un-imported Mantine
  leftover) that threw `ReferenceError` on error paths; the existing `console.error` +
  `return null` is the intended behavior.

**State at session end**
- `pnpm test` → 11 passing. `pnpm build` → green (~4.7s). `pnpm lint` → 96 errors
  (baseline: 74 no-unused-vars, 15 exhaustive-deps, 15 react-refresh, 8 case-declarations,
  8 no-empty, 5 rules-of-hooks, 1 no-undef remaining, 1 parse error) — all Phase-0/1 cleanup.
- Nothing committed yet (awaiting owner review). Working tree on `redesign/phase-0`.

**Next session**
- Commit this foundation, then continue Phase 0 bug fixes: azure-kql `persist`, markdown-table
  undo/`\t`, password-generator crypto. Add characterization tests alongside each core before
  touching it. Investigate the 1 ESLint parse-error file. Then begin the dead-code purge.

### 2026-07-19 — Session 1 (continued): remaining bug fixes + the purges

**Model:** Opus 4.8. Committed as 8 commits on `redesign/phase-0`.

**Bug fixes (each its own commit)**
- **azure-kql `persist`:** the store imported `persist` but was never wrapped in it, so
  `queryHistory` / `favorites` / `customTemplates` died on every reload. Wrapped and
  `partialize`d to those three durable slices (selection + generated query stay transient),
  keyed `rt:azure-kql:store` — already in the redesign's target namespace, so it needs no
  later migration.
- **password-generator:** replaced all six `Math.random()` draws with `secureRandomInt`
  (rejection sampling over `Uint32Array` to avoid modulo bias) and swapped the
  `sort(() => Math.random() - 0.5)` shuffle — which is neither secure nor unbiased — for
  Fisher–Yates.
- **markdown-table undo/redo:** root cause was that history recorded the state *before* each
  change and started empty, so `history[historyIndex]` was never the state on screen: `undo`
  jumped two steps back and the newest state was never stored at all. Fixed by seeding history
  with the initial state and recording the *resulting* state after each change — which makes
  the existing `undo`/`redo` symmetrical without touching them — plus a correct overflow cap.
- **markdown-table tab export:** `<SelectItem value="\t">` — JSX attribute literals don't
  process escapes, so "Tab" exported a literal backslash-t. Now `value={'\t'}`.

**Purges (verified, not assumed)**
- Wrote a transitive-reachability analyser (scratchpad) rather than trusting grep. First run
  reported 126 dead files — obviously wrong (it flagged live files), because the regex missed
  `lazy(() => import(...))`, so every lazily-routed tool cascaded. After fixing: **22 files /
  3,241 LOC genuinely unreachable**, matching the audit's ~3,500 estimate. Deleted those plus
  `demo.jsx` and its `/ui-demo` route (23 files). Post-purge the analyser reports **zero**
  unreachable files. Confirmed no `import.meta.glob` exists, so static analysis is complete.
- Removed 9 unused dependencies. **Gotcha:** removing `@svgdotjs/svg.js` broke the build —
  `vite.config.js` `manualChunks` still listed it as a chunk entry, which becomes a hard
  "Could not resolve entry module" error once the package is gone. Removed that entry.

**State at session end**
- `pnpm test` → 27 passing (2 files). `pnpm build` → green (~4.6s). `pnpm lint` → 94 errors.
- 8 commits on `redesign/phase-0`, working tree clean. Not pushed; no PR opened yet.
- Untracked `.gitattributes` is auto-generated by the local graphify hook (merge driver for
  the gitignored `graphify-out/`) — intentionally left untracked.

**Next session**
1. Finish the Phase 0 characterization tests — highest value first: **subnet allocator**
   (network-designer is the riskiest port and carries the most user data), then
   `tableFormatter`, data-converter tri-format, azure-naming rules, base64.
2. Purge the certificate-chain-analyzer remnants from `apiConfig.json` + docs.
3. Chase the single ESLint parse-error file, then decide whether to start Phase 1
   (toolchain to Vite 8 / ESLint 10 + flip CI lint to blocking) or go straight to the
   Phase 1 design pass.

### 2026-07-19 — Session 1 (continued): characterization suite + a third bug

Branch pushed to `origin/redesign/phase-0` (12 commits). Suite now **64 tests / 7 files**.

**Method:** rather than guessing expected values, I probed each real module and wrote the
observed output into assertions — characterization, not aspiration. The throwaway probe was
deleted afterwards.

**Covered:** sharelink codec · markdown-table `csvParser` + `tableFormatter` · Terraform
export (AWS/Azure/VCD) · data-converter tri-format validators · Azure CAF naming rules ·
Microsoft Portals link generator.

**Third live bug found (and fixed) while writing them — AWS Terraform export.** Subnets are
stored as `{ base: '10.0.1.0', cidr: 24 }` where `cidr` is the prefix *length*.
`generateAzureTerraform` resolved that correctly via a 4-branch chain, but
`generateAwsTerraform` interpolated `subnet.cidr` directly, so **every AWS subnet exported as
`cidr_block = "24"`** — invalid Terraform that would fail `terraform plan`. The two generators
silently disagreed on the subnet contract. Fixed by extracting Azure's chain into a shared
exported `resolveSubnetCidr()` used by both; Azure output is unchanged for real inputs.

**Two behaviours pinned deliberately (they will bite the port):**
- The JSON parser (`json-parse-even-better-errors`) attaches `Symbol(newline)` /
  `Symbol(indent)` metadata to parsed objects, so `toEqual` against a plain object fails.
- **`@ltd/j-toml` returns TOML integers as `BigInt`**, and `JSON.stringify` throws on BigInt.
  Any TOML→JSON conversion path in the redesign must coerce these.

**Not testable without extraction** (honest gap, deferred to their ports): the **subnet
allocator** is inline in `NetworkDesignerShadcn.jsx` (and duplicated twice), and **base64**
round-trip logic is inline in `Base64ToolShadcn.jsx`. Testing either means doing the
extraction that Phase 3/5 already schedules, so they are listed as blocked rather than done.
Both are now specified in full — locations, extraction signatures, and the exact cases each
suite must contain — under **[Deferred test coverage](#deferred-test-coverage--the-two-missing-suites)**,
and are wired in as the *first task* of Phases 3 and 5 respectively. Writing that section also
caught a stale claim in the plan body: Phase 5 previously said the allocator would be extracted
"under the Phase 0 characterization tests", which was never true — no such tests exist.

**State:** `pnpm test` → 64 passing · `pnpm build` → green (~4.7s) · `pnpm lint` → 83 errors
(down from 98 at the session start, mostly via the dead-code purge).

**Resolved:** the `git remote` pointed at the old `subnet-fit` URL; Russ has repointed it at
`git@github.com:russmckendrick/russ-tools.git`. Branch `redesign/phase-0` is pushed. No PR
opened — deliberate, this stays a branch for now.

### 2026-07-19 — Session 2: Phase 1 (design pass + ESLint to zero)

**Model:** Opus 4.8. **Branch:** `redesign/phase-0`. Phase 1 complete.

**Decision — Solarized in both modes** (owner's call). The alternatives offered were
Blueprint-both-ways and neutral-slate. This retires the Blueprint light theme; the light
mode is now Solarized-light (`base2` page, `base3` cards). Ambient home-page motion is
kept as-is but disabled under `prefers-reduced-motion` (also the owner's call).

**The finding that shaped the token layer.** Raw Solarized accents are **not usable as
text** on the surfaces this app puts them on — measured on the light card: green 2.97:1,
cyan 2.93:1, yellow 2.98:1, blue 3.41:1. Dark fails in the mirror image (red, orange,
violet, magenta all 2.8–3.0:1 on `base02`). So semantic tokens are *derived*: each accent
is pulled toward `base03` (light) or `base2` (dark) until it clears 4.5:1 on the page, on
a card, **and on its own subtle tint**. The untouched ramp stays exposed as
`--color-solar-*` for decoration, where 1.4.11 does not apply.

Consequence worth remembering: **`--color-ring` cannot be one value.** No blue clears 3:1
against both a light card and a dark card — the darkened one is 2.36:1 on dark cards, the
lightened one 2.72:1 on light cards. Light and dark ring values are permanently distinct.

**Three latent bugs found and fixed while doing this:**

1. **`:focus-visible` has never worked.** The rule was `outline: 2px solid hsl(var(--primary))`,
   but this codebase has no `--primary` (tokens are `--color-*`) and its values are hex/oklch,
   not HSL triplets. The declaration was invalid, so every focus ring fell back to the UA
   default. Now `var(--color-ring)`.
2. **`useTLDs()` was called inside a `try/catch`** in both dns-lookup and whois. The hook
   handles its own load failures and cannot throw synchronously, so the catch could never
   help — but had it ever fired, it would have changed the hook count between renders and
   crashed React. Removed.
3. **NewHomeView called `useRef`/`useState`/`useEffect` from inside an IIFE embedded in JSX.**
   It worked only because the IIFE happened to run unconditionally on every render. Extracted
   to a real `ToolIconGrid` component.

**The `varsIgnorePattern` story (the plan had this wrong).** The plan said to drop
`varsIgnorePattern: '^[A-Z_]'` because it "hides dead imports". It does — but that was not
why it was there. Without `eslint-plugin-react`'s `jsx-uses-vars`, ESLint cannot tell that
JSX *uses* an imported component, so every PascalCase import looks unused. Dropping the
pattern alone produced **1,273** false positives. Adding the plugin first gave the true
number: **137 errors**, of which ~54 were genuinely dead PascalCase imports the pattern had
been masking. All 137 are now fixed; `pnpm lint` is at **0 errors** and CI lint is blocking.

Similarly, the "1 remaining ESLint parse-error file" from Session 1 was **not a parse error** —
it was an unused `eslint-disable` directive in `Base64ToolShadcn.jsx`, misreported because the
old config never set `reportUnusedDisableDirectives`.

**Also done**
- Merged `global.css` into `globals.css`. Two near-identically-named stylesheets, one of which
  silently loaded first, was a standing footgun.
- Self-hosted Inter via `@fontsource-variable/inter`; dropped the Google Fonts `@import`. The
  site's "nothing leaves the browser" claim is now true on first paint. Verified: zero
  `googleapis` references remain in `dist/`.
- Added a `prefers-color-scheme` fallback on `:root:not(.light)` so first paint matches the OS
  before the theme provider mounts. `tokens.contrast.test.js` asserts it stays in sync with
  `.dark` — they are duplicated by necessity (a media query cannot reuse a class block).
- Raw-palette ESLint ban: **warn** in `src/components/tools/**` (505 occurrences, 31 files),
  **error** in `src/components/ui/**` and `src/components/layout/**`. Each tool flips to error
  as it is ported.
- Purged the certificate-chain-analyzer remnants from `apiConfig.json` (neither `certificate`
  nor `hackertarget_ssl` was referenced by any code).
- Added `docs/BEHAVIOR_CHANGES.md` with the `convertToCSV` KNOWN-BUG plus the two allocator
  bugs owed by Phase 5, and the three deliberate Phase 4/5 changes pre-declared so they are
  not mistaken for regressions.

**Notes for the ports (found in passing, not fixed)**
- `ToolHeader` accepts an **`iconColor` prop that 14 tools pass and it never reads**. Drop the
  prop at each tool's port, not in a drive-by.
- `dns-lookup` and `whois` compute autocomplete suggestions into state that **nothing renders**
  (`_autocompleteData`). Either wire up the autocomplete or delete the machinery during the
  Phase 4 lookup-hook port.
- `ToolHeader`'s alert slot was the one piece of shared chrome using raw palette classes; it is
  converted to `bg-info-subtle`/`text-info`/`border-info` as the worked example of the new
  contract.

**State at session end**
- `pnpm test` → **127 passing / 9 files** (64 characterization + 63 token-contrast).
- `pnpm build` → green (~4.6s). `pnpm lint` → **0 errors**, 234 warnings (205 raw-palette,
  15 react-refresh, 14 exhaustive-deps).
- Commits on `redesign/phase-0`; not pushed.

**Next session — Phase 2 (Astro shell + legacy bridge)**
1. Scaffold Astro 7 + `@astrojs/react` + Tailwind 4.3 alongside the existing Vite app.
2. Build the manifest registry, `ToolLayout.astro`, `[...tool].astro`, generated `_redirects`.
3. **Prove `_redirects` param handling on a real Pages preview early** — it is the plan's
   riskiest platform assumption (top-risks table).
4. Carry over: capture live worker response fixtures → MSW mocks.

### 2026-07-19 — Session 3: the design reversal, and DESIGN.md

**Model:** Opus 4.8. **Branch:** `redesign/phase-0`. Phase 1's design output was rejected,
redone, and has landed as a linted contract. Toolchain work from Session 2 was unaffected.

**What happened, in order**

1. Session 2 shipped Solarized (`DESIGN_SPEC.md` + rebuilt `globals.css`). Owner's verdict on
   seeing it live: *"I hate the look and colors — it all feels off and disconnected."*
2. Diagnosis (see the Phase 1 section for the full version): **the palette was never the
   problem.** Phase 1 rebuilt the token layer and left composition untouched — 15 tools in one
   hue, no hierarchy, `category` and `shortDescription` unused, an unlabelled icon map, ~700px
   of dead page. Correct colours on an undesigned layout still look undesigned.
3. Pitched **three directions** — Console (dark command palette), Drafting (engineering
   drawing), Catalogue (typographic index) — each rendering the real 15 tools so the comparison
   was concrete rather than a mood board. Catalogue chosen.
4. **Then made it worse.** Asked to add icons to Catalogue, I rebuilt it: new ground, new
   palette, serif display, ruled plates, "specimen" device. Verdict: *"that looks horrible"*.
   The lesson is exact and worth keeping: *when feedback asks for one change, make that change.*
   A request for icons is not licence to redesign.
5. Reset, asked directly what was wrong and for reference points. Answers: **not** the colours
   and **not** light mode; **yes** the serif typography and the bare index rows. References:
   **Linear/Raycast** and **Grafana/Datadog**. That resolved cleanly into a brief — keep
   Catalogue's substance, change only what was flagged, finish it to Linear's standard with
   Grafana's density. Approved: *"a lot better"*.
6. Wrote **[`DESIGN.md`](../../DESIGN.md)** to the
   [Stitch spec](https://stitch.withgoogle.com/docs/design-md/specification).

**On DESIGN.md**

Two layers: YAML design tokens (40 colours, 10 typography scales, 5 radii, 9 spacing tokens,
12 components) and prose rationale, in the spec's eight canonical sections, with `Iconography`
and `Accessibility` appended as extension sections.

Validated with the official CLI — `pnpm dlx @google/design.md lint DESIGN.md` → **0 errors**.
The 35 warnings are two deliberate kinds: 28 tokens not referenced by any component
(unavoidable for theme variants and six category hues) and 7 uses of `borderColor`, which the
spec itself documents as accept-with-warning and which a flat border-driven design cannot
express without.

The CLI also exports Tailwind 4 `@theme` directly, which is the format `globals.css` already
uses — **so the token layer becomes generated output, not a hand-maintained copy that drifts.**

**Measuring the palette before writing it down caught three real faults in the approved mockup**

- **White labels on filled buttons fail in dark mode** — 1.67–2.72:1 across every accent. The
  mockup did exactly this. `DESIGN.md` mandates near-black labels on accent fills in dark,
  white in light.
- Light-theme teal was **3.74:1** as text; darkened to `#0f766e` (5.47:1).
- The faint text step failed in both themes, and one border token was doing two incompatible
  jobs. Split into decorative `outline` and `outline-strong` (≥3:1, for control boundaries).

This is the Phase 1 method surviving the palette change: derive accessible values, measure, and
enforce with a test. That part was right even though the palette was wrong.

**Recorded rather than hidden**

`globals.css` and `tokens.contrast.test.js` still carry Solarized — 63 of the 127 passing tests
assert an abandoned palette. Deliberately not fixed now (Phase 2 rebuilds the shell anyway), but
`DESIGN_SPEC.md` carries a superseded banner and CLAUDE.md states the inconsistency outright.
This repo has been burned before by docs that lied to agents; a known-stale file with a warning
is safe, a silently-wrong one is not.

**Notes for the ports**
- `ToolHeader`'s `iconColor` prop — 14 tools pass it, it is never read. Colour now derives from
  `category`; drop the prop per tool during its port.
- The 15 "custom" tool icons are all thin `@tabler` wrappers. `DESIGN.md` specifies a bespoke
  set (24px grid, 1.6px stroke, `currentColor`); drawing each tool's icon is part of its port.

**State at session end**
- `pnpm test` → **127 passing / 8 files** · `pnpm lint` → **0 errors**, 234 warnings ·
  `pnpm build` → green.
- Commits on `redesign/phase-0`, working tree clean, not pushed.
- Design mockups live as Claude artifacts (three-direction pitch; approved panelled direction),
  not in the repo — `DESIGN.md` is the durable artefact.

**Next session — Phase 2.** See [Start here](#start-here); the token reconciliation is the
opening move, then the Astro scaffold and the `_redirects` proof on a Pages preview.

### 2026-07-19 — Session 4: Phase 2 opening — tokens, Astro shell, `_redirects` proof

**Model:** Opus 4.8. **Branch:** `redesign/phase-0`. Three commits; tree clean, not pushed.

**1. The token layer is now generated, not retyped.**

`pnpm generate:tokens` runs the official `@google/design.md` exporter over `DESIGN.md` into
`src/styles/tokens.generated.css`. `globals.css` does only the two jobs the exporter cannot:
switch the light peers in, and alias the shadcn token names the un-ported components still
render against.

The alias trick worth remembering: aliases are declared **by reference**
(`--color-card: var(--color-surface-raised)`), not by value, so the light-mode block remaps
twenty DESIGN.md tokens and every shadcn alias follows automatically. Verified against the
compiled output that Tailwind 4 does not tree-shake the `-light` peers, which the whole scheme
depends on.

**Measuring before writing down caught two more faults** — both `DESIGN.md` failing *its own*
stated 3:1 / 4.5:1 floor, and both only visible when checked against the **inset** surface
rather than only against white:

| Token | Was | Failed at | Now |
|---|---|---|---|
| `on-surface-faint-light` | `#6b737d` | 4.48:1 on `surface-inset` | `#69717b` (4.61:1) |
| `outline-strong-light` | `#8b939d` | 2.90:1 on `surface-inset`, 2.98:1 on the page | `#838a94` (3.25 / 3.34:1) |

Corrected in `DESIGN.md` itself, with a note recording why — this is applying the contract's
own rule, not overriding it. That makes **five** real contrast faults this method has caught
across two sessions.

The contrast test keeps its structure and gains: resolution of alias indirection, the
three-step text ramp on all three surfaces, every category hue as text in both themes, control
boundaries on the inset, and — importantly — a guard that `tokens.generated.css` still matches
`DESIGN.md`'s front matter, so a forgotten regenerate fails the build rather than drifting.

JetBrains Mono is now self-hosted alongside Inter, per DESIGN.md's data-only mono rule.

**2. Astro scaffolds alongside the SPA; the registry is real.**

Astro 7.1.1 + `@astrojs/react` 6 + `@astrojs/sitemap` + `@tailwindcss/vite` 4.3, into
`dist-astro/`. Nothing removed — `pnpm dev`/`pnpm build` still serve the live React app,
`pnpm dev:astro`/`pnpm build:astro` serve the shell.

Fifteen bridge manifests in `src/tools/<id>/manifest.mjs`; `registry.mjs` globs them and drives
`getStaticPaths`, the index, the category groups and `_redirects`. There is a second, plain-Node
loader (`loadManifests.mjs`) because build scripts run outside Vite where `import.meta.glob`
does not resolve; the contract test asserts the two agree, so the duplication cannot drift.

**The contract test earned its place immediately.** It failed on first run because I had given
`dns-lookup` a `:domain` param. The approved mockup shows a `/dns-lookup/:domain` badge — but
`App.jsx` has never served that route. The mockup was aspirational, the manifest was wrong, the
test was right. It reads the router table **out of `App.jsx`** rather than a hand-copied list,
and asserts the registry serves every route the SPA serves today *and adds none*.

**`ToolLayout.astro` is the visible redesign.** Every tool page is now prerendered HTML with a
real `h1`, its own description and schema.org markup — against today's empty div with no `h1`.
Breadcrumb, category icon tile, badges, and the 320px control column beside a fluid result
column, all from the manifest. The category hue is set once and inherited, so nothing
downstream knows which of the six it is. The index carries the approved composition: stat strip,
filter chips, category groups, panelled cards with the hue-tinted hover glow. The bespoke icon
set (15 icons, 24px grid, 1.6px stroke, `currentColor`) is in `src/shell/icons.mjs`.

The island slot is deliberately empty — the bridge is the next step.

**Trap found:** `react({ include: ['**/tools/**'] })` hands every *stylesheet* under
`src/components/tools/` to the JSX transform. It only surfaces in `astro dev`; the production
build is clean, which makes it a nasty one. React is the sole island framework, so the filter
is unnecessary — drop it.

**3. `_redirects` param handling: proven, and it works.**

Run against Cloudflare's own runtime (`wrangler pages dev dist-astro`), which parsed all 8 rules
and served them correctly. **All eight param deep links 200-rewrite with the URL intact and no
redirect**, including the two-segment `/azure-kql/:service/:template`:

```
/ssl-checker/example.com      200  -  SSL Certificate Checker
/whois-lookup/example.com     200  -  WHOIS Lookup Tool
/base64/SGVsbG8gd29ybGQ%3D    200  -  Base64 Encoder/Decoder
/jwt/<a real HS256 token>     200  -  JWT Decoder/Validator
/microsoft-portals/contoso…   200  -  Microsoft Portals (GDAP)
/tenant-lookup/contoso.com    200  -  Microsoft Tenant Lookup
/azure-kql/azure-firewall     200  -  Azure KQL Query Builder
/azure-kql/azure-firewall/network-rules  200  -  Azure KQL Query Builder
```

**The plan's riskiest platform assumption holds.** The `@astrojs/cloudflare` fallback in the
top-risks table is not needed.

**A real bug the proof exposed:** with no `404.astro`, an unknown path returned **200 and the
index page** — a soft 404, precisely the shape frozen contract #4 exists to catch. Fixed; now a
genuine 404 with suggested tools.

*Caveat, honestly stated:* this is Cloudflare's runtime run locally, not a deployed preview.
`wrangler` is not authenticated on this machine, and deploying is the owner's call. The
remaining risk is small — `_redirects` parsing and rewrite semantics are the emulated part —
but a real preview should still be run before production depends on it.

**State at session end**
- `pnpm test` → **254 passing / 9 files** (was 127) · `pnpm lint` → **0 errors**, 234 warnings
- `pnpm build` (SPA) green · `pnpm build:astro` green, 17 pages
- 6 commits on `redesign/phase-0`, working tree clean, not pushed.

**Title question — resolved.** Raised as an open question (the index reads "DNS Lookup Tool"
where the mockup used "DNS Lookup"); the owner's call was to leave display titles alone and
bring the **SEO** titles into line with them. Five diverged — the card said "Network Designer"
while the SERP said "Network Subnet Designer" — which reads as two products. The rule is now
*SEO title = display title, optionally + " - " + earned keywords*, with no keyword lost (each
dropped term folded into the tail or already in `seoKeywords`) and all fifteen inside Google's
~60-character width. Two tests pin it, including one asserting each manifest mirrors its
`toolsConfig.json` entry while both registries are live. Also normalised
markdown-table-tool's `seoKeywords`, which was a comma-separated string where every other entry
is an array.

**Next session — Phase 2 continued**
1. The bridge: each manifest's `island` lazy-loads its existing component into `ToolLayout`.
   The seams to expect are react-router (`useParams`/`Link`), `ThemeProvider`, and `ToolHeader`.
2. `core/`: storage + migration shim, sharelink verbatim, clipboard, download, cache, api client.
3. A real Pages preview deploy, then the Playwright deep-link matrix against it.
4. Still carried over from Phase 0: live worker response fixtures → MSW mocks.

### 2026-07-19 — Session 5: the bridge, and the consistency sweep

**Model:** Opus 4.8. **Branch:** `redesign/phase-0`.

**1. The bridge landed, and the three predicted seams all closed cheaply.**

`src/bridge/ToolIsland.jsx` mounts any tool's existing component into
`ToolLayout.astro`. The plan predicted react-router, `ThemeProvider` and
`ToolHeader`; the actual resolutions were smaller than expected:

- **react-router** — rather than editing the nine tools that call `useParams`,
  the island mounts a real `BrowserRouter` whose routes are *generated from the
  manifest's `params`* — the same source `_redirects` comes from, so a deep link
  cannot match in one place and miss in the other. Zero tool edits.
- **ThemeProvider** — not needed at all. The theme is a class on `<html>` from
  BaseLayout's pre-paint script, and no tool consumes `useTheme`.
- **ToolHeader / SEOHead** — a React context (`ShellContext`), not a global, so
  the SPA is untouched: `useShell()` is `null` there. Under the shell both stand
  down, which is what removed the floating-globe artifact and the second `h1` on
  fourteen pages.

`client:only` rather than `client:load`: these components read `localStorage` and
`window.location` on first render, and the crawler-visible content comes from
ToolLayout, not the island.

**2. "Make it consistent" turned out to be mostly one file each.**

The owner's brief — *help, modals, forms, dropdowns, buttons, icons and toaster
usage 100% consistent; remove as much bespoke per-tool design as possible* —
resolved to changing shared components rather than fifteen tools, because 48
files already render `ui/card` and 47 `ui/button`. That layer is now written
against `DESIGN.md`, and the single highest-leverage change was making the
primary button, focus ring, active tab and default badge take `var(--cat)`:
ToolLayout sets it once per page from the manifest, so Network Designer's actions
are teal and Microsoft Portals' violet **without either tool naming a colour**.

One toaster (both apps import it), one help affordance, one tool-icon source
shared with the prerendered shell.

**3. Four real faults, three of them live in production.**

| Fault | Effect | Where it came from |
|---|---|---|
| `.grid` in `shell.css` collided with Tailwind's `grid` utility | every `grid grid-cols-*` **inside every tool** became a 3-column grid | unprefixed shell classes; now all `rt-` |
| `.shell` centred with `margin: 0 auto` inside a column flex `body` | `main` shrink-to-fit — the page rendered at 508px in a container claiming 1120px | session 4 |
| `--spacing-lg` shadowed Tailwind's *container* scale | `max-w-lg` meant 16px, `max-w-3xl` 48px — **every dialog in both apps was a sliver** | session 4's token generation |
| `font-title-sm` set `font-family: "Inter"` (not the self-hosted `"Inter Variable"`) | headings fell back to the browser default **serif**, in a system that bans serif | this session's own shared-layer rebuild |

The last three were invisible until the bridge put real tool bodies on the page,
which is the argument for bridging early rather than porting tool-by-tool first.

**The pattern worth carrying:** DESIGN.md's token *names* (`lg`, `2xl`,
`title-sm`) collide with Tailwind's own scales when emitted into Tailwind's
namespaces. The fix is in `scripts/generate-tokens.mjs`, never in DESIGN.md —
spacing moves to `--rt-space-*`, and each type step folds into one `--text-*`
token carrying its weight, line-height and tracking, with the per-step family
tokens deleted so the ambiguous `font-<scale>` cannot exist. Both are guarded by
tests, because both were silent.

**4. Lesson repeated from Phase 1, in a new costume.** The palette sweep mapped
raw classes to semantic tokens mechanically, which faithfully preserved a fault
it also made obvious: status colours were carrying *identity*. "Barracuda"
rendered as an error, "SPF record" and "TOML" and "Hybrid" as warnings, a
favourited star as a warning. Identity is `--cat` or neutral; DESIGN.md now says
so with the examples, because the mapping table alone would reproduce it.

**5. Six faults, five of them silent, and the pattern connecting them.**

| Fault | Effect | Caught by |
|---|---|---|
| `.grid` collided with Tailwind's `grid` utility | every `grid grid-cols-*` **inside every tool** became a 3-column grid | owner spotted the wrapped tab bar |
| `.shell` auto-margin in a column flex `body` | `main` shrink-to-fit — page rendered at 508px in a 1120px container | measuring geometry, not the screenshot |
| `--spacing-lg` shadowed Tailwind's *container* scale | `max-w-lg` = 16px, `max-w-3xl` = 48px — **every dialog in both apps a sliver** | testing the help panel |
| `font-title-sm` set `font-family: "Inter"` (not `"Inter Variable"`) | every heading fell back to the browser default **serif** | owner: "header fonts are horrible" |
| **`cn()` classified every type step as a colour** | tailwind-merge **deleted the size class**; the whole type scale was in the source and absent from the DOM | owner selected a Label and its class list was short |
| Select copied the Input contract verbatim | `h-9` clipped two-line options, `font-mono` set prose in mono | owner: "this looks terrible" |

**The connecting pattern, worth carrying into every later phase:** DESIGN.md's
token *names* (`lg`, `2xl`, `title-sm`, `body-sm`) collide with Tailwind's own
scales, and Tailwind resolves the collision silently and in Tailwind's favour.
Three separate bugs, one cause. The fixes belong in
`scripts/generate-tokens.mjs` and `src/lib/utils.js`, never in DESIGN.md — and
each is now pinned by a test, because **every one of these failed silently**:
lint was clean, the classes were in the files, the builds were green.

Corollary: `pnpm lint` proves a class was *written*. Only the rendered DOM
proves it was *applied*. Check computed styles in the browser, not the source.

**6. Lesson repeated from Phase 1, in a new costume.** The palette sweep mapped
raw classes to semantic tokens mechanically, which faithfully preserved a fault
it also made obvious: status colours were carrying *identity*. "Barracuda"
rendered as an error, "SPF record" and "TOML" and "Hybrid" as warnings, a
favourited star as a warning. Identity is `--cat` or neutral. Same shape as the
Phase 1 lesson: the mapping was applied correctly and was still wrong, because
the thing being mapped was wrong to begin with.

**7. The category hue stopped being a fill — the owner's call, and it was right.**
Driving the primary button from `--cat` made every security tool's main action
`#b45309`, which is what amber becomes once it clears 4.5:1. The constraint that
makes a category hue *legible* is the same one that makes it unpleasant as a
large fill. The rule is now: **the accent acts, the category labels.** Buttons,
toggles, sliders and focus rings are `primary`; `--cat` keeps the icon tile,
badges, borders, small type and the hover glow.

**Sweep totals**

| | session start | session end |
|---|---|---|
| Lint errors | 0 | 0 |
| Lint warnings | 234 | **29** (13 exhaustive-deps, 16 react-refresh) |
| Raw palette classes | 205 | **0** |
| Off-scale typography | 497 | **0** |
| Tests | 254 | **271** |
| Toasters / help affordances / icon sources | many | **1 / 1 / 1** |

**Also found, not fixed (logged for the ports):** ssl-checker's grade badges
shipped white-on-accent labels (~2:1) — fixed in passing since it was a
DESIGN.md violation; `MarkdownPreview.getValidationVariant` returns `'default'`
for warnings so a warning renders as info; `DNSAnalysisDisplay.getProviderColor`
takes a dead argument; `TenantLookupShadcn` and `TenantInfoDisplay` hold
byte-identical copies of `getTenantTypeColor`; `BuzzwordIpsum` has an inline
`style={{fontSize}}` ESLint cannot see; `IconBrandTerraform` is the last @tabler
import in a tool file (no lucide equivalent).

**State at session end:** 11 commits on `redesign/phase-0`, working tree clean,
not pushed. `pnpm test` 271 / 10 files · `pnpm lint` 0 errors, 29 warnings ·
`pnpm build` and `pnpm build:astro` green · `@google/design.md lint DESIGN.md`
0 errors.

**Next session — see the [Phase 2 task board](#phase-2-task-board).** The
shared layer and the sweep are done; what remains is `core/`, the theme toggle,
the `/delete` page, the two-column control/result split per tool, and the
deploy-and-verify gates.

### 2026-07-19 — Session 6: `core/`, the theme control, and the split half-landed

**Model:** Opus 4.8. **Branch:** `redesign/phase-0`. Seven commits, tree clean.

**1. `core/` is built — 58 tests, 271 → 329.**

Six modules in `src/core/`, framework-agnostic, backend/clock/fetch all injected so
the whole thing runs under Vitest's `node` environment.

- **`storage.js`** — frozen contract #3. `rt:<id>:<slot>`, read-old-if-new-missing,
  copy-forward on read, and the legacy key is **never** removed by a read. `clearTool()`
  is the only delete path and exists for `/delete`.
- **`sharelink.js`** — frozen contract #2, byte-for-byte. The fixtures now assert
  **re-encoding**, not only decoding. Pinning `safeStringify` turned up one worth
  remembering: **a `Date` survives as an ISO string**, because `toJSON()` runs before the
  replacer ever sees the value — so the constructor check that drops a `Map` or a class
  instance never applies to a Date. A future "serialise dates properly" cleanup would
  silently change the bytes of every link carrying one.
- **`api.js`** — the three faults in `apiUtils.js` that reach users: the configured
  timeout is never applied, a 404 is retried three times with backoff, and transport
  errors are detected by matching English message text only Chrome produces.
- **`cache.js`** (TTL + eviction), **`clipboard.js`**, **`download.js`**.

**Deliberately not done:** per-slot legacy mappings in the manifests. network-designer's
four slots are fed by nine legacy keys, and ssl-checker keeps a result history and a
domain-string history under names that look like a pair and are not. Those need a real
merge written against real data, which is port work. `legacyKeys` stays the enumeration
for clearing; the mapping is taken at the call site.

**2. Theme control.** Three states, because the stored key already has three and `system`
is what a first-time visitor gets. Not an island — chrome on every page, and React to
flip a class on `<html>` would cost more than the rest of the shell's JS. All three
glyphs ship in the markup; CSS reveals the live one from the `data-theme-pref` the
pre-paint script writes, so the button is never briefly wrong.

**3. The split — and the lesson repeating for a third time.**

`ToolSplit` was built and applied to ten tools. The owner's verdict on seeing the set:
*"the split looks terrible across most of the tools — it makes this look unbalanced."*
Four were reverted the same session.

**The structural finding, which is the durable part.** A fixed 320px control column
forces controls to be tall and narrow. That is right when the result is a **large body
that fills the height beside it** — a DNS record table, a certificate report, a decoded
token. It is wrong when the result is a **single artefact**, because you get a 450px
column of selects next to a 90px card and several hundred pixels of void. cron is the
clearest case: the expression is one line and always will be, and it belonged in the
full-width banner above the fields where it already was.

So DESIGN.md's *"controls left, output right, always"* describes a proportion, and it was
read as a structure. There are at least two legitimate compositions in this set —
**query → report** (the split) and **form → artefact** (banner above, fields below) — and
forcing one onto the other is what produced the imbalance.

**Same shape as the Phase 1 lesson, third costume.** Phase 1: recolouring an undesigned
layout. Session 5: mapping status colours mechanically onto things carrying identity.
Here: applying a layout rule mechanically to content it does not fit. In all three the
mapping was applied correctly and was still wrong, because the thing being mapped was
wrong for the target.

**Also found:** the Astro `controls` slot **cannot** carry the split. A slot is filled at
build time and a tool's controls and results share React state, so they cannot be split
across two slots without splitting the island and inventing a channel between the halves.
The plan's "tools render into `ToolLayout`'s `controls` slot" is not reachable; the layout
lives inside the island and `ToolLayout` owns everything above it.

**State at session end**
- `pnpm test` → **329 passing / 14 files** (was 271) · `pnpm lint` → **0 errors, 29
  warnings** (unchanged floor) · `pnpm build` and `pnpm build:astro` green.
- Split live on: dns-lookup, whois, ssl-checker, tenant-lookup, microsoft-portals, jwt —
  **awaiting the owner's verdict on whether these six stay.**
- Reverted: cron, buzzword-ipsum, password-generator, azure-kql.
- Not attempted: base64, data-converter, markdown-table (editors — input and output are
  both large text bodies), azure-naming and network-designer (tab workspaces whose result
  already lives on its own tab; both are Phase 5 anyway).

**Dev-server note for the next session:** `astro dev` left running across sessions serves
a stale optimised-dep graph, and the symptom is an island reporting "failed to load" with
a 504 on `/node_modules/.vite/deps/*`. It is not a code fault. `rm -rf node_modules/.vite`
and restart.

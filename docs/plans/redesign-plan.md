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
2. ~~**The two-column split.**~~ **Withdrawn — do not restart this.** Built, applied to
   ten tools, rejected as unbalanced and fully reverted in Session 6. `DESIGN.md`'s
   Layout section now carries the reasoning and the shell no longer has a `controls`
   slot. Page consistency comes from the shared header, panel, type, spacing and
   controls, all of which are already done.
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
- [x] Every tool has docs-backed help — its manifest lazily imports the canonical per-tool
      README, and the shared sheet renders the marked user-guide section
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
- [x] ~~Two-column control/result split~~ — **withdrawn, not deferred.** Built, applied to
      ten tools, rejected and fully reverted in Session 6; `DESIGN.md` and `ToolLayout`
      no longer carry the rule or the slot. A tool page is one full-width column and the
      tool composes its own body
- [x] Remaining bespoke per-tool chrome — 12 copies of `rounded-xl shadow-sm
      ring-1 ring-border/60` removed across three tools, portals' second ornament
      bar removed, data-converter's `ControlPanel` stops restating the page title
- [x] Last `@tabler` import in a tool file — markdown-table's 13 generic glyphs to
      lucide, `IconBrandTerraform` drawn locally as `TerraformMark.jsx`. @tabler now
      survives only in the two SPA-only layout files Phase 6 deletes
- [x] `/delete` storage-clear page driven by declared `storageKeys`
- [x] Real Pages preview deploy + Playwright deep-link matrix — **done, session 8.**
      `russ-tools-preview.pages.dev` (throwaway direct-upload project), 19/19
      against it; the session-4 caveat is closed
- [x] Rendered-meta diff against production (**found a real canonical fault**);
      sitemap URL-set diff, now pinned as `sitemap.test.js`
- [x] exceljs dynamic-import smoke test under the new toolchain — **found a real
      bug**: `.xlsx` import threw under the Astro build
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
Breadcrumb, category icon tile and badges, all from the manifest. (It also shipped a 320px
control column beside a fluid result column — withdrawn in Session 6.) The category hue is set once and inherited, so nothing
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
deploy-and-verify gates. *(Session 6 note: the split was attempted and
withdrawn — see below.)*

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

**3. The split — built, rejected, and withdrawn completely.**

`ToolSplit` was built and applied to ten tools. The owner's verdict on seeing the set:
*"the split looks terrible across most of the tools — it makes this look unbalanced."*
Four came off, then Microsoft Portals, then — *"lose the split full stop"* — all of them.
`src/components/ui/tool-split.jsx` is deleted, `ToolLayout`'s `controls` slot and the
320px grid rule in `shell.css` are gone, and `DESIGN.md`'s Layout section now says a tool
page is one full-width column, with the withdrawn rule and the reason recorded in place
so it is not proposed again.

**The structural finding, which is the durable part.** A fixed 320px control column
forces controls to be tall and narrow. That is right when the result is a **large body
that fills the height beside it** — a DNS record table, a certificate report, a decoded
token. It is wrong when the result is a **single artefact**, because you get a 450px
column of selects next to a 90px card and several hundred pixels of void. cron is the
clearest case: the expression is one line and always will be, and it belonged in the
full-width banner above the fields where it already was.

Microsoft Portals was the worst of them and is the clearest counter-example: its result
is 91 uniform cards, a **browse surface** rather than a report, so the split cost it a
whole column of tiles to give a search box and two selects their own column. A directory
wants the full width.

So DESIGN.md's *"controls left, output right, always"* describes a proportion, and it was
read as a structure. There are at least three legitimate compositions in this set —
**query → report** (the split), **form → artefact** (banner above, fields below) and
**browse → grid** (full width) — and forcing the first onto the others produced the
imbalance.

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
- Split: **gone everywhere.** All fifteen tools render exactly as they did at the start of
  the session; the net diff on `src/components/tools/` is zero.
- What survives the episode is the finding, now written into `DESIGN.md`: page consistency
  comes from the shared header, panel, type, spacing and controls — not from a shared
  column ratio.

**Dev-server note for the next session:** `astro dev` left running across sessions serves
a stale optimised-dep graph, and the symptom is an island reporting "failed to load" with
a 504 on `/node_modules/.vite/deps/*`. It is not a code fault. `rm -rf node_modules/.vite`
and restart.

### 2026-07-19 — Session 6 (continued): the gates, minus the deploy

Everything left in Phase 2 that does not require deploying. Two of the three
gates found real bugs, which is the argument for writing gates rather than
assuming.

**`/delete` — and it was a broken link.** The shell's nav has linked "Saved
data" → `/delete` from every page since session 4 and the route did not exist:
the SPA served it, the shell 404'd. The page it replaces offered one button
wired to `localStorage.clear()` beside a *hand-written* list of what that would
destroy — a list that had drifted, next to a button that took the theme
preference with it and could not clear one tool without clearing all of them.
Now derived entirely from the manifests: per-tool rows with real sizes, per-tool
delete via `core/`'s `clearTool`, and anything `localStorage` holds that no
manifest claims listed under its own heading — which is where an orphaned key
surfaces after a rename. One implementation for both apps; `ClearAllStorage.jsx`
is deleted.

**exceljs gate → a real bug.** exceljs ships a UMD bundle, so what
`await import('exceljs')` yields depends on the bundler. The Vite SPA build
emits Rollup's `_mergeNamespaces`, which copies the CJS exports onto the
namespace and makes a bare `ExcelJS.Workbook` work. The Astro build emits
`export default n()` and nothing else; Node likewise. `csvParser.parseExcelData`
used the namespace, so **dropping an .xlsx on the Markdown Table import dialog
threw `Workbook is not a constructor` under the new shell.** The other call site
already used `.default`, which is correct everywhere — the two had disagreed
since they were written and the SPA build papered over it. Only visible by
inspecting both builds' emitted chunks.

**Rendered-meta diff → a second real bug.** `Astro.url.pathname` is the *output
file* during a static build, so `BaseLayout`'s default canonical resolved to
`https://russ.tools/index.html` and `/delete.html`. Cloudflare Pages serves the
extensionless path, so both were self-referencing canonicals aimed at URLs
nothing links to. Tool pages pass their manifest path explicitly and were never
affected — which is why reading the layout would not have shown it. The 404 now
has no canonical at all and is `noindex`.

**And the headline the diff produced.** Production today serves
*"RussTools - Free Online Developer & DevOps Tools Collection"* as the title of
**every** URL, with no `h1` and no canonical, because a crawler receives the
SPA's index shell. The new shell gives each page its own title, description,
canonical, `h1` and schema.org markup. **Zero hard regressions across all
sixteen URLs.** This is the SEO case for the whole redesign, measured rather
than asserted.

**Gates that are now tests rather than one-off checks:** `sitemap.test.js` (the
registry covers exactly the SPA's committed sitemap, both directions),
`canonical.test.js` (asserts the *built* HTML, and CI gains a `pnpm build:astro`
step before `pnpm test` — without it the suite silently skips), and
`exceljs.smoke.test.js` (the interop shape, a real workbook round-trip through
the two operations the tools actually perform, and a guard on the call site).

**Also done:** twelve copies of `rounded-xl shadow-sm ring-1 ring-border/60`
removed — a ring and a resting drop shadow layered over the shared card, which
DESIGN.md's Elevation section rules out; Microsoft Portals' second, coloured
ornament bar removed (the lit top edge is described as *the* single ornament,
"must not be extended"); data-converter's `ControlPanel` no longer restates the
page's own title and description directly beneath them. @tabler is out of every
tool file.

**State:** `pnpm test` **340 / 17 files** (was 271 at session start) · `pnpm lint`
0 errors, 29 warnings · both builds green · `@google/design.md lint DESIGN.md`
0 errors.

**Left in Phase 2, and only this:** a real Pages preview deploy and the Playwright
deep-link matrix against it. Deliberately not done — the owner's call. `_redirects`
is already proven against Cloudflare's own runtime locally (session 4), so the
residual risk is the deploy itself, not the rewrite semantics. Also still carried
from Phase 0: live worker response fixtures → MSW mocks, which is a Phase 4
prerequisite rather than a shipping one.

### 2026-07-19 — Session 7: Phase 3 — the six simple tools ported

**Model:** Fable 5. **Branch:** `redesign/phase-0`. Six commits, one per tool.

**The pilot (base64) set the recipe, and the recipe is the deliverable.** A port
now means: extract anything pure into `lib/` *first* if the plan owes it tests;
move the component to `src/tools/<id>/island.jsx` and drop the Shadcn suffix;
delete the SEOHead/ToolHeader ritual outright; replace hand-rolled
clipboard/download/storage with `core/` calls; declare `storageKeys`/`legacyKeys`
in the manifest and read them through `createToolStorage`'s legacy fallback;
point the manifest's `island` at `./island.jsx`; swap the tool's `App.jsx` route
to `SpaToolPage`; delete the old folder. `pnpm test` + `pnpm lint` green, then a
browser pass in the shell against both themes.

**Two pieces of one-time scaffolding made the ritual deletion safe while the SPA
is still production:**

- **`SpaToolPage`** (`src/components/common/SpaToolPage.jsx`) — the SPA-side
  page furniture for a *ported* tool: SEOHead + ToolHeader + the island, all
  driven from the manifest, one implementation instead of fifteen copies of the
  ritual the ports delete. Dies with the SPA at cutover.
- **`toolIconMap`** (`src/components/common/toolIconMap.js`) — ToolHeader,
  Sidebar and NewHomeView each held a 15-import copy of the icon map. Now one
  registry-derived map, so every later port deletes its `<Tool>Icon.jsx` without
  touching chrome. (Also fixed in passing: Sidebar's map never had
  AzureNamingIcon, so azure-naming showed a generic file icon in the sidebar.)

**Deferred coverage §B is paid.** `src/tools/base64/lib/base64.js` extracted
verbatim under 27 characterization tests: the `escape`/`unescape` UTF-8
mechanism is pinned (a lone surrogate **throws**; TextEncoder would silently
emit U+FFFD — the exact modernisation trap §B predicted), urlsafe alphabet,
MIME 76-char wrapping, validation, image signatures, and the >1000-char
"likely image" quirk pinned as KNOWN-QUIRK.

**A live deep-link bug found by writing §B's mount test.** `/base64/:input`
processed the param with the component's *initial* mode (`encode`) while
auto-detect flipped the visible switch — so a shared base64 link showed a
Decode toggle over the payload *re-encoded* (verified against the running
component first: `SGVsbG8gd29ybGQ=` → output `U0dWc2JHOGdkMjl5YkdRPQ==`).
Fixed in the port — the mount effect now decides the operation the same way
auto-detect does — pinned by a jsdom mount test, logged in BEHAVIOR_CHANGES.md.
(`jsdom` + Testing Library joined the dev deps for exactly this class of test;
note vitest runs `globals: false`, so tests must register their own `cleanup`.)

**markdown-table's owed fixes landed with its port**, fixture updated in the
same commit and both ledgered: `convertToCSV` now blanks only
`null`/`undefined` (a numeric 0 and `false` are data — they exported as empty
cells before), and `MarkdownPreview` warnings render with the `warning` variant
instead of info. Its two localStorage keys moved to
`rt:markdown-table-tool:state/history` through `core/storage` — the first real
exercise of contract #3's read-old/write-new/never-delete outside a unit test,
verified in the browser against a seeded legacy key.

**buzzword-ipsum's invisible inline style** became `font-sans text-body-md` —
and the `font-sans` matters: the shared Textarea is the *Input* contract
(monospace data), while generated buzzwords are prose, which DESIGN.md says is
never monospace. The API Usage button moved from ToolHeader's `actions` into
the Options card header; markdown-table's Import/Export moved into its own
toolbar the same way. That retires the only two users of ToolHeader's action
slot.

**`core/clipboard` grew `readText()`** (+ tests) — base64, jwt and later
data-converter all paste; there is no fallback for paste off HTTPS, so it
returns `null` and the caller toasts.

**ESLint:** `src/tools/**` now holds the raw-palette and off-scale-type rules
at **error** — the checklist's "flip to error" done once for the destination
directory instead of per tool.

**The stale-dep trap bit twice, in a new costume each time** (plan already
documents it): the SPA dev server threw `require_react is not a function`
after `node_modules/.vite` was cleared under it, and `astro dev` threw
`Cannot read properties of null (reading 'useRef')` from a second React copy
when `@radix-ui/react-dialog` entered the island graph mid-session. Both cured
by `rm -rf node_modules/.vite` + restart, neither a code fault — but both
looked exactly like one.

**State at session end:** `pnpm test` **376 / 20 files** (was 340) · `pnpm lint`
0 errors, 29 warnings (floor held) · both builds green · six of fifteen tools
live in `src/tools/`, `src/components/tools/` down to the nine Phase 4/5 tools.

**Next: Phase 4.** First the prerequisite carried since Phase 0 — capture live
worker response fixtures (ssl/whois/tenant) and stand up MSW — then
`useLookupTool` on top of `core/`'s cache + api client, then the five lookup
tools. The two pre-declared behaviour changes (ssl-checker's honest fallback,
dns-lookup's OpenDNS label) land with their ports.

### 2026-07-19 — Session 7 (continued): Phase 4 — the lookup family on one hook

**Model:** Fable 5. **Branch:** `redesign/phase-0`. Six commits.

**The Phase 0 debt is paid first.** Worker response fixtures captured from the
**live** endpoints (whois domain + IP, tenant managed + unmanaged, ssl READY /
IN_PROGRESS / error, Google DoH A / MX / NXDOMAIN), committed under
`src/test/fixtures/workers/` with an MSW harness (`src/test/msw/`) whose own
suite pulls every fixture through `core/apiFetch` — the frozen-contract #5
tripwire. Two operational facts learned by doing it: the workers 403 any
unlisted `Origin` (fixtures were captured as `https://russ.tools`), and the
ssl worker's SSL Labs assessment takes minutes for a multi-endpoint host, so
the READY fixture came from a background polling loop.

**`useLookupTool` (`src/lib/`) is the deletion the phase promised.** The five
hand-rolled loading/cache/history/deep-link/toast subsystems are one hook on
`core/`'s cache and storage — with the per-tool differences expressed as
options rather than copies: compound cache/history keys (dns's
domain+type+provider), `maxHistory: 0` (tenant's list is explicit saves, not
history), a `cacheable` gate (ssl refuses to cache partial assessments), a
predicate form of `removeFromHistory` (legacy rows predate the `query`
field). Caches migrate cold; history reads its legacy key forward and never
deletes it. Nine hook tests, plus MSW-backed island tests per tool.

**Both pre-declared behaviour changes landed, ledgered:**

- **ssl-checker** no longer fabricates. The browser fallback used to return
  grade B, a made-up certificate and "Browser Verified Certificate Authority"
  for a check that never ran; it now returns `connectivityOnly` and the page
  says *"Analysis unavailable — HTTPS connectivity verified."* The rot went
  one level deeper than the plan knew: `isSSLDataComplete` counted browser
  checks "always complete", which is how fabricated data reached the cache
  and history. An island test kills the worker via MSW and asserts nothing
  invented renders and nothing is cached.
- **dns-lookup** drops OpenDNS and "Browser Default" — both silently queried
  Google (OpenDNS has no public DoH JSON API). `apiConfig.json` loses the
  aliases; the manifest's shortDescription stopped naming OpenDNS too (caught
  in the rendered page, not the diff). Old history rows replay via Google.

**The passing-fault list is cleared:** whois and dns `_autocompleteData` (and
with ssl's dead suggestion effect, the last `useTLDs` consumers in tools),
tenant-lookup's byte-identical `getTenantTypeColor` copies (now
`lib/tenantType`), `DNSAnalysisDisplay.getProviderColor`'s dead argument,
microsoft-portals' no-tenant `portal.azure.com//blade/…` double slash (fixed
with a regression test), and `iconColor` went with the ToolHeader ritual.

**Two environment traps worth recording:**

- **Node ≥22's experimental `localStorage` global shadows jsdom's** under
  vitest's jsdom environment and returns `undefined` — every storage-backed
  component test would have silently no-opped. `src/test/setup.js` repoints
  the globals at the real jsdom storage (exposed as `globalThis.jsdom`), and
  jsdom gets an explicit URL because opaque origins carry no storage at all.
- **The deployed workers' `ALLOWED_ORIGINS` allows `http://localhost:5173`
  but 403s `http://localhost:4321`** — set before the shell existed. The
  Astro dev server now runs on **5173** (`.claude/launch.json`), which is
  what makes live lookups work from the new site in dev. The durable fix is
  adding 4321 (or settling the dev port) in each worker's secret — owner's
  call, noted for the workers phase.

**State at session end:** `pnpm test` **401 / 26 files** · `pnpm lint` 0
errors, **15 warnings** (the floor fell — deleted tools took their
exhaustive-deps warnings with them) · both builds green · **eleven of fifteen
tools live in `src/tools/`**. Phase 4 complete.

**Next: Phase 5** — data-converter, azure-naming, azure-kql, then
network-designer last (allocator extraction + §A suite first).

### 2026-07-19 — Session 7 (continued): Phase 5 — three heavy tools, and §A paid

**Model:** Fable 5. **Branch:** `redesign/phase-0`. Four commits.

**data-converter.** The keystroke costs are gone: validate-on-type is
debounced (300 ms) and the auto-convert path records no history — only the
Convert button does, so the full history array stops being rewritten to
localStorage per character. Verified in the browser: typing auto-converts
with zero history writes; Convert records exactly one. The ~450 lines of
suggestion prose moved out of `validation.js` into `lib/errorSuggestions.js`
**verbatim** — the conditions and their ordering are behaviour under
`validation.test.js`, so they moved as blocks rather than being reshaped into
a cleverer engine (769 → 512 + 298 lines). Storage under
`rt:data-converter:*`, legacy keys read forward; the home page's saved-data
card prefers the new keys.

**azure-naming.** The port's whole point, done and proven in the browser:
the provider mounts inside the island, App.jsx loses the wrapper, and
`/azure-naming` fetches `azure-name-regions.tf` while `/base64` does not —
the root-mount bug is unrepresentable. Share moved onto `core/`'s codec +
clipboard (same wire format). Rules engine and CAF data untouched under
their Phase 0 tests.

**azure-kql.** Both owed fixes landed, ledgered, and pinned by a new suite:
the `FILTER_PRIORITY` case mismatch (camelCase table, PascalCase fields —
every lookup missed, ordering inert) is fixed with a first-letter
normalisation, and custom templates round-trip — saved templates appear in
their service's picker as category "Custom", load, and generate. Custom
templates persist as `rt:azure-kql:custom-templates` (legacy key read
forward); the zustand store was already `rt:azure-kql:store`. The `?config`
share param deliberately stays uncompressed btoa — that is this tool's own
existing wire format.

**network-designer: §A is paid; the component port is next session's work.**
`src/tools/network-designer/lib/allocator.js` + a 16-test suite covering all
eight §A cases. Three findings worth recording:

1. **The differential test passes.** The two inline copies share the same
   first-fit core; their divergences (safety counter, redundant `contains`
   checks) cannot change placements. The plan expected this test to fail —
   the honest outcome is agreement, now proven rather than assumed.
2. **The suspected middle-vs-trailing off-by-one is not a bug.** Measured
   inclusively, `next.start - prev.end - 1` and `parentEnd - lastEnd` are
   both correct counts. §A.7 pins the reconciled implementation;
   BEHAVIOR_CHANGES strikes the entry with the reasoning.
3. **The aligned-block bug is real and fixed in the lib** —
   `availablePrefixLengths` computes the largest *aligned* block per gap
   (§A.6 pins the plan's exact `/25`-offered-then-fails scenario, plus the
   invariant that every offered size must allocate). The candidate arrays are
   gone too: the scan jumps past blocking ranges, and §A.8 proves twenty
   `/30` allocations in a `/8` complete in milliseconds where the old code
   built a ~4M-entry array per allocation. **The component still runs its
   inline copies** — the ledger entry stays Open until the port wires it up.

**What remains for network-designer (deliberately not started):** split the
1,065-line monolith onto `lib/allocator`, stable subnet ids, hex colours with
the share-URL shape-upgrade for `{name,index}` payloads + fixtures (contract
#2), @dnd-kit unchanged — and the four-slot/nine-key storage migration,
which the plan says to write **against a real production localStorage
export**. That export has to come from the owner; synthetic fixtures can
cover the shapes, but the plan's bar is real data.

**State at session end:** `pnpm test` **421 / 28 files** · `pnpm lint` 0
errors, 14 warnings · both builds green · **fourteen of fifteen tools live in
`src/tools/`**; `src/components/tools/` holds only network-designer.

**For the next session:** the network-designer component port (above), then
the Phase 2 closers that were always the owner's call — the Pages preview
deploy + Playwright matrix — and the `ALLOWED_ORIGINS` decision for the
shell's dev origin.

### 2026-07-19 — Session 7 (continued): the owner retires the Network Designer

**Model:** Fable 5. **Branch:** `redesign/phase-0`.

**The decision.** Immediately after §A landed, the owner redirected: *"rip it
out and replace it with a subnet calculator"*, pointing at mxtoolbox,
subnet-calculator.com, calculator.net, davidc.net and SolarWinds as the
reference set. Three sub-decisions asked and answered: new honest path
(**`/subnet-calculator`**, with `/network-designer` as a 301), **pure
calculator** (the Terraform generators and their Phase 0 tests go too), and
**IPv4 + IPv6** from day one.

This supersedes the Phase 5 network-designer port wholesale — the monolith
split, hex-colour migration, share-URL shape upgrade and the nine-key
storage merge (and the request for a production localStorage export) are all
moot. §A's allocator lib and suite, green for a few hours, were deleted with
the component they were extracted from; the aligned-block bug cannot exist
in the new tool, whose divide table splits into exact halves. Sunk cost
acknowledged and not mourned. Every consequence a user can notice is
ledgered in BEHAVIOR_CHANGES.md — most importantly: **no saved-network data
is deleted** (the legacy keys go inert and surface on `/delete` as
unclaimed), but nothing reads it any more, and old designer share URLs no
longer restore.

**What was built.** `src/tools/subnet-calculator/` in the union shape of the
reference sites:

- **`lib/ipv4.js`** — pure 32-bit maths (`>>> 0` throughout): details panel
  (network/broadcast/ranges, RFC 3021 `/31`, netmask + wildcard, binary/hex/
  integer forms, classful letter, special-use classification, `in-addr.arpa`
  PTR).
- **`lib/ipv6.js`** — hand-rolled on **BigInt** rather than a dependency:
  parser (`::`, embedded IPv4 tails, zone ids rejected), RFC 5952 canonical
  formatting (longest run, leftmost tie, never a single group — all pinned),
  special-use classification, nibble PTR.
- **`lib/divide.js`** — the davidc-style split tree as a parent block plus a
  Set of split node keys, generic over family via `{bits, format}` (IPv4 and
  IPv6 share one implementation). Split, join-with-subtree-collapse, and a
  prune that keeps stale share payloads from corrupting the walk.
- **The island**: one input auto-detecting family, prefix select, details
  table, divide table with Split/Join, share links through the standard
  `?config` codec, and `/subnet-calculator/:ip/:prefix` deep links (IPv6
  colons are legal path characters).
- **`redirectFrom`** is now a manifest field: the `_redirects` generator
  emits real 301s (`/network-designer` and `/network-designer/*`), the SPA
  serves a `<Navigate>`, and the registry test treats declared redirect
  sources as served — plus a new assertion that a redirect source can never
  collide with a live route.

**Deleted:** both network-designer folders, `src/utils/network/` (Terraform
generators + diagram utils + their tests), the saved-networks block on the
home page's card, and — with no remaining consumers — `@dnd-kit/*`,
`netmask` and `html2canvas` (and the `vendor-ui` manualChunks entry, per the
Session 1 gotcha).

**Verified on the Astro shell:** IPv4 details for `192.168.1.130/25`
(netmask, wildcard, 126 usable, RFC 1918, PTR), the davidc workflow
(split → nested split → join collapses the pair and prunes descendants),
IPv6 for `2001:db8:abcd::/48` (2^80 totals, `/49` halves split at the top
bit of the fourth group), dark and light. 42 new tests across the three
libs and the island; suite total **437**.

**State:** `pnpm test` **437 / 30 files** · `pnpm lint` 0 errors, 13
warnings · both builds green · `_redirects` now carries 10 param rewrites +
1 retired path. **All fifteen tools live in `src/tools/`** —
`src/components/tools/` is empty, and the tool ports are done.

**Remaining, all owner-gated:** the Pages preview deploy + Playwright
deep-link matrix, and the worker `ALLOWED_ORIGINS` decision. Then Phase 6.

**Addendum — subnet-calculator polish, three owner-reported fixes.** All three
turned out to involve Radix Select's hidden native `<select>`, which is worth
knowing exists before writing any future form:

1. **The calculate row didn't sit on one baseline** — the hidden native select
   is a *sibling* of the trigger, so a `space-y-*` column gave the invisible
   element a real 8px margin and `items-end` aligned the ghost instead of the
   control. Columns holding a Select use `flex flex-col gap-2` (flex gap
   ignores out-of-flow children). dns-lookup's grid form was checked and is
   unaffected.
2. **Copy buttons**: "Copy details" copies the whole panel as a padded
   label/value block (verified by intercepting the clipboard write), and the
   CIDR copy gained a visible label.
3. **Share links opened onto a phantom error** — the payload restored
   perfectly, but setting the select's value programmatically makes Radix echo
   an **empty `onValueChange`** through the hidden native select; the handler
   recalculated with `"10.0.0.0/"` and blanked the prefix. The handler now
   ignores the empty echo. jsdom does not reproduce the echo, so the browser
   reproduction (before/after, plus a with-splits round-trip and a real
   dropdown selection) is the regression pin, recorded in the commit.
   *(Session 8: that pin is now a Playwright test, not a commit message.)*

### 2026-07-19 — Session 8: the gates — push, sitemap seam, and the matrix

**Model:** Fable 5. **Branch:** `redesign/phase-0`.

**Four owner decisions, asked early and answered:**

1. **Push only** — the 21 commits are pushed (`origin/redesign/phase-0`), no
   PR yet. Noted for later: CI triggers on PRs and pushes to `main` only, so
   the branch push ran nothing; CI's first real run comes with the PR.
2. **Preview host: a separate direct-upload Pages project**
   (`russ-tools-preview`). The production project is git-connected, wrangler
   direct-uploads into one are rejected, and a git preview of the branch
   would build the SPA (previews use the production build settings) — so a
   throwaway project is the only way to put `dist-astro` on real Cloudflare
   infrastructure before cutover. Deleted after.
3. **ALLOWED_ORIGINS gains the preview origin** alongside the two localhost
   ports, so ssl/whois/tenant lookups work on the deployed preview.
4. **The home-page password widget is dropped.** The shell home stays a pure
   static zero-JS index; the generator is one click away. This closes the
   plan's "password widget as a tiny island" line item as *won't-build* —
   log it in BEHAVIOR_CHANGES.md when the SPA home dies in Phase 6.

**The sitemap seam was a live cutover bug, found and fixed.**
`public/sitemap.xml` is generated and **gitignored** (the comment in
`sitemap.test.js` claiming it was committed was wrong), and only the SPA's
`pnpm build` wrote it. Two consequences: on a clean CI runner the sitemap
test would read a file that does not exist yet, and — the real one —
post-cutover Pages builds run `build:astro` alone, so production would have
served a `robots.txt` pointing at a 404 sitemap. `build:astro` now runs
`generate:sitemap` first (before Astro copies `public/`), which fixes both.
**Seam decision:** `/sitemap.xml` stays the canonical sitemap URL through
cutover — continuity with `robots.txt` and Search Console — and the
`@astrojs/sitemap` duplicate (`sitemap-index.xml`) retires in Phase 6, when
the generator is repointed from `toolsConfig.json` to `loadManifests`.

**The Playwright deep-link matrix exists and is green — 19 tests.**
`@playwright/test` + chromium, `e2e/deeplinks.spec.js`, `pnpm test:e2e`.
Against a `PW_BASE_URL` (the deployed preview — the real gate) or, with none
set, it auto-starts `wrangler pages dev dist-astro` — Cloudflare's engine
run locally. The matrix: all ten param rewrites with realistic values (a
real minted HS256 JWT, real domains, `2001:db8:abcd::/48` — the IPv6 deep
link's first proof through `_redirects`, which post-dates session 4's), URL
intact + prerendered `h1` + island param application per route, the
`/network-designer` 301 and its wildcard, follow-the-301 lands on the
calculator, a real 404, `/delete` + its `noindex`, the home index,
`/sitemap.xml` + `robots.txt` agreeing, and the subnet-calculator `?config`
restore asserting the phantom error's absence — the Radix empty-echo
regression's only pin, now a test. **19/19 green against `wrangler pages
dev`.** One test bug caught by the first run: a `/16` splits at the third
octet, not the second — the leaves are `10.0.64.0/18` / `10.0.128.0/17`,
verified against `lib/divide.js` directly.

**The owner runbook (gates 1–2, in order):**

```bash
# 0. once, if needed
pnpm dlx wrangler login

# 1. deploy the preview (gate 2)
pnpm build:astro
pnpm dlx wrangler pages project create russ-tools-preview --production-branch main
pnpm dlx wrangler pages deploy dist-astro --project-name russ-tools-preview --branch main --commit-dirty=true
#    → serves at https://russ-tools-preview.pages.dev

# 2. rotate the worker origin lists (gate 1) — values are the probed current
#    list + both localhost ports + the preview origin
echo 'https://russ.tools,https://www.russ.tools,http://localhost:3000,http://localhost:5173,http://localhost:4321,https://russ-tools-preview.pages.dev' | pnpm dlx wrangler secret put ALLOWED_ORIGINS --config cloudflare-worker/configs/wrangler-whois.toml
echo 'https://russ.tools,https://www.russ.tools,http://localhost:5173,http://localhost:4321,https://russ-tools-preview.pages.dev' | pnpm dlx wrangler secret put ALLOWED_ORIGINS --config cloudflare-worker/configs/wrangler-ssl.toml
echo 'https://russ.tools,https://www.russ.tools,http://localhost:5173,http://localhost:4321,https://russ-tools-preview.pages.dev' | pnpm dlx wrangler secret put ALLOWED_ORIGINS --config cloudflare-worker/configs/wrangler-tenant.toml
```

The per-worker values differ because the current lists were **probed, not
assumed** (OPTIONS preflights against the live workers): whois additionally
allows `localhost:3000`; all three 403 `localhost:4321` today. buzzwords
hardcodes its list in source and no tool calls it from the page, so it is
out of scope (edit + `wrangler deploy` only if its public API should admit
new origins). Then the matrix runs against the preview:
`PW_BASE_URL=https://russ-tools-preview.pages.dev pnpm test:e2e`.

**State:** `pnpm test` **437 / 30** · `pnpm test:e2e` **19/19** (local
Cloudflare runtime) · `pnpm lint` 0 errors, 13 warnings · both builds green
· branch pushed through commit `1c8cceb`, gate commits on top.

**The owner ran the runbook, and the gates are closed.**

- **Gate 1 verified by re-probe:** all three workers now 200 the OPTIONS
  preflight for `localhost:4321`, `localhost:5173` and the preview origin.
- **Gate 2 live:** `https://russ-tools-preview.pages.dev` serves
  `dist-astro` on real Pages infrastructure.
- **Gate 3 against the deployed preview: 19/19 in 2.7s.** Every param
  rewrite 200s with the URL intact, the 301 and its wildcard hold, the IPv6
  deep link routes, the `?config` restore renders three subnets and no
  phantom error. Browser pass on top of the tests: a live WHOIS lookup
  succeeds from the preview origin (worker CORS end-to-end), dark theme
  correct, share-restore divide table shows `10.0.0.0/18` / `10.0.64.0/18`
  / `10.0.128.0/17`.

The plan's riskiest platform assumption — `_redirects` param handling on
real Pages — is now proven **deployed**, closing the caveat session 4
recorded. Phase 2's task board is complete.

**Cutover is sequenced and deliberately on hold — the owner's call, made at
the ready point.** The sequence, for whichever session runs it:

1. **Open the PR** `redesign/phase-0` → `main` (~28 commits). This is CI's
   first-ever run (it triggers on PRs and `main` only). A first-run failure
   was already defused: `pnpm/action-setup` now reads the pnpm version from
   `packageManager` instead of carrying its own conflicting `version: 11`.
2. **Merge once CI is green.** Pages auto-builds `main` under the **old**
   settings, so production redeploys as the SPA — zero visible change, and
   the insurance the plan always intended: the SPA tree stays intact and
   deployable until the flip is confirmed.
3. **Owner flips the dashboard** (Workers & Pages → russ.tools → Settings →
   Builds): build command `pnpm build:astro`, output directory `dist-astro`.
   Check the build image's Node satisfies `engines` (≥20; CI uses 22 — set
   `NODE_VERSION` if needed). Trigger a redeploy.
4. **Verify live together:** rerun the matrix as
   `PW_BASE_URL=https://russ.tools pnpm test:e2e`, browser pass, meta/
   sitemap spot-checks. Rollback is the settings flipped back + redeploy.
5. **Aftermath:** Search Console monitoring starts (4–6 weeks); delete the
   `russ-tools-preview` project and drop its origin from `ALLOWED_ORIGINS`
   at leisure; CI's SPA build step dies with the SPA in Phase 6.

Then Phase 6 demolition, with the react-router/`useDeepLinkParam` question
asked before `src/bridge/` moves.

### 2026-07-19 — Session 9: pre-launch visual pass

The post-redesign polish pass is complete, driven from `DESIGN.md` rather than
per-page overrides.

- **Six selectable palette families, twelve audited themes:** Solarized
  Dark/Light, Catppuccin Mocha/Latte, Dracula/Alucard, Nord Polar Night/Snow
  Storm, Tokyo Night Night/Day and GitHub Dark/Light. Graphite was built during
  the pass and then removed at the owner's request. Catppuccin is the default;
  a stored removed/invalid palette falls back to Catppuccin without breaking
  the independent `vite-ui-theme` mode preference. Solarized keeps the official
  sixteen-colour ramp, while every rendered semantic value clears the existing
  text and control-boundary floors. The contrast matrix now runs 694 assertions
  across all twelve combinations.
- **The theme switcher is now a real menu:** a terminal icon opens an accessible
  radio menu of six miniature terminal previews, each drawn from generated
  palette tokens and labelled with its dark/light variant names. Selection,
  outside click, Escape, arrow keys, Home/End, focus restoration, storage and
  cross-tab storage updates are wired in plain shell JavaScript. The adjacent
  system/light/dark control remains independent.
- **Header and footer were rebuilt.** The header follows the owner's russ.cloud
  reference: a quiet brand at left and one icon toolbar at right. Toolbar icons
  reveal their text labels on hover and keyboard focus; the Source action uses
  the supplied GitHub silhouette. The footer stays compact and factual — mark,
  existing client-side/privacy properties and navigation only.
- **The site mark is the supplied toolbox silhouette.** `SiteMark.astro` uses
  `currentColor`, so every palette controls it automatically; the standalone
  SVG adapts to light/dark preference and the web manifest now uses the
  Catppuccin Mocha ground. The rejected `r.t` ligature was removed completely.
- **All fifteen tool icons were redrawn at their one shared source**
  (`src/shell/icons.mjs`), enlarged in cards and tool headers, and freed from
  the tinted tiles/borders visible in the review screenshot. Both Astro and
  React render the same 1.75px geometry. No hero copy, capability claims,
  slogans or other promotional content was added.
- **Motion is shared CSS, not a new runtime dependency:** inputs ease focus and
  boundary changes, buttons compress on press, tabs/results/alerts/cards and
  table rows enter over 180–240ms, and progress updates ease. The existing
  reduced-motion override disables the whole vocabulary.
- **A token export bug surfaced and was fixed:** generated Tailwind tokens now
  use `@theme static`, preventing runtime-selected category and palette custom
  properties from being pruned when their names do not appear literally in a
  utility class.

Final gates: `pnpm test` **1008 / 30** · palette contrast **694** ·
`pnpm test:e2e` **19/19** · `pnpm lint` 0 errors, 13 existing warnings · both
SPA and Astro production builds green. Browser QA covered all twelve rendered
palette/mode surfaces, picker mouse/keyboard behaviour, the tool index, a
representative subnet-calculator input/result flow, the freestanding icons,
toolbox mark and footer.

**Follow-up — index, mobile menu and saved-data scope.** Azure and Microsoft
now share one `Microsoft & Azure` presentation section and filter on the index;
their manifests and per-card category hues remain separate. Tool counts were
removed from the dividing rules (filter-chip counts remain). Below 720px the
header toolbar becomes a burger disclosure with full labels, the same
navigation and appearance controls, independent palette-menu Escape handling,
and outside-click dismissal. `BaseLayout.astro` was split onto shared
`HeaderActions` and `AppearanceControls` components while doing this, removing
the duplicated palette data and inline controller.

`/delete` now means tool data exactly: only manifest-declared storage keys are
shown, counted and cleared. Appearance preferences and any unrelated origin
storage are not surfaced under a "Not owned by a tool" section and survive the
all-tools delete action. Two jsdom tests pin the storage boundary; three new
Playwright cases pin the merged index/filter, divider rules, mobile disclosure,
and hidden/preserved preference data.

Follow-up gates: `pnpm test` **1010 / 31** · `pnpm test:e2e` **22/22** ·
`pnpm lint` 0 errors, 13 existing warnings · both production builds green.

### 2026-07-20 — Session 10: Phase 6 opens — SEO reworked, dead weight gone

**Model:** Opus 4.8. **Branch:** `redesign/phase-0`.

**Cutover is still deliberately on hold** (owner's call, unchanged since
session 8), and that fact sequences this phase. `main` is ~28 commits behind
and Cloudflare Pages still builds it with the *old* settings (`pnpm build` →
`dist/`), so deleting the SPA now would break the production build the moment
the branch merges. The split turned out cleaner than expected: the Astro side
is not live, so **everything except the SPA's own entry points is safe to do
now**. Demolition of `index.html` / `main.jsx` / `App.jsx` / `vite.config.js`
and the SPA-only components waits for the dashboard flip.

A repointing of `pnpm build` at Astro was considered — it would make the
merge itself the cutover and remove the one runbook step that cannot be
rehearsed. **Rejected:** it collapses "code on main" and "site changes" into
one event, and the separation is the insurance the plan always intended.
After the flip, `"build": "pnpm build:astro"` becomes an alias so the
dashboard setting stays valid.

**An audit first, not a rewrite.** Two mapping passes over the tree, because
`CLAUDE.md` could not be trusted on this: it describes tools living under
`src/components/tools/`, and **that directory does not exist** — all fifteen
are real implementations under `src/tools/<id>/`, no re-export shims. The
remaining SPA surface is 13 source files plus 4 root config/entry files.
`src/bridge/ToolIsland.jsx` is **load-bearing** despite its docblock saying
the directory dies at cutover; only `ShellContext.jsx` goes with the SPA.

**The SEO findings were worse than "needs a tidy".**

- **Three sitemaps shipped, all with the identical URL set** — verified
  byte-identical. `public/sitemap.xml` from `toolsConfig.json`, plus
  `sitemap-index.xml`/`sitemap-0.xml` from `@astrojs/sitemap`, of which
  `robots.txt` advertises only the first. The integration is removed and the
  generator now reads the manifests, which also severs the sitemap's last
  dependency on `toolsConfig.json` — unblocking its retirement without
  touching the SPA. `lastmod` now comes from each tool's last commit rather
  than the build clock; `changefreq`/`priority` dropped as Google ignores both.
- **No `og:image` existed anywhere.** The SPA had pointed at `/og-image.png`
  for years against a file that has never been in the repo, and the shell
  emitted nothing at all. Fifteen per-tool cards plus a default now ship.
- **The port had silently regressed the structured data**: all fifteen tools
  claimed `DeveloperApplication`, and `author`, `publisher`, `featureList`,
  `keywords` and `isPartOf` were gone. Restored with the SPA's category
  mapping. `features` moved from `toolsConfig.json` into the manifests to feed
  `featureList`. Breadcrumbs were rendered but never described; the index
  published no graph at all.
- Missing `theme-color` (and the two sources disagreed — `#1c7ed6` against the
  manifest's `#1e1e2e`), `author`, `twitter:creator`, webmanifest `start_url`.
- Param deep links were **already correct** and are unchanged: the 200 rewrite
  serves the base page's document, so they self-canonicalise and stay out of
  the sitemap. Recorded so it is not "fixed" later by mistake.

**The OG pipeline is Playwright, not sharp.** `@fontsource-variable/inter`
ships **woff2 only**; satori cannot read it and sharp/resvg need a TTF handed
to them, so build-time rasterising meant either three more packages or
trusting the build image's fonts — which fails as a silent fallback typeface,
not an error. Playwright's chromium is already a devDependency and reads the
same woff2 the site does. Cards are generated on demand (`pnpm generate:og`)
and committed; they change only when a tool's title, icon or hue does.

**`public/images/` was 80MB of unreferenced screenshots and videos** from June
2025 — including a set for the retired Network Designer — uploaded to Pages on
every deploy, referenced by nothing. Gone, along with the genuinely dead
modules: `src/utils/index.js` (already broken — it re-exported a
`getSubnetBgColorHex` that does not exist, harmless only because nothing
imports the barrel), `tldUtils`, `api/apiUtils`, the superseded
`utils/sharelink.js` + suite, the regions modules and their JSON, and
`prism-theme.css` (confirmed by running a conversion in the browser after
removing it, not by grep).

**A pre-existing e2e failure, found and fixed.** The mobile burger test
dismissed the menu by clicking the h1, but at 390px the open panel covers the
viewport past y≈240 — the h1 is *underneath* the menu, not outside it.
Deterministic 3/3, and it fails identically on this branch's base commit, so
session 9's "22/22" had already stopped being true. Verified in the browser
that dismissal itself works; the test now clicks a raw point in main's left
gutter, since every locator-based target gets scrolled under the sticky header.

**Documentation drift is now mechanical rather than moral.** The docs claimed
11, 14 *and* 15 tools in different places and still advertised the Network
Designer. `scripts/generate-docs.mjs` writes the inventory from the registry
into both READMEs and `src/tools/docs.test.js` fails on drift — it caught real
drift on its first run. `DESIGN_SPEC.md`, `DESIGN_SYSTEM.md` and
`STYLE_GUIDE.md` are deleted; `docs/tools/subnet-calculator/` is written from
the code; `docs/tools/markdown-table/` renamed to its manifest id.
ARCHITECTURE/DEVELOPMENT/DEPLOYMENT and the workers README are **deliberately
left** for the commit that deletes the SPA, rather than written twice.

**State:** `pnpm test` **1015 / 32** · `pnpm test:e2e` **22/22** · `pnpm lint`
0 errors, 13 warnings · both builds green. Four commits on
`redesign/phase-0`, not pushed.

**What remains in Phase 6** was, at the time of writing this entry, gated on
the owner's flip: delete the SPA tree and `toolsConfig.json`, collapse
`src/bridge/` to `ToolIsland.jsx`, drop CI's SPA build step and the stale
`src/components/tools/**` globs, alias `build` to `build:astro`, and regenerate
the four SPA-era documents. The owner then declined the two-step and it was all
done in the same session — see the entry below.

### 2026-07-20 — Session 10 (continued): the cutover, done in one step

**The owner asked why the flip had to be a separate event, and was right.**
The two-step sequence — merge as a no-op, then flip the Pages dashboard —
existed as insurance against the Astro build behaving differently on
Cloudflare than locally. **Gate 2 had already bought that risk down:**
`dist-astro` was deployed to real Pages infrastructure in session 8 and the
full matrix ran green against it. What remained was the ordinary risk of any
deploy, which Pages' one-click deployment rollback covers better than editing
build settings under pressure.

So Astro took the SPA's names. `pnpm dev` / `pnpm build` / `pnpm preview`,
output to `dist/`. **The hosting configuration does not change**, which makes
merging the cutover and rollback a Pages rollback. The `:astro` suffixed
scripts are gone. One caveat handed back to the owner: the Pages project's
build command and output directory need to read `pnpm build` and `dist` —
unverifiable from here.

**Deleted:** `index.html`, `main.jsx`, `App.jsx`, `vite.config.js`,
`postcss.config.js`, `src/components/layout/`, `SpaToolPage`, `SEOHead`,
`ToolHeader`, `toolIconMap`, `theme-provider`, `ui/theme-toggle`,
`seoUtils.js`, `toolsConfig.json`, and the two SPA-only favicons.
Dependencies: `@tabler/icons-react` (the two layout files were its last
callers — the `IconBrandTerraform` CLAUDE.md said had no lucide equivalent is
not in the tree at all), plus `postcss` and `@tailwindcss/postcss`, since
Tailwind arrives through `@tailwindcss/vite`. Styling was checked in a browser
afterwards, not just the build.

**`src/bridge/` did not die at cutover, contrary to its own docblock.**
`ShellContext` did — its only consumers were `SEOHead` and `ToolHeader`, whose
job was to stand down under the shell — but `ToolIsland` supplies the router
nine tools call `useParams` from, plus the toaster and the link interception
that stops a react-router `Link` swallowing a cross-tool navigation. Folding
it into `[tool].astro` would only move it. The docblock now says so.

**Frozen contract #1 nearly died quietly.** `registry.test.js` proved every
legacy route still resolved by parsing `App.jsx`'s live `<Route>` table —
deleting that file would have deleted the proof along with it, and the suite
would have gone green on nothing. The 26 routes are transcribed into the test,
extracted from `App.jsx` at the commit that removed it, with the rule written
next to them: **nothing comes off the list**; a retiring tool declares
`redirectFrom`.

**Two latent faults surfaced while regenerating the docs from source.**

- **`cloudflare-worker/buzzwords.js` would not have deployed.** It imported
  `../src/components/tools/buzzword-ipsum/data/buzzwords.json`, a path deleted
  when the tools moved. `wrangler deploy` would have failed to bundle. Fixed;
  the running worker predates the move and is unaffected until redeployed.
- The same worker advertises rate limiting in its file header and reports
  `services.rateLimit: "operational"` from `/health`, with no counter, binding
  or storage behind it. **Left as-is and documented** — it is a false claim in
  a public health endpoint, so it is the owner's call, not a drive-by.

Also recorded, not fixed: `ssl.js` logs `Object.keys(env)`, the SSL Labs
credentials and the whole upstream response, and returns `error.stack` in 500
bodies; `tenant.js` logs its full origin list. Worker hygiene has its own pass.

**`hydrate` was removed from the manifest.** All fifteen declared it and
`registry.test.js` validated it, but `[tool].astro` hard-codes
`client:only="react"` — so it was config shaped like a switch, wired to
nothing. The same trap as the `iconColor` prop fourteen tools passed to a
component that never read it.

**The four SPA-era documents were rewritten from source.** The workers README
was the worst: KV caching, TTL and invalidation, rate limiting with backoff,
`SSL_LABS_API_KEY`, `CACHE_TTL`, `DEBUG_MODE`, a `POST /analyze` endpoint and
separate dev/staging environments — none of which exist.

**State:** `pnpm test` **1000 / 32** · `pnpm test:e2e` **22/22** against
`dist` · `pnpm lint` 0 errors, 11 warnings (down from 13) · build green ·
index, a tool page and island hydration checked in the browser. Ten commits on
`redesign/phase-0`, not pushed.

**Phase 6 is complete bar the follow-ups it always listed as optional:** worker
hygiene (shared CORS module, the logging above, the false rate-limit claim),
wrangler-action deploy CI, decommissioning `certificate.russ.tools`, and
Search Console monitoring once the merge lands.

### 2026-07-20 — Session 11: bespoke tool icons replaced with Material glyphs

**Model:** GPT-5. **Branch:** `main`.

The owner rejected the bespoke line icon set and chose the filled baseline
Google Material Design family after reviewing the React Icons catalogue. All
fifteen tools now have distinct, literal glyphs: manage-search, new-label,
data-object, campaign, schedule, transform, DNS, token, table-view, apps,
password, policy, LAN, corporate-fare and badge. The manifest keys changed with
the drawings, including the password generator's in-island icon reference.

**No icon dependency was added.** The selected Material paths are vendored in
`src/shell/icons.mjs`, where the Astro shell and React islands already share one
definition. Both renderers changed from stroked linework to filled
`currentColor`, preserving category hues without creating an Astro/React split.
The Material Icons Apache 2.0 licence now ships at
`public/licenses/material-design-icons.txt`, and `DESIGN.md`, `AGENTS.md` and the
architecture/design references describe the new source of truth.

Every committed per-tool Open Graph card was regenerated because the icon is
part of its artwork. Browser verification covered the index and password tool
in both themes: the grid rendered 15 unique 25px glyphs with category-coloured
fills and no strokes, and the password drawing was identical in the 34px Astro
header and the 40px React island.

**State:** `pnpm test` **1006 / 32** · `pnpm test:e2e` **22/22** · `pnpm lint`
0 errors, 11 existing warnings · build green · Open Graph cards and dark/light
rendering visually checked.

### 2026-07-20 — Session 12: per-tool documentation becomes in-app help

**Model:** GPT-5. **Branch:** `main`.

The owner spotted that only Azure KQL and Tenant Lookup exposed tool-level help,
then used the gap to remove a deeper duplication: help copy and per-tool
documentation should not be separate bodies of text. All fifteen READMEs were
reviewed against the current implementations and rewritten as concise, accurate
guides. This removed thousands of lines of stale claims about retired routes,
storage behavior, APIs, packages, and UI that no longer exists.

Each README now contains a `help:start` / `help:end` block with quick-start,
feature guidance, practical tips, privacy/storage behavior, and troubleshooting.
The manifest contract gained a lazy raw-Markdown loader, and `ToolHelp` renders
that block through the shared right-hand sheet with `react-markdown`. The help
chunk is requested only when the sheet first opens. The two old bespoke help
components and their local trigger state were deleted, leaving one trigger,
placement, renderer, and content source across the site.

The registry contract now requires a help loader and executes every one during
tests, asserting that all fifteen documents contain a valid block with at least
four sections. A Playwright matrix opens and closes the sheet on every tool and
checks the tool-specific title plus rendered Quick start heading, which also
guards against duplicate triggers and Markdown-loading failures.

The KQL follow-up exposed one composition edge: its existing Share Configuration
button rendered in a second one-button row below the new shared Help row. A
shared action portal now lets a tool contribute an action to the shell-owned row;
KQL uses it for Share Configuration, preserving its state and handler while the
two buttons render together. Azure CAF Naming now contributes its Copy
Configuration Share URL action through the same slot. The browser matrix asserts
both pages' button positions match, so the empty-row regression is pinned.

**State:** `pnpm test` **1021 / 32** · `pnpm test:e2e` **39/39** · `pnpm lint`
0 errors, 11 existing warnings · build green.

### 2026-07-25 — Session 13: the breadcrumb Google could not read

**Model:** Opus 5. **Branch:** `main`.

Search Console reported *"Missing field 'item' (in 'itemListElement')"* against
the whole site. The cause was in `ToolLayout`'s `BreadcrumbList`: position 2, the
category, was a name with no `item`, because the category was a label with no
page behind it. Google requires `item` on every `ListItem` but the last, and one
missing value suppresses the entire trail rather than that one level — so no
tool page has ever shown a breadcrumb in results.

The fix gives the category a real destination instead of deleting the level. The
index already rendered a section per board group; each now carries an `id`, and
its filter script reads the fragment on load and on `hashchange`, so
`/#network` genuinely shows the network tools and degrades to an anchor scroll
without JavaScript. The visible crumb became a link to the same place, so the
rendered trail and the structured data now agree exactly. `categoryGroupId()` in
`categories.mjs` owns the one wrinkle — Azure and Microsoft share the
`microsoft-azure` group on the index — so the crumb cannot point at an anchor the
index does not render.

The new `seo.test.js` case is the durable part: it asserts every emitted
breadcrumb item has an `item`, that the URL is on-site and resolves to a built
page, that any fragment matches an `id` the page actually renders, and that
positions run 1..n. Verified by deleting one `item` from the built output — the
test reproduces Search Console's message.

Three smaller SEO faults went with it. The sitemap nominated
`https://russ.tools` while the index's canonical says `https://russ.tools/`.
The tool pages' `isPartOf` and the index's `WebSite` node shared a name but no
`@id`, so a crawler read sixteen unrelated sites rather than one — both now
carry `WEBSITE_ID`, and the index node gained the site description and
`inLanguage`. `og:locale` was absent.

**State:** `pnpm test` **1022 / 32** · `pnpm lint` 0 errors, 11 existing
warnings · build green · breadcrumb link and `/#network` filtering checked in
the browser.

---

### Session 8 — Signal: the visual language replaced

`design_handoff_signal/` arrived as a drop-in replacement for the root
`DESIGN.md` plus a hi-fi HTML prototype of the shell, the index, `/ssl-checker`
and `/cron`. Applied in full, including peripherals.

**What Signal is.** Square (`rounded: 0` at every step, no shadow scale at all),
structured by rule weight — 3px structural, 1px hairline — instead of radius and
elevation. Graphite `#16171b` with a bone light peer, one chartreuse accent
`#c6f232` that only appears on something you can press, Instrument Sans +
Red Hat Mono, and the index as one shared-edge ruled grid with no `gap`.

**The handoff did not drop in.** Two things had to be resolved before anything
could be applied, and both are the kind of fault this repo's tests exist to
catch:

1. **The palette failed 37 of the contrast assertions in
   `tokens.contrast.test.js`.** Worst was `outline-strong` at 1.50:1 — Signal
   assigns it to the `select` border, a WCAG 1.4.11 control boundary. Also:
   `ring` (the raw accent) at 1.18:1 on bone, every status `*-foreground` at
   ~3.3:1 in light because the handoff coupled them to `on-primary`, the whole
   light category set falling just short on the darker bone inset, and a footer
   that is dark in *both* themes with no ink role declared — `#16171b` text on a
   `#16171b` ground. Nine hues were corrected by moving lightness only, and
   three roles added (`on-status`, `on-footer`/`on-footer-muted`, and the
   `*-subtle` tints the handoff dropped while twelve tool files still used them).
2. **The exporter reads four front-matter keys and ignores the rest.**
   Confirmed by running it: `borderWidth`, `shadow`, `motion` and `components`
   produce no output whatsoever. Those are transcribed into `globals.css` by
   hand and pinned by a new test. The exporter is now version-pinned too.

**What got smaller.** 352 colour tokens → 71. `tokens.generated.css` 437 → 139
lines. `globals.css` 697 → 421. `shell.css` 1448 → 1046. Five separate
enumerations of the six palettes → none. The test count fell from ~1022 to 514
because the contrast matrix ran over 12 palette/mode combinations and now runs
over 2 — it measures *more* roles against fewer themes, and the base dark/light
pair it now covers was never actually measured before.

**Two judgement calls against the handoff**, both logged in
`docs/BEHAVIOR_CHANGES.md`: the 3px panel rule is opt-in (`<Card emphasis>`)
because a tool page stacks five to ten panels and the CRON builder came out as
six meaningless bright stripes; and `SiteMark` stays instead of the prototype's
plain accent square, which was a stand-in for a logo it had no access to.

**A pre-existing build failure fixed on the way.** `pnpm build` had been dying
in `generatePages` on `Named export 'parseCookie' not found` (noted in
`.design-sync/NOTES.md` as failing on `main`). Cause: an orphaned real
`node_modules/cookie@1.0.2` directory left by an old npm install, which Node
resolves ahead of pnpm's own copies when it imports the built prerender entry
from `dist/`. Removing it unblocked the build, and with it `seo.test.js`,
`canonical.test.js` and the whole e2e suite.

**Verified in the rendered DOM, not just the source** — the rule this repo
learned the hard way. A Playwright pass over both themes checked 41 computed
properties: the font families actually resolve to the self-hosted faces (the
serif-fallback collision), no stray radius survives anywhere, the grid has no
gap and the cells carry the hairlines, the badge is a solid fill behind graphite
ink in both themes, the footer keeps its dark ground and legible ink under
light, and the focus ring is olive rather than invisible chartreuse on bone.

**State:** `pnpm test` **514 / 33** · `pnpm test:e2e` **41** · `pnpm lint` 0
errors, 11 existing warnings · build green · OG cards regenerated · both themes
checked in a real browser.

### 2026-08-22 — Session 8 (Stacks: the second visual language)

**Model:** Fable 5. **Branch:** `design/signal` (continues; the branch name is now
historical).

**Decision** — Signal shipped but was rejected on look and feel ("functions great but
really not feeling it"). Four genuinely different directions were mocked on a Claude
Design canvas against the real homepage content (Broadsheet warm editorial / Lumen
soft-depth dark / Stacks playful-chunky / Ledger calm minimal); the user picked
**Stacks**, and a build-out page (Subnet Calculator tool page, dark homepage peer,
component sheet) settled the open questions before any code moved.

**The language** — `DESIGN.md` is rewritten as `stacks-1`. Chunky radii (8/10/14/18px)
always paired with a 2px `rule` border (ink on paper / cream on ink); a hard offset
shadow (`press-sm`/`press`/`press-lg` in the rule colour) that means *pressable* and
appears only on controls, hovered tiles and the one `panel-emphasis` per page —
`:active` sinks the element by the offset. Paper light is the house ground; ink dark is
the peer (the CSS keeps dark as the unsuffixed default purely as plumbing). Accent
green `#6ee787` (fills only; `primary-text` is `#1b7038` in light). Category hues went
candy: network `#2dd4bf`, azure `#5aa7ff`, microsoft `#b393ff`, security `#ffc857`,
**developer `#ff9f43` orange** — moved off green deliberately so a primary button never
reads as a category signal (the canvas mockups had it green; the design review caught
the collision). Type: Bricolage Grotesque (display/headings, 700–800), Space Grotesk
(body + all small labels — labels are sans now, not mono), Space Mono (data only).

**What carried over untouched** — every token *name* and type-step name (the five
load-bearing consumers needed zero edits), the category fill/text two-slot system and
both `category-accent.test.js` guards, `on-status`/`on-footer`, the two-theme economy,
the spacing scale, the stacked controls-above-results layout (the two-column split
stays withdrawn), and the entire contrast-floor test matrix — the new palette passed
all 514 tests on the first run after the two deliberate contract-pin updates (shape
scale + font families).

**Mechanics** — fonts swapped to `@fontsource-variable/bricolage-grotesque`,
`@fontsource-variable/space-grotesk`, `@fontsource/space-mono` (+700); `THEME_COLOR`
and the webmanifest moved to `#1a1812`; `generate-tokens.mjs` needed no changes (line
heights kept Signal's values by construction). The exporter exits non-zero if a
`{shadow.*}` reference appears in `components` — shadow values are stated as plain
offsets with the colour in prose. `globals.css` gained `--font-display` (headings get
Bricolage via element selectors since type steps deliberately carry no family) and the
three `--shadow-press*` tokens; `shell.css` restyled (pill nav, key-cap chips with
invert-on-active, gapped tile grid replacing the shared-edge grid, category icon tiles,
dark-mode tiles get category-hued hover shadows); all of `src/components/ui/` moved to
`border-2 border-rule` + radius + press shadows. Verified in a real browser via
Playwright against `pnpm dev` (port 4321): computed styles and screenshots in both
themes. Note `pnpm dev:astro`/port 5173 no longer exists — the script is `pnpm dev`.

### 2026-08-22 — Session 8b (header and footer rework)

The Stacks header was rejected as timid — a lone boxed brand chip next to naked
text links. Four header treatments were mocked on the design canvas; the user
chose **H3's signage combined with H4's folder tabs**: the brand is now the
toolbox mark (`primary-text`) plus `russ.tools` in Bricolage 800 with no box,
and the nav items are folder tabs standing on the header's 2px rule — bordered
three sides, top corners rounded, `nav-active` ground — with the active tab
taking the page ground and erasing the rule beneath itself (`margin-bottom:
-2px` + a surface-coloured bottom border). On tool pages every tab sits closed.
In the mobile dropdown the tab shape reverts to bordered rows. The Source link
carries a `</>` code glyph (the ↗ arrow was rejected).

The footer stopped being an ink slab: it is now a deepened band of each theme's
own ground (`footer-light #efe7d3`, `footer #14120e`), so `on-footer` /
`on-footer-muted` gained `-light` peers and joined the light remap — remember
that remap lives in TWO blocks with different indentation (`.light` at 4
spaces, the media fallback at 6) and the sync test catches a one-sided edit.
DESIGN.md's Navigation and footer sections, the component entries and the
contrast-test comment were updated to match. 514 unit + 41 e2e green.

### 2026-08-22 — Session 8c (Espresso: the dark theme rework)

The first Stacks dark was rejected: it inverted the materials (cream borders,
cream shadows on near-black) but kept card and page at almost the same value,
so every card collapsed into a wire outline. Three rethinks went on the design
canvas (K1 Espresso / K2 Toast / K3 Neon board); the user picked **K1**, whose
thesis is that dark should keep the LIGHT theme's physics: page lifts to warm
cocoa (`#241f18`), cards sit visibly lighter (`#2e2820`), and the press shadow
goes back to being darker than the ground.

That last point forced a new token pair: the shadow colour was `rule`, which
is cream in dark — a glow, not a press. `shadow-ink` / `shadow-ink-light`
(`#0f0c07` / `#17150f`) now feed the three `--shadow-press*` values, joined
the light remap (both blocks), and the contrast test asserts shadow-ink is
strictly darker than both grounds in both themes. The dark category-hued card
hover shadow is retired with the rework — the shadow is `shadow-ink`
everywhere. The whole dark neutral ramp, subtle tints, nav-active and footer
were retuned for the lifted grounds (faint and dim both needed lightening to
clear their floors on the new inset), and `THEME_COLOR` follows the new
surface. 514 unit + 41 e2e green.

### Session 9 — help leaves the drawer for its own page

Owner feedback on the post-redesign help drawer ("not a fan"): its section
headings were ALL-CAPS Space Mono — the exact Signal idiom Stacks retired
(mono is data only) — the copy was squeezed into a 448px sheet, and the
overlay dimmed the tool it was meant to be read alongside. Three directions
were mocked on a design canvas (in-page section, own page, restyled drawer);
the owner picked **help on its own page**.

Landed as `/​<tool>/help`: a new `src/pages/[tool]/help.astro` prerenders the
same `help:start`/`help:end` block of `docs/tools/<id>/README.md` the drawer
used to fetch, through a static (no client directive) `HelpArticle` React
component — react-markdown now runs at build only and ships no JS. The page
gets the standard tool furniture (`rt-tool-head`, crumb + Help level, icon,
`<h1>{title} help</h1>`), an "On this page" jump-chip row reusing `rt-chip`,
a `72ch` article styled by new `rt-help-*` rules, and a back link.
`ToolHelp.jsx` is now just an outline-button link; `ui/help-dialog.jsx` and
`ui/sheet.jsx` are deleted. Help URLs joined the sitemap (lastmod from
`docs/tools/<id>`), and `generate-redirects.mjs` emits a `/help`
self-rewrite ahead of each `/:param` rewrite — Cloudflare evaluates rules
before assets, so `/ssl-checker/:domain` would otherwise swallow
`/ssl-checker/help`. `e2e/help.spec.js` rewritten for the navigation;
ledger entry in `docs/BEHAVIOR_CHANGES.md`.

### Session 10 — the AI-agent surface (llms.txt + WebMCP)

The owner pointed at two integrations (`@adkinn/astro-ai-readiness`,
`astro-webmcp`) and asked for AI tools and compatibility. The first was
rejected on inspection: Astro `^5||^6` peer against our 7.2.0, Node ≥22.12,
and everything it generates beyond llms.txt already exists here better
(manifest-driven JSON-LD, robots.txt, the one-generator sitemap). Its useful
third is hand-rolled instead: `scripts/generate-llms.mjs` writes
`public/llms.txt` (llmstxt.org index, categories → `[title](url):
shortDescription`), `public/llms-full.txt` (per tool: manifest copy +
Features + the same `help:start`/`help:end` block `/​<tool>/help` renders)
and `public/agents.md`, at the head of `pnpm build`, pinned bidirectionally
against the registry by `src/tools/llms.test.js`.

`astro-webmcp@0.5.0` landed as-is in `astro.config.mjs` (manifest search
backend, outputs sanitised, 8192-char cap) — but its dist scan only reads
index.html-shaped documents, so under `build.format:'file'` every tool page
became a slug with an empty description. `scripts/patch-webmcp-manifest.mjs`
now runs as the build's last step and rewrites `dist/_webmcp/manifest.json`
(and the section list in `dist/.well-known/skills/index.json`) from
`loadManifests()`: real titles, shortDescriptions as the searchable field,
categories as collections, 404/delete dropped. Pinned by
`src/tools/webmcp.test.js`.

Custom tools went in at the island, not the config: the package's
`customTools` are stringified function bodies evaluated on every page, which
would duplicate tool logic outside the bundle and dodge ESLint. Instead
`src/lib/useWebMCPTool.js` (beside `useLookupTool`) registers a module-scope
descriptor via `document.modelContext.registerTool` (navigator fallback;
AbortSignal + unregister-handle + `unregisterTool` teardown; clean no-op
elsewhere — the same progressive enhancement as the package's own client).
Subnet Calculator registers `calculate_subnet` on `ipv4Details`/
`ipv6Details` (BigInt `totalAddresses` folded through the island's own
`formatTotal` — `JSON.stringify` throws on it, the TOML gotcha again);
Base64 registers `base64_encode`/`base64_decode` on the real codecs, enum'd
to `ENCODING_MODES`. Hook behaviour pinned by `src/lib/useWebMCPTool.test.jsx`.

Lint 0 errors / 11 warnings (unchanged), 534 vitest (+18), 41 e2e. Ledger
entry in `docs/BEHAVIOR_CHANGES.md`; AGENTS.md gained "The AI-agent surface".

### Session 10b — discovery statics (Link headers, catalogs, Content-Signals)

An isitagentready.com scan listed ten gaps. Four were real for a static,
no-auth site and landed as checked-in statics (the well-known files are
site-shaped, not tool-shaped, so no generator): `public/_headers` (Cloudflare
Pages) puts `Link: </.well-known/api-catalog>; rel="api-catalog",
</agents.md>; rel="service-doc"` on `/` and gives the catalog
`application/linkset+json` + `Access-Control-Allow-Origin: *`;
`public/.well-known/api-catalog` is an RFC 9727/9264 linkset anchoring
`ssl.`/`whois.`/`tenant.russ.tools` with service-doc links into the workers
README; `public/.well-known/ai-catalog.json` is the ARD manifest (urn:air
ids, representativeQueries) pointing at llms.txt, llms-full.txt, agents.md,
`_webmcp/manifest.json` and the api-catalog; `robots.txt` gained
`Content-Signal: search=yes, ai-input=yes` inside the wildcard group —
`ai-train` left undeclared on purpose, it's the owner's rights call.
All pinned against `apiConfig.json` and `site.mjs` by
`src/tools/agent-discovery.test.js` (+8), and verified on the wire through
`wrangler pages dev dist`.

Rejected as not applicable rather than unimplemented: OAuth/OIDC discovery,
protected-resource metadata and auth.md (no protected APIs — fabricated auth
metadata would misdirect agents) and the MCP server card (WebMCP is in-page;
there is no standalone MCP server). Remaining scan items live outside the
repo: DNS-AID SVCB records and Cloudflare's Markdown for Agents are zone /
dashboard changes.

Lint 0 errors / 11 warnings (unchanged), 542 vitest (+8), e2e untouched.

### 2026-08-22 — Session 11: the mobile review (390px sweep, every tool)

A phone screenshot of dns-lookup showed buttons hanging off card edges. A
Playwright sweep at 390×844 (all 16 pages, empty *and* interacted states,
with an offender scan for anything painting past the viewport) found the
one screenshot was ten distinct faults, each pinned and fixed:

- **password-generator island crashed everywhere** — `createToolIcon('password')`
  names an icon that isn't in `icons.mjs` (the manifest says `key-round`).
  The only tool whose island didn't mount; caught because the sweep looks
  at every page, not the one reported.
- **The index lost its category chips on phones** — the 600px media query
  set `flex-wrap: nowrap` on the whole `.rt-filters` band, so the find
  field's `flex: 1 0 100%` couldn't wrap and crushed the chip row to
  nothing. The nowrap belonged to `.rt-chips` alone (it already has it);
  the band wraps again.
- **`grid-cols-N` TabsLists overlap when labels outgrow their tracks** —
  Tailwind's tracks are `minmax(0, 1fr)`, so cells can't grow and the
  nowrap centered labels paint over their neighbours. `ui/tabs.jsx` now
  gives every TabsList `max-w-full overflow-x-auto`; the three lists whose
  labels genuinely can't fit at 390 (jwt ×3, azure-kql ×4, ssl-checker ×6)
  drop the grid below `sm`/`lg` and scroll at natural width; azure-naming's
  three icon+label tabs stack (`grid-cols-1 sm:grid-cols-3`).
- **The `justify-between` row with an unshrinkable left side** — the
  pattern behind the screenshot. History/list rows in dns-lookup,
  whois-lookup, tenant-lookup and ssl-checker pushed their trailing button
  past the card edge because the left flex block had no `min-w-0` and the
  badge row no wrap. All now `flex-wrap` + `gap-2` + `min-w-0`.
- **`break-all` split IPs mid-octet** (`142.251.29.13` / newline / `8`) —
  dns-lookup record rows now `break-words`, which wraps at the spaces the
  text already has.
- **Input+button lookup rows crushed the input to two characters**
  (ssl-checker, tenant-lookup, whois-lookup, microsoft-portals) — stacked
  `flex-col sm:flex-row`; ssl-checker's flush 3px-border object stacks
  inside its wrapper, seam intact.
- **markdown-table's toolbar forced the whole document to 698px** — the
  island toolbar and TableEditor controls rows now wrap.
- **azure-kql's service grid** — `grid-cols-2` at 390 with `whitespace-nowrap`
  buttons overlapped; now `grid-cols-1 sm:grid-cols-2` with
  `whitespace-normal` text.
- **data-converter's `justify-end` toolbar clipped its first chip** — wraps.

The sweep scripts live in the session scratchpad, not the repo; the
offender scan (any element whose rect leaves the viewport, minus those
inside a real `overflow-x` scroller) is the reusable trick. Remaining
flagged elements are deliberate scrollers (index chips, column-alignment
row) and sonner's fixed-position mobile wrapper (its toast compensates;
fixed elements don't scroll the document). 542 unit + 41 e2e green, lint
0 errors / the same 11 warnings.

### Session 11 — the index becomes a stream, and the front door grows a control

The homepage was reviewed as "too rigid and card based". The diagnosis was
repetition rather than the grid: the category was stated three times per card
(section heading, `category-fill` icon tile, `rt-card-badge`) on a row where
every card shared it; fifteen identically-sized tiles meant nothing was the
front door; and the fixed 3-track grid manufactured a hole at the tail of
Microsoft & Azure, Developer and Content. The page also spent none of the one
`panel-emphasis` DESIGN.md allows it.

Three directions were drawn on a Claude Design canvas — Ledger (no cards at
all, a hairline index), Shelf (tools standing on a rule, extending the nav's
own idiom) and Workbench. Workbench was chosen, then taken further: **lose the
sections entirely**, since the chips already name the categories and the icon
tile already carries the hue.

**The load-bearing detail is that the width steps are discrete.** The first
attempt scaled tile width continuously off title and description length. It
produced fifteen widths inside a 55px band, which packed straight back into a
perfect 3×5 — the grid, minus the headings. Three distinct steps
(`235 / 315 / 400px`) are what make rows break 3/2/3/3/4. There is an e2e test
whose only job is to fail if every row holds the same count, because every
other assertion about the index passes either way.

Tools stay in category order, so the hues cluster and drift teal → blue →
purple → amber → orange → pink down the stream: the grouping is drawn rather
than labelled. 1286px tall against 1612px before, at the same width.

The emphasis panel is spent on a **control, not a banner**: paste a domain,
IP, CIDR, JWT or cron expression and it opens the tool that reads it.
`src/lib/paste.js` ranks rather than routes — five tools accept a bare
hostname, so it returns five chips and Enter takes the first. It ships no
React; the detectors are the existing dependency-free `ipv4.js`/`ipv6.js`, the
newly-extracted `cron-builder/lib/cron.js`, and a new `src/lib/hostname.js`.

`hostname.js` exists because the repo already had **three** divergent domain
regexes (`sslUtils.js`, `tenantLookup.js`, and a third inlined in
`getTenantId`) and none of them can be used here: two drag `@/core` onto a page
that ships nothing, and all three call a bare word like `test` a domain — which
`detectBase64` also calls base64. Requiring a real dotted name is the tie-break
that lets `test` fall to the encoder. Consolidating the other three onto it is
left as a follow-up.

Traps hit and worth remembering:

- **`seo.test.js` walks every tool's BreadcrumbList against the built HTML**
  and fails unless `dist/index.html` carries a literal `id="<hash>"` for each
  `/#<group>`. The anchors moved onto the first tile of each run — which lands
  the reader on the tool rather than a heading — with a visually-hidden `h2`
  beside each so the rotor keeps more than one entry.
- **/404 reuses the index's old group markup.** `.rt-board`, `.rt-group*` and
  `.rt-grid` stay in `shell.css` and are not dead code; only the `is-filtered`
  and `[data-demoted]` machinery was deleted.
- **`.rt-card` must keep its class name.** `globals.css` pins
  `.rt-card:hover` to `transform: none` under `prefers-reduced-motion`, so
  renaming it to `.rt-tile` would have dropped the reduced-motion contract
  with clean lint.
- **`/cron/*%2F5%20*%20*%20*%20*` proves Pages preserves `%2F` through the
  rewrite.** Nothing had tested that; `/base64/:input` had been relying on it
  untested since it shipped.
- The e2e suite ran green against a stale `dist/` after an `index.astro` edit.
  `pnpm test:e2e` serves the build, not the source — rebuild first.

**/404 got the same panel, and a use for the URL that failed.** The panel is
now `shell/PastePanel.astro` + `lib/pastePanel.js`, shared by both pages so
they cannot drift. On /404 it asks a different question ("What were you
looking for?") and is seeded from the path: `/whois/example.com` arrives with
the domain in the field. `lib/nearestTool.js` ranks the catalogue against the
failed segment — containment scored separately from edit distance, because
`subnet` vs `subnetcalculator` is a terrible edit distance and an unambiguous
prefix, and "I typed the first word only" is the commonest way a tool URL is
got wrong. Below a 0.55 threshold it says nothing: a confident wrong guess on
a 404 is worse than silence.

The popular-tools list and the "URL may be mistyped" paragraph were removed at
the owner's request. Without JavaScript /404 is therefore the headline alone;
the header nav is the way out.

660 unit + 46 e2e green, lint 0 errors / the same 11 warnings.

### 2026-08-22 — Session 12: the index learns to move

The stream shipped static, and it read static. Not for want of animation —
for want of motion on the two things you actually *do* on the page:

1. **Filtering was a hard cut.** `card.hidden = !hit`, flex re-wraps, done.
   Fifteen tiles teleported into a new arrangement, which is the page's
   central interaction and had no continuity at all.
2. **The tool tile did not press.** `.rt-card` lifted on hover and then
   absorbed the click without moving. DESIGN.md's second rule is "shadow means
   pressable; pressing sinks it", and the homepage's primary pressable was the
   one pressable on the site exempt from it. Chips obeyed. The paste button
   obeyed. The tile did not.

**DESIGN.md's Motion section was amended**, deliberately and with the owner's
sign-off, having selected the entrance against a recommendation not to. It
said "no entrance animations, no ambient motion, no parallax, no glow"; it now
keeps the ambient/parallax/glow ban and admits three bounded exceptions, all
framed as *the object behaving like an object*: animated reflow, one entrance
per load, and a 90ms fade on a value swapped under the reader. `duration-settle`
(240ms) joins the front matter and `globals.css`, pinned by the same drift loop
in `tokens.contrast.test.js` that already guards `duration-fast`/`-base`.

**The refilter travels.** Each tile carries `view-transition-name: t-<id>`
(`ToolCard.astro`, only when `order` is passed — /404 renders without it and
gets neither hook). `setCategory` runs `render` inside
`document.startViewTransition`, so the browser FLIPs the reflow: survivors
slide to their new rows, leavers fade out where they stood. Measured, not
assumed — pressing "Microsoft & Azure" moves the surviving Azure tile 129px.

Three things it declines on, all landing on the old instant reflow: reduced
motion, no `startViewTransition`, and **every path that is not a discrete
choice**. Typing calls `render()` directly — a transition per keystroke
queues, skips and stutters. Verified: a chip press starts exactly 1, typing
"dns" starts 0. Chip presses, back/forward, Escape and "clear the filter" all
settle; keystrokes never do.

`shell.css` silences `::view-transition-*(root)`. Its default is a full-page
cross-fade that would dissolve the header, paste panel and chip row — none of
which changed — turning a precise rearrangement into a wash.

**The deal-in.** `@keyframes rt-card-in` starts each tile 3px raised carrying
the `press` shadow and lands it flat and shadowless — the press vocabulary run
backwards, so the page assembles out of visibly pressable things rather than
fading up like any other card grid. Pure CSS on prerendered markup: blocks no
content, needs no JS, cannot strand a tile invisible. `backwards` fill holds
the first frame through the stagger delay; without it every tile paints flat
then jumps back up to start. The 18ms stagger is capped at ten steps in CSS
(`min(var(--rt-i,0), 10)`), so tiles 11–15 land together and the last tile is
down inside 420ms however far the catalogue grows — verified, indices 10 and
14 both compute `0.18s`. An uncapped ramp is how tool #16 would have made the
page feel slower than #15.

**The count ticks.** `15 tools · nothing leaves the browser` never changed
while the page showed three; `#rt-status` was carrying the whole announcement
and only screen readers heard it. `#rt-count` now reads `4 / 15` when
filtered, `tabular-nums` so the tick does not shove the rest of the line
sideways. WAAPI rather than CSS — the element persists and only its text
changes, which re-triggers no keyframe — and therefore `matchMedia` is checked
in JS, since `globals.css`'s reduced-motion block cannot reach a script-driven
animation. Not a live region: `#rt-status` already says it, and two would say
it twice into the same ear.

**Two 90ms opacity fades.** The empty state (fifteen tiles replaced by one
sentence). And the paste panel's matches, which rebuild on every keystroke —
each keycap is a new node, so it starts on insertion with no re-trigger dance.
Scoped off `data-resting` so it is matches only: the resting examples are
prerendered markup restored into a panel that is `hidden` until its script
runs, and fading those would be a second entrance the page has not earned.

Reduced motion removes all of it — entrance, transition, both fades — rather
than shortening it. `globals.css` gained `.rt-card:active` to its `transform:
none` list and an `::view-transition-*` `animation: none` clause, because view
transition pseudo-elements live outside this document's cascade and the
blanket `animation-duration` override does not reach them. Verified under
Playwright's `reducedMotion: 'reduce'`: entrance duration `1e-05s`, 0
transitions started, count still updating.

Every claim above was checked against computed styles and instrumented
behaviour in Chromium, not against the source — this file's own standing
warning is that lint proves a class was written and only the DOM proves it was
applied.

660 unit + 46 e2e green, lint 0 errors / the same 11 warnings.

### 2026-08-22 — Session 12b: the header tab nobody was standing on

Reported from a tool page: the nav is drawn as folder tabs and none of them
was open. Confirmed and then found to be worse than reported.

**The reported half.** `HeaderActions` tested `currentPath === '/'` for the
Tools tab, so a tool page, its help page and every deep link opened nothing —
the bulk of the site rendering a header that said the reader was nowhere. Now
matched on the first path segment against the registry, which covers
`/dns-lookup`, `/dns-lookup/help` and `/ssl-checker/example.com` with one rule
and does not quietly claim /404.

**The half nobody could see.** The built site never opened the Tools tab *at
all*, including on the index. `Astro.url.pathname` is the **output file**
during a static build and `build.format` is `'file'`, so the index arrives as
`/index.html` and a tool as `/dns-lookup.html`: `=== '/'` has been false in
every build that ever shipped, and the tab only looked right under `pnpm dev`.
/delete escaped by luck — `startsWith('/delete')` survives a `.html` suffix.
Exactly the trap `canonical.test.js` was written for, biting a second time in
a different file. The path is normalised now, and /delete is an exact match
rather than a prefix that would also claim `/deleted-things`.

**Two ARIA values, deliberately.** `/` and `/delete` set `aria-current="page"`;
a tool page sets `aria-current="true"`. The Tools link points at the index, so
`page` on /dns-lookup would be a lie a screen reader repeats — `true` is the
same attribute's "current item of the set", which is what an open section tab
means. `shell.css` therefore keys the open-tab treatment on bare
`[aria-current]`, desktop and mobile; keying on the exact value is what would
have left the tab shut again.

`src/shell/nav-active.test.js` pins all of it against **built** HTML (33
tests): one tab open per page and never more, the right one, the right value,
every tool and every help page, and no tab on /404. Source-level tests would
have passed throughout the shipped-broken period, which is the point.

693 unit + 46 e2e green, lint 0 errors / the same 11 warnings.

### 2026-08-22 — Session 12c: ghost empty states, by rendering the real result

Six tools rest as a small control panel over a screenful of nothing. The
panels that fill it only exist after you press the button, so until then the
page gives no sign of what is coming or what shape it takes.

**Three attempts, and the first two failed the same way** — each invented a
second description of a shape the code already knew.

1. A prerendered Astro skeleton in the island's `fallback` slot. It answered
   the wrong question: hydration takes 82ms, while the dead space lasts until
   you press the button. Worse, it *jumped* — a hand-sized ghost never matches
   the real content, so it swapped 82ms after load with no user action to
   explain the movement. Owner: "it currently makes the screen jump around —
   so lose it." A jump nobody asked for is worse than a gap.
2. A generic `<ResultGhost rows={11} />`, with the row counts hand-measured
   per tool in a browser. dns-lookup's real result is a tab bar, a
   three-column query card and a records card; it got one striped box. Owner:
   "there are three boxes and you know the shape of them — so why is there a
   single ghost box?" The counting was the tell.

**What shipped.** `ui/ghost.jsx` wraps the tool's *real* result component,
rendered with a small sample, and `.rt-ghosted` in `shell.css` removes the
words. `<Ghost><DNSResultsDisplay results={GHOST_RESULTS} …/></Ghost>` — the
tab bar, the query card, the records card all come from the component that
replaces them, so the ghost cannot drift. No row counts, no manifest field, no
skeleton vocabulary, no prerender machinery. `result-ghost.jsx`, `skeleton.mjs`
and 225 lines of dead `rt-ghost-*` CSS were deleted.

**The redaction is a strike, not a background** — the one decision worth
recording. A background paints the element's *box*, and a box is the wrong
shape for a word: a `<p>` fills its column, so every value in a grid becomes an
identical full-width band; the `width: fit-content` that fixes that then breaks
centred text, right-aligned text, a `<td>` that owes its width to its column,
and any line that wraps. `text-decoration: line-through` at `1em` paints the
*text run* — it hugs the glyphs, follows the alignment, and breaks into one bar
per line as the text does.

It also dissolves the nesting problem instead of working around it: two
overlapping opaque strikes are one strike, so the rule can fire on a wrapper
*and* the span inside it at no cost. The box version needed an element
allowlist, a `:has(> *:not(svg))` leaf test and a `fit-content` rule — and
still left bare `<div>` text undrawn, which is how dns-lookup's answer records
came out blank. The strike needs none of them.

**The honesty bug this caught.** ssl-checker's grade badge is
`bg-success-subtle` — drawn in an empty state, the ghost showed **a green
grade A before any certificate had been checked**. dns-lookup tinted its record
badge teal for CNAME before a lookup. Both fixed at the wrapper: `--cat` and
`--cat-fill` are neutralised there, which reaches all fifteen tools without
this file knowing what any of them render, and status-tinted controls
(`button`, `[role=tab]`, `[role=alert]`, `[data-slot=badge]`) are flattened to
the raised ground. `badge.jsx` gained `data-slot="badge"` as the only stable
hook on a component that is otherwise pure cva output.

**Height comes from the data, not a number.** Rendering a real component with
real-shaped data reproduces the real height, which is right for four tools and
wrong for two. The rule stays: *the ghost fills the empty region; it does not
reserve the whole result.*

| tool | ghost | real | note |
|---|---|---|---|
| dns-lookup | 422px | 422px | exact |
| ssl-checker | 405px | 405px | exact |
| tenant-lookup | 448px | 448px | exact, after trimming the sample's optional fields |
| subnet-calculator | 771px | 755px | sample computed by `ipv4Details` |
| whois-lookup | 483px | 1268px | **capped** — fewer nameservers and dates |
| microsoft-portals | 430px | 5922px | **capped** — six portals of thirty-one |

**Three refactors came with it**, each an improvement on its own:

- `subnet-calculator` — details and divide panels extracted to
  `components/`, `FAMILIES`/`formatTotal`/`formatCount` and the 13-row
  `detailRowsFor` moved to `lib/format.js`. The ghost calls `detailRowsFor`
  and `ipv4Details`, so its labels *are* the tool's labels.
- `whois-lookup` — `WHOISInfoDisplay` was declared **inside** the tool's
  function body. That is a real bug independent of the ghost: a component
  redeclared each render is a new type each render, so React threw away and
  rebuilt the whole result subtree on every keystroke. Now a file, with its
  presenters in `lib/present.jsx`.
- `microsoft-portals` — the one place this departs from "render the real
  component": its result block takes eleven props from tool state, and a
  contract that size existing only to serve a placeholder is the worse trade.
  The wrapper is three lines of layout; the cards inside are real
  `PortalCard`s from `generateAllPortalLinks(null)`, which handles a null
  tenant by design and needs no network.

**Verified in the browser, all six, both themes:** ghost present, **zero**
text leaked past the redaction, **zero** focusable elements inside it. That
last one was a real bug — `inert=""` is falsy in React 19, so `removeAttribute`
ran and the ghost was `aria-hidden` with seven reachable controls inside it,
which is the axe `aria-hidden-focus` violation. `inert={true}` fixed it and
`ghost.test.jsx` pins it.

Two more traps worth remembering. `:has()` matches **descendants**, so an
icon's own `<rect>` and `<line>` children disqualified the heading containing
it — the child combinator was required. And **ESLint did not catch
`ReferenceError: Server is not defined`** after an over-trimmed icon import;
only loading the page did. Same lesson as the type-scale collisions: lint
proves a class or symbol was written, only the rendered DOM proves it works.

`DESIGN.md`'s "Loading, error and empty" section gained the ghost: no copy, no
colour that states anything, no animation, size from the sample.

**Two follow-ups from the owner's review.**

The whois and tenant ghosts were missing their tab tray. Both tools wrap their
result in a `Tabs` shell that lives in the *island*, not in the display
component, so ghosting the display alone drew the panels and not the row above
them — the one case where "render the real component" was not enough on its
own, because the component was not the whole result. whois now ghosts the real
two-tab tray; tenant ghosts the two tabs every lookup returns, the other three
being conditional on what came back.

And results **fade in** rather than being redrawn. `.rt-arrive` — opacity only,
`duration-settle`, on the way in only. Swapping a redacted panel for the real
one in a single frame reads as a flicker precisely *because* the ghost worked:
the layout is already correct, so the only thing that changes is the ink, and
an instant ink change over an unchanged shape looks like a glitch rather than
an answer. Nothing moves, because the ghost already put every panel where the
result was going. No fade-out to match it: the ghost is gone the moment React
swaps it, and holding both would put two copies of one layout on screen.

697 unit + 46 e2e green, lint 0 errors / the same 11 warnings.

### 2026-08-23 — Session 13: three Microsoft/Azure reference tools (15 → 18)

The Microsoft/Azure shelf covered conventions (naming), queries (KQL), discovery
(tenant lookup) and navigation (portals). It did not cover the reference lookup
that fills an admin's day: turning the GUIDs Graph and PowerShell return back
into names, working out which built-in role grants an action, and reading a CA
policy that arrived as JSON. All three are lookup-and-explain problems over
published data, so all three are client-side with no worker.

**`m365-licenses`** — 620 SKUs and 796 service plans, normalised from Microsoft's
licensing CSV (6,002 rows collapse to two tables plus a membership array). Search
by GUID, part number or name, and the reverse lookup answers "which SKUs include
this service plan", which the docs page cannot without a spreadsheet.

**`azure-rbac`** — 504 built-in roles parsed from the 19 `built-in-roles/*.md`
category files. Search by name or by action, with wildcards and NotActions
honoured.

**`conditional-access`** — no params and no storage on purpose: a policy is a
pasted blob and it is someone's tenant configuration. Accepts all three export
shapes, renders who/what/when/then, resolves 135 role template ids and the
common first-party app ids, and runs a gap checklist.

**Sizing was measured, not guessed, and the guess was wrong.** RBAC was assumed
to need an index/detail split at "1–2 MB". Parsed, it is 504 roles / 444 KB /
**58 KB gzipped** — smaller than the licensing dataset. No splitting was needed.
Both live in `src/data/` and are reached by a dynamic `await import()`, so Vite
emits each as its own lazy chunk instead of folding it into first paint.

**Four things that only showed up by running the code.**

*A module exporting `then` never finishes importing.* `explain.js` exported a
function called `then` to match the who/what/when/**then** framing. An ES module
namespace carrying a `then` is a thenable, so `await import(...)` hands the
module to the promise machinery, which calls `then(resolve, reject)`; the
function ignores both and returns an object, so the await never settles. Vitest
hung at collection with no error and no output. Renamed to `demands`, with a
regression test asserting the module has no `then`.

*Least privilege by pattern count ranks Owner first.* Owner holds one action —
`*`. Scoring by wildcards-and-depth instead then rewarded roles for having
*more* permissions and put VM Restore Operator (45 patterns) above Storage Blob
Data Reader (3) for a blob read. What works is counting the concrete operations
a role actually grants: Owner 2553, Contributor 2548 (exactly its five
Authorization exclusions), Reader 957, Storage Blob Data Reader 3. Computing it
live costs 2.3 s of blocked main thread, so `refresh-azure-rbac.mjs` precomputes
it — importing the tool's own matcher rather than reimplementing the semantics,
because a second copy would be free to disagree and nothing would catch it.

*Pattern overlap needs real intersection, not two literal tests.* Testing each
pattern against the other as a string misses the case where both carry a
wildcard in a different place: `Microsoft.Compute/virtualMachines/*` and
`Microsoft.Compute/*/read` share `.../virtualMachines/read` but neither matches
the other's text. Replaced with a small DP over the two patterns.

*The type step does not carry the font family.* `text-data-sm` set size, weight
and tracking, and the GUIDs rendered in the browser's default monospace.
`pnpm lint` was clean and the class was in the DOM. Every existing tool pairs it
with `font-mono`; the computed style is the only thing that says so. Exactly the
failure mode AGENTS.md warns about.

One incidental find, not fixed here: `microsoft-portals` hardcodes "31 portals"
in three places while its catalogues hold 91.

835 unit + 53 e2e green, lint 0 errors / the same 11 warnings.

### Session 13 — the cadence replaces the coincidence

The index was reviewed again: "the cards now look unbalanced". Measuring it at
1440px said exactly why, and it was not a matter of taste.

| Row | Cards | Widths | Right edge |
|---|---|---|---|
| 1 | 3 | 397 / 397 / 317 | 1288 ✓ |
| 2–4 | 2 | 500 / 500 | **1164** ✗ |
| 5–7 | 3 | ~370 | 1288 ✓ |

Three faults, one cause — Session 11's width steps were read off each tile's
own text, which is a fact no tile shares with the row it lands in:

1. **Three consecutive rows stopped 124px short of the right edge.**
   `.rt-card { max-width: 500px }` capped the stretch, so the whole Microsoft &
   Azure run read as a narrower table indented inside the catalogue.
2. **The cadence was a coincidence.** All seven Microsoft and Azure titles are
   long, so all seven took the 400px step together: the stream degenerated into
   `3 / 2 / 2 / 2 / 3 / 3 / 3`, a block of one shape rather than a varied break.
3. **The widest tiles were the emptiest.** A 500px tile holding a 57-character
   one-line description left ~200px unused, and one row collapsed to 98px
   against 117px everywhere else. Width was being awarded *for* long text and
   then not used *by* it.

**The fix is that width is now a ratio, not a pixel count.** `src/lib/rowCadence.js`
authors the break — a row of three thirds or two halves, each written as a
fraction of the row minus its gutters, so every row flushes to both edges by
construction and a mixed row is impossible. The pattern repeats `[3, 2, 3, 3, 2]`
(eighteen tools break `3,2,3,3,2,3,2`) and the index's client script re-runs the
same function over the *visible* tiles on every filter, so three Security tools
are one flush row of thirds rather than the middle of a cadence written for
eighteen. Measured after: `3@1288 2@1288 3@1288 3@1288 2@1288 3@1288 2@1288`,
and zero ragged rows at 1600 / 1440 / 1280 / 1100 / 1024 / 900 / 768 / 600 / 390.

*The responsive break has no breakpoint.* `min-width: 340px` is derived, not
chosen: the longest title ("Microsoft 365 License Decoder") measures 253px by
`Range.getBoundingClientRect()` and the tile spends 81px on its icon and
padding. Below that a third wraps its title onto two lines, which is what
actually makes a tile look cramped. 316px was tried first from an estimate and
wrapped at 1100px wide — measure the glyphs, do not count the characters.

*Two attempts to give the wide tile more to hold were built and withdrawn by
the owner.* First the manifest's `badges` as a row of keys under the
description — they read as chips you could press, one control grammar too many
on a page that opens with a chip row you can. Then the route path pushed to the
far bottom corner; the path came off every tile entirely, being a third
statement of what the title and the link already make. The wide step is
breathing room, and the cadence is what it is for.

*Motion.* The deal-in stagger is now diagonal — the delay is `--rt-r + --rt-c`
rather than a flat list index, so the catalogue crosses the page as a wave. The
tile's border also takes its category hue on hover: the only place `--cat`
leaves the icon tile, and it leaves it only under intent.

**The paste panel learned two more shapes** (owner request, same session). A
bare GUID is genuinely two answers — an Azure role definition id and a Microsoft
365 SKU id are the same 36 characters — so it offers both, RBAC first. A SKU
part number (`SPE_E3`, `ENTERPRISEPACK`) goes to the licence decoder with the
encoder kept behind it, because `detectQueryKind` is deliberately loose and
`DEADBEEF` is not a licence. `paste.js` imports that classifier from the tool's
own lib rather than copying its regex; the 426KB dataset stays behind the
dynamic import inside `loadLicenses()` and never reaches the index. Both deep
links are pinned in the e2e matrix by what they *resolve* to — Contributor and
Microsoft 365 E3 — not just by the rewrite landing.

*The licence branch widened to the shorthand people actually carry.* `SPE_E3`
was the only thing the first cut recognised; typing `E3` still fell to the
encoder. A licence code is one or two letters and one or two digits — `E3`,
`E5`, `F1`, `A5`, `G3`, `P2` — with the family prefix captured away, because
`/m365-licenses/m365 e3` finds nothing: the decoder searches by literal
substring, so the link carries the code alone. The digit is what makes the
shape safe to claim; `BP` for Business Premium is real shorthand but a bare
pair of letters is also `go`, `id` and `ok`, so it stays text. The encoder
stays behind every licence suggestion, because no test here consults the
dataset (426KB is not going on the homepage) and `E7` is code-shaped without
being a licence anyone sells.

*Which surfaced a ranking fault in the tool itself.* Sending short codes to the
decoder made `searchSkus` visibly wrong: a GUID is hex, two thirds of the
catalogue's ids contain "e3" somewhere and some **begin** with it, scoring
1036 against 2000-and-up for a name substring. Searching "E3" answered
"Microsoft Teams Phone Resource Account_USGOV_GCCHIGH" before "Microsoft 365
E3". An id is now matched only by a fragment of eight characters or more — a
length that could only have been copied from one — and an id-only match sorts
behind every name and part-number match instead of competing with them. Same
treatment for service-plan ids, which are GUIDs too.

**The CI failure was not any of this.** `pnpm build` failed on main 20 seconds
in with `Could not resolve './lib/sample.js'`, and the file is on disk: the
author's *global* gitignore carries `sample.*`, which silently swallowed
`src/tools/conditional-access/lib/sample.js` — a real source file the island
imports for its "load a sample" state. Every local build passed because the
file was there; CI checks out a tree without it. Reproduced by building
`git archive HEAD` in a scratch directory (same error) and again with the file
restored (39 pages, clean). A repo `.gitignore` outranks the global excludes
file, so `!src/**/sample.*` puts it back and makes the class of mistake
impossible for anything under `src/`. **The file still has to be committed.**
No other source file is ignored: `git status --ignored` over `src`, `scripts`,
`e2e` and `docs` returns one `.DS_Store` and nothing else.

853 unit + 57 e2e green, lint 0 errors / the same 11 warnings, from a clean
`dist` in CI's own order (install → build → test → lint).

### 2026-08-23 — Session 14: the network bench fills out (18 → 24)

The network shelf had three points: one-record DNS lookup, one-subnet
calculation and registration data. The missing work was what happens around
those answers — mail-policy evidence, DNSSEC chain evidence, set arithmetic,
route origin, cloud range reference data and the zone change before it ships.
Six manifest-driven tools now cover that work:

- **Email DNS Analyser** reads MX, SPF, DMARC, an optional DKIM selector,
  MTA-STS and TLS-RPT together. SPF follows include/redirect graphs, reports
  loops and the ten-query budget, and exposes the evidence instead of turning
  unlike findings into a synthetic score.
- **DNSSEC & Delegation Checker** calculates DNSKEY key tags and DS digests in
  the browser, matches the parent/child link cryptographically, reports the
  recursive AD flag, enumerates NS addresses and checks SOA visibility. Its
  copy is explicit that recursive evidence is not a direct authoritative-server
  probe, and a healthy unsigned delegation is informational rather than
  presented as DNSSEC success.
- **CIDR Workbench** accepts IPv4, IPv6, CIDRs and explicit ranges and performs
  exact BigInt-backed aggregation, range-to-CIDR conversion, subtraction,
  intersection, gap and overlap analysis.
- **BGP & ASN Explorer** separates registration from routing: RIPEstat provides
  origins, collector visibility, related/announced prefixes and RPKI state for
  an IP, prefix or ASN.
- **Azure Service Tags** searches a checked-in Azure Public snapshot by tag,
  region, service or IP and compares old Microsoft JSON releases locally. The
  refresh script records provenance and refuses a tag-count collapse greater
  than 20%. The 2026-08-17 snapshot contains 3,321 tags / 108,863 prefixes.
- **DNS Zone File Linter** parses common BIND master-file syntax, normalises
  record sets and finds SOA/NS, CNAME, MX/SRV target, alias-target, duplicate,
  TTL and CAA faults. Unsupported directives are findings rather than silently
  expanded. Diff compares canonical record sets so formatting does not mask
  the change.

**DNS Lookup became the shared front end for the same DNS core.** It now covers
Overview plus DS, DNSKEY, RRSIG, TLSA, SSHFP, SVCB and HTTPS, can compare Google
and Cloudflare, names RCODE and AD state, and exports raw evidence. DNSSEC-enabled
A responses surfaced a subtle presentation fault in the live browser: the
answer section also carries an RRSIG, which the first cut placed under an “A
records” heading. The panel is now an “A query” and every row carries its
actual type badge.

**The homepage dispatcher widened rather than guessing.** A domain offers DNS,
mail-DNS, DNSSEC, WHOIS, SSL and the Microsoft destinations; a CIDR offers the
calculator, workbench and BGP; a bare IP adds routing and Azure tag reverse
lookup; an ASN goes to BGP. The six new tools take the registry to 24 tools and
44 frozen routes. Documentation tables, sitemap, llms/agents catalogs, WebMCP,
Open Graph cards and help pages remain manifest-derived.

**Two build/runtime traps were caught at the boundary.** The redirect generator
aligned columns with `padEnd` but inserted no literal delimiter. Tool paths
longer than the chosen column fused `/help` and `200` into `/help200`; 66 browser
tests passed while two help routes failed. Redirect rules now always insert
spaces and a built-output test pins all three columns. The zone parser also
removed grouping parentheses with a global regular expression, which damaged
parentheses inside quoted TXT data; the remover now tracks quotes and escapes.

The privacy copy was corrected with the capability change: compute and pasted
data are local by default, while query tools name the public resolver/API or
Worker that receives the queried name or address. No design-system changes were
needed; the established Stacks components held on desktop and at 390×844 with
zero document overflow, and the Impeccable detector returned no findings.

The finish review tightened protocol edge cases before the final run: null MX
is now an explicit no-mail result; SPF ignores mechanisms after `all` and
reports include/redirect targets with no policy as permanent errors, caps the
shared traversal budget and aborts in-flight requests; multi-origin BGP prefixes
validate every origin; resolver comparison includes RCODE while preserving
case-sensitive opaque RDATA; and DNS deep links persist explicit A/Google
history defaults. DNSSEC no longer infers “unsigned” from a validating SERVFAIL.
Zone normalisation preserves quoted whitespace, resolves repeated relative
`$ORIGIN` directives against the origin active for each record, inherits omitted
TTL/class fields, rejects invalid common RDATA before export and clears a diff
as soon as either source changes.

Final verification: 933 Vitest assertions, 68 Playwright tests through
`wrangler pages dev`, production Astro build, live Google DoH / RIPEstat / mail
DNS / DNSSEC workflows, and ESLint at 0 errors / the same 11 warnings.

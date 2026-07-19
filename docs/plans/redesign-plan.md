# russ-tools Redesign — Plan of Attack

**Date:** 2026-07-19
**Status:** Phase 0 in progress · branch `redesign/phase-0`
**Owner directive:** start-from-scratch redesign, keep all functionality; nothing off limits framework-wise or CSS-wise; modern and useful.

> **This is a living document.** Update the [Session Log](#session-log) and the
> [Phase 0 task board](#phase-0-task-board) at the end of each working session. The
> plan body above the log is the stable reference; the log is the running record.

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

### Phase 1 — Design the redesign (1 weekend)

The gap every judge flagged: no proposal actually *designs* the new look — all deliver "fresh" as a side effect of regenerating shadcn. Before any porting: pick one dark palette (today Blueprint-light vs Solarized-dark are two different design languages — decide, once); define semantic status tokens (`--color-success/-warning/-info` + foregrounds) and ban raw palette classes (`bg-green-50`) in tools via ESLint; typography scale, spacing density, tool-page rhythm (h1 + description + action slot + card structure), home-page identity; self-hosted Inter (makes the privacy claim true); focus-visible fixed to `var(--color-ring)`; `prefers-reduced-motion` wrapping all ambient animation. Output: a one-page design spec + the actual `globals.css` token layer the shell will use.

### Phase 2 — Astro shell + legacy bridge → production (2–3 weekends)

Scaffold Astro 7 (React integration, Tailwind 4.3, regenerated primitives, theme via inline data-attr script — works before hydration, no provider). Build `ToolLayout.astro`, the registry, `[...tool].astro`, generated `_redirects`, `@astrojs/sitemap`, and `core/` (storage + migration shim, clipboard, download, cache, api client, history-with-undo with debounced persistence built in, sharelink verbatim).

**The bridge:** all 15 tools get thin bridge manifests whose islands lazy-load the *existing old components* nearly unchanged (old tree stays in the Tailwind content globs; token names stay shadcn-compatible, so old components render under the new theme — visual diffs are expected, it *is* a redesign; functional behavior is unchanged and smoke-tested).

**Gates before flipping production:** route-snapshot test green, Playwright deep-link matrix green on a Pages preview (this proves `_redirects` param handling early — the plan's riskiest platform assumption), share-URL fixtures decode, rendered-meta diff acceptable, exceljs dynamic-import smoke test (its `global: 'globalThis'` hack must be re-checked under the new toolchain).

*From here the redesigned shell — new nav, real h1s, prerendered HTML, new tokens — is live, and every subsequent weekend ships an increment.*

### Phase 3 — Simple tools (6) (≈3 weekends)

`base64` first as the pilot (deep link + share + clipboard — exercises every seam), then password-generator, cron, jwt, buzzword-ipsum, markdown-table (adopts the shared history utility — undo fixed by construction). Per-tool PR checklist: move into `src/tools/<id>/`, real manifest replaces bridge manifest, delete the tool's SEO/header ritual + hand-rolled clipboard/download/storage code *in the same PR*, migrate storage keys, drop the Shadcn suffix, dark/light manual pass, tests green.

### Phase 4 — The lookup family (5) on one hook (≈3–4 weekends)

Build `useLookupTool({toolId, fetcher, cacheTTL, maxHistory, urlParam})` — loading/error, TTL cache with eviction, history, deep-link-on-mount, toasts — then port dns-lookup, whois, ssl-checker, tenant-lookup, microsoft-portals. This deletes the six hand-rolled cache/history subsystems (structurally the same tool, written six times). Deliberate behavior changes, logged: ssl-checker's fabricated-certificate fallback is replaced with an honest "analysis unavailable — HTTPS connectivity verified" state; dns-lookup's OpenDNS option either becomes real OpenDNS DoH or is removed (today it silently queries Google).

### Phase 5 — Heavy tools (4) (≈4–5 weekends)

- **data-converter:** debounce validate-on-type (today: re-parses up to 3× and rewrites up to 5 MB of localStorage per keystroke), decouple history from auto-convert, move the ~450 lines of suggestion string tables to data files.
- **azure-naming:** provider moves inside the island (the root-mount bug dies structurally); rules engine + CAF data untouched under Phase 0 tests.
- **azure-kql:** port the *live* zustand implementation only (beware the naming trap: `AzureKQLTool.jsx` is real, the Shadcn-suffixed file was the dead one); make custom templates round-trip (today the Templates tab is write-only); fix the FILTER_PRIORITY case-mismatch that leaves filter ordering inert.
- **network-designer last** (highest risk, most user data, 2 weekends alone): split the 1,088-line monolith, extract one pure allocator in `lib/` under the Phase 0 characterization tests, fix the aligned-block CIDR-size bug (compute per-gap largest *aligned* block, not `floor(log2(gap))`), kill the multi-million-entry candidate arrays, stable subnet ids, hex colors (with the share-URL shape-upgrade function for old `{name,index}` payloads), @dnd-kit unchanged inside the island.

### Phase 6 — Finish (≈2 weekends)

Home page (static cards from registry + the password widget as a tiny island), storage-clear page driven by declared `storageKeys`, delete the old `src/` tree and @tabler, regenerate ARCHITECTURE/DEVELOPMENT/CLAUDE.md from the new code (tool inventories *generated* from the registry — ends the 13-vs-14-vs-15 drift; the current docs are half-Mantine and produce uncompilable code if followed), rewrite the workers README from source (the current one documents KV caching, rate limiting, and API keys that don't exist). Workers hygiene: shared CORS module, stop logging secrets/stack traces, wrangler-action deploy CI (diff live behavior per endpoint first — deployed drift is proven), decommission or re-source `certificate.russ.tools`. Search Console monitoring begins. Optional follow-ups, each its own PR, only if appetite remains: prismjs → shiki (port the custom KQL grammar), html2canvas → html-to-image, worker consolidation into one router, per-primitive Base UI swaps.

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
| Solo-maintainer stall | Every phase ends shippable; a stall after Phase 2 still leaves a redesigned, working, live site |
| MPA remounts (SPA→MPA is observable) | zustand-persist covers cross-page state (matches current localStorage behavior); view-transitions deliberately out of scope |
| Characterization tests freeze bugs as spec | `KEEP` / `KNOWN-BUG` annotations + `BEHAVIOR_CHANGES.md` |

---

## Start here

1. Phase 0.1: create `.github/workflows/ci.yml` (lint + build).
2. Phase 0.3 first PR: the microsoft-portals one-line base-URL fix — 24 broken links, live today.
3. Phase 0.2: Vitest + the sharelink round-trip suite with Node-generated golden fixtures (unblocks everything else).

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
- [ ] Bug fix: **azure-kql** wrap `useKQLStore` in `persist()` (history/favourites lost on refresh)
- [ ] Bug fix: **markdown-table** undo/redo off-by-one + literal `'\t'` CSV delimiter
- [ ] Bug fix: **Password Generator** → `crypto.getRandomValues`
- [ ] Characterization tests: subnet allocator (+ Terraform snapshots), markdown-table parse/format + csvParser, data-converter tri-format, azure-naming rules, base64 round-trips
- [ ] Capture live worker response fixtures (ssl/whois/tenant) → MSW mocks
- [ ] Dead-code purge (~3,500 lines): azure-kql `*Shadcn` stack, `cron.js`, `_iconImports.js`, `toolsUtils.js`, `generateSitemap.js`, ui-demo, `scroll-area.jsx`, certificate-chain remnants
- [ ] Dependency purge: `dayjs`, `framer-motion`, `d3-force`, `@svgdotjs/svg.js`, `next-themes`, `tailwindcss-animate`, `uuid` (→`crypto.randomUUID`), `autoprefixer`; drop `@radix-ui/react-scroll-area`
- [ ] Add `BEHAVIOR_CHANGES.md` ledger (started when the first deliberate fixture change lands)

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

# Behaviour changes

The characterization suites pin what the code **does**, not what it should do.
Where the captured behaviour is a bug, it is annotated `KNOWN-BUG` at capture
time and listed here until it is fixed.

Frozen contract #6 of [the redesign plan](plans/redesign-plan.md): *every
deliberate divergence updates its fixture in the same PR and is logged here.*

Two rules:

1. A test that changes because behaviour changed on purpose gets an entry here,
   in the PR that changes it. No entry, no merge.
2. A test that changes because behaviour changed *by accident* is not a
   behaviour change — it is a regression. Fix the code, not the fixture.

---

## Open — captured as KNOWN-BUG, not yet fixed

*Nothing currently open.*

---

## Landed

### Network Designer removed, replaced by the Subnet Calculator

| | |
|---|---|
| **Where** | `src/tools/subnet-calculator/` (new); `src/components/tools/network-designer/`, `src/tools/network-designer/`, `src/utils/network/` (deleted) |
| **Pinned by** | `src/tools/subnet-calculator/lib/*.test.js` + `__tests__/island.test.jsx` |
| **Landed** | owner decision, 2026-07-19 (Session 7) |

The Network Designer — saved multi-subnet plans, drag-reorder, diagram and
Terraform export — is gone, replaced by a **Subnet Calculator** in the mould
of the classic tools (mxtoolbox, calculator.net, davidc.net): full IPv4 *and*
IPv6 details for any address and prefix, plus a visual divide table with
split and join. `/subnet-calculator/:ip/:prefix` deep-links, and divide trees
share via the standard `?config` codec.

What a user can notice:

- **`/network-designer` 301-redirects** to `/subnet-calculator` (declared as
  `redirectFrom` in the manifest; the SPA serves a `<Navigate>`).
- **Saved networks are not deleted** — contract #3 holds; the nine legacy
  keys stay in localStorage and surface on `/delete` as unclaimed data — but
  no tool reads them any more, so saved plans are unreachable.
- **Old network-designer share URLs no longer restore a plan.**
- **Terraform export (AWS/Azure/VCD) is gone** with its generators and their
  Phase 0 characterization tests — the owner chose a pure calculator.
- `@dnd-kit`, `netmask` and `html2canvas` leave the dependency tree (they had
  no other consumers).

The three allocator entries that used to sit under *Open* died with the tool:
the aligned-block bug (`/25` offered for a 128-address gap at `.64` it could
not hold) is *not carried into* the calculator — its divide table splits into
exact halves, where the failure mode cannot exist — and the suspected
middle-vs-trailing gap off-by-one had already been investigated and found to
be no bug (both formulas were correct inclusive counts). The §A allocator lib
and suite, built as that port's first task, were deleted along with the
component they were extracted from.

### azure-kql filter ordering works, and custom templates round-trip

| | |
|---|---|
| **Where** | `src/tools/azure-kql/utils/queryGenerator.js`, `templateLoader.js` |
| **Pinned by** | `src/tools/azure-kql/utils/queryGenerator.test.js` |
| **Landed** | Phase 5, azure-kql port |

`FILTER_PRIORITY`'s keys are camelCase (`sourceIp`) while template fields are
PascalCase (`SourceIp`), so the priority lookup never hit: every filter got
default priority 99 and `| where` clauses came out in whatever order the
parameters happened to be typed. The lookup now normalises the first letter,
so generated queries order their filters as the priority table always
intended — a visible change to query text for multi-filter queries.

The Templates tab also stops being write-only: a saved custom template now
appears in its service's template list (category "Custom") and loads into
the builder. Custom templates persist as `rt:azure-kql:custom-templates`,
reading the pre-port `azure-kql-custom-templates` key forward.

### ssl-checker stops fabricating certificates when analysis is unavailable

| | |
|---|---|
| **Where** | `src/tools/ssl-checker/lib/sslApi.js` + the island |
| **Pinned by** | `src/tools/ssl-checker/__tests__/island.test.jsx` |
| **Landed** | Phase 4, ssl-checker port (pre-declared in *Planned* below) |

When the analysis worker was unreachable, the browser fallback returned an
*invented* assessment: grade B, a certificate with made-up validity dates,
issuer "Browser Verified Certificate Authority" — plausible details for a
check that never ran. It now returns a `connectivityOnly` result and the page
renders an honest state: **"Analysis unavailable — HTTPS connectivity
verified"**, with no grade, no certificate, and nothing cached as an
assessment (`isSSLDataComplete` now rejects probe results — the old code
counted them "always complete", which is exactly how the fabrication
propagated into cache and history).

### dns-lookup no longer offers providers it cannot query

| | |
|---|---|
| **Where** | `src/tools/dns-lookup/` (island + `DNSLookupForm`), `apiConfig.json` |
| **Pinned by** | `src/tools/dns-lookup/__tests__/island.test.jsx` |
| **Landed** | Phase 4, dns-lookup port (pre-declared in *Planned* below) |

"OpenDNS (208.67.222.222)" and "Browser Default" were listed as providers and
both silently queried `dns.google` — OpenDNS has no public DoH JSON API. Both
options are removed rather than relabelled; Google and Cloudflare remain, and
a history entry recorded under a removed provider replays via Google. The
`apiConfig.json` aliases that encoded the lie are gone.

### `convertToCSV` keeps falsy cells

| | |
|---|---|
| **Where** | `src/tools/markdown-table-tool/utils/csvParser.js` |
| **Pinned by** | `csvParser.test.js` (fixture updated in the same PR) |
| **Landed** | Phase 3, markdown-table port |

Cells were coerced with `String(field \|\| '')`, so a numeric `0` and a
boolean `false` exported as empty cells — any table with a genuine zero in it
exported wrong, silently. The coercion now tests for `null`/`undefined` only:
`0` exports as `0`, `false` as `false`, and empty stays empty. CSV, TSV and
the tab-delimiter path all inherit the fix through the shared `escapeField`.

In the same port, `MarkdownPreview` warnings now render with the `warning`
alert variant — they rendered as info, so a warning was indistinguishable
from a note.

### `/base64/:input` now decodes a base64 payload on mount

| | |
|---|---|
| **Where** | `src/tools/base64/island.jsx` (the Phase 3 port) |
| **Pinned by** | `src/tools/base64/__tests__/island.test.jsx` |
| **Landed** | Phase 3, base64 port |

A deep link whose param was valid base64 used to be processed with the
component's *initial* mode (`encode`) while a separate auto-detect effect
flipped the visible switch to Decode — so the page showed a Decode toggle
above the payload **re-encoded**. Verified against the live component before
the port (input `SGVsbG8gd29ybGQ=` produced output
`U0dWc2JHOGdkMjl5YkdRPQ==`, switch on Decode).

Now the mount effect makes the same decision the auto-detect makes — base64
decodes, anything else encodes — and processes with it, which is what the
plan's frozen-contract note always said this route was for. A plain-text
param behaves exactly as before.

---

### The index filter promotes one group instead of hiding the other four

| | |
|---|---|
| **Where** | `src/pages/index.astro`, `src/styles/shell.css` |
| **Pinned by** | `e2e/deeplinks.spec.js` (three index tests), `src/styles/category-accent.test.js` |
| **Landed** | Post-cutover, index critique follow-up |

Clicking a category chip used to set `hidden` on every other group. On
`/#content` — one tool of fifteen — that left a single card in the top-left
corner of an otherwise empty viewport, about 85% of the page blank under a
full-width hairline rule that drew attention to it. That is precisely the
failure DESIGN.md's **No Void Rule** names, occurring on the page's own
primary interaction, and it also worked against the index's job of showing a
visitor that the other fourteen tools exist.

The selected group is now promoted and the rest are demoted to a row of
counted, clickable group headings (`[data-demoted]`). Measured at 1280×800,
the gap above the footer went from ~85% of the viewport to 16.7%, and the
remaining space now sits *between* the promoted group and the demoted strip
rather than trailing below everything.

Three further changes ride with it, each observable:

- **The filter writes the URL.** `#category` via `pushState`, and the name
  filter rides in `?q=` via `replaceState` so a search is shareable without a
  history entry per keystroke. Back now clears the filter instead of leaving
  the site. The `hashchange` listener and the breadcrumb links that point at
  `/#microsoft-azure` already existed; only the control was silent.
- **The chips are a radio group**, not six `aria-pressed` toggles, with
  roving tabindex and arrow/Home/End keys. Six mutually exclusive filters
  were being announced as six independent switches.
- **Group counts moved conditionally.** DESIGN.md says the chips "carry the
  only index counts", so the group head shows a count *only* while demoted,
  where it is the affordance rather than a duplicate.

---

## Planned, deliberate, not yet made

Called out in the plan so they are not mistaken for regressions when they land:

- ~~**network-designer subnet colours** (Phase 5)~~ — withdrawn: the tool was
  removed (see *Network Designer removed* above), so the `{name, index}` →
  hex migration and its share-URL shape upgrade are moot.

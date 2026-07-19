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

### `cidrOptions` ignores gap alignment

| | |
|---|---|
| **Where** | `NetworkDesignerShadcn.jsx`, `SubnetForm.cidrOptions` |
| **Pinned by** | not yet — owed by the Phase 5 allocator suite |
| **Fix due** | Phase 5, network-designer port |

Computes `32 - Math.floor(Math.log2(largestGapSize))`, sizing the offered
prefix lengths against a gap's **length** while ignoring its **alignment**. A
128-address gap starting at `.64` cannot hold a `/25`, but `/25` is still
offered; picking it then fails with "No available space for this subnet size."

Capture the current (wrong) option list first, then fix by computing the
largest *aligned* block per gap. See [Deferred test
coverage](plans/redesign-plan.md#deferred-test-coverage--the-two-missing-suites) §A.

### Trailing-gap measurement is off by one against middle gaps

| | |
|---|---|
| **Where** | `NetworkDesignerShadcn.jsx`, gap measurement |
| **Pinned by** | not yet — owed by the Phase 5 allocator suite |
| **Fix due** | Phase 5, network-designer port |

Middle gaps use `next.start - prev.end - 1`; the trailing gap uses
`parentEnd - lastEnd`, with no `- 1`. Pin both, then reconcile.

---

## Landed

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

## Planned, deliberate, not yet made

Called out in the plan so they are not mistaken for regressions when they land:

- **network-designer subnet colours** (Phase 5) — Mantine-era `{name, index}`
  colour objects become hex. Old share URLs carry the old shape, so this needs
  a share-URL shape-upgrade function with fixtures, not a bare format change.

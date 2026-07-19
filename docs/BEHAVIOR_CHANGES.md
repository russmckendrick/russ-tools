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

### `convertToCSV` drops falsy cells

| | |
|---|---|
| **Where** | `src/components/tools/markdown-table-tool/utils/csvParser.js` |
| **Pinned by** | `csvParser.test.js` |
| **Fix due** | Phase 3, during the markdown-table port |

Cells are coerced with `String(field \|\| '')`, so a numeric `0` and a boolean
`false` both export as an empty cell. Any table with a genuine zero in it
exports wrong, silently.

The fixture currently asserts the wrong output. Fix the coercion (test for
`null`/`undefined` rather than falsiness), update the fixture, and move this
entry to *Landed* in the same PR.

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

*Nothing yet. Phase 0 and Phase 1 fixed six live bugs, but every one of them
restored intended behaviour rather than changing it — see the plan's Session
Log. This section is for changes a user could notice and legitimately be
surprised by.*

---

## Planned, deliberate, not yet made

Called out in the plan so they are not mistaken for regressions when they land:

- **ssl-checker fabricated-certificate fallback** (Phase 4) — when analysis
  fails, the tool currently invents plausible certificate details. Replaced
  with an honest "analysis unavailable — HTTPS connectivity verified" state.
- **dns-lookup OpenDNS provider** (Phase 4) — selecting OpenDNS silently
  queries Google (`apiConfig.json` maps `opendns` and `auto` to
  `dns.google/resolve`). Becomes either real OpenDNS DoH or an removed option;
  either way the label stops lying.
- **network-designer subnet colours** (Phase 5) — Mantine-era `{name, index}`
  colour objects become hex. Old share URLs carry the old shape, so this needs
  a share-URL shape-upgrade function with fixtures, not a bare format change.

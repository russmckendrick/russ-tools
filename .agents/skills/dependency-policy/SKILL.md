---
name: dependency-policy
description: Rationale and constraints for adding, removing, or replacing npm dependencies in russ-tools — the xlsx library choice, the exceljs ban, and why package removals used to break the build.
---

# Dependency policy

The prohibition list itself lives in `AGENTS.md` under **Do not re-add** — that is the
binding rule. This file carries the *why*, for when a swap or removal is actually on the
table.

## xlsx is `write-excel-file` + `read-excel-file`, not exceljs or SheetJS

exceljs last shipped in October 2023, weighed 20.8 MB with nine dependencies,
and was the sole source of every deprecation warning in the tree — *and of
`dayjs`, which is on the do-not-re-add list and had been back transitively the whole
time*. Its CommonJS/UMD packaging also produced a genuine bug: what
`await import('exceljs')` yielded differed between Node, the Vite build and
the Astro build, so `.default` was load-bearing.

The replacements are real ESM with `/browser` and `/node` entry points, so
that class of fault is gone.

**Not SheetJS (`xlsx`):** its npm copy is 0.18.5 from March 2022 — distribution moved to
the vendor's own CDN — and carries two advisories with no fix available on npm.

The reader returns *typed* values (`Date`, `boolean`, `number`, `null`)
rather than pre-formatted text; `excelCellToText` in `csvParser.js` owns
that conversion and `xlsx.test.js` pins it.

## react-icons is allowed for brand marks, and only brand marks (2026-08-26)

The blanket "no react-icons" rule was relaxed by the owner when the Email DNS Analyser
gained provider detection: identifying "this domain uses Microsoft 365" wants the
vendor's actual mark, and Lucide ships no brand logos as a matter of policy. The split
is now:

- **Lucide for every UI/UX glyph** — unchanged, including the vendored per-tool icons
  in `src/shell/icons.mjs`. Reaching for a react-icons glyph for an interface affordance
  (a chevron, a copy button, a status icon) is still wrong.
- **react-icons for brand marks** — vendor/service logos only, imported from per-set
  entry points (`react-icons/si` for Simple Icons, `react-icons/fa6` for Font Awesome
  brands). Per-set imports tree-shake: only the imported marks reach the bundle, so the
  package's large install size has no runtime cost.

Coverage caveat that motivated using both sets: Simple Icons removed the Microsoft
brand marks upstream (so `SiMicrosoft` does not exist in react-icons 5.x) and lacks
several security-gateway vendors entirely (Proofpoint, Mimecast, Barracuda, Sophos);
`fa6` fills Microsoft/AWS/Yahoo/Yandex, and providers with no mark anywhere fall back
to a Lucide role glyph (inbox/shield/route) rather than a wrong or invented logo.
`providerIcons.test.js` pins the map to the `EMAIL_PROVIDERS` registry.

## Removals used to be riskier than they are now

`vite.config.js` listed vendor chunks by name, so removing a package turned a stale entry
into a hard "Could not resolve entry module" failure. That file is gone — Astro chunks
automatically — so a removal now fails, if at all, at the import site.

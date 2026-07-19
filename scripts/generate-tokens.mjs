/**
 * Generates src/styles/tokens.generated.css from DESIGN.md.
 *
 * DESIGN.md is the design contract; this keeps the stylesheet a derivative of
 * it rather than a hand-typed copy that drifts. Run `pnpm generate:tokens`
 * after changing DESIGN.md's front matter.
 *
 * The exporter needs the network on first run (it fetches @google/design.md
 * via `pnpm dlx`), which is why the output is committed and CI never runs it.
 * `tokens.contrast.test.js` asserts the committed output still matches
 * DESIGN.md, so a stale file fails the build rather than passing silently.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const out = fileURLToPath(new URL('src/styles/tokens.generated.css', root));

const theme = execFileSync(
  'pnpm',
  ['dlx', '@google/design.md', 'export', 'DESIGN.md', '--format', 'css-tailwind'],
  { cwd: fileURLToPath(root), encoding: 'utf8', maxBuffer: 1024 * 1024 }
).trim();

const header = `/* =============================================================================
   GENERATED FILE — DO NOT EDIT.

   Source:    DESIGN.md (repo root), the authoritative design system.
   Regenerate: pnpm generate:tokens
   Guarded by: src/styles/tokens.contrast.test.js, which re-reads DESIGN.md and
               fails if this file has drifted from it.

   Dark is the default theme, so the unsuffixed values below are the dark ones.
   The \`-light\` suffixed peers are switched in by globals.css; they are
   independently chosen values, not lightened versions.
   ========================================================================== */
`;

// Rename the spacing scale out of Tailwind's `--spacing-*` namespace.
//
// DESIGN.md names its spacing steps xs/sm/md/lg/xl/2xl/3xl, which are exactly
// the keys Tailwind 4 uses for its *container* scale. Emitted as
// `--spacing-lg` they shadow it, so `max-w-lg` stops meaning 32rem and starts
// meaning 16px — which silently collapsed every dialog in every tool to a
// sliver. The names stay as DESIGN.md writes them; only the CSS custom
// property prefix changes, to one Tailwind does not treat as a scale.
let namespaced = theme.replace(/--spacing-/g, '--rt-space-');

// Fold each typography scale into one Tailwind `text-*` utility, and delete
// the per-scale font-family tokens.
//
// The exporter emits a scale as four separate tokens: `--font-title-sm:
// "Inter"`, `--text-title-sm`, `--tracking-title-sm`, `--font-weight-title-sm`.
// Two problems with using those directly. First, Tailwind's `font-*` namespace
// covers BOTH family and weight, and the family token wins — so `font-title-sm`
// silently set `font-family: "Inter"`, which is not the self-hosted family
// name ("Inter Variable"), so headings fell back to the browser default serif
// in a design system whose Typography section says there is no serif anywhere.
// Second, applying a scale took three classes, and forgetting one was
// invisible.
//
// Tailwind 4 supports `--text-<n>--font-weight` / `--line-height` /
// `--letter-spacing` sub-keys, so `text-title-sm` alone carries the whole
// step. The three mono scales still ask for `font-mono` explicitly, which is
// the one thing that should stay visible at the call site.
const LINE_HEIGHTS = {
  display: '1.06', 'headline-lg': '1.12', 'headline-md': '1.2', 'title-sm': '1.3',
  'body-lg': '1.55', 'body-md': '1.55', 'body-sm': '1.45', 'label-caps': '1',
  'data-lg': '1.35', 'data-md': '1.5', 'data-sm': '1.4',
};

const weights = new Map();
const tracking = new Map();
for (const [, name, value] of namespaced.matchAll(/--font-weight-([\w-]+):\s*([^;]+);/g)) {
  weights.set(name, value.trim());
}
for (const [, name, value] of namespaced.matchAll(/--tracking-([\w-]+):\s*([^;]+);/g)) {
  tracking.set(name, value.trim());
}

// Drop the per-scale family tokens so `font-<scale>` cannot exist at all.
namespaced = namespaced.replace(/^\s*--font-(?!weight-|sans|mono|serif)[\w-]+:\s*"[^"]+";\n/gm, '');

namespaced = namespaced.replace(
  /( *)--text-([\w-]+):\s*([^;]+);/g,
  (line, indent, name, size) => {
    const parts = [`${indent}--text-${name}: ${size.trim()};`];
    if (weights.has(name)) parts.push(`${indent}--text-${name}--font-weight: ${weights.get(name)};`);
    if (LINE_HEIGHTS[name]) parts.push(`${indent}--text-${name}--line-height: ${LINE_HEIGHTS[name]};`);
    if (tracking.has(name)) parts.push(`${indent}--text-${name}--letter-spacing: ${tracking.get(name)};`);
    return parts.join('\n');
  }
);

writeFileSync(out, `${header}\n${namespaced}\n`);
console.log(`wrote ${out.replace(fileURLToPath(root), '')} (${theme.split('\n').length} lines)`);

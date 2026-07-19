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

writeFileSync(out, `${header}\n${theme}\n`);
console.log(`wrote ${out.replace(fileURLToPath(root), '')} (${theme.split('\n').length} lines)`);

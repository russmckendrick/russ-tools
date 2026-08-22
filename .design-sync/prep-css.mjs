// Stages the app's compiled Tailwind stylesheet for design-sync.
//
// Two problems this solves, both of which would otherwise break the sync:
//
//  1. Astro emits the stylesheet with a content hash in its name
//     (BaseLayout.<hash>.css), so a cfg.cssEntry pointing straight at dist/
//     rots on the next `pnpm build`.
//  2. Its @font-face url()s are site-absolute (/_astro/inter-*.woff2). The
//     converter resolves font urls relative to the stylesheet, so absolute
//     paths dangle and the bundle ships without Inter or JetBrains Mono.
//
// Output is a stable .design-sync/.cache/css/app.css with relative font urls
// and the woff2 files copied beside it. Run after `pnpm build`.

import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ASTRO_DIR = 'dist/_astro';
const OUT_DIR = '.design-sync/.cache/css';

const entries = readdirSync(ASTRO_DIR);

const css = entries.filter((f) => f.endsWith('.css'));
if (!css.length) throw new Error(`no stylesheet in ${ASTRO_DIR} — run \`pnpm build\` first`);
// The layout stylesheet carries the whole token layer + Tailwind utilities;
// it is always the largest.
const sheet = css
  .map((f) => ({ f, size: readFileSync(join(ASTRO_DIR, f)).length }))
  .sort((a, b) => b.size - a.size)[0].f;

mkdirSync(OUT_DIR, { recursive: true });

const fonts = entries.filter((f) => /\.(woff2?|ttf|otf)$/.test(f));
for (const f of fonts) copyFileSync(join(ASTRO_DIR, f), join(OUT_DIR, f));

const text = readFileSync(join(ASTRO_DIR, sheet), 'utf8').replace(/url\(\/_astro\//g, 'url(./');
writeFileSync(join(OUT_DIR, 'app.css'), text);

console.error(`prep-css: ${sheet} -> ${OUT_DIR}/app.css (${(text.length / 1024).toFixed(0)}KB, ${fonts.length} fonts)`);

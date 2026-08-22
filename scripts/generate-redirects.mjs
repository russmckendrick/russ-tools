/**
 * Generates dist/_redirects from the tool manifests.
 *
 * Astro prerenders one HTML file per tool. The param deep links —
 * /ssl-checker/:domain, /jwt/:token, /base64/:input and friends — have no
 * file of their own, because the value is user data and cannot be enumerated
 * at build time. Cloudflare Pages serves them with a 200 rewrite: the URL the
 * visitor sees stays intact, and the tool's own page is served under it. The
 * island then reads the segment off location.pathname on mount.
 *
 * A 301/302 here would be wrong twice over — it would change the URL in the
 * bar and break the shareable-link property the whole site is built on.
 *
 * Every pattern is derived from a manifest's `params`, so frozen contract #1
 * cannot be broken by forgetting to list a route.
 */
import { writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadManifests } from '../src/tools/loadManifests.mjs';

const root = new URL('../', import.meta.url);
const outDir = fileURLToPath(new URL('dist/', root));
const out = `${outDir}_redirects`;

if (!existsSync(outDir)) {
  console.error('dist/ does not exist — run `astro build` first.');
  process.exit(1);
}

const tools = (await loadManifests()).sort((a, b) => a.path.localeCompare(b.path));

const lines = [
  '# GENERATED FILE — DO NOT EDIT. Source: src/tools/*/manifest.mjs',
  '# Regenerate: pnpm generate:redirects (runs as part of `pnpm build`)',
  '#',
  '# 200 = rewrite, not redirect. The visitor keeps the URL they arrived on;',
  '# Cloudflare serves the tool page underneath it. See frozen contract #1.',
  '',
];

let count = 0;

// Retired paths first: real 301s, before any rewrite can match. Declared per
// manifest as `redirectFrom` (e.g. /network-designer -> /subnet-calculator).
const redirects = tools.flatMap((tool) =>
  (tool.redirectFrom ?? []).map((from) => ({ from, to: tool.path }))
);
if (redirects.length) {
  lines.push('# Retired paths');
  for (const { from, to } of redirects) {
    lines.push(`${from.padEnd(40)}${to.padEnd(24)}301`);
    lines.push(`${`${from}/*`.padEnd(40)}${to.padEnd(24)}301`);
  }
  lines.push('');
}

for (const tool of tools) {
  if (!tool.params.length) continue;
  lines.push(`# ${tool.title}`);
  // The help page is a real prerendered file, but Cloudflare evaluates these
  // rules before serving assets — so /:param would swallow /help. The
  // self-rewrite pins it, and must come first: first match wins.
  lines.push(`${`${tool.path}/help`.padEnd(40)}${`${tool.path}/help`.padEnd(24)}200`);
  for (let i = 0; i < tool.params.length; i++) {
    const pattern = `${tool.path}/${tool.params.slice(0, i + 1).map((p) => `:${p}`).join('/')}`;
    // Column-aligned purely so the file is readable when debugging a 404.
    lines.push(`${pattern.padEnd(40)}${tool.path.padEnd(24)}200`);
    count++;
  }
  lines.push('');
}

writeFileSync(out, lines.join('\n'));
console.log(`wrote dist/_redirects — ${count} param rewrites across ${tools.filter((t) => t.params.length).length} tools, ${redirects.length} retired paths`);

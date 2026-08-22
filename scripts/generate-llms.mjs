#!/usr/bin/env node

/**
 * The AI-readiness files, driven by the tool manifests.
 *
 * Three artefacts, one source. `llms.txt` (llmstxt.org format) is the index
 * an agent reads first; `llms-full.txt` inlines every tool's curated help
 * block so an agent never has to fetch fifteen pages; `agents.md` is the
 * plain-prose front door. All three are generated into `public/` alongside
 * `sitemap.xml`, gitignored, and rebuilt at the head of `pnpm build` — the
 * same one-generator-no-drift policy that retired `@astrojs/sitemap`.
 *
 * The help prose comes from `docs/tools/<id>/README.md` read straight off
 * disk: a manifest's `help()` is a Vite `?raw` import that does not resolve
 * under bare Node. `extractHelpMarkdown` slices the same help block the
 * prerendered /<tool>/help pages render, so the two can never disagree.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadManifests } from '../src/tools/loadManifests.mjs';
import { CATEGORIES } from '../src/shell/categories.mjs';
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, AUTHOR } from '../src/shell/site.mjs';
import { extractHelpMarkdown } from '../src/lib/helpMarkdown.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const tools = (await loadManifests()).sort((a, b) => a.title.localeCompare(b.title));
const byCategory = (id) => tools.filter((t) => t.category === id);
const helpMarkdown = (tool) =>
  extractHelpMarkdown(readFileSync(join(root, 'docs', 'tools', tool.id, 'README.md'), 'utf8'));

const orderedTools = CATEGORIES.flatMap(({ id }) => byCategory(id));

const llmsTxt = [
  `# ${SITE_NAME}`,
  '',
  `> ${SITE_DESCRIPTION}`,
  '',
  ...CATEGORIES.flatMap(({ id, label }) => {
    const group = byCategory(id);
    if (group.length === 0) return [];
    return [
      `## ${label}`,
      '',
      ...group.map((t) => `- [${t.title}](${SITE_URL}${t.path}): ${t.shortDescription}`),
      '',
    ];
  }),
  '## Documentation',
  '',
  `- [Full tool documentation](${SITE_URL}/llms-full.txt): every tool's help content in one file`,
  `- [Sitemap](${SITE_URL}/sitemap.xml): every indexable URL; each tool's guide lives at its path plus /help`,
  '',
].join('\n');

const llmsFullTxt = [
  `# ${SITE_NAME} — full tool documentation`,
  '',
  `> ${SITE_DESCRIPTION}`,
  '',
  ...orderedTools.flatMap((t) => [
    `# ${t.title}`,
    '',
    `URL: ${SITE_URL}${t.path}`,
    `Help: ${SITE_URL}${t.path}/help`,
    '',
    t.description,
    '',
    `Features: ${t.features.join('; ')}`,
    '',
    helpMarkdown(t),
    '',
    '---',
    '',
  ]),
].join('\n');

const agentsMd = [
  `# ${SITE_NAME}`,
  '',
  SITE_DESCRIPTION,
  '',
  '## What this site is',
  '',
  `${tools.length} focused utilities, one page each, no accounts and no analytics. ` +
    'Everything runs client-side in the browser; the only network calls are three ' +
    'explicit lookups (WHOIS, SSL certificate checks and Microsoft tenant discovery), ' +
    'proxied through Cloudflare Workers.',
  '',
  '## For AI agents',
  '',
  `- [llms.txt](${SITE_URL}/llms.txt) — index of every tool with a one-line description`,
  `- [llms-full.txt](${SITE_URL}/llms-full.txt) — the full help documentation for every tool`,
  `- [sitemap.xml](${SITE_URL}/sitemap.xml) — every indexable URL`,
  `- Each tool has a prerendered guide at \`${SITE_URL}/<tool>/help\``,
  '- On browsers that support WebMCP, pages register structured tools via ' +
    '`document.modelContext` — site-wide search and navigation everywhere, plus ' +
    'in-page tools such as `calculate_subnet` on the Subnet Calculator and ' +
    '`base64_encode`/`base64_decode` on the Base64 tool.',
  '',
  '## Author',
  '',
  `[${AUTHOR.name}](${AUTHOR.url}) — source at [github.com/russmckendrick/russ-tools](https://github.com/russmckendrick/russ-tools).`,
  '',
].join('\n');

writeFileSync(join(root, 'public', 'llms.txt'), llmsTxt, 'utf8');
writeFileSync(join(root, 'public', 'llms-full.txt'), llmsFullTxt, 'utf8');
writeFileSync(join(root, 'public', 'agents.md'), agentsMd, 'utf8');
console.log(
  `✅ public/llms.txt, public/llms-full.txt, public/agents.md — ${tools.length} tools`
);

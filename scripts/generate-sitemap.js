#!/usr/bin/env node

/**
 * The one sitemap generator, driven by the tool manifests.
 *
 * It used to read `src/utils/toolsConfig.json`, and `@astrojs/sitemap` built a
 * second, near-identical pair (`sitemap-index.xml` + `sitemap-0.xml`) from the
 * pages `getStaticPaths` produced. Three files, one URL set, and only
 * `/sitemap.xml` advertised in robots.txt — so the Astro pair was orphaned and
 * the two sources were two chances to drift. The integration is gone and this
 * reads the registry, so there is now a single source.
 *
 * `/sitemap.xml` stays the canonical URL: robots.txt points at it and Search
 * Console has been submitted it.
 *
 * No `changefreq` or `priority` — Google ignores both, and they were noise.
 * `lastmod` comes from each tool's last commit rather than the build clock:
 * stamping today's date on all sixteen URLs every build claims the whole site
 * changed daily, which is the fastest way to teach a crawler to disregard the
 * field entirely.
 */

import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadManifests } from '../src/tools/loadManifests.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sitemapPath = join(root, 'public', 'sitemap.xml');

const SITE = 'https://russ.tools';

/**
 * Last commit date for a path, as YYYY-MM-DD. Returns null outside a git
 * checkout, on a shallow clone with no history for the path, or if git is
 * absent — the entry then ships without a `lastmod`, which is valid and
 * honest. Never throws: a missing date must not fail a deploy.
 * @param {string} path
 */
function lastCommitDate(path) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', path], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
  } catch {
    return null;
  }
}

/** @param {{loc: string, lastmod: string | null}} entry */
const urlXml = ({ loc, lastmod }) =>
  ['  <url>', `    <loc>${loc}</loc>`, lastmod && `    <lastmod>${lastmod}</lastmod>`, '  </url>']
    .filter(Boolean)
    .join('\n');

const tools = (await loadManifests()).sort((a, b) => a.path.localeCompare(b.path));

const entries = [
  // Trailing slash: the index's canonical is `https://russ.tools/`, and a
  // sitemap that lists the unslashed form is nominating a URL the page itself
  // says is not the canonical one.
  { loc: `${SITE}/`, lastmod: lastCommitDate('src/pages/index.astro') },
  ...tools.map((tool) => ({
    loc: `${SITE}${tool.path}`,
    lastmod: lastCommitDate(`src/tools/${tool.id}`),
  })),
];

// Param routes are deliberately absent: `/ssl-checker/example.com` is a deep
// link into a result, not a page worth indexing. They are served by a 200
// rewrite and self-canonicalise to the base page. `/delete` is absent because
// it is noindex, and a sitemap entry for a noindex page is a contradiction
// Search Console reports as an error. Both pinned by src/tools/sitemap.test.js.
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries.map(urlXml),
  '</urlset>',
  '',
].join('\n');

writeFileSync(sitemapPath, xml, 'utf8');
console.log(`✅ public/sitemap.xml — ${entries.length} URLs from ${tools.length} manifests`);

/**
 * Repairs dist/_webmcp/manifest.json after `astro build`.
 *
 * astro-webmcp scans built HTML for titles and descriptions, but with
 * `build.format: 'file'` it only extracts metadata from `index.html`-shaped
 * documents — every flat `<tool>.html` page falls back to a slug-only entry
 * with an empty description, which is exactly the field the in-page
 * `search_content` tool searches. The manifests already carry better copy
 * than any HTML scrape, so this rewrites the entries from `loadManifests()`:
 * real titles, the card's shortDescription, categories as collections, and
 * the noise pages (404, /delete) dropped.
 *
 * The entry schema (slug/url/title/description/collection) must match what
 * the integration's injected client expects — it fetches this file at
 * runtime, so the patch reaches the tools without touching the client.
 * `.well-known/skills/index.json` bakes the collection names into prose, so
 * its section list is rewritten to match.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadManifests } from '../src/tools/loadManifests.mjs';
import { CATEGORIES } from '../src/shell/categories.mjs';

const root = new URL('../', import.meta.url);
const manifestPath = fileURLToPath(new URL('dist/_webmcp/manifest.json', root));
const skillsPath = fileURLToPath(new URL('dist/.well-known/skills/index.json', root));

if (!existsSync(manifestPath)) {
  console.error('dist/_webmcp/manifest.json does not exist — run `astro build` first.');
  process.exit(1);
}

const tools = (await loadManifests()).sort((a, b) => a.title.localeCompare(b.title));
const ordered = CATEGORIES.flatMap(({ id }) => tools.filter((t) => t.category === id));

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const index = manifest.entries.find((e) => e.url === '/');

manifest.entries = [
  ...(index ? [index] : []),
  ...ordered.map((t) => ({
    slug: t.id,
    url: t.path,
    title: t.title,
    description: t.shortDescription,
    collection: t.category,
  })),
  ...ordered.map((t) => ({
    slug: `${t.id}/help`,
    url: `${t.path}/help`,
    title: `${t.title} — help`,
    description: `Usage guide for ${t.title}.`,
    collection: t.category,
  })),
];

manifest.collections = CATEGORIES.map(({ id }) => ({
  name: id,
  count: manifest.entries.filter((e) => e.collection === id).length,
})).filter((c) => c.count > 0);

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

if (existsSync(skillsPath)) {
  const skills = JSON.parse(readFileSync(skillsPath, 'utf8'));
  const sections = skills.skills?.find((s) => s.name === 'browse-site-sections');
  if (sections) {
    const names = manifest.collections.map((c) => c.name).join(', ');
    sections.description = `List content sections available: ${names}.`;
    writeFileSync(skillsPath, JSON.stringify(skills, null, 2), 'utf8');
  }
}

console.log(
  `✅ dist/_webmcp/manifest.json — ${manifest.entries.length} entries across ${manifest.collections.length} collections`
);

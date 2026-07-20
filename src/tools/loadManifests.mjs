/**
 * The registry's plain-Node twin.
 *
 * registry.mjs uses import.meta.glob, which only resolves inside Vite. Build
 * scripts (the _redirects generator, the sitemap) run under bare Node, so
 * they load the same manifests by reading the directory instead.
 *
 * A manifest's `island` is a lazy arrow using the `@/` alias, so it never
 * resolves here — nothing calls it. registry.test.js asserts both loaders
 * return the same tools, so the duplication cannot drift.
 */
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = new URL('./', import.meta.url);

/** @returns {Promise<object[]>} every manifest, unsorted */
export async function loadManifests() {
  const dirs = readdirSync(fileURLToPath(here), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  const loaded = [];
  for (const dir of dirs) {
    const url = new URL(`./${dir}/manifest.mjs`, here);
    loaded.push((await import(url.href)).default);
  }
  return loaded;
}

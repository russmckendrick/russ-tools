import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { TOOLS } from './registry.mjs';

/**
 * Frozen contract #4's sitemap half, made mechanical.
 *
 * The two apps build their sitemaps from different sources — the SPA's
 * `scripts/generate-sitemap.js` reads `toolsConfig.json`, and the shell's
 * `@astrojs/sitemap` reads the pages `getStaticPaths` produced from the
 * registry. While both are live that is two chances to drift, and the
 * failure is silent: a URL quietly leaves the sitemap and nobody notices
 * until traffic to it does.
 *
 * This asserts the shell's registry covers exactly the generated
 * `public/sitemap.xml` — the file `robots.txt` points at. It is gitignored,
 * not committed: both `pnpm build` and `pnpm build:astro` regenerate it, and
 * CI builds the shell before testing, so the file always exists here. The
 * canonical sitemap URL stays `/sitemap.xml` through cutover; the
 * `@astrojs/sitemap` duplicate (`sitemap-index.xml`) retires in Phase 6.
 */

const SITE = 'https://russ.tools';

/** @param {string} path */
const readSitemapUrls = (path) => {
  const xml = readFileSync(path, 'utf8');
  return new Set(
    [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/\/$/, ''))
  );
};

describe('sitemap URL set', () => {
  const committed = readSitemapUrls('public/sitemap.xml');

  // The index plus one page per tool. Param routes are deliberately absent
  // from both sitemaps: `/ssl-checker/example.com` is a deep link into a
  // result, not a page worth indexing.
  const fromRegistry = new Set([SITE, ...TOOLS.map((t) => `${SITE}${t.path}`)]);

  it('matches the registry exactly, in both directions', () => {
    const onlyCommitted = [...committed].filter((u) => !fromRegistry.has(u));
    const onlyRegistry = [...fromRegistry].filter((u) => !committed.has(u));

    expect({ onlyCommitted, onlyRegistry }).toEqual({
      onlyCommitted: [],
      onlyRegistry: [],
    });
  });

  it('does not list /delete, which is noindex', () => {
    // A sitemap entry for a noindex page is a contradiction Search Console
    // reports as an error, so the Astro config filters it out. If that
    // filter is ever removed this fails rather than shipping the conflict.
    expect([...committed].some((u) => u.endsWith('/delete'))).toBe(false);
  });

  it('lists every tool exactly once', () => {
    expect(committed.size).toBe(TOOLS.length + 1);
  });
});

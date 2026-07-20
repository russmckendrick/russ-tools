import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { TOOLS } from './registry.mjs';

/**
 * Frozen contract #4's sitemap half, made mechanical.
 *
 * There is now exactly one sitemap and one source for it:
 * `scripts/generate-sitemap.js`, reading the manifests. Until Phase 6 there
 * were three files — that generator reading `toolsConfig.json`, plus
 * `@astrojs/sitemap` emitting `sitemap-index.xml` and `sitemap-0.xml` from
 * `getStaticPaths` — carrying the identical URL set from two sources, of
 * which `robots.txt` advertised only the first. Two sources is two chances
 * to drift, and the failure is silent: a URL quietly leaves the sitemap and
 * nobody notices until the traffic to it does.
 *
 * This asserts the registry covers exactly the generated `public/sitemap.xml`
 * — the file `robots.txt` points at. It is gitignored, not committed:
 * `build` regenerates it, and CI builds the shell before testing, so
 * the file always exists here. `/sitemap.xml` stays the canonical sitemap
 * URL, which is what Search Console has been submitted.
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

  it('is the only sitemap the build ships', () => {
    // Re-adding @astrojs/sitemap would silently reintroduce a second URL set
    // at sitemap-index.xml that robots.txt does not advertise and nothing
    // asserts. If a second sitemap is ever wanted, robots.txt has to change
    // with it — this fails until it does.
    const shipped = readdirSync('dist').filter((f) => f.endsWith('.xml'));
    expect(shipped).toEqual(['sitemap.xml']);
  });

  it('advertises itself in robots.txt', () => {
    const robots = readFileSync('public/robots.txt', 'utf8');
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  });
});

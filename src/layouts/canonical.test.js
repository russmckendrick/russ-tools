import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { TOOLS } from '../tools/registry.mjs';

/**
 * Frozen contract #4's canonical half.
 *
 * These assert the **built output**, not the source, because the fault they
 * were written for was invisible in the source: `Astro.url.pathname` is the
 * *output file* during a static build, so `BaseLayout`'s default canonical
 * resolved to `https://russ.tools/index.html` on the index and
 * `/delete.html` on /delete. Cloudflare Pages serves the extensionless path,
 * so those pointed at URLs nobody links to — the one fault a canonical tag
 * can actually cause on its own. Tool pages pass their manifest path
 * explicitly and were never affected, which is why reading the layout would
 * not have shown it.
 *
 * The suite is skipped rather than failed when `dist/` is absent, so
 * `pnpm test` stays useful without a build; CI runs the build first.
 */

const DIST = 'dist';
const built = existsSync(`${DIST}/index.html`);
const html = (name) => readFileSync(`${DIST}/${name}.html`, 'utf8');
const canonicalOf = (name) =>
  html(name).match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? null;

describe.runIf(built)('canonical URLs in the built shell', () => {
  it('the index is the bare origin, not /index.html', () => {
    expect(canonicalOf('index')).toBe('https://russ.tools/');
  });

  it('no canonical anywhere carries a .html suffix', () => {
    const names = ['index', 'delete', ...TOOLS.map((t) => t.path.slice(1))];
    const offenders = names
      .map((n) => [n, canonicalOf(n)])
      .filter(([, href]) => href?.endsWith('.html'));

    expect(offenders).toEqual([]);
  });

  it('each tool page is canonical to its own manifest path', () => {
    for (const tool of TOOLS) {
      expect(canonicalOf(tool.path.slice(1))).toBe(`https://russ.tools${tool.path}`);
    }
  });

  it('the 404 has no canonical and is noindex', () => {
    // A not-found page has nothing to be the canonical version of, and the
    // default would have resolved to /404.html.
    expect(canonicalOf('404')).toBeNull();
    expect(html('404')).toContain('name="robots" content="noindex');
  });

  it('every tool page still carries an h1 and schema.org markup', () => {
    // The whole point of the shell over the SPA: production serves one
    // generic title, no h1 and no canonical on every URL, because a crawler
    // gets the index shell. This asserts that improvement stays true.
    for (const tool of TOOLS) {
      const page = html(tool.path.slice(1));
      expect(page, tool.id).toMatch(/<h1[^>]*>/);
      expect(page, tool.id).toContain('application/ld+json');
    }
  });
});

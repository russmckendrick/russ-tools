import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { TOOLS } from '../tools/registry.mjs';
import { categoryLabel, categorySchema } from '../shell/categories.mjs';
import { AUTHOR, SITE_NAME, SITE_URL, THEME_COLOR } from '../shell/site.mjs';

/**
 * The head and the structured data, asserted against the **built output** for
 * the same reason canonical.test.js is — the interesting faults here are ones
 * the source looks fine for.
 *
 * The port had quietly regressed the schema the SPA published: all fifteen
 * tools claimed `DeveloperApplication`, and `author`, `publisher`,
 * `featureList`, `keywords` and `isPartOf` were dropped. None of that shows
 * up in a lint or a render — the page looks identical and the markup is still
 * valid JSON-LD. Only reading the emitted graph catches it, so that is what
 * this does.
 */

const DIST = 'dist-astro';
const built = existsSync(`${DIST}/index.html`);
const html = (name) => readFileSync(`${DIST}/${name}.html`, 'utf8');

/** @returns {object[]} every JSON-LD node on the page, parsed */
const schemaNodes = (name) =>
  [...html(name).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) =>
    JSON.parse(m[1])
  );

const nodeOfType = (name, type) => schemaNodes(name).find((n) => n['@type'] === type);
const meta = (page, attr, value) =>
  page.match(new RegExp(`<meta ${attr}="${value}" content="([^"]*)"`))?.[1] ?? null;

describe.runIf(built)('head metadata', () => {
  const pages = ['index', 'delete', ...TOOLS.map((t) => t.path.slice(1))];

  it('every page declares the theme colour the pre-paint script applies', () => {
    // It disagreed for months: index.html said #1c7ed6 while site.webmanifest
    // said #1e1e2e, so mobile browser chrome painted a blue that no longer
    // existed in any palette.
    for (const name of pages) {
      expect(meta(html(name), 'name', 'theme-color'), name).toBe(THEME_COLOR);
    }
  });

  it('the webmanifest agrees with it', () => {
    const manifest = JSON.parse(readFileSync('public/site.webmanifest', 'utf8'));
    expect(manifest.theme_color).toBe(THEME_COLOR);
  });

  it('every page names its author and the site consistently', () => {
    for (const name of pages) {
      const page = html(name);
      expect(meta(page, 'name', 'author'), name).toBe(AUTHOR.name);
      expect(meta(page, 'property', 'og:site_name'), name).toBe(SITE_NAME);
      expect(meta(page, 'name', 'twitter:creator'), name).toBe(AUTHOR.twitter);
    }
  });

  it('no meta tag points at an asset the build does not ship', () => {
    // The SPA emitted og:image=/og-image.png for years against a file that
    // never existed, and nothing failed — which is precisely why this asserts
    // the file rather than the tag. Matches both absolute URLs (og:image must
    // be one) and rooted paths.
    const offenders = [];
    let checked = 0;
    for (const name of pages) {
      const re = new RegExp(
        `<meta [^>]*content="(?:${SITE_URL})?(/[^"]+\\.(?:png|jpg|svg|ico))"`,
        'g'
      );
      for (const m of html(name).matchAll(re)) {
        checked++;
        if (!existsSync(`${DIST}${m[1]}`)) offenders.push(`${name} → ${m[1]}`);
      }
    }
    expect(offenders).toEqual([]);
    // Guard against the regex quietly matching nothing, which is how this
    // test would pass while proving nothing at all.
    expect(checked).toBeGreaterThanOrEqual(pages.length);
  });

  it('every page previews with a card, and each tool gets its own', () => {
    expect(meta(html('index'), 'property', 'og:image')).toBe(`${SITE_URL}/og/default.png`);

    for (const tool of TOOLS) {
      const page = html(tool.path.slice(1));
      const expected = `${SITE_URL}/og/${tool.id}.png`;
      expect(meta(page, 'property', 'og:image'), tool.id).toBe(expected);
      expect(meta(page, 'name', 'twitter:image'), tool.id).toBe(expected);
    }
  });
});

describe.runIf(built)('structured data', () => {
  it('each tool declares its own category, not a blanket developer one', () => {
    // The regression this exists for: every tool claiming DeveloperApplication.
    const actual = TOOLS.map((t) => [
      t.id,
      nodeOfType(t.path.slice(1), 'SoftwareApplication')?.applicationCategory,
    ]);
    const expected = TOOLS.map((t) => [t.id, categorySchema(t.category)]);
    expect(actual).toEqual(expected);

    // …and that mapping is only meaningful if it is not one value repeated.
    expect(new Set(expected.map(([, c]) => c)).size).toBeGreaterThan(1);
  });

  it('each tool carries author, publisher, isPartOf and its feature list', () => {
    for (const tool of TOOLS) {
      const app = nodeOfType(tool.path.slice(1), 'SoftwareApplication');
      expect(app?.author?.name, tool.id).toBe(AUTHOR.name);
      expect(app?.publisher?.name, tool.id).toBe(AUTHOR.name);
      expect(app?.isPartOf?.url, tool.id).toBe(SITE_URL);
      expect(app?.featureList, tool.id).toEqual(tool.features);
      expect(app?.featureList?.length, tool.id).toBeGreaterThan(0);
    }
  });

  it('every manifest supplies the features the feature list is built from', () => {
    // featureList is the reason `features` moved out of toolsConfig.json and
    // into the manifests. A tool added without them would publish a thinner
    // record than the other fifteen and nothing else would complain.
    expect(TOOLS.filter((t) => !t.features?.length).map((t) => t.id)).toEqual([]);
  });

  it('each tool page describes its breadcrumb trail', () => {
    for (const tool of TOOLS) {
      const crumb = nodeOfType(tool.path.slice(1), 'BreadcrumbList');
      expect(crumb?.itemListElement?.map((i) => i.name), tool.id).toEqual([
        'Tools',
        categoryLabel(tool.category),
        tool.title,
      ]);
    }
  });

  it('the index publishes the site and its catalogue', () => {
    expect(nodeOfType('index', 'WebSite')?.name).toBe(SITE_NAME);

    const list = nodeOfType('index', 'ItemList');
    expect(list?.numberOfItems).toBe(TOOLS.length);
    expect(list?.itemListElement?.map((i) => i.url).sort()).toEqual(
      TOOLS.map((t) => `${SITE_URL}${t.path}`).sort()
    );
  });

  it('every emitted node is parseable and typed', () => {
    for (const name of ['index', ...TOOLS.map((t) => t.path.slice(1))]) {
      const nodes = schemaNodes(name);
      expect(nodes.length, name).toBeGreaterThan(0);
      for (const node of nodes) {
        expect(node['@context'], name).toBe('https://schema.org');
        expect(node['@type'], name).toBeTruthy();
      }
    }
  });
});

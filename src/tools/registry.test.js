import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { TOOLS, TOOLS_BY_ID, allRoutes, groupedByCategory } from './registry.mjs';
import { loadManifests } from './loadManifests.mjs';
import { CATEGORY_IDS } from '../shell/categories.mjs';
import { ICON_NAMES } from '../shell/icons.mjs';

/**
 * The manifest contract.
 *
 * The registry is what makes "tool #16 is one new folder" true, so the shape
 * of a manifest has to be enforced rather than remembered. `category`,
 * `shortDescription` and `icon` are required because DESIGN.md makes them
 * load-bearing: category picks the hue, shortDescription is what stops a
 * tool shipping as a bare icon and a name, icon names one of the bespoke set.
 */

const app = readFileSync(fileURLToPath(new URL('../App.jsx', import.meta.url)), 'utf8');

describe('manifest contract', () => {
  it('registers all fifteen tools', () => {
    expect(TOOLS).toHaveLength(15);
  });

  it.each(TOOLS.map((t) => [t.id, t]))('%s has a well-formed manifest', (id, tool) => {
    expect(tool.id, 'id').toBe(id);
    expect(tool.path, 'path').toMatch(/^\/[a-z0-9-]+$/);
    expect(tool.title, 'title').toBeTruthy();

    // A one-sentence description the card can render, not a fragment.
    expect(tool.shortDescription, 'shortDescription').toBeTruthy();
    expect(tool.shortDescription.length, 'shortDescription is one line').toBeLessThanOrEqual(80);
    expect(tool.description, 'description').toBeTruthy();

    expect(CATEGORY_IDS, `category of ${id}`).toContain(tool.category);
    expect(ICON_NAMES, `icon of ${id}`).toContain(tool.icon);

    expect(Array.isArray(tool.badges), 'badges').toBe(true);
    expect(Array.isArray(tool.params), 'params').toBe(true);
    expect(Array.isArray(tool.storageKeys), 'storageKeys').toBe(true);
    expect(Array.isArray(tool.legacyKeys), 'legacyKeys').toBe(true);
    expect(Array.isArray(tool.seo?.keywords), 'seo.keywords').toBe(true);

    expect(typeof tool.island, 'island').toBe('function');
    expect(['load', 'idle', 'visible'], 'hydrate').toContain(tool.hydrate);
  });

  it('has unique ids and unique paths', () => {
    expect(new Set(TOOLS.map((t) => t.id)).size).toBe(TOOLS.length);
    expect(new Set(TOOLS.map((t) => t.path)).size).toBe(TOOLS.length);
  });

  it('gives every tool a distinct icon', () => {
    // DESIGN.md: two tools should never share an icon.
    expect(new Set(TOOLS.map((t) => t.icon)).size).toBe(TOOLS.length);
  });

  it('uses every category', () => {
    expect(groupedByCategory().map((g) => g.id)).toEqual(CATEGORY_IDS);
  });
});

describe('frozen contract #1 — deep links', () => {
  /**
   * Every param route in today's App.jsx has to survive as a route the
   * registry knows how to serve. Read out of the live router rather than
   * hand-listed, so the snapshot cannot rot away from the thing it guards.
   */
  const routerPaths = [...app.matchAll(/<Route\s+path="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((p) => p !== '/' && p !== 'delete')
    .map((p) => `/${p}`);

  it('finds the current router table', () => {
    expect(routerPaths.length).toBe(23);
  });

  it('serves every route the SPA serves today', () => {
    const owned = new Set(allRoutes().map((r) => r.path));
    const missing = routerPaths.filter((p) => !owned.has(p));
    expect(missing, `routes the registry would drop: ${missing.join(', ')}`).toEqual([]);
  });

  it('adds no route the SPA does not already serve', () => {
    // A new URL is not a compatibility break, but it is never accidental.
    const current = new Set(routerPaths);
    const added = allRoutes().map((r) => r.path).filter((p) => !current.has(p));
    expect(added, `routes not in App.jsx: ${added.join(', ')}`).toEqual([]);
  });

  it('derives param patterns from the manifest, in order', () => {
    expect(allRoutes().filter((r) => r.tool === 'azure-kql').map((r) => r.path)).toEqual([
      '/azure-kql',
      '/azure-kql/:service',
      '/azure-kql/:service/:template',
    ]);
  });
});

describe('titles', () => {
  /**
   * The display title and the SEO title are separate fields with separate
   * jobs — one is what a person reads on the card, the other is what Google
   * shows in a result — but they must name the same thing. Five of them had
   * drifted into naming it differently ("Network Designer" on the card,
   * "Network Subnet Designer" in the SERP), which reads as two products.
   *
   * The rule: the SEO title leads with the display title, then earns its
   * keywords in the tail.
   */
  it.each(TOOLS.map((t) => [t.id, t]))('%s: the SEO title leads with the display title', (id, tool) => {
    expect(
      tool.seo.title === tool.title || tool.seo.title.startsWith(`${tool.title} - `),
      `"${tool.seo.title}" should be "${tool.title}" or start with "${tool.title} - "`
    ).toBe(true);
  });

  it.each(TOOLS.map((t) => [t.id, t]))('%s: the SEO title fits a search result', (id, tool) => {
    // Google truncates around 60 characters; past that the tail is wasted.
    expect(tool.seo.title.length, `"${tool.seo.title}"`).toBeLessThanOrEqual(65);
  });
});

describe('the manifests mirror toolsConfig.json', () => {
  /**
   * Both registries are live during the bridge: the SPA reads
   * toolsConfig.json, the shell reads manifests. Two sources of truth for
   * the same strings is exactly how the 13-vs-14-vs-15 tool-count drift
   * happened, so they are pinned together until toolsConfig.json is
   * retired in Phase 6.
   */
  it.each(TOOLS.map((t) => [t.id, t]))('%s matches its toolsConfig entry', async (id, tool) => {
    const { default: config } = await import('../utils/toolsConfig.json', { with: { type: 'json' } });
    const entry = config.find((t) => t.id === id);
    expect(entry, `no toolsConfig entry for ${id}`).toBeDefined();
    expect(tool.title).toBe(entry.title);
    expect(tool.path).toBe(entry.path);
    expect(tool.seo.title).toBe(entry.seoTitle);
    expect(tool.seo.keywords).toEqual(entry.seoKeywords);
  });
});

describe('the node loader and the glob registry agree', () => {
  it('returns the same tools', async () => {
    const viaNode = await loadManifests();
    expect(viaNode.map((t) => t.id).sort()).toEqual(TOOLS.map((t) => t.id).sort());
    for (const tool of viaNode) {
      expect(tool.path).toBe(TOOLS_BY_ID[tool.id].path);
      expect(tool.params).toEqual(TOOLS_BY_ID[tool.id].params);
    }
  });
});

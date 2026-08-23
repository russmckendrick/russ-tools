import { describe, it, expect } from 'vitest';

import { TOOLS, TOOLS_BY_ID, allRoutes, groupedByCategory } from './registry.mjs';
import { loadManifests } from './loadManifests.mjs';
import { CATEGORY_IDS } from '../shell/categories.mjs';
import { ICON_NAMES, TOOL_ICONS, iconSvg } from '../shell/icons.mjs';
import { extractHelpMarkdown } from '../lib/helpMarkdown.js';

/**
 * The manifest contract.
 *
 * The registry is what makes "tool #16 is one new folder" true, so the shape
 * of a manifest has to be enforced rather than remembered. `category`,
 * `shortDescription` and `icon` are required because DESIGN.md makes them
 * load-bearing: category picks the hue, shortDescription is what stops a
 * tool shipping as a bare icon and a name, icon names one of the shared set.
 */

describe('manifest contract', () => {
  it('registers all twenty-four tools', () => {
    expect(TOOLS).toHaveLength(24);
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

    expect(typeof tool.help, 'help').toBe('function');
    expect(typeof tool.island, 'island').toBe('function');
  });

  it.each(TOOLS.map((t) => [t.id, t]))('%s loads canonical Markdown help', async (id, tool) => {
    const source = await tool.help();
    const help = extractHelpMarkdown(source.default);

    expect(help, `${id} help`).toContain('## Quick start');
    expect(help.match(/^## /gm)?.length, `${id} help sections`).toBeGreaterThanOrEqual(4);
  });

  it('has unique ids and unique paths', () => {
    expect(new Set(TOOLS.map((t) => t.id)).size).toBe(TOOLS.length);
    expect(new Set(TOOLS.map((t) => t.path)).size).toBe(TOOLS.length);
  });

  it('gives every tool a distinct icon', () => {
    // DESIGN.md: two tools should never share an icon.
    expect(new Set(TOOLS.map((t) => t.icon)).size).toBe(TOOLS.length);
  });

  it('renders every tool icon as a stroked current-color SVG', () => {
    // Stacks draws icons with Lucide's stroke contract: a 2px currentColor
    // stroke — the structural border weight — with no fill on the wrapper.
    // The Signal-era set was filled; a regression back to filled slabs (or a
    // wrapper that stops passing the stroke down) is what this pins.
    expect(ICON_NAMES).toHaveLength(TOOLS.length);
    for (const name of ICON_NAMES) {
      const svg = iconSvg(name, 25);
      expect(svg).toContain('fill="none"');
      expect(svg).toContain('stroke="currentColor"');
      expect(svg).toContain('stroke-width="2"');
      expect(svg).toContain(TOOL_ICONS[name]);
    }
  });

  it('uses every category', () => {
    expect(groupedByCategory().map((g) => g.id)).toEqual(CATEGORY_IDS);
  });
});

describe('frozen contract #1 — deep links', () => {
  /**
   * Every URL the React SPA served, frozen.
   *
   * This used to be read out of `src/App.jsx`'s live `<Route>` table, so the
   * snapshot could not rot away from the thing it guarded. That file is gone,
   * and with it the last machine-readable record of what the site promised —
   * so the list is transcribed here verbatim, extracted from App.jsx at the
   * commit that deleted it (`git show 9f683ce:src/App.jsx`).
   *
   * These are compatibility contracts, not preferences. Every one of them may
   * be sitting in somebody's bookmarks, a wiki, or a shared link. **Nothing
   * is ever removed from this list.** A tool that retires declares
   * `redirectFrom` so its old path 301s; it does not drop out of here.
   *
   * `/` and `/delete` are excluded — they are shell pages, not tool routes.
   */
  const routerPaths = [
    '/azure-service-tags',
    '/azure-service-tags/:query',
    '/azure-kql',
    '/azure-kql/:service',
    '/azure-kql/:service/:template',
    '/azure-naming',
    '/azure-rbac',
    '/azure-rbac/:role',
    '/base64',
    '/base64/:input',
    '/bgp-explorer',
    '/bgp-explorer/:resource',
    '/buzzword-ipsum',
    '/cidr-workbench',
    '/cidr-workbench/:input',
    '/conditional-access',
    '/cron',
    '/cron/:expression',
    '/data-converter',
    '/dns-lookup',
    '/dns-lookup/:domain',
    '/dnssec-checker',
    '/dnssec-checker/:domain',
    '/email-dns-analyser',
    '/email-dns-analyser/:domain',
    '/jwt',
    '/jwt/:token',
    '/m365-licenses',
    '/m365-licenses/:query',
    '/markdown-table-tool',
    '/microsoft-portals',
    '/microsoft-portals/:domain',
    '/network-designer',
    '/password-generator',
    '/ssl-checker',
    '/ssl-checker/:domain',
    '/subnet-calculator',
    '/subnet-calculator/:ip',
    '/subnet-calculator/:ip/:prefix',
    '/tenant-lookup',
    '/tenant-lookup/:domain',
    '/whois-lookup',
    '/whois-lookup/:query',
    '/zone-file-linter',
  ];

  // Paths a manifest has explicitly retired: served as a 301 by _redirects,
  // never as a page of their own.
  const redirectSources = new Set(TOOLS.flatMap((t) => t.redirectFrom ?? []));

  it('still carries every route the SPA served', () => {
    // Guards the list itself: a deletion here is a broken bookmark, and is
    // never what someone meant to do.
    expect(routerPaths.length).toBe(44);
  });

  it('serves every one of them', () => {
    const owned = new Set(allRoutes().map((r) => r.path));
    const missing = routerPaths.filter((p) => !owned.has(p) && !redirectSources.has(p));
    expect(missing, `routes the registry would drop: ${missing.join(', ')}`).toEqual([]);
  });

  it('redirect sources collide with nothing the registry serves', () => {
    const owned = new Set(allRoutes().map((r) => r.path));
    for (const from of redirectSources) {
      expect(owned.has(from), `${from} is both a redirect and a served route`).toBe(false);
    }
  });

  it('adds no route the SPA did not serve', () => {
    // A new URL is not a compatibility break, but it is never accidental —
    // adding one means adding it to the frozen list above, deliberately.
    const current = new Set(routerPaths);
    const added = allRoutes().map((r) => r.path).filter((p) => !current.has(p));
    expect(added, `routes absent from the frozen list: ${added.join(', ')}`).toEqual([]);
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

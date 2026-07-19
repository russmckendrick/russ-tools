/**
 * The tool registry.
 *
 * Every manifest in src/tools/<id>/manifest.mjs is picked up automatically,
 * and this one module is what drives getStaticPaths, the index grid, the
 * sidebar, the sitemap, the generated _redirects and the storage-clear UI.
 * Adding tool #16 is one new folder; nothing here is edited.
 *
 * Only the registry reads manifests — tools never import each other, and
 * nothing else imports a manifest directly (enforced by boundaries lint).
 *
 * This module uses import.meta.glob, so it resolves under Astro and Vitest
 * but not plain Node. The build script needs the same list outside Vite and
 * uses loadManifests.mjs instead; the contract test asserts the two agree.
 */
import { CATEGORIES, CATEGORY_IDS } from '../shell/categories.mjs';

const modules = import.meta.glob('./*/manifest.mjs', { eager: true, import: 'default' });

/** Every tool, ordered by category then title — the order the index renders. */
export const TOOLS = Object.values(modules).sort(
  (a, b) =>
    CATEGORY_IDS.indexOf(a.category) - CATEGORY_IDS.indexOf(b.category) ||
    a.title.localeCompare(b.title)
);

export const TOOLS_BY_ID = Object.fromEntries(TOOLS.map((t) => [t.id, t]));

/** @param {string} id */
export const getTool = (id) => TOOLS_BY_ID[id];

/** The six categories, each with its tools. Empty categories are dropped. */
export const groupedByCategory = () =>
  CATEGORIES.map((c) => ({ ...c, tools: TOOLS.filter((t) => t.category === c.id) })).filter(
    (g) => g.tools.length > 0
  );

/**
 * Every route the shell owns, as literal paths and param patterns. This is
 * frozen contract #1 made mechanical: the patterns come from each manifest's
 * `params`, so a deep link cannot be dropped by forgetting to list it.
 */
export function allRoutes() {
  return TOOLS.flatMap((t) => [
    { path: t.path, tool: t.id, params: [] },
    ...t.params.map((_, i) => ({
      path: `${t.path}/${t.params.slice(0, i + 1).map((p) => `:${p}`).join('/')}`,
      tool: t.id,
      params: t.params.slice(0, i + 1),
    })),
  ]);
}

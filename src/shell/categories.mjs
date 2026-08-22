/**
 * The six categories. A tool's `category` selects its hue everywhere it
 * appears — tool icon, group rule, hover glow and record type column — so a
 * tool never picks its own colour. See DESIGN.md, "Colors".
 *
 * The order here is the order the index renders in.
 */

/** @typedef {'network'|'azure'|'microsoft'|'security'|'developer'|'content'} CategoryId */

/**
 * `schema` is the schema.org `applicationCategory` for tools in the group.
 * The field is free text, so these are a hint rather than an enum, but they
 * are the values the SPA published for years — keeping them means the
 * cutover does not look like a change of subject to a crawler that has
 * already indexed them.
 */
export const CATEGORIES = [
  { id: 'network', label: 'Network', schema: 'NetworkApplication' },
  { id: 'azure', label: 'Azure', schema: 'DeveloperApplication' },
  { id: 'microsoft', label: 'Microsoft', schema: 'BusinessApplication' },
  { id: 'security', label: 'Security', schema: 'SecurityApplication' },
  { id: 'developer', label: 'Developer', schema: 'DeveloperApplication' },
  { id: 'content', label: 'Content', schema: 'UtilitiesApplication' },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

/** @param {CategoryId} id */
export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

/** @param {CategoryId} id */
export const categorySchema = (id) =>
  CATEGORIES.find((c) => c.id === id)?.schema ?? 'DeveloperApplication';

/**
 * The id of the *board group* a category renders into on the index.
 *
 * Azure and Microsoft share one group there ("Microsoft & Azure"), so a
 * category's anchor on the index is not always its own id. The index's
 * section ids and the tool breadcrumb's category link both read this, so the
 * link cannot point at an anchor the index does not render.
 * @param {CategoryId} id
 */
export const categoryGroupId = (id) => (id === 'azure' || id === 'microsoft' ? 'microsoft-azure' : id);

/**
 * Every surface that needs a category hue reads it from these two custom
 * properties, set once on a container and inherited by everything inside.
 *
 * Two, not one, and they are not interchangeable:
 *   `--cat`       the TEXT hue — icons, crumbs, small labels. Deepened in
 *                 light mode so it clears 4.5:1 on bone.
 *   `--cat-fill`  the solid badge block. The same bright value in both
 *                 themes, because the ink on it is always graphite.
 * Using `--cat` as a fill behind that ink measures 1.6:1 on the light card.
 * @param {CategoryId} id
 */
export const categoryVar = (id) =>
  `--cat: var(--color-category-${id}); --cat-fill: var(--color-category-fill-${id})`;

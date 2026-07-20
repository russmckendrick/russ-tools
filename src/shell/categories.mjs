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
 * Every surface that needs a category hue reads it from one custom property,
 * so the hue is set once on a container and inherited by everything inside.
 * @param {CategoryId} id
 */
export const categoryVar = (id) => `--cat: var(--color-category-${id})`;

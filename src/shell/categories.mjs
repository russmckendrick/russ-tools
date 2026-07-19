/**
 * The six categories. A tool's `category` selects its hue everywhere it
 * appears — tool icon, group rule, hover glow and record type column — so a
 * tool never picks its own colour. See DESIGN.md, "Colors".
 *
 * The order here is the order the index renders in.
 */

/** @typedef {'network'|'azure'|'microsoft'|'security'|'developer'|'content'} CategoryId */

export const CATEGORIES = [
  { id: 'network', label: 'Network' },
  { id: 'azure', label: 'Azure' },
  { id: 'microsoft', label: 'Microsoft' },
  { id: 'security', label: 'Security' },
  { id: 'developer', label: 'Developer' },
  { id: 'content', label: 'Content' },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

/** @param {CategoryId} id */
export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

/**
 * Every surface that needs a category hue reads it from one custom property,
 * so the hue is set once on a container and inherited by everything inside.
 * @param {CategoryId} id
 */
export const categoryVar = (id) => `--cat: var(--color-category-${id})`;

/**
 * Azure Resource Naming Tool — ported.
 *
 * Ported (Phase 5). The context provider mounts inside the island, so
 * the CAF region data is fetched only on this page. Rules engine and
 * CAF data stay in src/utils/azure and src/data under Phase 0 tests.
 *
 * Routes this manifest owns (frozen contract #1 — do not rename or drop):
 *   /azure-naming
 */
export default {
  id: 'azure-naming',
  path: '/azure-naming',
  title: 'Azure Resource Naming Tool',

  // Rendered on the card, so a tool can never ship as a bare icon and a name.
  shortDescription:
    'Generate and validate names against Microsoft CAF rules.',
  description:
    'Generate consistent Azure resource names following Cloud Adoption ' +
    'Framework best practices and your organizational conventions.',

  // Selects the tool's hue everywhere it appears. A tool never picks a colour.
  category: 'azure',
  icon: 'tag',
  badges: [
    'CAF',
    '200+ types',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [],

  // Concrete capabilities, rendered into the page's schema.org
  // `featureList`. Migrated off toolsConfig.json, which is retiring.
  features: [
    'Cloud Adoption Framework compliance',
    'Bulk name generation',
    'Custom naming patterns',
    'Resource type validation',
    'Export to multiple formats',
    'Organizational conventions support',
  ],

  seo: {
    title: 'Azure Resource Naming Tool - CAF Compliant Name Generator',
    keywords: [
      'azure naming',
      'cloud adoption framework',
      'azure resources',
      'naming conventions',
      'caf compliant',
      'azure best practices',
      'resource naming',
      'azure governance',
      'bulk naming',
      'azure standards',
    ],
  },

  // Namespaced as rt:<id>:<slot>. legacyKeys are what the migration shim
  // reads from; it never deletes them (frozen contract #3).
  storageKeys: [
    'history',
  ],
  legacyKeys: [
    'azure-naming-history',
  ],

  help: () => import('../../../docs/tools/azure-naming/README.md?raw'),
  island: () => import('./island.jsx'),
};

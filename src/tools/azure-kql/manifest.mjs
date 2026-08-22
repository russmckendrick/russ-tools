/**
 * Azure KQL Query Builder — ported.
 *
 * Ported (Phase 5). The live zustand store was already keyed
 * rt:azure-kql:store; custom templates move to rt:azure-kql:custom-templates
 * (legacy key read forward) and now round-trip into the builder.
 *
 * Routes this manifest owns (frozen contract #1 — do not rename or drop):
 *   /azure-kql
 *   /azure-kql/:service
 *   /azure-kql/:service/:template
 */
export default {
  id: 'azure-kql',
  path: '/azure-kql',
  title: 'Azure KQL Query Builder',

  // Rendered on the card, so a tool can never ship as a bare icon and a name.
  shortDescription:
    'Build Kusto queries for Azure services with guided forms.',
  description:
    'Build optimized KQL queries for Azure services with guided forms ' +
    'and real-time preview. Generate queries for Azure Firewall, ' +
    'Application Gateway, and other Azure monitoring services with ' +
    'automatic performance optimization.',

  // Selects the tool's hue everywhere it appears. A tool never picks a colour.
  category: 'azure',
  icon: 'search-code',
  badges: [
    'Templates',
    'Favourites',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [
    'service',
    'template',
  ],

  // Concrete capabilities, rendered into the page's schema.org
  // `featureList`. Migrated off toolsConfig.json, which is retiring.
  features: [
    'Guided query building',
    'Real-time query preview',
    'Azure service templates',
    'Performance optimization',
    'Syntax highlighting',
    'Query validation',
  ],

  seo: {
    title: 'Azure KQL Query Builder - Kusto Query Language Generator',
    keywords: [
      'kql query',
      'kusto query',
      'azure monitor',
      'log analytics',
      'azure firewall',
      'application gateway',
      'kql builder',
      'azure logs',
      'monitoring queries',
      'kusto explorer',
    ],
  },

  // Namespaced as rt:<id>:<slot>. legacyKeys are what the migration shim
  // reads from; it never deletes them (frozen contract #3).
  storageKeys: [
    'store',
  ],
  legacyKeys: [
    'azure-kql-custom-templates',
  ],

  help: () => import('../../../docs/tools/azure-kql/README.md?raw'),
  island: () => import('./island.jsx'),
};

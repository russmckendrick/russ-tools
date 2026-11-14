/**
 * Azure KQL Query Builder.
 *
 * Rebuilt 2026-11-14: scenarios over typed table schemas, a live query and a
 * raw editor. Saved and recent queries live in rt:azure-kql:library; the
 * pre-rebuild store and custom templates are read into it once and left in
 * place (frozen contract #3).
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
    'Build Log Analytics queries from scenarios with typed filters.',
  description:
    'Build Kusto (KQL) queries for Azure Monitor Logs from 181 searchable ' +
    'scenarios across 34 services: Azure networking, Entra ID, Sentinel ' +
    'and Defender XDR, Microsoft 365, Intune, the activity log, Key Vault, ' +
    'Storage, SQL, App Service, AKS, virtual machines and Application ' +
    'Insights. Filters are typed from the Azure Monitor table reference ' +
    'and the query updates as you change them.',

  // Selects the tool's hue everywhere it appears. A tool never picks a colour.
  category: 'azure',
  icon: 'search-code',
  badges: [
    'Scenarios',
    'Saved queries',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [
    'service',
    'template',
  ],

  // Concrete capabilities, rendered into the page's schema.org
  // `featureList`.
  features: [
    '181 searchable scenarios across 34 Azure and Microsoft 365 services',
    'Filters typed from the Azure Monitor table reference',
    'Live, syntax-highlighted query with a plain-English reading',
    'Count any scenario by column or over time',
    'Query lines that jump to the control that wrote them',
    'Raw KQL editor',
    'Saved and recent queries kept in the browser',
    'Shareable query links',
  ],

  seo: {
    title: 'Azure KQL Query Builder - Log Analytics Queries from Scenarios',
    keywords: [
      'kql query builder',
      'kusto query',
      'azure monitor logs',
      'log analytics',
      'azure firewall kql',
      'application gateway kql',
      'signinlogs kql',
      'entra id sign-in logs',
      'azure activity log query',
      'vnet flow logs kql',
      'key vault audit logs',
      'aks container logs kql',
      'azure virtual desktop kql',
      'sentinel kql',
      'defender xdr kql',
      'officeactivity kql',
      'application insights kql',
    ],
  },

  // Namespaced as rt:<id>:<slot>. `library` is the live slot; `store` and
  // `custom-templates` are the pre-rebuild slots, still listed so the Saved
  // data page can clear them. legacyKeys are never deleted by a read.
  storageKeys: [
    'library',
    'last',
    'store',
    'custom-templates',
  ],
  legacyKeys: [
    'azure-kql-custom-templates',
  ],

  help: () => import('../../../docs/tools/azure-kql/README.md?raw'),
  island: () => import('./island.jsx'),
};

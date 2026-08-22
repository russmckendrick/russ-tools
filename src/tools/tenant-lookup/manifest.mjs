/**
 * Microsoft Tenant Lookup — ported.
 *
 * Ported (Phase 4) onto useLookupTool. The saved-lookups list is explicit
 * user data in rt:tenant-lookup:saved, read forward from the pre-port key
 * and never deleting it.
 *
 * Routes this manifest owns (frozen contract #1 — do not rename or drop):
 *   /tenant-lookup
 *   /tenant-lookup/:domain
 */
export default {
  id: 'tenant-lookup',
  path: '/tenant-lookup',
  title: 'Microsoft Tenant Lookup',

  // Rendered on the card, so a tool can never ship as a bare icon and a name.
  shortDescription:
    'Discover the Microsoft tenant behind any domain.',
  description:
    'Discover Microsoft tenant information for any domain. Get tenant ' +
    'ID, organization details, DNS configuration, and authentication ' +
    'settings using multiple Microsoft APIs.',

  // Selects the tool's hue everywhere it appears. A tool never picks a colour.
  category: 'microsoft',
  icon: 'building-2',
  badges: [
    'Tenant ID',
    'Domains',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [
    'domain',
  ],

  // Concrete capabilities, rendered into the page's schema.org
  // `featureList`. Migrated off toolsConfig.json, which is retiring.
  features: [
    'Domain to tenant mapping',
    'Tenant ID discovery',
    'Organization details',
    'DNS configuration analysis',
    'Authentication settings',
    'Multi-API integration',
  ],

  seo: {
    title: 'Microsoft Tenant Lookup - Domain to Tenant Discovery Tool',
    keywords: [
      'microsoft tenant',
      'tenant lookup',
      'tenant id',
      'domain lookup',
      'azure ad',
      'office 365',
      'tenant discovery',
      'dns analysis',
      'microsoft api',
      'organization lookup',
    ],
  },

  // Namespaced as rt:<id>:<slot>. legacyKeys are what the migration shim
  // reads from; it never deletes them (frozen contract #3).
  storageKeys: [
    'saved',
  ],
  legacyKeys: [
    'tenant-lookup-saved',
  ],

  help: () => import('../../../docs/tools/tenant-lookup/README.md?raw'),
  island: () => import('./island.jsx'),
};

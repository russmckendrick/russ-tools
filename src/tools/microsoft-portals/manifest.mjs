/**
 * Microsoft Portals (GDAP) — bridge manifest.
 *
 * Phase 2 manifests are thin: the island lazy-loads the existing component
 * nearly unchanged, so the new shell reaches production with every tool
 * still working. This tool gets its real manifest, its own store and its
 * extracted pure core when it ports.
 *
 * Routes this manifest owns (frozen contract #1 — do not rename or drop):
 *   /microsoft-portals
 *   /microsoft-portals/:domain
 */
export default {
  id: 'microsoft-portals',
  path: '/microsoft-portals',
  title: 'Microsoft Portals (GDAP)',

  // Rendered on the card, so a tool can never ship as a bare icon and a name.
  shortDescription:
    'Deep links into 31 Microsoft portals, scoped to a tenant.',
  description:
    'Generate deep links to various Microsoft portals based on ' +
    'domain/tenant information. Discover tenant details and create ' +
    'direct links to Azure, Microsoft 365, and Power Platform portals.',

  // Selects the tool's hue everywhere it appears. A tool never picks a colour.
  category: 'microsoft',
  icon: 'portals',
  badges: [
    'GDAP',
    '31 portals',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [
    'domain',
  ],

  seo: {
    title: 'Microsoft Portals (GDAP) - Deep Link Generator & Tenant Access',
    keywords: [
      'microsoft portals',
      'gdap',
      'tenant links',
      'azure portal',
      'microsoft 365',
      'power platform',
      'deep links',
      'tenant discovery',
      'microsoft admin',
      'partner access',
    ],
  },

  // Namespaced as rt:<id>:<slot>. legacyKeys are what the migration shim
  // reads from; it never deletes them (frozen contract #3).
  storageKeys: [
    'history',
    'cache',
    'favorites',
  ],
  legacyKeys: [
    'microsoft-portals-history',
    'microsoft-portals-cache',
    'microsoft-portals-favorites',
  ],

  island: () => import('@/components/tools/microsoft-portals/MicrosoftPortalsShadcn.jsx'),
  hydrate: 'load',
};

/**
 * Azure Resource Naming Tool — bridge manifest.
 *
 * Phase 2 manifests are thin: the island lazy-loads the existing component
 * nearly unchanged, so the new shell reaches production with every tool
 * still working. This tool gets its real manifest, its own store and its
 * extracted pure core when it ports.
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

  island: () => import('@/components/tools/azure-naming/AzureNamingShadcn.jsx'),
  hydrate: 'load',
};

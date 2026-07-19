/**
 * Network Designer — bridge manifest.
 *
 * Phase 2 manifests are thin: the island lazy-loads the existing component
 * nearly unchanged, so the new shell reaches production with every tool
 * still working. This tool gets its real manifest, its own store and its
 * extracted pure core when it ports.
 *
 * Routes this manifest owns (frozen contract #1 — do not rename or drop):
 *   /network-designer
 */
export default {
  id: 'network-designer',
  path: '/network-designer',
  title: 'Network Designer',

  // Rendered on the card, so a tool can never ship as a bare icon and a name.
  shortDescription:
    'Plan your cloud network and carve it into subnets.',
  description:
    'Plan and visualize your IP subnets interactively. Design network ' +
    'architectures, allocate subnets, and export configurations for ' +
    'Azure, AWS, or VMware environments.',

  // Selects the tool's hue everywhere it appears. A tool never picks a colour.
  category: 'network',
  icon: 'subnet',
  badges: [
    'VNet',
    'CIDR',
    'Terraform',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [],

  seo: {
    title: 'Network Subnet Designer - Plan & Visualize IP Networks',
    keywords: [
      'network designer',
      'subnet planning',
      'ip calculator',
      'network visualization',
      'terraform export',
      'azure networking',
      'aws networking',
      'vmware networking',
      'cidr calculator',
      'network architecture',
    ],
  },

  // Namespaced as rt:<id>:<slot>. legacyKeys are what the migration shim
  // reads from; it never deletes them (frozen contract #3).
  storageKeys: [
    'networks',
    'selected',
    'active-tab',
    'export-prefs',
  ],
  legacyKeys: [
    'networks',
    'selectedNetworkId',
    'nd-active-tab',
    'awsRegion',
    'azureRegion',
    'vcdOrg',
    'vcdVdc',
    'vcdEdgeGateway',
    'vcdNetworkType',
  ],

  island: () => import('@/components/tools/network-designer/NetworkDesignerShadcn.jsx'),
  hydrate: 'load',
};

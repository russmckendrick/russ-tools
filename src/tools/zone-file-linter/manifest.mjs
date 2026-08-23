export default {
  id: 'zone-file-linter',
  path: '/zone-file-linter',
  title: 'DNS Zone File Linter',
  shortDescription: 'Lint, normalize and compare BIND-style DNS zone files.',
  description:
    'Parse common BIND zone-file syntax locally, find structural DNS record ' +
    'conflicts, normalize record sets and compare proposed changes before deployment.',
  category: 'network',
  icon: 'file-diff',
  badges: ['BIND syntax', 'Local only', 'Record diff'],
  params: [],
  features: [
    'Common BIND record parsing',
    'CNAME and apex validation',
    'SOA, NS, MX, SRV and CAA checks',
    'TTL and duplicate detection',
    'Canonical record-set diff',
  ],
  seo: {
    title: 'DNS Zone File Linter - Validate and Compare BIND Zones',
    keywords: [
      'dns zone file linter',
      'bind zone validator',
      'dns record checker',
      'zone file diff',
      'bind syntax checker',
      'dns zone parser',
    ],
  },
  storageKeys: [],
  legacyKeys: [],
  help: () => import('../../../docs/tools/zone-file-linter/README.md?raw'),
  island: () => import('./island.jsx'),
};

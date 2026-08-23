export default {
  id: 'azure-service-tags',
  path: '/azure-service-tags',
  title: 'Azure Service Tags',
  shortDescription: 'Search and compare Microsoft Azure service-tag IP ranges.',
  description:
    'Search a reproducible Microsoft Azure Public service-tags snapshot by tag, ' +
    'region, service or IP address, inspect its prefixes and compare releases locally.',
  category: 'azure',
  icon: 'tags',
  badges: ['Offline lookup', 'IPv4 + IPv6', 'Snapshot diff'],
  params: ['query'],
  features: [
    'Service tag and region search',
    'Reverse IP-to-tag lookup',
    'IPv4 and IPv6 prefix export',
    'Local snapshot comparison',
    'Reproducible checked-in dataset',
  ],
  seo: {
    title: 'Azure Service Tags - IP Range Lookup and Snapshot Diff',
    keywords: [
      'azure service tags',
      'azure ip ranges',
      'azure service tag lookup',
      'azure firewall ranges',
      'azure service tags json',
      'azure ip address lookup',
    ],
  },
  storageKeys: [],
  legacyKeys: [],
  help: () => import('../../../docs/tools/azure-service-tags/README.md?raw'),
  island: () => import('./island.jsx'),
};

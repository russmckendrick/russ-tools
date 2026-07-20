/**
 * WHOIS Lookup Tool — ported.
 *
 * Ported (Phase 4). The island runs on useLookupTool: rt:whois-lookup:*
 * slots, with the pre-port history read forward and never deleted. The
 * legacy cache is enumerated for /delete but migrates cold.
 *
 * Routes this manifest owns (frozen contract #1 — do not rename or drop):
 *   /whois-lookup
 *   /whois-lookup/:query
 */
export default {
  id: 'whois-lookup',
  path: '/whois-lookup',
  title: 'WHOIS Lookup Tool',

  // Rendered on the card, so a tool can never ship as a bare icon and a name.
  shortDescription:
    'Registration and ownership detail for domains and IPs.',
  description:
    'Get detailed information about domains and IP addresses using ' +
    'modern RDAP protocol. View registration data, nameservers, and ' +
    'comprehensive geolocation information.',

  // Selects the tool's hue everywhere it appears. A tool never picks a colour.
  category: 'network',
  icon: 'whois',
  badges: [
    'Domains',
    'IPv4',
    'IPv6',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [
    'query',
  ],

  // Concrete capabilities, rendered into the page's schema.org
  // `featureList`. Migrated off toolsConfig.json, which is retiring.
  features: [
    'RDAP protocol support',
    'Domain registration data',
    'IP geolocation information',
    'Nameserver details',
    'Registration history',
    'Comprehensive domain analysis',
  ],

  seo: {
    title: 'WHOIS Lookup Tool - Domain & IP Information Checker',
    keywords: [
      'whois lookup',
      'domain lookup',
      'whois checker',
      'domain info',
      'ip lookup',
      'rdap',
      'domain registration',
      'nameservers',
      'domain owner',
      'ip geolocation',
    ],
  },

  // Namespaced as rt:<id>:<slot>. legacyKeys are what the migration shim
  // reads from; it never deletes them (frozen contract #3).
  storageKeys: [
    'history',
    'cache',
  ],
  legacyKeys: [
    'whois-lookup-history',
    'whois-lookup-cache',
  ],

  island: () => import('./island.jsx'),
  hydrate: 'load',
};

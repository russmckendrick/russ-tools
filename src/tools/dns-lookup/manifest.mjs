/**
 * DNS Lookup Tool — bridge manifest.
 *
 * Phase 2 manifests are thin: the island lazy-loads the existing component
 * nearly unchanged, so the new shell reaches production with every tool
 * still working. This tool gets its real manifest, its own store and its
 * extracted pure core when it ports.
 *
 * Routes this manifest owns (frozen contract #1 — do not rename or drop):
 *   /dns-lookup
 *
 * No param route: the approved mockup shows a `/dns-lookup/:domain` badge,
 * but App.jsx has never served one. Adding it is a feature, not a port.
 */
export default {
  id: 'dns-lookup',
  path: '/dns-lookup',
  title: 'DNS Lookup Tool',

  // Rendered on the card, so a tool can never ship as a bare icon and a name.
  shortDescription:
    'Query any record type against Google, Cloudflare or OpenDNS.',
  description:
    'Perform comprehensive DNS queries for various record types using ' +
    'multiple DNS providers. Get detailed DNS information with caching ' +
    'and history tracking.',

  // Selects the tool's hue everywhere it appears. A tool never picks a colour.
  category: 'network',
  icon: 'globe',
  badges: [
    'A',
    'AAAA',
    'MX',
    'TXT',
    'NS',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [],

  seo: {
    title: 'DNS Lookup Tool - Free DNS Record Checker & Analyzer',
    keywords: [
      'dns lookup',
      'dns checker',
      'dns records',
      'dns analysis',
      'domain lookup',
      'dns resolver',
      'nslookup',
      'dig tool',
      'dns over https',
      'dns query',
    ],
  },

  // Namespaced as rt:<id>:<slot>. legacyKeys are what the migration shim
  // reads from; it never deletes them (frozen contract #3).
  storageKeys: [
    'history',
    'cache',
  ],
  legacyKeys: [
    'dns-lookup-history',
    'dns-lookup-cache',
  ],

  island: () => import('@/components/tools/dns-lookup/DNSLookupShadcn.jsx'),
  hydrate: 'load',
};

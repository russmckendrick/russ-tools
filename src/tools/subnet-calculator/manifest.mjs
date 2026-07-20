/**
 * Subnet Calculator — replaces the Network Designer (owner decision,
 * 2026-07-19; see BEHAVIOR_CHANGES.md). A pure calculator in the mould of
 * the classic subnet tools: full IPv4/IPv6 details for any address and
 * prefix, plus a davidc.net-style visual divide table with split and join.
 *
 * Routes this manifest owns (frozen contract #1):
 *   /subnet-calculator
 *   /subnet-calculator/:ip
 *   /subnet-calculator/:ip/:prefix
 *
 * /network-designer 301-redirects here — declared below so the redirect is
 * generated with the rest of _redirects and pinned by the registry test.
 */
export default {
  id: 'subnet-calculator',
  path: '/subnet-calculator',
  title: 'Subnet Calculator',

  // Rendered on the card, so a tool can never ship as a bare icon and a name.
  shortDescription:
    'IPv4 and IPv6 subnet details, with a visual split-and-join divide table.',
  description:
    'Calculate IPv4 and IPv6 subnet details — netmask, wildcard, host ' +
    'ranges, binary forms and reverse DNS — and divide networks visually ' +
    'by splitting and joining subnets, entirely in the browser.',

  // Selects the tool's hue everywhere it appears. A tool never picks a colour.
  category: 'network',
  icon: 'lan',
  badges: [
    'IPv4',
    'IPv6',
    'Visual split',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [
    'ip',
    'prefix',
  ],

  // Old paths that 301 to this tool. The SPA serves them as <Navigate>
  // routes; the _redirects generator emits real 301s for the static shell.
  redirectFrom: [
    '/network-designer',
  ],

  // Concrete capabilities, rendered into the page's schema.org
  // `featureList`. Migrated off toolsConfig.json, which is retiring.
  features: [
    'IPv4 and IPv6',
    'Netmask, wildcard, ranges, PTR',
    'Visual split and join',
    'Shareable deep links',
  ],

  seo: {
    title: 'Subnet Calculator - IPv4 & IPv6 CIDR and Visual Splitter',
    keywords: [
      'subnet calculator',
      'ip subnet calculator',
      'cidr calculator',
      'ipv6 subnet calculator',
      'subnet mask calculator',
      'visual subnet splitter',
      'network calculator',
      'ip range calculator',
      'wildcard mask',
      'vlsm calculator',
    ],
  },

  // Stateless by design: results live in the URL (deep links and share
  // payloads), never in localStorage.
  storageKeys: [],
  legacyKeys: [],

  help: () => import('../../../docs/tools/subnet-calculator/README.md?raw'),
  island: () => import('./island.jsx'),
};

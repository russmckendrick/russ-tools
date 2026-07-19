/**
 * SSL Certificate Checker — ported.
 *
 * Ported (Phase 4) onto useLookupTool. Partial assessments are never
 * cached; the browser fallback no longer fabricates a certificate
 * (BEHAVIOR_CHANGES.md).
 *
 * Routes this manifest owns (frozen contract #1 — do not rename or drop):
 *   /ssl-checker
 *   /ssl-checker/:domain
 */
export default {
  id: 'ssl-checker',
  path: '/ssl-checker',
  title: 'SSL Certificate Checker',

  // Rendered on the card, so a tool can never ship as a bare icon and a name.
  shortDescription:
    'Inspect the chain, ciphers and expiry for any host.',
  description:
    'Analyze and validate SSL certificates for any domain. Get detailed ' +
    'security analysis, certificate information, and vulnerability ' +
    'testing using industry-standard SSL Labs API.',

  // Selects the tool's hue everywhere it appears. A tool never picks a colour.
  category: 'security',
  icon: 'cert',
  badges: [
    'TLS',
    'Chain',
    'Expiry',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [
    'domain',
  ],

  seo: {
    title: 'SSL Certificate Checker - Free SSL Analysis & Validation Tool',
    keywords: [
      'ssl checker',
      'ssl certificate',
      'ssl analysis',
      'ssl validation',
      'ssl labs',
      'certificate checker',
      'ssl security',
      'tls checker',
      'ssl report',
      'website security',
    ],
  },

  // Namespaced as rt:<id>:<slot>. legacyKeys are what the migration shim
  // reads from; it never deletes them (frozen contract #3).
  storageKeys: [
    'history',
    'cache',
  ],
  legacyKeys: [
    'ssl-checker-history',
    'ssl-checker-cache',
    'ssl-checker-domain-history',
  ],

  island: () => import('./island.jsx'),
  hydrate: 'load',
};

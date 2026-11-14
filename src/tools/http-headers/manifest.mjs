export default {
  id: 'http-headers',
  path: '/http-headers',
  title: 'HTTP Security Headers',
  shortDescription: 'Check a site for HSTS, CSP, framing and cookie flags.',
  description:
    'Enter a URL or hostname and read the security headers it sends back: the redirect chain, ' +
    'Strict-Transport-Security, Content-Security-Policy, X-Content-Type-Options, framing ' +
    'protection, Referrer-Policy, Permissions-Policy, the cross-origin policies, version leaks ' +
    'and cookie flags. Each one gets a specific finding and a pass, warning or fail. The ' +
    "address is requested by this site's server, because a browser cannot read another site's headers.",
  category: 'security',
  icon: 'list-checks',
  badges: ['HSTS', 'CSP', 'Cookies', 'Redirects'],
  params: ['domain'],
  features: [
    'Redirect chain with status codes',
    'HSTS, CSP, X-Content-Type-Options and framing checks',
    'Referrer-Policy and Permissions-Policy checks',
    'Cross-origin opener, embedder and resource policies',
    'Server and X-Powered-By version leaks',
    'Cookie Secure, HttpOnly and SameSite flags, without cookie values',
  ],
  seo: {
    title: 'HTTP Security Headers - Check HSTS, CSP & Cookie Flags',
    keywords: [
      'security headers checker',
      'http headers check',
      'hsts checker',
      'content security policy checker',
      'csp analyser',
      'x-frame-options',
      'referrer policy',
      'permissions policy',
      'cookie flags',
      'redirect chain',
    ],
  },
  storageKeys: ['history', 'cache'],
  legacyKeys: [],
  help: () => import('../../../docs/tools/http-headers/README.md?raw'),
  island: () => import('./island.jsx'),
};

/**
 * JWT Decoder/Validator — ported (Phase 3).
 *
 * The island is the tool itself. Decode is jwt-decode, verification is
 * jose, both entirely in the browser; nothing persists and nothing is
 * sent anywhere.
 *
 * Routes this manifest owns (frozen contract #1 — do not rename or drop):
 *   /jwt
 *   /jwt/:token
 */
export default {
  id: 'jwt',
  path: '/jwt',
  title: 'JWT Decoder/Validator',

  // Rendered on the card, so a tool can never ship as a bare icon and a name.
  shortDescription:
    'Decode and validate tokens without them leaving the tab.',
  description:
    'Decode JWT tokens completely client-side without sending to ' +
    'external services. Validate signatures, expiration, claims and ' +
    'analyze token security for API debugging and auth troubleshooting.',

  // Selects the tool's hue everywhere it appears. A tool never picks a colour.
  category: 'security',
  icon: 'jwt',
  badges: [
    'HS256',
    'RS256',
    'ES256',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [
    'token',
  ],

  seo: {
    title: 'JWT Decoder/Validator - Secure Client-Side JWT Token Analysis',
    keywords: [
      'jwt decoder',
      'jwt validator',
      'json web token',
      'jwt debugger',
      'token decoder',
      'jwt parser',
      'auth debugging',
      'jwt security',
      'client side jwt',
      'token validation',
    ],
  },

  // Namespaced as rt:<id>:<slot>. legacyKeys are what the migration shim
  // reads from; it never deletes them (frozen contract #3).
  storageKeys: [],
  legacyKeys: [],

  island: () => import('./island.jsx'),
  hydrate: 'load',
};

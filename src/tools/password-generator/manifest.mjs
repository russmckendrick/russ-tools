/**
 * Password Generator — bridge manifest.
 *
 * Phase 2 manifests are thin: the island lazy-loads the existing component
 * nearly unchanged, so the new shell reaches production with every tool
 * still working. This tool gets its real manifest, its own store and its
 * extracted pure core when it ports.
 *
 * Routes this manifest owns (frozen contract #1 — do not rename or drop):
 *   /password-generator
 */
export default {
  id: 'password-generator',
  path: '/password-generator',
  title: 'Password Generator',

  // Rendered on the card, so a tool can never ship as a bare icon and a name.
  shortDescription:
    'Cryptographically random passwords, generated on-device.',
  description:
    'Generate secure, random passwords with customizable length and ' +
    'character types. Features strength analysis, bulk generation, and ' +
    'secure download options for password management.',

  // Selects the tool's hue everywhere it appears. A tool never picks a colour.
  category: 'security',
  icon: 'key',
  badges: [
    'crypto.getRandomValues',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [],

  seo: {
    title: 'Password Generator - Secure Random Password Creator',
    keywords: [
      'password generator',
      'secure password',
      'random password',
      'password creator',
      'strong password',
      'password strength',
      'bulk passwords',
      'password tool',
      'secure generator',
      'password manager',
    ],
  },

  // Namespaced as rt:<id>:<slot>. legacyKeys are what the migration shim
  // reads from; it never deletes them (frozen contract #3).
  storageKeys: [],
  legacyKeys: [],

  island: () => import('@/components/tools/password-generator/PasswordGeneratorShadcn.jsx'),
  hydrate: 'load',
};

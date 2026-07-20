/**
 * Password Generator — ported (Phase 3).
 *
 * The island is the tool itself. Generation stays on crypto.getRandomValues
 * with rejection sampling and Fisher–Yates (the Phase 0 fix). No storage:
 * passwords are never persisted, which is the point of the tool.
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
  icon: 'password',
  badges: [
    'crypto.getRandomValues',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [],

  // Concrete capabilities, rendered into the page's schema.org
  // `featureList`. Migrated off toolsConfig.json, which is retiring.
  features: [
    'Cryptographically secure generation',
    'Customizable length and character sets',
    'Password strength analysis',
    'Bulk password generation',
    'Secure download options',
    'No server communication',
  ],

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

  island: () => import('./island.jsx'),
};

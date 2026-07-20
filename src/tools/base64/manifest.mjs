/**
 * Base64 Encoder/Decoder — ported (Phase 3 pilot).
 *
 * The island is the tool itself: `island.jsx` beside this file, with the
 * pure codec extracted to `lib/base64.js` under its own characterization
 * suite. No storage: this tool keeps nothing.
 *
 * Routes this manifest owns (frozen contract #1 — do not rename or drop):
 *   /base64
 *   /base64/:input
 */
export default {
  id: 'base64',
  path: '/base64',
  title: 'Base64 Encoder/Decoder',

  // Rendered on the card, so a tool can never ship as a bare icon and a name.
  shortDescription:
    'Encode and decode text and files, including URL-safe output.',
  description:
    'Encode and decode text and files using Base64 with multiple ' +
    'variants. Features auto-detection, batch processing, and ' +
    'security-focused workflows.',

  // Selects the tool's hue everywhere it appears. A tool never picks a colour.
  category: 'developer',
  icon: 'braces',
  badges: [
    'Text',
    'Files',
    'URL-safe',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [
    'input',
  ],

  // Concrete capabilities, rendered into the page's schema.org
  // `featureList`. Migrated off toolsConfig.json, which is retiring.
  features: [
    'Text and file encoding',
    'Multiple Base64 variants',
    'Batch processing',
    'Auto-detection',
    'Security-focused design',
    'Download encoded files',
  ],

  seo: {
    title: 'Base64 Encoder/Decoder - Free Online Base64 Tool',
    keywords: [
      'base64 encoder',
      'base64 decoder',
      'base64 converter',
      'encode base64',
      'decode base64',
      'base64 tool',
      'base64 online',
      'text encoder',
      'file encoder',
      'base64 utility',
    ],
  },

  // Namespaced as rt:<id>:<slot>. legacyKeys are what the migration shim
  // reads from; it never deletes them (frozen contract #3).
  storageKeys: [],
  legacyKeys: [],

  island: () => import('./island.jsx'),
  hydrate: 'load',
};

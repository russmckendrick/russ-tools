/**
 * Base64 Encoder/Decoder — bridge manifest.
 *
 * Phase 2 manifests are thin: the island lazy-loads the existing component
 * nearly unchanged, so the new shell reaches production with every tool
 * still working. This tool gets its real manifest, its own store and its
 * extracted pure core when it ports.
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

  island: () => import('@/components/tools/base64/Base64ToolShadcn.jsx'),
  hydrate: 'load',
};

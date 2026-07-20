/**
 * Data Converter — ported.
 *
 * Ported (Phase 5). Validation is debounced, history is written by the
 * Convert button rather than every keystroke, and the suggestion tables
 * live in lib/errorSuggestions.js. Settings and history persist under
 * rt:data-converter:* with the pre-port keys read forward.
 *
 * Routes this manifest owns (frozen contract #1 — do not rename or drop):
 *   /data-converter
 */
export default {
  id: 'data-converter',
  path: '/data-converter',
  title: 'Data Converter',

  // Rendered on the card, so a tool can never ship as a bare icon and a name.
  shortDescription:
    'Convert between JSON, YAML and TOML, with validation.',
  description:
    'Convert between JSON, YAML, and TOML formats with validation and ' +
    'formatting. Features auto-detection, syntax highlighting, and ' +
    'structure analysis.',

  // Selects the tool's hue everywhere it appears. A tool never picks a colour.
  category: 'developer',
  icon: 'swap',
  badges: [
    'JSON',
    'YAML',
    'TOML',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [],

  // Concrete capabilities, rendered into the page's schema.org
  // `featureList`. Migrated off toolsConfig.json, which is retiring.
  features: [
    'Multi-format support (JSON, YAML, TOML)',
    'Auto-format detection',
    'Syntax highlighting',
    'Data validation',
    'Structure analysis',
    'Error highlighting',
  ],

  seo: {
    title: 'Data Converter - JSON, YAML & TOML Format Converter',
    keywords: [
      'data converter',
      'json converter',
      'yaml converter',
      'toml converter',
      'json to yaml',
      'yaml to json',
      'json formatter',
      'yaml formatter',
      'data format',
      'config converter',
    ],
  },

  // Namespaced as rt:<id>:<slot>. legacyKeys are what the migration shim
  // reads from; it never deletes them (frozen contract #3).
  storageKeys: [
    'history',
    'settings',
  ],
  legacyKeys: [
    'dataConverter_history',
    'dataConverter_settings',
  ],

  island: () => import('./island.jsx'),
};

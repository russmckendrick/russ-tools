/**
 * Markdown Table Tool — ported.
 *
 * Ported (Phase 3). The island is the tool itself; table state and the
 * undo history persist under rt:markdown-table-tool:* with the pre-port
 * names as never-deleted legacy fallbacks.
 *
 * Routes this manifest owns (frozen contract #1 — do not rename or drop):
 *   /markdown-table-tool
 */
export default {
  id: 'markdown-table-tool',
  path: '/markdown-table-tool',
  title: 'Markdown Table Tool',

  // Rendered on the card, so a tool can never ship as a bare icon and a name.
  shortDescription:
    'Build, format and re-align Markdown tables from CSV or scratch.',
  description:
    'Create, format, and validate markdown tables with real-time ' +
    'preview and advanced editing features',

  // Selects the tool's hue everywhere it appears. A tool never picks a colour.
  category: 'developer',
  icon: 'table',
  badges: [
    'CSV',
    'Align',
    'Undo',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [],

  // Concrete capabilities, rendered into the page's schema.org
  // `featureList`. Migrated off toolsConfig.json, which is retiring.
  features: [
    'Visual table editor with drag-and-drop',
    'Real-time markdown preview',
    'CSV/TSV import and export',
    'Table validation and linting',
    'Multiple alignment options',
    'Bulk formatting and optimization',
    'Copy to clipboard functionality',
    'Template library for common tables',
  ],

  seo: {
    title: 'Markdown Table Tool - Table Creator, Formatter & Generator',
    keywords: [
      'markdown table',
      'table creator',
      'table formatter',
      'markdown editor',
      'table generator',
      'csv to markdown',
    ],
  },

  // Namespaced as rt:<id>:<slot>. legacyKeys are what the migration shim
  // reads from; it never deletes them (frozen contract #3).
  storageKeys: [
    'state',
    'history',
  ],
  legacyKeys: [
    'markdown-table-tool-state',
    'markdown-table-tool-history',
  ],

  island: () => import('./island.jsx'),
};

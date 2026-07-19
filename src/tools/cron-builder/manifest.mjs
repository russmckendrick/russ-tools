/**
 * CRON Expression Builder — bridge manifest.
 *
 * Phase 2 manifests are thin: the island lazy-loads the existing component
 * nearly unchanged, so the new shell reaches production with every tool
 * still working. This tool gets its real manifest, its own store and its
 * extracted pure core when it ports.
 *
 * Routes this manifest owns (frozen contract #1 — do not rename or drop):
 *   /cron
 */
export default {
  id: 'cron-builder',
  path: '/cron',
  title: 'CRON Expression Builder',

  // Rendered on the card, so a tool can never ship as a bare icon and a name.
  shortDescription:
    'Build and read cron expressions in plain English.',
  description:
    'Build and validate cron job expressions with an intuitive ' +
    'interface. Generate scheduling patterns for automated tasks and ' +
    'system jobs.',

  // Selects the tool's hue everywhere it appears. A tool never picks a colour.
  category: 'developer',
  icon: 'clock',
  badges: [
    '5-field',
    'Presets',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [],

  seo: {
    title: 'CRON Expression Builder - Free Cron Job Scheduler Tool',
    keywords: [
      'cron expression',
      'cron builder',
      'cron generator',
      'cron job',
      'cron scheduler',
      'crontab',
      'task scheduler',
      'unix cron',
      'linux cron',
      'cron validator',
    ],
  },

  // Namespaced as rt:<id>:<slot>. legacyKeys are what the migration shim
  // reads from; it never deletes them (frozen contract #3).
  storageKeys: [],
  legacyKeys: [],

  island: () => import('@/components/tools/cron/CronBuilderShadcn.jsx'),
  hydrate: 'load',
};

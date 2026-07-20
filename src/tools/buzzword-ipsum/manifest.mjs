/**
 * Buzzword Ipsum — ported (Phase 3).
 *
 * The island is the tool itself; the phrase corpus lives beside it in
 * data/buzzwords.json. Nothing persists.
 *
 * Routes this manifest owns (frozen contract #1 — do not rename or drop):
 *   /buzzword-ipsum
 */
export default {
  id: 'buzzword-ipsum',
  path: '/buzzword-ipsum',
  title: 'Buzzword Ipsum',

  // Rendered on the card, so a tool can never ship as a bare icon and a name.
  shortDescription:
    'Corporate filler text, for when real words will not do.',
  description:
    'Generate corporate buzzword-filled ipsum text for mockups and ' +
    'presentations. Create professional-sounding but meaningless ' +
    'content perfect for design templates and business materials.',

  // Selects the tool's hue everywhere it appears. A tool never picks a colour.
  category: 'content',
  icon: 'bubble',
  badges: [
    'Strategy',
    'Agile',
    'AI',
  ],

  // Deep-link segments. The generated _redirects turns each into a 200
  // rewrite onto the prerendered page, which then reads the param.
  params: [],

  // Concrete capabilities, rendered into the page's schema.org
  // `featureList`. Migrated off toolsConfig.json, which is retiring.
  features: [
    'Corporate buzzword generation',
    'Multiple output formats',
    'Customizable length options',
    'Professional placeholder text',
    'Perfect for mockups',
    'Client-side generation',
  ],

  seo: {
    title: 'Buzzword Ipsum - Corporate Lorem Ipsum Generator & Alternative',
    keywords: [
      'buzzword ipsum',
      'corporate lorem ipsum',
      'business jargon generator',
      'buzzword generator',
      'corporate placeholder',
      'business ipsum',
      'mockup content',
      'corporate speak',
      'professional text',
      'lorem ipsum alternative',
    ],
  },

  // Namespaced as rt:<id>:<slot>. legacyKeys are what the migration shim
  // reads from; it never deletes them (frozen contract #3).
  storageKeys: [],
  legacyKeys: [],

  island: () => import('./island.jsx'),
};

export default {
  id: 'uuid',
  path: '/uuid',
  title: 'UUID / GUID Generator',

  shortDescription: 'Generate v4 and v7 UUIDs in bulk, or decode one you already have.',
  description:
    'Generate version 4 and time-ordered version 7 UUIDs in bulk, formatted ' +
    'as GUIDs with braces, upper case or no hyphens. Decode a pasted UUID to ' +
    'its version, variant and embedded timestamp.',

  category: 'developer',
  icon: 'dices',
  badges: ['v4', 'v7', 'Decoder'],

  params: ['value'],

  features: [
    'Version 4 (random) and version 7 (time-ordered) UUIDs',
    'Bulk generation, 1 to 500',
    'Uppercase, braces and no-hyphen GUID formats',
    'Copy all or download as a text file',
    'Decode version, variant and embedded timestamp',
    'Runs entirely in the browser',
  ],

  seo: {
    title: 'UUID / GUID Generator - v4 and v7, Bulk, with Decoder',
    keywords: [
      'uuid generator',
      'guid generator',
      'uuid v4',
      'uuid v7',
      'bulk uuid generator',
      'random guid',
      'uuid decoder',
      'uuid version',
      'uuid timestamp',
      'time-ordered uuid',
    ],
  },

  storageKeys: [],
  legacyKeys: [],

  help: () => import('../../../docs/tools/uuid/README.md?raw'),
  island: () => import('./island.jsx'),
};

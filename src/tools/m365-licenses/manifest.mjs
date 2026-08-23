/**
 * Microsoft 365 License Decoder.
 *
 * Graph and PowerShell hand back licence GUIDs; this turns them back into
 * names, and answers the reverse question the Microsoft docs page cannot
 * without a spreadsheet — which SKUs include a given service plan.
 *
 * The dataset is vendored at src/data/microsoft/m365-licenses.json and
 * refreshed by `pnpm refresh:m365-licenses`. The island reaches it with a
 * dynamic import so it lands in its own lazy chunk.
 *
 * Routes this manifest owns:
 *   /m365-licenses
 *   /m365-licenses/:query
 */
export default {
  id: 'm365-licenses',
  path: '/m365-licenses',
  title: 'Microsoft 365 License Decoder',

  shortDescription:
    'Turn licence GUIDs and SKU part numbers into names and service plans.',
  description:
    'Decode Microsoft 365 licence SKU GUIDs and part numbers into product ' +
    'names and the service plans they include, and look up which SKUs ' +
    'contain a given service plan. Runs entirely in the browser against ' +
    "Microsoft's published licensing reference.",

  category: 'microsoft',
  icon: 'receipt-text',
  badges: [
    'SKUs',
    'Service plans',
    'GUID lookup',
    'Offline',
  ],

  params: [
    'query',
  ],

  features: [
    'SKU lookup by GUID, part number or name',
    'Service plan breakdown per SKU',
    'Reverse lookup of SKUs containing a service plan',
    'Copyable GUIDs and part numbers',
    'Recent lookup history',
    'Fully offline reference data',
  ],

  seo: {
    title: 'Microsoft 365 License Decoder - SKU and Service Plan Lookup',
    keywords: [
      'microsoft 365 license',
      'm365 sku guid',
      'service plan id',
      'skuid lookup',
      'licence guid decoder',
      'office 365 sku',
      'entra licensing reference',
      'string id',
      'sku part number',
      'microsoft licensing',
    ],
  },

  storageKeys: ['history'],
  legacyKeys: [],

  help: () => import('../../../docs/tools/m365-licenses/README.md?raw'),
  island: () => import('./island.jsx'),
};

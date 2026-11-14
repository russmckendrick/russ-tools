/**
 * Azure Regions and VM Sizes.
 *
 * Two references people keep a browser tab open for: the region list (what is
 * `uksouth` paired with, does it have zones) and the VM size tables (what is
 * a `Standard_D4s_v5`, and what do the letters mean).
 *
 * Both datasets are snapshots of Microsoft's published pages, written by
 * `pnpm refresh:azure-regions` to src/data/azure/regions.json and
 * src/data/azure/vm-sizes.json. The same script writes world-land.json, the
 * outline the region map is drawn on, so the map needs no tile server. Per-region size availability and prices need
 * an authenticated Azure API and are deliberately out of scope.
 *
 * Routes this manifest owns:
 *   /azure-regions
 *   /azure-regions/:query   a region (uksouth) or a size (Standard_D4s_v5)
 */
export default {
  id: 'azure-regions',
  path: '/azure-regions',
  title: 'Azure Regions and VM Sizes',

  shortDescription: 'Look up Azure regions, their pairs and zones, and decode VM size names.',
  description:
    'Search Azure regions by name, geography or city, or pick them off a map, to find the programmatic name, ' +
    'paired region, availability-zone support and physical location, and search VM sizes by name, family, vCPUs and memory ' +
    'with every size name decoded into its parts. A dated snapshot of Microsoft’s published references, ' +
    'searched in the browser.',

  category: 'azure',
  icon: 'map-pinned',
  badges: ['Region map', 'Region pairs', 'Availability zones', 'VM size decoder'],

  params: ['query'],

  features: [
    'Region search by name, geography, area or city',
    'Interactive map of regions, with each pair drawn',
    'Paired region and availability-zone support',
    'Programmatic names and naming short codes, one click to copy',
    'VM size search by name, family, vCPUs and memory',
    'Size names decoded into family, features and version',
    'Dated snapshot of Microsoft’s published data',
  ],

  seo: {
    title: 'Azure Regions and VM Sizes - Region Pairs and Size Decoder',
    keywords: [
      'azure regions list',
      'azure region pairs',
      'azure paired regions',
      'azure availability zones regions',
      'azure region names',
      'azure regions map',
      'azure vm sizes',
      'azure vm size naming',
      'standard_d4s_v5',
      'azure vm size decoder',
      'uksouth',
    ],
  },

  storageKeys: [],
  legacyKeys: [],

  help: () => import('../../../docs/tools/azure-regions/README.md?raw'),
  island: () => import('./island.jsx'),
};

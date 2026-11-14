/**
 * Entra ID Lookup.
 *
 * Paste a GUID out of a sign-in log, a consent prompt or an app manifest and
 * find out what it is: a Microsoft first-party application, a Microsoft Graph
 * permission (and whether it is the delegated or the application one), or a
 * built-in directory role. AADSTS sign-in error codes are the fourth kind.
 *
 * The dataset is src/data/microsoft/entra-ids.json, written by
 * `pnpm refresh:entra-ids` from Microsoft's documentation. That script also
 * writes entra-id-index.json, the GUIDs alone, which the index's paste panel
 * loads to decide whether a pasted GUID belongs here.
 *
 * Routes this manifest owns:
 *   /entra-ids
 *   /entra-ids/:query   a GUID, a name or an AADSTS code
 */
export default {
  id: 'entra-ids',
  path: '/entra-ids',
  title: 'Entra ID Lookup',

  shortDescription: 'Identify Entra app IDs, Graph permission IDs, role IDs and AADSTS codes.',
  description:
    'Paste a GUID or a name to identify it: Microsoft first-party application IDs, Microsoft Graph delegated ' +
    'and application permission IDs with what they grant and whether admin consent is required, built-in ' +
    'directory role template IDs, and AADSTS sign-in error codes. A dated snapshot of Microsoft’s published ' +
    'references, searched in the browser.',

  category: 'microsoft',
  icon: 'scan-text',
  badges: ['App IDs', 'Graph permissions', 'Role template IDs', 'AADSTS codes'],

  params: ['query'],

  features: [
    'One search across four kinds of identifier',
    'Says which kind of ID a GUID is, and which side of a permission',
    'Graph permission display text, admin consent and description',
    'Directory role template IDs with the privileged marker',
    'AADSTS error codes by number or name',
    'Dated snapshot of Microsoft’s published data',
  ],

  seo: {
    title: 'Entra ID Lookup - App IDs, Graph Permissions and Role IDs',
    keywords: [
      'entra app id lookup',
      'microsoft first party app ids',
      'microsoft graph permission id',
      'graph permission guid',
      'entra role template id',
      'directory role template ids',
      'aadsts error codes',
      '00000003-0000-0000-c000-000000000000',
      'azure ad application id lookup',
      'user.read permission id',
    ],
  },

  storageKeys: [],
  legacyKeys: [],

  help: () => import('../../../docs/tools/entra-ids/README.md?raw'),
  island: () => import('./island.jsx'),
};

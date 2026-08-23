/**
 * Conditional Access Analyser.
 *
 * An exported CA policy names everything by GUID and expresses its logic in
 * nested include/exclude arrays, so reading one means holding four dimensions
 * in your head at once. This renders each policy as who / what / when / then,
 * resolves the GUIDs it can name, and runs a set of heuristic checks over the
 * whole set.
 *
 * No params and no storage, deliberately: a policy is a pasted blob, not
 * something to put in a URL, and it is someone's tenant configuration.
 *
 * Routes this manifest owns:
 *   /conditional-access
 */
export default {
  id: 'conditional-access',
  path: '/conditional-access',
  title: 'Conditional Access Analyser',

  shortDescription:
    'Explain exported Conditional Access policies and spot the gaps.',
  description:
    'Paste exported Microsoft Entra Conditional Access policies and read ' +
    'them as plain English: who each one applies to, what it covers, when ' +
    'it fires and what it demands. Runs a gap checklist for legacy ' +
    'authentication, break-glass exclusions and administrator MFA. ' +
    'Nothing is uploaded or stored.',

  category: 'microsoft',
  icon: 'file-lock-2',
  badges: [
    'Graph JSON',
    'Plain English',
    'Gap checklist',
    'Nothing stored',
  ],

  params: [],

  features: [
    'Accepts Graph, PowerShell and single-policy exports',
    'Who / what / when / then breakdown per policy',
    'Resolves directory role and application GUIDs to names',
    'Gap checklist with severities',
    'Highlights report-only and disabled policies',
    'No upload, no storage, no tenant access',
  ],

  seo: {
    title: 'Conditional Access Analyser - Explain Entra CA Policies',
    keywords: [
      'conditional access',
      'entra conditional access',
      'ca policy analyser',
      'conditional access json',
      'microsoft graph conditional access',
      'legacy authentication',
      'break glass account',
      'conditional access review',
      'entra id security',
      'azure ad conditional access',
    ],
  },

  storageKeys: [],
  legacyKeys: [],

  help: () => import('../../../docs/tools/conditional-access/README.md?raw'),
  island: () => import('./island.jsx'),
};

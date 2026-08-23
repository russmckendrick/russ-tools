/**
 * Azure RBAC Role Explorer.
 *
 * Answers the question the built-in-roles reference cannot: not "what does
 * Contributor do" but "which role lets someone do exactly this, and nothing
 * more". Search runs over 504 built-in roles by name or by the action they
 * grant, honouring wildcards and subtracting notActions.
 *
 * The dataset is vendored at src/data/azure/rbac-built-in-roles.json and
 * refreshed by `pnpm refresh:azure-rbac`, which also precomputes each role's
 * breadth so the browser never has to.
 *
 * Routes this manifest owns:
 *   /azure-rbac
 *   /azure-rbac/:role
 */
export default {
  id: 'azure-rbac',
  path: '/azure-rbac',
  title: 'Azure RBAC Role Explorer',

  shortDescription:
    'Search 504 built-in Azure roles by name or by the action they grant.',
  description:
    'Explore Azure built-in RBAC roles: search by name or by action ' +
    'pattern, see Actions, NotActions, DataActions and NotDataActions, ' +
    'find the least-privilege role that grants an operation, compare two ' +
    'roles, and export a custom role definition. Runs entirely in the browser.',

  category: 'azure',
  icon: 'shield-user',
  badges: [
    'Built-in roles',
    'Action search',
    'Least privilege',
    'Custom role JSON',
  ],

  params: [
    'role',
  ],

  features: [
    'Search 504 built-in roles by name or description',
    'Reverse lookup by action pattern with wildcard support',
    'Least-privilege ranking by granted operation count',
    'NotActions correctly subtracted from grants',
    'Side-by-side role comparison',
    'Custom role definition export',
  ],

  seo: {
    title: 'Azure RBAC Role Explorer - Built-in Roles and Actions',
    keywords: [
      'azure rbac',
      'azure built-in roles',
      'role definition',
      'least privilege azure',
      'azure role actions',
      'notactions',
      'dataactions',
      'custom role definition',
      'azure permissions',
      'role assignment',
    ],
  },

  storageKeys: ['favorites'],
  legacyKeys: [],

  help: () => import('../../../docs/tools/azure-rbac/README.md?raw'),
  island: () => import('./island.jsx'),
};

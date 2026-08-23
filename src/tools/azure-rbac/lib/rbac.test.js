import { describe, it, expect } from 'vitest';
import {
  actionMatches,
  overlaps,
  grants,
  matchAction,
  leastPrivilege,
  searchRoles,
  findRole,
  roleSlug,
  diffRoles,
  toCustomRoleJson,
  permissionCount,
  breadth,
  actionCatalogue,
} from './rbac.js';

/** Real definitions, trimmed. The wildcard shapes are exactly Azure's. */
const OWNER = {
  id: '8e3af657-a8ff-443c-a75c-2fe8c4bcb635',
  name: 'Owner',
  description: 'Grants full access to manage all resources.',
  category: 'privileged',
  actions: ['*'],
  notActions: [],
  dataActions: [],
  notDataActions: [],
};

const CONTRIBUTOR = {
  id: 'b24988ac-6180-42a0-ab88-20f7382dd24c',
  name: 'Contributor',
  description: 'Grants full access to manage all resources, but does not allow role assignment.',
  category: 'privileged',
  actions: ['*'],
  notActions: [
    'Microsoft.Authorization/*/Delete',
    'Microsoft.Authorization/*/Write',
    'Microsoft.Authorization/elevateAccess/Action',
  ],
  dataActions: [],
  notDataActions: [],
};

const READER = {
  id: 'acdd72a7-3385-48ef-bd42-f606fba81ae7',
  name: 'Reader',
  description: 'View all resources, but does not allow you to make any changes.',
  category: 'general',
  actions: ['*/read'],
  notActions: [],
  dataActions: [],
  notDataActions: [],
};

const BLOB_READER = {
  id: '2a2b9908-6ea1-4ae2-8e65-a410df84e7d1',
  name: 'Storage Blob Data Reader',
  description: 'Read and list Azure Storage containers and blobs.',
  category: 'storage',
  actions: ['Microsoft.Storage/storageAccounts/blobServices/containers/read'],
  notActions: [],
  dataActions: ['Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read'],
  notDataActions: [],
};

const VM_CONTRIBUTOR = {
  id: '9980e02c-c2be-4d73-94e8-173b1dc7cf3c',
  name: 'Virtual Machine Contributor',
  description: 'Lets you manage virtual machines, but not access them.',
  category: 'compute',
  actions: ['Microsoft.Compute/virtualMachines/*', 'Microsoft.Network/networkInterfaces/read'],
  notActions: [],
  dataActions: [],
  notDataActions: [],
};

// Present so the catalogue contains a concrete Microsoft.Authorization
// operation. Without one, nothing in the fixture can measure what
// Contributor's notActions take away.
const RBAC_ADMIN = {
  id: 'f58310d9-a9f6-439a-9e8d-f62e7b41a168',
  name: 'Role Based Access Control Administrator',
  description: 'Manage access to Azure resources.',
  category: 'privileged',
  actions: [
    'Microsoft.Authorization/roleAssignments/write',
    'Microsoft.Authorization/roleAssignments/delete',
  ],
  notActions: [],
  dataActions: [],
  notDataActions: [],
};

const ROLES = [OWNER, CONTRIBUTOR, READER, BLOB_READER, VM_CONTRIBUTOR, RBAC_ADMIN];

describe('actionMatches — Azure wildcard semantics', () => {
  it('matches a literal action exactly', () => {
    expect(actionMatches('Microsoft.Compute/virtualMachines/read', 'Microsoft.Compute/virtualMachines/read')).toBe(true);
    expect(actionMatches('Microsoft.Compute/virtualMachines/read', 'Microsoft.Compute/virtualMachines/write')).toBe(false);
  });

  it('lets * span slashes, not just one segment', () => {
    // Reader's only action is */read, and it really does grant reads five
    // segments deep. A segment-wise wildcard would call this false.
    expect(
      actionMatches('*/read', 'Microsoft.Storage/storageAccounts/blobServices/containers/read')
    ).toBe(true);
  });

  it('matches a trailing wildcard against everything beneath it', () => {
    expect(actionMatches('Microsoft.Compute/virtualMachines/*', 'Microsoft.Compute/virtualMachines/start/action')).toBe(true);
    expect(actionMatches('Microsoft.Compute/virtualMachines/*', 'Microsoft.Network/networkInterfaces/read')).toBe(false);
  });

  it('matches a mid-string wildcard', () => {
    expect(actionMatches('Microsoft.Authorization/*/Write', 'Microsoft.Authorization/roleAssignments/write')).toBe(true);
    expect(actionMatches('Microsoft.Authorization/*/Write', 'Microsoft.Storage/storageAccounts/write')).toBe(false);
  });

  it('treats a bare * as everything', () => {
    expect(actionMatches('*', 'Microsoft.Anything/at/all/action')).toBe(true);
  });

  it('is case-insensitive, because Azure action names are', () => {
    // Contributor publishes the exclusion capitalised and the operation is
    // lower-case; a case-sensitive test would grant Contributor role writes.
    expect(actionMatches('Microsoft.Authorization/*/Write', 'microsoft.authorization/roleassignments/write')).toBe(true);
  });

  it('does not treat regex metacharacters in an action as a pattern', () => {
    // '.' is literal in an action name; it must not match any character.
    expect(actionMatches('Microsoft.Compute/read', 'MicrosoftXCompute/read')).toBe(false);
  });

  it('is false for empty input rather than matching everything', () => {
    expect(actionMatches('', 'Microsoft.Compute/read')).toBe(false);
    expect(actionMatches('*', '')).toBe(false);
  });
});

describe('overlaps', () => {
  it('matches when the role pattern is broader than the query', () => {
    expect(overlaps('*/read', 'Microsoft.Storage/storageAccounts/read')).toBe(true);
  });

  it('matches when the query is broader than the role pattern', () => {
    expect(overlaps('Microsoft.Storage/storageAccounts/read', 'Microsoft.Storage/*/read')).toBe(true);
  });

  it('is false when neither covers the other', () => {
    expect(overlaps('Microsoft.Compute/*/read', 'Microsoft.Storage/*/write')).toBe(false);
  });

  it('intersects two patterns that both carry a wildcard in a different place', () => {
    // Neither matches the other as raw text, but both accept
    // Microsoft.Compute/virtualMachines/read. A literal bidirectional test
    // returns false here and loses Virtual Machine Contributor from a search
    // for compute reads.
    expect(overlaps('Microsoft.Compute/virtualMachines/*', 'Microsoft.Compute/*/read')).toBe(true);
  });

  it('is false when two wildcard patterns genuinely cannot meet', () => {
    expect(overlaps('Microsoft.Compute/virtualMachines/*', 'Microsoft.Storage/*/read')).toBe(false);
    // Same provider, but the fixed tails disagree.
    expect(overlaps('Microsoft.Compute/*/read', 'Microsoft.Compute/*/write')).toBe(false);
  });

  it('is symmetric', () => {
    const a = 'Microsoft.Compute/virtualMachines/*';
    const b = 'Microsoft.Compute/*/read';
    expect(overlaps(a, b)).toBe(overlaps(b, a));
  });

  it('handles a bare wildcard on either side', () => {
    expect(overlaps('*', 'Microsoft.Storage/storageAccounts/read')).toBe(true);
    expect(overlaps('Microsoft.Storage/storageAccounts/read', '*')).toBe(true);
    expect(overlaps('*', '*')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(overlaps('MICROSOFT.COMPUTE/*/READ', 'microsoft.compute/virtualmachines/read')).toBe(true);
  });
});

describe('grants — notActions subtract', () => {
  it('grants an action covered by a wildcard', () => {
    expect(grants(CONTRIBUTOR, 'Microsoft.Storage/storageAccounts/write').matched).toBe(true);
  });

  it('does NOT grant an action the role explicitly excludes', () => {
    const v = grants(CONTRIBUTOR, 'Microsoft.Authorization/roleAssignments/write');
    expect(v.matched).toBe(false);
    expect(v.denied).toBe(true);
    expect(v.deniedBy).toContain('Microsoft.Authorization/*/Write');
  });

  it('still grants a sibling the exclusion does not cover', () => {
    // The exclusion is on Write and Delete, not read.
    expect(grants(CONTRIBUTOR, 'Microsoft.Authorization/roleAssignments/read').matched).toBe(true);
  });

  it('does not let a narrow exclusion disqualify a broad query', () => {
    // Searching for '*' should still surface Contributor; its exclusions cover
    // a corner of the space, not the query itself.
    expect(grants(CONTRIBUTOR, '*').matched).toBe(true);
  });

  it('reports which bucket matched', () => {
    expect(grants(BLOB_READER, 'Microsoft.Storage/storageAccounts/blobServices/containers/read').bucket).toBe('actions');
    expect(
      grants(BLOB_READER, 'Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read').bucket
    ).toBe('dataActions');
  });

  it('does not match an empty query', () => {
    expect(grants(OWNER, '   ').matched).toBe(false);
  });
});

describe('matchAction and leastPrivilege', () => {
  it('finds every role granting a storage read, narrowest first', () => {
    const hits = matchAction(ROLES, 'Microsoft.Storage/storageAccounts/blobServices/containers/read');
    expect(hits.map((h) => h.role.name)).toContain('Storage Blob Data Reader');
    expect(hits.map((h) => h.role.name)).toContain('Reader');
    // The specific role must outrank the three catch-all roles.
    expect(leastPrivilege(hits).name).toBe('Storage Blob Data Reader');
  });

  it('does not offer a role whose exclusion covers the action', () => {
    const hits = matchAction(ROLES, 'Microsoft.Authorization/roleAssignments/write');
    expect(hits.map((h) => h.role.name)).toContain('Owner');
    expect(hits.map((h) => h.role.name)).not.toContain('Contributor');
  });

  it('ranks a spelled-out role above one holding a catch-all', () => {
    const hits = matchAction(ROLES, 'Microsoft.Compute/virtualMachines/start/action');
    expect(hits[0].role.name).toBe('Virtual Machine Contributor');
  });

  it('supports a wildcard query', () => {
    const names = matchAction(ROLES, 'Microsoft.Compute/*/read').map((h) => h.role.name);
    expect(names).toContain('Virtual Machine Contributor');
    expect(names).toContain('Reader');
  });

  it('returns nothing for an action no role grants', () => {
    expect(matchAction([BLOB_READER], 'Microsoft.Compute/virtualMachines/write')).toEqual([]);
    expect(leastPrivilege([])).toBeNull();
  });
});

describe('breadth', () => {
  it('counts the catalogue operations a role actually grants', () => {
    const cat = actionCatalogue(ROLES);
    expect(breadth(OWNER, ROLES)).toBe(cat.length);
    // Contributor holds `*` too, and differs from Owner by exactly the
    // operations its notActions remove.
    expect(breadth(CONTRIBUTOR, ROLES)).toBeLessThan(breadth(OWNER, ROLES));
    expect(breadth(BLOB_READER, ROLES)).toBeLessThan(breadth(READER, ROLES));
  });

  it('gives a wildcard-only role something to be counted by', () => {
    // A role whose permissions are all data-plane wildcards must not score
    // zero and sort to the top of a least-privilege list.
    const busOwner = {
      id: 'x',
      name: 'Bus Owner',
      description: '',
      category: 'integration',
      actions: ['Microsoft.ServiceBus/*'],
      notActions: [],
      dataActions: ['Microsoft.ServiceBus/*'],
      notDataActions: [],
    };
    expect(breadth(busOwner, [...ROLES, busOwner])).toBeGreaterThan(0);
  });

  it('prefers a precomputed value when the dataset carries one', () => {
    // The refresh script ships this so the browser never recomputes it.
    expect(breadth({ ...BLOB_READER, breadth: 42 }, ROLES)).toBe(42);
  });
});

describe('searchRoles and findRole', () => {
  it('ranks an exact name first', () => {
    expect(searchRoles(ROLES, 'Reader')[0].name).toBe('Reader');
  });

  it('finds by substring', () => {
    expect(searchRoles(ROLES, 'blob').map((r) => r.name)).toEqual(['Storage Blob Data Reader']);
  });

  it('falls back to the description', () => {
    expect(searchRoles(ROLES, 'role assignment').map((r) => r.name)).toEqual(['Contributor']);
  });

  it('finds a role by GUID and by slug', () => {
    expect(findRole(ROLES, 'acdd72a7-3385-48ef-bd42-f606fba81ae7').name).toBe('Reader');
    expect(findRole(ROLES, 'storage-blob-data-reader').name).toBe('Storage Blob Data Reader');
    expect(findRole(ROLES, 'nope')).toBeNull();
  });

  it('slugifies a role name for the URL', () => {
    expect(roleSlug(VM_CONTRIBUTOR)).toBe('virtual-machine-contributor');
  });
});

describe('diffRoles', () => {
  it('separates shared from exclusive permissions per bucket', () => {
    const d = diffRoles(OWNER, CONTRIBUTOR);
    expect(d.actions.shared).toEqual(['*']);
    expect(d.actions.onlyA).toEqual([]);
    expect(d.notActions.onlyB).toEqual([
      'Microsoft.Authorization/*/Delete',
      'Microsoft.Authorization/*/Write',
      'Microsoft.Authorization/elevateAccess/Action',
    ]);
  });
});

describe('toCustomRoleJson', () => {
  it('produces a custom definition without the built-in id', () => {
    const json = toCustomRoleJson(BLOB_READER, 'Blob peeker', ['/subscriptions/abc']);
    expect(json.IsCustom).toBe(true);
    expect(json.Name).toBe('Blob peeker');
    expect(json).not.toHaveProperty('Id');
    expect(json.DataActions).toEqual(BLOB_READER.dataActions);
    expect(json.AssignableScopes).toEqual(['/subscriptions/abc']);
  });

  it('falls back to a placeholder scope and a derived name', () => {
    const json = toCustomRoleJson(READER, '', []);
    expect(json.Name).toBe('Reader (custom)');
    expect(json.AssignableScopes).toEqual(['/subscriptions/{subscriptionId}']);
  });

  it('does not alias the source role arrays', () => {
    const json = toCustomRoleJson(BLOB_READER, 'x', ['/']);
    json.Actions.push('Microsoft.Evil/*');
    expect(BLOB_READER.actions).toHaveLength(1);
  });
});

describe('permissionCount', () => {
  it('totals all four buckets', () => {
    expect(permissionCount(CONTRIBUTOR)).toBe(4);
    expect(permissionCount(BLOB_READER)).toBe(2);
  });
});

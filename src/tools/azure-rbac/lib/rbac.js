/**
 * Search and permission analysis over the Azure built-in role definitions.
 *
 * Pure functions taking the dataset as their first argument, so the whole
 * surface is testable against a fixture. `loadRoles()` is the one impure
 * entry point and is a dynamic import, keeping 459 KB of role definitions out
 * of the island's first-paint bundle.
 */

/**
 * @typedef {{ id: string, name: string, description: string, category: string,
 *             actions: string[], notActions: string[],
 *             dataActions: string[], notDataActions: string[] }} Role
 * @typedef {{ source: string, licence: string, generatedAt: string, roles: Role[] }} RoleData
 */

/** @type {Promise<RoleData> | null} */
let pending = null;

/** @returns {Promise<RoleData>} */
export function loadRoles() {
  if (!pending) {
    pending = import('../../../data/azure/rbac-built-in-roles.json').then((m) => m.default ?? m);
  }
  return pending;
}

/** The four permission buckets, in the order the ARM definition lists them. */
export const BUCKETS = /** @type {const} */ ([
  'actions',
  'notActions',
  'dataActions',
  'notDataActions',
]);

const escapeRegex = (s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

/** @type {Map<string, RegExp>} */
const compiled = new Map();

// An Azure action pattern as a regex.
//
// A `*` matches any run of characters INCLUDING the slash — it is not
// segment-wise. The Reader role is the proof: its only action is the pattern
// `*/read`, and it grants
// `Microsoft.Storage/storageAccounts/blobServices/containers/read`, five
// segments deep. Treating the wildcard as segment-local would silently
// under-report every broad role in the catalogue.
//
// Azure action names are case-insensitive — Contributor excludes
// `Microsoft.Authorization/*/Write` while the operation is published as
// `.../write` — so the regex is too.
/** @param {string} pattern */
function toRegex(pattern) {
  let re = compiled.get(pattern);
  if (!re) {
    re = new RegExp(`^${escapeRegex(pattern).split('*').join('.*')}$`, 'i');
    compiled.set(pattern, re);
  }
  return re;
}

/**
 * Does `pattern` cover the concrete action `action`?
 * @param {string} pattern
 * @param {string} action
 */
export function actionMatches(pattern, action) {
  if (!pattern || !action) return false;
  return toRegex(pattern).test(action);
}

// Could these two patterns describe any action in common?
//
// Someone searching `Microsoft.Storage/*/read` wants the roles that read
// storage, and those roles are written both ways round: Reader holds the
// broader `*/read`, while Storage Blob Data Reader spells out
// `Microsoft.Storage/storageAccounts/blobServices/containers/read`.
//
// Testing each pattern against the other as a literal string catches those two
// cases but misses the one that matters most: when BOTH sides carry a wildcard
// in a different place. `Microsoft.Compute/virtualMachines/*` and
// `Microsoft.Compute/*/read` share `Microsoft.Compute/virtualMachines/read`,
// yet neither matches the other's raw text — so a literal test drops Virtual
// Machine Contributor from a search for compute reads.
//
// So this decides genuine intersection: is there any string both patterns
// accept? A short dynamic program over the two patterns, where a `*` may
// absorb characters the other side is still producing.
/**
 * @param {string} a
 * @param {string} b
 */
export function overlaps(a, b) {
  if (!a || !b) return false;

  const x = a.toLowerCase();
  const y = b.toLowerCase();
  const seen = new Map();

  /** Can x[i:] and y[j:] generate one common string? */
  const walk = (i, j) => {
    const key = i * (y.length + 1) + j;
    const cached = seen.get(key);
    if (cached !== undefined) return cached;

    let result;
    if (i === x.length && j === y.length) {
      result = true;
    } else if (i === x.length) {
      // Only a run of wildcards can still match the empty remainder.
      result = [...y.slice(j)].every((c) => c === '*');
    } else if (j === y.length) {
      result = [...x.slice(i)].every((c) => c === '*');
    } else if (x[i] === '*') {
      // Match nothing, or absorb one character y is producing.
      result = walk(i + 1, j) || walk(i, j + 1);
    } else if (y[j] === '*') {
      result = walk(i, j + 1) || walk(i + 1, j);
    } else {
      result = x[i] === y[j] && walk(i + 1, j + 1);
    }

    seen.set(key, result);
    return result;
  };

  return walk(0, 0);
}

// How a role stands in relation to one queried action.
//
// `denied` is tested with the query as the concrete thing, not as a pattern:
// an exclusion only removes a match if it covers what was actually asked
// about. Contributor holds `*` and excludes `Microsoft.Authorization/*/Write`,
// so it grants a storage write and does not grant a role assignment — but its
// exclusion must not disqualify it from a search for `*`.
/**
 * @param {Role} role
 * @param {string} query
 * @returns {{ matched: boolean, via: string[], bucket: 'actions'|'dataActions'|null, denied: boolean, deniedBy: string[] }}
 */
export function grants(role, query) {
  const q = (query ?? '').trim();
  if (!q) return { matched: false, via: [], bucket: null, denied: false, deniedBy: [] };

  const viaActions = role.actions.filter((a) => overlaps(a, q));
  const viaData = role.dataActions.filter((a) => overlaps(a, q));

  const deniedBy = [
    ...role.notActions.filter((na) => actionMatches(na, q)),
    ...role.notDataActions.filter((na) => actionMatches(na, q)),
  ];

  const bucket = viaActions.length > 0 ? 'actions' : viaData.length > 0 ? 'dataActions' : null;

  return {
    matched: bucket !== null && deniedBy.length === 0,
    via: [...viaActions, ...viaData],
    bucket,
    denied: deniedBy.length > 0,
    deniedBy,
  };
}

/** @type {WeakMap<object, string[]>} */
const catalogues = new WeakMap();

// The sample space the breadth measure counts against: every concrete
// operation any built-in role names, plus one representative operation per
// wildcard pattern.
//
// Concrete actions alone are not enough. Data-plane permissions are almost
// always written as wildcards, so 20 roles — including Azure Service Bus Data
// Owner, whose action is the distinctly un-narrow `Microsoft.ServiceBus/*` —
// matched nothing in the catalogue, scored zero, and sorted to the top of a
// least-privilege list. Substituting a placeholder segment for each wildcard
// (`Microsoft.ServiceBus/*` contributes `Microsoft.ServiceBus/{}`) gives those
// permissions something to be counted by, and broader patterns match the probe
// too, so it raises the wide roles rather than the narrow ones.
/** @param {Role[]} roles */
export function actionCatalogue(roles) {
  let list = catalogues.get(roles);
  if (!list) {
    const set = new Set();
    for (const role of roles) {
      for (const a of [...role.actions, ...role.dataActions]) {
        set.add(a.includes('*') ? a.split('*').join('{}') : a);
      }
    }
    list = [...set];
    catalogues.set(roles, list);
  }
  return list;
}

/** @type {WeakMap<object, number>} */
const breadths = new WeakMap();

// How broad a role is: how many of the catalogue's concrete operations it
// actually grants, exclusions subtracted.
//
// Two cheaper heuristics were tried and both ranked roles backwards. Counting
// patterns calls Owner — one action, `*` — the narrowest role in Azure.
// Scoring patterns by wildcards and depth and summing then rewards roles for
// having MORE permissions, which put VM Restore Operator (45 patterns) top of
// a blob-read search ahead of Storage Blob Data Reader (3).
//
// Counting granted operations has neither failure: it is monotonic in what a
// role can actually do, and it is a number that can be shown to the user and
// checked.
//
// It is precomputed into the dataset by scripts/refresh-azure-rbac.mjs, which
// imports THIS module to do it — computing it here costs 2.3s of blocked main
// thread for a broad query, and a second implementation in the script would be
// free to disagree with this one. The live path below is the fallback for
// fixtures and for data generated before the field existed.
//
// It orders candidates rather than proving minimality — the catalogue is only
// the operations built-in roles happen to name — so the UI presents it as a
// ranking, not a verdict.
/**
 * @param {Role} role
 * @param {Role[]} roles
 */
export function breadth(role, roles) {
  if (typeof role.breadth === 'number') return role.breadth;

  let count = breadths.get(role);
  if (count === undefined) {
    count = 0;
    for (const action of actionCatalogue(roles)) {
      if (grants(role, action).matched) count += 1;
    }
    breadths.set(role, count);
  }
  return count;
}

/**
 * Every role granting `query`, least-privilege first.
 * @param {Role[]} roles
 * @param {string} query
 * @returns {{ role: Role, via: string[], bucket: string }[]}
 */
export function matchAction(roles, query) {
  const hits = [];
  for (const role of roles) {
    const verdict = grants(role, query);
    if (verdict.matched) hits.push({ role, via: verdict.via, bucket: verdict.bucket });
  }

  return hits
    .map((hit) => ({ ...hit, breadth: breadth(hit.role, roles) }))
    .sort((a, b) => a.breadth - b.breadth || a.role.name.localeCompare(b.role.name));
}

/**
 * The narrowest role granting `query`, or null when nothing does.
 * @param {{ role: Role }[]} matches
 */
export function leastPrivilege(matches) {
  return matches.length > 0 ? matches[0].role : null;
}

/**
 * Roles whose name or description matches, ranked exact → prefix → substring.
 * @param {Role[]} roles
 * @param {string} query
 * @param {number} [limit]
 */
export function searchRoles(roles, query, limit = 60) {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return [];

  const scored = [];
  for (const role of roles) {
    const name = role.name.toLowerCase();
    let s = -1;
    if (name === q) s = 0;
    else if (name.startsWith(q)) s = 1000 + name.length;
    else if (name.includes(q)) s = 2000 + name.indexOf(q);
    else if (role.id === q) s = 0;
    else if (role.description.toLowerCase().includes(q)) s = 3000;

    if (s !== -1) scored.push([s, role]);
  }

  return scored
    .sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name))
    .slice(0, limit)
    .map(([, role]) => role);
}

/**
 * A role by GUID or by slugified name, which is what the deep link carries.
 * @param {Role[]} roles
 * @param {string} query
 */
export function findRole(roles, query) {
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return null;
  return (
    roles.find((r) => r.id.toLowerCase() === q) ??
    roles.find((r) => r.name.toLowerCase() === q) ??
    roles.find((r) => roleSlug(r) === q) ??
    null
  );
}

/** URL-safe form of a role name: `Virtual Machine Contributor` → `virtual-machine-contributor`. */
export const roleSlug = (role) =>
  role.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * What two roles hold in common and what only one of them has, per bucket.
 * @param {Role} a
 * @param {Role} b
 */
export function diffRoles(a, b) {
  /** @type {Record<string, {shared: string[], onlyA: string[], onlyB: string[]}>} */
  const out = {};
  for (const bucket of BUCKETS) {
    const setA = new Set(a[bucket]);
    const setB = new Set(b[bucket]);
    out[bucket] = {
      shared: [...setA].filter((x) => setB.has(x)).sort(),
      onlyA: [...setA].filter((x) => !setB.has(x)).sort(),
      onlyB: [...setB].filter((x) => !setA.has(x)).sort(),
    };
  }
  return out;
}

/**
 * An ARM custom role definition seeded from a built-in one.
 *
 * `Id` is deliberately absent and `IsCustom` true: this is a template to edit
 * and deploy, not a copy of the built-in role, and carrying the original's id
 * would make it look like one.
 * @param {Role} role
 * @param {string} name
 * @param {string[]} assignableScopes
 */
export function toCustomRoleJson(role, name, assignableScopes) {
  return {
    Name: name || `${role.name} (custom)`,
    IsCustom: true,
    Description: role.description,
    Actions: [...role.actions],
    NotActions: [...role.notActions],
    DataActions: [...role.dataActions],
    NotDataActions: [...role.notDataActions],
    AssignableScopes:
      assignableScopes?.length > 0 ? assignableScopes : ['/subscriptions/{subscriptionId}'],
  };
}

/** Total permission patterns a role carries, for the summary line. */
export const permissionCount = (role) =>
  BUCKETS.reduce((total, bucket) => total + role[bucket].length, 0);

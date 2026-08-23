/**
 * Turning a Conditional Access policy into the four sentences it is actually
 * making: who it applies to, what it covers, when it fires, and what it then
 * demands.
 *
 * A CA export names everything by GUID and nothing by name, so every list
 * passes through the well-known id map. An unknown GUID is shown as-is rather
 * than dropped — a policy that excludes an id this tool cannot name is exactly
 * the policy someone needs to look at.
 */

/** @type {Promise<object> | null} */
let pending = null;

/** The well-known id map, loaded once and shared. */
export function loadWellKnown() {
  if (!pending) {
    pending = import('../../../data/microsoft/entra-well-known-ids.json').then(
      (m) => m.default ?? m
    );
  }
  return pending;
}

/**
 * Acronyms the generic capitaliser would otherwise mangle. Graph spells these
 * lower-case in the JSON, so splitting on case alone yields "Mfa", which reads
 * as a typo in the middle of an otherwise careful sentence.
 */
const ACRONYMS = new Map([
  ['mfa', 'MFA'],
  ['sso', 'SSO'],
  ['ios', 'iOS'],
  ['macos', 'macOS'],
  ['ip', 'IP'],
  ['api', 'API'],
]);

/** Turn camelCase and PascalCase enum values into readable words. */
export const humanise = (value) => {
  const raw = String(value);

  // Whole-value check first. The camel split would turn "iOS" into "i OS",
  // and no amount of per-word fixing afterwards puts that back together.
  const whole = ACRONYMS.get(raw.toLowerCase());
  if (whole) return whole;

  return raw
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(' ')
    .map((word) => ACRONYMS.get(word.toLowerCase()) ?? word)
    .join(' ')
    .replace(/^./, (c) => c.toUpperCase());
};

/**
 * Resolve one id through a lookup table, falling back to the raw value.
 * @param {Record<string,string>} table
 * @param {string} id
 */
export const resolve = (table, id) => {
  if (!id) return '';
  const key = String(id).toLowerCase();
  return table?.[key] ?? table?.[id] ?? id;
};

/** Join a list the way a sentence would. */
export const list = (items) => {
  const clean = items.filter(Boolean);
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(', ')} and ${clean[clean.length - 1]}`;
};

/** The three policy states, and why the distinction matters. */
export const STATES = {
  enabled: { label: 'On', tone: 'success', note: 'This policy is enforced.' },
  disabled: { label: 'Off', tone: 'outline', note: 'This policy is not enforced.' },
  enabledForReportingButNotEnforced: {
    label: 'Report-only',
    tone: 'warning',
    note: 'Evaluated and logged, but never blocks or challenges anyone.',
  },
};

/** Special user targets that are keywords rather than object ids. */
const USER_KEYWORDS = { All: 'all users', None: 'no users', GuestsOrExternalUsers: 'guests and external users' };

/**
 * Who the policy applies to.
 * @param {object} policy
 * @param {object} wk
 */
export function who(policy, wk) {
  const u = policy.conditions?.users ?? {};
  const include = [];
  const exclude = [];

  const users = (ids, into, label) => {
    for (const id of ids ?? []) {
      into.push(USER_KEYWORDS[id] ? USER_KEYWORDS[id] : `${label} ${id}`);
    }
  };

  users(u.includeUsers, include, 'user');
  users(u.excludeUsers, exclude, 'user');

  for (const id of u.includeGroups ?? []) include.push(`group ${id}`);
  for (const id of u.excludeGroups ?? []) exclude.push(`group ${id}`);

  for (const id of u.includeRoles ?? []) include.push(`the ${resolve(wk.directoryRoles, id)} role`);
  for (const id of u.excludeRoles ?? []) exclude.push(`the ${resolve(wk.directoryRoles, id)} role`);

  const guestTypes = (value) =>
    String(value ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => resolve(wk.guestOrExternalUserTypes, t));

  for (const g of u.includeGuestsOrExternalUsers ? [u.includeGuestsOrExternalUsers] : []) {
    include.push(list(guestTypes(g.guestOrExternalUserTypes)) || 'guests or external users');
  }
  for (const g of u.excludeGuestsOrExternalUsers ? [u.excludeGuestsOrExternalUsers] : []) {
    exclude.push(list(guestTypes(g.guestOrExternalUserTypes)) || 'guests or external users');
  }

  return { include, exclude };
}

/**
 * What the policy covers — applications, user actions or auth contexts.
 * @param {object} policy
 * @param {object} wk
 */
export function what(policy, wk) {
  const a = policy.conditions?.applications ?? {};
  const include = (a.includeApplications ?? []).map((id) => resolve(wk.applications, id));
  const exclude = (a.excludeApplications ?? []).map((id) => resolve(wk.applications, id));
  const userActions = (a.includeUserActions ?? []).map(humanise);
  const authContexts = a.includeAuthenticationContextClassReferences ?? [];

  return { include, exclude, userActions, authContexts };
}

/**
 * When the policy fires — the conditions narrowing it.
 * @param {object} policy
 */
export function when(policy) {
  const c = policy.conditions ?? {};
  const clauses = [];

  if (c.clientAppTypes?.length && !c.clientAppTypes.includes('all')) {
    clauses.push({
      label: 'Client apps',
      value: list(c.clientAppTypes.map(humanise)),
      legacy: c.clientAppTypes.some((t) => t === 'exchangeActiveSync' || t === 'other'),
    });
  }

  const platforms = c.platforms;
  if (platforms) {
    clauses.push({
      label: 'Device platforms',
      value: `include ${list((platforms.includePlatforms ?? []).map(humanise)) || 'any'}${
        platforms.excludePlatforms?.length
          ? `, except ${list(platforms.excludePlatforms.map(humanise))}`
          : ''
      }`,
    });
  }

  const locations = c.locations;
  if (locations) {
    clauses.push({
      label: 'Locations',
      value: `include ${list(locations.includeLocations ?? []) || 'any'}${
        locations.excludeLocations?.length ? `, except ${list(locations.excludeLocations)}` : ''
      }`,
    });
  }

  if (c.signInRiskLevels?.length) {
    clauses.push({ label: 'Sign-in risk', value: list(c.signInRiskLevels.map(humanise)) });
  }
  if (c.userRiskLevels?.length) {
    clauses.push({ label: 'User risk', value: list(c.userRiskLevels.map(humanise)) });
  }
  if (c.devices?.deviceFilter?.rule) {
    clauses.push({
      label: `Device filter (${c.devices.deviceFilter.mode ?? 'include'})`,
      value: c.devices.deviceFilter.rule,
    });
  }

  return clauses;
}

/**
 * What the policy then demands.
 *
 * NOT named `then`. An ES module namespace carrying a `then` export is a
 * thenable, so `await import('./explain.js')` hands the module to the promise
 * machinery, which calls `then(resolve, reject)`. This function ignores those
 * arguments and returns an object, so the await never settles — importing the
 * module hangs forever, with no error. It cost a hung test run to find.
 *
 * `operator` is load-bearing and easy to misread: OR means any one control
 * satisfies the policy, AND means all of them must. A policy requiring "MFA OR
 * compliant device" is a materially weaker thing than one requiring both, and
 * the export distinguishes them by a single word.
 * @param {object} policy
 */
export function demands(policy) {
  const g = policy.grantControls;
  const s = policy.sessionControls;

  const grant = { blocks: false, operator: g?.operator ?? null, controls: [], authStrength: null };

  if (g) {
    const builtIn = g.builtInControls ?? [];
    grant.blocks = builtIn.includes('block');
    grant.controls = builtIn.filter((c) => c !== 'block').map(humanise);
    if (g.authenticationStrength) {
      grant.authStrength = g.authenticationStrength.displayName ?? 'a named authentication strength';
    }
    if (g.termsOfUse?.length) grant.controls.push('Accept terms of use');
  }

  const session = [];
  if (s?.applicationEnforcedRestrictions?.isEnabled) session.push('App-enforced restrictions');
  if (s?.cloudAppSecurity?.isEnabled) {
    session.push(`Defender for Cloud Apps (${humanise(s.cloudAppSecurity.cloudAppSecurityType ?? 'monitor')})`);
  }
  if (s?.signInFrequency?.isEnabled) {
    const f = s.signInFrequency;
    session.push(
      f.frequencyInterval === 'everyTime'
        ? 'Sign-in frequency: every time'
        : `Sign-in frequency: every ${f.value} ${f.type}`
    );
  }
  if (s?.persistentBrowser?.isEnabled) {
    session.push(`Persistent browser: ${humanise(s.persistentBrowser.mode ?? 'never')}`);
  }
  if (s?.continuousAccessEvaluation?.mode) {
    session.push(`Continuous access evaluation: ${humanise(s.continuousAccessEvaluation.mode)}`);
  }
  if (s?.disableResilienceDefaults) session.push('Resilience defaults disabled');

  return { grant, session };
}

/**
 * The whole policy, explained.
 * @param {object} policy
 * @param {object} wk
 */
export function explain(policy, wk) {
  const state = STATES[policy.state] ?? {
    label: humanise(policy.state ?? 'unknown'),
    tone: 'outline',
    note: '',
  };

  return {
    name: policy.displayName ?? '(unnamed policy)',
    id: policy.id ?? null,
    state,
    stateRaw: policy.state ?? null,
    who: who(policy, wk),
    what: what(policy, wk),
    when: when(policy),
    then: demands(policy),
  };
}

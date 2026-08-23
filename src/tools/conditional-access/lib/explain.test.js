import { describe, it, expect } from 'vitest';
import * as explainModule from './explain.js';
import { explain, who, what, when, demands, humanise, resolve, list, STATES } from './explain.js';

const GLOBAL_ADMIN = '62e90394-69f5-4237-9190-012177145e10';
const GRAPH = '00000003-0000-0000-c000-000000000000';

const WK = {
  directoryRoles: { [GLOBAL_ADMIN]: 'Global Administrator' },
  applications: { [GRAPH]: 'Microsoft Graph', All: 'All cloud apps' },
  guestOrExternalUserTypes: { b2bCollaborationGuest: 'B2B collaboration guest' },
};

describe('the module is not accidentally a thenable', () => {
  it('exports no `then`', () => {
    // A module namespace carrying a `then` export is treated as a promise:
    // `await import(...)` calls it as a resolver and, because it is not one,
    // never settles. Importing this module then hangs with no error at all.
    expect(explainModule.then).toBeUndefined();
  });

  it('can be awaited without hanging', async () => {
    const mod = await import('./explain.js');
    expect(typeof mod.explain).toBe('function');
  });
});

describe('humanise', () => {
  it('splits camelCase into words and capitalises', () => {
    expect(humanise('signInRiskLevels')).toBe('Sign In Risk Levels');
    expect(humanise('mfa')).toBe('MFA');
    expect(humanise('exchangeActiveSync')).toBe('Exchange Active Sync');
  });

  it('keeps acronyms upper-case rather than title-casing them', () => {
    // Graph spells these lower-case, and "Mfa" in the middle of a sentence
    // reads as a typo.
    expect(humanise('mfa')).toBe('MFA');
    expect(humanise('iOS')).toBe('iOS');
  });
});

describe('resolve', () => {
  it('maps a known id, case-insensitively', () => {
    expect(resolve(WK.directoryRoles, GLOBAL_ADMIN.toUpperCase())).toBe('Global Administrator');
  });

  it('returns the raw id when the map does not know it', () => {
    // Showing the GUID is the point: an unnameable exclusion is exactly what
    // someone needs to go and look up.
    expect(resolve(WK.directoryRoles, 'unknown-guid')).toBe('unknown-guid');
  });

  it('is safe against a missing table', () => {
    expect(resolve(undefined, 'x')).toBe('x');
    expect(resolve(WK.directoryRoles, '')).toBe('');
  });
});

describe('list', () => {
  it('joins the way a sentence would', () => {
    expect(list(['a'])).toBe('a');
    expect(list(['a', 'b'])).toBe('a and b');
    expect(list(['a', 'b', 'c'])).toBe('a, b and c');
    expect(list([])).toBe('');
    expect(list(['a', null, 'b'])).toBe('a and b');
  });
});

describe('who', () => {
  it('names roles through the map and keeps keywords readable', () => {
    const r = who(
      { conditions: { users: { includeUsers: ['All'], excludeRoles: [GLOBAL_ADMIN] } } },
      WK
    );
    expect(r.include).toEqual(['all users']);
    expect(r.exclude).toEqual(['the Global Administrator role']);
  });

  it('reports groups and guests', () => {
    const r = who(
      {
        conditions: {
          users: {
            includeGroups: ['group-guid'],
            includeGuestsOrExternalUsers: { guestOrExternalUserTypes: 'b2bCollaborationGuest' },
          },
        },
      },
      WK
    );
    expect(r.include).toContain('group group-guid');
    expect(r.include).toContain('B2B collaboration guest');
  });

  it('survives a policy with no users block', () => {
    expect(who({}, WK)).toEqual({ include: [], exclude: [] });
  });
});

describe('what', () => {
  it('names applications through the map', () => {
    const r = what(
      { conditions: { applications: { includeApplications: ['All'], excludeApplications: [GRAPH] } } },
      WK
    );
    expect(r.include).toEqual(['All cloud apps']);
    expect(r.exclude).toEqual(['Microsoft Graph']);
  });

  it('surfaces user actions', () => {
    const r = what(
      { conditions: { applications: { includeUserActions: ['urn:user:registersecurityinfo'] } } },
      WK
    );
    expect(r.userActions).toHaveLength(1);
  });
});

describe('when', () => {
  it('flags legacy client app types', () => {
    const clauses = when({ conditions: { clientAppTypes: ['exchangeActiveSync', 'other'] } });
    expect(clauses[0].label).toBe('Client apps');
    expect(clauses[0].legacy).toBe(true);
  });

  it('does not list client apps when the policy covers all of them', () => {
    expect(when({ conditions: { clientAppTypes: ['all'] } })).toEqual([]);
  });

  it('reports platforms, locations and risk', () => {
    const clauses = when({
      conditions: {
        platforms: { includePlatforms: ['all'], excludePlatforms: ['iOS'] },
        locations: { includeLocations: ['All'], excludeLocations: ['trusted-guid'] },
        signInRiskLevels: ['high', 'medium'],
      },
    });
    expect(clauses.map((c) => c.label)).toEqual(['Device platforms', 'Locations', 'Sign-in risk']);
    expect(clauses[1].value).toMatch(/except trusted-guid/);
    expect(clauses[2].value).toBe('High and Medium');
  });

  it('returns nothing for an unconditioned policy', () => {
    expect(when({})).toEqual([]);
  });
});

describe('demands', () => {
  it('separates a block from a grant', () => {
    expect(demands({ grantControls: { operator: 'OR', builtInControls: ['block'] } }).grant.blocks).toBe(true);
    const r = demands({ grantControls: { operator: 'AND', builtInControls: ['mfa', 'compliantDevice'] } });
    expect(r.grant.blocks).toBe(false);
    expect(r.grant.operator).toBe('AND');
    expect(r.grant.controls).toEqual(['MFA', 'Compliant Device']);
  });

  it('reports an authentication strength', () => {
    const r = demands({
      grantControls: { operator: 'OR', builtInControls: [], authenticationStrength: { displayName: 'Phishing-resistant MFA' } },
    });
    expect(r.grant.authStrength).toBe('Phishing-resistant MFA');
  });

  it('describes session controls', () => {
    const r = demands({
      sessionControls: {
        signInFrequency: { isEnabled: true, value: 4, type: 'hours' },
        persistentBrowser: { isEnabled: true, mode: 'never' },
      },
    });
    expect(r.session).toContain('Sign-in frequency: every 4 hours');
    expect(r.session).toContain('Persistent browser: Never');
  });

  it('handles everyTime frequency without printing undefined', () => {
    const r = demands({ sessionControls: { signInFrequency: { isEnabled: true, frequencyInterval: 'everyTime' } } });
    expect(r.session).toContain('Sign-in frequency: every time');
  });

  it('survives a policy with no controls at all', () => {
    const r = demands({});
    expect(r.grant.controls).toEqual([]);
    expect(r.session).toEqual([]);
  });
});

describe('explain', () => {
  it('distinguishes the three states, report-only especially', () => {
    expect(explain({ state: 'enabled' }, WK).state.label).toBe('On');
    expect(explain({ state: 'disabled' }, WK).state.label).toBe('Off');
    const ro = explain({ state: 'enabledForReportingButNotEnforced' }, WK);
    expect(ro.state.label).toBe('Report-only');
    expect(ro.state.note).toMatch(/never blocks/);
  });

  it('falls back for an unknown state rather than rendering nothing', () => {
    expect(explain({ state: 'somethingNew' }, WK).state.label).toBe('Something New');
  });

  it('names an unnamed policy', () => {
    expect(explain({}, WK).name).toBe('(unnamed policy)');
  });

  it('assembles all four parts', () => {
    const e = explain(
      {
        displayName: 'P',
        state: 'enabled',
        conditions: {
          users: { includeUsers: ['All'] },
          applications: { includeApplications: ['All'] },
          clientAppTypes: ['exchangeActiveSync'],
        },
        grantControls: { operator: 'OR', builtInControls: ['block'] },
      },
      WK
    );
    expect(e.who.include).toEqual(['all users']);
    expect(e.what.include).toEqual(['All cloud apps']);
    expect(e.when[0].legacy).toBe(true);
    expect(e.then.grant.blocks).toBe(true);
  });
});

describe('STATES', () => {
  it('covers every state Graph emits', () => {
    expect(Object.keys(STATES).sort()).toEqual([
      'disabled',
      'enabled',
      'enabledForReportingButNotEnforced',
    ]);
  });
});

import { describe, it, expect } from 'vitest';
import { findGaps, summarise } from './gaps.js';

const GLOBAL_ADMIN = '62e90394-69f5-4237-9190-012177145e10';

const WK = { directoryRoles: { [GLOBAL_ADMIN]: 'Global Administrator' } };

/** A policy that satisfies most checks, so each test can break exactly one. */
const healthy = (over = {}) => ({
  id: 'base',
  displayName: 'Baseline',
  state: 'enabled',
  conditions: {
    users: { includeUsers: ['All'], excludeUsers: ['break-glass-guid'] },
    applications: { includeApplications: ['All'] },
  },
  grantControls: { operator: 'AND', builtInControls: ['mfa', 'compliantDevice'] },
  sessionControls: { signInFrequency: { isEnabled: true, value: 8, type: 'hours' } },
  ...over,
});

const blockLegacy = () => ({
  id: 'legacy',
  displayName: 'Block legacy auth',
  state: 'enabled',
  conditions: {
    users: { includeUsers: ['All'], excludeUsers: ['break-glass-guid'] },
    applications: { includeApplications: ['All'] },
    clientAppTypes: ['exchangeActiveSync', 'other'],
  },
  grantControls: { operator: 'OR', builtInControls: ['block'] },
});

const ids = (findings) => findings.map((f) => f.id);

describe('findGaps — a well-configured set', () => {
  it('raises nothing high-severity when the basics are covered', () => {
    const findings = findGaps([healthy(), blockLegacy()], WK);
    expect(findings.filter((f) => f.severity === 'high')).toEqual([]);
  });
});

describe('findGaps — legacy authentication', () => {
  it('flags a set with no legacy-auth block', () => {
    expect(ids(findGaps([healthy()], WK))).toContain('legacy-auth');
  });

  it('is satisfied by an enabled blocking policy targeting legacy clients', () => {
    expect(ids(findGaps([healthy(), blockLegacy()], WK))).not.toContain('legacy-auth');
  });

  it('is NOT satisfied by a report-only legacy block', () => {
    const reportOnly = { ...blockLegacy(), state: 'enabledForReportingButNotEnforced' };
    expect(ids(findGaps([healthy(), reportOnly], WK))).toContain('legacy-auth');
  });

  it('is NOT satisfied by a policy that targets legacy clients but does not block', () => {
    const notBlocking = {
      ...blockLegacy(),
      grantControls: { operator: 'OR', builtInControls: ['mfa'] },
    };
    expect(ids(findGaps([healthy(), notBlocking], WK))).toContain('legacy-auth');
  });
});

describe('findGaps — break-glass and lockout', () => {
  it('flags a blocking all-users policy with no exclusions', () => {
    const lockout = {
      id: 'lock',
      displayName: 'Block everything',
      state: 'enabled',
      conditions: { users: { includeUsers: ['All'] }, applications: { includeApplications: ['All'] } },
      grantControls: { operator: 'OR', builtInControls: ['block'] },
    };
    const findings = findGaps([lockout], WK);
    expect(ids(findings)).toContain('no-break-glass');
    expect(findings.find((f) => f.id === 'no-break-glass').policies).toEqual(['Block everything']);
  });

  it('does not flag it when an exclusion exists', () => {
    expect(ids(findGaps([healthy(), blockLegacy()], WK))).not.toContain('no-break-glass');
  });

  it('notes when nothing anywhere is excluded', () => {
    const noExclusions = healthy({ conditions: { users: { includeUsers: ['All'] }, applications: { includeApplications: ['All'] } } });
    expect(ids(findGaps([noExclusions], WK))).toContain('no-exclusions-anywhere');
  });
});

describe('findGaps — administrator MFA', () => {
  it('flags a set where nothing requires MFA', () => {
    const noMfa = healthy({ grantControls: { operator: 'OR', builtInControls: ['compliantDevice'] } });
    expect(ids(findGaps([noMfa], WK))).toContain('admin-mfa');
  });

  it('is satisfied by an all-users MFA policy', () => {
    expect(ids(findGaps([healthy(), blockLegacy()], WK))).not.toContain('admin-mfa');
  });

  it('is satisfied by a role-targeted MFA policy', () => {
    const roleMfa = healthy({
      conditions: {
        users: { includeRoles: [GLOBAL_ADMIN], excludeUsers: ['bg'] },
        applications: { includeApplications: ['All'] },
      },
    });
    expect(ids(findGaps([roleMfa, blockLegacy()], WK))).not.toContain('admin-mfa');
  });

  it('counts an authentication strength as MFA', () => {
    const strength = healthy({
      grantControls: {
        operator: 'AND',
        builtInControls: ['compliantDevice'],
        authenticationStrength: { displayName: 'Phishing-resistant MFA' },
      },
    });
    expect(ids(findGaps([strength, blockLegacy()], WK))).not.toContain('admin-mfa');
  });
});

describe('findGaps — state', () => {
  it('counts report-only policies', () => {
    const findings = findGaps([healthy({ state: 'enabledForReportingButNotEnforced' })], WK);
    const f = findings.find((x) => x.id === 'report-only');
    expect(f.title).toMatch(/1 policy is report-only/);
  });

  it('pluralises correctly', () => {
    const p = healthy({ state: 'enabledForReportingButNotEnforced' });
    const findings = findGaps([p, { ...p, id: 'b' }], WK);
    expect(findings.find((x) => x.id === 'report-only').title).toMatch(/2 policies are report-only/);
  });

  it('flags a set where nothing is enforced', () => {
    expect(ids(findGaps([healthy({ state: 'disabled' })], WK))).toContain('nothing-enabled');
  });
});

describe('findGaps — privileged role exclusions', () => {
  it('flags an enabled policy excluding Global Administrator, and names it', () => {
    const excludes = healthy({
      conditions: {
        users: { includeUsers: ['All'], excludeRoles: [GLOBAL_ADMIN] },
        applications: { includeApplications: ['All'] },
      },
    });
    const f = findGaps([excludes], WK).find((x) => x.id === 'privileged-excluded');
    expect(f).toBeDefined();
    expect(f.detail).toMatch(/Global Administrator/);
  });

  it('falls back to the raw GUID when the map cannot name it', () => {
    const excludes = healthy({
      conditions: {
        users: { includeUsers: ['All'], excludeRoles: [GLOBAL_ADMIN] },
        applications: { includeApplications: ['All'] },
      },
    });
    const f = findGaps([excludes], {}).find((x) => x.id === 'privileged-excluded');
    expect(f.detail).toMatch(GLOBAL_ADMIN);
  });
});

describe('findGaps — ordering and robustness', () => {
  it('sorts high severity first', () => {
    const severities = findGaps([healthy({ grantControls: undefined })], WK).map((f) => f.severity);
    expect(severities).toEqual([...severities].sort((a, b) => ({ high: 0, medium: 1, info: 2 })[a] - ({ high: 0, medium: 1, info: 2 })[b]));
  });

  it('survives policies missing every optional block', () => {
    expect(() => findGaps([{ id: 'x', state: 'enabled' }], WK)).not.toThrow();
  });

  it('returns nothing for an empty set rather than inventing findings', () => {
    expect(findGaps([], WK)).toEqual([]);
  });
});

describe('summarise', () => {
  it('counts by severity', () => {
    expect(summarise(findGaps([healthy()], WK)).high).toBeGreaterThan(0);
    expect(summarise([])).toEqual({ high: 0, medium: 0, info: 0 });
  });
});

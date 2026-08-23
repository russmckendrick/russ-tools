/**
 * Heuristic checks over a set of Conditional Access policies.
 *
 * The scope of what this can say is set by what it can see, and what it can
 * see is the JSON that was pasted in. It has no tenant, no sign-in logs, no
 * group memberships and no list of who holds which role. So every finding is
 * phrased as something observable in the export, and the UI says plainly that
 * this is a review of pasted JSON rather than a tenant assessment.
 *
 * That distinction is the difference between useful and misleading: a tool
 * that says "your admins have MFA" on the strength of one pasted policy would
 * be lying, whereas "no policy in this export requires MFA for admin roles" is
 * true of the export and actionable.
 */

import { resolve } from './explain.js';

/** @typedef {{ id: string, severity: 'high'|'medium'|'info', title: string, detail: string, policies: string[] }} Finding */

const ENABLED = 'enabled';
const REPORT_ONLY = 'enabledForReportingButNotEnforced';

/** Legacy authentication clients — the ones that cannot do modern auth. */
const LEGACY_CLIENTS = ['exchangeActiveSync', 'other'];

/** Directory roles worth calling out when a policy targets or misses them. */
const PRIVILEGED_ROLE_IDS = new Set([
  '62e90394-69f5-4237-9190-012177145e10', // Global Administrator
  '194ae4cb-b126-40b2-bd5b-6091b380977d', // Security Administrator
  'e8611ab8-c189-46e8-94e1-60213ab1f814', // Privileged Role Administrator
  '729827e3-9c14-49f7-bb1b-9608f156bbb8', // Helpdesk Administrator
  'fe930be7-5e62-47db-91af-98c3a49a38b1', // User Administrator
  '158c047a-c907-4556-b7ef-446551a6b5f7', // Cloud Application Administrator
  '966707d0-3269-4727-9be2-8c3a10f19b9d', // Password Administrator
  '7be44c8a-adaf-4e2a-84d6-ab2649e08a13', // Privileged Authentication Administrator
]);

const isEnabled = (p) => p.state === ENABLED;
const name = (p) => p.displayName ?? p.id ?? '(unnamed policy)';

const blocks = (p) => (p.grantControls?.builtInControls ?? []).includes('block');
const requiresMfa = (p) => {
  const c = p.grantControls?.builtInControls ?? [];
  return c.includes('mfa') || Boolean(p.grantControls?.authenticationStrength);
};
const requiresDevice = (p) => {
  const c = p.grantControls?.builtInControls ?? [];
  return c.includes('compliantDevice') || c.includes('domainJoinedDevice');
};

const targetsAllUsers = (p) => (p.conditions?.users?.includeUsers ?? []).includes('All');
const targetsAllApps = (p) => (p.conditions?.applications?.includeApplications ?? []).includes('All');

const hasExclusions = (p) => {
  const u = p.conditions?.users ?? {};
  return (u.excludeUsers?.length ?? 0) + (u.excludeGroups?.length ?? 0) + (u.excludeRoles?.length ?? 0) > 0;
};

/**
 * Every check, run over the whole set.
 * @param {object[]} policies
 * @param {object} wk  the well-known id map, for naming roles in findings
 * @returns {Finding[]}
 */
export function findGaps(policies, wk = {}) {
  /** @type {Finding[]} */
  const findings = [];

  // No policies means nothing to say. Without this guard the "no policy
  // does X" checks all fire on an empty set and report an unconfigured
  // tenant, which is a claim about something that was never pasted in.
  if (policies.length === 0) return findings;

  const enabled = policies.filter(isEnabled);

  const add = (id, severity, title, detail, matched = []) =>
    findings.push({ id, severity, title, detail, policies: matched.map(name) });

  // ---- Legacy authentication -------------------------------------------
  const blocksLegacy = enabled.filter(
    (p) =>
      blocks(p) &&
      (p.conditions?.clientAppTypes ?? []).some((t) => LEGACY_CLIENTS.includes(t))
  );
  if (blocksLegacy.length === 0) {
    add(
      'legacy-auth',
      'high',
      'No enabled policy blocks legacy authentication',
      'Legacy clients (Exchange ActiveSync and "other") cannot perform multifactor authentication, ' +
        'so a policy requiring MFA never challenges them. Blocking them is the single highest-value ' +
        'Conditional Access policy in most tenants.'
    );
  }

  // ---- Break-glass exclusions ------------------------------------------
  const lockoutRisk = enabled.filter((p) => blocks(p) && targetsAllUsers(p) && !hasExclusions(p));
  if (lockoutRisk.length > 0) {
    add(
      'no-break-glass',
      'high',
      'A blocking policy targets all users with no exclusions',
      'Nothing is excluded from this policy, so there is no emergency-access ("break-glass") account ' +
        'left outside it. Microsoft recommends excluding at least one cloud-only emergency account ' +
        'from every Conditional Access policy so a misconfiguration cannot lock everyone out.',
      lockoutRisk
    );
  } else if (enabled.length > 0 && enabled.every((p) => !hasExclusions(p))) {
    add(
      'no-exclusions-anywhere',
      'medium',
      'No policy in this export excludes anyone',
      'None of the enabled policies carry a user, group or role exclusion. If these are all your ' +
        'policies, no emergency-access account is exempt from them.'
    );
  }

  // ---- MFA for administrators ------------------------------------------
  const adminMfa = enabled.filter((p) => {
    if (!requiresMfa(p)) return false;
    const roles = p.conditions?.users?.includeRoles ?? [];
    return targetsAllUsers(p) || roles.some((r) => PRIVILEGED_ROLE_IDS.has(String(r).toLowerCase()));
  });
  if (adminMfa.length === 0) {
    add(
      'admin-mfa',
      'high',
      'No enabled policy requires MFA for administrators',
      'No policy here requires multifactor authentication for privileged directory roles or for all ' +
        'users. Administrator accounts are the highest-value target in a tenant and are the usual ' +
        'first policy.'
    );
  }

  // ---- Report-only and disabled ----------------------------------------
  const reportOnly = policies.filter((p) => p.state === REPORT_ONLY);
  if (reportOnly.length > 0) {
    add(
      'report-only',
      'medium',
      `${reportOnly.length} ${reportOnly.length === 1 ? 'policy is' : 'policies are'} report-only`,
      'Report-only policies are evaluated and logged but never block or challenge anyone. They are ' +
        'the right way to test a change, and an easy thing to leave switched on by accident.',
      reportOnly
    );
  }

  const disabled = policies.filter((p) => p.state === 'disabled');
  if (disabled.length > 0) {
    add(
      'disabled',
      'info',
      `${disabled.length} ${disabled.length === 1 ? 'policy is' : 'policies are'} disabled`,
      'These are not enforced. Worth confirming each one is off deliberately.',
      disabled
    );
  }

  // ---- Device compliance ------------------------------------------------
  if (enabled.length > 0 && !enabled.some(requiresDevice)) {
    add(
      'no-device-compliance',
      'medium',
      'No enabled policy requires a managed device',
      'Nothing here requires a compliant or hybrid-joined device. MFA alone proves who is signing in, ' +
        'not what they are signing in from — a device requirement is what stops an authenticated ' +
        'session from an unmanaged machine.'
    );
  }

  // ---- Session controls on unmanaged access ------------------------------
  const anySession = enabled.some(
    (p) => p.sessionControls?.signInFrequency?.isEnabled || p.sessionControls?.persistentBrowser?.isEnabled
  );
  if (enabled.length > 0 && !anySession) {
    add(
      'no-session-controls',
      'info',
      'No enabled policy sets a sign-in frequency or browser persistence',
      'Without a session control, a token issued once can remain valid for its full lifetime. ' +
        'Sign-in frequency and non-persistent browser sessions are the usual pair for unmanaged devices.'
    );
  }

  // ---- All users and all apps, enabled, no exclusions --------------------
  const broad = enabled.filter((p) => targetsAllUsers(p) && targetsAllApps(p) && !hasExclusions(p));
  if (broad.length > 0) {
    add(
      'broad-scope',
      'medium',
      'A policy covers every user and every app with no exclusions',
      'Broad scope is often correct, but combined with no exclusions it leaves no route back in if ' +
        'the grant control cannot be satisfied. Check that an emergency-access account is exempt.',
      broad
    );
  }

  // ---- Named privileged roles that are excluded --------------------------
  const excludesPrivileged = enabled.filter((p) =>
    (p.conditions?.users?.excludeRoles ?? []).some((r) => PRIVILEGED_ROLE_IDS.has(String(r).toLowerCase()))
  );
  if (excludesPrivileged.length > 0) {
    const named = excludesPrivileged.flatMap((p) =>
      (p.conditions?.users?.excludeRoles ?? [])
        .filter((r) => PRIVILEGED_ROLE_IDS.has(String(r).toLowerCase()))
        .map((r) => resolve(wk.directoryRoles ?? {}, r))
    );
    add(
      'privileged-excluded',
      'medium',
      'A privileged role is excluded from an enabled policy',
      `${[...new Set(named)].join(', ')} — excluding an administrative role exempts exactly the ` +
        'accounts a policy most needs to cover. This is sometimes deliberate (a break-glass path), ' +
        'and worth confirming it is.',
      excludesPrivileged
    );
  }

  // ---- Nothing enabled at all --------------------------------------------
  if (policies.length > 0 && enabled.length === 0) {
    add(
      'nothing-enabled',
      'high',
      'No policy in this export is enforced',
      'Every policy here is disabled or report-only, so none of them is currently affecting sign-ins.'
    );
  }

  const order = { high: 0, medium: 1, info: 2 };
  return findings.sort((a, b) => order[a.severity] - order[b.severity]);
}

/** A one-line summary of a findings list, for the tab label and the summary row. */
export function summarise(findings) {
  const counts = { high: 0, medium: 0, info: 0 };
  for (const f of findings) counts[f.severity] += 1;
  return counts;
}

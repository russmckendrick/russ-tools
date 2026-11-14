#!/usr/bin/env node

/**
 * Entra identifiers, from Microsoft's published references.
 *
 *   pnpm refresh:entra-ids
 *
 * Two files come out of one run, because two tools read the same sources.
 *
 * 1. src/data/microsoft/entra-well-known-ids.json, for the Conditional Access
 *    explainer. An exported policy names its targets by id and nothing else,
 *    so that tool needs a map from id to name: directory role template ids
 *    from the Entra permissions reference, plus the short inline list of
 *    application ids and guest types below.
 *
 * 2. src/data/microsoft/entra-ids.json and its companion entra-id-index.json,
 *    for the Entra ID lookup. Everything in these two is fetched; nothing is
 *    typed by hand. Each record says which page it came from.
 *
 *    Directory roles
 *      https://github.com/MicrosoftDocs/entra-docs/blob/main/docs/identity/role-based-access-control/permissions-reference.md
 *    Microsoft Graph permissions (delegated scopes, application roles, RSC)
 *      https://github.com/microsoftgraph/microsoft-graph-docs-contrib/blob/main/concepts/permissions-reference.md
 *    AADSTS sign-in error codes
 *      https://github.com/MicrosoftDocs/entra-docs/blob/main/docs/identity-platform/reference-error-codes.md
 *    First-party application ids, merged from five pages (see APP_SOURCES)
 *
 *    There is no single published list of Microsoft's first-party application
 *    ids. The support article that used to carry one now lists four, and the
 *    complete set is only readable from a tenant with Graph credentials. The
 *    application records here are therefore the union of what Microsoft's
 *    docs tabulate, which is a few hundred of several thousand. The lookup
 *    says so rather than implying a miss means "not Microsoft".
 *
 * The inline APPLICATIONS list feeds file 1 only. It predates this script's
 * fetched sources, is not checked against them, and is deliberately kept out
 * of file 2.
 *
 * Sources are CC-BY-4.0, (c) Microsoft. Output is sorted before writing.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanCell, fetchText, parseTables, stringifyRows } from './lib/markdown-tables.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../src/data/microsoft/entra-well-known-ids.json');

const ROLES_MD =
  'https://raw.githubusercontent.com/MicrosoftDocs/entra-docs/main/docs/identity/role-based-access-control/permissions-reference.md';
const HUMAN =
  'https://learn.microsoft.com/entra/identity/role-based-access-control/permissions-reference';

/**
 * Microsoft first-party application ids that show up in Conditional Access
 * `includeApplications` / `excludeApplications`, plus the two reserved values
 * that are not GUIDs at all.
 */
const APPLICATIONS = {
  All: 'All cloud apps',
  None: 'No cloud apps',
  Office365: 'Office 365 (the app suite target)',
  MicrosoftAdminPortals: 'Microsoft Admin Portals',
  '00000002-0000-0ff1-ce00-000000000000': 'Office 365 Exchange Online',
  '00000003-0000-0ff1-ce00-000000000000': 'Office 365 SharePoint Online',
  '00000003-0000-0000-c000-000000000000': 'Microsoft Graph',
  '00000002-0000-0000-c000-000000000000': 'Azure Active Directory Graph (retired)',
  '797f4846-ba00-4fd7-ba5e-ceb5e5f1a0e0': 'Windows Azure Service Management API',
  '797f4846-ba00-4fd7-ba5e-ceb5e5f1a0e1': 'Azure Resource Manager',
  'c44b4083-3bb0-49c1-b47d-974e53cbdf3c': 'Azure Portal',
  'cf36b471-5b44-428c-9ce7-313bf84528de': 'Microsoft Online Syndication Partner Portal',
  '00000004-0000-0ff1-ce00-000000000000': 'Skype for Business Online',
  '00000006-0000-0ff1-ce00-000000000000': 'Microsoft Office 365 Portal',
  '00000007-0000-0000-c000-000000000000': 'Dynamics CRM Online',
  '00000009-0000-0000-c000-000000000000': 'Power BI Service',
  '1fec8e78-bce4-4aaf-ab1b-5451cc387264': 'Microsoft Teams',
  'd3590ed6-52b3-4102-aeff-aad2292ab01c': 'Microsoft Office (legacy Office client)',
  '872cd9fa-d31f-45e0-9eab-6e460a02d1f1': 'Visual Studio',
  '04b07795-8ddb-461a-bbee-02f9e1bf7b46': 'Microsoft Azure CLI',
  '1950a258-227b-4e31-a9cf-717495945fc2': 'Microsoft Azure PowerShell',
  '14d82eec-204b-4c2f-b7e8-296a70dab67e': 'Microsoft Graph Command Line Tools',
  '0000000a-0000-0000-c000-000000000000': 'Microsoft Intune',
  '9cdead84-a844-4324-93f2-b2e6bb768d07': 'Microsoft Intune Enrolment',
  '66a88757-258c-4c72-893c-3e8bed4d6899': 'Microsoft Forms',
  '4765445b-32c6-49b0-83e6-1d93765276ca': 'Office 365 (OfficeHome)',
};

/**
 * Guest and external user types, which CA policies encode as a comma-joined
 * list in `guestOrExternalUserTypes`.
 */
const GUEST_TYPES = {
  internalGuest: 'Internal guest',
  b2bCollaborationGuest: 'B2B collaboration guest',
  b2bCollaborationMember: 'B2B collaboration member',
  b2bDirectConnectUser: 'B2B direct connect user',
  otherExternalUser: 'Other external user',
  serviceProvider: 'Service provider (GDAP partner)',
};

console.log(`Fetching ${ROLES_MD}`);
const res = await fetch(ROLES_MD);
if (!res.ok) {
  console.error(`Source returned ${res.status} ${res.statusText}`);
  process.exit(1);
}
const md = await res.text();

/**
 * Every template id lives in one blockquoted table under "All roles", not in
 * the per-role sections below it. A row is:
 *
 *   > | [Global Administrator](#global-administrator) | Can manage… | 62e90394-… |
 *
 * so take the linked name from the first cell and the GUID from the last. The
 * middle cell carries prose and inline images and is deliberately not parsed.
 */
const roles = {};
const ROW = /^>?\s*\|\s*\[([^\]]+)\]\([^)]*\)\s*\|.*\|\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\s*\|/gim;

for (const match of md.matchAll(ROW)) {
  roles[match[2].toLowerCase()] = match[1].trim();
}

if (Object.keys(roles).length < 50) {
  console.error(
    `Only ${Object.keys(roles).length} directory roles parsed — the reference has been restructured.`
  );
  process.exit(1);
}

const sortObject = (obj) =>
  Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));

const data = {
  source: HUMAN,
  licence: `CC-BY-4.0, (c) Microsoft. See ${HUMAN}`,
  generatedAt: new Date().toISOString().slice(0, 10),
  directoryRoles: sortObject(roles),
  applications: sortObject(APPLICATIONS),
  guestOrExternalUserTypes: sortObject(GUEST_TYPES),
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);

console.log(
  `Wrote ${Object.keys(roles).length} directory roles, ${Object.keys(APPLICATIONS).length} applications ` +
    `to src/data/microsoft/entra-well-known-ids.json`
);

/* ---------------------------------------------------------- the lookup dataset */

const LOOKUP_OUT = resolve(HERE, '../src/data/microsoft/entra-ids.json');
const INDEX_OUT = resolve(HERE, '../src/data/microsoft/entra-id-index.json');

const GUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const WHOLE_GUID = new RegExp(`^${GUID.source}$`, 'i');

const GRAPH_MD =
  'https://raw.githubusercontent.com/microsoftgraph/microsoft-graph-docs-contrib/main/concepts/permissions-reference.md';
const GRAPH_HUMAN = 'https://learn.microsoft.com/graph/permissions-reference';
const ERRORS_MD =
  'https://raw.githubusercontent.com/MicrosoftDocs/entra-docs/main/docs/identity-platform/reference-error-codes.md';
const ERRORS_HUMAN = 'https://learn.microsoft.com/entra/identity-platform/reference-error-codes';

/**
 * Pages that tabulate first-party application ids. Order is precedence: when
 * two pages name the same id differently, the earlier page's name leads and
 * the others are kept as aliases.
 */
const APP_SOURCES = [
  {
    key: 'power-platform',
    title: 'Commonly used Microsoft first-party services and portal apps',
    raw: 'https://raw.githubusercontent.com/MicrosoftDocs/power-platform/main/power-platform/admin/apps-to-allow.md',
    human: 'https://learn.microsoft.com/power-platform/admin/apps-to-allow',
  },
  {
    key: 'sign-in-reports',
    title: 'Verify first-party Microsoft applications in sign-in reports',
    raw: 'https://raw.githubusercontent.com/MicrosoftDocs/SupportArticles-docs/main/support/entra/entra-id/governance/verify-first-party-apps-sign-in.md',
    human: 'https://learn.microsoft.com/troubleshoot/entra/entra-id/governance/verify-first-party-apps-sign-in',
  },
  {
    key: 'mandatory-mfa',
    title: 'Mandatory multifactor authentication for Azure and admin portals',
    raw: 'https://raw.githubusercontent.com/MicrosoftDocs/entra-docs/main/docs/identity/authentication/concept-mandatory-multifactor-authentication.md',
    human: 'https://learn.microsoft.com/entra/identity/authentication/concept-mandatory-multifactor-authentication',
  },
  {
    key: 'conditional-access',
    title: 'Conditional Access: target resources',
    raw: 'https://raw.githubusercontent.com/MicrosoftDocs/entra-docs/main/docs/identity/conditional-access/concept-conditional-access-cloud-apps.md',
    human: 'https://learn.microsoft.com/entra/identity/conditional-access/concept-conditional-access-cloud-apps',
  },
  {
    key: 'microsoft-365-clients',
    title: 'Microsoft 365 client application IDs',
    raw: 'https://raw.githubusercontent.com/MicrosoftDocs/msteams-docs/main/msteams-platform/includes/tabs/microsoft-365-client-application-ids.md',
    human: 'https://learn.microsoft.com/microsoftteams/platform/tabs/how-to/authentication/tab-sso-register-aad',
  },
];

/* Directory roles, this time with the description the first pass skips. */

const roleRows = parseTables(md)
  .flatMap((table) => table.rows)
  .filter((row) => row.length >= 3 && WHOLE_GUID.test(cleanCell(row[row.length - 1])) && /^\[[^\]]+\]\(#/.test(row[0]));

const lookupRoles = roleRows
  .map((row) => ({
    id: cleanCell(row[row.length - 1]).toLowerCase(),
    name: cleanCell(row[0]),
    description: cleanCell(row[1]),
    privileged: /privileged-label/.test(row[1]),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

if (lookupRoles.length !== Object.keys(roles).length) {
  console.error(
    `The table parser found ${lookupRoles.length} directory roles and the row pattern ${Object.keys(roles).length}; they must agree.`
  );
  process.exit(1);
}

/* Microsoft Graph permissions. */

console.log(`Fetching ${GRAPH_MD}`);
const graphMd = await fetchText(GRAPH_MD);
const graphLines = graphMd.split(/\r?\n/);
const rscStart = graphLines.findIndex((line) => /^##\s+Resource-specific consent/i.test(line));
const relatedStart = graphLines.findIndex((line, i) => i > rscStart && /^##\s+/.test(line));

const absent = (text) => (text === '-' || text === '' ? null : text);

/** One `### Name` section: a four-row table with an Application and a Delegated column. */
function permissionSide(rows, column) {
  const value = (label) => absent(cleanCell(rows.find((row) => cleanCell(row[0]) === label)?.[column] ?? ''));
  const id = value('Identifier');
  if (!id || !WHOLE_GUID.test(id)) return null;
  return {
    id: id.toLowerCase(),
    displayText: value('DisplayText'),
    description: value('Description'),
    adminConsentRequired: value('AdminConsentRequired') === 'Yes',
  };
}

const permissions = [];
const sections = graphLines
  .slice(0, rscStart === -1 ? graphLines.length : rscStart)
  .join('\n')
  .split(/^###\s+/m)
  .slice(1);

for (const section of sections) {
  const name = section.split(/\r?\n/, 1)[0].trim();
  const table = parseTables(section).find((candidate) => cleanCell(candidate.header[0]) === 'Category');
  if (!table) continue;
  const application = permissionSide(table.rows, table.header.findIndex((cell) => cleanCell(cell) === 'Application'));
  const delegated = permissionSide(table.rows, table.header.findIndex((cell) => cleanCell(cell) === 'Delegated'));
  if (!application && !delegated) continue;
  permissions.push({ name, application, delegated });
}

const rscTable =
  rscStart === -1
    ? null
    : parseTables(graphLines.slice(rscStart, relatedStart === -1 ? undefined : relatedStart).join('\n')).find(
        (table) => cleanCell(table.header[0]) === 'Name' && cleanCell(table.header[1]) === 'ID'
      );

for (const row of rscTable?.rows ?? []) {
  const id = cleanCell(row[1]).toLowerCase();
  if (!WHOLE_GUID.test(id)) continue;
  permissions.push({
    name: cleanCell(row[0]),
    resourceSpecific: {
      id,
      displayText: absent(cleanCell(row[2])),
      description: absent(cleanCell(row[3])),
    },
  });
}

permissions.sort((a, b) => a.name.localeCompare(b.name));

if (permissions.length < 500) {
  console.error(`Only ${permissions.length} Graph permissions parsed; the reference has been restructured.`);
  process.exit(1);
}

/* First-party applications. */

const apps = new Map();
const addApp = (id, name, source) => {
  const key = id.toLowerCase();
  const clean = name.replace(/\s+/g, ' ').trim();
  if (!clean) return;
  const app = apps.get(key) ?? { id: key, name: clean, aliases: [], sources: [] };
  if (app.name !== clean && !app.aliases.includes(clean)) app.aliases.push(clean);
  if (!app.sources.includes(source)) app.sources.push(source);
  apps.set(key, app);
};

for (const source of APP_SOURCES) {
  console.log(`Fetching ${source.raw}`);
  const text = await fetchText(source.raw);
  let found = 0;

  for (const table of parseTables(text)) {
    for (const row of table.rows) {
      const cells = row.map(cleanCell);
      const idCell = cells.findIndex((cell) => WHOLE_GUID.test(cell));
      const nameCell = cells.findIndex((cell, i) => i !== idCell && cell && !WHOLE_GUID.test(cell));
      if (idCell === -1 || nameCell === -1 || nameCell > 1 || idCell > 1) continue;
      addApp(cells[idCell], cells[nameCell], source.key);
      found += 1;
    }
  }

  // The Conditional Access page lists its portal ids as `- Name app ID: guid`.
  for (const match of text.matchAll(new RegExp(`^\\s*[-*]\\s+(.+?)\\s+app ID:\\s*(${GUID.source})\\s*$`, 'gim'))) {
    addApp(match[2], cleanCell(match[1]), source.key);
    found += 1;
  }

  if (found === 0) {
    console.error(`No application ids found in ${source.raw}; the page has been restructured.`);
    process.exit(1);
  }
}

// The permissions reference names Microsoft Graph's own application id in its
// sample request, which is the one place Microsoft publishes it beside the name.
const graphApp = new RegExp(`servicePrincipals\\(appId='(${GUID.source})'\\)`, 'i').exec(graphMd);
if (!graphApp || !/^#\s+Microsoft Graph permissions reference/m.test(graphMd)) {
  console.error("The Graph permissions reference no longer shows Microsoft Graph's appId.");
  process.exit(1);
}
addApp(graphApp[1], 'Microsoft Graph', 'graph-permissions');

const applications = [...apps.values()].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

/* AADSTS error codes. */

console.log(`Fetching ${ERRORS_MD}`);
const errorsMd = await fetchText(ERRORS_MD);
const errors = [];
for (const table of parseTables(errorsMd)) {
  if (cleanCell(table.header[0]) !== 'Error') continue;
  for (const row of table.rows) {
    const code = /^AADSTS(\d+)$/.exec(cleanCell(row[0]));
    if (!code) continue;
    const text = cleanCell(row[1]);
    const named = /^([A-Za-z][A-Za-z0-9_]+)\s+-\s+([\s\S]+)$/.exec(text);
    errors.push({
      code: `AADSTS${code[1]}`,
      name: named ? named[1] : null,
      description: named ? named[2] : text,
    });
  }
}
errors.sort((a, b) => Number(a.code.slice(6)) - Number(b.code.slice(6)));

if (errors.length < 200) {
  console.error(`Only ${errors.length} AADSTS codes parsed; the reference has been restructured.`);
  process.exit(1);
}

const lookup = {
  licence: 'CC-BY-4.0, (c) Microsoft. See each source.',
  generatedAt: data.generatedAt,
  coverage:
    'Applications are the first-party ids Microsoft tabulates in its documentation, not every Microsoft application. Permissions are Microsoft Graph only.',
  sources: {
    roles: { title: 'Microsoft Entra built-in roles', url: HUMAN },
    permissions: { title: 'Microsoft Graph permissions reference', url: GRAPH_HUMAN },
    errors: { title: 'Microsoft Entra authentication and authorization error codes', url: ERRORS_HUMAN },
    'graph-permissions': { title: 'Microsoft Graph permissions reference', url: GRAPH_HUMAN },
    ...Object.fromEntries(APP_SOURCES.map((source) => [source.key, { title: source.title, url: source.human }])),
  },
  applications,
  permissions,
  roles: lookupRoles,
  errors,
};

writeFileSync(LOOKUP_OUT, stringifyRows(lookup, ['applications', 'permissions', 'roles', 'errors']));

/*
 * The index's paste panel only needs to know whether a GUID is one of these
 * and which kind, so it gets the ids alone: 32 hex digits each, concatenated.
 */
const pack = (ids) => [...new Set(ids)].sort().map((id) => id.replace(/-/g, '')).join('');
const index = {
  generatedAt: data.generatedAt,
  application: pack(applications.map((app) => app.id)),
  permission: pack(
    permissions.flatMap((permission) =>
      [permission.application?.id, permission.delegated?.id, permission.resourceSpecific?.id].filter(Boolean)
    )
  ),
  role: pack(lookupRoles.map((role) => role.id)),
};
writeFileSync(INDEX_OUT, `${JSON.stringify(index)}\n`);

const uncorroborated = Object.keys(APPLICATIONS).filter((id) => WHOLE_GUID.test(id) && !apps.has(id.toLowerCase()));

console.log(
  `Wrote ${applications.length} applications, ${permissions.length} Graph permissions, ` +
    `${lookupRoles.length} directory roles and ${errors.length} AADSTS codes to src/data/microsoft/entra-ids.json`
);
console.log(
  `${uncorroborated.length} of the inline application ids are in none of the fetched pages:\n  ${uncorroborated.join('\n  ')}`
);

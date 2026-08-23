#!/usr/bin/env node

/**
 * The well-known Entra GUIDs a Conditional Access policy is written in.
 *
 * An exported CA policy names its targets by id and nothing else:
 * `includeRoles: ["62e90394-69f5-4237-9190-012177145e10"]` is the whole of
 * what the export says about "Global Administrator". Without a map, reading a
 * policy means pasting GUIDs into a search engine one at a time.
 *
 * Two sources, both from Microsoft's docs:
 *  - directory role template ids, from the Entra permissions reference
 *  - first-party application ids, from the CA-relevant application list
 *
 * The application ids are small, stable and central enough to keep inline
 * rather than scrape from prose that is not machine-readable — they are the
 * handful that actually turn up in policies.
 *
 *   pnpm refresh:entra-ids
 *
 * Source: MicrosoftDocs/entra-docs (CC-BY-4.0). Sorted before writing.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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

#!/usr/bin/env node

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../src/data/microsoft/azure-monitor-tables.json');
const BASE = 'https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/';

const TABLES = [
  'AADManagedIdentitySignInLogs',
  'AADNonInteractiveUserSignInLogs',
  'AADRiskyUsers',
  'AADServicePrincipalSignInLogs',
  'AADUserRiskEvents',
  'AddonAzureBackupJobs',
  'AGWAccessLogs',
  'AGWFirewallLogs',
  'AKSAudit',
  'AKSControlPlane',
  'ApiManagementGatewayLogs',
  'AppDependencies',
  'AppExceptions',
  'AppRequests',
  'AppServiceAppLogs',
  'AppServiceConsoleLogs',
  'AppServiceHTTPLogs',
  'AppTraces',
  'AuditLogs',
  'AZFWApplicationRule',
  'AZFWDnsQuery',
  'AZFWIdpsSignature',
  'AZFWNatRule',
  'AZFWNetworkRule',
  'AZFWThreatIntel',
  'AZKVAuditLogs',
  'AzureActivity',
  'AzureDiagnostics',
  'CDBDataPlaneRequests',
  'CommonSecurityLog',
  'ContainerAppConsoleLogs',
  'ContainerAppSystemLogs',
  'ContainerLogV2',
  'ContainerRegistryLoginEvents',
  'DeviceLogonEvents',
  'DeviceNetworkEvents',
  'DeviceProcessEvents',
  'DNSQueryLogs',
  'EmailEvents',
  'Event',
  'FunctionAppLogs',
  'Heartbeat',
  'IdentityLogonEvents',
  'IntuneAuditLogs',
  'IntuneDevices',
  'IntuneOperationalLogs',
  'KubeEvents',
  'KubeNodeInventory',
  'KubePodInventory',
  'LAQueryLogs',
  'MicrosoftAzureBastionAuditLogs',
  'MicrosoftGraphActivityLogs',
  'NTANetAnalytics',
  'OfficeActivity',
  'Perf',
  'SecurityAlert',
  'SecurityEvent',
  'SecurityIncident',
  'SigninLogs',
  'SQLSecurityAuditEvents',
  'StorageBlobLogs',
  'StorageFileLogs',
  'StorageQueueLogs',
  'StorageTableLogs',
  'Syslog',
  'Update',
  'Usage',
  'WVDConnections',
  'WVDErrors',
];

const STANDARD = { TimeGenerated: 'datetime' };

const SKIP = new Set(['_BilledSize', '_IsBillable', 'Type', 'TenantId', 'SourceSystem']);

const TYPES = {
  string: 'string',
  guid: 'string',
  int: 'int',
  long: 'long',
  bigint: 'long',
  real: 'real',
  double: 'real',
  decimal: 'real',
  bool: 'bool',
  boolean: 'bool',
  datetime: 'datetime',
  dynamic: 'dynamic',
  '': 'dynamic',
};

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };

function cellText(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity])
    .trim();
}

export function parseColumns(html) {
  const heading = html.search(/<h2 id="(columns|[a-z-]*table-columns)"/);
  if (heading < 0) return null;
  const table = html.slice(heading).match(/<table[^>]*>([\s\S]*?)<\/table>/);
  if (!table) return null;

  const columns = {};
  for (const row of table[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) => cellText(cell[1]));
    if (cells.length < 2) continue;
    const [name, type] = cells;
    if (SKIP.has(name) || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) continue;
    const mapped = TYPES[type.toLowerCase()];
    if (!mapped) throw new Error(`Unknown column type "${type}" on ${name}`);
    columns[name] = mapped;
  }
  return columns;
}

async function fetchTable(name) {
  const response = await fetch(BASE + name.toLowerCase(), { headers: { accept: 'text/html' } });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const parsed = parseColumns(await response.text());
  if (!parsed || Object.keys(parsed).length < 5) throw new Error(`${name}: no column table found`);
  const columns = { ...STANDARD, ...parsed };
  return Object.fromEntries(Object.entries(columns).sort(([a], [b]) => a.localeCompare(b)));
}

async function main() {
  const tables = {};
  for (const name of TABLES) {
    tables[name] = await fetchTable(name);
    console.log(`${name}: ${Object.keys(tables[name]).length} columns`);
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(
    OUT,
    JSON.stringify(
      {
        source: BASE,
        licence: 'CC-BY-4.0 (MicrosoftDocs/azure-monitor-docs)',
        fetched: new Date().toISOString().slice(0, 10),
        tables,
      },
      null,
      2
    ) + '\n'
  );
  console.log(`Wrote ${TABLES.length} tables to ${OUT}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

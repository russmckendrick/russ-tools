import { count, overTime, rows, top, where } from './shapes.js';

const sqlColumns = ['TimeGenerated', 'ServerPrincipalName', 'DatabaseName', 'ActionName', 'Succeeded', 'ClientIp', 'Statement'];
const cosmosColumns = ['TimeGenerated', 'OperationName', 'StatusCode', 'DatabaseName', 'CollectionName', 'RequestCharge', 'DurationMs', 'ClientIpAddress'];
const jobColumns = ['TimeGenerated', 'BackupItemFriendlyName', 'JobOperation', 'JobStatus', 'JobFailureCode', 'JobDurationInSecs', 'VaultName'];
const gigabytes = ['GB', 'sum(Quantity) / 1000'];

export const DATA = [
  {
    id: 'azure-sql',
    name: 'Azure SQL',
    group: 'Data',
    scenarios: [
      { id: 'audit', name: 'Audit log', table: 'SQLSecurityAuditEvents', reads: 'SQL audit events', description: 'Statements and logins captured by SQL auditing.', output: rows(sqlColumns) },
      { id: 'failed', name: 'Failed actions', table: 'SQLSecurityAuditEvents', reads: 'SQL audit events', description: 'Logins and statements that did not succeed.', filters: [where('Succeeded', 'false', '')], output: rows(sqlColumns) },
      { id: 'by-principal', name: 'Activity by principal', table: 'SQLSecurityAuditEvents', reads: 'SQL audit events counted by principal, address and database', description: 'Who is using which database, and from where.', output: top([count('Events')], ['ServerPrincipalName', 'ClientIp', 'DatabaseName']) },
      { id: 'by-action', name: 'Actions by count', table: 'SQLSecurityAuditEvents', reads: 'SQL audit events counted by action and outcome', description: 'The mix of audited actions.', output: top([count('Events')], ['ActionName', 'Succeeded']) },
    ],
  },
  {
    id: 'cosmos-db',
    name: 'Cosmos DB',
    group: 'Data',
    scenarios: [
      { id: 'requests', name: 'Data plane requests', table: 'CDBDataPlaneRequests', reads: 'Cosmos DB data plane requests', description: 'Every request against the account.', output: rows(cosmosColumns) },
      { id: 'throttled', name: 'Throttled requests (429)', table: 'CDBDataPlaneRequests', reads: 'Cosmos DB requests counted by database, collection and operation', description: 'Where request units are running out.', filters: [where('StatusCode', 'eq', '429')], output: top([count('Requests')], ['DatabaseName', 'CollectionName', 'OperationName']) },
      { id: 'expensive', name: 'Most expensive requests', table: 'CDBDataPlaneRequests', reads: 'Cosmos DB data plane requests', description: 'Requests ordered by request charge.', output: rows(cosmosColumns, 'RequestCharge') },
      { id: 'charge-by-collection', name: 'Request units by collection', table: 'CDBDataPlaneRequests', reads: 'Request units consumed by database, collection and operation', description: 'What is spending the throughput.', output: top([['RequestUnits', 'sum(RequestCharge)'], count('Requests')], ['DatabaseName', 'CollectionName', 'OperationName']) },
    ],
  },
  {
    id: 'backup',
    name: 'Azure Backup',
    group: 'Data',
    scenarios: [
      { id: 'jobs', name: 'Jobs', table: 'AddonAzureBackupJobs', reads: 'Backup and restore jobs', description: 'Every backup and restore job.', output: rows(jobColumns) },
      { id: 'failed', name: 'Failed jobs', table: 'AddonAzureBackupJobs', reads: 'Backup and restore jobs', description: 'Jobs that ended in failure.', filters: [where('JobStatus', 'eq', 'Failed')], output: rows(jobColumns) },
      { id: 'by-status', name: 'Jobs by status', table: 'AddonAzureBackupJobs', reads: 'Backup jobs counted by operation, status and workload', description: 'How backups are doing overall.', output: top([count('Jobs')], ['JobOperation', 'JobStatus', 'BackupManagementType']) },
    ],
  },
  {
    id: 'log-analytics-workspace',
    name: 'Log Analytics workspace',
    group: 'Platform',
    scenarios: [
      { id: 'ingestion-by-table', name: 'Ingestion by table', table: 'Usage', reads: 'Ingested volume in GB by table', description: 'Which tables are filling the workspace.', span: '30d', output: top([gigabytes], ['DataType', 'IsBillable'], 'GB') },
      { id: 'ingestion-over-time', name: 'Ingestion over time', table: 'Usage', reads: 'Ingested volume in GB per table over time', description: 'Volume per table as a time chart.', span: '30d', output: overTime([gigabytes], ['DataType']) },
      { id: 'queries', name: 'Query audit', table: 'LAQueryLogs', reads: 'Log queries run against the workspace', description: 'Who ran what, when query auditing is on.', output: rows(['TimeGenerated', 'AADEmail', 'RequestClientApp', 'ResponseCode', 'ResponseDurationMs', 'QueryText']) },
      { id: 'slow-queries', name: 'Slowest queries', table: 'LAQueryLogs', reads: 'Log queries run against the workspace', description: 'Queries ordered by how long they took.', output: rows(['TimeGenerated', 'AADEmail', 'ResponseDurationMs', 'StatsCPUTimeMs', 'ResponseRowCount', 'QueryText'], 'ResponseDurationMs') },
      { id: 'queries-by-user', name: 'Queries by user', table: 'LAQueryLogs', reads: 'Log queries counted by user and client', description: 'Who queries the workspace most.', output: top([count('Queries')], ['AADEmail', 'RequestClientApp']) },
    ],
  },
];

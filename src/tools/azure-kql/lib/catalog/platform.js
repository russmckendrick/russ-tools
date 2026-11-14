import { count, rows, top, where } from './shapes.js';

const activityColumns = ['TimeGenerated', 'OperationNameValue', 'ActivityStatusValue', 'Caller', 'CallerIpAddress', 'ResourceGroup', '_ResourceId'];
const vaultColumns = ['TimeGenerated', 'OperationName', 'ResultSignature', 'HttpStatusCode', 'CallerIpAddress', 'RequestUri', 'DurationMs', '_ResourceId'];
const blobColumns = ['TimeGenerated', 'OperationName', 'StatusText', 'StatusCode', 'AuthenticationType', 'CallerIpAddress', 'Uri', 'DurationMs'];

export const PLATFORM = [
  {
    id: 'activity-log',
    name: 'Activity log',
    group: 'Platform',
    scenarios: [
      { id: 'operations', name: 'Operations', table: 'AzureActivity', reads: 'Activity log entries', description: 'Control-plane operations on the subscription.', output: rows(activityColumns) },
      {
        id: 'failed',
        name: 'Failed operations',
        table: 'AzureActivity',
        reads: 'Activity log entries',
        description: 'Deployments and changes that did not complete.',
        filters: [where('ActivityStatusValue', 'in', 'Failure, Failed')],
        output: rows(activityColumns),
      },
      {
        id: 'deletes',
        name: 'Delete operations',
        table: 'AzureActivity',
        reads: 'Activity log entries',
        description: 'Who deleted what, and when.',
        filters: [where('OperationNameValue', 'endswith', '/delete')],
        output: rows(activityColumns),
      },
      {
        id: 'role-assignments',
        name: 'Role assignment changes',
        table: 'AzureActivity',
        reads: 'Activity log entries',
        description: 'Azure RBAC role assignments created or updated.',
        filters: [where('OperationNameValue', 'eqi', 'Microsoft.Authorization/roleAssignments/write')],
        output: rows(activityColumns),
      },
      {
        id: 'by-caller',
        name: 'Activity by caller',
        table: 'AzureActivity',
        reads: 'Activity log entries counted by caller and address',
        description: 'Which identities are making the most changes.',
        output: top([count('Operations')], ['Caller', 'CallerIpAddress']),
      },
      {
        id: 'by-operation',
        name: 'Operations by count',
        table: 'AzureActivity',
        reads: 'Activity log entries counted by operation and status',
        description: 'The operations run most often.',
        output: top([count('Operations')], ['OperationNameValue', 'ActivityStatusValue']),
      },
    ],
  },
  {
    id: 'key-vault',
    name: 'Key Vault',
    group: 'Platform',
    scenarios: [
      { id: 'operations', name: 'Audit log', table: 'AZKVAuditLogs', reads: 'Key Vault audit events', description: 'Every request made to the vault.', output: rows(vaultColumns) },
      { id: 'failed', name: 'Failed requests', table: 'AZKVAuditLogs', reads: 'Key Vault audit events', description: 'Requests answered with a 400 or 500-range status.', filters: [where('HttpStatusCode', 'gte', '400')], output: rows(vaultColumns) },
      { id: 'denied', name: 'Access denied', table: 'AZKVAuditLogs', reads: 'Key Vault audit events', description: 'Callers without permission or blocked by the vault firewall.', filters: [where('HttpStatusCode', 'in', '401, 403')], output: rows(vaultColumns) },
      { id: 'secret-reads', name: 'Secret reads', table: 'AZKVAuditLogs', reads: 'Key Vault audit events', description: 'Each time a secret value was fetched.', filters: [where('OperationName', 'eq', 'SecretGet')], output: rows(vaultColumns) },
      {
        id: 'by-caller',
        name: 'Requests by caller',
        table: 'AZKVAuditLogs',
        reads: 'Key Vault requests counted by caller address and operation',
        description: 'Which addresses use the vault, and for what.',
        output: top([count('Requests')], ['CallerIpAddress', 'OperationName']),
      },
    ],
  },
  {
    id: 'storage',
    name: 'Storage (blobs)',
    group: 'Platform',
    scenarios: [
      { id: 'requests', name: 'Request log', table: 'StorageBlobLogs', reads: 'Blob storage requests', description: 'Every request to the blob service.', output: rows(blobColumns) },
      { id: 'failed', name: 'Failed requests', table: 'StorageBlobLogs', reads: 'Blob storage requests', description: 'Requests whose status is anything but Success.', filters: [where('StatusText', 'ncontains', 'Success')], output: rows(blobColumns) },
      { id: 'anonymous', name: 'Anonymous access', table: 'StorageBlobLogs', reads: 'Blob storage requests', description: 'Requests served to unauthenticated callers.', filters: [where('AuthenticationType', 'eq', 'Anonymous')], output: rows(blobColumns) },
      { id: 'deletes', name: 'Blob deletes', table: 'StorageBlobLogs', reads: 'Blob storage requests', description: 'Who deleted which blob.', filters: [where('OperationName', 'eq', 'DeleteBlob')], output: rows([...blobColumns, 'RequesterUpn']) },
      {
        id: 'by-operation',
        name: 'Operations by count',
        table: 'StorageBlobLogs',
        reads: 'Blob storage requests and average duration, by operation and status',
        description: 'What the account is being used for.',
        output: top([count('Requests'), ['AverageMs', 'avg(DurationMs)']], ['OperationName', 'StatusText']),
      },
      {
        id: 'by-caller',
        name: 'Requests by caller',
        table: 'StorageBlobLogs',
        reads: 'Blob storage requests counted by caller address and authentication type',
        description: 'Which addresses use the account. The address includes the port.',
        output: top([count('Requests')], ['CallerIpAddress', 'AuthenticationType']),
      },
    ],
  },
];

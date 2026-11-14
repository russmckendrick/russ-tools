import { ip, oneOf, suggest } from './types.js';

export const PLATFORM_NOTES = {
  AzureActivity: {
    common: ['OperationNameValue', 'ActivityStatusValue', 'Caller', 'CallerIpAddress', 'ResourceGroup', 'ResourceProviderValue', 'Level', 'CategoryValue', 'SubscriptionId'],
    columns: {
      CallerIpAddress: ip,
      Level: oneOf('Critical', 'Error', 'Warning', 'Informational', 'Verbose'),
      ActivityStatusValue: suggest('Success', 'Failure', 'Start', 'Succeeded', 'Failed', 'Started'),
      CategoryValue: suggest('Administrative', 'Policy', 'Security'),
    },
  },
  AZKVAuditLogs: {
    common: ['OperationName', 'HttpStatusCode', 'CallerIpAddress', 'ResultType', 'ResultSignature', 'RequestUri'],
    columns: {
      CallerIpAddress: ip,
      OperationName: suggest('SecretGet', 'SecretList', 'SecretSet', 'SecretDelete', 'KeySign', 'KeyList'),
    },
  },
  StorageBlobLogs: {
    common: ['OperationName', 'StatusText', 'StatusCode', 'AuthenticationType', 'CallerIpAddress', 'AccountName', 'Uri', 'UserAgentHeader', 'RequesterUpn'],
    columns: {
      AuthenticationType: suggest('Anonymous', 'OAuth', 'AccountKey', 'SAS'),
      StatusText: suggest('Success'),
      OperationName: suggest('GetBlob', 'PutBlob', 'DeleteBlob', 'ListBlobs'),
    },
  },
  StorageFileLogs: {
    common: ['OperationName', 'StatusText', 'StatusCode', 'AuthenticationType', 'CallerIpAddress', 'Uri'],
    columns: { StatusText: suggest('Success') },
  },
  StorageQueueLogs: {
    common: ['OperationName', 'StatusText', 'StatusCode', 'AuthenticationType', 'CallerIpAddress', 'Uri'],
    columns: { StatusText: suggest('Success') },
  },
  StorageTableLogs: {
    common: ['OperationName', 'StatusText', 'StatusCode', 'AuthenticationType', 'CallerIpAddress', 'Uri'],
    columns: { StatusText: suggest('Success') },
  },
  SQLSecurityAuditEvents: {
    common: ['ServerPrincipalName', 'DatabaseName', 'ActionName', 'Succeeded', 'ClientIp', 'Statement', 'ApplicationName', 'LogicalServerName'],
    columns: { ClientIp: ip },
  },
  CDBDataPlaneRequests: {
    common: ['OperationName', 'StatusCode', 'DatabaseName', 'CollectionName', 'RequestCharge', 'DurationMs', 'ClientIpAddress'],
    columns: { ClientIpAddress: ip },
  },
  AddonAzureBackupJobs: {
    common: ['JobOperation', 'JobStatus', 'BackupItemFriendlyName', 'BackupManagementType', 'JobFailureCode', 'VaultName'],
    columns: { JobStatus: suggest('Completed', 'Failed', 'CompletedWithWarnings', 'InProgress'), JobOperation: suggest('Backup', 'Restore') },
  },
  Usage: {
    common: ['DataType', 'Solution', 'IsBillable', 'Quantity'],
    columns: {},
  },
  LAQueryLogs: {
    common: ['AADEmail', 'RequestClientApp', 'ResponseCode', 'ResponseDurationMs', 'QueryText'],
    columns: {},
  },
};

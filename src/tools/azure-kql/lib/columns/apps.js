import { ip, suggest } from './types.js';

export const APPS_NOTES = {
  AppRequests: {
    common: ['Name', 'Url', 'ResultCode', 'Success', 'DurationMs', 'AppRoleName', 'OperationName'],
    columns: {},
  },
  AppExceptions: {
    common: ['ExceptionType', 'OuterMessage', 'ProblemId', 'AppRoleName', 'SeverityLevel', 'OperationName'],
    columns: {},
  },
  AppDependencies: {
    common: ['Target', 'DependencyType', 'Name', 'ResultCode', 'Success', 'DurationMs', 'AppRoleName'],
    columns: { DependencyType: suggest('SQL', 'HTTP', 'Azure blob', 'Azure Service Bus') },
  },
  AppTraces: {
    common: ['Message', 'SeverityLevel', 'AppRoleName', 'OperationName'],
    columns: {},
  },
  ApiManagementGatewayLogs: {
    common: ['ApiId', 'OperationId', 'Method', 'Url', 'ResponseCode', 'TotalTime', 'CallerIpAddress', 'IsRequestSuccess', 'LastErrorReason'],
    columns: { CallerIpAddress: ip, Method: suggest('GET', 'POST', 'PUT', 'DELETE') },
  },
  OfficeActivity: {
    common: ['OfficeWorkload', 'Operation', 'UserId', 'ClientIP', 'ResultStatus', 'OfficeObjectId', 'RecordType'],
    columns: { OfficeWorkload: suggest('Exchange', 'SharePoint', 'OneDrive', 'MicrosoftTeams', 'AzureActiveDirectory') },
  },
  IntuneAuditLogs: {
    common: ['OperationName', 'Identity', 'ResultType', 'Category'],
    columns: {},
  },
  IntuneOperationalLogs: {
    common: ['OperationName', 'Result', 'Category'],
    columns: {},
  },
  IntuneDevices: {
    common: ['DeviceName', 'UPN', 'OS', 'OSVersion', 'CompliantState', 'Ownership', 'ManagedBy', 'Model'],
    columns: { CompliantState: suggest('Compliant', 'Noncompliant'), Ownership: suggest('Corporate', 'Personal') },
  },
};

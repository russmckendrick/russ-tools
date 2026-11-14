import { ip, oneOf, port, suggest } from './types.js';

const signIn = {
  IPAddress: ip,
  ConditionalAccessStatus: oneOf('success', 'failure', 'notApplied'),
  RiskLevelDuringSignIn: oneOf('none', 'low', 'medium', 'high', 'hidden'),
  RiskLevelAggregated: oneOf('none', 'low', 'medium', 'high', 'hidden'),
  RiskState: oneOf('none', 'confirmedSafe', 'remediated', 'dismissed', 'atRisk', 'confirmedCompromised'),
  UserType: oneOf('member', 'guest'),
  ResultType: suggest('0'),
  ClientAppUsed: suggest('Browser', 'Exchange ActiveSync', 'IMAP', 'MAPI', 'SMTP', 'POP'),
};

export const IDENTITY_NOTES = {
  SigninLogs: {
    common: ['UserPrincipalName', 'AppDisplayName', 'IPAddress', 'Location', 'ResultType', 'ConditionalAccessStatus', 'ClientAppUsed', 'RiskLevelDuringSignIn', 'IsInteractive', 'UserType'],
    columns: signIn,
  },
  AADNonInteractiveUserSignInLogs: {
    common: ['UserPrincipalName', 'AppDisplayName', 'ResourceDisplayName', 'IPAddress', 'Location', 'ResultType', 'ConditionalAccessStatus'],
    columns: signIn,
  },
  AADServicePrincipalSignInLogs: {
    common: ['ServicePrincipalName', 'AppId', 'ResourceDisplayName', 'IPAddress', 'Location', 'ResultType'],
    columns: { IPAddress: ip, ResultType: suggest('0') },
  },
  AuditLogs: {
    common: ['OperationName', 'Result', 'Category', 'LoggedByService', 'AADOperationType', 'ResultReason'],
    columns: {
      Result: oneOf('success', 'failure', 'timeout', 'unknownFutureValue'),
      AADOperationType: oneOf('Add', 'Update', 'Delete', 'Other'),
    },
  },
  AADManagedIdentitySignInLogs: {
    common: ['ServicePrincipalName', 'ResourceDisplayName', 'IPAddress', 'ResultType', 'AppId'],
    columns: { IPAddress: ip, ResultType: suggest('0') },
  },
  AADRiskyUsers: {
    common: ['UserPrincipalName', 'RiskLevel', 'RiskState', 'RiskDetail'],
    columns: { RiskLevel: suggest('low', 'medium', 'high'), RiskState: suggest('atRisk', 'confirmedCompromised', 'remediated', 'dismissed') },
  },
  AADUserRiskEvents: {
    common: ['UserPrincipalName', 'RiskEventType', 'RiskLevel', 'RiskState', 'IpAddress', 'Source'],
    columns: {
      IpAddress: ip,
      RiskLevel: oneOf('low', 'medium', 'high', 'hidden', 'none'),
      RiskState: oneOf('none', 'confirmedSafe', 'remediated', 'dismissed', 'atRisk', 'confirmedCompromised'),
    },
  },
  MicrosoftGraphActivityLogs: {
    common: ['RequestUri', 'RequestMethod', 'ResponseStatusCode', 'AppId', 'UserId', 'ServicePrincipalId', 'IPAddress'],
    columns: { IPAddress: ip, RequestMethod: suggest('GET', 'POST', 'PATCH', 'PUT', 'DELETE') },
  },
};

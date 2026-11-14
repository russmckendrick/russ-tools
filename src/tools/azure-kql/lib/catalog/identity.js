import { count, rows, top, where } from './shapes.js';

const signInColumns = ['TimeGenerated', 'UserPrincipalName', 'AppDisplayName', 'IPAddress', 'Location', 'ResultType', 'ResultDescription', 'ConditionalAccessStatus'];
const failed = where('ResultType', 'neq', '0');

const initiator = [
  'InitiatedByUser = tostring(InitiatedBy.user.userPrincipalName)',
  'InitiatedByApp = tostring(InitiatedBy.app.displayName)',
];
const auditExtend = [...initiator, 'Target = tostring(TargetResources[0].displayName)'];
const auditColumns = ['TimeGenerated', 'OperationName', 'Result', 'InitiatedByUser', 'InitiatedByApp', 'Target', 'LoggedByService'];

export const IDENTITY = [
  {
    id: 'entra-sign-ins',
    name: 'Entra ID sign-ins',
    group: 'Identity',
    scenarios: [
      { id: 'sign-ins', name: 'Sign-in log', table: 'SigninLogs', reads: 'Interactive sign-ins', description: 'Interactive user sign-ins.', output: rows(signInColumns) },
      { id: 'failed', name: 'Failed sign-ins', table: 'SigninLogs', reads: 'Interactive sign-ins', description: 'Sign-ins with any result code other than 0.', filters: [failed], output: rows(signInColumns) },
      {
        id: 'failures-by-user',
        name: 'Failures by user',
        table: 'SigninLogs',
        reads: 'Sign-ins counted by user and result',
        description: 'Who is failing to sign in, and why.',
        filters: [failed],
        output: top([count('Failures'), ['Addresses', 'dcount(IPAddress)']], ['UserPrincipalName', 'ResultType', 'ResultDescription']),
      },
      {
        id: 'conditional-access',
        name: 'Blocked by Conditional Access',
        table: 'SigninLogs',
        reads: 'Interactive sign-ins',
        description: 'Sign-ins where a Conditional Access policy was not satisfied.',
        filters: [where('ConditionalAccessStatus', 'eq', 'failure')],
        output: rows(signInColumns),
      },
      {
        id: 'risky',
        name: 'Risky sign-ins',
        table: 'SigninLogs',
        reads: 'Interactive sign-ins',
        description: 'Sign-ins Identity Protection scored medium or high.',
        filters: [where('RiskLevelDuringSignIn', 'in', 'medium, high')],
        output: rows([...signInColumns.slice(0, 6), 'RiskLevelDuringSignIn', 'RiskState']),
      },
      {
        id: 'by-location',
        name: 'Sign-ins by country',
        table: 'SigninLogs',
        reads: 'Sign-ins and distinct users counted by country code',
        description: 'Where sign-ins are coming from.',
        output: top([count('SignIns'), ['Users', 'dcount(UserPrincipalName)']], ['Location']),
      },
      {
        id: 'non-interactive',
        name: 'Non-interactive sign-ins',
        table: 'AADNonInteractiveUserSignInLogs',
        reads: 'Non-interactive user sign-ins',
        description: 'Token refreshes and other sign-ins made on a user\'s behalf.',
        output: rows(['TimeGenerated', 'UserPrincipalName', 'AppDisplayName', 'ResourceDisplayName', 'IPAddress', 'ResultType', 'ResultDescription']),
      },
      {
        id: 'managed-identities',
        name: 'Managed identity sign-ins',
        table: 'AADManagedIdentitySignInLogs',
        reads: 'Managed identity sign-ins',
        description: 'Token requests made by managed identities.',
        output: rows(['TimeGenerated', 'ServicePrincipalName', 'ResourceDisplayName', 'IPAddress', 'ResultType', 'ResultDescription']),
      },
      {
        id: 'service-principals',
        name: 'Service principal sign-ins',
        table: 'AADServicePrincipalSignInLogs',
        reads: 'Service principal sign-ins',
        description: 'Sign-ins by applications and service principals.',
        output: rows(['TimeGenerated', 'ServicePrincipalName', 'AppId', 'ResourceDisplayName', 'IPAddress', 'ResultType', 'ResultDescription']),
      },
    ],
  },
  {
    id: 'entra-audit',
    name: 'Entra ID audit log',
    group: 'Identity',
    scenarios: [
      { id: 'changes', name: 'Audit log', table: 'AuditLogs', reads: 'Directory audit events', description: 'Changes to users, groups, applications and policies.', extend: auditExtend, output: rows(auditColumns) },
      { id: 'failed', name: 'Failed operations', table: 'AuditLogs', reads: 'Directory audit events', description: 'Directory changes that did not succeed.', filters: [where('Result', 'eq', 'failure')], extend: auditExtend, output: rows([...auditColumns, 'ResultReason']) },
      { id: 'role-changes', name: 'Role changes', table: 'AuditLogs', reads: 'Directory audit events', description: 'Role assignments, removals and role setting changes.', filters: [where('OperationName', 'contains', 'role')], extend: auditExtend, output: rows(auditColumns) },
      {
        id: 'by-operation',
        name: 'Operations by count',
        table: 'AuditLogs',
        reads: 'Directory audit events counted by operation and result',
        description: 'What is changing most in the directory.',
        output: top([count('Events')], ['OperationName', 'Result']),
      },
      {
        id: 'by-initiator',
        name: 'Activity by initiator',
        table: 'AuditLogs',
        reads: 'Directory audit events counted by the user or application that made them',
        description: 'Who is making changes.',
        extend: initiator,
        output: top([count('Events')], ['InitiatedByUser', 'InitiatedByApp']),
      },
    ],
  },
  {
    id: 'entra-id-protection',
    name: 'Entra ID Protection',
    group: 'Identity',
    scenarios: [
      { id: 'risk-detections', name: 'Risk detections', table: 'AADUserRiskEvents', reads: 'User risk detections', description: 'Each risk detection raised against a user.', output: rows(['TimeGenerated', 'UserPrincipalName', 'RiskEventType', 'RiskLevel', 'RiskState', 'IpAddress', 'Source']) },
      { id: 'high-risk', name: 'High-risk detections', table: 'AADUserRiskEvents', reads: 'User risk detections', description: 'Detections scored high.', filters: [where('RiskLevel', 'eq', 'high')], output: rows(['TimeGenerated', 'UserPrincipalName', 'RiskEventType', 'RiskState', 'RiskDetail', 'IpAddress']) },
      { id: 'by-type', name: 'Detections by type', table: 'AADUserRiskEvents', reads: 'User risk detections counted by type and level', description: 'Which kinds of risk are being detected.', output: top([count('Detections'), ['Users', 'dcount(UserPrincipalName)']], ['RiskEventType', 'RiskLevel']) },
      { id: 'risky-users', name: 'Risky users', table: 'AADRiskyUsers', reads: 'Risky user records', description: 'Users whose risk state changed.', output: rows(['TimeGenerated', 'UserPrincipalName', 'RiskLevel', 'RiskState', 'RiskDetail', 'RiskLastUpdatedDateTime']) },
    ],
  },
  {
    id: 'graph-activity',
    name: 'Microsoft Graph activity',
    group: 'Identity',
    scenarios: [
      { id: 'requests', name: 'Requests', table: 'MicrosoftGraphActivityLogs', reads: 'Microsoft Graph requests', description: 'Every Graph API call made in the tenant.', output: rows(['TimeGenerated', 'RequestMethod', 'RequestUri', 'ResponseStatusCode', 'AppId', 'UserId', 'IPAddress', 'DurationMs']) },
      { id: 'errors', name: 'Failed requests', table: 'MicrosoftGraphActivityLogs', reads: 'Microsoft Graph requests', description: 'Calls answered with a 400 or 500-range status.', filters: [where('ResponseStatusCode', 'gte', '400')], output: rows(['TimeGenerated', 'RequestMethod', 'RequestUri', 'ResponseStatusCode', 'AppId', 'UserId', 'IPAddress']) },
      { id: 'throttled', name: 'Throttled apps', table: 'MicrosoftGraphActivityLogs', reads: 'Microsoft Graph requests counted by application', description: 'Applications receiving 429 Too Many Requests.', filters: [where('ResponseStatusCode', 'eq', '429')], output: top([count('Requests')], ['AppId']) },
      { id: 'by-app', name: 'Requests by application', table: 'MicrosoftGraphActivityLogs', reads: 'Microsoft Graph requests counted by application and status', description: 'Which applications call Graph most.', output: top([count('Requests')], ['AppId', 'ResponseStatusCode']) },
    ],
  },
];

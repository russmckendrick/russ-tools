import { count, overTime, rows, top, where } from './shapes.js';

const requestColumns = ['TimeGenerated', 'Name', 'Url', 'ResultCode', 'Success', 'DurationMs', 'AppRoleName'];
const failed = where('Success', 'false', '');
const gatewayColumns = ['TimeGenerated', 'Method', 'Url', 'ResponseCode', 'TotalTime', 'BackendTime', 'ApiId', 'OperationId', 'CallerIpAddress'];
const functionColumns = ['TimeGenerated', 'FunctionName', 'Level', 'Message', 'ExceptionType', 'AppName'];
const consoleColumns = ['TimeGenerated', 'ContainerAppName', 'RevisionName', 'ContainerName', 'Stream', 'Log'];

export const APPS = [
  {
    id: 'application-insights',
    name: 'Application Insights',
    group: 'Applications',
    scenarios: [
      { id: 'requests', name: 'Requests', table: 'AppRequests', reads: 'Application requests', description: 'Requests handled by the application.', output: rows(requestColumns) },
      { id: 'failed-requests', name: 'Failed requests', table: 'AppRequests', reads: 'Application requests', description: 'Requests the application marked as failed.', filters: [failed], output: rows(requestColumns) },
      { id: 'slow-requests', name: 'Slowest requests', table: 'AppRequests', reads: 'Application requests', description: 'Requests ordered by duration, in milliseconds.', output: rows(requestColumns, 'DurationMs') },
      { id: 'requests-by-operation', name: 'Requests by operation', table: 'AppRequests', reads: 'Request count and duration by operation and result', description: 'Volume and latency per operation.', output: top([count('Requests'), ['AverageMs', 'avg(DurationMs)'], ['P95Ms', 'percentile(DurationMs, 95)']], ['Name', 'ResultCode']) },
      { id: 'requests-over-time', name: 'Requests over time', table: 'AppRequests', reads: 'Requests per result code over time', description: 'Result codes as a time chart.', output: overTime([count('Requests')], ['ResultCode']) },
      { id: 'exceptions', name: 'Exceptions', table: 'AppExceptions', reads: 'Application exceptions', description: 'Exceptions the application reported.', output: rows(['TimeGenerated', 'ExceptionType', 'OuterMessage', 'ProblemId', 'AppRoleName', 'OperationName']) },
      { id: 'top-exceptions', name: 'Top exceptions', table: 'AppExceptions', reads: 'Application exceptions counted by type and problem', description: 'The exceptions happening most.', output: top([count('Exceptions')], ['ExceptionType', 'ProblemId']) },
      { id: 'failed-dependencies', name: 'Failed dependencies', table: 'AppDependencies', reads: 'Dependency calls counted by target, type and result', description: 'Databases and services the application could not reach.', filters: [failed], output: top([count('Failures')], ['Target', 'DependencyType', 'ResultCode']) },
      { id: 'traces', name: 'Traces', table: 'AppTraces', reads: 'Application trace messages', description: 'Log lines written through the application logger.', output: rows(['TimeGenerated', 'SeverityLevel', 'Message', 'AppRoleName', 'OperationName']) },
      { id: 'error-traces', name: 'Error traces', table: 'AppTraces', reads: 'Application trace messages', description: 'Trace messages at Error or Critical severity.', filters: [where('SeverityLevel', 'gte', '3')], output: rows(['TimeGenerated', 'SeverityLevel', 'Message', 'AppRoleName', 'OperationName']) },
    ],
  },
  {
    id: 'api-management',
    name: 'API Management',
    group: 'Applications',
    scenarios: [
      { id: 'requests', name: 'Gateway log', table: 'ApiManagementGatewayLogs', reads: 'API Management gateway requests', description: 'Every request through the gateway.', output: rows(gatewayColumns) },
      { id: 'failures', name: 'Failed requests', table: 'ApiManagementGatewayLogs', reads: 'API Management gateway requests', description: 'Requests answered with a 400 or 500-range status.', filters: [where('ResponseCode', 'gte', '400')], output: rows([...gatewayColumns, 'LastErrorReason']) },
      { id: 'slow', name: 'Slowest requests', table: 'ApiManagementGatewayLogs', reads: 'API Management gateway requests', description: 'Requests ordered by total time, in milliseconds.', output: rows(gatewayColumns, 'TotalTime') },
      { id: 'by-api', name: 'Requests by API', table: 'ApiManagementGatewayLogs', reads: 'Gateway requests and average time by API and response code', description: 'Volume and latency per API.', output: top([count('Requests'), ['AverageMs', 'avg(TotalTime)']], ['ApiId', 'ResponseCode']) },
    ],
  },
  {
    id: 'azure-functions',
    name: 'Azure Functions',
    group: 'Applications',
    scenarios: [
      { id: 'logs', name: 'Function logs', table: 'FunctionAppLogs', reads: 'Function app log entries', description: 'Log lines written by the Functions host and your functions.', output: rows(functionColumns) },
      { id: 'errors', name: 'Errors', table: 'FunctionAppLogs', reads: 'Function app log entries', description: 'Entries logged at Error level.', filters: [where('Level', 'eq', 'Error')], output: rows([...functionColumns, 'ExceptionMessage']) },
      { id: 'by-function', name: 'Entries by function', table: 'FunctionAppLogs', reads: 'Function app log entries counted by function and level', description: 'Which functions log most, and at what level.', output: top([count('Entries')], ['FunctionName', 'Level']) },
    ],
  },
  {
    id: 'container-apps',
    name: 'Container Apps',
    group: 'Applications',
    scenarios: [
      { id: 'console', name: 'Console logs', table: 'ContainerAppConsoleLogs', reads: 'Container app console lines', description: 'What containers wrote to stdout and stderr.', output: rows(consoleColumns) },
      { id: 'stderr', name: 'Console errors (stderr)', table: 'ContainerAppConsoleLogs', reads: 'Container app console lines', description: 'Only what containers wrote to standard error.', filters: [where('Stream', 'eq', 'stderr')], output: rows(consoleColumns) },
      { id: 'system', name: 'System logs', table: 'ContainerAppSystemLogs', reads: 'Container app system events', description: 'Revision, scaling and probe events from the platform.', output: rows(['TimeGenerated', 'ContainerAppName', 'RevisionName', 'Reason', 'Log']) },
      { id: 'by-reason', name: 'System events by reason', table: 'ContainerAppSystemLogs', reads: 'Container app system events counted by app and reason', description: 'What the platform keeps reporting.', output: top([count('Events')], ['ContainerAppName', 'Reason']) },
    ],
  },
  {
    id: 'container-registry',
    name: 'Container Registry',
    group: 'Applications',
    scenarios: [
      { id: 'logins', name: 'Logins', table: 'ContainerRegistryLoginEvents', reads: 'Registry login events', description: 'Who authenticated to the registry, and from where.', output: rows(['TimeGenerated', 'Identity', 'CallerIpAddress', 'LoginServer', 'ResultType', 'ResultDescription']) },
      { id: 'by-identity', name: 'Logins by identity', table: 'ContainerRegistryLoginEvents', reads: 'Registry login events counted by identity, address and result', description: 'Which identities pull and push.', output: top([count('Logins')], ['Identity', 'CallerIpAddress', 'ResultType']) },
    ],
  },
];

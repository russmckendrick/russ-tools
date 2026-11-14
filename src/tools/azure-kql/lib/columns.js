const ip = { type: 'ip' };
const port = { type: 'port' };
const oneOf = (...values) => ({ type: 'enum', values });
const suggest = (...values) => ({ suggest: values });

const firewall = {
  SourceIp: ip,
  DestinationIp: ip,
  SourcePort: port,
  DestinationPort: port,
};

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

export const TABLE_NOTES = {
  AZFWNetworkRule: {
    common: ['Action', 'SourceIp', 'DestinationIp', 'DestinationPort', 'Protocol', 'Rule', 'RuleCollection', 'Policy'],
    columns: { ...firewall, Action: suggest('Allow', 'Deny'), Protocol: suggest('TCP', 'UDP') },
  },
  AZFWApplicationRule: {
    common: ['Action', 'Fqdn', 'SourceIp', 'TargetUrl', 'WebCategory', 'Protocol', 'Rule'],
    columns: {
      SourceIp: ip,
      SourcePort: port,
      DestinationPort: port,
      Action: suggest('Allow', 'Deny'),
      Protocol: suggest('HTTP', 'HTTPS'),
    },
  },
  AZFWNatRule: {
    common: ['SourceIp', 'DestinationIp', 'DestinationPort', 'TranslatedIp', 'TranslatedPort', 'Rule'],
    columns: { ...firewall, TranslatedIp: ip, TranslatedPort: port, Protocol: suggest('TCP', 'UDP') },
  },
  AZFWDnsQuery: {
    common: ['QueryName', 'QueryType', 'SourceIp', 'ResponseCode', 'Protocol'],
    columns: { SourceIp: ip, SourcePort: port, Protocol: suggest('TCP', 'UDP') },
  },
  AZFWThreatIntel: {
    common: ['Action', 'SourceIp', 'DestinationIp', 'Fqdn', 'Protocol'],
    columns: firewall,
  },
  AZFWIdpsSignature: {
    common: ['Action', 'Severity', 'SignatureId', 'Category', 'SourceIp', 'DestinationIp'],
    columns: firewall,
  },
  AGWAccessLogs: {
    common: ['HttpStatus', 'ClientIp', 'Host', 'RequestUri', 'HttpMethod', 'ServerStatus', 'RuleName', 'BackendPoolName'],
    columns: {
      ClientIp: ip,
      ClientPort: port,
      UpstreamSourcePort: port,
      HttpMethod: suggest('GET', 'POST', 'PUT', 'DELETE'),
      WafMode: oneOf('Detection', 'Prevention'),
      SslEnabled: oneOf('on', 'off'),
    },
  },
  AGWFirewallLogs: {
    common: ['Action', 'RuleId', 'ClientIp', 'Hostname', 'RequestUri', 'RuleSetType'],
    columns: { ClientIp: ip, ClientPort: port, Action: oneOf('Allowed', 'Blocked', 'Matched', 'Detected') },
  },
  AzureDiagnostics: {
    common: ['Category', 'httpStatus_d', 'clientIP_s', 'requestUri_s', 'host_s', 'httpMethod_s', 'Resource', 'ResourceGroup'],
    columns: {
      clientIP_s: ip,
      CallerIPAddress: ip,
      Category: suggest('ApplicationGatewayAccessLog', 'ApplicationGatewayPerformanceLog', 'ApplicationGatewayFirewallLog'),
    },
  },
  NTANetAnalytics: {
    common: ['SrcIp', 'DestIp', 'DestPort', 'FlowStatus', 'FlowDirection', 'FlowType', 'L4Protocol', 'SrcSubnet', 'DestSubnet', 'SrcVm', 'DestVm', 'AclRule'],
    columns: {
      SrcIp: ip,
      DestIp: ip,
      DestPort: port,
      FlowType: oneOf('IntraVNet', 'InterVNet', 'S2S', 'P2S', 'AzurePublic', 'ExternalPublic', 'MaliciousFlow', 'Unknown Private', 'Unknown'),
      FlowDirection: suggest('Inbound', 'Outbound'),
      FlowStatus: suggest('Allowed', 'Denied'),
      L4Protocol: suggest('T', 'U'),
      SubType: suggest('FlowLog'),
    },
  },
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
  AppServiceHTTPLogs: {
    common: ['ScStatus', 'CsHost', 'CsUriStem', 'CsMethod', 'CIp', 'TimeTaken', 'UserAgent'],
    columns: { CIp: ip, CsMethod: suggest('GET', 'POST', 'PUT', 'DELETE') },
  },
  AppServiceConsoleLogs: {
    common: ['Level', 'ResultDescription', 'Host'],
    columns: {},
  },
  AppServiceAppLogs: {
    common: ['Level', 'Message', 'ExceptionClass', 'Logger', 'Host'],
    columns: { Level: oneOf('Informational', 'Warning', 'Error', 'Critical') },
  },
  ContainerLogV2: {
    common: ['PodNamespace', 'PodName', 'ContainerName', 'LogLevel', 'LogSource', 'Computer'],
    columns: {
      LogSource: oneOf('stdout', 'stderr'),
      LogLevel: oneOf('CRITICAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE', 'UNKNOWN'),
    },
  },
  KubeEvents: {
    common: ['Namespace', 'Name', 'ObjectKind', 'Reason', 'KubeEventType', 'ClusterName'],
    columns: { KubeEventType: suggest('Normal', 'Warning') },
  },
  KubePodInventory: {
    common: ['Namespace', 'Name', 'ContainerName', 'PodStatus', 'ContainerRestartCount', 'ClusterName', 'Computer'],
    columns: { PodIp: ip, PodStatus: suggest('Running', 'Pending', 'Succeeded', 'Failed', 'Unknown') },
  },
  AKSAudit: {
    common: ['Verb', 'RequestUri', 'Stage', 'Level', 'UserAgent', 'PodName'],
    columns: {
      Level: oneOf('Metadata', 'Request', 'RequestResponse'),
      Stage: oneOf('RequestReceived', 'ResponseStarted', 'ResponseComplete', 'Panic'),
      Verb: suggest('get', 'list', 'watch', 'create', 'update', 'patch', 'delete'),
    },
  },
  AKSControlPlane: {
    common: ['Category', 'Level', 'PodName', 'Message', 'Stream'],
    columns: { Level: oneOf('Fatal', 'Error', 'Warning', 'Info'), Stream: oneOf('stdout', 'stderr') },
  },
  WVDConnections: {
    common: ['UserName', 'State', 'ClientSideIPAddress', 'SessionHostName', 'ClientOS', 'ConnectionType', 'TransportType', 'GatewayRegion'],
    columns: {
      ClientSideIPAddress: ip,
      SessionHostIPAddress: ip,
      State: oneOf('Started', 'Connected', 'Completed'),
      ConnectionType: oneOf('RAIL', 'Desktop'),
      TransportType: suggest('Shortpath', 'TURN', 'Websocket'),
    },
  },
  WVDErrors: {
    common: ['UserName', 'CodeSymbolic', 'Source', 'ServiceError', 'Operation', 'ActivityType'],
    columns: {},
  },
  Heartbeat: {
    common: ['Computer', 'OSType', 'ComputerEnvironment', 'ResourceGroup', 'ComputerIP', 'Category', 'SubscriptionId'],
    columns: {
      ComputerIP: ip,
      OSType: oneOf('Windows', 'Linux'),
      ComputerEnvironment: oneOf('Azure', 'Non-Azure'),
    },
  },
};

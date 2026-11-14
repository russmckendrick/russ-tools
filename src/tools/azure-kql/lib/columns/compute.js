import { ip, oneOf, port, suggest } from './types.js';

export const COMPUTE_NOTES = {
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
  KubeNodeInventory: {
    common: ['Computer', 'Status', 'ClusterName', 'KubeletVersion', 'OperatingSystem'],
    columns: { Status: suggest('Ready') },
  },
  Event: {
    common: ['Computer', 'EventLog', 'EventLevelName', 'EventID', 'Source', 'RenderedDescription'],
    columns: { EventLevelName: suggest('Error', 'Warning', 'Information'), EventLog: suggest('System', 'Application') },
  },
  Syslog: {
    common: ['Computer', 'Facility', 'SeverityLevel', 'ProcessName', 'SyslogMessage', 'HostIP'],
    columns: {
      HostIP: ip,
      SeverityLevel: suggest('emerg', 'alert', 'crit', 'err', 'warning', 'notice', 'info', 'debug'),
      Facility: suggest('auth', 'authpriv', 'daemon', 'kern', 'cron', 'syslog'),
    },
  },
  Perf: {
    common: ['Computer', 'ObjectName', 'CounterName', 'InstanceName', 'CounterValue'],
    columns: { ObjectName: suggest('Processor', 'Memory', 'LogicalDisk'), CounterName: suggest('% Processor Time', 'Available MBytes', '% Free Space') },
  },
  Update: {
    common: ['Computer', 'UpdateState', 'Classification', 'Title', 'KBID', 'OSType'],
    columns: { UpdateState: suggest('Needed', 'Installed'), Classification: suggest('Security Updates', 'Critical Updates') },
  },
  FunctionAppLogs: {
    common: ['FunctionName', 'Level', 'Message', 'ExceptionType', 'AppName', 'Category'],
    columns: { Level: oneOf('Trace', 'Debug', 'Information', 'Warning', 'Error', 'Critical') },
  },
  ContainerAppConsoleLogs: {
    common: ['ContainerAppName', 'ContainerName', 'RevisionName', 'Stream', 'Log'],
    columns: { Stream: suggest('stdout', 'stderr') },
  },
  ContainerAppSystemLogs: {
    common: ['ContainerAppName', 'Reason', 'RevisionName', 'ReplicaName', 'Log'],
    columns: {},
  },
  ContainerRegistryLoginEvents: {
    common: ['Identity', 'CallerIpAddress', 'ResultType', 'ResultDescription', 'LoginServer'],
    columns: { CallerIpAddress: ip },
  },
};

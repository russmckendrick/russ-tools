import { ip, oneOf, port, suggest } from './types.js';

const firewall = {
  SourceIp: ip,
  DestinationIp: ip,
  SourcePort: port,
  DestinationPort: port,
};

export const NETWORK_NOTES = {
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
    common: ['Category', 'httpStatus_d', 'httpStatusCode_s', 'clientIP_s', 'clientIp_s', 'requestUri_s', 'host_s', 'httpMethod_s', 'ruleName_s', 'action_s', 'Resource', 'ResourceGroup'],
    columns: {
      clientIP_s: ip,
      clientIp_s: ip,
      CallerIPAddress: ip,
      Category: suggest(
        'ApplicationGatewayAccessLog',
        'ApplicationGatewayPerformanceLog',
        'ApplicationGatewayFirewallLog',
        'FrontDoorAccessLog',
        'FrontDoorWebApplicationFirewallLog'
      ),
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
  DNSQueryLogs: {
    common: ['QueryName', 'QueryType', 'SourceIpAddress', 'ResponseCode', 'ResolverPolicyRuleAction', 'ResolutionPath'],
    columns: { SourceIpAddress: ip, DestinationIpAddress: ip, SourcePort: port, DestinationPort: port },
  },
  MicrosoftAzureBastionAuditLogs: {
    common: ['UserName', 'ClientIpAddress', 'TargetVMIPAddress', 'Protocol', 'TargetResourceId', 'OperationName'],
    columns: { ClientIpAddress: ip, TargetVMIPAddress: ip, ClientPort: port, Protocol: suggest('ssh', 'rdp') },
  },
};

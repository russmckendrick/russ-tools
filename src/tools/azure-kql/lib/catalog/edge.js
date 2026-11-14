import { count, rows, top, where } from './shapes.js';

const frontDoor = where('Category', 'eq', 'FrontDoorAccessLog');
const frontDoorWaf = where('Category', 'eq', 'FrontDoorWebApplicationFirewallLog');

export const EDGE = [
  {
    id: 'azure-front-door',
    name: 'Front Door',
    group: 'Network',
    scenarios: [
      { id: 'access', name: 'Access log', table: 'AzureDiagnostics', reads: 'Front Door access log entries', description: 'Requests served at the edge. Front Door logs to AzureDiagnostics.', filters: [frontDoor], output: rows(['TimeGenerated', 'clientIp_s', 'httpMethod_s', 'host_s', 'requestUri_s', 'httpStatusCode_s', 'Resource']) },
      { id: 'errors', name: '5xx responses', table: 'AzureDiagnostics', reads: 'Front Door access log entries', description: 'Requests answered with a 500-range status.', filters: [frontDoor, where('httpStatusCode_s', 'startswith', '5')], output: rows(['TimeGenerated', 'clientIp_s', 'host_s', 'requestUri_s', 'httpStatusCode_s', 'Resource']) },
      { id: 'by-status', name: 'Requests by status', table: 'AzureDiagnostics', reads: 'Front Door requests counted by status and host', description: 'The mix of response codes per host.', filters: [frontDoor], output: top([count('Requests')], ['httpStatusCode_s', 'host_s']) },
      { id: 'top-clients', name: 'Top client addresses', table: 'AzureDiagnostics', reads: 'Front Door requests counted by client address', description: 'The addresses sending the most requests.', filters: [frontDoor], output: top([count('Requests')], ['clientIp_s']) },
      { id: 'waf', name: 'WAF log', table: 'AzureDiagnostics', reads: 'Front Door web application firewall entries', description: 'Requests a WAF rule logged or blocked.', filters: [frontDoorWaf], output: rows(['TimeGenerated', 'action_s', 'ruleName_s', 'policy_s', 'policyMode_s', 'host_s', 'requestUri_s', 'Resource']) },
      { id: 'waf-rules', name: 'Top WAF rules', table: 'AzureDiagnostics', reads: 'Front Door web application firewall matches counted by rule and action', description: 'The rules firing most often.', filters: [frontDoorWaf], output: top([count('Hits')], ['ruleName_s', 'action_s', 'policy_s']) },
    ],
  },
  {
    id: 'dns-queries',
    name: 'DNS query logs',
    group: 'Network',
    scenarios: [
      { id: 'queries', name: 'Queries', table: 'DNSQueryLogs', reads: 'DNS queries from virtual networks', description: 'Queries recorded by DNS security policy.', output: rows(['TimeGenerated', 'SourceIpAddress', 'QueryName', 'QueryType', 'ResponseCode', 'ResolverPolicyRuleAction', 'ResolutionPath']) },
      { id: 'by-action', name: 'Queries by policy action', table: 'DNSQueryLogs', reads: 'DNS queries counted by policy action and name', description: 'What DNS security policy allowed, blocked or alerted on.', output: top([count('Queries')], ['ResolverPolicyRuleAction', 'QueryName']) },
      { id: 'top-names', name: 'Top names', table: 'DNSQueryLogs', reads: 'DNS queries counted by name and type', description: 'The names looked up most.', output: top([count('Queries')], ['QueryName', 'QueryType']) },
      { id: 'top-sources', name: 'Top sources', table: 'DNSQueryLogs', reads: 'DNS queries counted by source address', description: 'The machines making the most lookups.', output: top([count('Queries')], ['SourceIpAddress']) },
    ],
  },
  {
    id: 'azure-bastion',
    name: 'Bastion',
    group: 'Network',
    scenarios: [
      { id: 'sessions', name: 'Sessions', table: 'MicrosoftAzureBastionAuditLogs', reads: 'Bastion session records', description: 'Who connected to which machine through Bastion.', output: rows(['TimeGenerated', 'UserName', 'ClientIpAddress', 'Protocol', 'TargetVMIPAddress', 'TargetResourceId', 'Duration']) },
      { id: 'by-user', name: 'Sessions by user', table: 'MicrosoftAzureBastionAuditLogs', reads: 'Bastion sessions counted by user and target', description: 'Who uses Bastion, and for which machines.', output: top([count('Sessions')], ['UserName', 'TargetVMIPAddress', 'Protocol']) },
    ],
  },
];

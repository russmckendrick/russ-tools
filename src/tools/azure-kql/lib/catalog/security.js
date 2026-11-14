import { count, overTime, rows, top, where } from './shapes.js';

const incidentColumns = ['TimeGenerated', 'IncidentNumber', 'Title', 'Severity', 'Status', 'Classification', 'ProviderName', 'IncidentUrl'];
const alertColumns = ['TimeGenerated', 'AlertName', 'AlertSeverity', 'ProductName', 'CompromisedEntity', 'Status', 'Tactics', 'AlertLink'];
const logonColumns = ['TimeGenerated', 'Computer', 'Account', 'IpAddress', 'LogonType', 'WorkstationName'];
const failedLogon = where('EventID', 'eq', '4625');
const cefColumns = ['TimeGenerated', 'DeviceVendor', 'DeviceProduct', 'Activity', 'DeviceAction', 'SourceIP', 'DestinationIP', 'DestinationPort'];

export const SECURITY = [
  {
    id: 'sentinel',
    name: 'Sentinel and Defender alerts',
    group: 'Security',
    scenarios: [
      { id: 'incidents', name: 'Incidents', table: 'SecurityIncident', reads: 'Incident records', description: 'Sentinel incidents, one row per update.', output: rows(incidentColumns) },
      { id: 'open-incidents', name: 'Open incidents', table: 'SecurityIncident', reads: 'Incident records', description: 'Incidents not yet closed.', filters: [where('Status', 'neq', 'Closed')], output: rows(incidentColumns) },
      { id: 'incidents-by-severity', name: 'Incidents by severity', table: 'SecurityIncident', reads: 'Distinct incidents counted by severity and status', description: 'How the incident queue breaks down.', output: top([['Incidents', 'dcount(IncidentNumber)']], ['Severity', 'Status']) },
      { id: 'alerts', name: 'Alerts', table: 'SecurityAlert', reads: 'Security alerts', description: 'Alerts from Defender for Cloud, Defender XDR and Sentinel rules.', output: rows(alertColumns) },
      { id: 'high-alerts', name: 'High-severity alerts', table: 'SecurityAlert', reads: 'Security alerts', description: 'Alerts scored High.', filters: [where('AlertSeverity', 'eq', 'High')], output: rows(alertColumns) },
      { id: 'alerts-by-product', name: 'Alerts by product', table: 'SecurityAlert', reads: 'Security alerts counted by product and severity', description: 'Which products are raising alerts.', output: top([count('Alerts')], ['ProductName', 'AlertSeverity']) },
      { id: 'alerts-over-time', name: 'Alerts over time', table: 'SecurityAlert', reads: 'Security alerts per severity over time', description: 'Alert volume as a time chart.', output: overTime([count('Alerts')], ['AlertSeverity']) },
    ],
  },
  {
    id: 'windows-security-events',
    name: 'Windows security events',
    group: 'Security',
    scenarios: [
      { id: 'events', name: 'Security events', table: 'SecurityEvent', reads: 'Windows security events', description: 'Events from the Windows Security log.', output: rows(['TimeGenerated', 'Computer', 'EventID', 'Activity', 'Account']) },
      { id: 'failed-logons', name: 'Failed logons (4625)', table: 'SecurityEvent', reads: 'Windows security events', description: 'Logon attempts that failed.', filters: [failedLogon], output: rows(logonColumns) },
      { id: 'failed-logons-by-account', name: 'Failed logons by account', table: 'SecurityEvent', reads: 'Windows security events counted by account and computer', description: 'Accounts being guessed, and where.', filters: [failedLogon], output: top([count('Failures'), ['Sources', 'dcount(IpAddress)']], ['Account', 'Computer']) },
      { id: 'lockouts', name: 'Account lockouts (4740)', table: 'SecurityEvent', reads: 'Windows security events', description: 'Accounts locked out.', filters: [where('EventID', 'eq', '4740')], output: rows(['TimeGenerated', 'Computer', 'TargetAccount', 'Activity']) },
      { id: 'by-event', name: 'Events by ID', table: 'SecurityEvent', reads: 'Windows security events counted by event', description: 'Which events make up the volume.', output: top([count('Events')], ['EventID', 'Activity']) },
    ],
  },
  {
    id: 'cef',
    name: 'Firewalls and appliances (CEF)',
    group: 'Security',
    scenarios: [
      { id: 'events', name: 'Events', table: 'CommonSecurityLog', reads: 'Common Event Format records', description: 'Logs from third-party firewalls, proxies and appliances.', output: rows(cefColumns) },
      { id: 'by-vendor', name: 'Events by product', table: 'CommonSecurityLog', reads: 'Common Event Format records counted by vendor, product and action', description: 'What is sending logs, and what it did.', output: top([count('Events')], ['DeviceVendor', 'DeviceProduct', 'DeviceAction']) },
      { id: 'top-sources', name: 'Top source addresses', table: 'CommonSecurityLog', reads: 'Common Event Format records counted by source, destination and port', description: 'The busiest flows seen by appliances.', output: top([count('Events')], ['SourceIP', 'DestinationIP', 'DestinationPort']) },
    ],
  },
  {
    id: 'defender-xdr',
    name: 'Defender XDR',
    group: 'Security',
    scenarios: [
      { id: 'device-logons', name: 'Device logons', table: 'DeviceLogonEvents', reads: 'Device logon events', description: 'Logons on onboarded devices.', output: rows(['TimeGenerated', 'DeviceName', 'AccountName', 'ActionType', 'LogonType', 'RemoteIP']) },
      { id: 'failed-device-logons', name: 'Failed device logons', table: 'DeviceLogonEvents', reads: 'Device logon events counted by account and device', description: 'Failed logons on onboarded devices.', filters: [where('ActionType', 'eq', 'LogonFailed')], output: top([count('Failures')], ['AccountName', 'DeviceName', 'RemoteIP']) },
      { id: 'processes', name: 'Process creation', table: 'DeviceProcessEvents', reads: 'Process events', description: 'Processes started on onboarded devices.', output: rows(['TimeGenerated', 'DeviceName', 'AccountName', 'FileName', 'ProcessCommandLine', 'InitiatingProcessFileName']) },
      { id: 'network', name: 'Network connections', table: 'DeviceNetworkEvents', reads: 'Device network events', description: 'Connections made by processes on onboarded devices.', output: rows(['TimeGenerated', 'DeviceName', 'ActionType', 'RemoteIP', 'RemotePort', 'RemoteUrl', 'InitiatingProcessFileName']) },
      { id: 'top-remote', name: 'Top remote addresses', table: 'DeviceNetworkEvents', reads: 'Device network events counted by remote address and port', description: 'Where devices connect most.', output: top([count('Connections'), ['Devices', 'dcount(DeviceName)']], ['RemoteIP', 'RemotePort']) },
      { id: 'email', name: 'Email', table: 'EmailEvents', reads: 'Email events', description: 'Messages processed by Defender for Office 365.', output: rows(['TimeGenerated', 'SenderFromAddress', 'RecipientEmailAddress', 'Subject', 'DeliveryAction', 'ThreatTypes']) },
      { id: 'email-threats', name: 'Email with threats', table: 'EmailEvents', reads: 'Email events', description: 'Messages where phishing, malware or spam was detected.', filters: [where('ThreatTypes', 'nempty', '')], output: rows(['TimeGenerated', 'SenderFromAddress', 'RecipientEmailAddress', 'Subject', 'ThreatTypes', 'DeliveryAction', 'DeliveryLocation']) },
      { id: 'identity-logons', name: 'Identity logons', table: 'IdentityLogonEvents', reads: 'Identity logon events', description: 'Authentication seen by Defender for Identity and Defender for Cloud Apps.', output: rows(['TimeGenerated', 'AccountUpn', 'ActionType', 'Application', 'LogonType', 'IPAddress', 'FailureReason']) },
    ],
  },
];

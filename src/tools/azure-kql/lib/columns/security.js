import { ip, port, suggest } from './types.js';

export const SECURITY_NOTES = {
  SecurityIncident: {
    common: ['Title', 'Severity', 'Status', 'Classification', 'ProviderName', 'IncidentNumber'],
    columns: { Severity: suggest('High', 'Medium', 'Low', 'Informational'), Status: suggest('New', 'Active', 'Closed') },
  },
  SecurityAlert: {
    common: ['AlertName', 'AlertSeverity', 'ProductName', 'CompromisedEntity', 'Status', 'Tactics', 'ProviderName'],
    columns: { AlertSeverity: suggest('High', 'Medium', 'Low', 'Informational') },
  },
  SecurityEvent: {
    common: ['EventID', 'Computer', 'Account', 'IpAddress', 'LogonType', 'Activity', 'TargetAccount', 'WorkstationName'],
    columns: { IpAddress: ip },
  },
  CommonSecurityLog: {
    common: ['DeviceVendor', 'DeviceProduct', 'DeviceAction', 'SourceIP', 'DestinationIP', 'DestinationPort', 'Activity', 'LogSeverity'],
    columns: { SourceIP: ip, DestinationIP: ip, SourcePort: port, DestinationPort: port },
  },
  DeviceLogonEvents: {
    common: ['DeviceName', 'AccountName', 'ActionType', 'LogonType', 'RemoteIP', 'FailureReason'],
    columns: { RemoteIP: ip, ActionType: suggest('LogonSuccess', 'LogonFailed') },
  },
  DeviceProcessEvents: {
    common: ['DeviceName', 'AccountName', 'FileName', 'ProcessCommandLine', 'InitiatingProcessFileName', 'SHA256'],
    columns: {},
  },
  DeviceNetworkEvents: {
    common: ['DeviceName', 'ActionType', 'RemoteIP', 'RemotePort', 'RemoteUrl', 'InitiatingProcessFileName', 'Protocol'],
    columns: { RemoteIP: ip, LocalIP: ip, RemotePort: port, LocalPort: port },
  },
  EmailEvents: {
    common: ['SenderFromAddress', 'RecipientEmailAddress', 'Subject', 'DeliveryAction', 'ThreatTypes', 'EmailDirection', 'SenderFromDomain'],
    columns: {
      SenderIPv4: ip,
      EmailDirection: suggest('Inbound', 'Outbound', 'Intra-org'),
      DeliveryAction: suggest('Delivered', 'Blocked', 'Junked', 'Replaced'),
    },
  },
  IdentityLogonEvents: {
    common: ['AccountUpn', 'ActionType', 'Application', 'IPAddress', 'LogonType', 'FailureReason', 'DeviceName'],
    columns: { IPAddress: ip, ActionType: suggest('LogonSuccess', 'LogonFailed') },
  },
};

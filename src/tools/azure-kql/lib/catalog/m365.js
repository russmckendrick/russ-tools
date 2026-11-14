import { count, rows, top, where } from './shapes.js';

const officeColumns = ['TimeGenerated', 'OfficeWorkload', 'Operation', 'UserId', 'ClientIP', 'ResultStatus'];
const deviceColumns = ['TimeGenerated', 'DeviceName', 'UPN', 'OS', 'OSVersion', 'CompliantState', 'LastContact'];

export const M365 = [
  {
    id: 'microsoft-365',
    name: 'Microsoft 365 activity',
    group: 'Microsoft 365',
    scenarios: [
      { id: 'activity', name: 'Audit activity', table: 'OfficeActivity', reads: 'Microsoft 365 audit records', description: 'Exchange, SharePoint, OneDrive and Teams activity.', output: rows(officeColumns) },
      { id: 'files', name: 'SharePoint and OneDrive files', table: 'OfficeActivity', reads: 'Microsoft 365 audit records', description: 'File views, downloads, uploads and sharing.', filters: [where('OfficeWorkload', 'in', 'SharePoint, OneDrive')], output: rows(['TimeGenerated', 'Operation', 'UserId', 'ClientIP', 'OfficeObjectId']) },
      { id: 'exchange', name: 'Exchange activity', table: 'OfficeActivity', reads: 'Microsoft 365 audit records', description: 'Mailbox and admin activity in Exchange Online.', filters: [where('OfficeWorkload', 'eq', 'Exchange')], output: rows(['TimeGenerated', 'Operation', 'UserId', 'ClientIP', 'MailboxOwnerUPN', 'ResultStatus']) },
      { id: 'inbox-rules', name: 'Inbox rule changes', table: 'OfficeActivity', reads: 'Microsoft 365 audit records', description: 'Inbox rules created or changed, a common sign of a compromised mailbox.', filters: [where('Operation', 'in', 'New-InboxRule, Set-InboxRule')], output: rows(['TimeGenerated', 'Operation', 'UserId', 'ClientIP', 'Parameters']) },
      { id: 'by-operation', name: 'Operations by count', table: 'OfficeActivity', reads: 'Microsoft 365 audit records counted by workload and operation', description: 'What people are doing most.', output: top([count('Events')], ['OfficeWorkload', 'Operation']) },
      { id: 'by-user', name: 'Activity by user', table: 'OfficeActivity', reads: 'Microsoft 365 audit records counted by user', description: 'The most active accounts.', output: top([count('Events'), ['Addresses', 'dcount(ClientIP)']], ['UserId']) },
    ],
  },
  {
    id: 'intune',
    name: 'Intune',
    group: 'Microsoft 365',
    scenarios: [
      { id: 'audit', name: 'Audit log', table: 'IntuneAuditLogs', reads: 'Intune audit events', description: 'Changes made in Intune, and by whom.', output: rows(['TimeGenerated', 'OperationName', 'Identity', 'ResultType', 'Category']) },
      { id: 'devices', name: 'Devices', table: 'IntuneDevices', reads: 'Intune device records', description: 'The managed device inventory.', output: rows(deviceColumns) },
      { id: 'non-compliant', name: 'Non-compliant devices', table: 'IntuneDevices', reads: 'Intune device records', description: 'Devices not marked Compliant.', filters: [where('CompliantState', 'neq', 'Compliant')], output: rows(deviceColumns) },
      { id: 'devices-by-os', name: 'Devices by operating system', table: 'IntuneDevices', reads: 'Distinct devices counted by operating system and compliance', description: 'What the fleet is made of.', output: top([['Devices', 'dcount(DeviceId)']], ['OS', 'CompliantState']) },
      { id: 'operational', name: 'Operational log', table: 'IntuneOperationalLogs', reads: 'Intune operational events', description: 'Enrolment and compliance events.', output: rows(['TimeGenerated', 'OperationName', 'Result', 'Category']) },
    ],
  },
];

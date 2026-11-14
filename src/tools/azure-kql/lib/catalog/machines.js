import { count, overTime, rows, top, where } from './shapes.js';

const cpu = [where('ObjectName', 'eq', 'Processor'), where('CounterName', 'eq', '% Processor Time')];
const eventColumns = ['TimeGenerated', 'Computer', 'EventLog', 'EventLevelName', 'EventID', 'Source', 'RenderedDescription'];
const syslogColumns = ['TimeGenerated', 'Computer', 'Facility', 'SeverityLevel', 'ProcessName', 'SyslogMessage'];
const needed = where('UpdateState', 'eqi', 'Needed');

export const MACHINES = [
  {
    id: 'virtual-machines',
    name: 'Virtual machines',
    group: 'Compute',
    scenarios: [
      { id: 'heartbeats', name: 'Agent heartbeats', table: 'Heartbeat', reads: 'Agent heartbeats', description: 'Heartbeats from machines running the monitoring agent.', output: rows(['TimeGenerated', 'Computer', 'OSType', 'Version', 'ComputerIP', 'ResourceGroup', 'Category']) },
      { id: 'last-seen', name: 'Last heartbeat per machine', table: 'Heartbeat', reads: 'Most recent heartbeat for each machine', description: 'Machines that have stopped reporting come out on top.', span: '7d', output: top([['LastHeartbeat', 'max(TimeGenerated)']], ['Computer', 'OSType', 'ResourceGroup'], 'LastHeartbeat', 'asc') },
      { id: 'by-os', name: 'Machines by operating system', table: 'Heartbeat', reads: 'Distinct machines counted by operating system', description: 'What the estate is running.', output: top([['Machines', 'dcount(Computer)']], ['OSType', 'OSName']) },
      { id: 'cpu', name: 'Average CPU by machine', table: 'Perf', reads: 'Average counter value per machine', description: 'The busiest machines by processor time.', filters: cpu, output: top([['AverageCpu', 'avg(CounterValue)'], ['PeakCpu', 'max(CounterValue)']], ['Computer']) },
      { id: 'cpu-over-time', name: 'CPU over time', table: 'Perf', reads: 'Average counter value per machine over time', description: 'Processor time as a time chart.', filters: cpu, output: overTime([['AverageCpu', 'avg(CounterValue)']], ['Computer']) },
      { id: 'missing-updates', name: 'Missing updates', table: 'Update', reads: 'Distinct updates counted by machine and classification', description: 'Machines with updates still needed.', filters: [needed], output: top([['Missing', 'dcount(Title)']], ['Computer', 'Classification']) },
    ],
  },
  {
    id: 'windows-event-log',
    name: 'Windows event log',
    group: 'Compute',
    scenarios: [
      { id: 'events', name: 'Events', table: 'Event', reads: 'Windows event log entries', description: 'System and Application log entries collected by the agent.', output: rows(eventColumns) },
      { id: 'errors', name: 'Errors', table: 'Event', reads: 'Windows event log entries', description: 'Entries logged at Error level.', filters: [where('EventLevelName', 'eq', 'Error')], output: rows(eventColumns) },
      { id: 'by-event', name: 'Events by ID', table: 'Event', reads: 'Windows event log entries counted by machine, log, source and event', description: 'Which events repeat most.', output: top([count('Events')], ['Computer', 'EventLog', 'Source', 'EventID']) },
    ],
  },
  {
    id: 'linux-syslog',
    name: 'Linux syslog',
    group: 'Compute',
    scenarios: [
      { id: 'messages', name: 'Messages', table: 'Syslog', reads: 'Syslog messages', description: 'Messages collected from Linux machines.', output: rows(syslogColumns) },
      { id: 'errors', name: 'Errors and worse', table: 'Syslog', reads: 'Syslog messages', description: 'Messages at err, crit, alert or emerg.', filters: [where('SeverityLevel', 'in', 'err, crit, alert, emerg')], output: rows(syslogColumns) },
      { id: 'auth', name: 'Authentication messages', table: 'Syslog', reads: 'Syslog messages', description: 'Logins, sudo and SSH from the auth facilities.', filters: [where('Facility', 'in', 'auth, authpriv')], output: rows(syslogColumns) },
      { id: 'by-process', name: 'Messages by process', table: 'Syslog', reads: 'Syslog messages counted by machine, process and severity', description: 'What is writing to syslog most.', output: top([count('Messages')], ['Computer', 'ProcessName', 'SeverityLevel']) },
    ],
  },
];

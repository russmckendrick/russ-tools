import { describe, expect, it } from 'vitest';
import { BUILD_KQL_QUERY_TOOL, runBuild } from './webmcp.js';

describe('build_kql_query', () => {
  it('lists the catalogue when it is given nothing', () => {
    const result = runBuild();
    expect(result.error).toBe('Give a service and a scenario.');
    expect(result.services.find((entry) => entry.service === 'azure-firewall').scenarios[0]).toMatchObject({ scenario: 'basic', table: 'AZFWNetworkRule' });
  });

  it('builds a scenario with extra filters', () => {
    const result = runBuild({
      service: 'azure-firewall',
      scenario: 'denied',
      timeRange: '7d',
      limit: 5,
      filters: [
        { column: 'SourceIp', value: '10.0.0.0/8' },
        { column: 'DestinationPort', operator: 'between', value: [1, 1023] },
        { column: 'Protocol', operator: 'in', value: ['TCP', 'UDP'] },
      ],
    });
    expect(result.kql.split('\n')).toEqual([
      'AZFWNetworkRule',
      '| where TimeGenerated > ago(7d)',
      '| where Action == "Deny"',
      '| where ipv4_is_in_range(SourceIp, "10.0.0.0/8")',
      '| where DestinationPort between (1 .. 1023)',
      '| where Protocol in ("TCP", "UDP")',
      '| summarize Hits = count() by SourceIp, DestinationIp, DestinationPort, Protocol',
      '| top 5 by Hits desc',
    ]);
    expect(result.notApplied).toEqual([]);
    expect(result.table).toBe('AZFWNetworkRule');
    expect(result.reading).toContain('top 5 by Hits');
  });

  it('reports what it left out instead of writing it', () => {
    const result = runBuild({
      service: 'entra-sign-ins',
      filters: [
        { column: 'Password', value: 'x' },
        { column: 'IPAddress', value: 'not-an-ip' },
        { column: 'UserPrincipalName', operator: 'like', value: 'a' },
      ],
    });
    expect(result.kql).not.toMatch(/Password|not-an-ip|like/);
    expect(result.notApplied.map((item) => item.reason)).toEqual([
      'SigninLogs has no filterable column with that name.',
      'not-an-ip is not an IPv4 or IPv6 address.',
      'UserPrincipalName cannot be filtered with "like".',
    ]);
  });

  it('describes the columns worth filtering on', () => {
    const { columns } = runBuild({ service: 'vnet-flow-logs' });
    expect(columns.find((column) => column.column === 'SrcIp')).toMatchObject({ type: 'ip', operators: expect.arrayContaining(['eq', 'private']) });
    expect(columns.find((column) => column.column === 'FlowType').values).toContain('ExternalPublic');
  });

  it('names an unknown service or scenario', () => {
    expect(runBuild({ service: 'nope' }).error).toBe('Unknown service "nope".');
    const result = runBuild({ service: 'key-vault', scenario: 'nope' });
    expect(result.error).toBe('Unknown scenario "nope" for Key Vault.');
    expect(result.services).toHaveLength(1);
  });

  it('answers through the WebMCP envelope and never throws', async () => {
    const answer = await BUILD_KQL_QUERY_TOOL.execute({ service: 'key-vault', scenario: 'secret-reads' });
    expect(JSON.parse(answer.content[0].text).kql).toContain('| where OperationName == "SecretGet"');
    expect(JSON.parse((await BUILD_KQL_QUERY_TOOL.execute(null)).content[0].text).services.length).toBeGreaterThan(10);
  });
});

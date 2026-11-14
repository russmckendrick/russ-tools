import { describe, expect, it } from 'vitest';
import { buildQuery } from './build.js';
import CAPTURED from './fixtures/captured-2026-11-14.json';
import { fromLegacyConfig, legacyTemplateKql, migrateLegacy } from './legacy.js';
import { readShare } from './share.js';

const shape = (state) => state.filters.map(({ column, op, value }) => [column, op, value]);

describe('a share link made by the old tool', () => {
  const search = new URL(CAPTURED.shareUrl).search;

  it('restores service, scenario, time range, limit and filters', () => {
    const state = readShare(search);
    expect(state).toMatchObject({ mode: 'build', service: 'azure-firewall', scenario: 'basic', time: { kind: 'relative', span: '24h' }, limit: '1000' });
    expect(shape(state)).toEqual([
      ['SourceIp', 'eq', '10.0.0.0/8'],
      ['DestinationIp', 'eq', '8.8.8.8'],
      ['DestinationPort', 'eq', '443'],
    ]);
  });

  it('builds the same filters the old tool built', () => {
    expect(buildQuery(readShare(search)).kql.split('\n')).toEqual([
      'AZFWNetworkRule',
      '| where TimeGenerated > ago(24h)',
      '| where ipv4_is_in_range(SourceIp, "10.0.0.0/8")',
      '| where DestinationIp == "8.8.8.8"',
      '| where DestinationPort == 443',
      '| top 1000 by TimeGenerated desc',
    ]);
  });

  it('survives a "+" that the query string turned into a space', () => {
    const config = { service: 'azure-virtual-desktop', template: 'basic', parameters: { UserName: 'a>b?c~~>' } };
    const encoded = btoa(JSON.stringify(config));
    expect(encoded).toContain('+');
    expect(shape(readShare(`?config=${encoded}`))).toEqual([['UserName', 'eq', 'a>b?c~~>']]);
  });
});

describe('fromLegacyConfig', () => {
  it('maps the AVD column the old template had wrong onto the real one', () => {
    const state = fromLegacyConfig({ service: 'azure-virtual-desktop', template: 'basic', parameters: { ClientIPAddress: '203.0.113.7', State: 'Failed' } });
    expect(shape(state)).toEqual([
      ['ClientSideIPAddress', 'eq', '203.0.113.7'],
      ['State', 'eq', 'Failed'],
    ]);
  });

  it('overwrites the scenario\'s own filter rather than adding a second on the same column', () => {
    const state = fromLegacyConfig({
      service: 'azure-application-gateway',
      template: 'basic',
      parameters: { timeRange: '7d', Category: 'ApplicationGatewayFirewallLog', httpStatus_d: '502', clientIP_s: '198.51.100.0/24', requestUri_s: '/login' },
    });
    expect(shape(state)).toEqual([
      ['Category', 'eq', 'ApplicationGatewayFirewallLog'],
      ['httpStatus_d', 'eq', '502'],
      ['clientIP_s', 'eq', '198.51.100.0/24'],
      ['requestUri_s', 'eq', '/login'],
    ]);
    expect(buildQuery(state).kql).toContain('| where httpStatus_d == 502\n| where ipv4_is_in_range(clientIP_s, "198.51.100.0/24")');
  });

  it('ignores blanks, "any", unknown parameters and an out-of-range limit', () => {
    const state = fromLegacyConfig({
      service: 'azure-firewall',
      template: 'application',
      parameters: { Action: 'any', Fqdn: '', Nope: 'x', limit: '999999', timeRange: 'forever', sortField: 'x' },
    });
    expect(state).toMatchObject({ scenario: 'application', limit: '100', time: { kind: 'relative', span: '24h' }, filters: [] });
  });

  it('returns nothing for a service or template it does not know', () => {
    expect(fromLegacyConfig({ service: 'custom', template: 'custom-1', parameters: {} })).toBe(null);
    expect(fromLegacyConfig(null)).toBe(null);
  });
});

describe('legacyTemplateKql', () => {
  it('writes what the old generator wrote for a custom template', () => {
    expect(
      legacyTemplateKql({ table: 'AZFWNetworkRule', aggregation: '| summarize Count = count() by Action', projection: ['Action', 'Count'], defaultLimit: 25 })
    ).toBe(
      ['AZFWNetworkRule', '| where TimeGenerated >= ago(24h)', '| summarize Count = count() by Action', '| order by TimeGenerated desc', '| limit 25', '| project Action, Count'].join('\n')
    );
  });

  it('falls back where the template holds nothing usable', () => {
    expect(legacyTemplateKql({ table: 'not a table', projection: ['a b'], defaultLimit: 'x' })).toBe(
      ['AzureDiagnostics', '| where TimeGenerated >= ago(24h)', '| order by TimeGenerated desc', '| limit 100'].join('\n')
    );
  });
});

describe('migrateLegacy', () => {
  const migrated = migrateLegacy({ store: JSON.parse(CAPTURED.store), templates: [] });

  it('carries the captured favourite and history entry across', () => {
    expect(migrated.saved).toHaveLength(1);
    expect(migrated.recent).toHaveLength(1);
    expect(migrated.saved[0]).toMatchObject({
      id: '1794654379169',
      name: 'Azure Firewall: Network rule log',
      kind: 'build',
      at: '2026-11-14T11:06:19.169Z',
    });
    expect(migrated.saved[0].kql).toContain('| limit 1000');
    expect(shape(migrated.saved[0].state)).toEqual([
      ['SourceIp', 'eq', '10.0.0.0/8'],
      ['DestinationIp', 'eq', '8.8.8.8'],
      ['DestinationPort', 'eq', '443'],
    ]);
  });

  it('keeps a name, description and tags the user gave a favourite', () => {
    const store = { state: { favorites: [{ id: '7', name: 'Prod egress', description: 'weekly check', tags: ['prod', 7], query: 'T', service: 'azure-firewall', template: 'basic', parameters: {}, timestamp: 'x' }] } };
    expect(migrateLegacy({ store, templates: [] }).saved[0]).toMatchObject({ name: 'Prod egress', description: 'weekly check', tags: ['prod'], at: '1970-01-01T00:00:00.000Z' });
  });

  it('turns a custom template into a saved KQL query', () => {
    const template = { id: 'custom-1', name: 'My Denied Traffic', description: 'test', service: 'azure-firewall', table: 'AZFWNetworkRule', fields: [], aggregation: '', projection: [], defaultLimit: 25 };
    expect(migrateLegacy({ store: null, templates: [template] }).saved[0]).toMatchObject({
      id: 'custom-1',
      name: 'My Denied Traffic',
      kind: 'kql',
      service: 'azure-firewall',
      tags: ['custom template'],
      kql: 'AZFWNetworkRule\n| where TimeGenerated >= ago(24h)\n| order by TimeGenerated desc\n| limit 25',
    });
  });

  it('opens an entry it cannot map as plain KQL, and drops what is not an entry', () => {
    const store = { state: { favorites: [{ id: '1', query: 'Heartbeat | take 1', service: 'gone', template: 'gone' }, { id: '2' }, null], queryHistory: 'nope' } };
    const result = migrateLegacy({ store, templates: [{ id: 'x' }, 4] });
    expect(result.saved).toEqual([expect.objectContaining({ id: '1', kind: 'kql', kql: 'Heartbeat | take 1', name: 'Saved query' })]);
    expect(result.recent).toEqual([]);
  });
});

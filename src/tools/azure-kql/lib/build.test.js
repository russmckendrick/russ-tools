import { describe, expect, it } from 'vitest';
import { buildQuery } from './build.js';
import { allScenarios } from './catalog.js';
import EXPECTED from './fixtures/scenarios.json';
import { EMPTY_STATE, scenarioState } from './state.js';

const start = (service, scenario) => scenarioState(service, scenario, EMPTY_STATE);
const withFilters = (state, ...filters) => ({
  ...state,
  filters: [...state.filters, ...filters.map((filter, index) => ({ id: `t${index}`, value2: '', ...filter }))],
});

describe('every scenario', () => {
  it('is pinned', () => {
    expect(allScenarios().map(({ service, scenario }) => `${service.id}/${scenario.id}`).sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it.each(Object.entries(EXPECTED))('%s builds exactly the pinned query', (key, lines) => {
    const [service, scenario] = key.split('/');
    const built = buildQuery(start(service, scenario));
    expect(built.problems).toEqual([]);
    expect(built.kql.split('\n')).toEqual(lines);
    expect(built.reading).toMatch(/\.$/);
  });
});

describe('filters', () => {
  it('writes each valid filter as its own where, after the time filter and in the order given', () => {
    const state = withFilters(
      start('azure-firewall', 'basic'),
      { column: 'DestinationPort', op: 'eq', value: '443' },
      { column: 'SourceIp', op: 'eq', value: '10.0.0.0/8' },
      { column: 'Action', op: 'eq', value: 'Deny' }
    );
    expect(buildQuery(state).kql.split('\n')).toEqual([
      'AZFWNetworkRule',
      '| where TimeGenerated > ago(24h)',
      '| where DestinationPort == 443',
      '| where ipv4_is_in_range(SourceIp, "10.0.0.0/8")',
      '| where Action == "Deny"',
      '| top 100 by TimeGenerated desc',
    ]);
  });

  it('leaves an invalid filter out and says why, so the query still parses', () => {
    const state = withFilters(
      start('azure-firewall', 'basic'),
      { column: 'DestinationPort', op: 'eq', value: '99999' },
      { column: 'SourceIp', op: 'eq', value: '10.0.0.4' }
    );
    const built = buildQuery(state);
    expect(built.kql).not.toContain('99999');
    expect(built.kql).toContain('| where SourceIp == "10.0.0.4"');
    expect(built.problems).toEqual([{ scope: 'filter', id: 't0', message: 'The port must be from 0 to 65535.' }]);
  });

  it('skips an unfinished filter without reporting it', () => {
    const built = buildQuery(withFilters(start('azure-firewall', 'basic'), { column: 'Rule', op: 'contains', value: '' }));
    expect(built.problems).toEqual([]);
    expect(built.kql).not.toContain('where Rule');
  });

  it('refuses a column the table does not have, including a dynamic one', () => {
    const built = buildQuery(
      withFilters(start('entra-audit', 'changes'), { column: 'Nope', op: 'eq', value: 'x' }, { column: 'InitiatedBy', op: 'eq', value: 'x' })
    );
    expect(built.problems.map((problem) => problem.message)).toEqual([
      'AuditLogs has no filterable column called Nope.',
      'AuditLogs has no filterable column called InitiatedBy.',
    ]);
  });

  it('cannot be made to emit a second statement', () => {
    const built = buildQuery(
      withFilters(start('azure-virtual-desktop', 'basic'), { column: 'UserName', op: 'eq', value: 'bob" | project-away * //' })
    );
    expect(built.kql.split('\n')[2]).toBe('| where UserName == "bob\\" | project-away * //"');
  });
});

describe('time range', () => {
  const lines = (time, scenario = 'basic') => buildQuery({ ...start('azure-firewall', scenario), time }).kql.split('\n');

  it('uses ago() for a relative range', () => {
    expect(lines({ kind: 'relative', span: '7d' })[1]).toBe('| where TimeGenerated > ago(7d)');
  });

  it('uses between for a custom range', () => {
    expect(lines({ kind: 'absolute', from: '2026-11-01T00:00', to: '2026-11-02T12:30' })[1]).toBe(
      '| where TimeGenerated between (datetime(2026-11-01T00:00:00Z) .. datetime(2026-11-02T12:30:00Z))'
    );
  });

  it('writes no time filter when the portal is to supply it', () => {
    expect(lines({ kind: 'portal' })).toEqual(['AZFWNetworkRule', '| top 100 by TimeGenerated desc']);
  });

  it('falls back to 24 hours and says so when the range is wrong', () => {
    const built = buildQuery({ ...start('azure-firewall', 'basic'), time: { kind: 'absolute', from: '2026-11-02T00:00', to: '2026-11-01T00:00' } });
    expect(built.kql).toContain('ago(24h)');
    expect(built.problems).toEqual([{ scope: 'time', message: 'The end must be after the start. Using the last 24 hours.' }]);
    expect(buildQuery({ ...start('azure-firewall', 'basic'), time: { kind: 'relative', span: '24h) | take 1' } }).kql).toContain('ago(24h)\n');
  });

  it.each([
    ['30m', '1m'],
    ['6h', '5m'],
    ['24h', '1h'],
    ['7d', '6h'],
    ['30d', '1d'],
  ])('sizes time-chart buckets to a %s range', (span, bin) => {
    expect(lines({ kind: 'relative', span }, 'actions-over-time')[2]).toBe(`| summarize Hits = count() by Action, bin(TimeGenerated, ${bin})`);
  });
});

describe('row limit', () => {
  it('writes the limit into top', () => {
    expect(buildQuery({ ...start('azure-firewall', 'basic'), limit: '5000' }).kql).toMatch(/\| top 5000 by TimeGenerated desc$/);
    expect(buildQuery({ ...start('azure-firewall', 'denied'), limit: '5' }).kql).toMatch(/\| top 5 by Hits desc$/);
  });

  it('falls back and says so when the limit is not a number in range', () => {
    const built = buildQuery({ ...start('azure-firewall', 'basic'), limit: '0; take 1' });
    expect(built.kql).toMatch(/\| top 100 by TimeGenerated desc$/);
    expect(built.problems).toEqual([{ scope: 'limit', message: 'Use a whole number for the row limit. Using 100.' }]);
    expect(buildQuery({ ...start('azure-firewall', 'basic'), limit: '30001' }).problems[0].message).toBe('The row limit must be from 1 to 30000. Using 100.');
  });
});

describe('the reading', () => {
  it('says what a row query returns', () => {
    const state = withFilters(start('azure-firewall', 'basic'), { column: 'Action', op: 'eq', value: 'Deny' }, { column: 'SourceIp', op: 'eq', value: '10.0.0.0/8' });
    expect(buildQuery(state).reading).toBe(
      'Network rule log entries in the last 24 hours where Action is Deny and SourceIp is in 10.0.0.0/8, newest first, 100 rows at most.'
    );
  });

  it('says what a summary returns', () => {
    expect(buildQuery(start('azure-firewall', 'denied')).reading).toBe(
      'Network rule hits counted by source, destination, port and protocol in the last 24 hours where Action is Deny, top 20 by Hits.'
    );
    expect(buildQuery(start('app-service', 'status-over-time')).reading).toBe(
      'Requests per status code over time in the last 24 hours, in hourly buckets, drawn as a time chart.'
    );
  });

  it('follows the time range', () => {
    const at = (time) => buildQuery({ ...start('azure-firewall', 'basic'), time }).reading;
    expect(at({ kind: 'relative', span: '1h' })).toContain('in the last hour,');
    expect(at({ kind: 'portal' })).toContain('over the time range set in the portal,');
    expect(at({ kind: 'absolute', from: '2026-11-01T00:00', to: '2026-11-02T00:00' })).toContain('between 2026-11-01 00:00 and 2026-11-02 00:00 UTC,');
  });
});

describe('nothing chosen', () => {
  it('builds nothing and asks for a scenario', () => {
    expect(buildQuery(EMPTY_STATE)).toEqual({ ok: false, kql: '', reading: '', problems: [{ scope: 'scenario', message: 'Choose a service and a scenario.' }] });
    expect(buildQuery({ service: 'azure-firewall', scenario: 'no-such' }).ok).toBe(false);
  });
});

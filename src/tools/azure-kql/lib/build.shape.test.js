import { describe, expect, it } from 'vitest';
import { buildQuery } from './build.js';
import { EMPTY_STATE, scenarioState } from './state.js';

const start = (service, scenario) => scenarioState(service, scenario, EMPTY_STATE);
const withFilters = (state, ...filters) => ({
  ...state,
  filters: [...state.filters, ...filters.map((filter, index) => ({ id: `t${index}`, value2: '', ...filter }))],
});

describe('switching a filter off', () => {
  it('leaves it out without reporting it, even when its value is wrong', () => {
    const state = withFilters(
      start('azure-firewall', 'denied'),
      { column: 'SourceIp', op: 'eq', value: '10.0.0.4', off: true },
      { column: 'DestinationPort', op: 'eq', value: '99999', off: true }
    );
    const built = buildQuery(state);
    expect(built.problems).toEqual([]);
    expect(built.kql).not.toMatch(/SourceIp ==|99999/);
    expect(built.kql).toContain('| where Action == "Deny"');
  });
});

describe('counting by columns and over time', () => {
  const grouped = (group, scenario = 'basic') => buildQuery({ ...start('azure-firewall', scenario), group });

  it('replaces a row scenario\'s output with a count by the chosen columns', () => {
    const built = grouped({ by: ['Action', 'Rule'], overTime: false });
    expect(built.kql.split('\n')).toEqual([
      'AZFWNetworkRule',
      '| where TimeGenerated > ago(24h)',
      '| summarize Count = count() by Action, Rule',
      '| top 100 by Count desc',
    ]);
    expect(built.reading).toBe('Rows of AZFWNetworkRule counted by Action and Rule in the last 24 hours, top 100 by Count.');
    expect(built.kind).toBe('top');
  });

  it('replaces a summary scenario\'s own summarize and keeps its filters', () => {
    expect(grouped({ by: ['Policy'], overTime: false }, 'denied').kql.split('\n')).toEqual([
      'AZFWNetworkRule',
      '| where TimeGenerated > ago(24h)',
      '| where Action == "Deny"',
      '| summarize Count = count() by Policy',
      '| top 20 by Count desc',
    ]);
  });

  it('draws a time chart, with or without columns', () => {
    expect(grouped({ by: [], overTime: true }).kql.split('\n').slice(2)).toEqual([
      '| summarize Count = count() by bin(TimeGenerated, 1h)',
      '| sort by TimeGenerated asc',
      '| render timechart',
    ]);
    expect(grouped({ by: ['Action'], overTime: true }).kql).toContain('| summarize Count = count() by Action, bin(TimeGenerated, 1h)');
    expect(grouped({ by: ['Action'], overTime: true }).reading).toBe(
      'Rows of AZFWNetworkRule counted by Action over time in the last 24 hours, in hourly buckets, drawn as a time chart.'
    );
  });

  it('drops the scenario\'s extend lines, which only fed its own projection', () => {
    const built = buildQuery({ ...start('entra-audit', 'changes'), group: { by: ['OperationName'], overTime: false } });
    expect(built.kql).not.toContain('extend');
  });

  it('refuses a column the table does not have and caps the list at four', () => {
    const built = grouped({ by: ['Nope', 'Action', 'Rule', 'Policy', 'Protocol', 'SourceIp'], overTime: false });
    expect(built.problems).toEqual([{ scope: 'group', message: 'AZFWNetworkRule has no column called Nope to count by.' }]);
    expect(built.kql).toContain('by Action, Rule, Policy\n');
  });
});

describe('where each line came from', () => {
  it('names the control behind every line', () => {
    const state = withFilters(start('azure-firewall', 'denied'), { column: 'SourceIp', op: 'eq', value: '10.0.0.4' });
    expect(buildQuery(state).lines.map((line) => line.source)).toEqual(['scenario', 'time', expect.stringMatching(/^filter:f\d+$/), 'filter:t0', 'scenario', 'limit']);
    expect(buildQuery({ ...state, group: { by: ['Rule'], overTime: true } }).lines.map((line) => line.source).slice(-3)).toEqual(['group', 'group', 'group']);
    expect(buildQuery(start('entra-audit', 'changes')).lines.map((line) => line.source)).toEqual(['scenario', 'time', 'scenario', 'scenario', 'scenario', 'scenario', 'limit']);
  });
});

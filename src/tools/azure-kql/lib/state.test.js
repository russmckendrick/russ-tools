import { describe, expect, it } from 'vitest';
import { EMPTY_STATE, portable, reducer, restore, scenarioState } from './state.js';

const shape = (state) => state.filters.map(({ column, op, value, preset }) => [column, op, value, Boolean(preset)]);
const run = (...actions) => actions.reduce(reducer, EMPTY_STATE);

describe('choosing a service and scenario', () => {
  it('opens a service on its first scenario with that scenario\'s filters', () => {
    expect(run({ type: 'service', service: 'vnet-flow-logs' })).toMatchObject({ service: 'vnet-flow-logs', scenario: 'flows', limit: '100' });
    expect(shape(run({ type: 'service', service: 'vnet-flow-logs' }))).toEqual([['SubType', 'eq', 'FlowLog', true]]);
  });

  it('sets the limit a summary wants, and the range a scenario asks for', () => {
    expect(scenarioState('azure-firewall', 'denied')).toMatchObject({ limit: '20' });
    expect(scenarioState('virtual-machines', 'last-seen').time).toEqual({ kind: 'relative', span: '7d' });
  });

  it('falls back to the first scenario for one it does not know, and to nothing for an unknown service', () => {
    expect(scenarioState('azure-firewall', 'no-such')).toMatchObject({ scenario: 'basic' });
    expect(scenarioState('no-such', 'basic')).toMatchObject({ service: '', scenario: '' });
  });

  it('carries the filters you added to the next scenario when its table has the column', () => {
    const state = run(
      { type: 'service', service: 'azure-firewall' },
      { type: 'filter-add', column: 'SourceIp' },
      { type: 'filter-add', column: 'Rule' },
      { type: 'scenario', scenario: 'denied' }
    );
    expect(shape(state)).toEqual([
      ['Action', 'eq', 'Deny', true],
      ['SourceIp', 'eq', '', false],
      ['Rule', 'eq', '', false],
    ]);
    expect(shape(reducer(state, { type: 'scenario', scenario: 'dns' }))).toEqual([['SourceIp', 'eq', '', false]]);
  });

  it('does not stack one scenario\'s own filters on the next', () => {
    const state = run({ type: 'service', service: 'azure-firewall' }, { type: 'scenario', scenario: 'denied' }, { type: 'scenario', scenario: 'basic' });
    expect(state.filters).toEqual([]);
  });
});

describe('editing', () => {
  const base = run({ type: 'service', service: 'azure-firewall' }, { type: 'filter-add', column: 'DestinationPort' });
  const [filter] = base.filters;

  it('adds a filter with the first operator its type offers', () => {
    expect(filter).toMatchObject({ column: 'DestinationPort', op: 'eq', value: '' });
    expect(reducer(base, { type: 'filter-add', column: 'Nope' })).toBe(base);
  });

  it('changes and removes a filter by id', () => {
    const changed = reducer(base, { type: 'filter-change', id: filter.id, patch: { op: 'gte', value: '1024' } });
    expect(changed.filters[0]).toMatchObject({ op: 'gte', value: '1024' });
    expect(reducer(changed, { type: 'filter-remove', id: filter.id }).filters).toEqual([]);
  });

  it('moves a built query into the editor', () => {
    expect(reducer(base, { type: 'edit-as-kql', kql: 'T | take 1' })).toMatchObject({ mode: 'kql', kql: 'T | take 1', service: 'azure-firewall' });
  });
});

describe('portable and restore', () => {
  it('round-trips a built state without ids', () => {
    const state = run({ type: 'service', service: 'key-vault' }, { type: 'scenario', scenario: 'denied' }, { type: 'time', time: { kind: 'portal' } });
    const copy = restore(JSON.parse(JSON.stringify(portable(state))));
    expect(shape(copy)).toEqual(shape(state));
    expect(copy).toMatchObject({ service: 'key-vault', scenario: 'denied', time: { kind: 'portal' }, limit: '100' });
  });

  it('keeps only the text of a hand-written query', () => {
    expect(portable({ ...EMPTY_STATE, mode: 'kql', kql: 'T', service: 'azure-firewall' })).toEqual({ mode: 'kql', kql: 'T' });
  });
});

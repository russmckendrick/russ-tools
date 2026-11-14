import { describe, expect, it } from 'vitest';
import { SCENARIO_COUNT, searchScenarios } from './search.js';

const keys = (query) => searchScenarios(query).map((entry) => `${entry.service.id}/${entry.scenario.id}`);

describe('searchScenarios', () => {
  it('returns the whole catalogue, in order, for an empty search', () => {
    expect(searchScenarios('')).toHaveLength(SCENARIO_COUNT);
    expect(keys('   ')[0]).toBe('azure-firewall/basic');
  });

  it('needs every word, in any order, across service, scenario, table and description', () => {
    expect(keys('sign-ins failed')[0]).toBe('entra-sign-ins/failed');
    expect(keys('failed sign-ins')).toEqual(keys('sign-ins failed'));
    expect(keys('waf').sort()).toEqual(['azure-application-gateway/waf', 'azure-application-gateway/waf-rules', 'azure-front-door/waf', 'azure-front-door/waf-rules']);
    expect(keys('AZFWDnsQuery')).toEqual(['azure-firewall/dns']);
    expect(keys('nothing matches this')).toEqual([]);
  });

  it('puts a match in the name ahead of a match in the description', () => {
    const found = keys('lockouts');
    expect(found[0]).toBe('windows-security-events/lockouts');
    expect(keys('throttled').slice(0, 2).sort()).toEqual(['cosmos-db/throttled', 'graph-activity/throttled']);
  });

  it('finds a service by its group', () => {
    expect(keys('microsoft 365').some((key) => key.startsWith('intune/'))).toBe(true);
  });
});

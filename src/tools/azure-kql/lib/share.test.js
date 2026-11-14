import { describe, expect, it } from 'vitest';
import { decompressConfig } from '@/core';
import { buildQuery } from './build.js';
import { fromShare, readShare, sharePayload, shareUrl } from './share.js';
import { EMPTY_STATE, scenarioState } from './state.js';

const state = {
  ...scenarioState('entra-sign-ins', 'failed', EMPTY_STATE),
  time: { kind: 'absolute', from: '2026-11-01T00:00', to: '2026-11-02T00:00' },
  limit: '250',
};
state.filters.push({ id: 'x', column: 'UserPrincipalName', op: 'endswith', value: '@contoso.com', value2: '' });
state.filters.push({ id: 'y', column: 'IPAddress', op: 'public', value: '', value2: '' });

describe('a share link', () => {
  it('uses the site codec on the tool\'s own path', () => {
    const url = shareUrl(state, 'https://russ.tools');
    expect(url).toMatch(/^https:\/\/russ\.tools\/azure-kql\?config=[A-Za-z0-9_-]+$/);
    expect(decompressConfig(new URL(url).searchParams.get('config'))).toEqual(sharePayload(state));
  });

  it('carries no filter ids', () => {
    expect(JSON.stringify(sharePayload(state))).not.toContain('"id"');
    expect(sharePayload(state)).toMatchObject({ v: 2, mode: 'build', service: 'entra-sign-ins', scenario: 'failed' });
  });

  it('restores to the same query', () => {
    const restored = readShare(new URL(shareUrl(state, 'https://russ.tools')).search);
    expect(buildQuery(restored).kql).toBe(buildQuery(state).kql);
    expect(restored.filters[0]).toMatchObject({ column: 'ResultType', preset: true });
  });

  it('carries a hand-written query', () => {
    const raw = { ...EMPTY_STATE, mode: 'kql', kql: 'Heartbeat\n| summarize count() by Computer' };
    expect(readShare(new URL(shareUrl(raw, 'https://russ.tools')).search)).toMatchObject({ mode: 'kql', kql: raw.kql });
  });
});

describe('fromShare', () => {
  it('refuses what is not a share payload', () => {
    expect(fromShare(null)).toBe(null);
    expect(fromShare('x')).toBe(null);
    expect(fromShare({ v: 2, mode: 'build', service: 'azure-firewall', scenario: 'no-such' })).toBe(null);
    expect(fromShare({ v: 2, mode: 'kql', kql: 5 })).toBe(null);
    expect(readShare('?other=1')).toBe(null);
    expect(readShare('?config=not-a-config')).toBe(null);
  });

  it('coerces a tampered payload into something the builder will check', () => {
    const restored = fromShare({
      v: 2,
      mode: 'build',
      service: 'azure-firewall',
      scenario: 'basic',
      time: { kind: 'relative', span: '1h) | take 1 //' },
      limit: { $gt: 1 },
      filters: [{ column: 'SourceIp', op: 'eq', value: '1.1.1.1" or true' }, 'x', { column: 7, op: [], value: {} }],
    });
    const built = buildQuery(restored);
    expect(built.kql.split('\n')).toEqual(['AZFWNetworkRule', '| where TimeGenerated > ago(24h)', '| top 100 by TimeGenerated desc']);
    expect(built.problems.length).toBeGreaterThan(0);
  });
});

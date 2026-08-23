import { describe, expect, it } from 'vitest';
import { lookupRouting, normalizeRoutingResource, summarizeRoutingStatus } from './ripestat.js';

describe('RIPEstat routing helpers', () => {
  it('normalizes ASNs, addresses and prefixes', () => {
    expect(normalizeRoutingResource('3333')).toEqual({ kind: 'asn', resource: 'AS3333' });
    expect(normalizeRoutingResource('AS65551')).toEqual({ kind: 'asn', resource: 'AS65551' });
    expect(normalizeRoutingResource('192.0.2.1')).toEqual({ kind: 'ip', resource: '192.0.2.1' });
    expect(normalizeRoutingResource('2001:db8::/32')).toEqual({ kind: 'prefix', resource: '2001:db8::/32' });
    expect(normalizeRoutingResource('example.com')).toBeNull();
  });

  it('summarizes routing status without inventing absent fields', () => {
    expect(summarizeRoutingStatus({ origins: [{ origin: 3333 }], visibility: { v4: { ris_peers_seeing: 10 } } })).toMatchObject({
      origins: [{ origin: 3333 }],
      visibility: { v4: { ris_peers_seeing: 10 } },
      firstSeen: null,
    });
  });

  it('validates every observed origin on a multi-origin prefix', async () => {
    const requests = [];
    const fetcher = async (url) => {
      requests.push(url);
      if (url.includes('/prefix-overview/')) return { status: 'ok', data: { resource: '192.0.2.0/24', announced: true, asns: [{ asn: 64496 }, { asn: 64497 }] } };
      if (url.includes('/routing-status/')) return { status: 'ok', data: { origins: [] } };
      const origin = Number(new URL(url).searchParams.get('resource').replace('AS', ''));
      return { status: 'ok', data: { status: origin === 64496 ? 'valid' : 'invalid_asn' } };
    };
    const result = await lookupRouting('192.0.2.0/24', { fetcher });
    expect(result.rpki).toEqual([
      expect.objectContaining({ origin: 64496, status: 'valid' }),
      expect.objectContaining({ origin: 64497, status: 'invalid_asn' }),
    ]);
    expect(requests.filter((url) => url.includes('/rpki-validation/'))).toHaveLength(2);
  });
});

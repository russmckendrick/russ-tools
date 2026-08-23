import { describe, expect, it } from 'vitest';
import { dnskeyDigest, dnskeyTag, inspectDnssec, matchDnskeysToDs } from './dnssec.js';

const key = {
  flags: 257,
  protocol: 3,
  algorithm: 8,
  publicKey: 'AwEAAQ==',
};

describe('DNSSEC calculations', () => {
  it('calculates a stable DNSKEY key tag', () => {
    expect(dnskeyTag(key)).toBe(1803);
  });

  it('calculates and matches a DS digest', async () => {
    const digest = await dnskeyDigest('example.com', key, 2);
    expect(digest).toMatch(/^[0-9A-F]{64}$/);
    const matches = await matchDnskeysToDs('example.com', [key], [{
      keyTag: dnskeyTag(key), algorithm: 8, digestType: 2, digest,
    }]);
    expect(matches).toHaveLength(1);
  });

  it('reports a healthy but unsigned delegation as informational', async () => {
    const query = async (name, type) => ({
      Status: 0,
      AD: false,
      Answer: type === 'NS'
        ? [{ type: 2, data: 'ns1.example.net.' }, { type: 2, data: 'ns2.example.net.' }]
        : type === 'SOA'
          ? [{ type: 6, data: 'ns1.example.net. hostmaster.example.net. 1 2 3 4 5' }]
          : type === 'A' && name.startsWith('ns')
            ? [{ type: 1, data: '192.0.2.1' }]
            : [],
    });
    const result = await inspectDnssec('example.com', { query });
    expect(result.status).toBe('info');
    expect(result.findings[0].title).toBe('Unsigned delegation');
  });

  it('does not label a validating SERVFAIL response as unsigned', async () => {
    const result = await inspectDnssec('example.com', {
      query: async () => ({ Status: 2, AD: false, Answer: [] }),
    });
    expect(result.status).toBe('error');
    expect(result.findings.map((item) => item.title)).toContain('A query returned SERVFAIL');
    expect(result.findings.map((item) => item.title)).not.toContain('Unsigned delegation');
  });
});

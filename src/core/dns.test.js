import { describe, expect, it } from 'vitest';
import {
  compareDnsResponses,
  decodeDnsText,
  dnsRcodeName,
  dnsTypeName,
  formatDnsRecord,
  normalizeDnsName,
  parseDnsRecord,
} from './dns.js';

describe('DNS helpers', () => {
  it('normalizes host names while keeping service labels', () => {
    expect(normalizeDnsName(' Example.COM. ')).toBe('example.com');
    expect(normalizeDnsName('_sip._tcp.example.com')).toBe('_sip._tcp.example.com');
    expect(normalizeDnsName('bad name.example')).toBeNull();
  });

  it('decodes joined TXT character strings', () => {
    expect(decodeDnsText('"v=spf1 include:example.net " "-all"')).toBe(
      'v=spf1 include:example.net -all'
    );
  });

  it('parses structured RDATA from the JSON data field', () => {
    expect(parseDnsRecord({ type: 15, data: '10 mail.example.com.' })).toMatchObject({
      typeName: 'MX',
      preference: 10,
      exchange: 'mail.example.com.',
    });
    expect(parseDnsRecord({ type: 33, data: '5 10 443 edge.example.com.' })).toMatchObject({
      priority: 5,
      weight: 10,
      port: 443,
      target: 'edge.example.com.',
    });
  });

  it('formats structured records without undefined fields', () => {
    expect(formatDnsRecord({ type: 15, TTL: 300, data: '10 mail.example.com.' })).toBe(
      '10 mail.example.com. · 300s'
    );
  });

  it('names response codes and compares answer sets without TTL noise', () => {
    expect(dnsRcodeName(3)).toBe('NXDOMAIN');
    expect(dnsTypeName(46)).toBe('RRSIG');
    expect(
      compareDnsResponses(
        { Answer: [{ type: 1, TTL: 30, data: '192.0.2.1' }] },
        { Answer: [{ type: 1, TTL: 300, data: '192.0.2.1' }] }
      ).equal
    ).toBe(true);
  });

  it('distinguishes empty answers with different response codes', () => {
    const comparison = compareDnsResponses({ Status: 3 }, { Status: 0 });
    expect(comparison).toMatchObject({
      equal: false,
      rcodeEqual: false,
      leftRcode: 'NXDOMAIN',
      rightRcode: 'NOERROR',
    });
  });

  it('preserves opaque RDATA case while normalizing domain names', () => {
    expect(compareDnsResponses(
      { Status: 0, Answer: [{ name: 'Example.COM.', type: 5, data: 'Edge.EXAMPLE.com.' }] },
      { Status: 0, Answer: [{ name: 'example.com.', type: 5, data: 'edge.example.COM.' }] }
    ).equal).toBe(true);
    expect(compareDnsResponses(
      { Status: 0, Answer: [{ name: 'example.com.', type: 16, data: '"CaseSensitive"' }] },
      { Status: 0, Answer: [{ name: 'example.com.', type: 16, data: '"casesensitive"' }] }
    ).equal).toBe(false);
    expect(compareDnsResponses(
      { Status: 0, Answer: [{ name: 'example.com.', type: 48, data: '257 3 8 AwEAAQ==' }] },
      { Status: 0, Answer: [{ name: 'example.com.', type: 48, data: '257 3 8 aweaaq==' }] }
    ).equal).toBe(false);
  });
});

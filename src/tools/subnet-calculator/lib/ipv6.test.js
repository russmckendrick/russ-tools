import { describe, it, expect } from 'vitest';
import {
  parseIPv6,
  compressIPv6,
  ipv6Details,
  ipv6Type,
  ipv6Ptr,
  parseIPv6Cidr,
} from './ipv6.js';

describe('parseIPv6', () => {
  it('parses full, compressed and mixed-case forms to the same value', () => {
    const full = parseIPv6('2001:0db8:0000:0000:0000:0000:0000:0001');
    expect(parseIPv6('2001:db8::1')).toBe(full);
    expect(parseIPv6('2001:DB8::1')).toBe(full);
  });

  it('parses :: and single-group compression', () => {
    expect(parseIPv6('::')).toBe(0n);
    expect(parseIPv6('::1')).toBe(1n);
    expect(parseIPv6('1::')).toBe(0x0001n << 112n);
    // `::` standing for exactly one zero group is accepted on parse
    // (RFC 5952 only forbids *generating* it).
    expect(parseIPv6('1:2:3:4:5:6:7::')).not.toBe(null);
  });

  it('parses an embedded IPv4 tail', () => {
    expect(parseIPv6('::ffff:192.0.2.1')).toBe((0xffffn << 32n) | 0xc0000201n);
  });

  it('rejects malformed input', () => {
    for (const bad of [
      '1::2::3',            // two ::
      '1:2:3:4:5:6:7:8:9',  // nine groups
      '1:2:3:4:5:6:7',      // seven groups, no ::
      '12345::',            // group too long
      'g::1',               // bad hex
      'fe80::1%eth0',       // zone id
      ':1:2:3:4:5:6:7',     // stray leading colon
      '::ffff:300.1.1.1',   // bad embedded v4
      '',
    ]) {
      expect(parseIPv6(bad), bad).toBe(null);
    }
  });
});

describe('compressIPv6 — RFC 5952 canonical form', () => {
  const canon = (s) => compressIPv6(parseIPv6(s));

  it('compresses the longest zero run', () => {
    expect(canon('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe('2001:db8::1');
  });

  it('picks the leftmost run on a tie', () => {
    expect(canon('2001:db8:0:0:1:0:0:1')).toBe('2001:db8::1:0:0:1');
  });

  it('never compresses a single zero group', () => {
    expect(canon('2001:db8:0:1:1:1:1:1')).toBe('2001:db8:0:1:1:1:1:1');
  });

  it('handles all-zero, leading and trailing runs', () => {
    expect(canon('::')).toBe('::');
    expect(canon('::1')).toBe('::1');
    expect(canon('1::')).toBe('1::');
  });

  it('lowercases and strips leading zeros', () => {
    expect(canon('2001:0DB8:0000:0000:0000:0000:0000:00A0')).toBe('2001:db8::a0');
  });
});

describe('ipv6Details', () => {
  it('computes the panel for 2001:db8:abcd:12::1/64', () => {
    const d = ipv6Details('2001:db8:abcd:12::1', 64);
    expect(d).toMatchObject({
      address: '2001:db8:abcd:12::1',
      cidr: '2001:db8:abcd:12::/64',
      networkAddress: '2001:db8:abcd:12::',
      lastAddress: '2001:db8:abcd:12:ffff:ffff:ffff:ffff',
      addressType: 'Documentation',
    });
    expect(d.totalAddresses).toBe(1n << 64n);
    expect(d.expandedAddress).toBe('2001:0db8:abcd:0012:0000:0000:0000:0001');
  });

  it('/128 is a single address', () => {
    const d = ipv6Details('2001:db8::1', 128);
    expect(d.totalAddresses).toBe(1n);
    expect(d.networkAddress).toBe('2001:db8::1');
    expect(d.lastAddress).toBe('2001:db8::1');
  });

  it('rejects bad prefixes', () => {
    expect(ipv6Details('2001:db8::1', 129)).toBe(null);
    expect(ipv6Details('not-an-ip', 64)).toBe(null);
  });
});

describe('ipv6Type', () => {
  const t = (s) => ipv6Type(parseIPv6(s));

  it('classifies the special ranges', () => {
    expect(t('::')).toBe('Unspecified (::)');
    expect(t('::1')).toBe('Loopback (::1)');
    expect(t('fe80::1')).toBe('Link-local');
    expect(t('fd12:3456::1')).toBe('Unique local (ULA)');
    expect(t('ff02::1')).toBe('Multicast');
    expect(t('2001:db8::5')).toBe('Documentation');
    expect(t('2a00:1450:4009::8')).toBe('Global unicast');
    expect(t('::ffff:192.0.2.1')).toBe('IPv4-mapped');
  });
});

describe('ipv6Ptr', () => {
  it('emits the reversed-nibble ip6.arpa name', () => {
    expect(ipv6Ptr(parseIPv6('2001:db8::1'))).toBe(
      '1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa'
    );
  });
});

describe('parseIPv6Cidr', () => {
  it('accepts address with and without a prefix', () => {
    expect(parseIPv6Cidr('2001:db8::/48')).toEqual({ address: '2001:db8::', prefix: 48 });
    expect(parseIPv6Cidr('2001:db8::1')).toEqual({ address: '2001:db8::1', prefix: null });
  });

  it('rejects junk', () => {
    expect(parseIPv6Cidr('2001:db8::/129')).toBe(null);
    expect(parseIPv6Cidr('2001:db8::/64/2')).toBe(null);
  });
});

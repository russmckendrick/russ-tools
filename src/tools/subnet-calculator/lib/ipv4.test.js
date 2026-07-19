import { describe, it, expect } from 'vitest';
import {
  parseIPv4,
  formatIPv4,
  maskFromPrefix,
  ipv4Details,
  ipv4Class,
  ipv4Type,
  parseIPv4Cidr,
} from './ipv4.js';

describe('parseIPv4 / formatIPv4', () => {
  it('round-trips ordinary addresses', () => {
    for (const ip of ['0.0.0.0', '10.0.0.1', '192.168.1.254', '255.255.255.255']) {
      expect(formatIPv4(parseIPv4(ip))).toBe(ip);
    }
  });

  it('rejects malformed input', () => {
    for (const bad of ['10.0.0', '10.0.0.0.0', '256.1.1.1', '10.0.0.x', '10..0.0', '', ' ', '10,0,0,0']) {
      expect(parseIPv4(bad)).toBe(null);
    }
  });
});

describe('ipv4Details', () => {
  it('computes the full panel for 192.168.1.130/25', () => {
    const d = ipv4Details('192.168.1.130', 25);
    expect(d).toMatchObject({
      cidr: '192.168.1.128/25',
      networkAddress: '192.168.1.128',
      broadcastAddress: '192.168.1.255',
      firstHost: '192.168.1.129',
      lastHost: '192.168.1.254',
      totalAddresses: 128,
      usableHosts: 126,
      netmask: '255.255.255.128',
      wildcardMask: '0.0.0.127',
      ipClass: 'C',
      addressType: 'Private (RFC 1918)',
      ptr: '130.1.168.192.in-addr.arpa',
    });
    expect(d.binaryNetmask).toBe('11111111.11111111.11111111.10000000');
    expect(d.hexAddress).toBe('0xC0A80182');
  });

  it('/31 is RFC 3021: two usable hosts, no broadcast', () => {
    const d = ipv4Details('10.0.0.0', 31);
    expect(d.usableHosts).toBe(2);
    expect(d.broadcastAddress).toBe(null);
    expect(d.firstHost).toBe('10.0.0.0');
    expect(d.lastHost).toBe('10.0.0.1');
  });

  it('/32 is a single host', () => {
    const d = ipv4Details('10.0.0.5', 32);
    expect(d.usableHosts).toBe(1);
    expect(d.firstHost).toBe('10.0.0.5');
    expect(d.broadcastAddress).toBe(null);
  });

  it('/0 spans everything without overflowing', () => {
    const d = ipv4Details('1.2.3.4', 0);
    expect(d.networkAddress).toBe('0.0.0.0');
    expect(d.broadcastAddress).toBe('255.255.255.255');
    expect(d.totalAddresses).toBe(2 ** 32);
    expect(maskFromPrefix(0)).toBe(0);
  });

  it('rejects bad input', () => {
    expect(ipv4Details('300.0.0.1', 24)).toBe(null);
    expect(ipv4Details('10.0.0.1', 33)).toBe(null);
    expect(ipv4Details('10.0.0.1', -1)).toBe(null);
  });
});

describe('classification', () => {
  it('classful letters', () => {
    expect(ipv4Class(parseIPv4('10.0.0.1'))).toBe('A');
    expect(ipv4Class(parseIPv4('172.16.0.1'))).toBe('B');
    expect(ipv4Class(parseIPv4('192.168.0.1'))).toBe('C');
    expect(ipv4Class(parseIPv4('224.0.0.1'))).toBe('D');
    expect(ipv4Class(parseIPv4('250.0.0.1'))).toBe('E');
  });

  it('special-use ranges', () => {
    expect(ipv4Type(parseIPv4('127.0.0.1'))).toBe('Loopback');
    expect(ipv4Type(parseIPv4('172.31.255.1'))).toBe('Private (RFC 1918)');
    expect(ipv4Type(parseIPv4('172.32.0.1'))).toBe('Public');
    expect(ipv4Type(parseIPv4('100.64.0.1'))).toBe('Shared / CGN (RFC 6598)');
    expect(ipv4Type(parseIPv4('169.254.10.10'))).toBe('Link-local (APIPA)');
    expect(ipv4Type(parseIPv4('203.0.113.7'))).toBe('Documentation');
    expect(ipv4Type(parseIPv4('8.8.8.8'))).toBe('Public');
    expect(ipv4Type(parseIPv4('255.255.255.255'))).toBe('Limited broadcast');
  });
});

describe('parseIPv4Cidr', () => {
  it('accepts address with and without a prefix', () => {
    expect(parseIPv4Cidr('10.0.0.0/24')).toEqual({ address: '10.0.0.0', prefix: 24 });
    expect(parseIPv4Cidr('10.0.0.1')).toEqual({ address: '10.0.0.1', prefix: null });
  });

  it('rejects junk', () => {
    expect(parseIPv4Cidr('10.0.0.0/33')).toBe(null);
    expect(parseIPv4Cidr('10.0.0.0/24/8')).toBe(null);
    expect(parseIPv4Cidr('banana/24')).toBe(null);
  });
});

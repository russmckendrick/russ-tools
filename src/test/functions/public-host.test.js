import { describe, it, expect } from 'vitest';
import {
  TargetRefused,
  isPublicAddress,
  parseIPv4,
  parseIPv6,
  parseTarget,
} from '../../../functions-lib/public-host.js';

const refusal = (input) => {
  try {
    parseTarget(input);
    return null;
  } catch (error) {
    expect(error).toBeInstanceOf(TargetRefused);
    return error.code;
  }
};

describe('parseTarget accepts public web addresses', () => {
  it.each([
    ['example.com', 'https://example.com/'],
    ['  Example.COM  ', 'https://example.com/'],
    ['https://example.com/path?x=1#frag', 'https://example.com/path?x=1'],
    ['http://example.com', 'http://example.com/'],
    ['http://example.com:80/', 'http://example.com/'],
    ['https://example.com:443/a', 'https://example.com/a'],
    ['example.com:443', 'https://example.com/'],
    ['http://example.com:443/', 'http://example.com:443/'],
    ['sub.example.co.uk/login', 'https://sub.example.co.uk/login'],
    ['https://bücher.example/', null],
    ['https://bücher.de/', 'https://xn--bcher-kva.de/'],
    ['example.com.', 'https://example.com./'],
  ])('%s', (input, expected) => {
    if (expected === null) {
      expect(refusal(input)).toBe('blocked_host');
      return;
    }
    expect(parseTarget(input).href).toBe(expected);
  });
});

describe('parseTarget refuses everything that is not a public http(s) host on 80 or 443', () => {
  it.each([
    ['', 'invalid_url'],
    ['   ', 'invalid_url'],
    ['http://', 'invalid_url'],
    ['https://exa mple.com', 'invalid_url'],
    [`https://example.com/${'a'.repeat(2100)}`, 'invalid_url'],
    ['ftp://example.com/', 'blocked_scheme'],
    ['file:///etc/passwd', 'blocked_scheme'],
    ['gopher://example.com/', 'blocked_scheme'],
    ['javascript:alert(1)', 'blocked_scheme'],
    ['data:text/html,hi', 'blocked_scheme'],
    ['ws://example.com/', 'blocked_scheme'],
    ['https://user:secret@example.com/', 'blocked_credentials'],
    ['https://user@example.com/', 'blocked_credentials'],
    ['user@example.com', 'blocked_credentials'],
    ['https://example.com:8443/', 'blocked_port'],
    ['http://example.com:8080/', 'blocked_port'],
    ['example.com:22', 'blocked_port'],
    ['localhost:8788', 'blocked_port'],
    ['https://example.com:6379/', 'blocked_port'],
  ])('%s → %s', (input, code) => {
    expect(refusal(input)).toBe(code);
  });

  it.each([
    'http://127.0.0.1',
    'http://127.0.0.1/',
    'https://127.1.2.3/',
    'http://0.0.0.0/',
    'http://10.0.0.1/',
    'http://10.255.255.255/',
    'http://172.16.0.1/',
    'http://172.31.255.255/',
    'http://192.168.1.1/',
    'http://169.254.169.254',
    'http://169.254.169.254/latest/meta-data/',
    'http://100.64.0.1/',
    'http://100.100.100.200/',
    'http://192.0.0.192/',
    'http://224.0.0.1/',
    'http://255.255.255.255/',
    'http://[::1]/',
    'http://[::]/',
    'http://[fd00:ec2::254]/',
    'http://[fc00::1]/',
    'http://[fe80::1]/',
    'http://[::ffff:127.0.0.1]/',
    'http://[::ffff:10.0.0.1]/',
    'http://[64:ff9b::7f00:1]/',
    'http://[2002:7f00:1::]/',
    '127.0.0.1',
    '10.0.0.1',
    '[::1]',
  ])('refuses the internal address %s', (input) => {
    expect(refusal(input)).toBe('blocked_address');
  });

  it.each([
    ['http://2130706433/', 'decimal'],
    ['http://0x7f000001/', 'hex'],
    ['http://0x7f.0.0.1/', 'hex octet'],
    ['http://0177.0.0.1/', 'octal'],
    ['http://127.1/', 'short form'],
    ['http://0/', 'zero'],
    ['http://%31%32%37.0.0.1/', 'percent-encoded'],
    ['http://１２７.０.０.１/', 'full-width digits'],
  ])('refuses 127.0.0.1 written as %s (%s)', (input) => {
    expect(refusal(input)).toBe('blocked_address');
  });

  it.each(['http://8.8.8.8/', 'https://1.1.1.1/', 'http://[2606:4700:4700::1111]/'])(
    'refuses the public IP literal %s too: only hostnames are fetched',
    (input) => {
      expect(refusal(input)).toBe('blocked_address');
    }
  );

  it.each([
    'http://localhost/',
    'http://LOCALHOST/',
    'http://localhost./',
    'http://app.localhost/',
    'http://printer.local/',
    'http://db.internal/',
    'http://metadata.google.internal/computeMetadata/v1/',
    'http://metadata/',
    'http://instance-data/',
    'http://router.lan/',
    'http://nas.home/',
    'http://intranet.corp/',
    'http://host.home.arpa/',
    'http://1.0.0.127.in-addr.arpa/',
    'http://service.localdomain/',
    'http://example.onion/',
    'http://site.test/',
    'http://intranet/',
    'http://kubernetes/',
  ])('refuses the internal name %s', (input) => {
    expect(refusal(input)).toBe('blocked_host');
  });
});

describe('isPublicAddress', () => {
  it.each(['8.8.8.8', '1.1.1.1', '93.184.215.14', '172.15.255.255', '172.32.0.1', '100.63.255.255', '100.128.0.1', '2606:4700:4700::1111', '2a00:1450:4009:81f::200e'])(
    'treats %s as public',
    (address) => {
      expect(isPublicAddress(address)).toBe(true);
    }
  );

  it.each([
    '0.0.0.0',
    '10.1.2.3',
    '100.64.0.1',
    '100.127.255.255',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.0.0.1',
    '192.0.2.1',
    '192.88.99.1',
    '192.168.0.1',
    '198.18.0.1',
    '198.19.255.255',
    '198.51.100.1',
    '203.0.113.1',
    '224.0.0.1',
    '240.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    '::ffff:8.8.8.8',
    '64:ff9b::808:808',
    '100::1',
    '2001::1',
    '2001:db8::1',
    '2002:808:808::1',
    '3fff::1',
    'fc00::1',
    'fd12:3456:789a::1',
    'fe80::1',
    'fec0::1',
    'ff02::1',
    'not-an-address',
    '',
  ])('treats %s as not public', (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });
});

describe('address parsers', () => {
  it('reads dotted quads only', () => {
    expect(parseIPv4('192.168.1.1')).toBe(0xc0a80101);
    expect(parseIPv4('256.1.1.1')).toBe(null);
    expect(parseIPv4('1.2.3')).toBe(null);
    expect(parseIPv4('1.2.3.4.5')).toBe(null);
  });

  it('expands IPv6, including an embedded IPv4 tail', () => {
    expect(parseIPv6('::1')).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
    expect(parseIPv6('[2001:db8::1]')).toEqual([0x2001, 0xdb8, 0, 0, 0, 0, 0, 1]);
    expect(parseIPv6('::ffff:10.0.0.1')).toEqual([0, 0, 0, 0, 0, 0xffff, 0x0a00, 0x0001]);
    expect(parseIPv6('1:2:3:4:5:6:7:8')).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(parseIPv6('1:2:3:4:5:6:7')).toBe(null);
    expect(parseIPv6('1::2::3')).toBe(null);
    expect(parseIPv6('example.com')).toBe(null);
  });
});

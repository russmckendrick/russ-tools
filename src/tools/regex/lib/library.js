const OCTET = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
const H16 = '[0-9a-f]{1,4}';
const LABEL = '[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?';

const IPV6 = [
  `(?:${H16}:){7}${H16}`,
  `(?:${H16}:){1,7}:`,
  `(?:${H16}:){1,6}:${H16}`,
  `(?:${H16}:){1,5}(?::${H16}){1,2}`,
  `(?:${H16}:){1,4}(?::${H16}){1,3}`,
  `(?:${H16}:){1,3}(?::${H16}){1,4}`,
  `(?:${H16}:){1,2}(?::${H16}){1,5}`,
  `${H16}:(?::${H16}){1,6}`,
  `:(?:(?::${H16}){1,7}|:)`,
].join('|');

export const PATTERNS = [
  {
    id: 'ipv4',
    name: 'IPv4 address',
    pattern: `^(?:${OCTET}\\.){3}${OCTET}$`,
    flags: 'gm',
    note: 'Four octets from 0 to 255, with no leading zeros.',
    good: ['0.0.0.0', '10.0.0.1', '192.168.1.254', '255.255.255.255'],
    bad: ['256.1.1.1', '1.2.3', '1.2.3.4.5', '01.2.3.4', '1.2.3.4/24', '1.2.3.'],
  },
  {
    id: 'ipv6',
    name: 'IPv6 address',
    pattern: `^(?:${IPV6})$`,
    flags: 'gim',
    note: 'Full and :: compressed forms. Does not accept an embedded IPv4 tail (::ffff:192.0.2.1) or a zone (%eth0).',
    good: [
      '::',
      '::1',
      '2001:db8::',
      '2001:db8::1',
      '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      'FE80::1FF:FE23:4567:890A',
      '1:2:3:4:5:6:7::',
      '::2:3:4:5:6:7:8',
    ],
    bad: ['2001:db8', '2001:db8:::1', '1:2:3:4:5:6:7:8:9', '12345::', '2001:db8::g', '1::2::3', '::ffff:192.0.2.1', ':1'],
  },
  {
    id: 'cidr',
    name: 'IPv4 CIDR block',
    pattern: `^(?:${OCTET}\\.){3}${OCTET}/(?:3[0-2]|[12]?\\d)$`,
    flags: 'gm',
    note: 'An IPv4 address and a prefix from 0 to 32. It does not check that the host bits are zero.',
    good: ['10.0.0.0/8', '192.168.1.0/24', '0.0.0.0/0', '10.1.2.3/32'],
    bad: ['10.0.0.0/33', '10.0.0.0', '10.0.0/24', '10.0.0.0/08', '10.0.0.0/', '300.0.0.0/8'],
  },
  {
    id: 'mac',
    name: 'MAC address',
    pattern: '^(?:[0-9a-f]{2}([:-])(?:[0-9a-f]{2}\\1){4}[0-9a-f]{2}|(?:[0-9a-f]{4}\\.){2}[0-9a-f]{4})$',
    flags: 'gim',
    note: 'Colon, hyphen or Cisco dotted notation. The back-reference makes the separator consistent.',
    good: ['00:1A:2B:3C:4D:5E', '00-1a-2b-3c-4d-5e', '001a.2b3c.4d5e'],
    bad: ['00:1A:2B:3C:4D', '00:1A-2B:3C:4D:5E', '00:1A:2B:3C:4D:5G', '00:1A:2B:3C:4D:5E:6F', '001a.2b3c'],
  },
  {
    id: 'guid',
    name: 'GUID / UUID',
    pattern: '^(?:\\{[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\\}|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})$',
    flags: 'gim',
    note: 'Hyphenated, with or without a matched pair of braces. Any version.',
    good: [
      'b24988ac-6180-42a0-ab88-20f7382dd24c',
      'B24988AC-6180-42A0-AB88-20F7382DD24C',
      '{017f22e2-79b0-7cc3-98c4-dc0c0c07398f}',
    ],
    bad: [
      'b24988ac-6180-42a0-ab88-20f7382dd24',
      'b24988ac618042a0ab8820f7382dd24c',
      'g24988ac-6180-42a0-ab88-20f7382dd24c',
      '{b24988ac-6180-42a0-ab88-20f7382dd24c',
      'b24988ac-6180-42a0-ab88-20f7382dd24c-00',
    ],
  },
  {
    id: 'fqdn',
    name: 'Fully qualified domain name',
    pattern: `^(?=.{1,253}\\.?$)(?:${LABEL}\\.)+(?:[a-z]{2,63}|xn--[a-z0-9]{1,59})\\.?$`,
    flags: 'gim',
    note: 'ASCII names only: write an internationalised name in its xn-- form. Labels of 1 to 63 characters, 253 in all.',
    good: ['example.com', 'sub.example.co.uk', 'xn--mnchen-3ya.de', 'a-b.example.org', 'example.com.', 'example.xn--p1ai'],
    bad: [
      'example',
      '-bad.example.com',
      'bad-.example.com',
      'exa_mple.com',
      'example..com',
      'example.c',
      `${'a'.repeat(64)}.example.com`,
      'example.com/path',
    ],
  },
  {
    id: 'email',
    name: 'Email address',
    pattern: `^[a-z0-9.!#$%&'*+/=?^_\`{|}~-]+@${LABEL}(?:\\.${LABEL})+$`,
    flags: 'gim',
    note: 'The pattern browsers use for an email field, plus a required dot in the domain. It checks the shape, not that the mailbox exists.',
    good: ['user@example.com', 'first.last+tag@sub.example.co.uk', "o'brien@example.ie", 'ops_team@example-host.net'],
    bad: [
      'user@',
      '@example.com',
      'user@example',
      'user name@example.com',
      'user@-example.com',
      'user@@example.com',
      'user@example..com',
    ],
  },
  {
    id: 'iso8601',
    name: 'ISO 8601 date',
    pattern:
      '^(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\\d|3[01])' +
      '(?:T(?<time>(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?)(?<offset>Z|[+-](?:[01]\\d|2[0-3]):?[0-5]\\d)?)?$',
    flags: 'gm',
    note: 'A calendar date, optionally with a time and an offset. It checks the shape only, so 2026-02-31 passes.',
    good: ['2026-11-14', '2026-11-14T10:13:30Z', '2026-11-14T10:13:30.123+05:30', '2026-11-14T10:13', '2026-11-14T23:59:59-0800'],
    bad: [
      '2026-13-01',
      '2026-11-32',
      '14/11/2026',
      '2026-11-14 10:13:30',
      '2026-11-14T24:00:00Z',
      '2026-11-14T10:13:30+5',
      '26-11-14',
    ],
  },
];

export const PATTERNS_BY_ID = Object.fromEntries(PATTERNS.map((entry) => [entry.id, entry]));

export function sampleFor(entry) {
  const lines = [];
  const length = Math.max(entry.good.length, entry.bad.length);
  for (let i = 0; i < length; i++) {
    if (entry.good[i] !== undefined) lines.push(entry.good[i]);
    if (entry.bad[i] !== undefined) lines.push(entry.bad[i]);
  }
  return lines.join('\n');
}

export const STARTER = {
  id: 'access-log',
  name: 'Access log line',
  pattern:
    '^(?<ip>\\d{1,3}(?:\\.\\d{1,3}){3}) \\S+ (?<user>\\S+) \\[(?<time>[^\\]]+)\\] "(?<method>[A-Z]+) (?<path>\\S+)[^"]*" (?<status>\\d{3})',
  flags: 'gm',
  text: [
    '203.0.113.7 - alice [14/Nov/2026:10:13:30 +0000] "GET /api/v1/subnets?cidr=10.0.0.0/22 HTTP/1.1" 200 512',
    '198.51.100.24 - - [14/Nov/2026:10:13:31 +0000] "POST /login HTTP/1.1" 401 87',
    'worker restarted, pid 4411',
    '192.0.2.61 - bob [14/Nov/2026:10:13:35 +0000] "DELETE /api/v1/zones/example.com HTTP/1.1" 204 0',
  ].join('\n'),
  replacement: '$<status> $<method> $<path> from $<ip>',
};

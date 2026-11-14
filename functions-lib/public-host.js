const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const ALLOWED_PORTS = new Set(['', '80', '443']);

const BLOCKED_NAMES = new Set(['localhost', 'metadata', 'instance-data', 'broadcasthost']);
const BLOCKED_SUFFIXES = [
  'localhost',
  'local',
  'internal',
  'localdomain',
  'lan',
  'home',
  'corp',
  'intranet',
  'private',
  'home.arpa',
  'arpa',
  'onion',
  'test',
  'invalid',
  'example',
];

const LABEL = '[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9])?';
const PUBLIC_NAME = new RegExp(`^(?:${LABEL}\\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$`);

const V4_BLOCKED = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

const V6_BLOCKED = [
  ['2001::', 23],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['3fff::', 20],
];

export class TargetRefused extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'TargetRefused';
    this.code = code;
  }
}

export function parseIPv4(text) {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(text);
  if (!match) return null;
  const octets = match.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) return null;
  return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
}

export function parseIPv6(text) {
  let source = text.replace(/^\[|\]$/g, '').split('%')[0].toLowerCase();
  if (!/^[0-9a-f:.]+$/.test(source) || !source.includes(':')) return null;

  const tail = /(^|:)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(source);
  if (tail) {
    const v4 = parseIPv4(tail[2]);
    if (v4 === null) return null;
    source = `${source.slice(0, tail.index)}${tail[1]}${(v4 >>> 16).toString(16)}:${(v4 & 0xffff).toString(16)}`;
  }

  const halves = source.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const gap = 8 - head.length - rest.length;
  if (halves.length === 1 ? gap !== 0 : gap < 1) return null;

  const groups = [...head, ...Array(halves.length === 2 ? gap : 0).fill('0'), ...rest];
  if (groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) return null;
  return groups.map((group) => parseInt(group, 16));
}

function v4InRange(value, [base, prefix]) {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (value & mask) >>> 0 === (parseIPv4(base) & mask) >>> 0;
}

function v6InRange(groups, [base, prefix]) {
  const start = parseIPv6(base);
  for (let bit = 0; bit < prefix; bit += 16) {
    const width = Math.min(16, prefix - bit);
    const mask = (0xffff << (16 - width)) & 0xffff;
    if ((groups[bit / 16] & mask) !== (start[bit / 16] & mask)) return false;
  }
  return true;
}

export function isPublicAddress(text) {
  const v4 = parseIPv4(text);
  if (v4 !== null) return !V4_BLOCKED.some((range) => v4InRange(v4, range));

  const v6 = parseIPv6(text);
  if (v6 === null) return false;
  if ((v6[0] & 0xe000) !== 0x2000) return false;
  return !V6_BLOCKED.some((range) => v6InRange(v6, range));
}

export function isIpLiteral(hostname) {
  return hostname.startsWith('[') || parseIPv4(hostname) !== null || /^[\d.]+$/.test(hostname);
}

export function parseTarget(input) {
  const raw = String(input ?? '').trim();
  if (!raw) throw new TargetRefused('invalid_url', 'Enter a URL or a hostname');
  if (raw.length > 2048) throw new TargetRefused('invalid_url', 'That URL is too long');

  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) && !/^[^/?#]+:\d+(?:[/?#]|$)/.test(raw);
  let url;
  try {
    url = new URL(hasScheme ? raw : `https://${raw}`);
  } catch {
    throw new TargetRefused('invalid_url', 'That is not a URL or a hostname');
  }

  assertPublicUrl(url);
  url.hash = '';
  return url;
}

export function assertPublicUrl(url) {
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new TargetRefused('blocked_scheme', 'Only http and https URLs are checked');
  }
  if (url.username || url.password) {
    throw new TargetRefused('blocked_credentials', 'URLs that carry a username or password are not checked');
  }
  if (!ALLOWED_PORTS.has(url.port)) {
    throw new TargetRefused('blocked_port', 'Only ports 80 and 443 are checked');
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!hostname) throw new TargetRefused('invalid_url', 'That URL has no hostname');

  if (isIpLiteral(hostname)) {
    throw new TargetRefused(
      'blocked_address',
      isPublicAddress(hostname.replace(/^\[|\]$/g, ''))
        ? 'IP addresses are not checked: enter a hostname'
        : 'Loopback, private, link-local and metadata addresses are not checked'
    );
  }

  if (
    BLOCKED_NAMES.has(hostname) ||
    BLOCKED_SUFFIXES.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`))
  ) {
    throw new TargetRefused('blocked_host', 'Local and internal hostnames are not checked');
  }

  if (hostname.length > 253 || !PUBLIC_NAME.test(hostname)) {
    throw new TargetRefused('blocked_host', 'Only public hostnames are checked');
  }
}

/**
 * IPv4 subnet arithmetic. Pure, dependency-free — unsigned 32-bit values via
 * `>>> 0` throughout (JS bitwise ops are signed 32-bit, so every masking
 * expression re-coerces).
 */

/** @param {string} str dotted quad @returns {number|null} unsigned 32-bit */
export function parseIPv4(str) {
  if (typeof str !== 'string') return null;
  const parts = str.trim().split('.');
  if (parts.length !== 4) return null;

  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = ((value << 8) | octet) >>> 0;
  }
  return value;
}

/** @param {number} n @returns {string} dotted quad */
export function formatIPv4(n) {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

/** @param {number} prefix 0–32 @returns {number} unsigned mask */
export function maskFromPrefix(prefix) {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

/** @param {number} n @returns {string} dotted binary, octets separated */
export function toBinaryOctets(n) {
  return formatIPv4(n)
    .split('.')
    .map((o) => Number(o).toString(2).padStart(8, '0'))
    .join('.');
}

const CLASS_RANGES = [
  ['A', 0b0000],
  ['B', 0b1000],
  ['C', 0b1100],
  ['D', 0b1110],
  ['E', 0b1111],
];

/** Classful letter for an address — informational only, like the reference calculators. */
export function ipv4Class(addr) {
  const top = addr >>> 28;
  for (let i = CLASS_RANGES.length - 1; i >= 0; i--) {
    const [letter, pattern] = CLASS_RANGES[i];
    const bits = i === 0 ? 1 : i === 1 ? 2 : i === 2 ? 3 : 4;
    if (top >>> (4 - bits) === pattern >>> (4 - bits)) return letter;
  }
  return 'A';
}

/** @param {number} addr @param {number} prefix @param {number} mask */
const inBlock = (addr, block, prefix) =>
  (addr & maskFromPrefix(prefix)) >>> 0 === block >>> 0;

/** First matching special-use classification, else Public. */
export function ipv4Type(addr) {
  const b = (ip, prefix) => inBlock(addr, parseIPv4(ip), prefix);

  if (addr === 0xffffffff) return 'Limited broadcast';
  if (b('0.0.0.0', 8)) return '"This network" (RFC 791)';
  if (b('127.0.0.0', 8)) return 'Loopback';
  if (b('10.0.0.0', 8) || b('172.16.0.0', 12) || b('192.168.0.0', 16)) return 'Private (RFC 1918)';
  if (b('100.64.0.0', 10)) return 'Shared / CGN (RFC 6598)';
  if (b('169.254.0.0', 16)) return 'Link-local (APIPA)';
  if (b('192.0.2.0', 24) || b('198.51.100.0', 24) || b('203.0.113.0', 24)) return 'Documentation';
  if (b('198.18.0.0', 15)) return 'Benchmarking (RFC 2544)';
  if (b('224.0.0.0', 4)) return 'Multicast';
  if (b('240.0.0.0', 4)) return 'Reserved (Class E)';
  return 'Public';
}

/**
 * Everything the details panel shows for one IPv4 address + prefix.
 * /31 follows RFC 3021 (two usable hosts, no broadcast); /32 is one host.
 *
 * @param {string} addressStr
 * @param {number} prefix 0–32
 */
export function ipv4Details(addressStr, prefix) {
  const addr = parseIPv4(addressStr);
  if (addr === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) return null;

  const mask = maskFromPrefix(prefix);
  const network = (addr & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const total = 2 ** (32 - prefix);

  let usable;
  let firstHost;
  let lastHost;
  let broadcastOut;
  if (prefix >= 32) {
    usable = 1;
    firstHost = network;
    lastHost = network;
    broadcastOut = null;
  } else if (prefix === 31) {
    usable = 2;
    firstHost = network;
    lastHost = broadcast;
    broadcastOut = null;
  } else {
    usable = total - 2;
    firstHost = (network + 1) >>> 0;
    lastHost = (broadcast - 1) >>> 0;
    broadcastOut = broadcast;
  }

  return {
    address: formatIPv4(addr),
    prefix,
    cidr: `${formatIPv4(network)}/${prefix}`,
    networkAddress: formatIPv4(network),
    broadcastAddress: broadcastOut === null ? null : formatIPv4(broadcastOut),
    firstHost: formatIPv4(firstHost),
    lastHost: formatIPv4(lastHost),
    totalAddresses: total,
    usableHosts: usable,
    netmask: formatIPv4(mask),
    wildcardMask: formatIPv4(~mask >>> 0),
    binaryAddress: toBinaryOctets(addr),
    binaryNetmask: toBinaryOctets(mask),
    hexAddress: '0x' + addr.toString(16).toUpperCase().padStart(8, '0'),
    integerAddress: addr,
    ipClass: ipv4Class(addr),
    addressType: ipv4Type(addr),
    ptr: `${formatIPv4(addr).split('.').reverse().join('.')}.in-addr.arpa`,
  };
}

/** "10.0.0.0/24" | "10.0.0.1" → { address, prefix|null } | null */
export function parseIPv4Cidr(input) {
  const trimmed = String(input ?? '').trim();
  const [addressPart, prefixPart, ...rest] = trimmed.split('/');
  if (rest.length > 0) return null;

  const addr = parseIPv4(addressPart);
  if (addr === null) return null;

  if (prefixPart === undefined) return { address: addressPart.trim(), prefix: null };
  if (!/^\d{1,2}$/.test(prefixPart)) return null;
  const prefix = Number(prefixPart);
  if (prefix > 32) return null;
  return { address: addressPart.trim(), prefix };
}

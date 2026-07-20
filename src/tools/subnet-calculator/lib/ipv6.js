/**
 * IPv6 subnet arithmetic on BigInt (addresses are 128-bit; Number cannot
 * carry them). Hand-rolled rather than a dependency: the tool needs parse,
 * canonical formatting and prefix maths — not zones, not transition tech —
 * and the suite pins the RFC 5952 edge cases a library would otherwise be
 * bought for.
 */

const BITS = 128n;
const MAX = (1n << 128n) - 1n;

/**
 * Parse any textual IPv6 form: full, `::`-compressed, mixed case, and an
 * embedded IPv4 tail (`::ffff:192.0.2.1`). Zone ids (`%eth0`) are rejected.
 *
 * @param {string} str
 * @returns {bigint|null}
 */
export function parseIPv6(str) {
  if (typeof str !== 'string') return null;
  const input = str.trim().toLowerCase();
  if (input.includes('%')) return null;
  if (input.length === 0) return null;

  const doubleColons = input.split('::');
  if (doubleColons.length > 2) return null;

  const toGroups = (part) => {
    if (part === '') return [];
    const rawGroups = part.split(':');
    if (rawGroups.some((g) => g === '')) return null;

    const groups = [];
    for (let i = 0; i < rawGroups.length; i++) {
      const g = rawGroups[i];
      if (i === rawGroups.length - 1 && g.includes('.')) {
        // Embedded IPv4 tail becomes the final two groups.
        const parts = g.split('.');
        if (parts.length !== 4) return null;
        let v4 = 0;
        for (const p of parts) {
          if (!/^\d{1,3}$/.test(p) || Number(p) > 255) return null;
          v4 = v4 * 256 + Number(p);
        }
        groups.push((v4 >>> 16) & 0xffff, v4 & 0xffff);
      } else {
        if (!/^[0-9a-f]{1,4}$/.test(g)) return null;
        groups.push(parseInt(g, 16));
      }
    }
    return groups;
  };

  let groups;
  if (doubleColons.length === 2) {
    const left = toGroups(doubleColons[0]);
    const right = toGroups(doubleColons[1]);
    if (left === null || right === null) return null;
    const fill = 8 - left.length - right.length;
    // `::` stands for at least one zero group.
    if (fill < 1) return null;
    groups = [...left, ...Array(fill).fill(0), ...right];
  } else {
    groups = toGroups(input);
    if (groups === null || groups.length !== 8) return null;
  }

  let value = 0n;
  for (const g of groups) value = (value << 16n) | BigInt(g);
  return value;
}

/** @param {bigint} value @returns {string} full 8-group form, zero-padded */
export function expandIPv6(value) {
  const groups = [];
  for (let i = 7n; i >= 0n; i--) {
    groups.push(((value >> (i * 16n)) & 0xffffn).toString(16).padStart(4, '0'));
  }
  return groups.join(':');
}

/**
 * RFC 5952 canonical text: lowercase, no leading zeros, and the longest run
 * of two-or-more zero groups compressed to `::` (leftmost run on a tie — a
 * single zero group is never compressed).
 *
 * @param {bigint} value
 * @returns {string}
 */
export function compressIPv6(value) {
  const groups = [];
  for (let i = 7n; i >= 0n; i--) {
    groups.push(Number((value >> (i * 16n)) & 0xffffn));
  }

  let bestStart = -1;
  let bestLength = 0;
  for (let i = 0; i < 8; ) {
    if (groups[i] !== 0) {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && groups[j] === 0) j++;
    if (j - i > bestLength) {
      bestStart = i;
      bestLength = j - i;
    }
    i = j;
  }

  if (bestLength < 2) {
    return groups.map((g) => g.toString(16)).join(':');
  }

  const left = groups.slice(0, bestStart).map((g) => g.toString(16)).join(':');
  const right = groups.slice(bestStart + bestLength).map((g) => g.toString(16)).join(':');
  return `${left}::${right}`;
}

/** @param {number} prefix 0–128 @returns {bigint} */
export function maskFromPrefix6(prefix) {
  return prefix === 0 ? 0n : (MAX << (BITS - BigInt(prefix))) & MAX;
}

const typeBlock = (value, blockStr, prefix) => {
  const block = parseIPv6(blockStr);
  return (value & maskFromPrefix6(prefix)) === block;
};

/** First matching classification, in specificity order. */
export function ipv6Type(value) {
  if (value === 0n) return 'Unspecified (::)';
  if (value === 1n) return 'Loopback (::1)';
  if (typeBlock(value, '::ffff:0:0', 96)) return 'IPv4-mapped';
  if (typeBlock(value, '64:ff9b::', 96)) return 'NAT64 (RFC 6052)';
  if (typeBlock(value, '2001:db8::', 32)) return 'Documentation';
  if (typeBlock(value, '2002::', 16)) return '6to4';
  if (typeBlock(value, 'fe80::', 10)) return 'Link-local';
  if (typeBlock(value, 'fc00::', 7)) return 'Unique local (ULA)';
  if (typeBlock(value, 'ff00::', 8)) return 'Multicast';
  if (typeBlock(value, '2000::', 3)) return 'Global unicast';
  return 'Reserved';
}

/** Reversed-nibble ip6.arpa name for the address. */
export function ipv6Ptr(value) {
  const nibbles = [];
  for (let i = 0n; i < 32n; i++) {
    nibbles.push(((value >> (i * 4n)) & 0xfn).toString(16));
  }
  return `${nibbles.join('.')}.ip6.arpa`;
}

/**
 * Everything the details panel shows for one IPv6 address + prefix.
 *
 * @param {string} addressStr
 * @param {number} prefix 0–128
 */
export function ipv6Details(addressStr, prefix) {
  const value = parseIPv6(addressStr);
  if (value === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 128) return null;

  const mask = maskFromPrefix6(prefix);
  const network = value & mask;
  const last = network | (~mask & MAX);

  return {
    address: compressIPv6(value),
    expandedAddress: expandIPv6(value),
    prefix,
    cidr: `${compressIPv6(network)}/${prefix}`,
    networkAddress: compressIPv6(network),
    expandedNetwork: expandIPv6(network),
    firstAddress: compressIPv6(network),
    lastAddress: compressIPv6(last),
    totalAddresses: 1n << (BITS - BigInt(prefix)),
    addressType: ipv6Type(value),
    ptr: ipv6Ptr(value),
  };
}

/** "2001:db8::/48" | "2001:db8::1" → { address, prefix|null } | null */
export function parseIPv6Cidr(input) {
  const trimmed = String(input ?? '').trim();
  const [addressPart, prefixPart, ...rest] = trimmed.split('/');
  if (rest.length > 0) return null;

  if (parseIPv6(addressPart) === null) return null;

  if (prefixPart === undefined) return { address: addressPart.trim(), prefix: null };
  if (!/^\d{1,3}$/.test(prefixPart)) return null;
  const prefix = Number(prefixPart);
  if (prefix > 128) return null;
  return { address: addressPart.trim(), prefix };
}

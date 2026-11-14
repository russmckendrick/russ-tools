import { parseIPv4, parseIPv4Cidr, ipv4Details } from './ipv4.js';
import { parseIPv6, parseIPv6Cidr, ipv6Details } from './ipv6.js';

export const DEFAULT_PREFIX = { 4: 24, 6: 64 };

/** Parse either family from one input. Returns {family, address, prefix|null} | null. */
export function parseInput(raw) {
  const v4 = parseIPv4Cidr(raw);
  if (v4) return { family: 4, ...v4 };
  const v6 = parseIPv6Cidr(raw);
  if (v6) return { family: 6, ...v6 };
  return null;
}

export function detailsFor(family, address, prefix) {
  return family === 4 ? ipv4Details(address, prefix) : ipv6Details(address, prefix);
}

export function rootOf(family, details) {
  if (!details) return null;
  const addr =
    family === 4 ? BigInt(parseIPv4(details.networkAddress)) : parseIPv6(details.networkAddress);
  return { addr, prefix: details.prefix };
}

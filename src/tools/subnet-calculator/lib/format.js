import { formatIPv4 } from './ipv4';
import { compressIPv6 } from './ipv6';

/**
 * The two address families, and how to write one down.
 *
 * Lifted out of `island.jsx` when the divide table became its own component:
 * both the island and the table need these, and a second copy is exactly how
 * an IPv6 total ends up formatted one way in the details panel and another way
 * in the row below it.
 */
export const FAMILIES = {
  4: { bits: 32, format: (addr) => formatIPv4(Number(addr)) },
  6: { bits: 128, format: compressIPv6 },
};

const number = new Intl.NumberFormat();

/**
 * "count (2^n)" for the enormous IPv6 totals; plain for IPv4.
 *
 * A /64 holds 18,446,744,073,709,551,616 addresses, which is true and useless.
 * The exponent is the part anyone reads.
 */
export function formatTotal(total, prefix, bits) {
  const exponent = bits - prefix;
  const exact = number.format(total);
  return exponent > 20 ? `2^${exponent} (${exact})` : exact;
}

/** Grouped thousands, shared so every count on the page reads the same. */
export function formatCount(n) {
  return number.format(n);
}

/**
 * The detail table's rows, in order — the one description of what a subnet's
 * details *are*.
 *
 * It lives here rather than in `island.jsx` because two callers need the same
 * answer: the tool, and the empty-state ghost that draws the panel before
 * anything is calculated. A ghost carrying its own list of labels would be a
 * second description of the table, drifting the first time a row is added.
 *
 * @param {number} family 4 or 6.
 * @param {object} details Output of `ipv4Details` / `ipv6Details`.
 * @returns {[string, string][]}
 */
export function detailRowsFor(family, details) {
  if (!details) return [];

  if (family === 4) {
    return [
      ['Network address', details.networkAddress],
      ['Usable host range', `${details.firstHost} – ${details.lastHost}`],
      ['Broadcast address', details.broadcastAddress ?? '—'],
      ['Total addresses', formatCount(details.totalAddresses)],
      ['Usable hosts', formatCount(details.usableHosts)],
      ['Netmask', details.netmask],
      ['Wildcard mask', details.wildcardMask],
      ['Binary netmask', details.binaryNetmask],
      ['Binary address', details.binaryAddress],
      ['Hex / integer', `${details.hexAddress} / ${formatCount(details.integerAddress)}`],
      ['Class', details.ipClass],
      ['Type', details.addressType],
      ['Reverse DNS (PTR)', details.ptr],
    ];
  }

  return [
    ['Network address', details.networkAddress],
    ['Address range', `${details.firstAddress} – ${details.lastAddress}`],
    ['Total addresses', formatTotal(details.totalAddresses, details.prefix, 128)],
    ['Expanded address', details.expandedAddress],
    ['Expanded network', details.expandedNetwork],
    ['Type', details.addressType],
    ['Reverse DNS (PTR)', details.ptr],
  ];
}

import { Netmask } from 'netmask';
import { ipToLong, longToIp } from '@/utils';

/**
 * The subnet allocator (Deferred test coverage §A). This algorithm lived
 * twice inside NetworkDesignerShadcn.jsx — once in handleAddSubnet, once in
 * handleReorderSubnets — and the copies were not identical. This module is
 * the single implementation; the differential test in allocator.test.js is
 * what proves the two behaviours agree.
 *
 * First-fit, aligned: a /n subnet may start only on a /n boundary, and takes
 * the lowest non-overlapping aligned address inside the parent.
 *
 * The original built every candidate address into an array before scanning —
 * ~4M entries for a /30 in a /8 parent, on every allocation. The scan below
 * walks aligned starts and, on overlap, jumps straight past the blocking
 * range (re-aligned), which is the same first-fit answer without the array.
 */

/** @param {{ip: string, cidr: number}} parent */
function parentRange(parent) {
  const block = new Netmask(`${parent.ip}/${parent.cidr}`);
  return { start: ipToLong(block.base), end: ipToLong(block.broadcast) };
}

/** @param {{base: string, cidr: number}[]} subnets → sorted inclusive ranges */
function usedRanges(subnets) {
  return (subnets || [])
    .map((s) => {
      const block = new Netmask(`${s.base}/${s.cidr}`);
      return { start: ipToLong(block.base), end: ipToLong(block.broadcast) };
    })
    .sort((a, b) => a.start - b.start);
}

/** Round `addr` up to the next multiple of `size`. */
function alignUp(addr, size) {
  return Math.ceil(addr / size) * size;
}

/**
 * First free aligned start for a block of `subnetSize` addresses, or null.
 *
 * @param {{start: number, end: number}} parent
 * @param {{start: number, end: number}[]} used sorted ranges
 * @param {number} subnetSize
 * @returns {number|null}
 */
function firstFit(parent, used, subnetSize) {
  let addr = alignUp(parent.start, subnetSize);

  while (addr + subnetSize - 1 <= parent.end) {
    const conflict = used.find(
      (range) => addr <= range.end && addr + subnetSize - 1 >= range.start
    );
    if (!conflict) return addr;
    // Jump past the blocking range instead of stepping size-by-size.
    addr = alignUp(conflict.end + 1, subnetSize);
  }

  return null;
}

/**
 * Place one subnet. Returns the base IP it would occupy, or null when no
 * aligned gap fits (the caller's "no available space" toast).
 *
 * @param {{ip: string, cidr: number}} parent
 * @param {{base: string, cidr: number}[]} existingSubnets
 * @param {number} prefixLength
 * @returns {string|null}
 */
export function allocateSubnet(parent, existingSubnets, prefixLength) {
  const range = parentRange(parent);
  const subnetSize = 2 ** (32 - prefixLength);
  const base = firstFit(range, usedRanges(existingSubnets), subnetSize);
  return base === null ? null : longToIp(base);
}

/**
 * Largest single aligned block that fits inside [start, end] — the standard
 * CIDR decomposition walk. This is what the offered-size list must be
 * computed from: a 128-address gap starting at .64 holds a /26 at most, not
 * the /25 its raw length suggests.
 *
 * @param {number} start inclusive
 * @param {number} end inclusive
 * @returns {number} block size in addresses (0 for an empty gap)
 */
export function largestAlignedBlock(start, end) {
  let best = 0;
  let addr = start;

  while (addr <= end) {
    const span = end - addr + 1;
    const alignment = ((addr & -addr) >>> 0) || 2 ** 32;
    const size = Math.min(alignment, 2 ** Math.floor(Math.log2(span)));
    if (size > best) best = size;
    addr += size;
  }

  return best;
}

/**
 * The prefix lengths a new subnet could actually use, largest block first —
 * i.e. every /n from the parent's first child size down to /31 that
 * `allocateSubnet` would succeed for.
 *
 * The pre-port SubnetForm derived this from the largest gap's raw *length*
 * (`32 - floor(log2(largestGapSize))`), ignoring alignment — so it offered
 * sizes that then failed with "No available space" (BEHAVIOR_CHANGES.md).
 *
 * @param {{ip: string, cidr: number}} parent
 * @param {{base: string, cidr: number}[]} existingSubnets
 * @returns {number[]} ascending prefix lengths, [] when nothing fits
 */
export function availablePrefixLengths(parent, existingSubnets) {
  const range = parentRange(parent);
  const used = usedRanges(existingSubnets);

  // Collect the free gaps: before the first range, between ranges, after the
  // last. (Measured inclusively; the middle/trailing formulas that looked
  // like an off-by-one in review are both correct address counts.)
  const gaps = [];
  let cursor = range.start;
  for (const r of used) {
    if (r.start > cursor) gaps.push({ start: cursor, end: r.start - 1 });
    cursor = Math.max(cursor, r.end + 1);
  }
  if (cursor <= range.end) gaps.push({ start: cursor, end: range.end });

  const largestBlock = Math.max(0, ...gaps.map((g) => largestAlignedBlock(g.start, g.end)));
  if (largestBlock < 2) return [];

  const minPrefix = Math.max(parent.cidr + 1, 32 - Math.floor(Math.log2(largestBlock)));
  const lengths = [];
  for (let n = minPrefix; n <= 31; n++) lengths.push(n);
  return lengths;
}

/**
 * Re-place every subnet in the given order, as a drag-reorder does — each
 * one via the same first-fit the add path uses. Returns the re-based list,
 * or null when some subnet no longer fits (the caller aborts the reorder).
 *
 * @param {{ip: string, cidr: number}} parent
 * @param {{base?: string, cidr: number}[]} orderedSubnets
 * @returns {object[]|null}
 */
export function reallocateAll(parent, orderedSubnets) {
  const range = parentRange(parent);
  const placed = [];
  const placedRanges = [];

  for (const subnet of orderedSubnets) {
    const subnetSize = 2 ** (32 - subnet.cidr);
    const base = firstFit(range, placedRanges, subnetSize);
    if (base === null) return null;

    placed.push({ ...subnet, base: longToIp(base) });
    placedRanges.push({ start: base, end: base + subnetSize - 1 });
    placedRanges.sort((a, b) => a.start - b.start);
  }

  return placed;
}

import { formatIPv4, parseIPv4, parseIPv4Cidr } from '../../subnet-calculator/lib/ipv4.js';
import { compressIPv6, maskFromPrefix6, parseIPv6, parseIPv6Cidr } from '../../subnet-calculator/lib/ipv6.js';

const MAX4 = (1n << 32n) - 1n;
const MAX6 = (1n << 128n) - 1n;

function formatAddress(value, family) {
  return family === 4 ? formatIPv4(Number(value)) : compressIPv6(value);
}

function parseAddress(value) {
  const v4 = parseIPv4(value);
  if (v4 !== null) return { family: 4, value: BigInt(v4), bits: 32 };
  const v6 = parseIPv6(value);
  if (v6 !== null) return { family: 6, value: v6, bits: 128 };
  return null;
}

export function parseCidrLine(value) {
  const line = String(value ?? '').replace(/\s+#.*$/, '').trim();
  if (!line || line.startsWith('#')) return null;

  if (line.includes('-') && !line.includes('/')) {
    const [left, right, ...rest] = line.split(/\s*-\s*/);
    if (rest.length) throw new Error(`Invalid range: ${line}`);
    const start = parseAddress(left);
    const end = parseAddress(right);
    if (!start || !end || start.family !== end.family || start.value > end.value) throw new Error(`Invalid range: ${line}`);
    return { family: start.family, bits: start.bits, start: start.value, end: end.value, source: line };
  }

  const v4 = parseIPv4Cidr(line);
  if (v4) {
    const prefix = v4.prefix ?? 32;
    const address = BigInt(parseIPv4(v4.address));
    const hostBits = 32n - BigInt(prefix);
    const mask = prefix === 0 ? 0n : (MAX4 << hostBits) & MAX4;
    const start = address & mask;
    return { family: 4, bits: 32, start, end: start | (MAX4 ^ mask), source: line };
  }

  const v6 = parseIPv6Cidr(line);
  if (v6) {
    const prefix = v6.prefix ?? 128;
    const mask = maskFromPrefix6(prefix);
    const start = parseIPv6(v6.address) & mask;
    return { family: 6, bits: 128, start, end: start | (MAX6 ^ mask), source: line };
  }

  throw new Error(`Could not read: ${line}`);
}

export function parseCidrList(input) {
  const ranges = [];
  const errors = [];
  for (const [index, line] of String(input ?? '').split(/\r?\n/).entries()) {
    try {
      const parsed = parseCidrLine(line);
      if (parsed) ranges.push(parsed);
    } catch (error) {
      errors.push({ line: index + 1, value: line, message: error.message });
    }
  }
  return { ranges, errors };
}

export function mergeRanges(ranges) {
  const sorted = [...ranges].sort((a, b) => a.family - b.family || (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  const out = [];
  for (const range of sorted) {
    const previous = out.at(-1);
    if (previous && previous.family === range.family && range.start <= previous.end + 1n) {
      previous.end = previous.end > range.end ? previous.end : range.end;
    } else {
      out.push({ ...range });
    }
  }
  return out;
}

function floorLog2(value) {
  let bits = -1;
  for (let current = value; current > 0n; current >>= 1n) bits += 1;
  return bits;
}

function trailingZeroBits(value, bits) {
  if (value === 0n) return bits;
  let count = 0;
  while (count < bits && (value & (1n << BigInt(count))) === 0n) count += 1;
  return count;
}

export function rangeToCidrs(range) {
  const out = [];
  let current = range.start;
  while (current <= range.end) {
    const alignment = trailingZeroBits(current, range.bits);
    const available = floorLog2(range.end - current + 1n);
    const hostBits = Math.min(alignment, available);
    out.push(`${formatAddress(current, range.family)}/${range.bits - hostBits}`);
    current += 1n << BigInt(hostBits);
  }
  return out;
}

export function normalizeCidrs(input) {
  const parsed = parseCidrList(input);
  return {
    errors: parsed.errors,
    ranges: mergeRanges(parsed.ranges),
    cidrs: mergeRanges(parsed.ranges).flatMap(rangeToCidrs),
  };
}

export function subtractRanges(left, right) {
  let remaining = mergeRanges(left);
  for (const cut of mergeRanges(right)) {
    const next = [];
    for (const source of remaining) {
      if (source.family !== cut.family || cut.end < source.start || cut.start > source.end) {
        next.push(source);
        continue;
      }
      if (cut.start > source.start) next.push({ ...source, end: cut.start - 1n });
      if (cut.end < source.end) next.push({ ...source, start: cut.end + 1n });
    }
    remaining = next;
  }
  return mergeRanges(remaining);
}

export function intersectRanges(left, right) {
  const out = [];
  for (const a of mergeRanges(left)) {
    for (const b of mergeRanges(right)) {
      if (a.family !== b.family) continue;
      const start = a.start > b.start ? a.start : b.start;
      const end = a.end < b.end ? a.end : b.end;
      if (start <= end) out.push({ family: a.family, bits: a.bits, start, end });
    }
  }
  return mergeRanges(out);
}

export function gapRanges(ranges) {
  const merged = mergeRanges(ranges);
  const out = [];
  for (const family of [4, 6]) {
    const familyRanges = merged.filter((range) => range.family === family);
    for (let index = 1; index < familyRanges.length; index++) {
      const start = familyRanges[index - 1].end + 1n;
      const end = familyRanges[index].start - 1n;
      if (start <= end) out.push({ family, bits: family === 4 ? 32 : 128, start, end });
    }
  }
  return out;
}

export function overlapPairs(ranges) {
  const out = [];
  for (let left = 0; left < ranges.length; left++) {
    for (let right = left + 1; right < ranges.length; right++) {
      const a = ranges[left];
      const b = ranges[right];
      if (a.family === b.family && a.start <= b.end && b.start <= a.end) out.push([a.source, b.source]);
    }
  }
  return out;
}

export function renderRanges(ranges) {
  return mergeRanges(ranges).flatMap(rangeToCidrs);
}

import { describe, expect, it } from 'vitest';
import { gapRanges, intersectRanges, normalizeCidrs, overlapPairs, parseCidrList, renderRanges, subtractRanges } from './cidr.js';

describe('CIDR workbench operations', () => {
  it('normalizes, deduplicates and collapses adjacent IPv4 blocks', () => {
    expect(normalizeCidrs('10.0.0.0/25\n10.0.0.128/25\n10.0.0.0/24').cidrs).toEqual(['10.0.0.0/24']);
  });

  it('converts arbitrary ranges to minimal CIDRs', () => {
    expect(normalizeCidrs('192.0.2.1 - 192.0.2.6').cidrs).toEqual([
      '192.0.2.1/32', '192.0.2.2/31', '192.0.2.4/31', '192.0.2.6/32',
    ]);
  });

  it('subtracts one set from another', () => {
    const left = parseCidrList('10.0.0.0/24').ranges;
    const right = parseCidrList('10.0.0.64/26').ranges;
    expect(renderRanges(subtractRanges(left, right))).toEqual(['10.0.0.0/26', '10.0.0.128/25']);
  });

  it('intersects IPv6 ranges', () => {
    const left = parseCidrList('2001:db8::/48').ranges;
    const right = parseCidrList('2001:db8:0:8000::/49').ranges;
    expect(renderRanges(intersectRanges(left, right))).toEqual(['2001:db8:0:8000::/49']);
  });

  it('finds gaps and overlapping source lines', () => {
    const parsed = parseCidrList('10.0.0.0/26\n10.0.0.32/27\n10.0.0.128/25').ranges;
    expect(overlapPairs(parsed)).toEqual([['10.0.0.0/26', '10.0.0.32/27']]);
    expect(renderRanges(gapRanges(parsed))).toEqual(['10.0.0.64/26']);
  });
});

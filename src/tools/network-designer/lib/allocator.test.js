import { describe, it, expect } from 'vitest';
import {
  allocateSubnet,
  availablePrefixLengths,
  reallocateAll,
  largestAlignedBlock,
} from './allocator.js';

/**
 * Deferred test coverage §A — the subnet allocator. The algorithm existed
 * twice inside NetworkDesignerShadcn.jsx with non-identical guards; this
 * suite is written against the extracted single implementation, and the
 * differential case is what proves the add path and the reorder path agree.
 */

const parent24 = { ip: '10.0.0.0', cidr: 24 };

/** Sequentially allocate prefixes, the way handleAddSubnet does. */
function addSequentially(parent, prefixes) {
  const placed = [];
  for (const [i, cidr] of prefixes.entries()) {
    const base = allocateSubnet(parent, placed, cidr);
    if (base === null) return null;
    placed.push({ name: `s${i}`, cidr, base });
  }
  return placed;
}

describe('§A.1 first-fit alignment', () => {
  it('lands consecutive /26s at .0, .64, .128', () => {
    const placed = addSequentially(parent24, [26, 26, 26]);
    expect(placed.map((s) => s.base)).toEqual(['10.0.0.0', '10.0.0.64', '10.0.0.128']);
  });
});

describe('§A.2 gap reuse', () => {
  it('fills the hole left by a removed middle subnet instead of appending', () => {
    const placed = addSequentially(parent24, [26, 26, 26]);
    const withoutMiddle = [placed[0], placed[2]];

    expect(allocateSubnet(parent24, withoutMiddle, 26)).toBe('10.0.0.64');
  });
});

describe('§A.3 alignment is enforced, not just size', () => {
  it('never places a /25 at 10.0.0.64 — only .0 or .128 are legal starts', () => {
    // A /26 at .0 leaves 192 free addresses from .64 up, but the first legal
    // /25 start after it is .128.
    const existing = [{ base: '10.0.0.0', cidr: 26 }];
    expect(allocateSubnet(parent24, existing, 25)).toBe('10.0.0.128');
  });
});

describe('§A.4 exhaustion', () => {
  it('returns null when nothing fits, which the UI turns into its toast', () => {
    const full = addSequentially(parent24, [25, 25]);
    expect(allocateSubnet(parent24, full, 26)).toBe(null);
    expect(availablePrefixLengths(parent24, full)).toEqual([]);
  });
});

describe('§A.5 differential — reallocateAll agrees with sequential adds', () => {
  // The whole point of the extraction: the add path and the drag-reorder
  // path were separate copies. One implementation, one answer.
  const cases = [
    [26, 26, 26],
    [26, 25, 27],
    [27, 27, 26, 25],
    [28, 26, 28, 27, 28],
    [25, 26, 27, 28, 29, 30],
  ];

  it.each(cases.map((c) => [c.join(',')]))('placements match for [%s]', (label) => {
    const prefixes = label.split(',').map(Number);
    const sequential = addSequentially(parent24, prefixes);
    const reallocated = reallocateAll(
      parent24,
      prefixes.map((cidr, i) => ({ name: `s${i}`, cidr }))
    );

    expect(sequential).not.toBe(null);
    expect(reallocated.map((s) => s.base)).toEqual(sequential.map((s) => s.base));
  });

  it('aborts with null when an arrangement cannot fit', () => {
    expect(reallocateAll(parent24, [{ cidr: 24 }, { cidr: 31 }])).toBe(null);
  });
});

describe('§A.6 offered sizes respect gap alignment (was KNOWN-BUG, now fixed)', () => {
  it('a 128-address gap starting at .64 offers /26, not the /25 its length suggests', () => {
    // /26 at .0 and /26 at .192 leave exactly the plan's bug case: 128 free
    // addresses from .64 to .191. The old formula
    // `32 - floor(log2(largestGapSize))` said /25; selecting it then failed
    // with "No available space". The largest *aligned* block is a /26.
    const existing = [
      { base: '10.0.0.0', cidr: 26 },
      { base: '10.0.0.192', cidr: 26 },
    ];

    const offered = availablePrefixLengths(parent24, existing);
    expect(offered[0]).toBe(26);
    expect(offered).not.toContain(25);

    // And every offered size must actually allocate — the invariant the old
    // list broke.
    for (const n of offered) {
      expect(allocateSubnet(parent24, existing, n)).not.toBe(null);
    }
  });

  it('an empty parent offers every child size down to /31', () => {
    expect(availablePrefixLengths(parent24, [])).toEqual(
      Array.from({ length: 31 - 25 + 1 }, (_, i) => 25 + i)
    );
  });

  it('largestAlignedBlock decomposes unaligned ranges correctly', () => {
    // .64–.191: 128 addresses, but the largest aligned block is 64.
    expect(largestAlignedBlock(64, 191)).toBe(64);
    // .0–.127 is itself an aligned 128 block.
    expect(largestAlignedBlock(0, 127)).toBe(128);
    // A degenerate single-address gap.
    expect(largestAlignedBlock(65, 65)).toBe(1);
  });
});

describe('§A.7 gap measurement, middle vs trailing', () => {
  // The plan flagged `next.start - prev.end - 1` (middle) vs
  // `parentEnd - lastEnd` (trailing) as a suspected off-by-one. Measured
  // inclusively they are both correct counts — free middle addresses are
  // [end+1, start-1] and trailing are [end+1, parentEnd] — and these pins
  // hold the reconciled single implementation to that.
  it('a trailing gap and an equal middle gap offer the same sizes', () => {
    // Middle gap of 64: /26 at .0, /26 at .128 → free .64–.127.
    const middleGap = [
      { base: '10.0.0.0', cidr: 26 },
      { base: '10.0.0.128', cidr: 25 },
    ];
    // Trailing gap of 64: /25 at .0, /26 at .128 → free .192–.255.
    const trailingGap = [
      { base: '10.0.0.0', cidr: 25 },
      { base: '10.0.0.128', cidr: 26 },
    ];

    expect(availablePrefixLengths(parent24, middleGap)).toEqual(
      availablePrefixLengths(parent24, trailingGap)
    );
    expect(availablePrefixLengths(parent24, middleGap)[0]).toBe(26);
  });
});

describe('§A.8 performance — no multi-million-entry candidate arrays', () => {
  it('allocates /30s inside a /8 without materialising candidates', () => {
    // The original pushed one array entry per possible /30 start in the
    // parent — ~4.2M entries per allocation for a /8. Twenty allocations
    // took seconds; the early-exit scan is effectively instant.
    const parent8 = { ip: '10.0.0.0', cidr: 8 };
    const placed = [];

    const startedAt = performance.now();
    for (let i = 0; i < 20; i++) {
      const base = allocateSubnet(parent8, placed, 30);
      expect(base).not.toBe(null);
      placed.push({ cidr: 30, base });
    }
    const elapsed = performance.now() - startedAt;

    expect(placed[0].base).toBe('10.0.0.0');
    expect(placed[19].base).toBe('10.0.0.76');
    expect(elapsed).toBeLessThan(500);
  });

  it('jumps past a blocker at the front of a huge parent', () => {
    const parent8 = { ip: '10.0.0.0', cidr: 8 };
    const blocker = [{ base: '10.0.0.0', cidr: 9 }];
    expect(allocateSubnet(parent8, blocker, 30)).toBe('10.128.0.0');
  });
});

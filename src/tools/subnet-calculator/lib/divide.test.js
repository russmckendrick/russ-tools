import { describe, it, expect } from 'vitest';
import { leaves, splitNode, joinNode, pruneSplits, nodeKey } from './divide.js';
import { formatIPv4 } from './ipv4.js';
import { compressIPv6 } from './ipv6.js';

const v4 = { bits: 32, format: (addr) => formatIPv4(Number(addr)) };
const v6 = { bits: 128, format: compressIPv6 };

const root24 = { addr: BigInt(0x0a000000), prefix: 24 }; // 10.0.0.0/24

describe('leaves', () => {
  it('an unsplit root is its own single leaf', () => {
    const rows = leaves(v4, root24, new Set());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ key: '10.0.0.0/24', depth: 0, splittable: true });
  });

  it('splitting produces the two halves, in address order', () => {
    const splits = splitNode(new Set(), '10.0.0.0/24');
    const rows = leaves(v4, root24, splits);
    expect(rows.map((r) => r.key)).toEqual(['10.0.0.0/25', '10.0.0.128/25']);
    expect(rows.map((r) => r.depth)).toEqual([1, 1]);
  });

  it('nested splits divide only the chosen half', () => {
    let splits = splitNode(new Set(), '10.0.0.0/24');
    splits = splitNode(splits, '10.0.0.128/25');
    const rows = leaves(v4, root24, splits);
    expect(rows.map((r) => r.key)).toEqual([
      '10.0.0.0/25',
      '10.0.0.128/26',
      '10.0.0.192/26',
    ]);
  });

  it('a /32 leaf is not splittable', () => {
    const rows = leaves(v4, { addr: BigInt(0x0a000001), prefix: 32 }, new Set());
    expect(rows[0].splittable).toBe(false);
  });

  it('works identically for IPv6 blocks', () => {
    const root = { addr: 0x20010db8n << 96n, prefix: 48 }; // 2001:db8::/48
    const splits = splitNode(new Set(), '2001:db8::/48');
    const rows = leaves(v6, root, splits);
    // The /48 prefix covers the first three groups; bit 49 is the top bit of
    // the fourth, so the upper half is 2001:db8:0:8000::/49.
    expect(rows.map((r) => r.key)).toEqual(['2001:db8::/49', '2001:db8:0:8000::/49']);
  });
});

describe('joinNode', () => {
  it('joining removes the node and its whole subtree', () => {
    let splits = splitNode(new Set(), '10.0.0.0/24');
    splits = splitNode(splits, '10.0.0.0/25');
    splits = splitNode(splits, '10.0.0.0/26');

    const joined = joinNode(v4, splits, BigInt(0x0a000000), 24);
    expect([...joined]).toEqual([]);
    expect(leaves(v4, root24, joined).map((r) => r.key)).toEqual(['10.0.0.0/24']);
  });

  it('joining a child leaves siblings alone', () => {
    let splits = splitNode(new Set(), '10.0.0.0/24');
    splits = splitNode(splits, '10.0.0.0/25');
    splits = splitNode(splits, '10.0.0.128/25');

    const joined = joinNode(v4, splits, BigInt(0x0a000080), 25);
    expect(leaves(v4, root24, joined).map((r) => r.key)).toEqual([
      '10.0.0.0/26',
      '10.0.0.64/26',
      '10.0.0.128/25',
    ]);
  });
});

describe('pruneSplits', () => {
  it('drops keys that no longer sit under the root', () => {
    const splits = new Set(['10.0.0.0/24', '10.0.0.0/25', '192.168.0.0/24']);
    const pruned = pruneSplits(v4, root24, splits);
    expect([...pruned].sort()).toEqual(['10.0.0.0/24', '10.0.0.0/25']);
  });

  it('drops orphaned descendants whose parent split is missing', () => {
    // /26 split exists but its /25 parent was never split — unreachable.
    const splits = new Set(['10.0.0.0/24', '10.0.0.64/26']);
    const pruned = pruneSplits(v4, root24, splits);
    expect([...pruned]).toEqual(['10.0.0.0/24']);
  });
});

describe('nodeKey', () => {
  it('is the canonical cidr string', () => {
    expect(nodeKey(v4, BigInt(0x0a000080), 25)).toBe('10.0.0.128/25');
  });
});

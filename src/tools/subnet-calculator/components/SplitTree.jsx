import React from 'react';

import { TreeDiagram } from '@/components/ui/tree-diagram';
import { childrenOf, nodeKey } from '../lib/divide';
import { FAMILIES, formatCount } from '../lib/format';

/** Past this many blocks the tree is wider than it is useful. */
const MAX_LEAVES = 32;

const MAX_LABEL = 16;
const short = (name) => (name.length > MAX_LABEL ? `${name.slice(0, MAX_LABEL - 1)}…` : name);

/**
 * The divide, as a tree you build by pressing it: press a block to split it
 * in two, press a parent to join its halves back.
 *
 * The tree is rebuilt from the table's own rows rather than passed in. Every
 * row knows its address, prefix and depth, which fixes the root; walking down
 * from there, a node is a leaf exactly when a row carries its key. So the
 * diagram cannot disagree with the table beneath it.
 *
 * @param {object} props
 * @param {number} props.family 4 or 6
 * @param {{key: string, addr: bigint, prefix: number, depth: number, splittable: boolean}[]} props.rows
 * @param {Record<string, string>} [props.names] labels by block key, from a plan
 * @param {(key: string) => void} props.onSplit
 * @param {(family: object, addr: bigint, prefix: number) => void} props.onJoin
 */
export default function SplitTree({ family, rows, names = {}, onSplit, onJoin }) {
  if (rows.length === 0) return null;
  if (rows.length > MAX_LEAVES) {
    return (
      <p className="mb-4 text-body-sm text-muted-foreground">
        {rows.length} blocks is more than the tree can draw. The table lists them all.
      </p>
    );
  }

  const fam = FAMILIES[family];
  const leaves = new Map(rows.map((row) => [row.key, row]));
  const rootPrefix = rows[0].prefix - rows[0].depth;
  const size = 1n << BigInt(fam.bits - rootPrefix);
  const rootAddr = (rows[0].addr / size) * size;

  // IPv4 blocks say how many hosts they hold; an IPv6 count is a 20-digit
  // number nobody reads, so those say their share of the bits instead.
  const size4 = (prefix) => {
    const total = 2 ** (32 - prefix);
    return `${formatCount(prefix >= 31 ? total : total - 2)} host${total - 2 === 1 ? '' : 's'}`;
  };
  const detail = (prefix) => (family === 4 ? size4(prefix) : `${fam.bits - prefix} host bits`);

  const build = (addr, prefix) => {
    const key = nodeKey(fam, addr, prefix);
    const leaf = leaves.get(key);
    if (leaf) {
      const name = names[key];
      return {
        id: key,
        label: key,
        sub: name ? `${short(name)} · ${detail(prefix)}` : detail(prefix),
        tone: name ? 'ok' : prefix === rootPrefix ? 'accent' : undefined,
        ...(leaf.splittable
          ? {
              onClick: () => onSplit(key),
              actionLabel: name ? `Divide ${key} (${name}) in two` : `Divide ${key} in two`,
            }
          : {}),
      };
    }
    return {
      id: key,
      label: key,
      tone: prefix === rootPrefix ? 'accent' : 'muted',
      onClick: () => onJoin(fam, addr, prefix),
      actionLabel: `Merge the halves of ${key}`,
      children: childrenOf(fam, addr, prefix).map((child) => build(child.addr, child.prefix)),
    };
  };

  return (
    <TreeDiagram
      className="mb-4"
      label="The subnet and the blocks it has been divided into"
      root={build(rootAddr, rootPrefix)}
      caption={
        rows.length === 1
          ? 'Press the block to split it in two.'
          : `${rows.length} blocks. Press a block to split it, or a dashed parent to join its halves.`
      }
    />
  );
}

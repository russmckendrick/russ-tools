/**
 * The divide table's state: a binary split tree in the davidc.net style.
 *
 * The tree is not stored as a tree — it is the parent block plus a Set of
 * node keys that have been split. A node's key is its canonical
 * `network/prefix` string; leaves are derived by walking from the root and
 * recursing wherever the key is in the set. That makes the whole thing
 * serialisable as `{ cidr, splits: [...] }` for share links.
 *
 * Addresses are BigInt so IPv4 (32 bits) and IPv6 (128 bits) share one
 * implementation; `family.format` renders keys and `family.bits` bounds the
 * recursion.
 *
 * @typedef {{ bits: number, format: (addr: bigint) => string }} Family
 */

/** @param {Family} family */
export const nodeKey = (family, addr, prefix) => `${family.format(addr)}/${prefix}`;

/** The two children of a node — upper half starts at addr + 2^(bits-prefix-1). */
export function childrenOf(family, addr, prefix) {
  const half = 1n << BigInt(family.bits - prefix - 1);
  return [
    { addr, prefix: prefix + 1 },
    { addr: addr + half, prefix: prefix + 1 },
  ];
}

/**
 * The ordered leaf list for the current split set. Each leaf carries its
 * depth relative to the root so the table can indent, and whether it can be
 * split further.
 *
 * @param {Family} family
 * @param {{ addr: bigint, prefix: number }} root
 * @param {Set<string>} splits
 */
export function leaves(family, root, splits) {
  const out = [];

  const walk = (addr, prefix, depth) => {
    const key = nodeKey(family, addr, prefix);
    if (splits.has(key) && prefix < family.bits) {
      for (const child of childrenOf(family, addr, prefix)) {
        walk(child.addr, child.prefix, depth + 1);
      }
      return;
    }
    out.push({ addr, prefix, key, depth, splittable: prefix < family.bits });
  };

  walk(root.addr, root.prefix, 0);
  return out;
}

/** @returns {Set<string>} a new set with the node split */
export function splitNode(splits, key) {
  const next = new Set(splits);
  next.add(key);
  return next;
}

/**
 * Join a previously split node: its key and every descendant key leave the
 * set, exactly like collapsing a row in the davidc table.
 *
 * @param {Family} family
 * @param {Set<string>} splits
 * @param {bigint} addr
 * @param {number} prefix
 * @returns {Set<string>}
 */
export function joinNode(family, splits, addr, prefix) {
  const next = new Set(splits);

  const remove = (a, p) => {
    const key = nodeKey(family, a, p);
    if (!next.delete(key)) return;
    if (p >= family.bits) return;
    for (const child of childrenOf(family, a, p)) remove(child.addr, child.prefix);
  };

  remove(addr, prefix);
  return next;
}

/**
 * Drop split keys that no longer sit inside the root — used when the parent
 * block changes, so a stale share payload cannot corrupt the walk.
 *
 * @param {Family} family
 * @param {{ addr: bigint, prefix: number }} root
 * @param {Iterable<string>} keys
 * @returns {Set<string>}
 */
export function pruneSplits(family, root, keys) {
  const input = new Set(keys);
  const valid = new Set();

  // Walk only where a split exists — reachable keys are the valid ones.
  const walk = (addr, prefix) => {
    const key = nodeKey(family, addr, prefix);
    valid.add(key);
    if (prefix >= family.bits || !input.has(key)) return;
    for (const child of childrenOf(family, addr, prefix)) walk(child.addr, child.prefix);
  };

  walk(root.addr, root.prefix);
  return new Set([...input].filter((k) => valid.has(k)));
}

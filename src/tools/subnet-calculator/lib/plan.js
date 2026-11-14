import { childrenOf, leaves, nodeKey } from './divide.js';

export const MAX_NAME = 32;
export const MAX_REQUIREMENTS = 64;

export function cleanName(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\p{Cc}<>]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME)
    .trim();
}

export function cleanNames(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out = {};
  for (const [key, raw] of Object.entries(value).slice(0, 4 * MAX_REQUIREMENTS)) {
    const name = cleanName(raw);
    if (name) out[key] = name;
  }
  return out;
}

export function prefixForHosts(hosts) {
  if (!Number.isSafeInteger(hosts) || hosts < 1) return null;
  if (hosts === 1) return 32;
  if (hosts === 2) return 31;
  for (let prefix = 30; prefix >= 0; prefix--) {
    if (2 ** (32 - prefix) - 2 >= hosts) return prefix;
  }
  return null;
}

export function usableHosts(prefix) {
  if (prefix >= 32) return 1;
  if (prefix === 31) return 2;
  return 2 ** (32 - prefix) - 2;
}

const LINE = /^(?:(.*?)[\s,;:=]+)?(\/?)(\d+)$/;

export function parseRequirements(text, family) {
  const bits = family === 6 ? 128 : 32;
  const requirements = [];
  const errors = [];

  String(text ?? '')
    .split(/\r?\n/)
    .forEach((raw, i) => {
      const line = raw.trim();
      if (!line) return;
      const number = i + 1;
      const match = LINE.exec(line);
      if (!match) {
        errors.push({
          line: number,
          message:
            family === 6
              ? `"${line}" needs to end in a prefix length, e.g. lan /64`
              : `"${line}" needs to end in a host count or a /prefix, e.g. web 500`,
        });
        return;
      }

      const name = cleanName(match[1] ?? '');
      const value = Number(match[3]);
      const asPrefix = family === 6 || match[2] === '/';

      if (asPrefix) {
        if (value > bits) {
          errors.push({ line: number, message: `/${match[3]} is not an IPv${family} prefix (max /${bits})` });
          return;
        }
        requirements.push({ name, prefix: value });
        return;
      }

      if (value < 1) {
        errors.push({ line: number, message: `"${line}" asks for no hosts. Write the count without separators, e.g. 1000` });
        return;
      }
      if (prefixForHosts(value) === null) {
        errors.push({ line: number, message: `${match[3]} hosts is more than IPv4 holds` });
        return;
      }
      requirements.push({ name, hosts: value });
    });

  if (requirements.length > MAX_REQUIREMENTS) {
    errors.push({ line: 0, message: `A plan takes at most ${MAX_REQUIREMENTS} requirements` });
  }

  return { requirements, errors };
}

function wantedPrefix(family, req) {
  if (Number.isInteger(req.prefix)) {
    return req.prefix >= 0 && req.prefix <= family.bits ? req.prefix : null;
  }
  if (family.bits !== 32) return null;
  return prefixForHosts(req.hosts);
}

export function planSubnets(family, root, requirements) {
  const total = 1n << BigInt(family.bits - root.prefix);
  const end = root.addr + total;

  const wanted = requirements.map((req, index) => ({
    index,
    name: cleanName(req.name),
    hosts: Number.isInteger(req.hosts) ? req.hosts : null,
    prefix: wantedPrefix(family, req),
  }));

  const ordered = [...wanted].sort(
    (a, b) => (a.prefix ?? -1) - (b.prefix ?? -1) || a.index - b.index
  );

  const allocations = [];
  const unallocated = [];
  let cursor = root.addr;

  for (const want of ordered) {
    if (want.prefix === null) {
      unallocated.push({ ...want, reason: 'invalid' });
      continue;
    }
    if (want.prefix < root.prefix) {
      unallocated.push({ ...want, reason: 'larger-than-parent' });
      continue;
    }
    const size = 1n << BigInt(family.bits - want.prefix);
    if (cursor + size > end) {
      unallocated.push({ ...want, reason: 'no-space' });
      continue;
    }
    allocations.push({ ...want, addr: cursor, size, key: nodeKey(family, cursor, want.prefix) });
    cursor += size;
  }

  const splits = new Set();
  const names = {};
  for (const block of allocations) {
    let node = { addr: root.addr, prefix: root.prefix };
    while (node.prefix < block.prefix) {
      splits.add(nodeKey(family, node.addr, node.prefix));
      const [low, high] = childrenOf(family, node.addr, node.prefix);
      node = block.addr >= high.addr ? high : low;
    }
    if (block.name) names[block.key] = block.name;
  }

  const taken = new Set(allocations.map((block) => block.key));
  const free = leaves(family, root, splits).filter((leaf) => !taken.has(leaf.key));

  return {
    allocations,
    unallocated,
    splits: [...splits],
    names,
    free,
    usedAddresses: cursor - root.addr,
    freeAddresses: end - cursor,
    totalAddresses: total,
  };
}

export function sharePayload(family, cidr, splits, names = {}) {
  return {
    f: family,
    cidr,
    splits,
    ...(Object.keys(names).length ? { names } : {}),
  };
}

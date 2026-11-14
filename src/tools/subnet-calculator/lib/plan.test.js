import { describe, it, expect } from 'vitest';
import {
  cleanName,
  cleanNames,
  parseRequirements,
  planSubnets,
  prefixForHosts,
  usableHosts,
  MAX_NAME,
  MAX_REQUIREMENTS,
} from './plan.js';
import { leaves, pruneSplits } from './divide.js';
import { FAMILIES } from './format.js';
import { parseIPv4 } from './ipv4.js';
import { parseIPv6 } from './ipv6.js';

const v4 = FAMILIES[4];
const v6 = FAMILIES[6];
const block = (cidr) => {
  const [address, prefix] = cidr.split('/');
  return { addr: BigInt(parseIPv4(address)), prefix: Number(prefix) };
};
const keys = (list) => list.map((item) => item.key);

function replay(family, root, plan) {
  const splits = new Set(plan.splits);
  expect([...pruneSplits(family, root, splits)].sort()).toEqual([...splits].sort());
  return leaves(family, root, splits);
}

describe('prefixForHosts', () => {
  it('finds the smallest block whose usable hosts cover the count', () => {
    expect(prefixForHosts(500)).toBe(23);
    expect(prefixForHosts(120)).toBe(25);
    expect(prefixForHosts(60)).toBe(26);
    expect(prefixForHosts(254)).toBe(24);
    expect(prefixForHosts(255)).toBe(23);
  });

  it('follows the calculator on /31 and /32: two hosts fit a /31, one a /32', () => {
    expect(prefixForHosts(1)).toBe(32);
    expect(prefixForHosts(2)).toBe(31);
    expect(prefixForHosts(3)).toBe(29);
    expect(prefixForHosts(6)).toBe(29);
    expect(prefixForHosts(7)).toBe(28);
  });

  it('agrees with usableHosts at every prefix', () => {
    for (let prefix = 0; prefix <= 32; prefix++) {
      if (prefix === 30) continue;
      expect(prefixForHosts(usableHosts(prefix))).toBe(prefix);
    }
    expect(usableHosts(30)).toBe(2);
    expect(prefixForHosts(usableHosts(30))).toBe(31);
  });

  it('rejects counts IPv4 cannot hold, and junk', () => {
    expect(prefixForHosts(2 ** 32 - 2)).toBe(0);
    expect(prefixForHosts(2 ** 32 - 1)).toBe(null);
    expect(prefixForHosts(0)).toBe(null);
    expect(prefixForHosts(-4)).toBe(null);
    expect(prefixForHosts(1.5)).toBe(null);
    expect(prefixForHosts(undefined)).toBe(null);
  });
});

describe('planSubnets', () => {
  it('allocates the worked example largest first, on aligned boundaries', () => {
    const root = block('10.0.0.0/22');
    const plan = planSubnets(v4, root, [
      { name: 'p2p', hosts: 2 },
      { name: 'mgmt', hosts: 60 },
      { name: 'web', hosts: 500 },
      { name: 'db', hosts: 120 },
    ]);

    expect(keys(plan.allocations)).toEqual([
      '10.0.0.0/23',
      '10.0.2.0/25',
      '10.0.2.128/26',
      '10.0.2.192/31',
    ]);
    expect(plan.allocations.map((a) => a.name)).toEqual(['web', 'db', 'mgmt', 'p2p']);
    expect(plan.allocations.map((a) => a.index)).toEqual([2, 3, 1, 0]);
    expect(plan.unallocated).toEqual([]);
    expect(plan.names).toEqual({
      '10.0.0.0/23': 'web',
      '10.0.2.0/25': 'db',
      '10.0.2.128/26': 'mgmt',
      '10.0.2.192/31': 'p2p',
    });
    expect(plan.usedAddresses).toBe(706n);
    expect(plan.freeAddresses).toBe(318n);
    expect(plan.totalAddresses).toBe(1024n);

    for (const a of plan.allocations) expect(a.addr % a.size).toBe(0n);
  });

  it('returns splits that reproduce the allocation through the existing split logic', () => {
    const root = block('10.0.0.0/22');
    const plan = planSubnets(v4, root, [{ hosts: 500 }, { hosts: 120 }, { hosts: 60 }, { hosts: 2 }]);
    const rows = replay(v4, root, plan);

    expect(keys(rows)).toEqual([
      '10.0.0.0/23',
      '10.0.2.0/25',
      '10.0.2.128/26',
      '10.0.2.192/31',
      '10.0.2.194/31',
      '10.0.2.196/30',
      '10.0.2.200/29',
      '10.0.2.208/28',
      '10.0.2.224/27',
      '10.0.3.0/24',
    ]);
    for (const key of keys(plan.allocations)) expect(keys(rows)).toContain(key);
    expect(keys(plan.free)).toEqual(keys(rows).slice(4));
    expect(plan.free.reduce((sum, leaf) => sum + (1n << BigInt(32 - leaf.prefix)), 0n)).toBe(
      plan.freeAddresses
    );
    expect(plan.names).toEqual({});
  });

  it('an exact fit uses the whole parent and leaves nothing', () => {
    const root = block('192.168.0.0/24');
    const plan = planSubnets(v4, root, [{ hosts: 126 }, { hosts: 62 }, { hosts: 30 }, { hosts: 30 }]);

    expect(keys(plan.allocations)).toEqual([
      '192.168.0.0/25',
      '192.168.0.128/26',
      '192.168.0.192/27',
      '192.168.0.224/27',
    ]);
    expect(plan.freeAddresses).toBe(0n);
    expect(plan.free).toEqual([]);
    expect(keys(replay(v4, root, plan))).toEqual(keys(plan.allocations));
  });

  it('a requirement the size of the parent takes it whole, with no splits', () => {
    const root = block('10.0.0.0/24');
    const plan = planSubnets(v4, root, [{ name: 'lan', hosts: 254 }]);

    expect(keys(plan.allocations)).toEqual(['10.0.0.0/24']);
    expect(plan.splits).toEqual([]);
    expect(plan.names).toEqual({ '10.0.0.0/24': 'lan' });
    expect(plan.free).toEqual([]);
  });

  it('reports a requirement larger than the parent and still places the rest', () => {
    const root = block('10.0.0.0/24');
    const plan = planSubnets(v4, root, [
      { name: 'small', hosts: 20 },
      { name: 'huge', hosts: 2000 },
    ]);

    expect(plan.unallocated).toHaveLength(1);
    expect(plan.unallocated[0]).toMatchObject({
      name: 'huge',
      hosts: 2000,
      prefix: 21,
      index: 1,
      reason: 'larger-than-parent',
    });
    expect(keys(plan.allocations)).toEqual(['10.0.0.0/27']);
    expect(plan.freeAddresses).toBe(224n);
  });

  it('a list that overflows part-way keeps what fitted and names what did not', () => {
    const root = block('10.0.0.0/24');
    const plan = planSubnets(v4, root, [
      { name: 'a', hosts: 100 },
      { name: 'b', hosts: 50 },
      { name: 'c', hosts: 50 },
      { name: 'd', hosts: 50 },
      { name: 'e', hosts: 10 },
    ]);

    expect(plan.allocations.map((a) => `${a.name} ${a.key}`)).toEqual([
      'a 10.0.0.0/25',
      'b 10.0.0.128/26',
      'c 10.0.0.192/26',
    ]);
    expect(plan.unallocated.map((u) => `${u.name} ${u.reason}`)).toEqual(['d no-space', 'e no-space']);
    expect(plan.freeAddresses).toBe(0n);
    expect(keys(replay(v4, root, plan))).toEqual(keys(plan.allocations));
  });

  it('keeps equal-sized requirements in the order they were written', () => {
    const plan = planSubnets(v4, block('10.0.0.0/24'), [
      { name: 'first', hosts: 50 },
      { name: 'second', hosts: 60 },
      { name: 'third', hosts: 40 },
    ]);
    expect(plan.allocations.map((a) => a.name)).toEqual(['first', 'second', 'third']);
  });

  it('point-to-point links: two hosts take a /31, and a /30 is asked for by prefix', () => {
    const root = block('10.0.0.0/29');
    const plan = planSubnets(v4, root, [{ name: 'link', hosts: 2 }, { name: 'legacy', prefix: 30 }]);

    expect(plan.allocations.map((a) => `${a.name} ${a.key}`)).toEqual([
      'legacy 10.0.0.0/30',
      'link 10.0.0.4/31',
    ]);
    expect(keys(replay(v4, root, plan))).toEqual(['10.0.0.0/30', '10.0.0.4/31', '10.0.0.6/31']);
  });

  it('a /31 parent holds two single hosts or one pair, and a /32 holds one', () => {
    const pair = planSubnets(v4, block('10.0.0.0/31'), [{ hosts: 2 }]);
    expect(keys(pair.allocations)).toEqual(['10.0.0.0/31']);
    expect(pair.splits).toEqual([]);

    const singles = planSubnets(v4, block('10.0.0.0/31'), [{ hosts: 1 }, { hosts: 1 }, { hosts: 1 }]);
    expect(keys(singles.allocations)).toEqual(['10.0.0.0/32', '10.0.0.1/32']);
    expect(singles.unallocated.map((u) => u.reason)).toEqual(['no-space']);
    expect(singles.splits).toEqual(['10.0.0.0/31']);

    const host = planSubnets(v4, block('10.0.0.9/32'), [{ hosts: 1 }, { hosts: 2 }]);
    expect(keys(host.allocations)).toEqual(['10.0.0.9/32']);
    expect(host.unallocated[0]).toMatchObject({ hosts: 2, reason: 'larger-than-parent' });
  });

  it('a /30 parent fits one two-host /31 beside another, never three hosts', () => {
    const plan = planSubnets(v4, block('10.0.0.0/30'), [{ hosts: 3 }, { hosts: 2 }, { hosts: 2 }]);
    expect(keys(plan.allocations)).toEqual(['10.0.0.0/31', '10.0.0.2/31']);
    expect(plan.unallocated[0]).toMatchObject({ hosts: 3, prefix: 29, reason: 'larger-than-parent' });
  });

  it('works at the top of the address space without overflowing 32 bits', () => {
    const root = block('255.255.255.0/24');
    const plan = planSubnets(v4, root, [{ hosts: 100 }, { hosts: 100 }]);
    expect(keys(plan.allocations)).toEqual(['255.255.255.0/25', '255.255.255.128/25']);
    expect(keys(replay(v4, root, plan))).toEqual(keys(plan.allocations));
  });

  it('flags junk requirements instead of throwing', () => {
    const plan = planSubnets(v4, block('10.0.0.0/24'), [
      { hosts: 0 },
      { prefix: 40 },
      {},
      { name: 'ok', hosts: 10 },
    ]);
    expect(plan.unallocated.map((u) => u.reason)).toEqual(['invalid', 'invalid', 'invalid']);
    expect(keys(plan.allocations)).toEqual(['10.0.0.0/28']);
  });

  it('an empty list changes nothing', () => {
    const root = block('10.0.0.0/24');
    const plan = planSubnets(v4, root, []);
    expect(plan.allocations).toEqual([]);
    expect(plan.splits).toEqual([]);
    expect(plan.freeAddresses).toBe(256n);
    expect(keys(plan.free)).toEqual(['10.0.0.0/24']);
  });

  it('plans IPv6 by prefix length, and ignores host counts there', () => {
    const root = { addr: parseIPv6('2001:db8::'), prefix: 48 };
    const plan = planSubnets(v6, root, [
      { name: 'link', prefix: 127 },
      { name: 'lan', prefix: 64 },
      { name: 'site', prefix: 56 },
      { name: 'lost', hosts: 500 },
      { name: 'big', prefix: 32 },
    ]);

    expect(plan.allocations.map((a) => `${a.name} ${a.key}`)).toEqual([
      'site 2001:db8::/56',
      'lan 2001:db8:0:100::/64',
      'link 2001:db8:0:101::/127',
    ]);
    expect(plan.unallocated.map((u) => `${u.name} ${u.reason}`)).toEqual([
      'lost invalid',
      'big larger-than-parent',
    ]);
    expect(plan.totalAddresses).toBe(1n << 80n);
    const rows = replay(v6, root, plan);
    for (const key of keys(plan.allocations)) expect(keys(rows)).toContain(key);
  });
});

describe('parseRequirements', () => {
  it('reads a name and a host count per line, with the name optional', () => {
    const { requirements, errors } = parseRequirements('web 500\ndb 120\n\n  60  \np2p 2\n', 4);
    expect(errors).toEqual([]);
    expect(requirements).toEqual([
      { name: 'web', hosts: 500 },
      { name: 'db', hosts: 120 },
      { name: '', hosts: 60 },
      { name: 'p2p', hosts: 2 },
    ]);
  });

  it('accepts the separators people paste: commas, colons, tabs, equals', () => {
    const { requirements } = parseRequirements('web,500\r\ndb: 120\nmgmt\t60\nlink = 2\nweb servers 30', 4);
    expect(requirements).toEqual([
      { name: 'web', hosts: 500 },
      { name: 'db', hosts: 120 },
      { name: 'mgmt', hosts: 60 },
      { name: 'link', hosts: 2 },
      { name: 'web servers', hosts: 30 },
    ]);
  });

  it('takes a /prefix in place of a host count on IPv4', () => {
    const { requirements, errors } = parseRequirements('link /30\n/26\nbad /33', 4);
    expect(requirements).toEqual([
      { name: 'link', prefix: 30 },
      { name: '', prefix: 26 },
    ]);
    expect(errors).toEqual([{ line: 3, message: '/33 is not an IPv4 prefix (max /32)' }]);
  });

  it('reads every number as a prefix length on IPv6', () => {
    const { requirements, errors } = parseRequirements('lan /64\ndmz 64\n127\nbad /129', 6);
    expect(requirements).toEqual([
      { name: 'lan', prefix: 64 },
      { name: 'dmz', prefix: 64 },
      { name: '', prefix: 127 },
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0].line).toBe(4);
  });

  it('reports lines it cannot read, by line number', () => {
    const { requirements, errors } = parseRequirements('web\ndb 0\ndmz 10,000\nall 5000000000\nok 5', 4);
    expect(requirements).toEqual([{ name: 'ok', hosts: 5 }]);
    expect(errors.map((e) => e.line)).toEqual([1, 2, 3, 4]);
  });

  it('caps the length of a plan', () => {
    const text = Array.from({ length: MAX_REQUIREMENTS + 1 }, () => '2').join('\n');
    expect(parseRequirements(text, 4).errors).toHaveLength(1);
  });

  it('survives junk input', () => {
    expect(parseRequirements(undefined, 4)).toEqual({ requirements: [], errors: [] });
    expect(parseRequirements('   \n\n', 4)).toEqual({ requirements: [], errors: [] });
  });
});

describe('cleanName', () => {
  it('trims, collapses white space and caps the length', () => {
    expect(cleanName('  web   servers \t')).toBe('web servers');
    expect(cleanName('x'.repeat(80))).toHaveLength(MAX_NAME);
  });

  it('drops markup brackets and control characters, and anything that is not text', () => {
    expect(cleanName('<b>web</b>\u0000\u0007')).toBe('b web /b');
    expect(cleanName(42)).toBe('');
    expect(cleanName(null)).toBe('');
  });

  it('cleanNames keeps only string names on a plain object', () => {
    expect(cleanNames({ '10.0.0.0/25': ' web ', '10.0.0.128/25': 7, x: '' })).toEqual({
      '10.0.0.0/25': 'web',
    });
    expect(cleanNames(['web'])).toEqual({});
    expect(cleanNames('web')).toEqual({});
    expect(cleanNames(null)).toEqual({});
  });
});

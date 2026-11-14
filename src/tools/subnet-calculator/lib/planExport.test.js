import { describe, it, expect } from 'vitest';
import { planTable, planToCsv, planToMarkdown } from './planExport.js';
import { planSubnets } from './plan.js';
import { leaves } from './divide.js';
import { FAMILIES } from './format.js';
import { parseIPv6 } from './ipv6.js';

const root = { addr: BigInt(0x0a000000), prefix: 24 };
const plan = planSubnets(FAMILIES[4], root, [
  { name: 'web', hosts: 100 },
  { name: 'link', hosts: 2 },
]);
const rows = leaves(FAMILIES[4], root, new Set(plan.splits));

describe('planTable', () => {
  it('describes every row of the divide, named or not', () => {
    const { headers, records } = planTable(4, rows, plan.names);
    expect(headers).toEqual([
      'Name',
      'Subnet',
      'Netmask',
      'First usable',
      'Last usable',
      'Broadcast',
      'Usable hosts',
    ]);
    expect(records[0]).toEqual([
      'web',
      '10.0.0.0/25',
      '255.255.255.128',
      '10.0.0.1',
      '10.0.0.126',
      '10.0.0.127',
      '126',
    ]);
    expect(records[1]).toEqual(['link', '10.0.0.128/31', '255.255.255.254', '10.0.0.128', '10.0.0.129', '', '2']);
    expect(records[2][0]).toBe('');
    expect(records).toHaveLength(rows.length);
  });

  it('writes IPv6 totals as exact digits, never a lossy number', () => {
    const root6 = { addr: parseIPv6('2001:db8::'), prefix: 64 };
    const { headers, records } = planTable(6, leaves(FAMILIES[6], root6, new Set()), {
      '2001:db8::/64': 'lan',
    });
    expect(headers).toEqual(['Name', 'Subnet', 'First address', 'Last address', 'Addresses']);
    expect(records).toEqual([
      ['lan', '2001:db8::/64', '2001:db8::', '2001:db8::ffff:ffff:ffff:ffff', '18446744073709551616'],
    ]);
  });
});

describe('planToCsv', () => {
  it('is a header row and one CRLF-terminated line per subnet', () => {
    const csv = planToCsv(4, rows, plan.names);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Name,Subnet,Netmask,First usable,Last usable,Broadcast,Usable hosts');
    expect(lines[1]).toBe('web,10.0.0.0/25,255.255.255.128,10.0.0.1,10.0.0.126,10.0.0.127,126');
    expect(lines.at(-1)).toBe('');
    expect(lines).toHaveLength(rows.length + 2);
  });

  it('quotes commas and quotes, and defuses a name a spreadsheet would run', () => {
    const csv = planToCsv(4, rows.slice(0, 2), {
      '10.0.0.0/25': 'web, "prod"',
      '10.0.0.128/31': '=HYPERLINK("http://x")',
    });
    const lines = csv.split('\r\n');
    expect(lines[1].startsWith('"web, ""prod""",10.0.0.0/25,')).toBe(true);
    expect(lines[2].startsWith('"\'=HYPERLINK(""http://x"")",')).toBe(true);
  });
});

describe('planToMarkdown', () => {
  it('is a pipe table with a rule under the header', () => {
    const md = planToMarkdown(4, rows.slice(0, 1), plan.names).split('\n');
    expect(md[0]).toBe(
      '| Name | Subnet | Netmask | First usable | Last usable | Broadcast | Usable hosts |'
    );
    expect(md[1]).toBe('| --- | --- | --- | --- | --- | --- | --- |');
    expect(md[2]).toBe(
      '| web | 10.0.0.0/25 | 255.255.255.128 | 10.0.0.1 | 10.0.0.126 | 10.0.0.127 | 126 |'
    );
  });

  it('escapes a pipe in a name so it cannot break the row', () => {
    const md = planToMarkdown(4, rows.slice(0, 1), { '10.0.0.0/25': 'a|b' });
    expect(md).toContain('| a\\|b | 10.0.0.0/25 |');
  });
});

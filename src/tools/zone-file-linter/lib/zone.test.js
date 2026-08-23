import { describe, expect, it } from 'vitest';
import { diffZones, lintZone, parseZone } from './zone.js';

const validZone = `$ORIGIN example.com.
$TTL 3600
@ IN SOA ns1.example.com. hostmaster.example.com. ( 2026082301 3600 900 1209600 300 )
@ IN NS ns1.example.com.
ns1 IN A 192.0.2.1
www IN A 192.0.2.20
    IN AAAA 2001:db8::20
@ IN MX 10 mail.example.com.
mail IN A 192.0.2.25`;

describe('zone file parser and linter', () => {
  it('parses directives, multiline records and inherited owners', () => {
    const parsed = parseZone(validZone);
    expect(parsed.origin).toBe('example.com.');
    expect(parsed.records).toHaveLength(7);
    expect(parsed.records.find((record) => record.type === 'AAAA').name).toBe('www.example.com.');
  });

  it('accepts a structurally sound zone', () => {
    const result = lintZone(validZone);
    expect(result.counts.error).toBe(0);
    expect(result.normalized).toContain('www.example.com. 3600 IN A 192.0.2.20');
  });

  it('detects CNAME coexistence, bad MX targets and duplicate records', () => {
    const result = lintZone(`${validZone}\nwww IN CNAME target.example.com.\n@ IN MX 20 192.0.2.30\nmail IN A 192.0.2.25`);
    expect(result.findings.map((item) => item.code)).toEqual(expect.arrayContaining(['cname-coexists', 'ip-target', 'duplicate-record']));
  });

  it('diffs canonical record sets', () => {
    const changed = validZone.replace('192.0.2.20', '192.0.2.21');
    const diff = diffZones(validZone, changed);
    expect(diff.added).toHaveLength(1);
    expect(diff.removed).toHaveLength(1);
  });

  it('preserves parentheses inside quoted TXT data', () => {
    const result = lintZone(`${validZone}\nnotes IN TXT "hello   (world)"`);
    expect(result.records.at(-1).data).toBe('"hello   (world)"');
    expect(result.normalized).toContain('"hello   (world)"');
  });

  it('resolves relative and repeated origins against the current origin', () => {
    const parsed = parseZone(`$ORIGIN example.com.
@ IN SOA ns.example.com. hostmaster.example.com. 1 2 3 4 5
@ IN NS ns.example.com.
$ORIGIN child
@ IN A 192.0.2.1
alias IN CNAME target
$ORIGIN sibling.example.
@ IN A 192.0.2.2`);
    expect(parsed.origin).toBe('example.com.');
    expect(parsed.records.map((record) => record.name)).toEqual([
      'example.com.',
      'example.com.',
      'child.example.com.',
      'alias.child.example.com.',
      'sibling.example.',
    ]);
    expect(parsed.records[3].origin).toBe('child.example.com.');
    expect(lintZone(`$ORIGIN example.com.
@ IN SOA ns.example.com. hostmaster.example.com. 1 2 3 4 5
@ IN NS ns.example.com.
$ORIGIN child
alias IN CNAME target`).normalized).toContain('CNAME target.child.example.com.');
  });

  it('inherits explicitly stated TTL and class when no default TTL exists', () => {
    const parsed = parseZone(`$ORIGIN example.com.
first 7200 CH TXT "one"
second TXT "two"`);
    expect(parsed.records[1]).toMatchObject({ ttl: 7200, class: 'CH' });
  });

  it('rejects invalid address and structured target data', () => {
    const result = lintZone(`${validZone}
bad4 IN A 999.999.999.999
bad6 IN AAAA 2001:::1
badmx IN MX nope mail.example.com.
badsrv IN SRV 0 0 70000 target.example.com.`);
    expect(result.findings.map((item) => item.code)).toEqual(expect.arrayContaining([
      'invalid-a', 'invalid-aaaa', 'invalid-mx', 'invalid-srv',
    ]));
  });
});

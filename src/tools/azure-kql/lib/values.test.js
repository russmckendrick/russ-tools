import { describe, expect, it } from 'vitest';
import { parseAddress, parseDatetime, parseEnum, parseInteger, parseList, parseRange, parseReal, parseRegex, parseText } from './values.js';

describe('parseAddress', () => {
  it('reads IPv4 addresses and ranges', () => {
    expect(parseAddress(' 10.0.0.1 ').parsed).toEqual({ family: 4, address: '10.0.0.1', prefix: null });
    expect(parseAddress('10.0.0.0/8').parsed).toEqual({ family: 4, address: '10.0.0.0', prefix: 8 });
  });

  it('reads IPv6 addresses and ranges', () => {
    expect(parseAddress('2001:DB8::1').parsed).toEqual({ family: 6, address: '2001:db8::1', prefix: null });
    expect(parseAddress('2001:db8::/32').parsed.prefix).toBe(32);
  });

  it('says what is wrong', () => {
    expect(parseAddress('10.0.0.300').message).toBe('10.0.0.300 is not an IPv4 address: each part must be 0 to 255.');
    expect(parseAddress('10.0.0.0/33').message).toBe('/33 is not a prefix length for IPv4: use 0 to 32.');
    expect(parseAddress('2001:db8::/129').message).toBe('/129 is not a prefix length for IPv6: use 0 to 128.');
    expect(parseAddress('server01').message).toBe('server01 is not an IPv4 or IPv6 address.');
    expect(parseAddress('10.0.0.0/8/9').message).toBe('10.0.0.0/8/9 has more than one "/".');
    expect(parseAddress('1.2.3.4" or true').ok).toBe(false);
  });

  it('treats blank as not yet filled in', () => {
    expect(parseAddress('  ')).toEqual({ ok: false, empty: true });
  });
});

describe('numbers', () => {
  it('bounds a port', () => {
    const port = (raw) => parseInteger(raw, { min: 0, max: 65535, noun: 'port' });
    expect(port('443').parsed).toBe(443);
    expect(port('70000').message).toBe('The port must be from 0 to 65535.');
    expect(port('44x').message).toBe('Use a whole number for the port.');
    expect(port('4.5').ok).toBe(false);
  });

  it('reads a real and refuses an expression', () => {
    expect(parseReal('0.5').parsed).toBe(0.5);
    expect(parseReal('-2').parsed).toBe(-2);
    expect(parseReal('1e3').ok).toBe(false);
    expect(parseReal('1 or true').message).toBe('Use a number, such as 2 or 0.5.');
  });

  it('needs both ends of a range, in order', () => {
    const whole = (raw) => parseInteger(raw);
    expect(parseRange('80', '443', whole).parsed).toEqual([80, 443]);
    expect(parseRange('80', '', whole).message).toBe('A range needs both ends.');
    expect(parseRange('443', '80', whole).message).toBe('The first value must not be larger than the second.');
    expect(parseRange('', '', whole).empty).toBe(true);
  });
});

describe('text, lists, enums, dates and regexes', () => {
  it('trims text and caps its length', () => {
    expect(parseText('  contoso  ').parsed).toBe('contoso');
    expect(parseText('x'.repeat(2001)).ok).toBe(false);
  });

  it('splits a list on commas and new lines, not spaces', () => {
    expect(parseList('New York, London\nParis', parseText).parsed).toEqual(['New York', 'London', 'Paris']);
    expect(parseList(' , ', parseText).empty).toBe(true);
    expect(parseList(Array.from({ length: 51 }, (_, i) => i).join(','), parseText).message).toBe('A list takes at most 50 values.');
  });

  it('reports the list item that is wrong', () => {
    expect(parseList('10.0.0.1, 10.0.0.999', parseAddress).message).toContain('10.0.0.999');
  });

  it('matches an enum value in any case and returns the documented spelling', () => {
    expect(parseEnum('DENIED', ['Allowed', 'Denied']).parsed).toBe('Denied');
    expect(parseEnum('maybe', ['Allowed', 'Denied']).message).toBe('maybe is not one of: Allowed, Denied.');
  });

  it('normalises a date and time to UTC seconds', () => {
    expect(parseDatetime('2026-11-14T09:30').parsed).toBe('2026-11-14T09:30:00Z');
    expect(parseDatetime('2026-11-14').parsed).toBe('2026-11-14T00:00:00Z');
    expect(parseDatetime('2026-02-30T00:00').message).toBe('2026-02-30T00:00 is not a real date and time.');
    expect(parseDatetime('last tuesday').ok).toBe(false);
  });

  it('refuses a regex Kusto cannot run', () => {
    expect(parseRegex('^10\\.\\d+').ok).toBe(true);
    expect(parseRegex('(?=x)').message).toBe('Kusto uses RE2, which has no lookaround or backreferences.');
    expect(parseRegex('(unclosed').message).toBe('That is not a valid regular expression.');
  });
});

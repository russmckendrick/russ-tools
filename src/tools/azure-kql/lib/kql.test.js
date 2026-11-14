import { describe, expect, it } from 'vitest';
import { datetimeLiteral, isIdentifier, isTimespan, numberLiteral, stringLiteral, verbatimLiteral } from './kql.js';

describe('stringLiteral', () => {
  it('escapes the quote that used to break out of the literal', () => {
    expect(stringLiteral('bob" or 1==1 //')).toBe('"bob\\" or 1==1 //"');
  });

  it('escapes backslashes before quotes, so a trailing backslash cannot eat the closing quote', () => {
    expect(stringLiteral('C:\\Temp\\')).toBe('"C:\\\\Temp\\\\"');
    expect(stringLiteral('\\"')).toBe('"\\\\\\""');
  });

  it('writes newlines and tabs as escapes and drops other control characters', () => {
    expect(stringLiteral('a\nb\tc')).toBe('"a\\nb\\tc"');
    expect(stringLiteral('a\r\nb')).toBe('"a\\nb"');
    expect(stringLiteral('a\u0000b\u001fc\u007fd')).toBe('"abcd"');
  });

  it('leaves single quotes, pipes and non-ASCII text alone', () => {
    expect(stringLiteral("o'brien | take 1")).toBe('"o\'brien | take 1"');
    expect(stringLiteral('zoë@contoso.com')).toBe('"zoë@contoso.com"');
  });
});

describe('verbatimLiteral', () => {
  it('keeps backslashes and doubles quotes', () => {
    expect(verbatimLiteral('^10\\.\\d+ "x"$')).toBe('@"^10\\.\\d+ ""x""$"');
  });

  it('cannot span lines', () => {
    expect(verbatimLiteral('a\nb')).toBe('@"a b"');
  });
});

describe('the other literals', () => {
  it('writes numbers plainly and refuses anything else', () => {
    expect(numberLiteral('443')).toBe('443');
    expect(numberLiteral(0.5)).toBe('0.5');
    expect(() => numberLiteral('1; drop')).toThrow();
  });

  it('writes a UTC datetime and refuses a loose one', () => {
    expect(datetimeLiteral('2026-11-14T09:30:00Z')).toBe('datetime(2026-11-14T09:30:00Z)');
    expect(() => datetimeLiteral('yesterday')).toThrow();
  });

  it('knows a timespan from a sentence', () => {
    expect(['15m', '24h', '7d', '90s'].every(isTimespan)).toBe(true);
    expect(['', '0h', '24', '1w', '24h) | take 1', 'h'].some(isTimespan)).toBe(false);
  });

  it('knows an identifier from an expression', () => {
    expect(isIdentifier('_ResourceId')).toBe(true);
    expect(isIdentifier('a b')).toBe(false);
    expect(isIdentifier('T | take 1')).toBe(false);
  });
});

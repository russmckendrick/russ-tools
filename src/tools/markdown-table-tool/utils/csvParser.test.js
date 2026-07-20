import { describe, it, expect } from 'vitest';
import { parseCSV, detectDelimiter, convertToCSV, convertToTSV } from './csvParser.js';

// Characterization tests for the markdown-table CSV core. Captured before the
// Phase 3 port so the ported implementation can be diffed against known-good output.

describe('parseCSV', () => {
  it('parses a simple comma-separated table', () => {
    expect(parseCSV('a,b\n1,2')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('respects quoted fields containing the delimiter', () => {
    expect(parseCSV('a,"b,c"')).toEqual([['a', 'b,c']]);
  });

  it('unescapes doubled quotes inside quoted fields', () => {
    expect(parseCSV('a,"say ""hi"""')).toEqual([['a', 'say "hi"']]);
  });

  it('handles CRLF line endings and skips blank lines', () => {
    expect(parseCSV('a,b\r\n\r\n1,2')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('parses with a tab delimiter', () => {
    expect(parseCSV('a\tb\n1\t2', '\t')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('trims surrounding whitespace on every field', () => {
    expect(parseCSV(' a , b ')).toEqual([['a', 'b']]);
  });

  it('returns an empty array for empty or non-string input', () => {
    expect(parseCSV('')).toEqual([]);
    expect(parseCSV(null)).toEqual([]);
  });
});

describe('detectDelimiter', () => {
  it('detects comma, tab, semicolon and pipe', () => {
    expect(detectDelimiter('a,b,c')).toBe(',');
    expect(detectDelimiter('a\tb\tc')).toBe('\t');
    expect(detectDelimiter('a;b;c')).toBe(';');
    expect(detectDelimiter('a|b|c')).toBe('|');
  });

  it('defaults to comma when no delimiter is present', () => {
    expect(detectDelimiter('abc')).toBe(',');
    expect(detectDelimiter(null)).toBe(',');
  });
});

describe('convertToCSV', () => {
  it('joins rows and columns', () => {
    expect(convertToCSV([['a', 'b'], ['1', '2']])).toBe('a,b\n1,2');
  });

  it('quotes fields containing the delimiter, quotes or newlines', () => {
    expect(convertToCSV([['a,b']])).toBe('"a,b"');
    expect(convertToCSV([['say "hi"']])).toBe('"say ""hi"""');
    expect(convertToCSV([['line1\nline2']])).toBe('"line1\nline2"');
  });

  it('returns an empty string for empty input', () => {
    expect(convertToCSV([])).toBe('');
    expect(convertToCSV(null)).toBe('');
  });

  // FIXED in the Phase 3 port (see BEHAVIOR_CHANGES.md): only null and
  // undefined become empty cells. A numeric 0 and a boolean false are data.
  it('keeps falsy non-empty values such as 0 and false', () => {
    expect(convertToCSV([[0, false, 'x']])).toBe('0,false,x');
    expect(convertToCSV([[null, undefined, '']])).toBe(',,');
  });
});

describe('convertToTSV', () => {
  it('separates fields with a real tab character', () => {
    const tsv = convertToTSV([['a', 'b'], ['1', '2']]);
    expect(tsv).toBe('a\tb\n1\t2');
    expect(tsv).not.toContain('\\t');
  });
});

// Regression guard for the export dialog bug where JSX `value="\t"` passed the
// two-character string \t instead of a real tab character.
describe('tab delimiter round-trip', () => {
  const data = [['Name', 'Role'], ['Ada', 'Engineer']];

  it('round-trips through a real tab delimiter', () => {
    const tsv = convertToCSV(data, '\t');
    expect(parseCSV(tsv, '\t')).toEqual(data);
  });

  it('does not round-trip through the literal two-character "\\t"', () => {
    const broken = convertToCSV(data, '\\t');
    expect(broken).toContain('\\t');
    expect(parseCSV(broken, '\t')).not.toEqual(data);
  });
});

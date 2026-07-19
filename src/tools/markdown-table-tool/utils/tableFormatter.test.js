import { describe, it, expect } from 'vitest';
import {
  formatMarkdownTable,
  parseMarkdownTable,
  validateMarkdownTable,
} from './tableFormatter.js';

// Characterization tests for the markdown-table format/parse core — porting contract #3
// in docs/plans/redesign-plan.md.

const DATA = [['Name', 'Role'], ['Ada', 'Engineer']];

describe('formatMarkdownTable', () => {
  it('pads columns and encodes alignment in the separator row', () => {
    expect(formatMarkdownTable(DATA, ['left', 'right'], true)).toBe(
      '| Name | Role     |\n| ---- | -------: |\n| Ada  | Engineer |'
    );
  });

  it('encodes centre alignment with colons on both sides', () => {
    const out = formatMarkdownTable(DATA, ['center', 'center'], true);
    expect(out.split('\n')[1]).toContain(':');
    expect(out.split('\n')[1]).toMatch(/:\s*-+\s*:/);
  });
});

describe('parseMarkdownTable', () => {
  it('round-trips data, alignments and hasHeader through format', () => {
    const parsed = parseMarkdownTable(formatMarkdownTable(DATA, ['left', 'right'], true));
    expect(parsed.data).toEqual(DATA);
    expect(parsed.alignments).toEqual(['left', 'right']);
    expect(parsed.hasHeader).toBe(true);
  });

  it('parses a hand-written table with irregular spacing', () => {
    const parsed = parseMarkdownTable('|a|b|\n|---|---|\n|1|2|');
    expect(parsed.data).toEqual([['a', 'b'], ['1', '2']]);
  });
});

describe('validateMarkdownTable', () => {
  it('accepts a well-formed table and reports stats', () => {
    const res = validateMarkdownTable('| a | b |\n| --- | --- |\n| 1 | 2 |');
    expect(res.isValid).toBe(true);
    expect(res.errors).toEqual([]);
    expect(res.stats).toEqual({ totalRows: 3, hasHeader: true, columns: 2 });
  });

  it('rejects input that is not a table', () => {
    expect(validateMarkdownTable('just some prose').isValid).toBe(false);
  });
});

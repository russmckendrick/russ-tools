import { describe, it, expect } from 'vitest';
import { excelCellToText, parseExcelData } from './csvParser.js';

/**
 * The xlsx round trip, and the type coercion it depends on.
 *
 * This replaces `exceljs.smoke.test.js`, which existed to pin an interop
 * trap: exceljs is a UMD/CommonJS bundle whose dynamic import yielded a
 * different shape in Node, the Vite build and the Astro build, so
 * `(await import('exceljs')).default` was load-bearing and easy to "tidy"
 * into a breakage. `write-excel-file` and `read-excel-file` are real ESM
 * with browser entry points, so that whole class of fault is gone.
 *
 * What replaces it is the genuine behaviour difference in the swap.
 * exceljs handed back `cell.text` — always a pre-formatted string.
 * read-excel-file returns typed values: `Date`, `boolean`, `number`, `null`.
 * A naive `String(value)` turns a date into
 * "Mon Jan 01 1995 00:00:00 GMT+0000 (Coordinated Universal Time)", which is
 * exactly the kind of thing that looks fine in a unit test written against
 * strings and awful in a Markdown table.
 */

describe('excelCellToText', () => {
  it('renders a date-only value as YYYY-MM-DD', () => {
    expect(excelCellToText(new Date('1995-01-01T00:00:00.000Z'))).toBe('1995-01-01');
  });

  it('keeps the time when a value carries one', () => {
    expect(excelCellToText(new Date('1995-01-01T09:30:00.000Z'))).toBe(
      '1995-01-01T09:30:00.000Z'
    );
  });

  it('preserves falsy values rather than blanking them', () => {
    // The same fault convertToCSV had: `String(value || '')` loses a real 0.
    expect(excelCellToText(0)).toBe('0');
    expect(excelCellToText(false)).toBe('false');
  });

  it('renders empty cells as empty strings', () => {
    expect(excelCellToText(null)).toBe('');
    expect(excelCellToText(undefined)).toBe('');
  });

  it('passes strings and numbers through', () => {
    expect(excelCellToText('10.0.0.0/16')).toBe('10.0.0.0/16');
    expect(excelCellToText(42)).toBe('42');
  });
});

describe('xlsx round trip', () => {
  /**
   * Writes a sheet with the same writer the azure-naming export uses, via
   * its Node entry point (the browser entry downloads rather than returning
   * bytes). `parseExcelData` takes the reader's `Blob | ArrayBuffer` input,
   * so the buffer is handed over as an ArrayBuffer.
   */
  const writeSheet = async (sheetData, sheetOptions) => {
    const writeXlsxFile = (await import('write-excel-file/node')).default;
    const buffer = await writeXlsxFile(sheetData, sheetOptions).toBuffer();
    return buffer;
  };

  const asArrayBuffer = (buffer) =>
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  it('writes a real xlsx and reads its rows back', async () => {
    const buffer = await writeSheet([
      ['name', 'cidr'],
      ['prod', '10.0.0.0/16'],
    ]);

    // A real xlsx is a zip.
    expect(buffer.subarray(0, 2).toString()).toBe('PK');

    const rows = await parseExcelData(asArrayBuffer(buffer));
    expect(rows).toEqual([
      ['name', 'cidr'],
      ['prod', '10.0.0.0/16'],
    ]);
  });

  it('carries numbers, booleans and dates through as table text', async () => {
    const buffer = await writeSheet([
      [{ value: 'count', type: String }, { value: 'ok', type: String }, { value: 'when', type: String }],
      [
        { value: 0, type: Number },
        { value: false, type: Boolean },
        { value: new Date('1995-01-01T00:00:00.000Z'), type: Date, format: 'yyyy-mm-dd' },
      ],
    ]);

    const rows = await parseExcelData(asArrayBuffer(buffer));
    expect(rows[0]).toEqual(['count', 'ok', 'when']);
    expect(rows[1]).toEqual(['0', 'false', '1995-01-01']);
  });

  it('drops trailing empty cells and fully empty rows', async () => {
    const buffer = await writeSheet([
      ['a', 'b', null],
      [null, null, null],
      ['c', null, null],
    ]);

    expect(await parseExcelData(asArrayBuffer(buffer))).toEqual([['a', 'b'], ['c']]);
  });
});

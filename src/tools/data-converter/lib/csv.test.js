import { describe, expect, it } from 'vitest';
import parseJson from 'json-parse-even-better-errors';
import * as TOML from '@ltd/j-toml';
import { CsvError, detectDelimiter, findRecords, looksLikeCsv, parseCsv, parseCsvRows, resolveDelimiter, toCsv } from './csv.js';

const values = (text, delimiter) => parseCsvRows(text, delimiter).map((row) => row.fields.map((field) => field.value));
const caught = (fn) => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('expected a throw');
};

describe('parseCsvRows', () => {
  it('splits rows and fields', () => {
    expect(values('a,b,c\n1,2,3\n')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('reads quoted fields with delimiters, doubled quotes and newlines inside', () => {
    expect(values('name,note\n"Lovelace, Ada","said ""hello""\nthen left"\n')).toEqual([
      ['name', 'note'],
      ['Lovelace, Ada', 'said "hello"\nthen left'],
    ]);
  });

  it('accepts CRLF, a lone CR, a byte-order mark and no final newline', () => {
    expect(values('\uFEFFa,b\r\n1,2\r3,4')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('skips blank lines but keeps a row of empty fields', () => {
    expect(values('a,b\n\n1,2\n,\n\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['', ''],
    ]);
  });

  it('trims unquoted fields and leaves quoted ones exactly as written', () => {
    const [row] = parseCsvRows('  a  , " b " ,c');
    expect(row.fields).toEqual([
      { value: 'a', quoted: false },
      { value: ' b ', quoted: true },
      { value: 'c', quoted: false },
    ]);
  });

  it('treats a quote in the middle of an unquoted field as text', () => {
    expect(values('size\n5" nail\n')).toEqual([['size'], ['5" nail']]);
  });

  it('uses the delimiter it is given', () => {
    expect(values('a;b\n"x;y";2', ';')).toEqual([
      ['a', 'b'],
      ['x;y', '2'],
    ]);
    expect(values('a\tb\n1\t2', '\t')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
    expect(values('a|b\n1|2', '|')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('records the line each row starts on, counting newlines inside quotes', () => {
    expect(parseCsvRows('a\n"x\ny"\nz').map((row) => row.line)).toEqual([1, 2, 4]);
  });

  it('refuses a quote that is never closed, naming the line it opened on', () => {
    const error = caught(() => parseCsvRows('a,b\n1,"oops\n3,4\n'));
    expect(error).toBeInstanceOf(CsvError);
    expect(error.line).toBe(2);
    expect(error.message).toMatch(/Line 2: a quoted field is opened here and never closed/);
  });

  it('refuses text after a closing quote', () => {
    expect(caught(() => parseCsvRows('a\n"x"y\n')).message).toMatch(/Line 2: there is text after a closing quote/);
  });
});

describe('parseCsv', () => {
  it('maps a header row and rows to a list of objects', () => {
    expect(parseCsv('id,name,active\n1,Ada,true\n2,Grace,false\n')).toEqual([
      { id: 1, name: 'Ada', active: true },
      { id: 2, name: 'Grace', active: false },
    ]);
  });

  it('infers only values written the way JSON writes them', () => {
    const [row] = parseCsv('a,b,c,d,e,f,g\n007,1.50,1e3,-2.5,TRUE,12345678901234567890,0\n');
    expect(row).toEqual({ a: '007', b: '1.50', c: '1e3', d: -2.5, e: 'TRUE', f: '12345678901234567890', g: 0 });
  });

  it('reads an empty cell as null and a quoted cell as text', () => {
    expect(parseCsv('a,b,c\n,"","42"\n')).toEqual([{ a: null, b: '', c: '42' }]);
  });

  it('leaves everything as text when inference is off', () => {
    expect(parseCsv('a,b\n1,\n', { inferTypes: false })).toEqual([{ a: '1', b: '' }]);
  });

  it('returns an empty list for a header with no rows', () => {
    expect(parseCsv('a,b\n')).toEqual([]);
  });

  it.each([
    ['', /no rows/, 1],
    ['a,b\n1,2,3\n', /Line 2 has 3 fields, but the header row has 2/, 2],
    ['a,b\n1\n', /Line 2 has 1 field, but the header row has 2/, 2],
    ['a,,c\n1,2,3\n', /Column 2 has no name/, 1],
    ['a,b,a\n1,2,3\n', /The header "a" appears twice/, 1],
  ])('refuses %j', (text, message, line) => {
    const error = caught(() => parseCsv(text));
    expect(error.message).toMatch(message);
    expect(error.line).toBe(line);
  });
});

describe('toCsv', () => {
  it('writes a header row and rows', () => {
    expect(toCsv([{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }])).toBe('id,name\n1,Ada\n2,Grace\n');
  });

  it('takes the union of keys in first-seen order and leaves gaps empty', () => {
    expect(toCsv([{ a: 1 }, { b: 2, a: 3 }, { c: 4 }])).toBe('a,b,c\n1,,\n3,2,\n,,4\n');
  });

  it('quotes what needs quoting', () => {
    expect(toCsv([{ 'full name': 'Lovelace, Ada', note: 'said "hi"', lines: 'one\ntwo', padded: ' x ' }])).toBe(
      'full name,note,lines,padded\n"Lovelace, Ada","said ""hi""","one\ntwo"," x "\n',
    );
  });

  it('quotes text that would otherwise come back as a number, a boolean or null', () => {
    expect(toCsv([{ a: '42', b: 'true', c: '', d: null, e: 42, f: true, g: 'plain' }])).toBe(
      'a,b,c,d,e,f,g\n"42","true","",,42,true,plain\n',
    );
  });

  it('uses the delimiter it is given, quoting fields that contain it', () => {
    expect(toCsv([{ a: 'x;y', b: 'p,q' }], { delimiter: ';' })).toBe('a;b\n"x;y";p,q\n');
    expect(toCsv([{ a: 1, b: 2 }], { delimiter: '\t' })).toBe('a\tb\n1\t2\n');
  });

  it('looks inside single wrapping keys for the list', () => {
    expect(toCsv({ rows: { row: [{ a: 1 }, { a: 2 }] } })).toBe('a\n1\n2\n');
    expect(toCsv({ products: [{ sku: 'x' }] })).toBe('sku\nx\n');
  });

  it('writes nothing for an empty list', () => {
    expect(toCsv([])).toBe('');
  });

  it('refuses a nested value, naming the row and the first offending key', () => {
    const data = [
      { id: 1, name: 'Ada' },
      { id: 2, address: { city: 'London' }, tags: ['a'] },
    ];
    expect(() => toCsv(data)).toThrow('Row 2, key "address" holds an object. CSV cells hold single values');
    expect(() => toCsv([{ tags: ['a', 'b'] }])).toThrow('Row 1, key "tags" holds a list.');
  });

  it('refuses a row that is not an object', () => {
    expect(() => toCsv([{ a: 1 }, 5])).toThrow('Row 2 is a number, not an object.');
    expect(() => toCsv([[1, 2]])).toThrow('Row 1 is a list, not an object.');
  });

  it('refuses a document that is not a list, saying what it found', () => {
    expect(() => toCsv({ name: 'Ada', age: 36 })).toThrow(
      'CSV needs a list of records. This is a single object with 2 keys ("name", "age"), not a list.',
    );
    expect(() => toCsv({ company: { name: 'x', city: 'y', founded: 1, staff: 2 } })).toThrow(
      'Inside "company" there is a single object with 4 keys ("name", "city", "founded", ...), not a list.',
    );
    expect(() => toCsv('hello')).toThrow('This is a piece of text, not a list.');
    expect(() => toCsv({ only: 5 })).toThrow('Inside "only" there is a number, not a list.');
  });

  it('writes TOML integers and dates, which arrive as BigInt and date objects', () => {
    const data = TOML.parse('[[row]]\nid = 1\nwhen = 2024-01-02T03:04:05Z\n[[row]]\nid = 2\nwhen = 2025-06-07T08:09:10Z\n');
    expect(toCsv(data)).toBe('id,when\n1,2024-01-02T03:04:05Z\n2,2025-06-07T08:09:10Z\n');
  });

  it('ignores the Symbol metadata the JSON parser attaches', () => {
    const data = parseJson('[\n  {"a": 1, "b": "x"}\n]');
    expect(Object.getOwnPropertySymbols(data).length).toBeGreaterThan(0);
    expect(toCsv(data)).toBe('a,b\n1,x\n');
  });
});

describe('round trips', () => {
  const records = [
    { id: 1, name: 'Ada', score: 9.5, active: true, note: null, code: '007', quote: 'she said "hi"', blank: '' },
    { id: 2, name: 'Lovelace, A.', score: -3, active: false, note: 'two\nlines', code: '42', quote: ' padded ', blank: 'x' },
  ];

  it.each([[','], [';'], ['\t'], ['|']])('JSON to CSV to JSON with %j keeps every value and its type', (delimiter) => {
    expect(parseCsv(toCsv(records, { delimiter }), { delimiter })).toEqual(records);
  });

  it('CSV to JSON to CSV keeps the text', () => {
    const text = 'id,name,note\n1,Ada,\n2,"Lovelace, A.","two\nlines"\n';
    expect(toCsv(parseCsv(text))).toBe(text);
  });
});

describe('findRecords', () => {
  it('returns the list itself', () => {
    const list = [{ a: 1 }];
    expect(findRecords(list)).toBe(list);
  });
});

describe('detectDelimiter and resolveDelimiter', () => {
  it.each([
    ['a,b,c\n1;2;3', ','],
    ['a;b;c\n1,2,3', ';'],
    ['a\tb\n1\t2', '\t'],
    ['a|b|c', '|'],
    ['"x,y,z";b;c', ';'],
    ['single', ','],
  ])('finds the delimiter of %j', (text, delimiter) => {
    expect(detectDelimiter(text)).toBe(delimiter);
  });

  it('uses a fixed setting, and detects or defaults for auto', () => {
    expect(resolveDelimiter('semicolon', 'a,b')).toBe(';');
    expect(resolveDelimiter('tab')).toBe('\t');
    expect(resolveDelimiter('auto', 'a;b')).toBe(';');
    expect(resolveDelimiter('auto')).toBe(',');
    expect(resolveDelimiter(undefined, 'a|b')).toBe('|');
  });
});

describe('looksLikeCsv', () => {
  it.each([
    ['id,name\n1,Ada\n2,Grace\n', ','],
    ['a;b\n1;2\n', ';'],
    ['name,note\n"Lovelace, Ada","x\ny"\n', ','],
  ])('accepts %j', (text, delimiter) => {
    expect(looksLikeCsv(text, delimiter)).toBe(true);
  });

  it.each([
    ['just one line, with a comma', 'a single row'],
    ['name\nAda\nGrace\n', 'a single column'],
    ['a,b\n1,2,3\n', 'ragged rows'],
    ['key: a, b\nother: c, d\n', 'a YAML mapping'],
    ['- a, b\n- c, d\n', 'a YAML list'],
    ['name = "a, b"\nother = "c, d"\n', 'TOML'],
    ['{"a": 1,\n "b": 2,}', 'broken JSON'],
    ['[1, 2,\n 3, 4', 'a broken JSON list'],
    ['a,b\n1,"oops\n', 'an unclosed quote'],
    ['a,\n1,2\n', 'an empty header'],
  ])('refuses %j (%s)', (text) => {
    expect(looksLikeCsv(text, ',')).toBe(false);
  });
});

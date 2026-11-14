// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { FILE_EXTENSIONS, FORMATS, serialise } from './convert.js';
import { validateAs, validateCSV, validateWithDetection, validateWithPreference, validateXML } from './validation.js';

const CSV = 'id,name,active\n1,Ada,true\n2,Grace,false\n';
const XML = '<?xml version="1.0"?>\n<user id="7">\n  <name>Ada</name>\n  <role>admin</role>\n  <role>author</role>\n</user>\n';
const TOML_TEXT = '[server]\nport = 8080\nhost = "example.com"\n';

describe('auto-detect', () => {
  it('recognises CSV and does not hand it to YAML', () => {
    const result = validateWithDetection(CSV);
    expect(result).toMatchObject({ success: true, detectedFormat: 'csv' });
    expect(result.data).toEqual([
      { id: 1, name: 'Ada', active: true },
      { id: 2, name: 'Grace', active: false },
    ]);
  });

  it('recognises XML', () => {
    const result = validateWithDetection(XML);
    expect(result).toMatchObject({ success: true, detectedFormat: 'xml' });
    expect(result.data).toEqual({ user: { '@id': 7, name: 'Ada', role: ['admin', 'author'] } });
  });

  it('reports XML errors for broken markup, where YAML would have taken it as text', () => {
    const result = validateWithDetection('<user><name>Ada</user>');
    expect(result.success).toBe(false);
    expect(result.detectedFormat).toBeNull();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].format).toBe('XML');
    expect(result.errors[0].message).toMatch(/^XML Parse Error: /);
  });

  it('detects semicolon and tab tables when the delimiter is left on auto', () => {
    expect(validateWithDetection('a;b\n1;2\n').detectedFormat).toBe('csv');
    expect(validateWithDetection('a\tb\n1\t2\n')).toMatchObject({ detectedFormat: 'csv', data: [{ a: 1, b: 2 }] });
  });

  it('honours a fixed delimiter when detecting', () => {
    const result = validateWithDetection('a;b,c\n1;2,3\n', { csvDelimiter: 'semicolon' });
    expect(result).toMatchObject({ detectedFormat: 'csv', data: [{ a: 1, 'b,c': '2,3' }] });
  });

  it.each([
    ['{"a":1}', 'json'],
    ['a: 1\nb: two\n', 'yaml'],
    ['key: a, b\nother: c, d\n', 'yaml'],
    ['- a, b\n- c, d\n', 'yaml'],
    ['[owner]\nname = "Ada, Countess"\ntitle = "x, y"\n', 'toml'],
    ['just some words, nothing more', 'yaml'],
    ['name\nAda\n', 'yaml'],
  ])('still detects %j as %s', (input, format) => {
    expect(validateWithDetection(input).detectedFormat).toBe(format);
  });

  it('passes the inference setting through', () => {
    expect(validateWithDetection(CSV, { inferTypes: false }).data[0]).toEqual({ id: '1', name: 'Ada', active: 'true' });
    expect(validateWithDetection('<a><b>1</b></a>', { inferTypes: false }).data).toEqual({ a: { b: '1' } });
  });
});

describe('validateCSV and validateXML', () => {
  it('report a line for a CSV fault', () => {
    const result = validateCSV('a,b\n1,2,3\n');
    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatchObject({ line: 2, message: 'CSV Parse Error: Line 2 has 3 fields, but the header row has 2.' });
    expect(result.errors[0].suggestions.length).toBeGreaterThan(0);
  });

  it('report an XML fault without throwing', () => {
    const result = validateXML('<a><b></a>');
    expect(result.success).toBe(false);
    expect(result.errors[0].message).toMatch(/^XML Parse Error: /);
  });
});

describe('validateAs and validateWithPreference', () => {
  it('parses a single-column CSV when CSV is chosen, which detection cannot see', () => {
    expect(validateWithDetection('name\nAda\nGrace\n').detectedFormat).toBe('yaml');
    expect(validateWithPreference('csv', 'name\nAda\nGrace\n')).toMatchObject({
      success: true,
      detectedFormat: 'csv',
      data: [{ name: 'Ada' }, { name: 'Grace' }],
    });
  });

  it('falls back to detection when the input is not the chosen format', () => {
    expect(validateWithPreference('json', 'a: 1\n')).toMatchObject({ success: true, detectedFormat: 'yaml' });
    expect(validateWithPreference('xml', CSV)).toMatchObject({ success: true, detectedFormat: 'csv' });
  });

  it('shows the chosen format\'s errors when nothing parses', () => {
    const result = validateWithPreference('xml', '<a><b></a>');
    expect(result.success).toBe(false);
    expect(result.errors[0].message).toMatch(/^XML Parse Error: /);
  });

  it('detects when the choice is auto', () => {
    expect(validateWithPreference('auto', CSV).detectedFormat).toBe('csv');
    expect(validateAs('auto', XML).detectedFormat).toBe('xml');
  });

  it('does not fall back when asked for one format only', () => {
    expect(validateAs('json', 'a: 1\n').success).toBe(false);
  });
});

describe('serialise', () => {
  const convert = (input, to, options) => serialise(validateWithDetection(input, options).data, to, options);

  it('lists five formats, each with a file extension', () => {
    expect(FORMATS.map((format) => format.value)).toEqual(['json', 'yaml', 'toml', 'csv', 'xml']);
    expect(FILE_EXTENSIONS).toMatchObject({ csv: 'csv', tsv: 'csv', xml: 'xml', yml: 'yaml' });
  });

  it('converts CSV to JSON and YAML', () => {
    expect(JSON.parse(convert(CSV, 'json'))).toEqual([
      { id: 1, name: 'Ada', active: true },
      { id: 2, name: 'Grace', active: false },
    ]);
    expect(convert(CSV, 'yaml')).toBe('- id: 1\n  name: Ada\n  active: true\n- id: 2\n  name: Grace\n  active: false\n');
  });

  it('converts JSON to CSV with the configured delimiter', () => {
    const json = '[{"id": 1, "name": "Ada"}, {"id": 2, "name": "Grace; Hopper"}]';
    expect(convert(json, 'csv')).toBe('id,name\n1,Ada\n2,Grace; Hopper\n');
    expect(convert(json, 'csv', { csvDelimiter: 'semicolon' })).toBe('id;name\n1;Ada\n2;"Grace; Hopper"\n');
  });

  it('converts XML to JSON and back', () => {
    const json = convert(XML, 'json');
    expect(JSON.parse(json)).toEqual({ user: { '@id': 7, name: 'Ada', role: ['admin', 'author'] } });
    expect(convert(json, 'xml')).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<user id="7">\n  <name>Ada</name>\n  <role>admin</role>\n  <role>author</role>\n</user>\n',
    );
  });

  it('converts CSV to XML and XML rows back to CSV', () => {
    const xml = convert(CSV, 'xml');
    expect(xml).toContain('<rows>\n  <row>\n    <id>1</id>');
    expect(convert(xml, 'csv')).toBe(CSV);
  });

  it('refuses nested JSON as CSV with the offending key', () => {
    expect(() => convert('[{"id": 1, "address": {"city": "London"}}]', 'csv')).toThrow('Row 1, key "address" holds an object');
  });

  it('converts TOML with integers to JSON, YAML, XML and CSV', () => {
    expect(JSON.parse(convert(TOML_TEXT, 'json'))).toEqual({ server: { port: 8080, host: 'example.com' } });
    expect(convert(TOML_TEXT, 'yaml')).toBe('server:\n  port: 8080\n  host: example.com\n');
    expect(convert(TOML_TEXT, 'xml', { prettifyOutput: false })).toContain('<server><port>8080</port><host>example.com</host></server>');
    expect(convert('[[row]]\nid = 1\n[[row]]\nid = 2\n', 'csv')).toBe('id\n1\n2\n');
  });

  it('keeps TOML integers as integers when writing TOML', () => {
    expect(convert(TOML_TEXT, 'toml')).toContain('port = 8080');
  });

  it('writes compact JSON and XML when prettify is off', () => {
    expect(convert('{"a": {"b": 1}}', 'json', { prettifyOutput: false })).toBe('{"a":{"b":1}}');
    expect(convert('{"a": {"b": 1}}', 'xml', { prettifyOutput: false })).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<a><b>1</b></a>\n');
  });

  it('rejects a format it does not know', () => {
    expect(() => serialise({}, 'ini')).toThrow('Unsupported output format: ini');
  });
});

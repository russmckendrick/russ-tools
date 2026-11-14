// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import parseJson from 'json-parse-even-better-errors';
import * as TOML from '@ltd/j-toml';
import { XmlError, looksLikeXml, parseXml, toXml } from './xml.js';

const DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>\n';
const caught = (fn) => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('expected a throw');
};

describe('parseXml', () => {
  it('maps a leaf element to its text', () => {
    expect(parseXml('<name>Ada</name>')).toEqual({ name: 'Ada' });
  });

  it('maps child elements to keys', () => {
    expect(parseXml('<user><name>Ada</name><age>36</age></user>')).toEqual({ user: { name: 'Ada', age: 36 } });
  });

  it('maps attributes to @name and mixed text to #text', () => {
    expect(parseXml('<price currency="GBP" net="true">9.99</price>')).toEqual({
      price: { '@currency': 'GBP', '@net': true, '#text': 9.99 },
    });
  });

  it('maps repeated siblings to a list, in order', () => {
    expect(parseXml('<tags><tag>a</tag><tag>b</tag><other>x</other><tag>c</tag></tags>')).toEqual({
      tags: { tag: ['a', 'b', 'c'], other: 'x' },
    });
  });

  it('reads an empty element as empty text', () => {
    expect(parseXml('<a><b/><c></c><d x="1"/></a>')).toEqual({ a: { b: '', c: '', d: { '@x': 1 } } });
  });

  it('ignores the declaration, comments and indentation, and reads CDATA as text', () => {
    const text = `<?xml version="1.0"?>
<!-- a comment -->
<note>
  <body><![CDATA[1 < 2 & so on]]></body>
  <!-- another -->
  <to>  Ada  </to>
</note>`;
    expect(parseXml(text)).toEqual({ note: { body: '1 < 2 & so on', to: 'Ada' } });
  });

  it('decodes entities', () => {
    expect(parseXml('<a title="x &amp; y">&lt;b&gt; &quot;q&quot;</a>')).toEqual({
      a: { '@title': 'x & y', '#text': '<b> "q"' },
    });
  });

  it('keeps prefixed names as written', () => {
    expect(parseXml('<s:Envelope xmlns:s="urn:x"><s:Body>ok</s:Body></s:Envelope>')).toEqual({
      's:Envelope': { '@xmlns:s': 'urn:x', 's:Body': 'ok' },
    });
  });

  it('infers only values written the way JSON writes them', () => {
    expect(parseXml('<v><a>007</a><b>1.50</b><c>42</c><d>false</d><e>True</e></v>')).toEqual({
      v: { a: '007', b: '1.50', c: 42, d: false, e: 'True' },
    });
  });

  it('leaves everything as text when inference is off', () => {
    expect(parseXml('<v n="1"><a>42</a><b>true</b></v>', { inferTypes: false })).toEqual({
      v: { '@n': '1', a: '42', b: 'true' },
    });
  });

  it.each([
    ['<a><b></a>', 'mismatched tags'],
    ['<a>1</a><b>2</b>', 'two root elements'],
    ['<a attr=1/>', 'an unquoted attribute'],
    ['just text', 'no element at all'],
  ])('refuses %s (%s)', (text) => {
    const error = caught(() => parseXml(text));
    expect(error).toBeInstanceOf(XmlError);
    expect(error.message.length).toBeGreaterThan(0);
  });

  it('refuses empty input', () => {
    expect(() => parseXml('   ')).toThrow('There is no XML here');
  });
});

describe('toXml', () => {
  it('writes a single root with indented children', () => {
    expect(toXml({ user: { name: 'Ada', age: 36, active: true } })).toBe(
      `${DECLARATION}<user>\n  <name>Ada</name>\n  <age>36</age>\n  <active>true</active>\n</user>\n`,
    );
  });

  it('writes on one line when not prettified', () => {
    expect(toXml({ user: { name: 'Ada', tags: { tag: ['a', 'b'] } } }, { pretty: false })).toBe(
      `${DECLARATION}<user><name>Ada</name><tags><tag>a</tag><tag>b</tag></tags></user>\n`,
    );
  });

  it('writes @keys as attributes, #text as text and lists as repeated elements', () => {
    expect(toXml({ order: { '@id': 7, item: [{ '@sku': 'a', '#text': 'Pen' }, { '@sku': 'b', '#text': 'Ink' }] } })).toBe(
      `${DECLARATION}<order id="7">\n  <item sku="a">Pen</item>\n  <item sku="b">Ink</item>\n</order>\n`,
    );
  });

  it('escapes text and attribute values', () => {
    expect(toXml({ a: { '@t': 'x & "y"', '#text': '1 < 2 & 3 > 2' } }, { pretty: false })).toBe(
      `${DECLARATION}<a t="x &amp; &quot;y&quot;">1 &lt; 2 &amp; 3 &gt; 2</a>\n`,
    );
  });

  it('writes null and empty text as an empty element, and drops an empty list', () => {
    expect(toXml({ a: { b: null, c: '', d: [], e: 0 } }, { pretty: false })).toBe(
      `${DECLARATION}<a><b/><c/><e>0</e></a>\n`,
    );
  });

  it('wraps a top-level list as rows of row', () => {
    expect(toXml([{ id: 1 }, { id: 2 }], { pretty: false })).toBe(
      `${DECLARATION}<rows><row><id>1</id></row><row><id>2</id></row></rows>\n`,
    );
  });

  it.each([
    [{ a: 1, b: 2 }, 'this object has 2 top-level keys ("a", "b"). Wrap them in one key'],
    [{}, 'this object is empty'],
    [{ list: [1, 2] }, '"list" is a list, which would write several'],
    ['text', 'this is a piece of text with no name'],
    [5, 'this is a number with no name'],
  ])('refuses %j, which has no single root', (data, message) => {
    const error = caught(() => toXml(data));
    expect(error).toBeInstanceOf(XmlError);
    expect(error.message).toContain('XML needs a single root element');
    expect(error.message).toContain(message);
  });

  it('refuses a key that cannot be an element name, saying where it is', () => {
    expect(() => toXml({ root: { ok: 1, nested: { 'first name': 'Ada' } } })).toThrow(
      'The key "first name" at root > nested > first name cannot be an XML element name',
    );
    expect(() => toXml({ root: { '1st': 'x' } })).toThrow('The key "1st" at root > 1st cannot be an XML element name');
  });

  it('refuses a list inside a list, an attribute holding an object, and text holding a list', () => {
    expect(() => toXml({ root: { matrix: [[1, 2], [3, 4]] } })).toThrow('"matrix" at root > matrix holds a list inside a list');
    expect(() => toXml({ root: { '@meta': { a: 1 } } })).toThrow('The attribute "@meta" at root must be a single value, not an object');
    expect(() => toXml({ root: { '#text': [1] } })).toThrow('"#text" at root must be a single value, not a list');
  });

  it('writes TOML integers and dates, which arrive as BigInt and date objects', () => {
    const data = TOML.parse('[server]\nport = 8080\nstarted = 2024-01-02T03:04:05Z\n');
    expect(toXml(data, { pretty: false })).toBe(
      `${DECLARATION}<server><port>8080</port><started>2024-01-02T03:04:05Z</started></server>\n`,
    );
  });

  it('ignores the Symbol metadata the JSON parser attaches', () => {
    const data = parseJson('{\n  "a": {"b": 1}\n}');
    expect(toXml(data, { pretty: false })).toBe(`${DECLARATION}<a><b>1</b></a>\n`);
  });
});

describe('round trips', () => {
  const fits = {
    catalogue: {
      '@version': 2,
      '@draft': false,
      title: 'Spring list',
      book: [
        { '@id': 'b1', title: 'On Engines', price: { '@currency': 'GBP', '#text': 12.5 }, tag: ['maths', 'history'] },
        { '@id': 'b2', title: 'Notes & Sketches <1843>', price: { '@currency': 'EUR', '#text': 9 }, tag: ['notes', 'letters'] },
      ],
      publisher: { name: 'Analytical Press', address: { city: 'London', postcode: 'N1 9GU' } },
      empty: '',
    },
  };

  it('JSON to XML to JSON returns the same data, prettified or not', () => {
    expect(parseXml(toXml(fits))).toEqual(fits);
    expect(parseXml(toXml(fits, { pretty: false }))).toEqual(fits);
  });

  it('XML to JSON to XML returns the same document', () => {
    const xml = toXml(fits);
    expect(toXml(parseXml(xml))).toBe(xml);
  });

  it('keeps namespace prefixes and declarations', () => {
    const xml = `${DECLARATION}<s:Envelope xmlns:s="urn:example:soap">\n  <s:Body>ok</s:Body>\n</s:Envelope>\n`;
    expect(toXml(parseXml(xml))).toBe(xml);
  });

  it('documents what does not fit: text that looks typed, null, and one-item lists', () => {
    const lossy = { r: { code: '42', flag: 'true', gone: null, one: ['only'], padded: '  x  ' } };
    expect(parseXml(toXml(lossy))).toEqual({ r: { code: 42, flag: true, gone: '', one: 'only', padded: 'x' } });
  });

  it('a list survives as rows of row', () => {
    const list = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }];
    expect(parseXml(toXml(list))).toEqual({ rows: { row: list } });
  });
});

describe('looksLikeXml', () => {
  it.each(['<a/>', '  <?xml version="1.0"?><a/>  ', '<!-- c --><a></a>', '<_x>1</_x>'])('accepts %j', (text) => {
    expect(looksLikeXml(text)).toBe(true);
  });

  it.each(['<<: *default\nname: x', 'a < b', '{"a": "<b>"}', '<a> trailing text', '< a>'])('refuses %j', (text) => {
    expect(looksLikeXml(text)).toBe(false);
  });
});

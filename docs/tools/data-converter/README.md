# Data Converter

Validate and convert structured data between JSON, YAML, TOML, CSV, and XML in the browser.

<!-- help:start -->

## Quick start

1. Paste data into the input editor or load a JSON, YAML, YML, TOML, CSV, TSV, or XML file.
2. Leave the input format on Auto Detect, or select it explicitly if detection is ambiguous.
3. Choose JSON, YAML, TOML, CSV, or XML as the output format.
4. Select **Convert** and review both the output and the validation panel.
5. Copy or download the result from the output controls.

## Validation, settings, and history

- Validation runs after a short pause and reports the detected format and syntax errors.
- Auto Detect can convert valid input as you type; only an explicit **Convert** action is added to history.
- A chosen input format is tried first. If the input does not parse as that, Auto Detect still has a go, and the badge shows what it found. **Convert** holds you to the format you chose.
- When the input is fine but cannot be written in the output format (nested data as CSV, several top-level keys as XML), the reason appears under the output editor and the output stays empty.
- Settings control validation, schema validation, prettified output, the CSV delimiter, whether CSV and XML values are read as numbers and booleans, history, and the maximum history length.
- Samples provide known-good starting points for each supported format.
- History is optional and can reload successful conversions into the editor.

## CSV

CSV is a table, so it maps to and from **a list of flat records**: the first row is the header, and each later row becomes one object keyed by it.

- **Writing CSV** needs a list of objects whose values are single values. A nested object or list inside a row is refused, with a message naming the row and the first key at fault, instead of being squashed into text. The header is every key seen, in first-seen order; a record without a key gets an empty cell. The list can be the whole document or the only thing inside single wrapping keys, so `{"rows": {"row": [...]}}` and `{"products": [...]}` both work.
- **Reading CSV** handles quoted fields, a doubled quote (`""`) inside one, line breaks inside quotes, Windows and Unix line endings, a byte-order mark, and blank lines. Every row must have as many fields as the header, header names must be present and different, and a fault is reported with its line number.
- **Delimiter.** Settings offers Auto, comma, semicolon, tab, and pipe. Auto picks whichever of those appears most in the first row when reading, and writes commas.
- **Types.** CSV holds only text. With **Read Numbers and True/False as Values** on (the default), an unquoted `42`, `-1.5`, `true` or `false` is read as a number or boolean, and an empty unquoted cell as null. Only text that would print back exactly the same is converted, so `007`, `1.50` and `1e3` stay text. A quoted cell is always text. When writing, text that looks like a number or boolean is quoted, and empty text is written as `""`, so JSON to CSV and back returns the same values with the same types.
- Unquoted cells have surrounding spaces trimmed; quote a cell to keep them.

## XML

XML is read with the browser's own parser and follows one mapping in both directions:

- An element with only text becomes a text value: `<name>Ada</name>` is `"name": "Ada"`.
- An attribute becomes a key starting with `@`: `<book id="b1">` gives `"@id": "b1"`.
- Text beside attributes or child elements goes under `#text`: `<price currency="GBP">9.5</price>` is `{"@currency": "GBP", "#text": 9.5}`.
- Repeated sibling elements become a list: `<tag>a</tag><tag>b</tag>` is `"tag": ["a", "b"]`.
- An empty element becomes empty text: `<note/>` is `"note": ""`.

The rules around that mapping:

- **Writing XML needs a single root element**: an object with exactly one top-level key, such as `{"catalogue": {...}}`. Several top-level keys are refused with a message asking you to wrap them in one. The one exception is a top-level list, which has no name of its own and is written as `<rows>` holding one `<row>` per item; that is also the shape CSV converts to and from.
- Keys must be legal element names (start with a letter or underscore, no spaces). A list directly inside a list, or an attribute holding an object, is refused with the path to it.
- The output starts with an XML declaration and is indented when **Prettify Output** is on. Namespace prefixes and `xmlns` declarations pass through as ordinary names and attributes.
- Comments, processing instructions and the order of differently named siblings are not kept. CDATA is read as text. Leading and trailing white space around text is trimmed.
- **What round-trips.** JSON to XML to JSON returns the same data when it fits the mapping. Four things do not fit, because XML has no way to mark them: text that looks like a number or boolean comes back as one (`"42"` returns as `42`; turn the Types setting off to keep everything as text), `null` and `{}` come back as empty text, a list of one item comes back as the item, and an empty list disappears.

## Format tips

- JSON is strict about quotes, commas, and closing brackets; YAML is especially sensitive to indentation.
- TOML requires a top-level object. A top-level array, which is what CSV reads as, should be wrapped in a named object before conversion.
- TOML integers and dates convert to every other format. Integers too large for a JSON number to hold exactly are written as text.
- Comments and presentation choices do not round-trip reliably between data formats; conversion preserves data, not source formatting.
- Large or deeply nested inputs can consume significant browser memory because parsed and rendered forms exist together.

## Privacy and saved data

Parsing and conversion happen locally. Settings and, when enabled, conversion history are stored in this browser. History entries include input and output content, so disable or clear history before working with secrets or sensitive configuration.

## Troubleshooting

- If Auto Detect chooses incorrectly, select the input format manually and convert again. A CSV with a single column, or only a header row, has nothing to tell it apart from plain text, so choose CSV yourself.
- Input that starts with `<` is treated as XML, and reports XML errors if it is not well formed.
- "Line N has X fields, but the header row has Y" usually means an unquoted field contains the delimiter, or the delimiter setting is wrong for the file.
- For a TOML failure, confirm the document has a top-level table/object and uses valid TOML value types.
- For schema warnings, check required fields and types; schema validation does not prevent conversion unless the source itself cannot be parsed.

<!-- help:end -->

Parsing and detection are in [`src/tools/data-converter/lib/validation.js`](../../../src/tools/data-converter/lib/validation.js), writing and BigInt coercion in [`lib/convert.js`](../../../src/tools/data-converter/lib/convert.js) and [`lib/scalars.js`](../../../src/tools/data-converter/lib/scalars.js), and the two new formats in [`lib/csv.js`](../../../src/tools/data-converter/lib/csv.js) and [`lib/xml.js`](../../../src/tools/data-converter/lib/xml.js). Example inputs are documented in [samples.md](samples.md). The tool contract is defined in [`src/tools/data-converter/manifest.mjs`](../../../src/tools/data-converter/manifest.mjs).

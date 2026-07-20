# Data Converter

Validate and convert structured data between JSON, YAML, and TOML in the browser.

<!-- help:start -->

## Quick start

1. Paste data into the input editor or load a JSON, YAML, YML, or TOML file.
2. Leave the input format on Auto Detect, or select it explicitly if detection is ambiguous.
3. Choose JSON, YAML, or TOML as the output format.
4. Select **Convert** and review both the output and the validation panel.
5. Copy or download the result from the output controls.

## Validation, settings, and history

- Validation runs after a short pause and reports the detected format and syntax errors.
- Auto Detect can convert valid input as you type; only an explicit **Convert** action is added to history.
- Settings control validation, schema validation, prettified output, history, and the maximum history length.
- Samples provide known-good starting points for each supported format.
- History is optional and can reload successful conversions into the editor.

## Format tips

- JSON is strict about quotes, commas, and closing brackets; YAML is especially sensitive to indentation.
- TOML requires a top-level object. A top-level array should be wrapped in a named object before conversion.
- Comments and presentation choices do not round-trip reliably between data formats; conversion preserves data, not source formatting.
- Large or deeply nested inputs can consume significant browser memory because parsed and rendered forms exist together.

## Privacy and saved data

Parsing and conversion happen locally. Settings and, when enabled, conversion history are stored in this browser. History entries include input and output content, so disable or clear history before working with secrets or sensitive configuration.

## Troubleshooting

- If Auto Detect chooses incorrectly, select the input format manually and convert again.
- For a TOML failure, confirm the document has a top-level table/object and uses valid TOML value types.
- For schema warnings, check required fields and types; schema validation does not prevent conversion unless the source itself cannot be parsed.

<!-- help:end -->

Validation and BigInt coercion are implemented in [`src/tools/data-converter/lib/validation.js`](../../../src/tools/data-converter/lib/validation.js). Example inputs are documented in [samples.md](samples.md). The tool contract is defined in [`src/tools/data-converter/manifest.mjs`](../../../src/tools/data-converter/manifest.mjs).

import yaml from 'js-yaml';
import * as TOML from '@ltd/j-toml';
import { resolveDelimiter, toCsv } from './csv.js';
import { toPlainData } from './scalars.js';
import { toXml } from './xml.js';

export const FORMATS = [
  { value: 'json', label: 'JSON', extension: '.json', mime: 'application/json', language: 'json' },
  { value: 'yaml', label: 'YAML', extension: '.yml', mime: 'text/yaml', language: 'yaml' },
  { value: 'toml', label: 'TOML', extension: '.toml', mime: 'text/toml', language: 'toml' },
  { value: 'csv', label: 'CSV', extension: '.csv', mime: 'text/csv', language: 'csv' },
  { value: 'xml', label: 'XML', extension: '.xml', mime: 'application/xml', language: 'xml' },
];

export const FILE_EXTENSIONS = {
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  csv: 'csv',
  tsv: 'csv',
  xml: 'xml',
};

export function serialise(data, format, { prettifyOutput = true, csvDelimiter = 'auto' } = {}) {
  switch (format) {
    case 'json':
      return prettifyOutput ? JSON.stringify(toPlainData(data), null, 2) : JSON.stringify(toPlainData(data));

    case 'yaml':
      return yaml.dump(toPlainData(data), {
        indent: prettifyOutput ? 2 : 0,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
      });

    case 'toml':
      return TOML.stringify(data, {
        indent: prettifyOutput ? 2 : 0,
        newline: '\n',
      });

    case 'csv':
      return toCsv(data, { delimiter: resolveDelimiter(csvDelimiter) });

    case 'xml':
      return toXml(data, { pretty: prettifyOutput });

    default:
      throw new Error(`Unsupported output format: ${format}`);
  }
}

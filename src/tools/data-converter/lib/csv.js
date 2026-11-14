import { describeValue, inferScalar, isScalar, looksTyped, scalarToText } from './scalars.js';

export const CSV_DELIMITERS = [
  { value: 'auto', label: 'Auto (comma when writing)', character: null },
  { value: 'comma', label: 'Comma  ,', character: ',' },
  { value: 'semicolon', label: 'Semicolon  ;', character: ';' },
  { value: 'tab', label: 'Tab', character: '\t' },
  { value: 'pipe', label: 'Pipe  |', character: '|' },
];

const CANDIDATES = [',', ';', '\t', '|'];

export class CsvError extends Error {
  constructor(message, line = null) {
    super(message);
    this.name = 'CsvError';
    this.line = line;
  }
}

export function detectDelimiter(text) {
  const counts = new Map(CANDIDATES.map((candidate) => [candidate, 0]));
  let inQuotes = false;
  for (const char of String(text).replace(/^\uFEFF/, '')) {
    if (char === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (char === '\n' || char === '\r')) break;
    else if (!inQuotes && counts.has(char)) counts.set(char, counts.get(char) + 1);
  }
  let best = ',';
  let most = 0;
  for (const candidate of CANDIDATES) {
    if (counts.get(candidate) > most) {
      best = candidate;
      most = counts.get(candidate);
    }
  }
  return best;
}

export function resolveDelimiter(setting, text) {
  const option = CSV_DELIMITERS.find((candidate) => candidate.value === setting);
  if (option?.character) return option.character;
  return text === undefined ? ',' : detectDelimiter(text);
}

export function parseCsvRows(text, delimiter = ',') {
  const source = String(text).replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  let inQuotes = false;
  let afterQuote = false;
  let line = 1;
  let rowLine = 1;
  let quoteLine = 1;

  const endField = () => {
    row.push({ value: quoted ? value : value.trim(), quoted });
    value = '';
    quoted = false;
    afterQuote = false;
  };
  const endRow = () => {
    endField();
    const blank = row.length === 1 && !row[0].quoted && row[0].value === '';
    if (!blank) rows.push({ line: rowLine, fields: row });
    row = [];
  };

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          inQuotes = false;
          afterQuote = true;
        }
      } else {
        if (char === '\n') line += 1;
        value += char;
      }
      continue;
    }

    if (char === delimiter) {
      endField();
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      endRow();
      line += 1;
      rowLine = line;
    } else if (afterQuote) {
      if (char !== ' ' && char !== '\t') {
        throw new CsvError(
          `Line ${line}: there is text after a closing quote. A quote inside a quoted field is written twice ("").`,
          line,
        );
      }
    } else if (char === '"' && value.trim() === '') {
      value = '';
      quoted = true;
      inQuotes = true;
      quoteLine = line;
    } else {
      value += char;
    }
  }

  if (inQuotes) {
    throw new CsvError(`Line ${quoteLine}: a quoted field is opened here and never closed.`, quoteLine);
  }
  if (value !== '' || quoted || row.length > 0) endRow();

  return rows;
}

export function parseCsv(text, { delimiter = ',', inferTypes = true } = {}) {
  const rows = parseCsvRows(text, delimiter);
  if (rows.length === 0) throw new CsvError('There is no CSV here: the input has no rows.', 1);

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.fields.map((field) => field.value.trim());
  headers.forEach((header, index) => {
    if (header === '') {
      throw new CsvError(`Column ${index + 1} has no name in the header row (line ${headerRow.line}).`, headerRow.line);
    }
    if (headers.indexOf(header) !== index) {
      throw new CsvError(`The header "${header}" appears twice, so its columns cannot both be kept.`, headerRow.line);
    }
  });

  return dataRows.map(({ line, fields }) => {
    if (fields.length !== headers.length) {
      throw new CsvError(
        `Line ${line} has ${fields.length} field${fields.length === 1 ? '' : 's'}, but the header row has ${headers.length}.`,
        line,
      );
    }
    const record = {};
    fields.forEach((field, index) => {
      if (!inferTypes || field.quoted) record[headers[index]] = field.value;
      else record[headers[index]] = field.value === '' ? null : inferScalar(field.value);
    });
    return record;
  });
}

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value) && typeof value.toISOString !== 'function';

export function findRecords(data) {
  let current = data;
  const path = [];
  while (isPlainObject(current) && Object.keys(current).length === 1) {
    const [key] = Object.keys(current);
    path.push(key);
    current = current[key];
  }
  if (Array.isArray(current)) return current;

  const where = path.length ? `Inside "${path.join('" > "')}" there is` : 'This is';
  if (isPlainObject(current)) {
    const keys = Object.keys(current);
    const shown = keys.slice(0, 3).map((key) => `"${key}"`).join(', ');
    throw new Error(
      `CSV needs a list of records. ${where} a single object with ${keys.length} keys (${shown}${keys.length > 3 ? ', ...' : ''}), not a list. Convert the list you want on its own, or put the object in a list to write it as one row.`,
    );
  }
  throw new Error(`CSV needs a list of records. ${where} ${describeValue(current)}, not a list.`);
}

const quote = (text) => `"${text.replace(/"/g, '""')}"`;

const needsQuotes = (text, delimiter) =>
  text.includes(delimiter) || text.includes('"') || text.includes('\n') || text.includes('\r') || text !== text.trim();

const escapeHeader = (header, delimiter) => (needsQuotes(header, delimiter) ? quote(header) : header);

const escapeField = (value, delimiter) => {
  const text = scalarToText(value);
  const keepsItsType = typeof value === 'string' && (text === '' || looksTyped(text));
  return keepsItsType || needsQuotes(text, delimiter) ? quote(text) : text;
};

export function toCsv(data, { delimiter = ',' } = {}) {
  const records = findRecords(data);

  const headers = [];
  records.forEach((record, index) => {
    if (!isPlainObject(record)) {
      throw new Error(
        `Row ${index + 1} is ${describeValue(record)}, not an object. CSV needs every row to be a record with named values.`,
      );
    }
    for (const key of Object.keys(record)) {
      if (!isScalar(record[key])) {
        throw new Error(
          `Row ${index + 1}, key "${key}" holds ${describeValue(record[key])}. CSV cells hold single values, so nested data cannot be written; flatten it first or choose JSON, YAML or XML.`,
        );
      }
      if (!headers.includes(key)) headers.push(key);
    }
  });

  if (headers.length === 0) return '';

  const lines = [headers.map((header) => escapeHeader(header, delimiter)).join(delimiter)];
  for (const record of records) {
    lines.push(headers.map((header) => (header in record ? escapeField(record[header], delimiter) : '')).join(delimiter));
  }
  return `${lines.join('\n')}\n`;
}

const NOT_A_HEADER = /[{}[\]]/;
const YAML_OR_TOML_LINE = /^\s*(-\s|[\w"'.-]+\s*:(\s|$)|[\w.-]+\s*=)/;

export function looksLikeCsv(text, delimiter) {
  const firstLine = String(text).replace(/^\uFEFF/, '').split(/\r?\n/).find((line) => line.trim() !== '') ?? '';
  if (YAML_OR_TOML_LINE.test(firstLine)) return false;

  let rows;
  try {
    rows = parseCsvRows(text, delimiter);
  } catch {
    return false;
  }
  if (rows.length < 2) return false;

  const width = rows[0].fields.length;
  if (width < 2) return false;
  if (rows[0].fields.some((field) => field.value.trim() === '' || NOT_A_HEADER.test(field.value))) return false;
  return rows.every((row) => row.fields.length === width);
}

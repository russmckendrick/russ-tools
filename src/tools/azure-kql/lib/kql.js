const printable = (text, keep) =>
  Array.from(text)
    .filter((char) => keep.includes(char) || (char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127))
    .join('');
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TIMESPAN = /^[1-9]\d{0,4}[smhd]$/;

export function stringLiteral(value) {
  const text = printable(String(value).replace(/\r\n?/g, '\n'), '\n\t')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
  return `"${text}"`;
}

export function verbatimLiteral(value) {
  const text = printable(String(value).replace(/[\r\n\t]+/g, ' '), '').replace(/"/g, '""');
  return `@"${text}"`;
}

export function numberLiteral(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`Not a number: ${value}`);
  return String(number);
}

export function datetimeLiteral(iso) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(iso)) throw new Error(`Not a UTC timestamp: ${iso}`);
  return `datetime(${iso})`;
}

export function isTimespan(value) {
  return TIMESPAN.test(String(value));
}

export function isIdentifier(value) {
  return IDENTIFIER.test(String(value));
}

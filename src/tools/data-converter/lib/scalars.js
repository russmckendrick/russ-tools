const CANONICAL_NUMBER = /^-?(0|[1-9]\d*)(\.\d+)?$/;

export function inferScalar(text) {
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (CANONICAL_NUMBER.test(text)) {
    const number = Number(text);
    if (Number.isFinite(number) && String(number) === text) return number;
  }
  return text;
}

export function looksTyped(text) {
  return typeof inferScalar(text) !== 'string';
}

export function isScalar(value) {
  return value === null || value === undefined || typeof value !== 'object' || typeof value.toISOString === 'function';
}

export function scalarToText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && typeof value.toISOString === 'function') return value.toISOString();
  return String(value);
}

export function describeValue(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'a list';
  if (typeof value === 'object') return 'an object';
  if (typeof value === 'string') return 'a piece of text';
  return `a ${typeof value}`;
}

export function toPlainData(value) {
  if (typeof value === 'bigint') {
    return value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(value)
      : value.toString();
  }
  if (Array.isArray(value)) return value.map(toPlainData);
  if (value && typeof value === 'object') {
    if (typeof value.toISOString === 'function') return value;
    const plain = {};
    for (const key of Object.keys(value)) plain[key] = toPlainData(value[key]);
    return plain;
  }
  return value;
}

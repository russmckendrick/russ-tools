const ESCAPE_RUN = /(?:%[0-9a-fA-F]{2})+/g;
const HEX_PAIR = /^[0-9a-fA-F]{2}$/;

function sequenceLength(lead) {
  if (lead < 0x80) return 1;
  if (lead >= 0xc2 && lead <= 0xdf) return 2;
  if (lead >= 0xe0 && lead <= 0xef) return 3;
  if (lead >= 0xf0 && lead <= 0xf4) return 4;
  return 0;
}

function decodeRun(run, keep, invalid) {
  const escapes = run.match(/%[0-9a-fA-F]{2}/g);
  let out = '';
  let i = 0;
  while (i < escapes.length) {
    const length = sequenceLength(parseInt(escapes[i].slice(1), 16));
    const sequence = length > 0 ? escapes.slice(i, i + length).join('') : '';
    let decoded = null;
    if (length > 0 && i + length <= escapes.length) {
      try {
        decoded = decodeURIComponent(sequence);
      } catch {
        decoded = null;
      }
    }
    if (decoded === null) {
      invalid?.push(escapes[i]);
      out += escapes[i];
      i += 1;
    } else {
      out += keep.includes(decoded) ? sequence : decoded;
      i += length;
    }
  }
  return out;
}

export function decodeText(raw, { keep = '', plusAsSpace = false, invalid } = {}) {
  const source = plusAsSpace ? raw.replace(/\+/g, ' ') : raw;
  return source.replace(ESCAPE_RUN, (run) => decodeRun(run, keep, invalid));
}

const encoder = new TextEncoder();

function escapeCodePoint(char) {
  let out = '';
  for (const byte of encoder.encode(char)) out += `%${byte.toString(16).toUpperCase().padStart(2, '0')}`;
  return out;
}

export function encodeText(text, allowed, { keepEscapes = false, spaceAsPlus = false } = {}) {
  let out = '';
  for (let i = 0; i < text.length; ) {
    const char = String.fromCodePoint(text.codePointAt(i));
    if (keepEscapes && char === '%' && HEX_PAIR.test(text.slice(i + 1, i + 3))) {
      out += text.slice(i, i + 3);
      i += 3;
      continue;
    }
    if (allowed.test(char)) out += char;
    else if (char === ' ' && spaceAsPlus) out += '+';
    else out += escapeCodePoint(char);
    i += char.length;
  }
  return out;
}

export const COMPONENT_SAFE = /^[A-Za-z0-9\-_.!~*'()]$/;
export const PATH_SAFE = /^[A-Za-z0-9\-._~!$&'()*+,;=:@/]$/;
export const FRAGMENT_SAFE = /^[A-Za-z0-9\-._~!$&'()*+,;=:@/?]$/;

export function hasMalformedEscape(raw) {
  return /%(?![0-9a-fA-F]{2})/.test(raw);
}

function attempt(fn, text) {
  try {
    return { ok: true, value: fn(text) };
  } catch {
    return { ok: false, value: null };
  }
}

export function encodeForms(text) {
  const component = attempt(encodeURIComponent, text);
  const uri = attempt(encodeURI, text);
  return {
    component,
    uri,
    form: component.ok ? { ok: true, value: component.value.replace(/%20/g, '+') } : component,
  };
}

export function decodeForms(text) {
  const strictComponent = attempt(decodeURIComponent, text);
  const strictUri = attempt(decodeURI, text);
  const invalid = [];
  const lenient = decodeText(text, { invalid });
  return {
    component: strictComponent.ok ? strictComponent : { ok: false, value: lenient },
    uri: strictUri.ok ? strictUri : { ok: false, value: null },
    form: { ok: !hasMalformedEscape(text) && invalid.length === 0, value: decodeText(text, { plusAsSpace: true }) },
    changed: lenient !== text,
    malformed: hasMalformedEscape(text),
    invalid,
  };
}

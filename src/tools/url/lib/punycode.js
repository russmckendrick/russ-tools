const BASE = 36;
const T_MIN = 1;
const T_MAX = 26;
const SKEW = 38;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 128;
const MAX_INT = 0x7fffffff;

function adapt(delta, points, first) {
  let value = first ? Math.floor(delta / DAMP) : delta >> 1;
  value += Math.floor(value / points);
  let k = 0;
  while (value > ((BASE - T_MIN) * T_MAX) >> 1) {
    value = Math.floor(value / (BASE - T_MIN));
    k += BASE;
  }
  return k + Math.floor(((BASE - T_MIN + 1) * value) / (value + SKEW));
}

function digitOf(code) {
  if (code >= 48 && code <= 57) return code - 22;
  if (code >= 65 && code <= 90) return code - 65;
  if (code >= 97 && code <= 122) return code - 97;
  return BASE;
}

export function decodePunycode(input) {
  const output = [];
  const basic = input.lastIndexOf('-');
  for (let j = 0; j < Math.max(basic, 0); j++) {
    const code = input.charCodeAt(j);
    if (code >= 128) return null;
    output.push(code);
  }

  let n = INITIAL_N;
  let i = 0;
  let bias = INITIAL_BIAS;
  let index = basic > 0 ? basic + 1 : 0;

  while (index < input.length) {
    const old = i;
    let weight = 1;
    for (let k = BASE; ; k += BASE) {
      if (index >= input.length) return null;
      const digit = digitOf(input.charCodeAt(index++));
      if (digit >= BASE || digit > Math.floor((MAX_INT - i) / weight)) return null;
      i += digit * weight;
      const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias;
      if (digit < t) break;
      if (weight > Math.floor(MAX_INT / (BASE - t))) return null;
      weight *= BASE - t;
    }
    const length = output.length + 1;
    bias = adapt(i - old, length, old === 0);
    if (Math.floor(i / length) > MAX_INT - n) return null;
    n += Math.floor(i / length);
    i %= length;
    if (n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) return null;
    output.splice(i++, 0, n);
  }

  return String.fromCodePoint(...output);
}

export function toUnicodeHost(host) {
  if (typeof host !== 'string' || !/xn--/i.test(host)) return host;
  return host
    .split('.')
    .map((label) => {
      if (!/^xn--/i.test(label)) return label;
      const decoded = decodePunycode(label.slice(4));
      return decoded === null || decoded === '' ? label : decoded;
    })
    .join('.');
}

export function toAsciiHost(host) {
  if (typeof host !== 'string' || !host) return null;
  if (host.startsWith('[')) return host.toLowerCase();
  try {
    const ascii = new URL(`http://${host}`).hostname;
    return ascii || null;
  } catch {
    return null;
  }
}

export function hostForms(host) {
  const ascii = toAsciiHost(host);
  if (!ascii) return { ascii: null, unicode: host, international: false };
  const unicode = toUnicodeHost(ascii);
  return { ascii, unicode, international: ascii !== unicode };
}

export function hostnameIn(text) {
  const value = text.trim();
  if (!value || /\s/.test(value)) return null;
  let host = value;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    try {
      host = new URL(value).hostname;
    } catch {
      return null;
    }
  } else if (/[/?#@:]/.test(value)) {
    return null;
  }
  const forms = hostForms(host);
  return forms.ascii && forms.international ? forms : null;
}

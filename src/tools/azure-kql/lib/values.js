const fail = (message) => ({ ok: false, message });
const pass = (parsed) => ({ ok: true, parsed });

const MAX_TEXT = 2000;
const MAX_LIST = 50;

export function parseIPv4(text) {
  const parts = text.split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return null;
  return parts.every((part) => Number(part) <= 255) ? parts.map(Number).join('.') : null;
}

export function parseIPv6(text) {
  if (!text.includes(':') || !/^[0-9a-fA-F:.]+$/.test(text)) return null;
  try {
    return new URL(`http://[${text}]`).hostname.slice(1, -1);
  } catch {
    return null;
  }
}

export function parseAddress(raw) {
  const text = String(raw).trim();
  if (!text) return { ok: false, empty: true };
  const [address, prefix, extra] = text.split('/');
  if (extra !== undefined) return fail(`${text} has more than one "/".`);

  const v4 = parseIPv4(address);
  const v6 = v4 ? null : parseIPv6(address);
  if (!v4 && !v6) {
    return /^\d+\.\d+\.\d+\.\d+$/.test(address)
      ? fail(`${address} is not an IPv4 address: each part must be 0 to 255.`)
      : fail(`${address} is not an IPv4 or IPv6 address.`);
  }

  const family = v4 ? 4 : 6;
  const max = v4 ? 32 : 128;
  if (prefix === undefined) return pass({ family, address: v4 ?? v6, prefix: null });
  if (!/^\d{1,3}$/.test(prefix) || Number(prefix) > max) {
    return fail(`/${prefix} is not a prefix length for IPv${family}: use 0 to ${max}.`);
  }
  return pass({ family, address: v4 ?? v6, prefix: Number(prefix) });
}

export function parseInteger(raw, { min = -Number.MAX_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, noun = 'value' } = {}) {
  const text = String(raw).trim();
  if (!text) return { ok: false, empty: true };
  if (!/^-?\d+$/.test(text)) return fail(`Use a whole number for the ${noun}.`);
  const number = Number(text);
  if (number < min || number > max) return fail(`The ${noun} must be from ${min} to ${max}.`);
  return pass(number);
}

export function parseReal(raw) {
  const text = String(raw).trim();
  if (!text) return { ok: false, empty: true };
  if (!/^-?\d+(\.\d+)?$/.test(text)) return fail('Use a number, such as 2 or 0.5.');
  return pass(Number(text));
}

export function parseText(raw) {
  const text = String(raw);
  if (!text.trim()) return { ok: false, empty: true };
  if (text.length > MAX_TEXT) return fail(`Keep the value under ${MAX_TEXT} characters.`);
  return pass(text.trim());
}

export function parseRegex(raw) {
  const text = parseText(raw);
  if (!text.ok) return text;
  if (/\(\?<?[=!]/.test(text.parsed) || /\\[1-9]/.test(text.parsed)) {
    return fail('Kusto uses RE2, which has no lookaround or backreferences.');
  }
  try {
    new RegExp(text.parsed);
  } catch {
    return fail('That is not a valid regular expression.');
  }
  return text;
}

export function parseDatetime(raw) {
  const text = String(raw).trim();
  if (!text) return { ok: false, empty: true };
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?Z?)?$/);
  if (!match) return fail('Use a UTC date and time such as 2026-11-14T09:30.');
  const [, year, month, day, hour = '00', minute = '00', second = '00'] = match;
  const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
  const time = Date.parse(iso);
  if (Number.isNaN(time) || new Date(time).toISOString().slice(0, 19) + 'Z' !== iso) {
    return fail(`${text} is not a real date and time.`);
  }
  return pass(iso);
}

export function parseEnum(raw, values) {
  const text = String(raw).trim();
  if (!text) return { ok: false, empty: true };
  const match = values.find((value) => value.toLowerCase() === text.toLowerCase());
  return match ? pass(match) : fail(`${text} is not one of: ${values.join(', ')}.`);
}

export function splitList(raw) {
  return String(raw)
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseList(raw, parseItem) {
  const items = splitList(raw);
  if (items.length === 0) return { ok: false, empty: true };
  if (items.length > MAX_LIST) return fail(`A list takes at most ${MAX_LIST} values.`);
  const parsed = [];
  for (const item of items) {
    const result = parseItem(item);
    if (!result.ok) return fail(result.message ?? `${item} is not usable here.`);
    parsed.push(result.parsed);
  }
  return pass(parsed);
}

export function parseRange(from, to, parseItem) {
  const low = parseItem(from);
  const high = parseItem(to);
  if (low.empty || high.empty) return low.empty && high.empty ? { ok: false, empty: true } : fail('A range needs both ends.');
  if (!low.ok) return low;
  if (!high.ok) return high;
  if (low.parsed > high.parsed) return fail('The first value must not be larger than the second.');
  return pass([low.parsed, high.parsed]);
}

export const MAX_TEXT = 100000;
export const MAX_MATCHES = 2000;
export const TIMEOUT_MS = 1000;

export const FLAGS = [
  { id: 'g', name: 'global', hint: 'Find every match instead of stopping at the first.' },
  { id: 'i', name: 'ignore case', hint: 'Letters match in either case.' },
  { id: 'm', name: 'multiline', hint: '^ and $ also match at the start and end of each line.' },
  { id: 's', name: 'dot all', hint: 'A dot also matches a line break.' },
  { id: 'u', name: 'unicode', hint: 'Read the pattern as code points and allow \\p{…}. Cannot be combined with v.' },
  { id: 'v', name: 'unicode sets', hint: 'As u, plus set operations in classes. Cannot be combined with u.' },
  { id: 'y', name: 'sticky', hint: 'Match only at the current position, with no searching ahead.' },
];

const ORDER = FLAGS.map((flag) => flag.id).join('');

export function normaliseFlags(flags) {
  const wanted = new Set(String(flags ?? ''));
  return [...ORDER].filter((flag) => wanted.has(flag)).join('');
}

export function toggleFlag(flags, flag) {
  const current = new Set(normaliseFlags(flags));
  if (current.has(flag)) current.delete(flag);
  else {
    current.add(flag);
    if (flag === 'u') current.delete('v');
    if (flag === 'v') current.delete('u');
  }
  return normaliseFlags([...current].join(''));
}

export function captureGroups(source, nestedClasses = false) {
  const groups = [];
  let depth = 0;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '\\') {
      i += 1;
    } else if (depth > 0) {
      if (char === ']') depth -= 1;
      else if (char === '[' && nestedClasses) depth += 1;
    } else if (char === '[') {
      depth = 1;
    } else if (char === '(') {
      if (source[i + 1] !== '?') groups.push(null);
      else {
        const named = /^\(\?<(?![=!])([^>]+)>/.exec(source.slice(i));
        if (named) groups.push(named[1]);
      }
    }
  }
  return groups;
}

function reason(message) {
  const text = String(message ?? 'The pattern is not valid.');
  const v8 = /^Invalid regular expression: \/[\s\S]*\/[a-z]*: ([\s\S]+)$/.exec(text);
  const rest = v8 ? v8[1] : text.replace(/^Invalid regular expression:\s*/, '');
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

function compile(pattern, flags) {
  try {
    return { regex: new RegExp(pattern, flags) };
  } catch (error) {
    return { error: reason(error.message) };
  }
}

function compileWithIndices(pattern, flags) {
  try {
    return { regex: new RegExp(pattern, `${flags}d`) };
  } catch {
    return compile(pattern, flags);
  }
}

function step(text, index, byCodePoint) {
  if (!byCodePoint) return index + 1;
  const code = text.codePointAt(index);
  return index + (code !== undefined && code > 0xffff ? 2 : 1);
}

function toMatch(found, names) {
  const groups = [];
  for (let i = 1; i < found.length; i++) {
    const range = found.indices?.[i];
    groups.push({
      number: i,
      name: names?.[i - 1] ?? null,
      value: found[i] ?? null,
      start: range ? range[0] : null,
      end: range ? range[1] : null,
    });
  }
  return { index: found.index, end: found.index + found[0].length, value: found[0], groups };
}

export function runRegex({ pattern = '', flags = '', text = '', replacement = null } = {}) {
  const used = normaliseFlags(flags);
  if (pattern === '') return { ok: true, empty: true, flags: used, matches: [], total: 0, truncated: false, groups: [], replaced: null };
  if (text.length > MAX_TEXT) {
    return { ok: false, error: `The test text is ${text.length.toLocaleString('en-GB')} characters. The limit is ${MAX_TEXT.toLocaleString('en-GB')}.` };
  }

  const plain = compile(pattern, used);
  if (plain.error) return { ok: false, error: plain.error, flags: used };
  const { regex } = compileWithIndices(pattern, used);

  const scanned = captureGroups(pattern, used.includes('v'));
  const matches = [];
  let total = 0;
  let names = null;
  const record = (found) => {
    if (names === null) names = scanned.length === found.length - 1 ? scanned : [];
    total += 1;
    if (matches.length < MAX_MATCHES) matches.push(toMatch(found, names));
  };

  regex.lastIndex = 0;
  if (regex.global) {
    const byCodePoint = regex.unicode || used.includes('v');
    let found;
    while ((found = regex.exec(text)) !== null) {
      record(found);
      if (found[0] === '') regex.lastIndex = step(text, regex.lastIndex, byCodePoint);
      if (regex.lastIndex > text.length) break;
    }
  } else {
    const found = regex.exec(text);
    if (found) record(found);
  }

  const groupCount = matches[0]?.groups.length ?? new RegExp(`${pattern}|`, used).exec('').length - 1;
  const groups = Array.from({ length: groupCount }, (_, i) => ({
    number: i + 1,
    name: scanned.length === groupCount ? scanned[i] : null,
  }));

  return {
    ok: true,
    flags: used,
    matches,
    total,
    truncated: total > matches.length,
    groups,
    replaced: replacement === null ? null : text.replace(plain.regex, replacement),
  };
}

export function segments(text, matches) {
  const out = [];
  let cursor = 0;
  let shown = 0;
  for (const match of matches) {
    if (match.end <= match.index || match.index < cursor) continue;
    if (match.index > cursor) out.push({ text: text.slice(cursor, match.index), match: null });
    out.push({ text: text.slice(match.index, match.end), match: shown });
    shown += 1;
    cursor = match.end;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), match: null });
  return out;
}

export function describeResult(result) {
  if (!result || !result.ok || result.empty) return '';
  if (result.total === 0) return 'No match.';
  const count = result.total === 1 ? '1 match' : `${result.total.toLocaleString('en-GB')} matches`;
  const empty = result.matches.filter((match) => match.end === match.index).length;
  const notes = [];
  if (empty > 0) notes.push(empty === result.matches.length ? 'all empty, so there is nothing to highlight' : `${empty} of them empty`);
  if (result.truncated) notes.push(`the first ${result.matches.length.toLocaleString('en-GB')} are listed`);
  if (!result.flags.includes('g') && result.total === 1) notes.push('without the g flag the search stops at the first');
  return notes.length > 0 ? `${count}: ${notes.join('; ')}.` : `${count}.`;
}

import { diffIds } from './myers.js';

export const MAX_CHARS = 1000000;
export const MAX_LINES = 20000;
const MAX_TOKENS = 4000;
const TOKEN = /\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu;

const number = (value) => value.toLocaleString('en-GB');

export function splitLines(text) {
  if (text === '') return { lines: [], eol: true, crlf: false };
  const lines = text.split(/\r\n|\n|\r/);
  const eol = lines[lines.length - 1] === '';
  if (eol) lines.pop();
  return { lines, eol, crlf: /\r\n/.test(text) };
}

function keyOf(line, { ignoreWhitespace, ignoreCase }) {
  let key = line;
  if (ignoreWhitespace) key = key.trim().replace(/\s+/g, ' ');
  if (ignoreCase) key = key.toLowerCase();
  return key;
}

function intern(side, options, table) {
  const { lines } = side;
  const ids = new Int32Array(lines.length);
  const open = !side.eol && !options.ignoreWhitespace ? lines.length - 1 : -1;
  for (let i = 0; i < lines.length; i++) {
    const key = i === open ? `${keyOf(lines[i], options)}\n` : keyOf(lines[i], options);
    let id = table.get(key);
    if (id === undefined) {
      id = table.size;
      table.set(key, id);
    }
    ids[i] = id;
  }
  return ids;
}

function merge(parts) {
  const out = [];
  for (const part of parts) {
    const last = out[out.length - 1];
    if (last && last.changed === part.changed) last.text += part.text;
    else out.push({ ...part });
  }
  return out;
}

export function intraLine(left, right, options = {}) {
  const a = left.match(TOKEN) ?? [];
  const b = right.match(TOKEN) ?? [];
  if (a.length === 0 || b.length === 0 || a.length > MAX_TOKENS || b.length > MAX_TOKENS) return null;

  const blank = (token) => /^\s+$/.test(token);
  const tokenKey = (token) => {
    if (options.ignoreWhitespace && blank(token)) return ' ';
    return options.ignoreCase ? token.toLowerCase() : token;
  };
  const table = new Map();
  const ids = (tokens) =>
    Int32Array.from(tokens, (token) => {
      const key = tokenKey(token);
      if (!table.has(key)) table.set(key, table.size);
      return table.get(key);
    });

  const { blocks } = diffIds(ids(a), ids(b), 400);
  let shared = 0;
  for (const block of blocks) {
    if (!block.equal) continue;
    for (let i = block.aStart; i < block.aEnd; i++) if (!blank(a[i])) shared += a[i].length;
  }
  const solid = (tokens) => tokens.reduce((sum, token) => sum + (blank(token) ? 0 : token.length), 0);
  const longest = Math.max(solid(a), solid(b));
  if (longest > 0 && shared / longest < 0.3) return null;

  const mark = (token) => !(options.ignoreWhitespace && blank(token));
  const leftParts = [];
  const rightParts = [];
  for (const block of blocks) {
    for (let i = block.aStart; i < block.aEnd; i++) leftParts.push({ text: a[i], changed: !block.equal && mark(a[i]) });
    for (let j = block.bStart; j < block.bEnd; j++) rightParts.push({ text: b[j], changed: !block.equal && mark(b[j]) });
  }
  return { left: merge(leftParts), right: merge(rightParts), score: longest > 0 ? shared / longest : 0 };
}

const PAIR_LIMIT = 400;

function pairLines(removed, added, options) {
  const k = removed.length;
  const m = added.length;
  const order = [];

  if (k * m > PAIR_LIMIT) {
    for (let i = 0; i < Math.max(k, m); i++) {
      const cell = i < k && i < m ? intraLine(removed[i].text, added[i].text, options) : null;
      order.push({ r: i < k ? i : null, a: i < m ? i : null, cell });
    }
  } else {
    const cells = removed.map((line) => added.map((other) => intraLine(line.text, other.text, options)));
    const best = Array.from({ length: k + 1 }, () => new Float64Array(m + 1));
    for (let i = k - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        const paired = cells[i][j] ? cells[i][j].score + 0.001 + best[i + 1][j + 1] : -1;
        best[i][j] = Math.max(paired, best[i + 1][j], best[i][j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < k && j < m) {
      const cell = cells[i][j];
      if (cell && best[i][j] === cell.score + 0.001 + best[i + 1][j + 1]) order.push({ r: i++, a: j++, cell });
      else if (best[i][j] === best[i + 1][j]) order.push({ r: i++, a: null, cell: null });
      else order.push({ r: null, a: j++, cell: null });
    }
    while (i < k) order.push({ r: i++, a: null, cell: null });
    while (j < m) order.push({ r: null, a: j++, cell: null });
  }

  const pairs = [];
  let loneRemoved = [];
  let loneAdded = [];
  const flush = () => {
    for (let t = 0; t < Math.max(loneRemoved.length, loneAdded.length); t++) {
      pairs.push({ removed: loneRemoved[t] ?? null, added: loneAdded[t] ?? null });
    }
    loneRemoved = [];
    loneAdded = [];
  };
  for (const { r, a, cell } of order) {
    if (r !== null && a !== null && cell) {
      flush();
      removed[r].parts = cell.left;
      added[a].parts = cell.right;
      pairs.push({ removed: removed[r], added: added[a] });
    } else {
      if (r !== null) loneRemoved.push(removed[r]);
      if (a !== null) loneAdded.push(added[a]);
    }
  }
  flush();
  return pairs;
}

export function diffText(leftText, rightText, options = {}) {
  for (const [name, text] of [['original', leftText], ['changed', rightText]]) {
    if (text.length > MAX_CHARS) {
      return {
        ok: false,
        error: `The ${name} text is ${number(text.length)} characters. The limit is ${number(MAX_CHARS)} a side, so nothing was compared.`,
      };
    }
  }
  const left = splitLines(leftText);
  const right = splitLines(rightText);
  for (const [name, side] of [['original', left], ['changed', right]]) {
    if (side.lines.length > MAX_LINES) {
      return {
        ok: false,
        error: `The ${name} text has ${number(side.lines.length)} lines. The limit is ${number(MAX_LINES)} a side, so nothing was compared.`,
      };
    }
  }

  const table = new Map();
  const a = intern(left, options, table);
  const b = intern(right, options, table);
  const { blocks: ranges, approximate } = diffIds(a, b);

  const strict = !options.ignoreWhitespace;
  const eolDiffers = left.eol !== right.eol && strict && left.lines.length > 0 && right.lines.length > 0;
  const lastLeft = left.lines.length - 1;
  const lastRight = right.lines.length - 1;

  const blocks = [];
  let additions = 0;
  let deletions = 0;
  const removedLine = (l) => ({ l: l + 1, text: left.lines[l], parts: null, noEol: !left.eol && l === lastLeft, eolNote: false });
  const addedLine = (r) => ({ r: r + 1, text: right.lines[r], parts: null, noEol: !right.eol && r === lastRight, eolNote: false });

  for (const range of ranges) {
    if (range.equal) {
      const lines = [];
      for (let i = 0; i < range.aEnd - range.aStart; i++) {
        const l = range.aStart + i;
        const r = range.bStart + i;
        lines.push({ l: l + 1, r: r + 1, left: left.lines[l], right: right.lines[r] });
      }
      blocks.push({ type: 'equal', lines });
      continue;
    }
    const removed = [];
    const added = [];
    for (let l = range.aStart; l < range.aEnd; l++) removed.push(removedLine(l));
    for (let r = range.bStart; r < range.bEnd; r++) added.push(addedLine(r));
    const pairs = pairLines(removed, added, options);
    if (strict) {
      const twin = (line, others) => others.some((other) => other.text === line.text && other.noEol !== line.noEol);
      for (const line of removed) line.eolNote = line.noEol && (eolDiffers || twin(line, added));
      for (const line of added) line.eolNote = line.noEol && (eolDiffers || twin(line, removed));
    }
    deletions += removed.length;
    additions += added.length;
    blocks.push({ type: 'change', removed, added, pairs });
  }

  return {
    ok: true,
    blocks,
    additions,
    deletions,
    identical: additions === 0 && deletions === 0,
    approximate,
    eolDiffers,
    left: { count: left.lines.length, eol: left.eol, crlf: left.crlf },
    right: { count: right.lines.length, eol: right.eol, crlf: right.crlf },
  };
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys(value[key])])
    );
  }
  return value;
}

export function normaliseJson(text) {
  try {
    const value = JSON.parse(text);
    if (value === null || typeof value !== 'object') return null;
    return `${JSON.stringify(sortKeys(value), null, 2)}\n`;
  } catch {
    return null;
  }
}

export function bothJson(left, right) {
  const looks = (text) => /^\s*[[{]/.test(text);
  return looks(left) && looks(right) && normaliseJson(left) !== null && normaliseJson(right) !== null;
}

export function prepare(left, right, options = {}) {
  if (!options.normaliseJson) return { left, right, normalised: false };
  const a = normaliseJson(left);
  const b = normaliseJson(right);
  return a !== null && b !== null ? { left: a, right: b, normalised: true } : { left, right, normalised: false };
}
